# @rsense/bfsi-claude-toolkit

A Claude Code plugin that makes Claude **BFSI-aware** for every Rsense BFSI React project. It ships skills for scaffolding, hooks that enforce security policy, agents that review PRs, and commands that orchestrate the lot.

Built per the official [Claude Code spec](https://code.claude.com/docs/) — skill directories in kebab-case, exact `SKILL.md` filename, YAML frontmatter with WHAT + WHEN descriptions, progressive disclosure, `${CLAUDE_PLUGIN_ROOT}` path resolution, exit code 2 to block, JSON for structured hook decisions.

---

## What's inside

```
bfsi-claude-toolkit/
├── plugin.json                  Plugin manifest
├── skills/                      15 skills (action + reference)
│   ├── bfsi-feature/SKILL.md
│   ├── bfsi-form/SKILL.md
│   ├── bfsi-pii-field/SKILL.md
│   ├── bfsi-api-endpoint/SKILL.md
│   ├── bfsi-compliance-check/SKILL.md
│   ├── bfsi-commit/SKILL.md
│   ├── bfsi-onboarding/SKILL.md
│   └── ...
├── agents/                      10 specialised agents
│   ├── bfsi-security-reviewer.md
│   ├── bfsi-architect.md
│   ├── bfsi-code-reviewer.md
│   ├── bfsi-accessibility-auditor.md
│   └── ...
├── hooks/
│   ├── hooks.json               12 hooks
│   └── scripts/                 Hook scripts (bash)
└── commands/                    4 orchestrator commands
    ├── bfsi-review.md
    ├── bfsi-scaffold.md
    ├── bfsi-audit.md
    └── bfsi-doctor.md
```

---

## Skills

| Skill | Style | Purpose |
|---|---|---|
| `bfsi-feature` | action | Scaffold feature module (api + containers + components + routes + tests + i18n) |
| `bfsi-api-endpoint` | action | Add API endpoint — variant-aware (RTK Query OR TanStack) |
| `bfsi-form` | action | RHF + Zod form with BFSI defaults |
| `bfsi-pii-field` | action | Wrap field with `<PIIMaskedDisplay>` + audit |
| `bfsi-protected-route` | action | Add route with `<ProtectedRoute>` + `<CanAccess>` |
| `bfsi-audit-action` | action | Wrap button/action with audit log + MFA slot |
| `bfsi-encrypt-helper` | reference | Web Crypto usage patterns |
| `bfsi-confirm-modal` | action | Confirmation modal with optional MFA |
| `bfsi-data-table` | action | Access-controlled table |
| `bfsi-i18n-key` | action | Add i18n key across locales |
| `bfsi-compliance-check` | action | OWASP + RBI + PCI checklist on diff |
| `bfsi-commit` | action | Audit-friendly Conventional Commits |
| `bfsi-onboarding` | reference | New-dev orientation (auto-loads) |
| `bfsi-test-pattern` | reference | BFSI testing patterns |
| `bfsi-error-message` | reference | Safe error message patterns |

**Action** skills set `disable-model-invocation: true` — invoke with `/bfsi-foo`.
**Reference** skills auto-load when their description matches the user's request.

## Agents

| Agent | Model | Role |
|---|---|---|
| `bfsi-security-reviewer` | opus | OWASP Top 10 + BFSI PR review |
| `bfsi-architect` | opus | Designs new features per BFSI patterns |
| `bfsi-code-reviewer` | opus | General code review with BFSI awareness |
| `bfsi-test-writer` | sonnet | Security-aware tests |
| `bfsi-accessibility-auditor` | sonnet | WCAG 2.1 AA audit |
| `bfsi-compliance-auditor` | opus | RBI / PCI / IRDAI / SOC2 audit |
| `bfsi-performance-reviewer` | sonnet | Perf for tables, real-time data |
| `bfsi-planner` | opus | User story → impl plan |
| `bfsi-pii-scanner` | sonnet | Scans for accidental PII exposure |
| `bfsi-pr-reviewer` | opus | Orchestrator |

## Hooks

12 hooks defined in `hooks/hooks.json`. Categories:

- **Safety** — block destructive shell, block force push, block edits to `.env*` / `*.pem`
- **Secret scanning** — pre-write secret scanner, post-write PII pattern scanner
- **Quality** — format + lint async after edits, a11y check on TSX writes
- **Context** — inject project context on SessionStart, snapshot before PreCompact
- **Audit** — opt-in prompt audit log, post-stop verification

## Commands

| Command | Action |
|---|---|
| `/bfsi-review` | Spawn security + a11y + perf + test-coverage agents in parallel |
| `/bfsi-scaffold` | Interactive feature scaffolding |
| `/bfsi-audit` | Compliance audit (RBI / PCI / IRDAI / SOC2) |
| `/bfsi-doctor` | Health-check: env vars, deps, `.claude` config, hook registration |

---

## How it loads in a scaffolded project

Scaffolded projects' `.claude/settings.json` enables this plugin. From inside the project:

```bash
claude              # session starts; SessionStart hook injects context
# /hooks            # verify all 12 hooks registered
# /plugin           # verify bfsi-claude-toolkit enabled
# /bfsi-doctor      # full health-check
```

---

## Locally testing changes

```bash
# Link this plugin into a local Claude config for testing
mkdir -p ~/.claude/plugins
ln -s "$(pwd)" ~/.claude/plugins/bfsi-claude-toolkit
# Then enable via /plugin in any Claude Code session
```

---

## Design principles

1. **Action skills require explicit invocation.** Anything with side-effects (scaffolding, audit logging, commits) has `disable-model-invocation: true` so Claude can't run it on its own assumption.
2. **Reference skills load only when relevant.** `bfsi-onboarding`, `bfsi-error-message`, etc. have tight descriptions so they auto-load only on matching prompts.
3. **Hooks tighten, never loosen.** Hooks can `deny` even in `bypassPermissions` mode. They cannot grant tool access beyond what `.claude/settings.json` permits.
4. **Scripts in `hooks/scripts/`.** Bash scripts referenced via `${CLAUDE_PLUGIN_ROOT}` (exec form, `args: []`) so paths with spaces work everywhere.
5. **Progressive disclosure.** Each SKILL.md stays under ~500 lines. Detail moves into `references/*.md` linked from the SKILL.
6. **No PII in audit logs.** Hook scripts that log to disk run input through the `pii-scrub.sh` helper first.
