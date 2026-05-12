# Compliance — control mapping

How the starter maps to specific regulatory controls. This is **evidence preparation**, not formal compliance attestation. Use for internal audit, RFP responses, and as a reviewer's checklist.

## RBI Cyber Security Framework (Annexure I — Baseline)

| § | Control | Evidence in starter |
|---|---|---|
| 1.x | Network security | (backend) — out of scope for frontend |
| 2.x | Inventory & data classification | `@rsense/bfsi-core/pii` patterns catalog; `<PIIMaskedDisplay>` data-attrs |
| 3.x | Logical access control | `<ProtectedRoute permission="...">` + `<CanAccess>` |
| 4.x | Encryption | `@rsense/bfsi-core/encryption` (AES-GCM 256, RSA-OAEP, envelope) |
| 5.x | Vulnerability management | GitHub Actions: `pnpm audit --audit-level=high`, gitleaks scan |
| 6.x | Authentication | `TokenManager` (JWT + refresh) + `IdleTimer` + `CrossTabSync` |
| 6.2 | Idle timeout | `<ProtectedRoute idleTimeoutMs>` per-route override; sensitive routes 5min |
| 7.x | Application security | Zod parse on all API responses; protect-files hook; no `dangerouslySetInnerHTML` |
| 8.x | Logging & monitoring | `@rsense/bfsi-core/audit` AuditClient (batched, PII-scrubbed) |
| 9.x | Customer education | (marketing/copy) — out of scope |
| 10.x | Incident response | ErrorBoundary + Sentry stub + audit `*_failed` events |
| 11.x | Phishing | (mostly backend + ops) — no inline forms; HTTPS-only via vite headers |
| 12.x | Forensic readiness | Audit events retain `event_id`, `request_hash`, `actor_session_id` |

Run `/bfsi-audit rbi` to get a control-by-control evidence report for the current branch.

## PCI-DSS v4.0 (frontend-relevant)

| Req | Control | Evidence |
|---|---|---|
| 3.4 | No PAN in plaintext storage/display | `<PCITokenizedCardInput>` (v0.2 — for now: convention + reviewer agent flag) |
| 4.x | Strong crypto in transit | HSTS + secure cookies via deploy edge; Vite security headers |
| 6.2 | Patched dependencies | `pnpm audit` in CI |
| 6.5.1 | Injection flaws | Zod parse; no string SQL; no `eval` (code-reviewer flag) |
| 6.5.7 | XSS | No `dangerouslySetInnerHTML` unsanitised; CSP from `@rsense/bfsi-core/compliance/csp` |
| 6.5.10 | Broken authentication | Idle timeout; refresh race protection; cross-tab logout |
| 8.2.x | MFA for admin actions | `<ConfirmModal mfa>` slot (v0.2) |
| 10.2.x | Audit trails | `useAuditedMutation` + `useAuditedAction` |

## IRDAI Information & Cyber Security Guidelines

| § | Control | Evidence |
|---|---|---|
| 4.1 | Access control | `<ProtectedRoute>` + `<CanAccess>` |
| 4.4 | Data protection | PII masking; `secureStorage` for sensitive data |
| 5.2 | Application security | Same as PCI 6.5.x |
| 5.4 | Audit trails | Same as RBI §8 |
| 6.x | Document handling | `<DocumentUploader>` (v0.2 — MIME validation, virus-scan hook) |
| 7.x | E-signature | `<SignatureCapture>` (v0.2) |

## SOC2 Trust Services Criteria

| TSC | Control | Evidence |
|---|---|---|
| CC6.1 | Logical access | Auth + RBAC |
| CC6.6 | Encryption at rest (client side) | `secureStorage` (memory-first, encrypted IDB in v0.2) |
| CC7.2 | Audit log integrity | `event_id`, `request_hash`; immutable on backend |
| CC7.3 | Detection & response | Audit + ErrorBoundary + Sentry |
| PI1.1 | Processing integrity | Zod parse on every API response |

## ISO 27001:2022 (Annex A — technical)

| A.5/A.8 | Control | Evidence |
|---|---|---|
| A.5.15 | Access control | Auth + RBAC |
| A.5.34 | Privacy & protection of PII | PII masking + scrubber |
| A.8.24 | Use of cryptography | AES-GCM 256, RSA-OAEP, PBKDF2 |
| A.8.28 | Secure coding | ESLint strict rules + code-reviewer agent |

## How to run a compliance audit

```bash
claude                           # in your scaffolded project
/bfsi-audit rbi                  # default: RBI Annexure I
/bfsi-audit pci                  # PCI-DSS frontend controls
/bfsi-audit irdai                # IRDAI
/bfsi-audit soc2                 # SOC2
/bfsi-audit all                  # all of the above (slower)
```

Output: control-by-control evidence report. Paste into compliance dashboard or audit reply.

## What this does NOT cover

- Backend / server-side controls (those need a backend audit)
- Penetration testing (commission separately, ~annually)
- Third-party SAST/DAST (run alongside CI)
- Process controls (incident response runbooks, training records)
- Physical security
- Vendor risk management
- Business continuity
