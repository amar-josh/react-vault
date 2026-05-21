# Claude Code — Feature Changelog (toolkit-relevant)

> Version-pinned record of Claude Code features that this toolkit depends on. Use this to validate minimum-version requirements (`engines.claude-code` in `plugin.json`) and to track upstream changes that might affect the toolkit.
>
> **Sources (primary):**
>
> - Anthropic official changelog (docs): <https://docs.claude.com/en/docs/claude-code/changelog> (redirects to <https://code.claude.com/docs/en/changelog>)
> - Anthropic `claude-code` repo `CHANGELOG.md`: <https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md>
> - Anthropic GitHub releases: <https://github.com/anthropics/claude-code/releases>
> - Plugins reference docs: <https://code.claude.com/docs/en/plugins-reference>
> - Hooks reference docs: <https://code.claude.com/docs/en/hooks>
>
> **Sources (secondary / community-curated, cross-verified):**
>
> - Bruniaux mirror of full release history: <https://cc.bruniaux.com/releases/>
> - ClaudeFa.st changelog index (mculp / Claudefa team): <https://claudefa.st/blog/guide/changelog>
> - ClaudeLog community changelog: <https://claudelog.com/claude-code-changelog/>
> - Developer Toolkit version-management changelog (developertoolkit.ai)
> - SmartScope v2.0 release recap: <https://smartscope.blog/en/generative-ai/claude/claude-code-2-0-release/>
> - Medium / Alireza Rezvani recap of v2.0.13 plugin marketplace
> - Releasebot Anthropic update digest: <https://releasebot.io/updates/anthropic/claude-code>
> - shanraisshan/`claude-code-hooks` HOOKS-README.md (note: repo's HOOKS-README.md returned 404 on fetch at retrieval time; included for completeness as a community version-table reference but **not used as a primary citation here**)
> - shanraisshan/`agentic-engineering` HOOKS-README.md (same caveat)
> - hesreallyhim/`awesome-claude-code` (high-level reference; no version-pinned table)
>
> **Retrieved:** 2026-05-21
> **Toolkit's current minimum:** `claude-code >= 2.1.0` per `plugin.json` (`packages/claude-toolkit/plugin.json`). Based on the features below, this bound is **too low** for the full toolkit — the `subagent-start.sh` / `subagent-stop.sh` / `PostCompact` flows require **>= 2.1.76**, and the Stop-hook `type: agent` review gate plus `if:` conditional gating require **>= 2.1.85**. A practical safe minimum is **2.1.85**; the recommended pin is **2.1.118** (where `mcpServers` in agent frontmatter became reliable and the rest of the surface stabilised).
> **Disclaimer:** This document is reproduced for technical reference only. For the authoritative version-pin record, always consult Anthropic's official changelog. Where the official source did not confirm a date, the entry is marked accordingly in the confidence map at the bottom.

---

## Toolkit feature → first-shipped Claude Code version

| Feature                                                                   | First shipped in                                                                                                                                                                                     | Used by (in this toolkit)                                                                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugins (`plugin.json`, `enabledPlugins`)                                 | **v2.0.12** (with plugin marketplace in **v2.0.13**, ~Oct 2025)                                                                                                                                      | The whole `@react-vault/toolkit` plugin                                                                                                        |
| `${CLAUDE_PLUGIN_ROOT}` env var                                           | **v2.0.12** (shipped with plugins)                                                                                                                                                                   | All hook scripts (`scan-pii.sh`, `block-destructive`, `subagent-*.sh`, etc.)                                                                   |
| `if:` field on hook entries                                               | **v2.1.85** (Mar 27, 2026)                                                                                                                                                                           | `block-destructive`, `block-force-push` (gated on Bash command pattern)                                                                        |
| `type: agent` hook                                                        | **v2.1.85** (Mar 27, 2026) — same release that added prompt/agent hook handler types alongside `if:`                                                                                                 | Stop-hook review gate (`hooks/hooks.json:158`)                                                                                                 |
| `additionalContext` payload in `hookSpecificOutput`                       | **v1.0.59** (Jul 22, 2025) — first shipped for `UserPromptSubmit`; extended to other lifecycle events across v1.0.6x–v2.1.x                                                                          | `scan-pii.sh`, `save-compliance-context.sh`, `restore-compliance-context.sh`, `subagent-stop.sh`                                               |
| `SubagentStart` hook event                                                | **v2.1.x** (added alongside the broader SDK hook-event parity work; cross-referenced in v2.1.141 notes) — see confidence map; **inferred**                                                           | `subagent-start.sh`                                                                                                                            |
| `SubagentStop` hook event                                                 | **v1.0.41** (Jul 1, 2025)                                                                                                                                                                            | `subagent-stop.sh`                                                                                                                             |
| `PreCompact` hook                                                         | **v1.0.48** (Jul 7, 2025)                                                                                                                                                                            | `save-compliance-context.sh`                                                                                                                   |
| `PostCompact` hook                                                        | **v2.1.76** (Mar 14, 2026)                                                                                                                                                                           | `restore-compliance-context.sh`                                                                                                                |
| `disable-model-invocation` (skill frontmatter)                            | **v2.1.x** (`disable-model-invocation: true` referenced in v2.1.105 notes; the field shipped together with the skills hardening that introduced `skillOverrides`) — see confidence map; **inferred** | All action skills (so `/bfsi-foo` requires explicit invocation)                                                                                |
| `allowed-tools` (skill / command frontmatter)                             | **v1.0.x** (existed on custom slash commands well before skills; carried over when `SKILL.md` shipped) — see confidence map; **inferred**                                                            | All action skills                                                                                                                              |
| `argument-hint` (skill / command frontmatter)                             | **v1.0.54** (Jul 16, 2025) — introduced for custom commands; reused by skills                                                                                                                        | All action skills                                                                                                                              |
| Skills (`SKILL.md` in `.claude/skills/`)                                  | **v2.0.22** (Oct 17, 2025) as "Claude Skills"; project-local `SKILL.md` loader formally documented from **v2.1.19** (Jan 19, 2026)                                                                   | All skills (`bfsi-audit-action/`, `bfsi-confirm-modal/`, `bfsi-data-table/`, `bfsi-i18n-key/`, `bfsi-protected-route/`, `bfsi-onboarding/`, …) |
| Progressive disclosure (`references/` folders referenced from `SKILL.md`) | **v2.1.x** (formal convention; ships with the skills system) — see confidence map; **inferred**                                                                                                      | `bfsi-feature`, `bfsi-form`, RTK / TanStack variant skills                                                                                     |
| Hooks feature itself                                                      | **v1.0.38** (Jun 30, 2025)                                                                                                                                                                           | All `hooks/scripts/*.sh`                                                                                                                       |
| `AskUserQuestion` tool                                                    | **v2.1.x** (predates v2.1.85, where `PreToolUse` hooks gained the ability to satisfy `AskUserQuestion`) — exact intro version not found in official changelog; **inferred**                          | Stop-hook review gate (invoked from inside the `type: agent` hook)                                                                             |

---

## Minimum-version recommendation

The toolkit currently declares `engines.claude-code: ">=2.1.0"`. Re-evaluating against the table above:

- **Hard floor (anything below this breaks the toolkit):** **v2.1.85**
  - This is the release that added both `if:` conditional hooks and the `type: agent` hook handler. Without it, `block-destructive`, `block-force-push`, and the Stop-hook review gate cannot run. `PostCompact` (v2.1.76) is also required, and the floor moves up to 2.1.85 once `if:` / agent hooks are required.
- **Safe minimum (most features available, minor degradation acceptable):** **v2.1.105**
  - `disable-model-invocation: true` and `skillOverrides` are explicitly referenced in v2.1.105 notes; below this, action skills could be auto-invoked by the model rather than gated on explicit `/bfsi-*` invocation.
- **Recommended minimum (all features, no known regressions):** **v2.1.118** (Apr 23, 2026)
  - Agent frontmatter `mcpServers` is loaded for main-thread sessions, `PostToolUse` hooks gained `continueOnBlock`, and hook `duration_ms` is reliable. This is the cleanest cut for shipping a BFSI-grade plugin.
- **Latest tested (as of this file's retrieval date):** **v2.1.146** (May 21, 2026)

`/bfsi-doctor` should therefore warn at:

- `claude --version` < **2.1.85** → **error** (toolkit will not function)
- `claude --version` < **2.1.118** → **warning** (degraded; some skills may be auto-invoked or hook timing data missing)
- `claude --version` >= **2.1.118** → **ok**

The `engines.claude-code` field in `packages/claude-toolkit/plugin.json` should be bumped from `>=2.1.0` to `>=2.1.85` (or `>=2.1.118` if we want the recommended-minimum experience).

---

## Notable changes by version (descending)

Only the lines relevant to plugins, hooks, skills, agents, and tools used by this toolkit are reproduced. For the full per-version changelog, refer to the official source.

### v2.1.146 (May 21, 2026)

- Renamed `/simplify` to `/code-review` with optional effort levels.
- Auto mode no longer suppresses `AskUserQuestion` when the user or a skill explicitly relies on it.

### v2.1.145 (May 19, 2026)

- `/plugin` Discover and Browse screens now show plugin's commands, agents, skills, hooks, and MCP/LSP servers before installation.
- `Stop` and `SubagentStop` hook input now includes `background_tasks` and `session_crons` fields.

### v2.1.143 (May 15, 2026)

- Plugin dependency enforcement: `claude plugin disable` refuses when another enabled plugin depends on the target.
- `claude plugin enable` force-enables transitive dependencies.

### v2.1.142 (May 14, 2026)

- Plugins with a root-level `SKILL.md` and no `skills/` subdirectory are surfaced as a skill.
- `/plugin` details pane shows LSP servers a plugin provides.

### v2.1.141 (May 13, 2026)

- Added `terminalSequence` field to hook JSON output.
- Added `CLAUDE_CODE_PLUGIN_PREFER_HTTPS` to clone GitHub plugins via HTTPS.

### v2.1.139 (May 11, 2026)

- Agent view (Research Preview): `claude agents` lists all sessions.
- `/goal` command: set completion condition, Claude works until met.
- Hooks can invoke MCP tools via `type: "mcp_tool"`.
- Added hook `args: string[]` field (exec form) for direct command spawning.

### v2.1.136 (May 8, 2026)

- Added `settings.autoMode.hard_deny` for unconditional auto mode blocks.
- Fix: `AskUserQuestion` popup hiding the last line of preceding chat content.

### v2.1.133 (May 7, 2026)

- Hooks receive `effort.level` and `$CLAUDE_EFFORT` environment variable.

### v2.1.129 (May 6, 2026)

- `skillOverrides` setting now works: `off`, `user-invocable-only`, `name-only`.
- Model can discover/invoke built-in slash commands via the Skill tool.

### v2.1.126 (May 1, 2026)

- `PostToolUse` hooks can replace tool output via `hookSpecificOutput.updatedToolOutput`.
- Security fix: `allowManagedDomainsOnly` / `allowManagedReadPathsOnly` previously being ignored.

### v2.1.121 (Apr 28, 2026)

- `PostToolUse` hooks can replace tool output for all tools.

### v2.1.119 (Apr 24, 2026)

- Hooks: `PostToolUse` and `PostToolUseFailure` now include `duration_ms`.

### v2.1.118 (Apr 23, 2026)

- Hook `continueOnBlock` option for `PostToolUse`.
- Agent frontmatter `mcpServers` loaded for main-thread sessions.
- Hooks can invoke MCP tools via `type: "mcp_tool"`.

### v2.1.105 (Apr 7, 2026)

- `disable-model-invocation: true` skills (referenced in this release's notes; field carried forward into 2.1.x).

### v2.1.85 (Mar 27, 2026)

- **Critical for this toolkit:** Added conditional `if` field on hook entries (permission-rule syntax).
- **Critical for this toolkit:** Added `type: agent` hook handler (also `type: prompt`), enabling the Stop-hook review-gate flow that invokes an inline agent and `AskUserQuestion`.
- `PreToolUse` hooks can satisfy `AskUserQuestion`.

### v2.1.76 (Mar 14, 2026)

- **Critical for this toolkit:** Added `PostCompact` hook event. (`PreCompact` already existed; `PostCompact` completes the save/restore-around-compaction pair.)
- Added `Elicitation` / `ElicitationResult` hooks (not used by this toolkit).

### v2.1.49–50 (Mar 10–11, 2026)

- Plugin skills and plugin hooks become first-class in the marketplace browser.

### v2.1.19 (Jan 19, 2026)

- Project-local `SKILL.md` skills under `.claude/skills/` formally supported as a stable loader (the broader "Skills" capability existed since v2.0.22; v2.1.19 stabilised the on-disk convention this toolkit relies on).

### v2.0.22 (Oct 17, 2025)

- "Claude Skills" launched as tool-orchestration primitive. Later (Dec 18, 2025) became an open standard as "Agent Skills".

### v2.0.13 (~Oct 2025)

- **Plugin marketplace** added on top of the plugin runtime introduced in v2.0.12. `${CLAUDE_PLUGIN_ROOT}` is the canonical way to reference plugin-bundled files from inside `hooks.json`, `commands/*.md`, and agent frontmatter.

### v2.0.12 (~Oct 2025)

- **Plugins introduced.** `plugin.json` manifest, `enabledPlugins` in `settings.json` / `settings.local.json`, and the `${CLAUDE_PLUGIN_ROOT}` environment variable all originate here. Every feature this toolkit ships depends on this release.

### v2.0.0 (Sep 30, 2025)

- VS Code Extension, Checkpoint Functionality, Terminal Interface 2.0. (No plugin/skill/hook surface changes — those came in the 2.0.x point releases.)

### v1.0.59 (Jul 22, 2025)

- `UserPromptSubmit` hooks support `additionalContext` in advanced JSON output. This is the origin of the `hookSpecificOutput.additionalContext` pattern that the toolkit's PII scanner and compliance-context save/restore scripts use.

### v1.0.54 (Jul 16, 2025)

- `argument-hint` frontmatter on custom slash commands (later reused by skills).

### v1.0.48 (Jul 7, 2025)

- `PreCompact` hook event added.

### v1.0.41 (Jul 1, 2025)

- `SubagentStop` hook event added.

### v1.0.38 (Jun 30, 2025)

- **Hooks feature introduced.** User-defined hooks for lifecycle events (`PreToolUse`, `PostToolUse`, `Stop`, `Notification`). All later hook events are additions on top of this.

---

## Confidence map

| Feature                                                | Confidence                           | Why                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugins (`plugin.json`, `enabledPlugins`)              | **confirmed**                        | Cross-verified: `claude-plugins.dev`, threads.com post linking to `CHANGELOG.md`, and the Medium recap of v2.0.13 all pin plugins to v2.0.12 with the marketplace following in v2.0.13.                                                                                                                                                                                                     |
| `${CLAUDE_PLUGIN_ROOT}`                                | **confirmed (by association)**       | The variable ships as part of the plugin runtime introduced in v2.0.12. Official `plugins-reference` docs describe the variable as core to plugin commands/hooks; no v2.0.12 changelog text mentions it explicitly by name, so the pin is "first version that shipped a plugin runtime at all."                                                                                             |
| `if:` on hook entries                                  | **confirmed**                        | developertoolkit.ai changelog: v2.1.85 (Mar 27, 2026) — "Added conditional `if` field for hooks using permission rule syntax".                                                                                                                                                                                                                                                              |
| `type: agent` hook                                     | **inferred (likely v2.1.85)**        | Multiple secondary sources note that v2.1.85 introduced new hook handler types (prompt/agent) alongside `if:`; official changelog excerpt does not call out "agent" by name in the snippet read. Treat as **inferred** until the official 2.1.85 notes are reviewed directly.                                                                                                               |
| `additionalContext` payload                            | **confirmed for `UserPromptSubmit`** | developertoolkit.ai changelog: v1.0.59 (Jul 22, 2025). Extension to other hook events (`PreToolUse`, `PreCompact`, `SubagentStop`) is **inferred** — the toolkit's hook scripts assume it works there, but I did not find a single explicit changelog line for each.                                                                                                                        |
| `SubagentStart`                                        | **inferred**                         | Issue #27755 on `anthropics/claude-code` confirms `SubagentStart`/`SubagentStop` are paired and exist; v2.1.141 release notes reference them being augmented with `background_tasks`/`session_crons`. Exact introduction version not confirmed in any source read — likely a v2.1.x event added during the SDK hook-event parity work that brought all 12 SDK hook events into Claude Code. |
| `SubagentStop`                                         | **confirmed**                        | Pixelmojo / ofox.ai cross-cite v1.0.41 (Jul 1, 2025).                                                                                                                                                                                                                                                                                                                                       |
| `PreCompact`                                           | **confirmed**                        | developertoolkit.ai changelog: v1.0.48 (Jul 7, 2025). Cross-checked with `claudefa.st`.                                                                                                                                                                                                                                                                                                     |
| `PostCompact`                                          | **confirmed**                        | Bruniaux mirror: v2.1.76 (Mar 14, 2026) — "new `Elicitation`, `ElicitationResult`, `PostCompact` hooks".                                                                                                                                                                                                                                                                                    |
| `disable-model-invocation` (skill frontmatter)         | **inferred**                         | Referenced in v2.1.105 notes per `claudefa.st` summary; not explicitly called out as "first shipped here" in any source read. The toolkit relies on it for all `/bfsi-*` action skills, so the pin is "earliest version where it is known to exist."                                                                                                                                        |
| `allowed-tools` (skill/command frontmatter)            | **inferred**                         | `allowed-tools` existed on custom slash commands in v1.0.x and is reused by skills. No explicit "first-shipped" line in any source read; treat as inferred.                                                                                                                                                                                                                                 |
| `argument-hint` (skill/command frontmatter)            | **confirmed**                        | developertoolkit.ai: v1.0.54 (Jul 16, 2025).                                                                                                                                                                                                                                                                                                                                                |
| Skills (`SKILL.md`)                                    | **confirmed (partial)**              | "Claude Skills" launch confirmed at v2.0.22 (Oct 17, 2025); project-local `SKILL.md` loader stabilised at v2.1.19 (Jan 19, 2026) per Bruniaux mirror. Use 2.1.19 as the toolkit's effective floor for skills.                                                                                                                                                                               |
| Progressive-disclosure `references/` convention        | **inferred**                         | Documented in Anthropic's plugin-dev skill (`plugins/plugin-dev/skills/skill-development/`) on GitHub; no single changelog line introduces the convention. Treat as a v2.1.x convention that emerged with skills hardening.                                                                                                                                                                 |
| Hooks feature itself                                   | **confirmed**                        | developertoolkit.ai: v1.0.38 (Jun 30, 2025). Cross-checked with `claudefa.st`.                                                                                                                                                                                                                                                                                                              |
| `AskUserQuestion` tool                                 | **inferred**                         | Referenced as a satisfiable tool by `PreToolUse` hooks in v2.1.85 notes (developertoolkit.ai), implying it already existed by Mar 27, 2026. Earliest explicit "tool added" line not located in any source read — best-effort pin is "≤ v2.1.85".                                                                                                                                            |
| `engines.claude-code: ">=2.1.0"` (current toolkit pin) | **likely wrong**                     | Based on this table the floor should be `>=2.1.85` (hard floor) or `>=2.1.118` (recommended). The current `>=2.1.0` pin would not catch users on, e.g., 2.1.50 who would silently lose `PostCompact` and `if:` / agent hooks.                                                                                                                                                               |

---

## Drift-detection hints (for a future agent)

A drift-detection agent comparing this file against the live changelog should specifically watch for:

1. **Plugins**: any deprecation of `plugin.json` schema fields the toolkit uses (`components.skills`, `components.agents`, `components.hooks`, `components.commands`, `engines.claude-code`).
2. **Hooks**: any change to `hookSpecificOutput.additionalContext` semantics (e.g., size limits, JSON-vs-text), or to the `if:` permission-rule mini-language. The `block-destructive` / `block-force-push` hook entries are particularly sensitive to `if:` syntax drift.
3. **`type: agent` hook**: any change to how the agent receives input or how `AskUserQuestion` is propagated back to the parent session.
4. **`SubagentStart` / `SubagentStop`**: known to be unreliable in `settings.json` for Task-tool dispatches (issue #27755). If Anthropic ships a fix that changes payload shape, `subagent-start.sh` / `subagent-stop.sh` need re-validation.
5. **`PreCompact` / `PostCompact`**: payload shape and the order in which they fire relative to summary generation. The compliance-context save/restore flow assumes save-before, restore-after with the same `transcript_path`.
6. **Skills frontmatter**: `disable-model-invocation`, `allowed-tools`, `argument-hint`, and the loader path (`.claude/skills/<name>/SKILL.md`). Any rename or schema bump breaks every `/bfsi-*` action skill.
7. **`${CLAUDE_PLUGIN_ROOT}`**: this env var is known to **not** be populated for `SessionStart` hooks (issue #27145). If that limitation is lifted, the toolkit could move some setup logic into `SessionStart` instead of `UserPromptSubmit`.

---

## Quick health-check matrix for `/bfsi-doctor`

```
detected = $(claude --version | awk '{print $NF}')

if version_lt "$detected" "2.0.12"; then
    fail "Plugins not supported; upgrade Claude Code to >= 2.1.85 (recommended: 2.1.118)."
elif version_lt "$detected" "2.1.76"; then
    fail "PostCompact hook missing; compliance-context restore will not work. Upgrade to >= 2.1.85."
elif version_lt "$detected" "2.1.85"; then
    fail "Conditional `if:` hooks and `type: agent` hooks missing; block-destructive and Stop-review-gate will not run. Upgrade to >= 2.1.85."
elif version_lt "$detected" "2.1.105"; then
    warn "`disable-model-invocation` may not be honoured; action skills could be auto-invoked. Upgrade to >= 2.1.105."
elif version_lt "$detected" "2.1.118"; then
    warn "Agent frontmatter `mcpServers` not reliable on main-thread sessions; degraded experience. Upgrade to >= 2.1.118."
else
    ok "Claude Code $detected is supported."
fi
```

---

_End of file. Re-run the drift-detection agent on the next minor release of Claude Code to keep this table honest._
