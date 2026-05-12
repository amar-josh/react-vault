# Getting started

## Prerequisites

- **Node.js** ≥ 20.11.0
- **pnpm** ≥ 9.0.0
- **git** ≥ 2.30
- **Claude Code CLI** ≥ 2.1.0 (optional — for the BFSI toolkit)

## Scaffold a new BFSI project

```bash
npx @rsense/create-bfsi-app my-bank-app
```

Interactive prompts ask for:
1. **Project name** — lowercase + hyphens
2. **State management** — RTK Query (recommended for complex apps) or TanStack Query (lighter)
3. **Install dependencies?** — runs `pnpm install`
4. **Initialise git?** — runs `git init` + first commit

After scaffold:

```bash
cd my-bank-app
pnpm dev          # http://localhost:5173
claude            # Claude Code, BFSI toolkit auto-enabled
```

## Verify the setup

In Claude Code, run:

```
/bfsi-doctor
```

This runs ~20 checks: Node version, dep versions, .claude config, hook registration, BFSI conventions, security baseline. Address any ❌ before going further.

## First feature

```
/bfsi-feature KycVerification
```

Generates `src/features/KycVerification/` with the full structure (api, schema, types, constants, routes, containers, components, hooks, tests, i18n keys). PII fields are auto-wrapped with `<PIIMaskedDisplay>`.

Run `pnpm typecheck` then visit `/kyc-verification` to see the empty list.

## What the boilerplate gives you

- **React 18 + Vite 5 + TS strict** — fast dev loop, modern bundling
- **Tailwind + shadcn/ui** — accessible components owned in `src/components/ui/` after running `pnpm dlx shadcn-ui@latest add <component>`
- **React Hook Form + Zod** — type-inferred forms
- **react-router-dom v6** with `<ProtectedRoute>` + `<CanAccess>`
- **react-i18next** with en + hi defaults
- **Zod-validated env** — app fails at boot if `.env` is wrong
- **BFSI error boundary** — never leaks stack traces
- **Strict CSP-friendly Vite config** — security headers on dev too
- **CI workflow** — typecheck, lint, test, build, audit, gitleaks
- **Husky + commitlint** — Conventional Commits with BFSI types (`security:`, `compliance:`, `audit:`)

## Working in the monorepo

This starter itself is a pnpm + Turborepo monorepo:

```bash
git clone <starter-repo>
cd bfsi-react-starter
pnpm install
pnpm build      # turbo build all packages
pnpm test       # turbo test all packages
pnpm lint       # turbo lint
```

To work on the CLI / core / UI:

```bash
pnpm --filter @rsense/bfsi-core test:watch
pnpm --filter @rsense/bfsi-ui dev
pnpm --filter @rsense/create-bfsi-app dev
```

## What's next

- Read [`architecture.md`](./architecture.md) for the deeper why
- Read [`compliance.md`](./compliance.md) for the regulatory-control mapping
- Read [`skills-cookbook.md`](./skills-cookbook.md) for day-to-day Claude Code usage
- Read [`packages/claude-toolkit/README.md`](../packages/claude-toolkit/README.md) for the full toolkit reference
