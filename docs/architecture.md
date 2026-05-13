# Architecture

The why behind the structure.

## Goals

1. **Codify org-wide BFSI security once, not per-project.** Encryption, audit, PII handling, auth — these are decided once in this starter and inherited by every new project.
2. **Two state-management variants, one source of truth.** RTK Query and TanStack Query share `_shared` template and `@react-vault/core` / `@react-vault/ui` packages. Only the data-layer overlay differs.
3. **Make Claude Code an effective BFSI developer.** Skills, agents, and hooks codify our conventions so Claude follows them by default — not because each dev reminds it.
4. **No reinvention per project.** When a regulation changes (RBI Annexure I updates), we patch `@react-vault/core` once and bump the version in every dependent app.

## Top-level shape

```
react-starter/                  Monorepo: pnpm + Turborepo
├── packages/
│   ├── cli/                         create-app (npx scaffolder)
│   ├── core/                        @react-vault/core: framework-agnostic security
│   ├── ui/                          @react-vault/ui: Tailwind + shadcn + BFSI compositions
│   └── claude-toolkit/              toolkit: Claude Code plugin
└── templates/
    ├── _shared/                     Common files (Vite config, CI, i18n, ErrorBoundary…)
    ├── rtk-query/                   Overlay with @reduxjs/toolkit
    └── tanstack-query/              Overlay with @tanstack/react-query + zustand
```

`packages/*` get published to a package registry. `templates/*` are copied verbatim by the CLI into new projects.

## Why a monorepo

- **Atomic changes** across packages and templates. A new BFSI primitive in `core` + the corresponding skill in `claude-toolkit` + the template change in `_shared` can go in one PR.
- **Version pinning catalog.** `pnpm-workspace.yaml` has the catalog of pinned versions every package + template reads from.
- **Single CI pipeline** with Turborepo caching.

## Why a CLI generator (not GitHub templates)

A GitHub template repo would force us to maintain two near-identical repos for RTK and TanStack variants. A CLI lets us:

- Keep one source of `_shared/` and apply the right overlay at scaffold time
- Add interactive choices (backend adapter, sample features, MFA provider)
- Do post-install steps (`pnpm install`, `git init`, plugin link)

## The Claude toolkit

The toolkit is a Claude Code plugin (per [official spec](https://code.claude.com/docs/plugins)). It bundles:

- **15 skills** — action skills (scaffolders, commit gen, compliance check) and reference skills (onboarding, encryption helper, error message, test pattern) that auto-load when relevant
- **10 agents** — orchestrator (`bfsi-pr-reviewer`) and specialists (security, code, a11y, compliance, PII scan, perf, etc.)
- **12 hooks** — file protection, secret scanner, PII scanner, format/lint, context injection on session start, opt-in prompt audit log
- **4 commands** — `/bfsi-review`, `/bfsi-scaffold`, `/bfsi-audit`, `/bfsi-doctor`

Hooks tighten policy and cannot be loosened by user settings (Claude Code spec: deny rules from a plugin still apply even in `bypassPermissions` mode).

## Data flow for a typical feature

```
User clicks "Submit KYC"
  ↓
Containers/KycForm reads form state (RHF)
  ↓
Container calls useSubmitKycMutation (audit-wrapped)
  ↓
RTK Query OR TanStack Query
  ├─ Axios interceptor injects: Authorization, X-Request-Id, Idempotency-Key
  ├─ Auto snake_case ↔ camelCase if configured
  ↓
POST /api/kyc with body
  ↓
Server processes; returns 201 with resource
  ↓
transformResponse runs Zod parse (rejects malformed responses)
  ↓
invalidatesTags trigger list refetch
  ↓
useAuditedMutation completes the audit event (outcome: success)
  ↓
Toast (i18n'd, no PII)
  ↓
Navigate to /kyc/:id
```

Failure modes:

- Network error → `ApiError({ kind: 'network' })` → safe toast + `data.kyc.submission_failed` audit
- 401 → axios error interceptor clears tokens, fires `onUnauthorized`, redirects to /login
- 422 (validation) → field-level errors → RHF setError
- 5xx → safe toast with ref code → full detail to Sentry (scrubbed)

## Container-component split

**Containers** (`src/features/<Feature>/containers/`) hold side-effects: API calls, audit, navigation, form state. No JSX of their own; they compose presentational components.

**Components** (`src/features/<Feature>/components/`) are pure: receive props, render UI, emit events. No `useFetch`, no `useDispatch`.

This split:

- Makes security review easier (security looks at containers only)
- Makes components testable in isolation
- Allows the same component to render under different containers (customer vs admin)

## Conventions that are NOT compromisable

These are enforced by lint rules, type errors, OR hook scripts:

1. **No `any` in app code.** ESLint rule. Types flow from Zod.
2. **No `dangerouslySetInnerHTML` without sanitisation.** Pattern hook catches at write time.
3. **No `console.log` of PII variables.** PII scanner hook flags after write.
4. **No `localStorage.setItem` with PII or tokens.** PII scanner + code review.
5. **No edits to `.env*`, `*.pem`, `credentials.json`.** Pre-write hook blocks.
6. **No `rm -rf` of non-build paths.** Pre-Bash hook blocks.
7. **No force push to protected branches.** Pre-Bash hook blocks.
8. **All API responses Zod-parsed.** Convention + code-reviewer agent flags.
9. **All mutations use `useAuditedMutation`.** Convention + compliance auditor flags.
10. **All routes `<ProtectedRoute>` with explicit `permission`.** Convention + security reviewer flags.

## Open architectural questions (v0.2+)

- **Backend adapter framework** — Currently REST-only with snake/camel toggle. Future: pluggable adapters for GraphQL, gRPC-web.
- **Persistent IndexedDB encryption.** v0.1 stubs the `persistent` storage tier; v0.2 implements with envelope encryption.
- **Real-time data (WebSocket / SSE).** Not in v0.1. Add when first market-data app needs it.
- **Server Components.** Not in v0.1 (SPA only). Add a Next.js variant when an internal team needs SSR.
