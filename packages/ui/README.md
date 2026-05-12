# @rsense/bfsi-ui

React component library on top of Tailwind CSS + shadcn/ui, with BFSI-specific compositions.

```tsx
import { PIIMaskedDisplay, CurrencyDisplay, DateTimeDisplay, cn } from '@rsense/bfsi-ui';
import { tokens } from '@rsense/bfsi-ui/theme';

// PII masking with click-to-reveal + audit hook
<PIIMaskedDisplay
  type="pan"
  value={user.pan}
  auditTarget={{ type: 'user', id: user.id }}
  onReveal={() => auditClient.record({ event_name: 'data.pan.revealed', ... })}
/>

// Locale-aware money + dates
<CurrencyDisplay value={1234567.89} />            // ₹12,34,567.89
<DateTimeDisplay value={tx.createdAt} preset="datetime" />  // IST
```

## What's inside (v0.1)

- `PIIMaskedDisplay` — click-to-reveal PII display with auto re-mask + audit callback
- `CurrencyDisplay` — Intl-based currency formatter, INR/en-IN default, accounting style option
- `DateTimeDisplay` — Intl-based date/time formatter, IST default
- `cn` — class-name composer (clsx + tailwind-merge)
- `tokens` — BFSI design tokens (status colours, sensitivity tiers)

## Coming in v0.2

- `ConfirmModal` — confirmation modal with optional MFA challenge slot
- `SecureFormField` — RHF integration with autocomplete=off + paste guards
- `AuditedAction` — wraps a button to emit audit event on click
- `AccessControlledTable` — data table with column-level RBAC + export controls
- `StatusBadge` — KYC / transaction / audit status indicator
- `DocumentUploader` — file upload with MIME validation + virus-scan hook
- `SignatureCapture` — e-signature stub for IRDAI flows
- `PCITokenizedCardInput` — PCI-DSS-compliant iframe for card capture

The full shadcn/ui primitive set (Button, Input, Dialog, Toast, Combobox, etc.) gets installed by the CLI generator into each scaffolded app's `src/components/ui/` — apps own those copies.

## Conventions

- All components are typed; no `any`.
- All interactive elements have proper a11y (`aria-*`, focus styles, keyboard).
- All BFSI components emit `data-target-type` / `data-target-id` so screenshot diffing + audit replay can correlate.
- All formatters fall back gracefully on null/undefined/NaN to `—`.
