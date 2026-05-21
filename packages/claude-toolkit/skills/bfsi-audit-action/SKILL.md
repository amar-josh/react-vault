---
name: bfsi-audit-action
description: Wraps a button, action handler, or mutation with audit logging — emits an event with actor / target / outcome metadata to the audit pipeline. Optional MFA slot for high-sensitivity actions. Use when the user types /bfsi-audit-action, asks to "audit this action", "add audit log to this button", "wrap with useAuditedAction", or "make this action compliance-traceable".
disable-model-invocation: true
argument-hint: <event-name> [--mfa] [--target <variable>]
allowed-tools: Read Edit Grep
---

# BFSI Audit Action

Wraps a state-changing action with an audit event. Audit logging is non-negotiable for BFSI state changes (RBI Annexure I §8, PCI-DSS req 10.2.x, SOC2 CC7.3).

## Arguments

- `$0` — event name following `<feature>.<entity>.<action>` (e.g. `kyc.submission.approved`, `transactions.transfer.initiated`). **Required.**
- `--mfa` — also gate the action behind a confirm-with-MFA step (uses `bfsi-confirm-modal` skill or a project-local equivalent).
- `--target <variable>` — JSX/JS expression referencing the resource being acted on (e.g. `user.id`, `kycRecord.id`). Used to populate the audit event's `target` field.

## What it does

Given a handler:

```tsx
const handleApprove = async () => {
  await approveKyc(record.id);
  toast.success('Approved');
};
```

Replaces with:

```tsx
const handleApprove = useAuditedAction(
  'kyc.submission.approved',
  async () => {
    await approveKyc(record.id);
    toast.success('Approved');
  },
  { target: { type: 'kyc_record', id: record.id } },
);
```

And, with `--mfa`:

```tsx
const handleApprove = useAuditedAction(
  'kyc.submission.approved',
  async () => {
    await approveKyc(record.id);
    toast.success('Approved');
  },
  {
    target: { type: 'kyc_record', id: record.id },
    requireMfa: true, // surfaces ConfirmModal with MFA before running
  },
);
```

## Event-name taxonomy

`<feature>.<entity>.<action>` — lowercase, dot-separated, **past-tense** action verb. This matches the audit-events reference at `bfsi-feature/references/audit-events.md`.

| Bad              | Good                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `approveKyc`     | `kyc.submission.approved`                                                                           |
| `transferMoney`  | `transactions.transfer.initiated` (NOT `.completed` — completion comes from backend acknowledgment) |
| `RESET_PASSWORD` | `auth.password.reset_requested`                                                                     |
| `dataExport`     | `audit.export.downloaded`                                                                           |

## Workflow

### Step 1 — Locate the handler

Grep the target file for the handler or onClick. If multiple, ask which.

### Step 2 — Determine the event name

If `$0` follows the taxonomy, use it verbatim. Otherwise validate and ask.

### Step 3 — Determine the target

If `--target` was provided, use it. Otherwise infer from surrounding context (e.g. handler scope captures `record`, `user`, `kyc`, etc.). Ask if ambiguous — guessing a wrong target is a bigger compliance problem than skipping the prop.

### Step 4 — Add the hook + import

```tsx
import { useAuditedAction } from '@/shared/audit/useAuditedAction';
// (planned in @<scope>/ui v0.2 — for now, use the project-local hook in src/shared/audit/)
```

### Step 5 — Wrap + verify

Edit the handler. Verify the surrounding component re-renders cleanly: `useAuditedAction` returns a stable callback (memoised internally), so the consumer should not need its own `useCallback`.

Run `pnpm typecheck`. The hook is generic over the wrapped function's signature, so type errors here usually mean the event-name or target shape is malformed.

### Step 6 — Verify the test

If a test for this handler exists, ensure it asserts the audit event is emitted (spy on the audit client). The `bfsi-test-pattern` skill has an example.

## Conventions enforced

- **Every state-changing UI action emits an audit event.** Reads do not (`kyc.list.viewed` is too noisy); reveals do (`data.pan.revealed` via `PIIMaskedDisplay`'s `onReveal`).
- **The event name is a constant**, not a template-literal — easier to grep, easier to assert in tests, easier for SIEM consumers.
- **Targets are typed**, not free-form strings. `{ type: 'kyc_record', id: 'abc' }`, not `'kyc_record:abc'`.
- **MFA is opt-in**, not default. Use `--mfa` for: financial transactions, permission changes, data exports, destructive actions (delete user, revoke session).
- **Never include PII in the event payload.** The target's `id` is fine; the target's PAN/Aadhaar is not. The audit client scrubs but write defensively.

## When NOT to use

- **Read-only actions** (viewing a list, opening a modal that only displays data).
- **Telemetry / UX events** — those go to product analytics, not the audit pipeline.
- **Inside a mutation that already uses `useAuditedMutation`** — that wraps the API call. Don't double-audit.

## References

- `bfsi-feature/references/audit-events.md` — the project's audit-event taxonomy.
- RBI Annexure I §8.x — Logging & monitoring; mandatory for state changes on customer data.
- PCI-DSS req 10.2.x — Audit trails for access to cardholder data.
