# @scope/react-starter

Canonical React starter for **BFSI** (Banking / Financial Services / Insurance) projects at Your Org.

Every new BFSI app scaffolds from this. It bakes in the security, auth, audit, encryption, accessibility, and Claude Code companion tooling that every project needs — so you don't re-decide them.

---

## What you get

Run one command and you have a production-ready React app with:

- **React 18 + Vite 5 + TypeScript (strict)** — fast dev loop, modern bundling
- **Tailwind CSS + shadcn/ui** — accessible primitives, components owned in-repo
- **React Hook Form + Zod** — type-inferred forms with runtime validation
- **Choice of state-mgmt**: RTK Query _or_ TanStack Query — pick at scaffold time
- **Backend-agnostic REST** — configurable axios interceptors, no Rails assumptions
- **BFSI security primitives** — encryption (Web Crypto), PII masking, audit logging, secure storage, idle timeout, cross-tab session sync, CSP, safe error boundaries
- **Accessibility** — eslint-plugin-jsx-a11y, axe-core dev hook, WCAG 2.1 AA target
- **i18n** — react-i18next, INR-aware currency, IST timezone formatters
- **Testing** — Vitest + Testing Library + Playwright
- **CI/CD** — GitHub Actions: typecheck → lint → test → build → npm audit → gitleaks → preview
- **Claude Code companion** — 15 skills, 10 agents, 12 hooks, 4 commands pre-installed via `.claude/`

---

## Quick start (using the starter)

```bash
npx @scope/create-app my-bank-app
```

Interactive prompts:

```
? Project name › my-bank-app
? State management › RTK Query / TanStack Query
? Sample features › Login, Dashboard, KYC, Transactions
? Initialise git + install deps › Yes
```

Then:

```bash
cd my-bank-app
pnpm dev          # http://localhost:5173
claude            # Claude Code session, with BFSI toolkit auto-enabled
```

---

## Repo layout (this monorepo)

```
@scope/react-starter/
├── docs/                              Docusaurus site (getting started, compliance)
├── packages/
│   ├── cli/                           @scope/create-app — the npx command
│   ├── core/                          @scope/core — security/auth/audit/encryption/utils
│   ├── ui/                            @scope/ui — Tailwind + shadcn + BFSI components
│   └── claude-toolkit/                @scope/toolkit — Claude Code plugin
├── templates/
│   ├── _shared/                       common to both variants
│   ├── rtk-query/                     RTK Query overlay
│   └── tanstack-query/                TanStack Query overlay
├── pnpm-workspace.yaml                version catalog (all pinned)
├── turbo.json                         build pipeline
└── tsconfig.base.json                 strict TS base
```

---

## Working in the monorepo

```bash
pnpm install              # install all workspaces

pnpm build                # turbo build all packages
pnpm dev                  # turbo dev (parallel watch)
pnpm lint                 # eslint across all
pnpm test                 # vitest across all
pnpm typecheck            # tsc --noEmit across all
pnpm format               # prettier write

# Run a script in one package
pnpm --filter @scope/core build
pnpm --filter @scope/toolkit lint
```

---

## Compliance scope (v1)

This starter targets, as MUST-HAVE in v1:

- **RBI cyber resilience + data localisation** (Indian Banking)
- **PCI-DSS frontend hints** (no card data in frontend, tokenisation patterns)
- **IRDAI patterns** (document upload security, e-sig, policy masking)
- **SOC2 / ISO 27001** baseline (audit, encryption, access control)

See [`docs/compliance.md`](./docs/compliance.md) for the full checklist mapping.

---

## Claude Code companion

Every scaffolded project ships with `@scope/toolkit` enabled — a Claude Code plugin containing:

| Component | Count | Examples                                                                 |
| --------- | ----- | ------------------------------------------------------------------------ |
| Skills    | 15    | `bfsi-feature`, `bfsi-form`, `bfsi-pii-field`, `bfsi-compliance-check`   |
| Agents    | 10    | `bfsi-security-reviewer`, `bfsi-architect`, `bfsi-accessibility-auditor` |
| Hooks     | 12    | secret scanner, PII scanner, format on save, force-push guard            |
| Commands  | 4     | `/bfsi-review`, `/bfsi-scaffold`, `/bfsi-audit`, `/bfsi-doctor`          |

All follow the official [Claude Code spec](https://code.claude.com/docs/) — kebab-case skill folders, exact `SKILL.md` filename, YAML frontmatter with WHAT + WHEN descriptions, progressive disclosure, exit-code 2 to block, `${CLAUDE_PLUGIN_ROOT}` path resolution.

See [`packages/claude-toolkit/README.md`](./packages/claude-toolkit/README.md) for the full list and design notes.

---

## Status

🚧 **Phase 0 — Scaffolding.** Monorepo skeleton, Claude toolkit (initial skills/agents/hooks), and a partial `packages/core` are in place. See [the plan](#) for the phased rollout. Templates, CLI, and full `packages/ui` are stubbed and will be filled in over Phases 1–5.

---

## Contributing

Internal-only. PRs go through `bfsi-pr-reviewer` agent + human review. See [`docs/contributing.md`](./docs/contributing.md).

---

## Licence

UNLICENSED — proprietary to Your Org. See [`LICENSE`](./LICENSE).
