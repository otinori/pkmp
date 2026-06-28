---
name: pkmp-capture-decision
description: Record an architectural or design decision. Delegates to UDR when available, falls back to PKMP built-in DecisionRecord otherwise.
license: MIT
compatibility: Requires PKMP project structure (registry/). UDR integration is optional but recommended.
metadata:
  author: pkmp
  version: "1.0"
---

Capture a design or architectural decision as a permanent record.

Implements the `capture-decision` workflow defined in `registry/workflows.yaml`.

**Input**: Optionally describe the decision. If omitted, infer from conversation context or ask.

**Steps**

1. **Check which decision manager is active**

   Read `registry/capabilities.yaml` and find the entry with `id: decision-manager`.
   - If `provider: udr`:
     - Verify UDR is installed by checking `.udr/config.yaml` exists on disk
     - If installed → follow **Path A: UDR**
     - If NOT installed → warn: "capabilities.yaml specifies UDR but `.udr/` not found.
       Falling back to Path B. Consider running UDR setup or updating capabilities.yaml."
       → follow **Path B: PKMP built-in**
   - If `provider: pkmp-builtin` or entry absent → follow **Path B: PKMP built-in**

   If the registry entry is absent entirely, also check for `.udr/config.yaml`:
   - Exists → suggest UDR is available but not registered; ask the human if they want to use it
   - Not found → follow **Path B**

---

## Path A: UDR (recommended)

UDR provides decision DAG tracking, context file sync, search, and trace —
capabilities beyond PKMP's built-in format. Delegate fully.

2A. **Invoke UDR record skill**

   Hand off to `/udr-record` (or `/udr-record draft` for undecided items).

   UDR will:
   - Guide through structured decision capture (title, context, rationale, alternatives + rejection reasons)
   - Assign ID: `UDR-<repo_short>-<YYYYMMDDTHHmm>-<rand3>`
   - Write to `.udr/records/UDR-….yaml`
   - Suggest `/udr-sync` to propagate to AI context files

3A. **Register reference in PKMP registry** (after UDR completes)

   Add a cross-reference entry to `registry/records.yaml` so PKMP knows this
   decision exists, even though UDR owns it:

   ```yaml
   - id: <UDR-id>
     type: DecisionRecord
     schema: external/udr
     state: Published
     canonical: .udr/records/<UDR-id>.yaml
     views: []
   ```

   `schema: external/udr` entries are skipped by `pkmp-verify` (external schemas are
   excluded from validation). No warning will be shown for this entry.

   This keeps PKMP's registry complete without duplicating UDR's content.

---

## Path B: PKMP built-in (fallback)

Use when UDR is not available in the project.

2B. **Extract decision details**

   Gather from conversation context or by asking the human:
   - **Context**: What situation led to this decision?
   - **Decision**: What was decided? (concrete, unambiguous)
   - **Rationale**: Why was this chosen?
   - **Alternatives considered**: What was rejected and why? (required — one-word reasons not accepted)
   - **Consequences**: Known trade-offs or follow-up actions

3B. **Assign an ID**

   Check `registry/records.yaml` for existing DecisionRecord IDs (`DC-NNN`).
   Assign the next sequential ID.

4B. **Check if this decision supersedes an existing one**

   Scan `registry/records.yaml` for existing DecisionRecords whose title or context
   overlaps with this decision. If a prior decision on the same topic exists and this
   new decision overrides it:
   - Note its ID as `supersedes_id`
   - The prior record's state in registry will be updated to `Superseded` in Step 6B

5B. **Create the DecisionRecord YAML**

   Create `records/<ID>.yaml`:
   ```yaml
   id: <ID>
   title: <short decision title>
   type: DecisionRecord
   context: |
     <what situation or problem led to this decision>
   decision: |
     <the decision, stated concisely>
   rationale: |
     <why this option was chosen>
   rejected_alternatives:
     - id: alt-a
       name: <alternative 1>
       reason: <why rejected — must include rationale, not just a word>
   implications:
     - <trade-off or required follow-up action>
   review_trigger:
     - <condition that should prompt revisiting this decision>
   provenance:
     source: conversation
     authored_by:
       role: implementation-agent
       identifier: <AI identifier>
     authored_at: <ISO8601>
   ```

6B. **Register and publish**

   Add to `registry/records.yaml` with:
   - `state: Published`
   - `supersedes: <supersedes_id>` if applicable (omit if no prior decision superseded)

   If a prior decision is superseded, update its registry entry:
   - Change `state: Published` → `state: Superseded`

   Run `pkmp-regenerate`.

---

**Output (Path A)**

```
Decision handed off to UDR.
UDR ID: UDR-pkmp-20260628T1430-a3f

Cross-reference added to registry/records.yaml.
Run /udr-sync to propagate to AI context files.
```

**Output (Path B)**

```
Decision recorded: records/DC-003.yaml
View generated: views/records/DC-003.md
State: Published

DC-003: Use PostgreSQL over MongoDB for primary data store
```

**Guardrails**
- Always prefer UDR when available — it has DAG, search, and sync that PKMP built-in lacks
- In Path B: always require at least one rejected alternative with substantive reason
- DecisionRecords are permanent — do not delete, supersede instead
- In Path A: always register the UDR cross-reference in PKMP registry for completeness
- **Critical**: When a new DC supersedes an existing one, you MUST add `supersedes: <old-id>` to
  the new DC's registry entry AND update the old DC's registry `state` to `Superseded`.
  Omitting either step means spec-assist and process-inbox will continue to surface the
  outdated decision as valid knowledge, breaking the self-improvement loop.
