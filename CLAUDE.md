# CLAUDE.md — `@<scope>/react-starter` monorepo

This is the source repo for the React + Vite + TS + Tailwind starter. Scaffolded projects DO NOT see this file — they get `templates/_shared/CLAUDE.md` instead.

## Layout (where each kind of edit goes)

| Goal                                                       | Path                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| Security primitive (encryption, PII, audit, axios factory) | `packages/core/src/<module>/`                                |
| UI component (Tailwind / shadcn / BFSI composition)        | `packages/ui/src/<area>/`                                    |
| Claude skill / agent / hook bundled in every project       | `packages/claude-toolkit/<skills\|agents\|hooks\|commands>/` |
| RTK-variant-only file or skill                             | `templates/rtk-query/...`                                    |
| TanStack-variant-only file or skill                        | `templates/tanstack-query/...`                               |
| File common to both variants                               | `templates/_shared/...`                                      |
| CLI scaffolder behaviour                                   | `packages/cli/src/index.ts`                                  |

## Bash commands you'll use

```bash
pnpm install                                  # all workspaces
pnpm --filter '*core' build                   # build one package
pnpm --filter '*core' test                    # run that package's tests
pnpm --filter '*create-app' build             # rebuild CLI after editing
pnpm --filter '*create-app' build && \
  npx ./packages/cli                          # smoke-test the CLI
```

There's no `pnpm dev` at the root — work inside one package at a time.

## CLI testing loop

When changing the scaffolder behaviour, the loop is:

```bash
pnpm --filter '*create-app' build
rm -rf /tmp/smoke
cd /tmp && npx /home/anonymous/Documents/rsense/bfsi-react-starter/packages/cli
# accept defaults; project name "smoke"
ls /tmp/smoke/.claude/skills/                 # verify expected skills landed
grep -r '@react-vault' /tmp/smoke/src/    # verify scope rewrite (should be 0 hits)
```

## Conventions (different from defaults)

- **Placeholder scope `@react-vault`** is baked into template source files. The CLI replaces it with `@<projectName>` at scaffold time. If you add a new file referencing `@<scope>/core` or `@<scope>/ui`, write `@react-vault/...` — the CLI handles the rest.
- **Templates are NOT pnpm workspaces.** `templates/<x>/package.json` contains placeholders (`{{projectName}}`, `@react-vault/*`) that aren't valid until substituted. Listing them in `pnpm-workspace.yaml` breaks `pnpm install`.
- **Variant overlays overwrite shared.** Files at the same path in `templates/_shared/` and `templates/rtk-query/` mean the variant wins. Don't put RTK-specific stuff in `_shared/`.
- **Skill source on disk** stays as `~/.claude/skills/rsense-*` for the user's existing setup. The 4 RTK skills were vendored into `templates/rtk-query/.claude/skills/` with the prefix stripped — those are the canonical copies for the starter. Don't try to read from `~/.claude/skills/` in CLI code; the starter must be self-contained.
- **Conventional Commits with BFSI types** — see `commitlint.config.cjs`. Extra types: `security`, `compliance`, `audit`. No `Co-Authored-By` trailer.

## Gotchas

- `pnpm-lock.yaml` is in git but is large — don't `cat` it during exploration; use `git diff --stat` or `pnpm ls`.
- The CLI's path resolution assumes `dist/index.js` lives at `<starter>/packages/cli/dist/index.js`. Going up 3 levels lands at the starter root. If you reorganise the CLI's output directory, update `STARTER_ROOT` in `packages/cli/src/index.ts`.
- `templates/_shared/.claude/settings.json` has `$schema: https://json.schemastore.org/claude-code-settings.json` — don't change it; `/doctor` validates against that exact URL.
- The CLI's `inlineToolkitInto()` step copies `packages/claude-toolkit/{skills,agents,commands}/` over what the variant overlay already placed. If you put a skill in BOTH `claude-toolkit/skills/` and a variant overlay, the toolkit copy wins.

## When something fails

- `pnpm install` fails with `ERR_PNPM_SPEC_NOT_SUPPORTED_BY_ANY_RESOLVER` → catalog protocol references a package that doesn't exist. Pin the version directly in the package's `package.json`.
- Husky pre-commit fails with `eslint: ENOENT` → eslint isn't installed at the workspace root. Run `pnpm add -wD eslint <plugins>`.
- Husky commit-msg fails with `commitlint: not found` → same — `pnpm add -wD @commitlint/cli @commitlint/config-conventional` at root.
