# {{projectName}}

BFSI React app scaffolded from `@scope/create-app`.

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:5173
claude            # Claude Code with BFSI toolkit enabled
```

In Claude Code, run `/bfsi-doctor` first to verify everything is wired.

## Project layout

```
src/
├── app/                    App.tsx, providers, globals.css
├── routes/                 Route config, ProtectedRoute, CanAccess
├── features/<Feature>/     One folder per feature (use /bfsi-feature to scaffold)
├── shared/                 Cross-feature components (ErrorBoundary)
├── i18n/                   react-i18next setup + en/hi translations
├── env.ts                  Zod-validated env vars
└── main.tsx                Entry point
```

## Common commands

```bash
pnpm dev                 # dev server (vite)
pnpm build               # production build
pnpm test                # vitest
pnpm test:e2e            # playwright
pnpm typecheck           # tsc --noEmit
pnpm lint                # eslint
pnpm format              # prettier write
```

## Claude Code commands

```
/bfsi-doctor              # health check this project
/bfsi-scaffold feature X  # scaffold a new feature
/bfsi-review              # full PR review (security + a11y + perf + tests)
/bfsi-audit               # compliance audit (RBI / PCI / IRDAI / SOC2)
/bfsi-commit              # generate audit-friendly commit message
```

See `packages/claude-toolkit/README.md` in the starter repo for the full list.
