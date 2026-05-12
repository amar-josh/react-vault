# @your-real-scope/core

Framework-agnostic BFSI security primitives. The "core" package every BFSI React project depends on.

```ts
import { aesgcm } from '@your-real-scope/core/encryption';
import { maskPan, isValidPan } from '@your-real-scope/core/pii';
import { AuditClient, generateEventId } from '@your-real-scope/core/audit';
import { createAxios, ApiError } from '@your-real-scope/core/http';
import { TokenManager, IdleTimer, CrossTabSync } from '@your-real-scope/core/auth';
import { put, get } from '@your-real-scope/core/storage';
import { generateCspNonce, buildCsp, toSafeView } from '@your-real-scope/core/compliance';
```

## Modules

- **`encryption`** — Web Crypto wrappers: AES-GCM 256, RSA-OAEP, PBKDF2, envelope encryption
- **`pii`** — Maskers (PAN, Aadhaar, account#, mobile, email, name, address, DOB) + validators (Verhoeff for Aadhaar) + regex patterns
- **`audit`** — Batched audit log client with PII scrubber, page-unload beacon, sessionStorage retry
- **`http`** — Configurable axios factory with composable interceptors (auth header, snake↔camel, idempotency key, error mapping)
- **`auth`** — `TokenManager` with refresh race protection, `IdleTimer`, `CrossTabSync` (BroadcastChannel)
- **`storage`** — Tiered: transient (memory), session (sessionStorage), persistent (encrypted IndexedDB — v0.2)
- **`compliance`** — CSP nonce + builder, safe-error envelope mapping `ApiError` → user-facing view

## Conventions

- **No React dependency.** This is the core. UI lives in `@your-real-scope/ui`.
- **All public APIs are typed.** No `any`.
- **Errors are typed (`ApiError`).** App code matches on `kind`, not strings.
- **PII never logged.** All logging paths route through the scrubber.
- **Tokens never in localStorage.** `TokenManager` keeps them in memory.

## Run

```bash
pnpm test            # vitest run
pnpm test:watch      # vitest watch
pnpm typecheck       # tsc --noEmit
pnpm build           # tsc → dist/
pnpm lint            # eslint
```
