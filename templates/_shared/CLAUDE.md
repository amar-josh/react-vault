# CLAUDE.md — `{{projectName}}`

BFSI React project scaffolded from `create-app`. This file is what Claude reads at session start, per the [Claude Code spec](https://code.claude.com/docs/best-practices).

## Stack (so you don't have to read configs)

- **React 18** + **Vite 5** + **TypeScript strict**
- **Tailwind CSS** + **shadcn/ui** (components owned in `src/components/ui/`)
- **React Hook Form** + **Zod** for forms
- **react-router-dom v6** with `<ProtectedRoute permission="...">` guards
- **react-i18next** (`en`, `hi` defaults)
- Data layer: **RTK Query** OR **TanStack Query** — check `package.json` to confirm which
- Tests: **Vitest** + **Testing Library**; E2E **Playwright**

## Bash commands

```bash
pnpm dev                # vite dev server on :5173
pnpm build              # tsc -b && vite build
pnpm test               # vitest run
pnpm test:watch         # vitest watch
pnpm test:e2e           # playwright
pnpm typecheck          # tsc -b --noEmit
pnpm lint               # eslint, --max-warnings 0
pnpm format             # prettier write
```

## Critical conventions (DO NOT violate)

1. **Tokens never in `localStorage`.** Use `setAuthToken(axios, token)` from `@<scope>/core/http` at login — it lives in memory.
2. **All API responses go through Zod `.parse()`.** No raw types. See the `rtk-query-api` or `tanstack-services` skill.
3. **PII fields display via `<PIIMaskedDisplay>`.** Never render PAN/Aadhaar/account-number directly.
4. **No card data in HTML inputs.** Use `<PCITokenizedCardInput>` (v0.2 — for now, flag any plain card input).
5. **All routes are `<ProtectedRoute permission="...">`** with explicit permission strings (route to feature-permission mapping in `src/routes/`).
6. **No `dangerouslySetInnerHTML`** unless explicitly sanitised. Pre-write hook will block it.
7. **No `console.log` of PII variables** (PAN, Aadhaar, account, password, OTP). Post-write hook scans for this.
8. **Conventional Commits with BFSI types**: `feat`, `fix`, `security`, `compliance`, `audit`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`. NO `Co-Authored-By` trailer.

## Where things live

```
src/
├── app/                    App.tsx, providers, globals.css
├── routes/                 ProtectedRoute, route config
├── features/<Feature>/     ALL feature code: api/schema/types/containers/components/tests
├── shared/                 Cross-feature components (ErrorBoundary, NotFound)
├── i18n/                   react-i18next setup + translations/en.json + hi.json
├── utils/constants/        urls / routes / regex / tag-types / app constants
├── env.ts                  Zod-validated env (throws at boot on bad config)
└── main.tsx                Entry point
```

Variant-specific:

- **RTK Query**: `src/axiosconfig/` (instance + interceptor + baseQuery), `src/redux/` (store + rootReducer + reduxHooks + invalidateCacheMiddleware)
- **TanStack Query**: `src/api/` (axiosInstance + http + queryClient), `src/services/` (typed service methods)

## Claude skills available

Run `/skills` or open `.claude/skills/<name>/SKILL.md` directly. Reference skills auto-load when relevant; action skills are invoked with `/<name>`.

**Always available** (from the toolkit): `/bfsi-feature`, `/bfsi-form`, `/bfsi-pii-field`, `/bfsi-api-endpoint`, `/bfsi-compliance-check`, `/bfsi-commit`, `/bfsi-doctor`, `/bfsi-onboarding`, `/bfsi-review`, `/bfsi-audit`.

**Variant-specific** (in `.claude/skills/`):
- RTK: `axios-auth`, `constants-organization`, `redux-store-integration`, `rtk-query-api`
- TanStack: `axios-auth`, `constants-organization`, `tanstack-services`, `query-client-setup`

## Gotchas

- `.env.local` is gitignored. If app fails at boot with a Zod error, copy `.env.local.sample` → `.env.local` and fill in real values.
- `src/components/ui/` is shadcn-managed. Add components via `pnpm dlx shadcn-ui@latest add <component>` — don't hand-author there.
- The dev server enforces tight security headers (X-Frame-Options: DENY, etc.). If iframe embedding fails in dev, that's why.
- ESLint runs with `--max-warnings 0`. Warnings fail CI; fix them as they appear.

## When something fails

- Type error after `pnpm install` → `pnpm typecheck` to see all errors; the `@<scope>/core` and `@<scope>/ui` paths resolve via `link:` to the local workspace.
- 401 in dev → check `setAuthToken(axiosInstance, token)` is called in the login mutation's `onQueryStarted` (RTK) or `onSuccess` (TanStack).
- `/bfsi-doctor` fails on `.claude/settings.json $schema` → the correct URL is `https://json.schemastore.org/claude-code-settings.json`.
