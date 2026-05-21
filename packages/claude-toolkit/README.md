# @react-vault/toolkit

A Claude Code plugin that makes Claude **BFSI-aware** for every Your Real Company BFSI React project. It ships skills for scaffolding, hooks that enforce security policy, agents that review PRs, and commands that orchestrate the lot.

Built per the official [Claude Code spec](https://code.claude.com/docs/) — skill directories in kebab-case, exact `SKILL.md` filename, YAML frontmatter with WHAT + WHEN descriptions, progressive disclosure, `${CLAUDE_PLUGIN_ROOT}` path resolution, exit code 2 to block, JSON for structured hook decisions.

**Integrity is enforced.** `scripts/validate-plugin.mjs` is the source of truth for what this plugin ships — the counts in this README are validated by CI. If you add or remove a skill / agent / hook, run `node packages/claude-toolkit/scripts/validate-plugin.mjs` and update this README accordingly.

---

## What's inside

```text
toolkit/
├── plugin.json                  Plugin manifest
├── skills/                      15 skills (action + reference)
├── agents/                      8 specialised agents
├── hooks/
│   ├── hooks.json               17 hook entries across 9 event types
│   └── scripts/                 Hook scripts (bash + 1 type:agent)
├── commands/                    4 orchestrator commands
└── scripts/
    └── validate-plugin.mjs      Integrity validator (no npm deps)
```

---

## Skills (15)

| Skill                   | Style     | Purpose                                                                         |
| ----------------------- | --------- | ------------------------------------------------------------------------------- |
| `bfsi-feature`          | action    | Scaffold feature module (api + containers + components + routes + tests + i18n) |
| `bfsi-api-endpoint`     | action    | Add API endpoint — variant-aware (RTK Query OR TanStack)                        |
| `bfsi-form`             | action    | RHF + Zod form with BFSI defaults                                               |
| `bfsi-pii-field`        | action    | Wrap field with `<PIIMaskedDisplay>` + audit                                    |
| `bfsi-protected-route`  | action    | Add route with `<ProtectedRoute permission="...">`                              |
| `bfsi-audit-action`     | action    | Wrap button/action with `useAuditedAction` (optional MFA)                       |
| `bfsi-confirm-modal`    | action    | Confirmation modal with optional MFA step                                       |
| `bfsi-data-table`       | action    | Access-controlled table with PII-masked columns                                 |
| `bfsi-i18n-key`         | action    | Add i18n key across all locales (en + hi + ...)                                 |
| `bfsi-compliance-check` | action    | OWASP + RBI + PCI checklist on the current diff                                 |
| `bfsi-commit`           | action    | Audit-friendly Conventional Commits with BFSI types                             |
| `bfsi-onboarding`       | reference | New-dev orientation (auto-loads)                                                |
| `bfsi-encrypt-helper`   | reference | Web Crypto usage patterns                                                       |
| `bfsi-test-pattern`     | reference | BFSI testing patterns (security, a11y, audit, idempotency)                      |
| `bfsi-error-message`    | reference | Safe error message patterns (UI / logs / Sentry tiers)                          |

**Action** skills set `disable-model-invocation: true` — invoke with `/bfsi-foo`.
**Reference** skills auto-load when their description matches the user's request.

## Agents (8)

| Agent                        | Model  | Role                                         |
| ---------------------------- | ------ | -------------------------------------------- |
| `bfsi-security-reviewer`     | opus   | OWASP Top 10 + BFSI PR security review       |
| `bfsi-architect`             | opus   | Designs new features per BFSI patterns       |
| `bfsi-code-reviewer`         | opus   | General code review with BFSI awareness      |
| `bfsi-accessibility-auditor` | sonnet | WCAG 2.1 AA audit                            |
| `bfsi-compliance-auditor`    | opus   | RBI / PCI / IRDAI / SOC2 / ISO 27001 audit   |
| `bfsi-performance-reviewer`  | sonnet | Perf for tables, real-time data, bundle size |
| `bfsi-pii-scanner`           | sonnet | Scans for accidental PII exposure            |
| `bfsi-pr-reviewer`           | opus   | Orchestrator — fans out to the 5 specialists |

## Hooks (17 entries across 9 event types)

Defined in `hooks/hooks.json`. Categories:

- **Safety / blocking** (`PreToolUse`, exit 2 to block) — `block-destructive` (`rm -rf` outside allowlist), `block-force-push` (force/force-with-lease to main/master/staging/production/release branches), `protect-files` (`.env*`, `*.pem`, `*.key`, `.git/`, etc.), `scan-secrets` (AWS / Stripe / Anthropic / Slack / GitHub / Google / GitLab / Razorpay / PEM patterns).
- **Quality (async)** (`PostToolUse`) — `format` (Prettier), `lint` (ESLint), `scan-pii` (PII patterns in writes), `a11y-check` (lightweight WCAG heuristics on `.tsx`).
- **Context** — `inject-context` (`SessionStart`), `save-compliance-context` (`PreCompact`), `restore-compliance-context` (`PostCompact`).
- **Observability** — `audit-prompt` (opt-in via `BFSI_AUDIT_PROMPTS=1`, scrubs PII before writing JSONL).
- **Post-turn** (`Stop`) — `verify-clean` (typecheck + quick secret/PII grep, async) and a sophisticated `type: agent` review gate that classifies the diff for P0/P1/P2 findings and uses `AskUserQuestion` to gate the stop.
- **Orchestration** — `subagent-start` / `subagent-stop` (counter + duration + cost ledger; failures surface via `additionalContext` so the orchestrator can decide on retry).

## Commands (4)

| Command          | Action                                                            |
| ---------------- | ----------------------------------------------------------------- |
| `/bfsi-review`   | Spawn security + code + a11y + PII + perf agents in parallel      |
| `/bfsi-scaffold` | Interactive scaffolding (routes to the right action skill)        |
| `/bfsi-audit`    | Compliance audit (RBI / PCI / IRDAI / SOC2)                       |
| `/bfsi-doctor`   | Health-check: env vars, deps, `.claude` config, hook registration |

---

## How it loads

Two modes — both supported by `/bfsi-doctor`:

**Plugin mode** — `~/.claude/plugins/toolkit/` or marketplace install. `.claude/settings.json` carries `"enabledPlugins": ["toolkit@react-vault"]`. Plugin paths resolve via `${CLAUDE_PLUGIN_ROOT}`.

**Inlined mode** (default for scaffolded projects) — `create-app`'s `inlineToolkitInto()` copies `agents/`, `skills/`, `commands/`, and `hooks/scripts/` into the project's `.claude/`, rewrites `${CLAUDE_PLUGIN_ROOT}` → `${CLAUDE_PROJECT_DIR}/.claude`, and deletes `enabledPlugins`. Project becomes self-contained — no plugin install required, works offline.

From inside a scaffolded project:

```bash
claude              # session starts; SessionStart hook injects context
# /hooks            # verify hook events registered
# /agents           # verify the 8 BFSI agents present
# /bfsi-doctor      # full health-check (#5 detects either mode)
```

---

## Locally testing changes

```bash
# Link this plugin into a local Claude config for testing
mkdir -p ~/.claude/plugins
ln -s "$(pwd)" ~/.claude/plugins/toolkit
# Then enable via /plugin in any Claude Code session

# Validate integrity (recommended before commit)
node ./scripts/validate-plugin.mjs
```

---

## Design principles

1. **Action skills require explicit invocation.** Anything with side-effects (scaffolding, audit logging, commits) has `disable-model-invocation: true` so Claude can't run it on its own assumption.
2. **Reference skills load only when relevant.** `bfsi-onboarding`, `bfsi-error-message`, etc. have tight descriptions so they auto-load only on matching prompts.
3. **Hooks tighten, never loosen.** Hooks can `deny` even in `bypassPermissions` mode. They cannot grant tool access beyond what `.claude/settings.json` permits.
4. **Scripts in `hooks/scripts/`.** Bash scripts referenced via `${CLAUDE_PLUGIN_ROOT}` (exec form, `args: []`) so paths with spaces work everywhere.
5. **Progressive disclosure.** Each `SKILL.md` stays under ~500 lines. Detail moves into `references/*.md` linked from the SKILL.
6. **No PII in audit logs.** Hook scripts that log to disk (`audit-prompt.sh`) scrub PAN/Aadhaar/mobile/email patterns before writing.
7. **Integrity enforced by CI.** `validate-plugin.mjs` checks every agent dispatched by `bfsi-pr-reviewer` exists, every skill routed by `bfsi-scaffold` exists, every hook script in `hooks.json` is on disk and executable, and the counts in this README match disk. If the validator fails, the PR doesn't merge.

---

## Roadmap (not yet shipping)

These are referenced by other repo docs but not on disk today. Tracked here so the README stays factual; cross-checked by `validate-plugin.mjs`:

- **Agents:** `bfsi-test-writer` (generates the 7 test categories for a feature), `bfsi-planner` (user-story → multi-feature decomposition).
- **UI primitives in `@<scope>/ui` v0.2:** `<PCITokenizedCardInput>`, `<BFSIErrorBoundary>`, `<ConfirmModal>`, `<SecureFormField>`, `<CanAccess>`. Until then, project-local equivalents under `src/shared/`.
