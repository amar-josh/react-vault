---
name: bfsi-doctor
description: Health check for a BFSI project. Verifies env vars, dep versions, .claude config, hook registration, package consistency, and BFSI-specific gotchas.
---

# /bfsi-doctor

You are running a health check. Don't delegate — execute the checks directly.

## Checks

Run each check, report status (✅ / ⚠️ / ❌), and remediation for any failures.

### Environment

1. **Node version** — `node --version`. Should be ≥ 20.11.0.
2. **pnpm version** — `pnpm --version`. Should be ≥ 9.0.0.
3. **Git** — `git --version`. Any modern git.
4. **In a project root** — check for `package.json` in `$CLAUDE_PROJECT_DIR`.

### Project config

5. **`.claude/settings.json` exists** and enables the BFSI toolkit plugin.
6. **`.env.local.sample` exists** with placeholders for VITE\_\* vars.
7. **`tsconfig.json`** extends `tsconfig.base.json` (or has equivalent strict settings).
8. **`.eslintrc.cjs`** present (or `eslint.config.js`).
9. **`.husky/pre-commit`** present and executable.
10. **`.github/workflows/ci.yml`** present.

### Dependencies

11. **Critical packages installed:**

    - `react`, `react-dom`
    - `@scope/core` (or link: ref to local workspace)
    - `@scope/ui`
    - One of: `@reduxjs/toolkit` OR `@tanstack/react-query`
    - `react-hook-form`, `zod`
    - `react-router-dom`
    - `react-i18next`
    - `tailwindcss`, `autoprefixer`, `postcss`
    - `vitest`, `@testing-library/react`

12. **No duplicate React** — `pnpm why react` should show one version.

### BFSI conventions

13. **`src/features/` exists** (or features live somewhere obvious).
14. **`src/routes/ProtectedRoute.tsx`** exists.
15. **i18n setup** — `src/i18n/i18n.ts` exists and `App.tsx` wraps in `I18nextProvider`.
16. **Audit endpoint configured** — `VITE_AUDIT_ENDPOINT` in `.env.local.sample`.
17. **Sentry stub configured** — `VITE_SENTRY_DSN` placeholder present.

### Claude toolkit

18. **`/hooks` registered** — at least 8 hooks visible (run via Bash if possible; otherwise describe to user).
19. **`/plugin` shows `toolkit` enabled.**
20. **At least 8 skills available** — list via `ls .claude/skills` if user-level, or via `/plugin` for plugin-level.

### Security

21. **No `.env` files committed** — `git ls-files | grep -E '\.env(\..*)?$' | grep -v 'sample\|example'` should be empty.
22. **No node_modules tracked** — `git ls-files | grep node_modules` should be empty.
23. **No PEM/key files tracked** — `git ls-files | grep -E '\.(pem|key|p12|pfx)$'` should be empty.

## Output

```markdown
# /bfsi-doctor health check

## Summary

{count_pass} ✅ {count_warn} ⚠️ {count_fail} ❌

## Failures (must fix)

{for each ❌, with remediation}

## Warnings (recommended fixes)

{for each ⚠️, with rationale}

## All green

{categories that fully passed}

## Next steps

{Top 3 actions ordered by urgency}
```

## Notes

- Be quiet if everything passes — a short "all green" is fine.
- For `⚠️` items, explain WHY they matter (not just the fact).
- For `❌` items, give the EXACT command or file edit to remediate.
- Don't apply fixes yourself; the user runs them.
