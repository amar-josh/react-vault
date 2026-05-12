# Audit Event Naming Convention

Every state-changing action emits an audit event. Names follow:

```
<feature>.<entity>.<action>
```

Examples:

- `kyc.verification.submitted`
- `kyc.verification.approved`
- `kyc.verification.rejected`
- `loan.application.created`
- `loan.application.documents_uploaded`
- `transaction.transfer.initiated`
- `transaction.transfer.confirmed`
- `user.profile.password_changed`
- `user.session.logged_in`
- `user.session.logged_out_idle`
- `data.account_number.revealed`
- `data.pan.revealed`

## Required event metadata

Every event must include:

| Field              | Source                              | Notes                                             |
| ------------------ | ----------------------------------- | ------------------------------------------------- |
| `event_id`         | UUID v4                             | Generated client-side                             |
| `event_name`       | string                              | e.g. `kyc.verification.submitted`                 |
| `actor_id`         | from session                        | User performing the action                        |
| `actor_session_id` | from session                        | Session correlation                               |
| `target_type`      | string                              | e.g. `kyc_verification`                           |
| `target_id`        | string                              | Resource ID                                       |
| `timestamp`        | ISO 8601                            | Client clock — backend re-stamps for legal record |
| `outcome`          | `success` \| `failure` \| `pending` | Always populated                                  |
| `request_hash`     | sha256                              | Of request body, for tamper detection             |
| `client_metadata`  | object                              | User agent, viewport — no PII                     |

## Reveal events

When a user reveals a masked PII field, fire:

```
data.<field>.revealed
```

With metadata `{ field, reason?, duration_ms }`. If `reason` is required by policy (e.g. for Aadhaar in some flows), the UI must prompt and include it.

## Failure events

For failed sensitive operations:

```
<feature>.<entity>.<action>_failed
```

With metadata including the error code (but NEVER the raw error message — that may contain PII).

## NEVER include in audit events

- Card numbers (raw or last-4)
- Passwords
- OTP codes
- Full PAN / Aadhaar (only masked, e.g. `****1234`)
- Full account numbers
- Free-text user input from forms (it might contain PII)

The `auditClient` in `@scope/core/audit` runs every payload through a PII scrubber before POST.
