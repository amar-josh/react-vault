# Skills Cookbook

Common day-to-day workflows using the Claude toolkit.

## Quick reference

| You want to … | Run |
|---|---|
| Start a new feature module | `/bfsi-feature MyFeature` |
| Add an API endpoint | `/bfsi-api-endpoint POST /resource` |
| Add a form | `/bfsi-form MyForm` |
| Mask a PII field | `/bfsi-pii-field pan user.pan` |
| Add a protected route | `/bfsi-protected-route /admin/page` |
| Wrap an action with audit | `/bfsi-audit-action "deleteUser"` |
| Run compliance check | `/bfsi-compliance-check` |
| Generate a commit message | `/bfsi-commit` |
| Run full PR review | `/bfsi-review` |
| Compliance audit | `/bfsi-audit rbi` |
| Health check this project | `/bfsi-doctor` |

## Recipes

### Onboard a new engineer

Have them open Claude Code in the project and ask:

> How does this project work?

This triggers the `bfsi-onboarding` reference skill which gives them the layout, conventions, where things live, and what NOT to do.

### Add a KYC feature end-to-end

```
/bfsi-feature KycVerification
```

Generates:
- `src/features/KycVerification/` full directory
- Routes registered with `permission="kyc.view"`
- i18n keys in `en.json` + `hi.json` placeholders
- PII fields auto-wrapped with `<PIIMaskedDisplay>`
- Tests covering schema, container, permission, idempotency, a11y, security

Then add fields:
```
/bfsi-form KycSubmissionForm --fields "pan:string,aadhaar:string,name:string,dob:date,mobile:string,email:string"
```

### Mask a PII field that wasn't originally masked

```tsx
// Before:
<td>{user.pan}</td>
```

Run:
```
/bfsi-pii-field pan user.pan
```

After:
```tsx
<td>
  <PIIMaskedDisplay
    type="pan"
    value={user.pan}
    auditTarget={{ type: 'user', id: user.id }}
  />
</td>
```

### Before a PR — full review

```
/bfsi-review
```

Spawns in parallel:
- `bfsi-security-reviewer` — OWASP + BFSI security
- `bfsi-code-reviewer` — general code quality
- `bfsi-accessibility-auditor` — WCAG 2.1 AA
- `bfsi-pii-scanner` — PII leak hunting
- `bfsi-performance-reviewer` — perf regressions

Returns merged report with merge recommendation.

### Before regulatory submission — compliance audit

```
/bfsi-audit rbi
```

Walks every RBI Annexure I control, checks for evidence in code, and produces a control-by-control report. Paste into audit deliverables.

### Generate an audit-friendly commit

After staging changes:

```
/bfsi-commit
```

Produces a Conventional Commit message with the right type:
- `feat` for new feature
- `fix` for bug fix
- `security:` for security tightening (references regulation)
- `compliance:` for compliance work (references control section)
- `audit:` for audit log changes

### Verify your project is healthy

```
/bfsi-doctor
```

Runs ~20 checks: Node version, dep versions, .claude config, hook registration, BFSI conventions, security baseline. Fix any ❌ first.

## Reference skills that auto-load

You don't invoke these directly — they load automatically when relevant:

| Skill | Loads when you ask about … |
|---|---|
| `bfsi-onboarding` | "how does this project work", "where do I start" |
| `bfsi-encrypt-helper` | encrypting data, decrypting data, Web Crypto API |
| `bfsi-test-pattern` | writing tests, test coverage, security tests |
| `bfsi-error-message` | error messages, error handling, error boundaries |

To see which reference skills are loaded in a session, run `/skills` (built-in Claude Code command).

## Hook behaviour you'll notice

When working in a BFSI project, you may see Claude blocked by hooks. This is intentional. Common blocks:

| Block reason | What to do |
|---|---|
| Tried to edit `.env*` | Edit manually outside Claude; never let Claude write secrets |
| Tried to `rm -rf` non-build path | Use `rm` (not `-rf`) or do it manually |
| Tried to `git push --force` to main/master/staging | Don't. Use a feature branch. |
| Write contained secret pattern | Move secret to env var; use placeholders in source |

These blocks are not personal — they protect every dev from a class of expensive mistake.

## Tips

- **Hooks add context.** Even on `PostToolUse`, hooks can tell Claude "by the way, the file you just wrote has a PII leak on line 42". Read Claude's responses for these messages.
- **Reference skills are silent allies.** When you ask "how do I handle this error", `bfsi-error-message` loads. You won't see it announced — but the answer will follow BFSI conventions.
- **Action skills require explicit invocation.** Claude won't run `/bfsi-feature` on its own — you have to type it. This is by design: scaffolding has side effects.
- **Restart Claude after editing skills/hooks.** Most edits are picked up live, but creating a new top-level skill folder needs a restart.
