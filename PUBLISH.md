# Publishing to npm

The starter ships **three** packages to npm. `@react-vault/toolkit` is NOT published — it's bundled into `@react-vault/create-app` and copied into scaffolded projects' `.claude/` at scaffold time.

| Package                   | Purpose                                             | Published?                       |
| ------------------------- | --------------------------------------------------- | -------------------------------- |
| `@react-vault/core`       | Security primitives (encryption, PII, audit, axios) | ✅                               |
| `@react-vault/ui`         | Tailwind + shadcn + BFSI components                 | ✅ (depends on core)             |
| `@react-vault/create-app` | CLI scaffolder                                      | ✅ (bundles templates + toolkit) |
| `@react-vault/toolkit`    | Claude Code plugin (skills/agents/hooks)            | ❌ (bundled into create-app)     |

## Prerequisites (one-time)

1. **npm account** with access to the `@react-vault` org. Logged in via `npm login`.

   ```bash
   npm whoami         # expect: kulkarnisamarth (or whoever owns the @react-vault org)
   npm org ls react-vault    # confirm you're a member
   ```

2. **2FA setup on npm** (recommended). If on, you'll need an OTP each publish.

3. **Build tools** present: Node ≥ 20.11, pnpm ≥ 9.

## Pre-flight checks (every release)

```bash
cd /path/to/react-vault
pnpm install
pnpm --filter '@react-vault/core' build
pnpm --filter '@react-vault/core' test
pnpm --filter '@react-vault/ui' build
pnpm --filter '@react-vault/create-app' build
```

All builds must pass. If any package has uncommitted changes, decide whether to commit before publishing — git tags will reference the current commit.

## Version bump

Versions are pinned per package. Bump in dependency order — bump `core` first, then `ui` (which depends on core via `workspace:*` — pnpm auto-resolves at publish), then `create-app`.

For a coordinated bump across all three:

```bash
# Manually edit version in each package.json, OR use:
pnpm --filter '@react-vault/core' version patch          # 0.1.0 → 0.1.1
pnpm --filter '@react-vault/ui' version patch
pnpm --filter '@react-vault/create-app' version patch

# Commit + tag
git commit -am "chore: release v0.1.1"
git tag v0.1.1
```

## Publish order

**Order matters** — `@react-vault/ui` depends on `@react-vault/core`, and `@react-vault/create-app`'s scaffolded templates depend on both. Publish core first, then ui, then create-app.

```bash
# 1. core
pnpm --filter '@react-vault/core' publish --access public
# OTP prompt if 2FA on

# 2. ui (waits for npm registry to propagate core — usually instant)
pnpm --filter '@react-vault/ui' publish --access public

# 3. create-app (the prepublishOnly script auto-bundles templates + claude-toolkit)
pnpm --filter '@react-vault/create-app' publish --access public
```

Each `publish` runs the package's `prepublishOnly` script:

- `core` / `ui` → `tsc` build
- `create-app` → `pnpm clean && pnpm bundle && pnpm build`
  - `clean` removes any stale bundled dirs
  - `bundle` copies `templates/` + `packages/claude-toolkit/` into `packages/cli/`
  - `build` tsc-compiles the CLI

## Verify after publish

From any directory NOT inside the monorepo:

```bash
cd /tmp
npx @react-vault/create-app smoke-test
# answer prompts; install deps; init git
cd smoke-test
ls .claude/skills/       # bfsi-* + the 4 RTK or TanStack skills
ls node_modules/@react-vault/   # core/, ui/ resolved from npm
pnpm dev                 # vite on :5173
```

If `npx` fails with "command not found" or "package not in registry", wait 30s for propagation and try again with `--prefer-online`:

```bash
npx --prefer-online @react-vault/create-app smoke-test
```

## What ships in each tarball

Confirm before publish using `pnpm pack --dry-run`:

```bash
pnpm --filter '@react-vault/create-app' pack --dry-run
```

Expected for `create-app`:

```
@react-vault/create-app/
├── bin/create-app.js
├── dist/index.js (+ .d.ts, .map)
├── templates/_shared/...
├── templates/rtk-query/...
├── templates/tanstack-query/...
├── claude-toolkit/skills/...
├── claude-toolkit/agents/...
├── claude-toolkit/hooks/...
├── claude-toolkit/commands/...
├── package.json
└── README.md
```

If `templates/` or `claude-toolkit/` is missing from the dry run, the bundle script failed silently. Run `pnpm --filter '@react-vault/create-app' bundle` manually and check `packages/cli/templates/` exists.

## Unpublish (emergencies only)

npm allows unpublish within 72 hours. After that, packages can only be deprecated:

```bash
# Unpublish (only if < 72h since publish):
npm unpublish @react-vault/create-app@0.1.0

# Deprecate (recommended for buggy releases):
npm deprecate @react-vault/create-app@0.1.0 "Broken; use 0.1.1 instead"
```

## Rollback

If a release goes out broken:

1. Deprecate the bad version (above)
2. Fix the bug locally
3. Bump patch version
4. Publish the fix

Don't unpublish — it breaks anyone who's already installed.

## CI / automation (future)

Consider GitHub Actions with `npm publish --provenance` for signed publishes. Skip for now; manual is fine for initial releases.
