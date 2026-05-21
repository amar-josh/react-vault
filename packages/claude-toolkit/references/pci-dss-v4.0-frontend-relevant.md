# PCI-DSS v4.0 — Frontend-Relevant Requirements

> Quoted reference of PCI-DSS v4.0 (and v4.0.1) requirements that a BFSI React frontend must address.
>
> **Source:** PCI Security Standards Council — _Payment Card Industry Data Security Standard: Requirements and Testing Procedures, v4.0_ (March 2022) and _v4.0.1_ (June 2024).
> **Canonical URL:** https://www.pcisecuritystandards.org/document_library/ (search "PCI DSS" — current published version is v4.0.1).
> **Summary of Changes (v3.2.1 → v4.0):** https://listings.pcisecuritystandards.org/documents/PCI-DSS-v3-2-1-to-v4-0-Summary-of-Changes-r1.pdf > **Retrieved:** 2026-05-21
> **Status:** PCI-DSS is © PCI Security Standards Council. Short quoted passages reproduced here for compliance reference under fair-use; consult the official document for full normative text. Where text could not be obtained verbatim from a primary source, it is reproduced from credible secondary sources (vendor compliance write-ups citing the standard) and flagged.
>
> **Important** — PCI-DSS v4.0 restructured many requirements vs v3.2.1. Old §6.5.1 / §6.5.7 / §6.5.10 (Injection / XSS / Broken Authentication) are NOW consolidated under §6.2.4 as sub-bullets of a single requirement about software engineering techniques. The toolkit's existing citations may use the older v3.2.1 numbering; this document maps both.

---

## Effective-date timeline

| Date             | Event                                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 31 March 2022    | PCI-DSS v4.0 published.                                                                                                                                                                                                       |
| 31 March 2024    | PCI-DSS v3.2.1 **retired**. v4.0 becomes the only active version. ~13 requirements effective immediately.                                                                                                                     |
| 11 June 2024     | PCI-DSS v4.0.1 published (limited revision; clarifies wording, does not change effective dates or substantive requirements).                                                                                                  |
| 31 December 2024 | PCI-DSS v4.0 retired; v4.0.1 is the only active version going forward.                                                                                                                                                        |
| 31 March 2025    | All **future-dated** requirements (51 of the 64 new requirements introduced in v4.0) become mandatory. This includes §6.4.3, §11.6.1, §8.4.2, §8.5.1, §8.3.6, §10.2.x sub-requirements, §4.2.1.1, §3.4.2, and several others. |

> **For this toolkit:** treat every requirement below as in force today. Code generated in 2026 must satisfy the post-31-March-2025 baseline.

---

## How to cite from this file

Agents and skills should cite as `PCI-DSS v4.0 req <n.m.p>` (e.g. `PCI-DSS v4.0 req 3.4.1`, `PCI-DSS v4.0 req 6.4.3`).

For legacy citations carried over from v3.2.1-era code review checklists, also note the v3.2.1 equivalent inline — e.g. `PCI-DSS v4.0 req 6.2.4 (formerly v3.2.1 req 6.5.1)`.

When a requirement is one of the future-dated ones, prefer a note like `PCI-DSS v4.0 req 6.4.3 (mandatory from 31 March 2025)` for the next 12-18 months while teams migrate.

---

## Req 3.3.1 — Sensitive Authentication Data (SAD) is not retained after authorization

**Normative text (v4.0):**

> "SAD is not retained after authorization, even if encrypted. All SAD is rendered unrecoverable upon completion of the authorization process."

**Frontend implications:**

- Never persist CVV / CVC / CAV2 / CID, full magnetic-stripe data, or PIN/PIN-block to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, React state held across navigations, or the Redux store after the user completes a payment.
- If the React form collects SAD (e.g. a CVV field), the controlled-input state must be cleared on submit-success and on unmount. Do not allow React DevTools snapshots, redux-persist, or `__REDUX_DEVTOOLS_EXTENSION__` to capture SAD — gate these tools behind `NODE_ENV === 'development'` AND ensure dev builds never hit production cardholder data.
- Do not log SAD via `console.log`, error-reporting SDKs (Sentry, Datadog RUM, LogRocket), or analytics events.

**v3.2.1 mapping:** Same intent — v3.2.1 §3.2 → v4.0 §3.3.1.

**Defined Approach Testing Procedures (summary):** Assessor examines data stores, system configurations, and (in modern v4.x) interviews developers to confirm SAD-purging logic exists and is exercised post-authorization.

---

## Req 3.4.1 — PAN is masked when displayed

**Normative text (v4.0):**

> "The PAN is masked when displayed and only personnel with a legitimate business need can see more than the Bank Identification Number (BIN) and last four digits of the PAN."

**Frontend implications:**

- Default React rendering of any PAN must show no more than first 6 (BIN) and last 4 digits — e.g. `411111******1111` or `••••1111`. Implement a single `<MaskedPan>` component and use it everywhere a PAN appears.
- Role-gating: only render the full PAN to users with a documented business role (e.g. `chargeback_analyst`). Drive masking from a role check on the server, not just a client flag — never trust a client-side `if (user.role === 'admin') { showFullPan }` without server-enforced data redaction in the API response itself.
- API responses that the frontend never needs in unmasked form must be served pre-masked. Don't pull a full PAN to the React app and then mask in JS — the unmasked value is then in network responses, memory, and potentially HTTP caches.
- The 8-digit BIN allowance applies where the entity has implemented it; default to 6 unless explicitly configured.

**v3.2.1 mapping:** v3.2.1 §3.3 "Mask PAN when displayed" → v4.0 §3.4.1. Same numbering family, normative text rewritten to clarify "BIN and last four" (was previously "first six / last four").

**Defined Approach Testing Procedures (summary):** Assessor examines documented roles with business need, configurations of displays/reports/screens that show PAN, and observes display of PAN to verify masking is applied.

---

## Req 3.4.2 — Copy/relocation of PAN over remote-access tech is prevented

**Normative text (v4.0):**

> "When using remote access technologies, technical controls prevent copy and/or relocation of PAN for all personnel, except for those with documented, explicit authorization and a legitimate, defined business need."

**Frontend implications:**

- React-rendered PAN fields shown over remote-access tooling (Citrix, Jump, RDP, VDI) must inhibit copy where the user lacks copy-allow authorization. In a web app, this typically means: disable `onCopy` on the `<MaskedPan>` container, set `user-select: none` via CSS, suppress drag-and-drop, and block right-click context-menu copy on that element.
- These controls are weak in a browser context; treat them as compliance-signaling, not security. The actual control lives at the remote-access / DLP / endpoint layer — but the frontend MUST not be the weakest link by handing copy semantics to the browser.
- **Future-dated:** mandatory from 31 March 2025.

**v3.2.1 mapping:** New in v4.0; no direct v3.2.1 equivalent.

**Defined Approach Testing Procedures (summary):** Assessor examines configurations of remote-access tech and observes personnel attempting to copy/move PAN to verify controls behave as documented.

---

## Req 3.5.1 — PAN is rendered unreadable wherever it is stored

**Normative text (v4.0):**

> "PAN is rendered unreadable anywhere it is stored by using any of the following approaches: One-way hashes based on strong cryptography of the entire PAN; Truncation (hashing cannot be used to replace the truncated segment of PAN); Index tokens; Strong cryptography with associated key-management processes and procedures."

**Frontend implications:**

- The React app SHOULD NOT store PAN at all. If you must (e.g. a "saved cards" feature), the storage layer is the backend; the frontend only sees tokens or truncated forms.
- Do not implement client-side crypto as the storage protection — browser-resident keys are not "strong key management" per v4.0.
- Service-worker caches, HTTP caches, and `Cache-Control` headers on PAN-bearing responses: explicitly set `Cache-Control: no-store` on any response that, even transiently, contains a PAN.

**v3.2.1 mapping:** v3.2.1 §3.4 → v4.0 §3.5.1. Numbering changed from §3.4 (v3.2.1) to §3.5.1 (v4.0). **The toolkit's "PCI-DSS req 3.4" citation refers to v3.2.1 §3.4, which is now v4.0 §3.5.1 for storage and §3.4.1 for display.** Both 3.4.x and 3.5.x are within scope when the original citation says "3.4."

**Defined Approach Testing Procedures (summary):** Assessor examines vendor/system documentation about the method(s) used to render PAN unreadable, and inspects data repositories and audit logs to verify PAN is unreadable.

---

## Req 4.2.1 — Strong cryptography for PAN in transit over open public networks

**Normative text (v4.0):**

> "Strong cryptography and security protocols are implemented as follows to safeguard PAN during transmission over open, public networks: Only trusted keys and certificates are accepted. Certificates used to safeguard PAN during transmission over open, public networks are confirmed as valid and are not expired or revoked. The protocol in use supports only secure versions or configurations and does not support fallback to, or use of, insecure versions, algorithms, key sizes, or implementations. The encryption strength is appropriate for the encryption methodology in use."

**Frontend implications:**

- All `fetch` / `axios` / RTK-Query / TanStack-Query base URLs must be HTTPS. In Vite / production builds, fail-fast on any `http://` cardholder endpoint via a custom interceptor.
- Pin to TLS 1.2+ (1.3 preferred). Frontend can't enforce server TLS, but the build/CI must include a check that staging and production endpoints reject TLS ≤ 1.1.
- Subresource Integrity (`<script integrity="sha384-…" crossorigin>`) for any third-party JS that touches payment pages, plus Content-Security-Policy headers from the server: `default-src 'self'; script-src 'self' <whitelist>; connect-src https://<api>; frame-ancestors 'none'`.
- HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) is set at the server/edge, but the React app must not break under it (no mixed HTTP assets, no `http://` redirects in routing).
- Never accept `NODE_TLS_REJECT_UNAUTHORIZED=0` in any build pipeline that ships PAN-handling code.

**v3.2.1 mapping:** v3.2.1 §4.1 → v4.0 §4.2.1. Numbering changed; sub-bullets about "trusted keys/certs" and "no insecure fallback" are clarified/strengthened in v4.0.

**Defined Approach Testing Procedures (summary):** Assessor examines documented standards, system configurations (cipher suites, protocol versions, certificate validation), and inspects implementations to verify only strong cryptography and trusted keys/certs are in use, with no insecure fallback.

---

## Req 4.2.1.1 — Inventory of trusted keys and certificates protecting PAN in transit

**Normative text (v4.0):**

> "An inventory of the entity's trusted keys and certificates used to protect PAN during transmission is maintained."

**Frontend implications:**

- Document every TLS-pinned endpoint, every Subresource-Integrity hash, every external script source, and every `connect-src` host in the CSP. This inventory is typically maintained in repo (e.g. `security/inventory.json`) and reviewed by audit. The frontend repo is the source of truth for what hosts the browser reaches at runtime — keep CSP / SRI in sync with this inventory.
- **Future-dated:** mandatory from 31 March 2025.

**v3.2.1 mapping:** New in v4.0.

**Defined Approach Testing Procedures (summary):** Assessor examines documentation to verify a current inventory exists and is maintained, including purpose, expiry, and ownership.

---

## Req 4.2.2 — PAN sent via end-user messaging technologies is secured

**Normative text (v4.0):**

> "PAN is secured with strong cryptography whenever it is sent via end-user messaging technologies."

**Frontend implications:**

- No PAN in `mailto:` links, no PAN in pre-filled SMS body params, no PAN in WhatsApp / Slack deep-links assembled in the React layer.
- Any "Send receipt to email" flow must compose the email server-side after redaction; the React app sends a transaction reference, not a PAN.

**v3.2.1 mapping:** v3.2.1 §4.2 → v4.0 §4.2.2.

---

## Req 6.2.1 — Bespoke and custom software is developed securely

**Normative text (v4.0):**

> "Bespoke and custom software are developed securely, as follows: Based on industry standards and/or best practices for secure development. In accordance with PCI DSS (for example, secure authentication and logging). Incorporating consideration of information security issues during each stage of the software development lifecycle."

**Frontend implications:**

- The repo follows a documented secure SDLC: threat modeling for new payment surfaces, security reviews on PRs touching `/payment`, `/checkout`, `/account`, and security acceptance criteria in user stories.
- The CLAUDE.md / agent guidance in this toolkit IS part of this evidence — it documents the secure development conventions Claude follows.

**v3.2.1 mapping:** v3.2.1 §6.3 / §6.5 framing → consolidated into v4.0 §6.2.x.

---

## Req 6.2.2 — Developer training on software security

**Normative text (v4.0):**

> "Software development personnel working on bespoke and custom software are trained at least once every 12 months as follows: On software security relevant to their job function and development languages. Including secure software design and secure coding techniques. Including, if security testing tools are used, how to use the tools for detecting vulnerabilities in software."

**Frontend implications:** Annual training records must include React/JS-specific topics (XSS sinks, prototype pollution, dependency-confusion, npm-supply-chain risks, SRI, CSP).

**v3.2.1 mapping:** v3.2.1 §6.5 prologue → v4.0 §6.2.2.

---

## Req 6.2.3 — Pre-production code review for custom software

**Normative text (v4.0):**

> "Bespoke and custom software is reviewed prior to being released into production or to customers, to identify and correct potential coding vulnerabilities, as follows: Code reviews ensure code is developed according to secure coding guidelines. Code reviews look for both existing and emerging software vulnerabilities. Appropriate corrections are implemented prior to release."

**Req 6.2.3.1 (Defined Approach):**

> "If manual code reviews are performed for bespoke and custom software prior to release to production, code changes are: Reviewed by individuals other than the originating code author, and who are knowledgeable about code-review techniques and secure coding practices. Reviewed and approved by management prior to release."

**Frontend implications:** Two-person PR review enforced via branch protection; author cannot self-approve. SAST tooling (ESLint security plugins, Semgrep, CodeQL) wired into CI.

**v3.2.1 mapping:** v3.2.1 §6.3.2 → v4.0 §6.2.3 / §6.2.3.1.

---

## Req 6.2.4 — Software engineering techniques against common attacks

> **THIS IS THE BIG CONSOLIDATION.** v3.2.1 had separate sub-requirements §6.5.1–§6.5.10 listing specific attack classes (Injection, Buffer overflows, Insecure crypto storage, Insecure comms, Improper error handling, "all high-risk vulnerabilities," XSS, Improper access control, CSRF, Broken auth/session). v4.0 collapsed these into a single §6.2.4 with bulleted attack categories.

**Normative text (v4.0):**

> "Software engineering techniques or other methods are defined and in use by software development personnel to prevent or mitigate common software attacks and related vulnerabilities in bespoke and custom software, including but not limited to the following:
>
> - Injection attacks, including SQL, LDAP, XPath, or other command, parameter, object, fault, or injection-type flaws.
> - Attacks on data and data structures, including attempts to manipulate buffers, pointers, input data, or shared data.
> - Attacks on cryptography usage, including attempts to exploit weak, insecure, or inappropriate cryptographic implementations, algorithms, cipher suites, or modes of operation.
> - Attacks on business logic, including attempts to abuse or bypass application features and functionalities through the manipulation of APIs, communication protocols and channels, client-side functionality, or other system/application functions and resources. This includes cross-site scripting (XSS) and cross-site request forgery (CSRF).
> - Attacks on access control mechanisms, including attempts to bypass or abuse identification, authentication, or authorization mechanisms, or attempts to exploit weaknesses in the implementation of such mechanisms.
> - Attacks via any 'high-risk' vulnerabilities identified in the vulnerability identification process, as defined in Requirement 6.3.1."

**Frontend implications:**

- **Injection (former §6.5.1):** Never build SQL/NoSQL/command strings client-side. Sanitize/escape any value that flows from React state into a URL, header, or `dangerouslySetInnerHTML`. Use parameterized API client patterns (RTK Query / TanStack Query inputs, never string-interpolated URLs).
- **XSS (former §6.5.7):** React's JSX escaping is necessary but NOT sufficient. Forbid `dangerouslySetInnerHTML` except via a vetted sanitizer (DOMPurify). Lint rule: `react/no-danger` set to error. CSP `script-src 'self'` (no `unsafe-inline`, no `unsafe-eval`) at the edge. Trusted Types in supporting browsers.
- **CSRF (former §6.5.9):** Same-site cookies (`SameSite=Strict` or `Lax` for auth tokens), CSRF tokens on state-changing requests, no auth via GET, no JSONP.
- **Broken auth / session (former §6.5.10):** Tokens (JWT, opaque) stored in `httpOnly` cookies, not `localStorage`. Idle and absolute session timeouts enforced server-side and reflected in client logout UI. No long-lived bearer tokens in the React app.
- **Access control:** Route-guard HOCs (`PrivateRoute`, `AccessRightsRoute`) in the React app are convenience, not security. Every API call must independently authorize on the server.
- **High-risk vulnerabilities (from §6.3.1):** Track `npm audit` / `pnpm audit` HIGH+ findings; resolve before release.

**v3.2.1 mapping:**

| v3.2.1  | What it was                          | v4.0 location                                      |
| ------- | ------------------------------------ | -------------------------------------------------- |
| §6.5.1  | Injection flaws                      | §6.2.4 bullet 1                                    |
| §6.5.2  | Buffer overflows                     | §6.2.4 bullet 2                                    |
| §6.5.3  | Insecure cryptographic storage       | §6.2.4 bullet 3                                    |
| §6.5.4  | Insecure communications              | §6.2.4 bullet 3 + req §4.2.x                       |
| §6.5.5  | Improper error handling              | §6.2.4 bullet 4 (business logic / info disclosure) |
| §6.5.6  | All high-risk vulnerabilities        | §6.2.4 bullet 6                                    |
| §6.5.7  | XSS                                  | §6.2.4 bullet 4 (explicitly named)                 |
| §6.5.8  | Improper access control              | §6.2.4 bullet 5                                    |
| §6.5.9  | CSRF                                 | §6.2.4 bullet 4 (explicitly named)                 |
| §6.5.10 | Broken authentication & session mgmt | §6.2.4 bullet 5                                    |

So when the toolkit's older agents/skills say "PCI-DSS req 6.5.1" or "PCI-DSS req 6.5.7" or "PCI-DSS req 6.5.10", the new canonical citation is **`PCI-DSS v4.0 req 6.2.4`** with the specific bullet noted.

---

## Req 6.3.1 — Identify and manage security vulnerabilities

**Normative text (v4.0, paraphrased from secondary sources citing the standard):**

> "Security vulnerabilities are identified and managed as follows: New security vulnerabilities are identified using industry-recognized sources for security vulnerability information, including alerts from international and national CERTs. Vulnerabilities are assigned a risk ranking based on industry best practices and consideration of potential impact. Risk rankings identify, at a minimum, all vulnerabilities considered to be a high-risk to the environment. Vulnerabilities for bespoke and custom, and third-party software (for example, operating systems and databases) are covered." _(paraphrased)_

**Frontend implications:** `npm audit` / Dependabot / Renovate / GitHub-Advanced-Security on the React repo. CVE triage SLAs documented.

**v3.2.1 mapping:** v3.2.1 §6.1 → v4.0 §6.3.1.

---

## Req 6.3.3 — Patches and updates

**Normative text (v4.0):**

> "All system components are protected from known vulnerabilities by installing applicable security patches/updates as follows: Critical or high-security patches/updates (identified according to the risk ranking process at Requirement 6.3.1) are installed within one month of release. All other applicable security patches/updates are installed within an appropriate time frame as determined by the entity (for example, within three months of release)."

**Frontend implications:** Upgrade React, Vite, axios, and all transitive deps with HIGH/CRITICAL CVEs within 30 days. CI gate that blocks merges if `pnpm audit --prod --severity=high` finds anything.

**v3.2.1 mapping:** v3.2.1 §6.2 → v4.0 §6.3.3.

---

## Req 6.4.1 — Public-facing web app vulnerability protection (legacy option)

**Normative text (v4.0):**

> "For public-facing web applications, new threats and vulnerabilities are addressed on an ongoing basis and these applications are protected against known attacks as follows: Reviewing public-facing web applications via manual or automated application vulnerability security assessment tools or methods as follows: – At least once every 12 months and after significant changes. – By an entity that specializes in application security. – Including, at a minimum, all common software attacks in Requirement 6.2.4. – All vulnerabilities are ranked in accordance with Requirement 6.3.1. – All vulnerabilities are corrected. – The application is re-evaluated after the corrections. OR Installing an automated technical solution(s) that continually detects and prevents web-based attacks as follows: – Installed in front of public-facing web applications to detect and prevent web-based attacks. – Actively running and up to date as applicable. – Generating audit logs. – Configured to either block web-based attacks or generate an alert that is immediately investigated."

**Frontend implications:** This is the WAF-or-pentest requirement. Either annual app-pentest of the React frontend by an external firm, OR a WAF (Cloudflare/AWS WAF/Akamai) in front of it. Most BFSI deployments do **both**.

**v3.2.1 mapping:** v3.2.1 §6.6 → v4.0 §6.4.1.

---

## Req 6.4.2 — Automated technical solution for public-facing web apps (mandatory)

**Normative text (v4.0):**

> "For public-facing web applications, an automated technical solution is deployed that continually detects and prevents web-based attacks, with at least the following: Is installed in front of public-facing web applications and is configured to detect and prevent web-based attacks. Actively running and up to date as applicable. Generating audit logs. Configured to either block web-based attacks or generate an alert that is immediately investigated."

**Frontend implications:** §6.4.1's "OR" goes away — a WAF is mandatory from 31 March 2025. Frontend role is to NOT defeat the WAF (no exotic encodings, no path-rewriting that bypasses WAF rules, well-behaved JSON bodies).

**v3.2.1 mapping:** New in v4.0; replaces the WAF-or-pentest option of v3.2.1 §6.6.

---

## Req 6.4.3 — Payment-page scripts are managed (NEW; the big client-side one)

**Normative text (v4.0):**

> "All payment page scripts that are loaded and executed in the consumer's browser are managed as follows: A method is implemented to confirm that each script is authorized. A method is implemented to assure the integrity of each script. An inventory of all scripts is maintained with written justification as to why each is necessary."

**v4.0.1 clarification:** scope clarified to scripts on payment pages where the merchant's environment is in scope; v4.0.1 wording further constrains "payment pages" to the page that accepts the cardholder's account data.

**Frontend implications (this is the requirement React BFSI teams most often miss):**

- Inventory every `<script>` that ends up on the checkout / payment route — your own bundles, third-party SDKs (Stripe.js, analytics, A/B testers, chatbots, session-replay, ad pixels, tag managers).
- Each script needs a written justification. Maintain `security/payment-page-script-inventory.md` or equivalent in repo.
- "Authorized" = there is a documented decision approving that script for the payment page. The repo's PR / approval history demonstrates this.
- "Integrity" = Subresource Integrity (`integrity="sha384-…"` and `crossorigin="anonymous"`) on every `<script src>` not under your control, OR equivalent (e.g. self-hosted bundle with signed-build pipeline, OR a CSP-managed allow-list combined with a tamper-detection mechanism per §11.6.1).
- React-specific: dynamically injected scripts (e.g. `useEffect(() => { const s = document.createElement('script'); … })` for chatbots) require the same controls — apply `integrity` and `crossorigin` attributes before append.
- **Future-dated:** mandatory from 31 March 2025.

**v3.2.1 mapping:** **NEW in v4.0.** No v3.2.1 equivalent. This is the headline e-skimming / Magecart defense.

**Defined Approach Testing Procedures (summary):** Assessor examines policies and inventory, observes implementation of authorization, integrity, and inventory controls, and interviews personnel.

---

## Req 8.2.1 — Unique user ID for access to system components and CHD

**Normative text (v4.0):**

> "All users are assigned a unique ID before access to system components or cardholder data is allowed."

**Frontend implications:** No shared logins. Every authenticated React session ties to a unique user record. Don't ship demo / "QA" / "shared" accounts to production.

**v3.2.1 mapping:** v3.2.1 §8.1.1 → v4.0 §8.2.1.

---

## Req 8.2.2 — Shared / group / generic accounts only on exception

**Normative text (v4.0, paraphrased):**

> "Group, shared, or generic accounts, or other shared authentication credentials are only used when necessary on an exception basis, and are managed as follows: account use is prevented unless needed for an exceptional circumstance; use is limited to the time needed for the exceptional circumstance; business justification for use is documented; explicit management approval is obtained before use; individual user identity is confirmed before access is granted; every action taken is attributable to an individual user." _(paraphrased from secondary sources)_

**Frontend implications:** If a "service" / "kiosk" / "branch terminal" account is exposed in the React app, document the exception and add per-session attribution (e.g. cashier swipes badge before each transaction; UI surfaces the badge ID for logging).

**v3.2.1 mapping:** v3.2.1 §8.5 → v4.0 §8.2.2.

---

## Req 8.3.1 — At least one strong authentication factor

**Normative text (v4.0):**

> "All user access to system components for users and administrators is authenticated via at least one of the following authentication factors: Something you know, such as a password or passphrase. Something you have, such as a token device or smart card. Something you are, such as a biometric element."

**Frontend implications:** The React login flow must use at least one of these factors; with §8.4.2 below, MFA is now also required for CDE access. WebAuthn / passkeys cleanly satisfy "something you have" and (where biometric-gated) "something you are."

**v3.2.1 mapping:** v3.2.1 §8.2 → v4.0 §8.3.1.

---

## Req 8.3.6 — Password complexity (12 chars, alpha + numeric)

**Normative text (v4.0):**

> "If passwords/passphrases are used as authentication factors to meet Requirement 8.3.1, they meet the following minimum level of complexity: A minimum length of 12 characters (or IF the system does not support 12 characters, a minimum length of eight characters). Contain both numeric and alphabetic characters."

**Frontend implications:** Client-side password-strength UX must enforce ≥12 chars with at least one letter and one digit. Show a strength meter; do not allow form submit below threshold. Pair with server-side enforcement (client checks alone are non-compliant).

**v3.2.1 mapping:** v3.2.1 §8.2.3 (was 7 chars + alpha/numeric) → v4.0 §8.3.6 (now 12 chars). **This is a substantive strengthening.** Future-dated; mandatory 31 March 2025.

---

## Req 8.3.9 — Password change cadence OR dynamic risk

**Normative text (v4.0):**

> "If passwords/passphrases are used as the sole authentication factor for user access (i.e., in any single-factor authentication implementation), then either: Passwords/passphrases are changed at least once every 90 days, OR The security posture of accounts is dynamically analyzed, and real-time access to resources is automatically determined accordingly."

**Frontend implications:** If single-factor password is used, surface a 90-day rotation prompt in the React app's profile/security UI. If risk-based auth is implemented instead, no fixed rotation — but the React app must accept step-up auth challenges (e.g. re-auth modal triggered by a backend risk signal).

**v3.2.1 mapping:** v3.2.1 §8.2.4 → v4.0 §8.3.9, with the new dynamic-analysis alternative.

---

## Req 8.4.1 — MFA for admin non-console CDE access

**Normative text (v4.0):**

> "MFA is implemented for all non-console access into the CDE for personnel with administrative access."

**Frontend implications:** Admin React routes (back-office consoles, ops dashboards, anything that views/exports CHD) must require MFA verification before allowing the session, and again on step-up for sensitive actions.

**v3.2.1 mapping:** v3.2.1 §8.3.1 → v4.0 §8.4.1.

---

## Req 8.4.2 — MFA for ALL access into the CDE (NEW, broader)

**Normative text (v4.0):**

> "MFA is implemented for all access into the CDE."

**Frontend implications:** Not just admins — every user whose session can reach CHD must MFA. For customer-facing React apps in a BFSI context, this typically means the login route enforces SMS/TOTP/passkey for all users before showing any CHD-bearing screen. **Future-dated; mandatory 31 March 2025.**

**v3.2.1 mapping:** New in v4.0 (broadened from §8.3 which was admin-only).

---

## Req 8.4.3 — MFA for remote access from outside the entity network

**Normative text (v4.0):**

> "MFA is implemented for all remote network access originating from outside the entity's network that could access or impact the CDE as follows: All remote access by all personnel, both users and administrators, originating from outside the entity's network. All remote access by third parties and vendors."

**Frontend implications:** When the React app is accessed from outside the corporate network (i.e. the public internet, which is the normal case for customer apps), MFA is mandatory. Pair with §8.4.2.

**v3.2.1 mapping:** v3.2.1 §8.3.2 → v4.0 §8.4.3.

---

## Req 8.5.1 — MFA systems are not susceptible to bypass

**Normative text (v4.0):**

> "MFA systems are implemented as follows: The MFA system is not susceptible to replay attacks. MFA systems cannot be bypassed by any users, including administrative users unless specifically documented, and authorized by management on an exception basis, for a limited time period. At least two different types of authentication factors are used. Success of all authentication factors is required before access is granted."

**Frontend implications:**

- Don't use the same factor twice (password + security question = both "something you know" → not compliant).
- Don't allow MFA to be optional via a UI toggle for the user. If exception-bypass exists, it's a server-side admin-managed configuration, not a user choice.
- TOTP / push / passkey / SMS-OTP responses must be single-use and bound to the originating challenge — no replay. React client just hands the response to the server; replay protection is server-side.
- **Future-dated; mandatory 31 March 2025.**

**v3.2.1 mapping:** New in v4.0 (the v3.2.1 standard did not detail MFA-system properties this way).

---

## Req 10.2.1 — Audit logs are active for all system components and CHD

**Normative text (v4.0):**

> "Audit logs are enabled and active for all system components and cardholder data."

Sub-requirements §10.2.1.1 – §10.2.1.7 enumerate the events that must be captured:

- **10.2.1.1:** "Audit logs capture all individual user access to cardholder data."
- **10.2.1.2:** "Audit logs capture all actions taken by any individual with administrative access, including any interactive use of application or system accounts."
- **10.2.1.3:** "Audit logs capture all access to audit logs."
- **10.2.1.4:** "Audit logs capture all invalid logical access attempts."
- **10.2.1.5:** "Audit logs capture all changes to identification and authentication credentials including, but not limited to: Creation of new accounts. Elevation of privileges. All changes, additions, or deletions to accounts with administrative access."
- **10.2.1.6:** "Audit logs capture the following: All initialization of new audit logs, and, All starting, stopping, or pausing of the existing audit logs."
- **10.2.1.7:** "Audit logs capture all creation and deletion of system-level objects."

**Frontend implications:**

- Login attempts (success + failure), logout, MFA challenge results, role/permission grants, profile changes, and every PAN view event must be logged. The React app does not write the audit log — it fires events to a backend audit-log endpoint, which writes the durable, tamper-resistant log.
- The React audit-log dispatch must NOT be conditional on opt-in analytics. It must run for every authenticated session.
- Never log a full PAN, CVV, password, or session token into the audit log. Log the user ID, action verb, resource ID, timestamp.

**v3.2.1 mapping:** v3.2.1 §10.2.1–§10.2.7 (flat list) → v4.0 §10.2.1 + §10.2.1.1–§10.2.1.7 (one parent + seven sub-requirements). Same content, deeper nesting. **The toolkit's "PCI-DSS req 10.2.x" citation maps to v4.0 §10.2.1.x.**

---

## Req 10.2.2 — Every audit log entry has the minimum fields

**Normative text (v4.0):**

> "Audit logs record the following details for each auditable event: User identification. Type of event. Date and time. Success and failure indication. Origination of event. Identity or name of affected data, system component, resource, or service (for example, name and protocol)."

**Frontend implications:** When the React app emits an audit event to the backend, include all six fields. A minimal event body looks like:

```ts
{
  userId: "...",         // user identification
  eventType: "PAN_VIEW", // type of event
  occurredAt: "...",     // date and time (ISO 8601, with timezone)
  outcome: "SUCCESS",    // success/failure
  origin: { ip, userAgent, sessionId }, // origination of event
  resource: { kind: "card", id: "tok_..." } // identity of affected resource
}
```

**v3.2.1 mapping:** v3.2.1 §10.3 → v4.0 §10.2.2.

---

## Req 11.6.1 — Tamper-detection on payment-page HTTP headers + content

**Normative text (v4.0):**

> "A change- and tamper-detection mechanism is deployed as follows: To alert personnel to unauthorized modification (including indicators of compromise, changes, additions, and deletions) to the HTTP headers and the contents of payment pages as received by the consumer browser. The mechanism is configured to evaluate the received HTTP header and payment page. The mechanism's functions are performed as follows: At least once every seven days OR Periodically (at the frequency defined in the entity's targeted risk analysis, which is performed according to all elements specified in Requirement 12.3.1)."

**Frontend implications:**

- Pair with §6.4.3. Deploy a tamper-detection service (Akamai Page Integrity Manager, Jscrambler, Feroot PageGuard, DataDome client-side, Imperva CSP, Human Security, or an in-house headless-browser monitor) that fetches the production payment page on a schedule and compares HTTP-header set and DOM content against the approved baseline.
- The React app's build pipeline produces the "approved baseline" — every prod release updates the snapshot used by the monitor.
- CSP-reporting (`report-to`, `report-uri`) endpoints help but do not by themselves satisfy §11.6.1 — they detect blocked scripts at runtime, not header/content drift on what was loaded.
- **Future-dated; mandatory 31 March 2025.**

**v3.2.1 mapping:** New in v4.0.

---

## v3.2.1 → v4.0 quick map

| v3.2.1                                | v4.0                           | Why it moved                             |
| ------------------------------------- | ------------------------------ | ---------------------------------------- |
| §3.2 (no SAD post-auth)               | §3.3.1                         | Renumbered                               |
| §3.3 (mask PAN displayed)             | §3.4.1                         | Renumbered                               |
| §3.4 (PAN unreadable stored)          | §3.5.1                         | Renumbered                               |
| §4.1 (strong crypto in transit)       | §4.2.1                         | Renumbered + sub-bullets added           |
| §4.2 (no PAN in messaging)            | §4.2.2                         | Renumbered                               |
| §6.1 (vulnerability identification)   | §6.3.1                         | Renumbered                               |
| §6.2 (patching)                       | §6.3.3                         | Renumbered                               |
| §6.3.2 (code review)                  | §6.2.3                         | Renumbered                               |
| §6.5.1 (injection)                    | §6.2.4 bullet 1                | **Consolidated into §6.2.4**             |
| §6.5.2 (buffer overflows)             | §6.2.4 bullet 2                | **Consolidated**                         |
| §6.5.3 (insecure crypto storage)      | §6.2.4 bullet 3                | **Consolidated**                         |
| §6.5.4 (insecure comms)               | §6.2.4 bullet 3 + §4.2         | **Consolidated**                         |
| §6.5.5 (error handling)               | §6.2.4 bullet 4                | **Consolidated**                         |
| §6.5.6 (high-risk vulns)              | §6.2.4 bullet 6                | **Consolidated**                         |
| §6.5.7 (XSS)                          | §6.2.4 bullet 4 (named)        | **Consolidated**                         |
| §6.5.8 (access control)               | §6.2.4 bullet 5                | **Consolidated**                         |
| §6.5.9 (CSRF)                         | §6.2.4 bullet 4 (named)        | **Consolidated**                         |
| §6.5.10 (broken auth/session)         | §6.2.4 bullet 5                | **Consolidated**                         |
| §6.6 (WAF or pentest)                 | §6.4.1 + §6.4.2                | Split — WAF (§6.4.2) becomes mandatory   |
| — (new)                               | §6.4.3 (payment-page scripts)  | **NEW in v4.0; mandatory 31 March 2025** |
| §8.1.1 (unique ID)                    | §8.2.1                         | Renumbered                               |
| §8.2 (auth factor)                    | §8.3.1                         | Renumbered                               |
| §8.2.3 (password complexity: 7 chars) | §8.3.6 (12 chars)              | **Strengthened**                         |
| §8.2.4 (90-day rotation)              | §8.3.9                         | Now allows dynamic-analysis alternative  |
| §8.3.1 (MFA admin)                    | §8.4.1                         | Renumbered                               |
| §8.3.2 (MFA remote)                   | §8.4.3                         | Renumbered                               |
| — (new)                               | §8.4.2 (MFA all CDE access)    | **NEW; mandatory 31 March 2025**         |
| — (new)                               | §8.5.1 (MFA system properties) | **NEW; mandatory 31 March 2025**         |
| §10.2.1–§10.2.7                       | §10.2.1 + §10.2.1.1–§10.2.1.7  | Nested under §10.2.1                     |
| §10.3 (log fields)                    | §10.2.2                        | Renumbered                               |
| — (new)                               | §11.6.1 (tamper detection)     | **NEW; mandatory 31 March 2025**         |

---

## Frontend-relevant requirements NOT in this file (intentional omission)

- **Req 1.x (network controls)** — handled by infra / DevOps / cloud-config, not the React app. The frontend only contributes via CSP, which is covered indirectly under §6.2.4 and §6.4.3.
- **Req 2.x (system hardening)** — backend / infra.
- **Req 5.x (anti-malware)** — backend / endpoint.
- **Req 7.x (least privilege on access)** — primarily IAM / backend authorization; the React side is covered by §6.2.4 (access-control attacks).
- **Req 9.x (physical security)** — out of scope.
- **Req 11.x (security testing)** — except §11.6.1 which IS frontend-relevant. The remaining §11 (pentest, IDS, file integrity) is backend / infra.
- **Req 12.x (information security policy / vendor / risk mgmt)** — organizational; not directly implemented in React code.
- **Service-provider-specific reqs (8.3.10.1, 12.x.x SP-only)** — only apply if the entity is a service provider; out of scope for a generic React starter.

---

## References used to assemble this file

- PCI Security Standards Council Document Library — `https://www.pcisecuritystandards.org/document_library/`
- PCI SSC blog — `https://blog.pcisecuritystandards.org/` (effective-date timeline, v4.0.1 release notice)
- PCI DSS v3.2.1 → v4.0 Summary of Changes — `https://listings.pcisecuritystandards.org/documents/PCI-DSS-v3-2-1-to-v4-0-Summary-of-Changes-r1.pdf`
- Basistheory PCI DSS requirement breakdowns (used as a secondary verbatim source) — `https://blog.basistheory.com/pci-dss-requirement-3`, `…requirement-4`, `…requirement-6`, `…requirement-8`, `…requirement-10`
- Schellman, Foregenix, jscrambler, Feroot, DataDome write-ups of §6.4.3 / §11.6.1 — cross-verified the verbatim text of the two big new client-side requirements.
- Where this file says **"(paraphrased)"**, the verbatim normative text was not obtainable from a single primary source at retrieval time; the wording reproduced is from credible secondary sources and matches the requirement's intent, but consult the PCI SSC document library for the authoritative text before citing in a formal assessment.

> When in doubt, the PCI SSC document is canonical. This file is a developer-facing convenience, not a substitute for the standard.
