---
name: bfsi-onboarding
description: Onboards a new developer to a Rsense BFSI project. Explains the project structure, key conventions, how features are organised, where security primitives live, and how the Claude toolkit assists day-to-day work. Use when the user is new to the codebase and asks "how does this project work", "where do I start", "give me an overview", "what's the architecture", or "how do I add a feature".
---

# BFSI Project Onboarding

You are explaining a Rsense BFSI React project to a developer who is new to it. Be concise but thorough. Adapt depth based on their background (ask once if unclear: "Are you new to React, or new to this specific BFSI starter?").

## The project at a glance

This project was scaffolded from `@rsense/bfsi-react-starter`. It's a **Vite + React + TypeScript SPA** with security, audit, and compliance primitives wired in by default.

Stack:
- **React 18** + **Vite 5** + **TypeScript strict**
- **Tailwind CSS** + **shadcn/ui** (components owned in `src/components/ui/`)
- **React Hook Form** + **Zod** for forms
- **RTK Query** OR **TanStack Query** for data fetching (check `package.json`)
- **react-router-dom v6** with `<ProtectedRoute>` + `<CanAccess>` guards
- **react-i18next** for i18n (en + hi default)
- **Vitest** + **Testing Library** + **Playwright**

## Where things live

```
src/
├── app/                    # App.tsx, providers, root layout
├── features/<Feature>/     # ALL feature code lives here (api, containers, components, tests)
├── routes/                 # Route config, ProtectedRoute, CanAccess
├── shared/                 # Cross-feature components (ErrorBoundary, NotFound)
├── i18n/                   # react-i18next setup + translations
├── env.ts                  # Zod-validated env vars
└── main.tsx                # Entry point
```

Security & audit primitives come from npm packages:
- `@rsense/bfsi-core` — encryption, PII utils, audit client, axios factory, auth helpers
- `@rsense/bfsi-ui` — Tailwind + shadcn + BFSI compositions (PIIMaskedDisplay, ConfirmModal, etc.)

## Day-to-day workflows

### Adding a new feature
Use `/bfsi-feature MyFeature` — generates the full directory.

### Adding an endpoint
Use `/bfsi-api-endpoint GET /my-resource --feature MyFeature` — adds typed endpoint with audit.

### Adding a form
Use `/bfsi-form MyForm --fields "pan:string,amount:number"` — generates RHF + Zod form with BFSI defaults.

### Masking a PII field in display
Use `/bfsi-pii-field pan user.pan` — wraps with `<PIIMaskedDisplay>`.

### Before a PR
Run `/bfsi-compliance-check` — runs OWASP + RBI + PCI checklist over the diff.
Optionally run `/bfsi-review` — spawns full multi-agent review.

### Committing
Use `/bfsi-commit` — generates audit-friendly Conventional Commits message.

## Critical conventions

1. **Container-component split**: containers hold side-effects (API, audit), components are pure JSX.
2. **All API responses are Zod-parsed**: runtime safety. Never trust the network shape.
3. **All mutations are audited**: use `useAuditedMutation` (RTK) or wrap with `useAuditedAction` (TanStack).
4. **All routes are protected**: `<ProtectedRoute permission="...">`. Defaults to authenticated-only if `permission` omitted, but explicit is better.
5. **PII never enters localStorage**: use `secureStorage` from `@rsense/bfsi-core/storage` (memory-first, sessionStorage fallback, encrypted IndexedDB option).
6. **No card data in HTML inputs**: use `<PCITokenizedCardInput>` from `@rsense/bfsi-ui`.
7. **No `any` types**: types flow from Zod schemas.
8. **All user-facing strings via `t()`**: never inline. Even error messages.
9. **Conventional Commits with BFSI types**: see `/bfsi-commit`. `security` and `compliance` are extra types beyond standard set.

## The Claude toolkit

The `.claude/` directory in this project enables a plugin called `bfsi-claude-toolkit`. Run `/hooks` to see registered hooks (file protection, secret scanner, formatter, PII scanner, etc.). Run `/plugin` to see the toolkit. Run `/bfsi-doctor` to verify everything's wired up.

Hooks may block you from:
- Editing `.env*`, `*.pem`, `credentials.json`, `.git/` files
- Running `rm -rf`, `git push --force` on protected branches
- Writing files that contain secret patterns (API keys, tokens)
- Writing files that introduce PII patterns into logs

These are not personal — they protect every dev from a class of mistake that's expensive in BFSI.

## Getting unstuck

- Architecture questions → ask `bfsi-architect` agent (`@bfsi-architect how should I structure ...`)
- Security questions → ask `bfsi-security-reviewer`
- Performance questions → ask `bfsi-performance-reviewer`
- Test patterns → look at `bfsi-test-pattern` reference skill (it'll auto-load when you ask)
- Stuck on an error → look at `bfsi-error-message` reference skill

## What NOT to do (common pitfalls)

- ❌ Don't bypass `useAuditedMutation` — every state change is auditable.
- ❌ Don't put PII in URL search params.
- ❌ Don't trust client-side permission checks alone — backend re-checks every API call.
- ❌ Don't use `localStorage` for tokens. Use the auth module's storage strategy.
- ❌ Don't use `dangerouslySetInnerHTML` without sanitisation.
- ❌ Don't write your own crypto — use `@rsense/bfsi-core/encryption`.
- ❌ Don't commit to `main` directly — always via PR.
