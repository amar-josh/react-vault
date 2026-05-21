# IRDAI Information & Cyber Security Guidelines — Frontend-Relevant Sections

> Quoted reference of IRDAI's Information and Cyber Security Guidelines (Access control, Data protection / classification, Application security, Audit trails / Monitoring & Logging) for insurer-side BFSI React frontends.
>
> **Source:** Insurance Regulatory and Development Authority of India (IRDAI) — _IRDAI Information and Cyber Security Guidelines, 2023_ (Version 1.0, April 2023)
> **Issued under:** Circular ref. **IRDAI/GA&HR/GDL/MISC/88/04/2023**, dated **24 April 2023** > **Canonical URL:** https://irdai.gov.in/document-detail?documentId=3314780 (PDF: https://irdai.gov.in/documents/37343/366029/IRDAI+CS+Guidelines+2023.pdf)
> **Retrieved:** 2026-05-21
> **Status:** Public Indian regulator document; reproduced for compliance reference.
> **Effective date:** Applicable from issuance (24 April 2023). Entities that had already completed their security audit for FY 2022-23 were required to comply from FY 2023-24.
> **Supersedes:** The 2017 circular **IRDAI/IT/GDL/MISC/082/04/2017** dated 07 April 2017 and subsequent circulars (IRDA/IT/CIR/MISC/301/12/2020, IRDA/GA&HR/GLD/MISC/184/09/2022, IRDAI/GA&HR/GDL/MISC/211/10/2022) are expressly superseded by the 2023 guidelines.

---

## Document scope

The IRDAI Information and Cyber Security Guidelines, 2023 establish a mandatory, risk-based, governance-driven cyber-security framework for the Indian insurance industry. They apply to **all Insurers (including Foreign Reinsurance Branches), Insurance Intermediaries (Brokers, Corporate Agents, Web Aggregators, TPAs, IMFs, Insurance Repositories, ISNPs, Corporate Surveyors, MISPs, CSCs), and the Insurance Information Bureau of India (IIB).** They cover 24 security-domain policies — data classification, access control, asset management, cryptographic controls, application security, monitoring & logging, incident management, BCP/DR, third-party risk, BYOD, cloud security, cyber resilience, and more — and are anchored on confidentiality, integrity, availability, individual accountability, least privilege, segregation of duties and need-to-know.

## Numbering note (important)

The toolkit's older agent prompts cite this document as **"IRDAI §4.1"**, **"§4.4"**, **"§5.2"**, **"§5.4"** — a numbering convention that does **not** match the 2023 IRDAI guidelines (which use the form **§1.x** for "General Guidelines" and **§2.x** for the 24 Security Domain Policies). The pre-2023 (2017) circular used a different structure and may be the source of those legacy citations.

The mapping used throughout this file is:

|  Legacy citation in toolkit | Canonical 2023 §       | Canonical 2023 title                                                             |
| --------------------------: | ---------------------- | -------------------------------------------------------------------------------- |
|   IRDAI §4.1 Access control | **§2.3**               | Access control                                                                   |
|  IRDAI §4.4 Data protection | **§2.1** (+ §2.1 §3.5) | Data Classification (incl. Data Privacy / PII)                                   |
| IRDAI §5.2 Application sec. | **§2.5 §3.1.2**        | Information Systems acquisition and development — Application security standards |
|     IRDAI §5.4 Audit trails | **§2.16**              | Monitoring, Logging and Assessment                                               |

## How to cite from this file

Agents and skills should cite as **`IRDAI ICS 2023 §<n.m>`** (e.g. `IRDAI ICS 2023 §2.3`). When updating older prompts, prefer the canonical 2023 numbering. The legacy form (`§4.1`/`§4.4`/`§5.2`/`§5.4`) can remain as an alias for backward compatibility but should be annotated `(legacy → §2.3 / §2.1 / §2.5 / §2.16)`.

---

## Section overview

| §                  | Title                                                                                           | In this file?               |
| ------------------ | ----------------------------------------------------------------------------------------------- | --------------------------- |
| 1.1                | Purpose                                                                                         | brief summary only          |
| 1.2                | Scope                                                                                           | brief summary only          |
| 1.3–1.10           | Principles, Applicability, Governance, R&R, Acceptable Usage, Risk Mgmt, Exceptions, Compliance | brief summary only          |
| 2.1                | Data Classification (incl. §3.5 Data Privacy / PII)                                             | **FULL TEXT (key clauses)** |
| 2.3                | Access control                                                                                  | **FULL TEXT (key clauses)** |
| 2.5                | Information Systems acquisition and development (Application security)                          | **FULL TEXT (key clauses)** |
| 2.16               | Monitoring, Logging and Assessment (Audit trails)                                               | **FULL TEXT (key clauses)** |
| 2.2, 2.4, 2.6–2.24 | Other security-domain policies                                                                  | brief summary only          |

---

## §2.3 Access control _(legacy: IRDAI §4.1)_

**Purpose:** "To provide a set of practices for access to Organization's information and information systems (Operating Systems, Applications, Databases, Network Equipment and others). Access controls pertaining to Organization's information and information systems shall be based on principles of 'User Authorization' and 'Accountability' and support the security concepts of 'least privilege access' 'need-to-know', 'segregation of duties' and 'individual accountability'."

**Scope:** "This policy shall apply to all environments requiring logical access to information assets such as systems where information is stored or processed, communication and network connections through which information is transmitted or applications through which information is accessed. … Both physical and logical access controls shall be implemented and maintained to protect information assets against unauthorised access. This policy applies to all users such as employees, contractors, service providers / visitors accessing Organization's information assets."

**Policy:** "All user accesses to Organization's information assets shall be specifically and individually authorized based on business need. Security controls shall ensure that only authorized individuals can access Organization's information assets. Procedures shall be administered to ensure that appropriate level of access control is applied to protect the information in each system from unauthorized access, modification, disclosure or destruction… Any breach of this policy shall be considered as an incident and shall be treated as per the incident management policy."

**§3.1 User Identification and Accounts:**

1. "A User-ID or account shall be assigned to each individual to authorize a defined level of access to information assets and shall be protected by authenticating the user to the User-ID upon requesting access."
2. "Each User-ID or account on Organization's information systems shall uniquely identify only one user or process. Every individual user shall be accountable for all actions associated with his/her User-ID. User-IDs shall not be utilized by anyone other than the individuals to whom they have been issued."

**§3.2 Group / Generic User-IDs:** "The use of generic and group User-IDs shall be avoided wherever possible." Where unavoidable, group accounts shall be short-term, exception-approved, and have a single accountable Group ID owner.

**§3.3 User-ID Creation and Maintenance:**

1. "User-IDs shall be non-transferrable, and individuals shall not have multiple accounts within the same computing environment."
2. "All users shall be granted access to the information systems and services through a formal user registration process that shall include the approval of access rights from authorized personnel before granting access."
3. "All users shall follow a formal de-registration process for revocation of access to all information systems and services which shall include automated or timely intimation and revocation of access rights."
4. "Levels of access granted to all Users shall enforce segregation of duties and adhere to the 'need to know' principle."
5. Users shall be forced to change initial passwords at first logon; "All user passwords shall be encrypted while in transmission and storage."
6. "Users shall be required to change their passwords at the first log-on and change their passwords once in 45 days."
7. Department Heads "shall review the access rights or privileges assigned to the corresponding system periodically."
8. "In case of transfer of an employee from one function to another, access rights of the user shall be revoked for previous functional role and access need to be provided for new functional role."

**§3.4 User Authorization:**

1. Users shall be authorized at the levels: **Physical access, Network, Infrastructure, Endpoints, Applications, Cloud (where applicable).** "User authorization mechanisms at each level shall be independent of authorization at a previous or subsequent level – for example, applications shall perform assessment of user authorization request independent of the operating system authorization process."
2. "Users shall be authenticated and authorised by a domain policy server."
3. "Applications shall support integration with the enterprise identity management system."
4. "If the authorization request comes from a Organization-owned asset (device/network), single factor authentication will suffice. In case the authorization request comes from a non-Organization asset (device/network) two-factor authentication will be mandatory."
5. "Users shall be required to re-authenticate themselves after a specific period of inactivity."
6. "Organization shall establish methods to prevent unauthorized access by other groups into individual files and department-shared files."

**§3.5 Privileged User Accounts:** Privileged accounts (Administrator, root, equivalent) "shall be limited to individuals with specific business justification … only granted upon authorization from appropriate personnel … allocated to individuals on a 'need-to-have' basis." "Activity from all logons with Privileged User ID shall be securely logged." "Sharing of privileged IDs and their access codes shall be prohibited." "Vendors and contractors shall be disallowed from gaining privileged access to systems without close supervision and monitoring."

**§3.6 Secure log-on:** The log-on process "shall not provide any information that would aid an unauthorized user to successfully Log-on", "shall not reveal which part of the log-on data is valid or invalid", "shall not transmit passwords in clear text over a network", and "shall terminate inactive sessions after a defined period of inactivity, especially in high risk locations such as public or external areas outside the organization's security management or on mobile devices." Account lockout shall be enforced after the retry limit is reached. Logs of unsuccessful and successful attempts shall be maintained.

**§3.6.1 Review of access rights:** "User access rights shall be reviewed at regular intervals and after any changes, such as promotion, demotion or termination of employment." Privileged authorizations shall be reviewed more frequently.

**Frontend implications:**

- Every authenticated route/action MUST be gated by an RBAC check (`<CanAccess permission="…">` / `usePermission()` hook); never trust the UI alone — back-end authorization is mandatory at the application level, independent of network/OS access.
- After idle timeout, the SPA MUST force re-authentication (silent token refresh is **not** sufficient when idle). Wire an idle-watchdog that clears auth state and routes to `/login`.
- For requests originating from non-organisation devices (BYOD, public networks), the UI MUST trigger 2FA / step-up auth — even if a session token exists. Surface a step-up modal rather than failing silently.
- The login screen MUST NOT reveal whether the username or the password was wrong; use a single neutral error ("Invalid credentials").
- Bind UI privilege escalation (admin panels, "act as user") to server-side privileged-account checks; the React app should re-verify with the server on each privileged route entry and log out on 401/403 stale-session responses.
- Render explicit role/permission affordances so reviewers can audit what each role can see — segregation of duties must be visible in the UI.

---

## §2.1 Data Classification & §3.5 Data Privacy (PII) _(legacy: IRDAI §4.4 Data protection)_

**Purpose:** "To provide a framework for information owners to determine and classify the sensitivity levels for the information that Organization uses, processes, and stores. The unauthorized disclosure, modification, accidental or intentional damage, or loss of sensitive Organization information could constitute a violation of laws and/or regulations, may negatively affect customers, and impact Organization's image as well as competitiveness in the market. Hence data needs to be classified based on its criticality to enable implementation of security controls commensurate with its criticality."

**Policy:** "The Information Owner shall only classify information assets within their purview using one of the following four classification levels:

- Public
- Internal
- Restricted
- Confidential

Classification levels shall be defined based on the information asset's relative risk, value, and sensitivity.

Further, any personally identifiable information (PII), shall be identified and classified as PII in addition to being classified as per above data classification policy. Organization shall employ reasonable and appropriate safeguards to protect the integrity, confidentiality, and security of all PII."

**§3.3.1 Confidential:** "Personal or company information that is classified as highly sensitive by senior management or laws and regulations that impact Organization. Normally this concerns personally identifiable information (PII) about customers, business partners such as agents, distributors, suppliers etc., or employees, or information that is of vital or strategic importance to the success of the organization (e.g., financial statements)…"

**§3.3.2 Restricted:** "Information assets, which, if disclosed, would result in significant adverse impact, embarrassment, financial penalties, loss of stakeholder confidence and compliance penalties."

**§3.4.1.2 Storage (Confidential):** "Storage environments shall require user authentication that can uniquely identify each user or administrator. … Storage environments shall be periodically reviewed and audited … shall be monitored to help ensure that access control systems are functioning properly. CONFIDENTIAL information shall be stored on company owned or controlled systems or on equivalently secured systems with which Organization has an approved partnership."

**§3.4.1.3 Transfer (Confidential):** "When CONFIDENTIAL information is transmitted outside of the Organization network, including the Internet, it shall be sent in encrypted form or via a secured channel. Encryption keys shall be managed and protected by authorized resources as defined in the Cryptographic Security policy."

**§3.4.1.4 Tracking (Confidential):** "Tracking techniques, systems capabilities, or manual efforts shall indicate who has accessed the CONFIDENTIAL information, from where is it access (e.g. MAC ID, IP address) and when it was accessed. This access shall be audited by the Information Owner…"

**§3.4.2.3 Transfer (Restricted):** "When RESTRICTED information is transmitted electronically outside of the Organization's network, including the Internet, it shall be sent over a secured channel or in encrypted form."

**§3.5 Data Privacy:** "Personally Identifiable Information (PII) is information about a person that contains some unique identifier, including but not limited to name, email, contact details or unique identification number, from which the identity of the person can be determined." PII is bifurcated into **Sensitive Personal Information (SPI)** and **Other Personal Information (OPI)**.

Sensitive personal data or information shall include: "Password; User details as provided at the time of registration or thereafter; Information related to financial information such as Bank account / credit card / debit card / other payment instrument details of the users; Physiological and mental health condition; Medical records and history; Biometric information; Information received by body corporate for processing… under lawful contract; Call data records."

**§3.5.2 Collection of PII:** "Organization or any person on its behalf shall obtain consent of the provider of the information regarding purpose, means and modes of uses before collection of such information. … Organization or any person on its behalf shall not collect sensitive personal information unless – The information is collected for a lawful purpose connected with a function or activity of the agency [and] The collection of the information is necessary for that purpose. … While collecting information directly from the individual concerned, Organization … shall take such steps as are, in the circumstances, reasonable to ensure that the individual concerned is aware of – the fact that the information is being collected; the purpose for which the information is being collected; and the intended recipients of the information."

**Frontend implications:**

- PII / SPI fields (PAN, Aadhaar, bank account, card details, medical info, biometrics) MUST be masked by default in tables and read-only views; unmask only on explicit user action and only for users with the corresponding permission — and log that unmask event.
- Never log PII / SPI to the browser console, error trackers (Sentry), or analytics without a redaction filter. Wire a PII scrubber into the error-reporting pipeline.
- When transmitting Confidential / Restricted data the React app MUST use HTTPS (TLS 1.2+); enforce HSTS and `Secure; HttpOnly; SameSite=Strict` cookies. No PII over query strings or `localStorage`.
- Consent banners / collection forms MUST display purpose, data fields collected, and intended recipients before submit — and persist a consent timestamp & version on the server.
- Implement classification-aware UI: components that render Confidential data should carry a visible label / watermark and disable copy-to-clipboard / printable views unless authorised.
- The four classes (Public / Internal / Restricted / Confidential) should map to a UI sensitivity prop on data-rendering components so reviewers can grep for unprotected high-sensitivity renders.
- Do not seed test/staging environments with production PII (§3.2.6 of §2.5 also prohibits this).

---

## §2.5 Information Systems acquisition and development → §3.1.2 Application security _(legacy: IRDAI §5.2)_

**Purpose:** "To define the desired practises and ensure that information security is an integral part of information systems across their entire lifecycle."

**Scope:** "This shall apply to developing new software, customizing software and developing software that can be accessed or presented on a website."

**Policy:** "Organization's Information systems shall provide for maintenance of confidentiality, integrity and availability, of data contained within them, by design. This shall be achieved by processes, throughout the System Development Life Cycle beginning at acquisition through development and maintenance."

**§3.1.2.1 Security requirement analysis and specifications:**

1. "Applications shall be assessed for their security posture through security reviews before being commissioned for usage in the production environment."
2. "Application security reviews shall be conducted based on application security standards defined by the information security team which shall cover the aspects to be addressed in such reviews and provide guidance on requirements for conducting such reviews by external agencies."

**§3.1.2.2 Application development:**

1. "A formal software development security framework shall be developed by the IS team."
2. "The software development security framework shall define a software risk assessment process to ensure that software security requirements are assessed considering associated business and technology risks."
3. "A library of secure design patterns shall be built. Their consistent usage across projects shall be enforced, and it shall be ensure that new pattern requirements drive pattern development. Security reviews shall be focused on reviewing patterns and enforcement of their use."
4. "Modifications to software packages shall be discouraged. Vendor-supplied software packages shall be used with minimum modification unless they impact security posture…"
5. "All modifications (including configuration changes, changes to reports, etc.) to software packages shall be made in accordance with formal Program Change Control Procedures."
6. For third-party-developed software: ensure third-party development processes comply with the policy; use vendor packages without modification where possible; have appropriate licensing & contractual quality requirements; obtain product documentation; require source-code ownership or an escrow arrangement; carry out acceptance testing; define formal in-house development methodology including security requirements; ensure a contractual right to audit development processes & controls; "Security thresholds shall be used to establish minimum acceptable levels of security and privacy quality."

**§3.1.2.3 Correct Processing in Applications:**

1. "Data input to applications shall be validated to ensure that this data is correct and appropriate."
2. "Validation checks shall be incorporated into applications to detect any corruption of information through processing errors or deliberate acts."
3. "Requirements for ensuring authenticity and protecting message integrity in applications shall be identified, and appropriate controls identified and implemented."
4. "Data output from an application shall be validated to ensure that the processing of stored information is correct and appropriate to the circumstances."
5. "Installation of unapproved software and utilities shall be barred by centrally enforced policy."
6. "Users shall use only organization approved collaboration software."

**§3.2.6 System security testing:** "New and updated systems shall require thorough testing and verification during the development processes… System acceptance testing shall include testing of information security requirements and adherence to secure system development practices. … The use of operational data containing personally identifiable information or any other confidential information for testing purposes shall be avoided."

**Frontend implications:**

- This section is the IRDAI analogue of **PCI DSS 6.5.x** — implement and document the standard OWASP-style controls in the React app: input validation, output encoding, anti-XSS, anti-CSRF (token / SameSite), authn/authz checks on every protected route, secrets out of source, dependency scanning, SCA, SAST, DAST/VAPT before go-live.
- All form inputs MUST be validated both client-side (UX) and server-side (security) — never trust client validation alone. Validate on both `onChange` (UX) and `onSubmit` (final).
- API responses that drive UI rendering MUST be schema-validated (zod / typebox) on receipt; do not blindly inject server data into the DOM via `dangerouslySetInnerHTML`.
- Use the toolkit's secure design patterns (`<CanAccess>`, `<MaskedField>`, `<AuditAction>`, `axios` factory, `useApiQuery`) consistently — §3.1.2.2(3) requires _consistent usage_ of secure patterns, which means lint rules / codemods that fail builds when a raw `axios` or unmasked PII field is introduced.
- VAPT and secure-code reviews are mandatory before go-live and after major changes (§3.6.1 of §2.16) — frontend release process MUST include a security review gate.
- No production PII in fixtures, Storybook, Cypress / Playwright tests, or seed scripts. Use synthetic data only.
- Build-pipeline must block installation of unapproved npm dependencies (use a dependency allowlist or registry mirror).

---

## §2.16 Monitoring, Logging and Assessment _(legacy: IRDAI §5.4 Audit trails)_

**Purpose:** "To define the Organization desired practices regarding monitoring, auditing and assessment of logs."

**Scope:** "This policy applies to all information systems information assets and all communication and network connections through which Organization Information Assets are transmitted, stored or processed."

**Policy:** "All critical information systems deployed by Organization for information processing, storage or security shall be monitored through the following means:

- Real time monitoring through manual means or technology systems capable of generating alerts
- Logging of all activities or transactions performed on information systems and periodic analysis of logs
- Periodic or one-time security posture assessment exercises including but not limited to device configuration review, security testing of information systems and review of IT processes set up for real time or periodic monitoring."

**§3.1 Logging and Monitoring:** "Real-time automated detection facilities shall be implemented for systems to monitor significant deviations from normal activity and to alert security administrators of those systems. Logging shall be enabled for all business transactions, high risk systems and processes shall be set up for real time or periodic manual or automated review of logs."

**§3.3 Information systems logging and monitoring:**

1. "All information systems will be configured to log system activities and generate alerts for any unusual activity to system administrators."
2. "The activities of privileged users such as system administrators and system operators shall be logged and independently reviewed on a regular basis."
3. "Mechanisms shall be put in place to detect and report activity which violates the information security policy with respect to access, acceptable usage and / or any other aspect addressed by the policy."
4. "In absence of automated alerts, a process shall be set up to perform manual review of activity logs, on a frequency defined based on the criticality of the information system."
5. "The clocks of all relevant information processing systems within Organization or security domain shall be synchronized with an agreed accurate time source."
6. "The activity logs and audit trails shall be stored/retained based on the record retention requirements and applicable regulatory compliance requirements."
7. "Logging facilities and log information shall be protected against tampering and unauthorized access."
8. "Logs shall be made available to the Law Enforcement Agencies, IRDAI, Cert-In and CSIRT-Fin as and when required."
9. "ICT infrastructure logs shall be maintained for a rolling period of 180 days and within the Indian jurisdiction as per directions issued by Cert-In from time to time."
10. "Monitor attempts to access deactivated accounts through audit logging."
11. "System administrator and system operator activities shall be logged and the logs protected and regularly reviewed."

**§3.3.2 Application access & activity:** "User activities, exceptions, and security events on all applications shall be logged and monitored. Logs must include the following:

1. System starting and finishing times.
2. System errors or Faults and corrective action taken.
3. Confirmation of the correct handling of critical data files and computer output.
4. The name of the person/process / system making the log entry.
5. Source address from where data or system is being accessed (this might be either IP address or MAC ID).
6. Application shall prohibit users from logging into the application on more than one workstation at the same time with the same user ID.
7. Secondary Network Connectivity and IT infrastructure shall be provisioned and tested for the critical applications and services."

**§3.5 User activity monitoring:** "User accounts shall be monitored regularly to detect any unwanted privileges, orphan accounts, and dormant accounts. Any accounts detected in violation of Organization's policies shall be suspended or terminated."

**§3.6.1 Security assessments:** "VAPT of internet-facing applications or infrastructure components to be conducted periodically atleast once in a year. … Business applications including APIs or Web Services etc. shall undergo VAPT Testing including secure code review periodically & before go live. … External Blackbox Penetration Testing (PT) should be conducted for all internet facing information assets and systems once in 6 months. … High risk gaps, reported from the VAPT, should be closed within a period of one month… the outer time limit for closure of all the audit gaps is two months."

**Frontend implications:**

- Emit an **audit event** for every privileged or PII-touching action: login, logout, failed-login, role change, view-PII / unmask, export, create / update / delete on protected entities. The toolkit's `<AuditAction>` / `useAuditLog()` helper exists for this.
- Audit events MUST include: actor user-ID, action name, resource, timestamp (server-side authoritative — do NOT trust the browser clock), source IP / device fingerprint (server-derived), and outcome (success / failure).
- Logs MUST be append-only and tamper-evident — the React app should fire-and-forget audit events to a dedicated server endpoint (separate from business APIs) and must not allow the user to suppress, edit or delete them client-side.
- Concurrent-session prevention: when the server signals that the same user-ID is active elsewhere, the React app MUST force logout on the older session (§3.3.2 clause 6).
- The UI MUST surface failed-login throttling / lockout state and log every failed attempt (§3.3 clause 3 + §2.3 §3.6 clause 6).
- Retention: audit events generated by the SPA must be retained server-side for at least the regulatory window (180 days rolling minimum per Cert-In, longer per insurer's record-retention policy). The frontend should never short-circuit retention via "purge" UI without explicit IRDAI-aligned exception.
- Display a "last successful / last failed login" indicator on the user's home screen — a cheap, IRDAI-aligned trust signal.
- Errors caught in React error boundaries should be logged to the audit/error pipeline with PII redacted, never silently swallowed.

---

## Brief summary of other sections (for context)

### General Guidelines (§1)

- **§1.1 Purpose:** Establishes the Information and Cyber Security Policy (ICSP) objectives — reducing risk of accidental or intentional disclosure, modification, destruction, delay or misuse of Information Assets, and protecting information & information infrastructure in cyberspace.
- **§1.2 Scope:** Applies to Information Assets throughout their lifecycle across the Organization, all business units, employees, contractors, vendors and third parties.
- **§1.3 Principles and Objectives:** Confidentiality, Integrity, Availability — anchored on individual accountability, least privilege, segregation of duties and need-to-know.
- **§1.4 Applicability:** All Insurers (including FRBs), Insurance Intermediaries, ISNPs, MISPs, IIB.
- **§1.5 Governance:** Board-level oversight; the ICSP shall be approved by the Board; Information Security Committee and CISO accountable.
- **§1.6 Roles and Responsibilities:** Detailed responsibilities for Board, CRO, CISO, IT, IS, ERM, business heads and end users.
- **§1.7 Acceptable Usage:** Acceptable usage policy for IT assets, email, internet, social media.
- **§1.8 Risk Management:** Risk identification, assessment, treatment and monitoring framework.
- **§1.9 Exceptions:** Exception-grant process with risk acceptance and time-bound expiry.
- **§1.10 Compliance:** Annual self-assessment, Board-approved compliance report submitted to IRDAI within 90 days of FY-end.

### Security Domain Policies (§2 — domains not detailed above)

- **§2.2 Asset Management:** Asset inventory, classification, ownership, acceptable use, transfer and disposal of IT assets.
- **§2.4 Human resource security:** Background verification, security responsibilities in employment terms, security awareness training, disciplinary process and termination procedures.
- **§2.6 Information systems maintenance:** Patch management, change control, secure configuration baselines, end-of-life retirement.
- **§2.7 Mobile security policy:** Controls for mobile devices accessing Organization information.
- **§2.8 Bring your own device (BYOD) policy:** BYOD eligibility, MDM enrolment, containerisation, data separation, remote wipe.
- **§2.9 Change Control:** Formal change-management process for all production-impacting changes.
- **§2.10 Incident and problem management:** Detection, classification, escalation, reporting (to IRDAI within stipulated timeframe), root cause analysis and lessons learned.
- **§2.11 Network Security:** Segmentation, firewalls, IPS/IDS, DDoS protection, network hardening.
- **§2.12 Cryptographic Controls:** Encryption standards (AES-256 / equivalent), key management, certificate lifecycle, HSM use.
- **§2.13 Business Continuity Management and Disaster Recovery:** BIA, RTO/RPO, DR site, BCP testing.
- **§2.14 Third party service providers:** Vendor due diligence, contractual security clauses, ongoing monitoring, right to audit.
- **§2.15 Physical and environmental security:** Data-centre and office physical access zones (Zone 1-4).
- **§2.17 Legal and Regulatory Compliance:** Compliance with IRDAI circulars, IT Act, DPDP Act, Cert-In directions and other applicable laws.
- **§2.18 Situational Awareness:** Threat intelligence subscription, monitoring of emerging threats, sharing with CERT-IN / CSIRT-Fin.
- **§2.19 Cloud Security Policy:** Cloud-service provider due diligence, data residency (India), shared-responsibility model, encryption of cloud-stored data.
- **§2.20 Cyber Resilience:** Anticipate / withstand / recover / adapt; cyber crisis management plan.
- **§2.21 Email Security:** Anti-phishing, anti-spam, DMARC/DKIM/SPF, email DLP.
- **§2.22 Work from Remote Location:** Secure remote-access (VPN with MFA), endpoint posture checks, prohibited locations.
- **§2.23 Dealing room operations:** Controls for trading / dealing-room environments.
- **§2.24 IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:** Compliance with the 2021 Intermediary Rules where applicable.

### Annexures

- **Annexure A:** Mapping to applicable Indian laws and regulations.
- **Annexure B:** RACI matrix across all 24 domain policies.
- **Annexure VI:** Annual cyber-security compliance certificate template (CISO-signed, Board-noted, submitted to IRDAI within 90 days of FY-end).

---

_Last verified against the canonical PDF on 2026-05-21. If IRDAI publishes a revised version, update the `Source`, `Issued under` and `Retrieved` fields above and re-verify §2.1 / §2.3 / §2.5 / §2.16 verbatim text against the new document._
