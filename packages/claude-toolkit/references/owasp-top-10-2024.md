# OWASP Top 10 — 2025 Edition

> **Source:** OWASP Foundation — [owasp.org/Top10](https://owasp.org/Top10/) > **Edition documented:** 2025
> **Why this edition:** [owasp.org/Top10/](https://owasp.org/Top10/) redirects to `/Top10/2025/` and [owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/) states "The most current released version is the OWASP Top Ten 2025." The 2021 edition is still widely referenced in compliance frameworks; a 2025↔2021 cross-reference is included at the end of this file.
> **Filename note:** This file is named `owasp-top-10-2024.md` per the toolkit's request; the content documents the **2025** edition. OWASP never published a "2024" edition (the releases are 2017, 2021, 2025). Rename to `owasp-top-10-2025.md` if you want the filename to match.
> **Retrieved:** 2026-05-21
> **License:** OWASP content is CC BY-SA 4.0; descriptions and prevention text are quoted or close paraphrases of the OWASP pages, redistributed under the same license with attribution.

---

## How to cite

Use `OWASP A<NN>:<year>`, e.g. `OWASP A01:2025`. When pinning to the older edition, use `OWASP A01:2021`.

## Quick map: OWASP 2025 → BFSI toolkit primitives

| OWASP 2025                                 | Existing toolkit primitive                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| A01 Broken Access Control                  | `<ProtectedRoute permission=...>`, `bfsi-protected-route`, `bfsi-security-reviewer`     |
| A02 Security Misconfiguration              | `protect-files.sh`, `block-destructive.sh`, `block-force-push.sh`, `bfsi-doctor`        |
| A03 Software Supply Chain Failures         | `pnpm audit`, `scan-secrets.sh`, `bfsi-commit` (signed), `bfsi-architect`               |
| A04 Cryptographic Failures                 | `@<scope>/core/encryption`, `bfsi-encrypt-helper`, `bfsi-pii-field`, `bfsi-pii-scanner` |
| A05 Injection                              | Zod parse-on-response, `dangerouslySetInnerHTML` ban, no `eval`, `bfsi-form`            |
| A06 Insecure Design                        | `bfsi-architect` agent, `bfsi-onboarding`, `bfsi-feature` scaffold                      |
| A07 Authentication Failures                | `bfsi-confirm-modal` (MFA), `useAuditedAction --mfa`, `<ProtectedRoute>`                |
| A08 Software or Data Integrity Failures    | `bfsi-commit` (signed), `block-force-push.sh`, `protect-files.sh`                       |
| A09 Security Logging and Alerting Failures | `useAuditedMutation`, `useAuditedAction`, `bfsi-audit-action`, `audit-prompt.sh`        |
| A10 Mishandling of Exceptional Conditions  | `bfsi-error-message`, RTK Query / TanStack `onError`, `bfsi-test-pattern`               |

---

## A01:2025 – Broken Access Control

**CWE mapping (selected from 40):** CWE-22 Path Traversal, CWE-200 Exposure of Sensitive Information, CWE-201 Insertion of Sensitive Information into Sent Data, CWE-276 Incorrect Default Permissions, CWE-284 Improper Access Control, CWE-285 Improper Authorization, CWE-352 CSRF, CWE-425 Direct Request (Forced Browsing), CWE-538 Insertion of Sensitive Information into Externally-Accessible File, CWE-552 Files or Directories Accessible to External Parties, CWE-601 Open Redirect, CWE-639 IDOR, CWE-668 Exposure of Resource to Wrong Sphere, CWE-732 Incorrect Permission Assignment, CWE-862 Missing Authorization, CWE-863 Incorrect Authorization, CWE-918 SSRF (folded into A01 in 2025), CWE-1275 Sensitive Cookie with Improper SameSite.

### Description

Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically result in unauthorized information disclosure, modification, or destruction, or in performing functions beyond the user's limits. Common weaknesses include violating least privilege; bypassing checks by modifying URLs, internal state, or HTML, or by using an API tool; insecure direct object references that let one user view or edit another's records; missing controls on POST/PUT/DELETE endpoints; elevation of privilege; metadata manipulation such as replaying or tampering with JWT claims, cookies, or hidden fields; CORS misconfigurations exposing protected APIs to untrusted origins; and forced browsing to pages that should require authentication or higher privilege. SSRF is consolidated into A01 in 2025 because the root weakness — a server acting on a resource the requester should not reach — is the same.

### How to prevent

Access control only works in trusted server-side or serverless code that the client cannot modify. Implement deny-by-default for non-public resources; build access control once and reuse it; enforce record ownership in the data model; minimize CORS usage; disable directory listing; log access-control failures and alert on repeats; rate-limit APIs to blunt automated tooling; invalidate stateful session IDs at logout and keep stateless JWTs short-lived with a revocation path; and ship functional access-control tests in CI.

### Frontend implications (this toolkit)

- Client-side route guards (`<ProtectedRoute>`) are UX hints; the API must re-check every permission.
- Never derive authorization from URL params or hidden fields — the server must derive the actor from the session.
- Prefer opaque IDs over sequential ones in URLs to reduce IDOR enumeration value.
- Avoid storing privileged JWT claims in `localStorage` — an XSS bug becomes an access-control compromise.

### Mapped toolkit primitive

`<ProtectedRoute permission=...>`, the `bfsi-protected-route` skill, `bfsi-security-reviewer` agent.

### Common attack patterns (prose only — no payload literals)

- Forced browsing via direct URL manipulation to reach pages above the user's role.
- Tampering with hidden form fields, request bodies, or JWT claims to elevate privilege.
- IDOR enumeration by swapping object identifiers in URLs.
- CSRF against authenticated cookies lacking SameSite or anti-CSRF tokens.
- Open-redirect abuse via return-URL parameters after legitimate auth.
- SSRF where the server is induced to fetch internal metadata or peer systems.

---

## A02:2025 – Security Misconfiguration

**CWE mapping:** CWE-15 External Control of System or Configuration Setting, CWE-16 Configuration, CWE-260 Password in Configuration File, CWE-315 Cleartext Storage in a Cookie, CWE-489 Active Debug Code, CWE-526 Cleartext Storage in Environment Variable, CWE-611 XXE, CWE-614 Sensitive Cookie Without Secure Attribute, CWE-942 Permissive Cross-domain Policy with Untrusted Domains, CWE-1004 Sensitive Cookie Without HttpOnly.

### Description

Security misconfiguration is when a system, application, or cloud service is set up incorrectly from a security perspective, creating vulnerabilities. Applications are vulnerable when they lack appropriate hardening across any part of the stack, have unnecessary features enabled, retain default credentials, expose detailed error messages including stack traces, fail to configure secure values across servers, frameworks, libraries, and databases, or omit security headers and directives. Without a repeatable hardening process, systems drift from a known-good baseline.

### How to prevent

Use a repeatable hardening process so any environment can be brought up locked down by default, with identical settings across dev, QA, and prod (different credentials). Ship a minimal platform with no unused features, components, samples, or documentation. Review configuration as part of patch management — especially cloud storage permissions. Segment the architecture between components or tenants. Send security directives to the client (headers, CSP). Use identity federation, short-lived credentials, or platform-provided role-based access instead of embedding static secrets in code. Automate verification of configuration in every environment.

### Frontend implications (this toolkit)

- Production builds must not ship source maps or `.env` files; CI should fail if they leak.
- Security headers (CSP, HSTS, Referrer-Policy, X-Frame-Options) are set at the edge but constrain the SPA's inline-script and style strategy.
- Disable verbose error overlays in production; never leak stack traces to users.
- Auth cookies must carry `Secure`, `HttpOnly`, and `SameSite=Lax` or stricter — verify via smoke test.

### Mapped toolkit primitive

`protect-files.sh`, `block-destructive.sh`, `block-force-push.sh`, and the `bfsi-doctor` command for environment audit.

### Common attack patterns (prose only — no payload literals)

- Default credentials left enabled on cloud consoles or admin panels.
- Verbose error pages leaking framework versions, file paths, or stack traces.
- Overly permissive CORS allowing untrusted origins to read authenticated responses.
- Misconfigured cloud storage exposing internal documents via a default-permissive ACL.
- Missing CSP and HSTS, enabling clickjacking or mixed-content downgrade.

---

## A03:2025 – Software Supply Chain Failures

**CWE mapping:** CWE-447 Use of Obsolete Function, CWE-1035 Using Components with Known Vulnerabilities, CWE-1104 Use of Unmaintained Third-Party Components, CWE-1329 Reliance on Component That Is Not Updateable, CWE-1357 Reliance on Insufficiently Trustworthy Component, CWE-1395 Dependency on Vulnerable Third-Party Component.

### Description

Software supply chain failures are breakdowns or other compromises in the process of building, distributing, or updating software. They typically stem from issues within third-party code, tools, or dependencies. Risk factors include failing to track component versions, using unsupported or outdated software, neglecting vulnerability scanning, lacking change management, insufficient access controls in source and artifact systems, weak CI/CD security, and delayed patching. The 2025 edition broadens the older "Vulnerable and Outdated Components" category to encompass the full producer-to-consumer pipeline: typosquatted packages, maintainer takeovers, compromised build infrastructure, and unsigned release artifacts.

### How to prevent

Generate centralized SBOMs and continuously inventory direct and transitive dependencies. Subscribe to CVE/NVD alerts and integrate SCA tooling into CI. Obtain components only from trusted repositories over secure links, and prefer signed packages. Use staged rollouts. Harden code repositories with MFA, branch protection, and signed commits. Secure developer workstations and build servers. Maintain immutable artifacts with provenance signing (e.g. SLSA, sigstore). Establish ongoing monitoring rather than one-time audits.

### Frontend implications (this toolkit)

- `pnpm audit` runs on every PR; high/critical findings block merge unless explicitly waived.
- Lockfile diffs that touch undeclared dependencies are a supply-chain red flag.
- Avoid runtime CDN scripts; if unavoidable, pin them with Subresource Integrity (SRI) hashes.
- Treat new dependencies as privilege grants — even a transitive ESLint plugin runs at install time.

### Mapped toolkit primitive

`pnpm audit` workflow, `scan-secrets.sh`, `bfsi-commit` (signed commits), and `bfsi-architect` for vendor review.

### Common attack patterns (prose only — no payload literals)

- Typosquatting on package registries.
- Compromised maintainer accounts pushing a backdoored release.
- Build-pipeline compromise producing a malicious artifact from clean source.
- Dependency confusion resolving an internal name to a public attacker-owned package.
- Unpatched known-vulnerable transitive dependencies because no SCA tooling flags them.

---

## A04:2025 – Cryptographic Failures

**CWE mapping:** CWE-261 Weak Encoding for Password, CWE-296 Improper Certificate Chain Validation, CWE-319 Cleartext Transmission, CWE-321 Hard-coded Cryptographic Key, CWE-323 Reusing a Nonce/Key Pair, CWE-326 Inadequate Encryption Strength, CWE-327 Broken or Risky Algorithm, CWE-328 Use of Weak Hash, CWE-329 Generation of Predictable IV with CBC Mode, CWE-330 Insufficiently Random Values, CWE-338 Cryptographically Weak PRNG, CWE-347 Improper Signature Verification, CWE-523 Unprotected Transport of Credentials, CWE-916 Password Hash With Insufficient Computational Effort, CWE-1240 Use of a Risky Cryptographic Primitive.

### Description

This category covers failures related to the lack of cryptography, insufficiently strong cryptography, leaking of cryptographic keys, and related errors. Concerns include unencrypted data in transit or at rest; outdated algorithms; weak, default, or hard-coded keys; credentials embedded in source; missing enforcement of encryption (plaintext fallbacks); improper certificate validation; predictable initialization vectors; weak password hashing; and exploitable cryptographic error messages that leak success/failure side channels. Sensitive data (passwords, payment card numbers, health records, personal information, business secrets) requires extra protection under regulations like GDPR and PCI DSS.

### How to prevent

Classify data by sensitivity and regulatory scope and don't store it unnecessarily — discard or tokenize. Encrypt all sensitive data at rest. Encrypt all data in transit with TLS 1.2+ and forward secrecy; enforce with HSTS. Disable caching for sensitive responses. Use strong, salted, adaptive password hashes — Argon2, yescrypt, scrypt, bcrypt, or PBKDF2-HMAC-SHA-512 — with a work factor tuned to current hardware. Choose IVs appropriate to the mode and never reuse a nonce under the same key. Prefer authenticated encryption (AES-GCM, ChaCha20-Poly1305). Generate keys cryptographically and store them in HSMs or platform key stores. Avoid MD5, SHA-1, CBC without integrity, and PKCS#1 v1.5. Plan crypto-agility now for post-quantum migration by 2030.

### Frontend implications (this toolkit)

- Never roll your own crypto; use WebCrypto or vetted libraries, not obscure npm packages.
- Sensitive data must not be cached by service workers or stored in `localStorage` / IndexedDB in plaintext.
- TLS is non-negotiable, even on internal networks.
- Tokens must not appear in URLs (they end up in history and referer headers) — use `Authorization` headers or HttpOnly cookies.

### Mapped toolkit primitive

`@<scope>/core/encryption` (AES-GCM helpers), the `bfsi-encrypt-helper` skill, `bfsi-pii-field` for marking encrypted-at-rest fields, and `bfsi-pii-scanner` for accidental plaintext PII detection.

### Common attack patterns (prose only — no payload literals)

- Network sniffing on a downgrade-vulnerable TLS connection to recover session credentials.
- Offline cracking of a leaked password database using fast unsalted hashes.
- Recovering plaintext from CBC-mode ciphertext via padding-oracle behavior in error responses.
- Recovering a hard-coded API key from a frontend bundle, source map, or container layer.
- Token forgery because the verifier accepts the `none` algorithm or a weak shared secret.

---

## A05:2025 – Injection

**CWE mapping (selected):** CWE-20 Improper Input Validation, CWE-74 Improper Neutralization in Output, CWE-77 Command Injection, CWE-78 OS Command Injection, CWE-79 XSS, CWE-88 Argument Injection, CWE-89 SQL Injection, CWE-90 LDAP Injection, CWE-91 XML/XPath Injection, CWE-94 Code Injection, CWE-95 Eval Injection, CWE-113 HTTP Response Splitting, CWE-116 Improper Encoding or Escaping of Output, CWE-470 Unsafe Reflection, CWE-643 XPath Injection, CWE-917 Expression Language Injection.

### Description

An injection vulnerability is an application flaw that allows untrusted user input to be sent to an interpreter and causes the interpreter to execute parts of that input as commands. Applications are vulnerable when user-supplied data lacks proper validation, filtering, or sanitization; when dynamic queries or non-parameterized calls are used directly; when unsanitized data is used in ORM search parameters; or when hostile data is concatenated into commands so the interpreter cannot tell code from data. Common injection types include SQL, NoSQL, OS command, ORM, LDAP, Expression Language, and Cross-Site Scripting. Detection combines source-code review with automated testing of every parameter, header, URL component, cookie, JSON, SOAP, and XML input — SAST, DAST, and IAST in CI/CD catch flaws before production.

### How to prevent

The preferred prevention is to keep data separate from commands and queries: use a safe API that avoids the interpreter, provides parameterized interfaces, or migrates to ORMs. When parameterized stored procedures are used, ensure they don't concatenate queries or execute hostile data. Use positive (allow-list) server-side input validation as a complement, not a sole defense. Escape residual dynamic-query inputs with interpreter-specific syntax (note: SQL structure such as table and column names cannot be escaped). Use `LIMIT` and similar query controls to cap blast radius. For XSS specifically: prefer auto-escaping templating (React's JSX escapes by design), avoid `dangerouslySetInnerHTML`, and apply CSP as defense in depth.

### Frontend implications (this toolkit)

- React's JSX escapes by default — the dangerous patterns are `dangerouslySetInnerHTML`, `eval`, `new Function(...)`, and direct DOM writes (`innerHTML`, `outerHTML`, `document.write`). All banned via ESLint and PR review.
- Zod `parse`-on-response validates payload shape — defensive even against a compromised upstream returning unexpected types.
- URL parameters in query strings must be `encodeURIComponent`-encoded and never interpolated into HTML attributes raw.
- Markdown or rich-text must use a sanitizing renderer; raw HTML pass-through is forbidden by default.

### Mapped toolkit primitive

Zod parse-on-response in API hooks, ESLint ban on `dangerouslySetInnerHTML` and `eval`, the `bfsi-form` skill (enforces Zod schemas), and `bfsi-security-reviewer`.

### Common attack patterns (prose only — no payload literals)

- Reflected XSS where attacker-supplied content from a query string is rendered into the page without escaping.
- Stored XSS where attacker content (comment, profile field) is persisted and runs for every viewer.
- SQL injection where unescaped input alters query structure, leading to data exfiltration or auth bypass.
- NoSQL or ORM injection where operator-shaped objects in unvalidated input alter query semantics.
- Server-side template or expression-language injection where user input is evaluated by a templating engine.
- OS-command injection where input is concatenated into a shell command instead of passed as an argv array.

---

## A06:2025 – Insecure Design

**CWE mapping (selected from 39):** CWE-73 External Control of File Name or Path, CWE-256 Plaintext Storage of a Password, CWE-269 Improper Privilege Management, CWE-311 Missing Encryption of Sensitive Data, CWE-312 Cleartext Storage of Sensitive Information, CWE-362 Race Condition, CWE-434 Unrestricted File Upload, CWE-501 Trust Boundary Violation, CWE-522 Insufficiently Protected Credentials, CWE-602 Client-Side Enforcement of Server-Side Security, CWE-653 Improper Isolation, CWE-656 Reliance on Security Through Obscurity, CWE-657 Violation of Secure Design Principles, CWE-799 Improper Control of Interaction Frequency, CWE-841 Improper Enforcement of Behavioral Workflow, CWE-1021 Clickjacking, CWE-1022 Untrusted `window.opener` Access.

### Description

Insecure design is a broad category representing different weaknesses, expressed as "missing or ineffective control design." It distinguishes design flaws from implementation flaws — a perfect implementation of a flawed design is still insecure. Three foundational components are required: requirements and resource management (capturing protection needs for confidentiality, integrity, availability, and authenticity alongside business requirements, and budgeting for security across phases); secure design (a methodology integrating threat modeling into development cycles and documenting failure states); and a secure development lifecycle (secure patterns, vetted libraries, incident post-mortems, and security specialists engaged throughout the project, not bolted on at the end).

### How to prevent

Establish a secure development lifecycle with AppSec professionals. Build a library of secure design patterns or paved-road components. Use threat modeling for critical authentication, access-control, business-logic, and key flows. Integrate security language into user stories. Add plausibility checks at each tier. Write unit and integration tests covering misuse cases, not just happy paths. Segregate tier layers by exposure. Segregate tenants robustly throughout. Limit resource consumption per user or service.

### Frontend implications (this toolkit)

- Design reviews must address failure modes: API down, payment partially succeeds, user double-submits — the UI must fail closed, not optimistically.
- "Hidden because unauthorized" is not a control; the API must reject manual requests regardless of UI state.
- Threat-model before scaffolding: which steps need MFA, which need a confirm modal, which need an audit trail.
- Rate limiting, CAPTCHA, exponential back-off, and idempotency keys must be designed in for state-changing endpoints, not retrofitted.

### Mapped toolkit primitive

The `bfsi-architect` agent (design review), `bfsi-onboarding` skill (forces a threat-model questionnaire on new features), and `bfsi-feature` scaffold (bakes in audit, confirm-modal, and protected-route hooks).

### Common attack patterns (prose only — no payload literals)

- Business-logic abuse — legitimate API calls performed in an unintended order to bypass a check.
- Workflow bypass via direct API calls that skip intermediate UI states the design implicitly relied on.
- Rate-unlimited password-reset endpoints abused for enumeration or denial of service.
- Clickjacking where a sensitive UI is framed inside an attacker page.
- Insufficient tenant isolation where data segregation depends on a client-supplied tenant ID.

---

## A07:2025 – Authentication Failures

**CWE mapping (selected from 36):** CWE-258 Empty Password in Configuration File, CWE-259 Hard-coded Password, CWE-287 Improper Authentication, CWE-288 Authentication Bypass via Alternate Path, CWE-294 Authentication Bypass by Capture-Replay, CWE-295 Improper Certificate Validation, CWE-306 Missing Authentication for Critical Function, CWE-307 Improper Restriction of Excessive Authentication Attempts, CWE-308 Use of Single-Factor Authentication, CWE-384 Session Fixation, CWE-521 Weak Password Requirements, CWE-613 Insufficient Session Expiration, CWE-620 Unverified Password Change, CWE-640 Weak Password Recovery, CWE-798 Hard-coded Credentials, CWE-940 Improper Verification of Source of a Communication Channel, CWE-1390 Weak Authentication, CWE-1392 Use of Default Credentials.

### Description

When attackers can trick a system into recognizing invalid users as legitimate, authentication vulnerabilities exist. Weaknesses include: permitting automated attacks such as credential stuffing from breached username/password lists; permitting brute-force; permitting default, weak, or well-known passwords; using weak credential-recovery and forgot-password processes (knowledge-based answers cannot be made safe); plaintext or weakly hashed password storage; missing or ineffective multi-factor authentication; exposing session identifiers in URLs; reusing session identifiers after login; failing to invalidate sessions at logout or after inactivity, especially in SSO; and failing to verify scope or claims on JWT-style tokens on every request.

### How to prevent

Implement multi-factor authentication wherever possible to defeat automated credential stuffing, brute force, and reused-credential attacks. Do not ship with default credentials. Test new and changed passwords against the top 10,000 worst-passwords list and against known-breached corpora (e.g. haveibeenpwned.com). Align with NIST 800-63b — modern guidance prefers length over complexity and recommends against forced periodic rotation. Harden registration, recovery, and API paths against account enumeration with uniform responses. Limit or increasingly delay failed login attempts without creating denial-of-service. Log failures and alert on credential-stuffing patterns. Use a server-side session manager that generates a new high-entropy session ID after login, kept out of URLs and invalidated at logout and after idle/absolute timeouts. Verify JWT scope and claims on every request.

### Frontend implications (this toolkit)

- Use HttpOnly cookies for session tokens; if a JWT must live in JavaScript, use short-lived access tokens with rotating refresh tokens.
- Step-up MFA (confirm-modal with OTP/WebAuthn) must gate every privileged action — not just login.
- The "forgot password" UX must not reveal whether an email is registered.
- Client-side throttling on login is UX padding only — enforcement must be server-side.

### Mapped toolkit primitive

`bfsi-confirm-modal` (step-up MFA UI), `useAuditedAction --mfa` (forces an MFA challenge before high-risk actions), `<ProtectedRoute>` for session-aware routing.

### Common attack patterns (prose only — no payload literals)

- Credential stuffing using a leaked password corpus against the login endpoint.
- Brute force against accounts without per-account lockout or rate limiting.
- Session fixation where the attacker plants a known session identifier on the victim.
- Account takeover via a weak forgot-password flow (predictable reset tokens, knowledge-based answers).
- JWT confusion — accepting `none` algorithm tokens or tokens signed with recovered key material.

---

## A08:2025 – Software or Data Integrity Failures

**CWE mapping:** CWE-345 Insufficient Verification of Data Authenticity, CWE-353 Missing Support for Integrity Check, CWE-426 Untrusted Search Path, CWE-494 Download of Code Without Integrity Check, CWE-502 Deserialization of Untrusted Data, CWE-506 Embedded Malicious Code, CWE-565 Reliance on Cookies Without Validation, CWE-784 Reliance on Cookies Without Validation in a Security Decision, CWE-829 Inclusion of Functionality from Untrusted Control Sphere, CWE-830 Inclusion of Web Functionality from an Untrusted Source, CWE-915 Improperly Controlled Modification of Dynamically-Determined Object Attributes.

### Description

Software and data integrity failures relate to code and infrastructure that does not protect against invalid or untrusted code or data being treated as trusted and valid. Vulnerability areas include: applications relying on plugins, libraries, or modules from untrusted sources or CDNs; insecure CI/CD pipelines allowing unauthorized access, malicious code injection, or system compromise; auto-update functionality downloading updates without sufficient integrity verification; and objects or data serialized into a structure an attacker can modify, leading to insecure deserialization. A08 overlaps with but is distinct from A03 Supply Chain Failures: A03 covers the producer side (the package, its build, its provenance), while A08 covers the consumer side (the integrity controls and trust decisions made when receiving and executing code or data).

### How to prevent

Use digital signatures or equivalent mechanisms to verify software and data come from the expected source unmodified. Restrict library consumption to trusted repositories; consider an internal vetted mirror for higher-risk profiles. Use SCA tooling (OWASP Dependency-Check, CycloneDX) to find known-vulnerable components. Enforce code- and configuration-review processes. Apply segregation, configuration, and access control to CI/CD. Reject unsigned or unencrypted serialized data from untrusted sources without an integrity check or signature.

### Frontend implications (this toolkit)

- External scripts (analytics, marketing tags, A/B testing) must use Subresource Integrity (SRI) hashes.
- Build pipelines must produce signed artifacts and deployment must verify the signature — "we trust the runner" is not an integrity control.
- Avoid `JSON.parse` on untrusted blobs where shape drives logic; Zod or equivalent should be the gatekeeper.
- Remote-config or feature-flag payloads driving privileged behavior must be signed.

### Mapped toolkit primitive

`bfsi-commit` (signed, traceable commits), `block-force-push.sh` (prevents audit-erasing history rewrites), `protect-files.sh` (locks down audit-relevant files).

### Common attack patterns (prose only — no payload literals)

- Insecure deserialization that instantiates types with side effects when an attacker-shaped payload is parsed.
- Auto-update fetching an unsigned binary over the network and executing it.
- Build-pipeline compromise injecting a line into a JS bundle which is then signed and shipped as legitimate.
- CDN-hosted dependency without SRI, swapped at the CDN tier.
- Client-side trust of a cookie or JWT whose integrity was never verified after a transformation step.

---

## A09:2025 – Security Logging and Alerting Failures

**CWE mapping:** CWE-117 Improper Output Neutralization for Logs, CWE-221 Information Loss or Omission, CWE-223 Omission of Security-relevant Information, CWE-532 Insertion of Sensitive Information into Log File, CWE-778 Insufficient Logging.

### Description

Without logging and monitoring, attacks and breaches cannot be detected, and alerting gaps impede incident response. The category covers: inconsistent or missing logging of auditable events like logins, failed authentication, and high-value transactions; warnings and errors that produce no, inadequate, or unclear log messages; logs of applications and APIs that are not monitored for suspicious activity; logs stored only locally; missing or inappropriate alert thresholds and escalation; inability to detect or escalate active attacks in real time; sensitive information exposed to users or in log files; injection vulnerabilities in the logging system itself; missing error and exception logging; outdated alert use cases; and alert fatigue from false positives overwhelming the team.

### How to prevent

Log every login, access-control, and server-side input-validation failure with enough user context for delayed forensic analysis. Format logs for ingestion by log-management solutions. Encode log data to prevent injection in the logging or monitoring pipeline. Maintain append-only audit trails with integrity controls for high-value transactions. Establish DevSecOps monitoring and alerting so suspicious activity is detected and responded to quickly. Adopt an incident-response plan such as NIST 800-61 r2 or later. Consider behavioral analytics or ML to reduce false positives, but tune to the environment.

### Frontend implications (this toolkit)

- Every state-changing user action flows through an audited mutation (`useAuditedMutation` / `useAuditedAction`) so server-side audit logs receive frontend context (timestamp, route, actor).
- Never log raw form payloads containing PII (card numbers, SSNs, government IDs) from the frontend — redact before sending to telemetry.
- Strip browser `console.log` from production builds — they end up in user-submitted screenshots and bug reports.
- The admin audit-trail UI must HTML-escape stored log strings and not allow injected log content to filter results.

### Mapped toolkit primitive

`useAuditedMutation` and `useAuditedAction` (force every privileged operation through an audited path), the `bfsi-audit-action` skill (scaffolds new audited actions), and `audit-prompt.sh` (CI hook failing PRs missing audit annotations).

### Common attack patterns (prose only — no payload literals)

- Slow-and-low credential stuffing that stays under per-IP thresholds because alerting is per-IP, not per-account.
- Successful exploitation never noticed because only errors were logged, not security-relevant successes (e.g. admin grant).
- Log injection where attacker-supplied input contains terminators that confuse log parsers downstream.
- Sensitive data (tokens, full card numbers, passwords) inadvertently logged and later exfiltrated from log storage.
- Forensic dead ends — the only log was on the compromised host and is now gone.

---

## A10:2025 – Mishandling of Exceptional Conditions

**CWE mapping:** CWE-209 Generation of Error Message Containing Sensitive Information, CWE-215 Insertion of Sensitive Information into Debugging Code, CWE-248 Uncaught Exception, CWE-252 Unchecked Return Value, CWE-390 Detection of Error Condition Without Action, CWE-391 Unchecked Error Condition, CWE-394 Unexpected Status Code or Return Value, CWE-396 Declaration of Catch for Generic Exception, CWE-397 Declaration of Throws for Generic Exception, CWE-460 Improper Cleanup on Thrown Exception, CWE-476 NULL Pointer Dereference, CWE-550 Server-generated Error Message Containing Sensitive Information, CWE-636 Failing Open, CWE-703 Improper Check or Handling of Exceptional Conditions, CWE-754 Improper Check for Unusual Conditions, CWE-755 Improper Handling of Exceptional Conditions, CWE-756 Missing Custom Error Page.

### Description

Mishandling of exceptional conditions happens when programs fail to prevent, detect, and respond to unusual and unpredictable situations, leading to crashes, unexpected behavior, and sometimes vulnerabilities. This occurs through three primary failures: failing to prevent unusual situations from arising, failing to identify them as they occur, or responding inadequately afterward. Root causes include inadequate input validation, misplaced error handling, unexpected environmental states (disk full, dependency timeout, partial write), and inconsistent exception management across modules. The resulting vulnerabilities can compromise confidentiality, availability, and integrity through logic bugs, overflows, race conditions, and authentication or authorization issues that arise only when an unexpected branch is hit. This is a new category in the 2025 edition.

### How to prevent

Catch errors at their point of origin and implement meaningful recovery procedures specific to the operation, rather than swallowing everything in a generic top-level handler. Implement both granular exception handling and a global last-resort handler that logs the unexpected and returns a safe response. For transactional operations, implement complete rollback ("failing closed") rather than partial recovery that leaves the system inconsistent. Apply rate limiting, resource quotas, and throttling to prevent resource exhaustion under exceptional load. Enforce strict input validation with centralized error handling, logging, and monitoring. Test error and exceptional paths explicitly — they are the paths attackers exercise hardest and the ones developers test least.

### Frontend implications (this toolkit)

- Every API mutation has an explicit `onError` surfacing a user-comprehensible message and never echoing raw server errors.
- Race conditions (double-click submit, mid-mutation navigation) are handled by disabling the action while inflight or by idempotency keys.
- Error boundaries wrap each route; an unhandled render must not blank the app or leak the stack.
- Fail closed: if a permission check is inconclusive, deny the action — don't optimistically render privileged controls.

### Mapped toolkit primitive

The `bfsi-error-message` skill (canonical API-error patterns), RTK Query / TanStack `onError` patterns in the feature scaffold, and `bfsi-test-pattern` requiring error-path tests.

### Common attack patterns (prose only — no payload literals)

- Triggering an unhandled exception that returns a stack trace disclosing internal paths, framework versions, or schema.
- Forcing a partial transaction failure (money debited, beneficiary not credited) and exploiting the resulting inconsistency.
- Resource exhaustion via unhandled errors leaking file handles, DB connections, or threads.
- Race conditions where check-then-act is interrupted, allowing a second action between check and effect.
- Logic bypass where an unexpected input falls through to a more-permissive default branch.

---

## Appendix: 2025 ↔ 2021 cross-reference

| 2025                                       | 2021 equivalent                                        | Notes                                                             |
| ------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------- |
| A01 Broken Access Control                  | A01:2021 Broken Access Control                         | 2025 folds SSRF (A10:2021) into A01.                              |
| A02 Security Misconfiguration              | A05:2021 Security Misconfiguration                     | Moved up; XXE remains here.                                       |
| A03 Software Supply Chain Failures         | A06:2021 Vulnerable and Outdated Components (expanded) | Broadened to the entire producer pipeline.                        |
| A04 Cryptographic Failures                 | A02:2021 Cryptographic Failures                        | Moved down; PQC guidance added.                                   |
| A05 Injection                              | A03:2021 Injection                                     | XSS remains folded in.                                            |
| A06 Insecure Design                        | A04:2021 Insecure Design                               | Same concept; threat-modeling emphasis.                           |
| A07 Authentication Failures                | A07:2021 Identification and Authentication Failures    | Identification merged into the broader auth category.             |
| A08 Software or Data Integrity Failures    | A08:2021 Software and Data Integrity Failures          | Largely the same; clearer split from A03.                         |
| A09 Security Logging and Alerting Failures | A09:2021 Security Logging and Monitoring Failures      | Renamed "Monitoring" to "Alerting"; emphasizes actionable alerts. |
| A10 Mishandling of Exceptional Conditions  | (new in 2025)                                          | Net-new category; SSRF (A10:2021) moved into A01:2025.            |

---

## Attribution

Descriptions and prevention guidance above are quoted or closely paraphrased from the OWASP Foundation's "OWASP Top 10:2025" project under the Creative Commons Attribution-ShareAlike 4.0 International License. The OWASP Foundation is the original author; this file is a derivative work distributed under the same license.

- Project home: https://owasp.org/Top10/
- Source repository: https://github.com/OWASP/Top10
- License: https://creativecommons.org/licenses/by-sa/4.0/
