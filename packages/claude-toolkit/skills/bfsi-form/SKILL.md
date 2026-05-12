---
name: bfsi-form
description: Creates a React Hook Form + Zod form with BFSI-secure defaults (no autocomplete on PII fields, paste prevention on sensitive inputs, audit on submit, error masking). Use when the user types /bfsi-form, asks to "create a form", "add a form to this page", "build a KYC form", or "scaffold a transfer form".
disable-model-invocation: true
argument-hint: <FormName> [--fields "name:type,..."]
allowed-tools: Read Write Edit Glob Grep
---

# BFSI Form Scaffold

Generates a `react-hook-form` + `zod` form with BFSI-secure defaults wired into shadcn/ui's `<Form>` primitives.

## What it adds

```
<TargetFile>.tsx
└── <FormName>Form               # Container component
    ├── useFormWithZod()         # from @scope/ui
    ├── audit-wrapped onSubmit   # via useAuditedAction
    ├── PIIMaskedDisplay         # auto-wrap for fields matching PII pattern
    └── BFSI defaults:
        ├── autocomplete="off" on PII fields
        ├── onPaste guards on sensitive inputs
        ├── inputMode + pattern for known formats (PAN, Aadhaar, mobile)
        ├── error messages from i18n keys (never raw)
        └── submit disabled while !isDirty || !isValid || isSubmitting
```

## Workflow

### Step 1: Determine field set

If `--fields` is provided, parse it (`name:type` comma-separated, e.g. `pan:string,amount:number,date:date`).
Otherwise, ask the user (via prompt in chat) which fields they need.

### Step 2: Build the Zod schema

For each field, choose a base from BFSI presets:

- `pan` → `z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, t('error.pan_invalid'))`
- `aadhaar` → `z.string().regex(/^\d{12}$/).refine(verhoeff)`
- `mobile` → `z.string().regex(/^[6-9]\d{9}$/)`
- `email` → `z.string().email()`
- `amount` → `z.number().positive().multipleOf(0.01)`
- `account_number` → `z.string().regex(/^\d{9,18}$/)`
- `ifsc` → `z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)`
- `date` → `z.coerce.date()`

If a field name doesn't match a preset, fall back to `z.string().min(1)` and flag it for review.

### Step 3: Generate the form component

Use the template at `references/templates/form.tsx.tpl`. Imports from `@scope/ui` and `@scope/core`. Submit handler uses `useAuditedAction("<feature>.<form>.submitted")`.

### Step 4: Add i18n keys

Add label/placeholder/error keys to the project's translation files (en.json + hi.json placeholder).

### Step 5: Verify

Run `pnpm typecheck` on the new file. If `useFormWithZod` import fails, the project doesn't have `@scope/ui` installed — tell the user to install it.

## Conventions

- **Never** capture card numbers or CVVs in a regular form. Use `<PCITokenizedCardInput>` from `@scope/ui` which embeds a PCI-compliant iframe.
- **Never** persist form drafts of PII fields to localStorage. Use `sessionStorage` with the `secureStorage` wrapper from `@scope/core/storage`.
- **Submit handler returns a Promise.** Errors thrown inside it are caught by the form, surfaced via toast, and audited as `<form>.submission_failed`.

## References

- Templates: [`references/templates/`](references/templates/)
- Validation regex catalogue: [`references/validation-regex.md`](references/validation-regex.md)
- shadcn/ui Form primer: https://ui.shadcn.com/docs/components/form
