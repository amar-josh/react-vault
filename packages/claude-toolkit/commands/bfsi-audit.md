---
name: bfsi-audit
description: Run a regulatory compliance audit of the current branch against RBI, PCI-DSS, IRDAI, or SOC2 controls. Produces a control-by-control evidence report.
argument-hint: [rbi|pci|irdai|soc2|all] [--scope <files>]
---

# /bfsi-audit

You are running a compliance audit. Delegate to the `bfsi-compliance-auditor` agent.

## Workflow

1. **Determine framework.**

   Parse `$ARGUMENTS`:
   - `rbi` → RBI Cyber Security Framework (Annexure I baseline)
   - `pci` → PCI-DSS v4.0 frontend-relevant controls
   - `irdai` → IRDAI Information & Cyber Security Guidelines
   - `soc2` → SOC2 Trust Services Criteria (CC + PI relevant to frontend)
   - `all` → run RBI first, then layer PCI, IRDAI, SOC2 (longer)
   - empty → default to RBI (most common Rsense BFSI requirement)

2. **Determine scope.**

   `--scope <files>` overrides; default is the full codebase plus current branch's diff.

3. **Delegate to the agent.**

   Spawn `bfsi-compliance-auditor` with the framework + scope. Pass exactly these as the agent's task brief so it has unambiguous instructions.

4. **Pass through the report.**

   The agent produces a control-by-control report. Surface it verbatim.

5. **Summarise next steps.**

   At the end, if any gaps exist, list:
   - The top 3 gaps by severity
   - The skill / agent best suited to remediate each
   - Whether each gap blocks regulatory submission or is "track for next sprint"

## Notes

- This is **evidence preparation** for compliance reviewers, not a substitute for formal audit.
- The output should be paste-able into a compliance dashboard or audit reply email.
- For dual-regulator scope (e.g. a payment app subject to RBI + PCI), use `all` and the agent will produce one combined matrix.
