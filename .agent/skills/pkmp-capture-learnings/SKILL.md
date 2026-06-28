---
name: pkmp-capture-learnings
description: Extract and store learnings after SDD work completes. Use when a change is archived or a milestone is reached to accumulate reusable knowledge.
license: MIT
compatibility: Requires PKMP project structure (registry/).
metadata:
  author: pkmp
  version: "1.0"
---

Extract learnings from completed SDD work and store as reusable knowledge.

Implements the `capture-learnings` workflow defined in `registry/workflows.yaml`.

This skill is the core of PKMP's self-improvement loop. Each completed change
feeds knowledge back into the project, making future work faster and more reliable.

**Input**: Optionally specify a SDD change name or path. If omitted, use the most recently archived change or ask.

**Steps**

1. **Read SDD change artifacts**

   Locate the completed change (e.g., in `openspec/changes/<name>/`).
   Read all available artifacts:
   - `proposal.md` — what was built and why
   - `design.md` — how it was built
   - `tasks.md` — implementation steps (especially completed ones)
   - Any notes or retrospective content

   If no SDD artifacts are available, gather from conversation context.
   In this case use:
   - `source_change`: omit the field entirely (it is optional in the schema)
   - `provenance.source`: use `"conversation"` or the inbox filename if the learning came from an inbox file

2. **Extract reusable knowledge**

   Analyze the artifacts for:
   - **Reusable patterns**: approaches that worked well and could apply elsewhere
   - **Decisions made during implementation**: any choices not already captured
   - **Surprises or complications**: things that were harder or different than expected
   - **Improvements to process**: changes to PKMP workflows, schemas, or rules that would help next time

3. **Classify each learning**

   For each extracted item, determine its type using these criteria:

   - **LearningRecord**: reusable technical or domain knowledge that helps future
     implementations of features (e.g., "pattern X works well for auth flows",
     "pitfall Y occurs when doing Z"). Benefits future SPEC and implementation work.

   - **Architectural decision not yet captured** → trigger `pkmp-capture-decision`.
     Use when the item is a specific, concrete choice made between alternatives with
     clear rationale and consequence.

   - **PI record (process improvement)**: a suggested change to PKMP's own
     configuration (workflows, schemas, lifecycles, rules, or tooling). Benefits
     the PKMP system itself, not a specific domain.

   - **Both LR and PI**: if an insight is both domain-reusable AND suggests improving
     PKMP, create both a LearningRecord (for future implementations) and a PI record
     (for PKMP self-improvement).

   - **Project-wide insight** → update relevant Document in `docs/`.

4. **Create LearningRecord(s)**

   Assign IDs: check `registry/records.yaml` for existing `LR-NNN` ids. Use the next
   sequential number, zero-padded to 3 digits (e.g., LR-001, LR-002).

   Before creating: check whether a LearningRecord with the same `source_change` AND
   similar title already exists in the registry. If so, skip creation (idempotent run)
   and note it in the output as "[SKIP] LR-NNN already exists".

   For each significant learning, create `records/LR-<NNN>.yaml`:

   ```yaml
   id: LR-<NNN>
   type: LearningRecord
   title: <short title of the learning>
   context: |
     <what was being built when this learning emerged>
   learning: |
     <the reusable insight, pattern, or pitfall to remember>
   applicability: |
     <when and where this learning applies in future work>
   source_change: <change name only, e.g. "bootstrap-pkmp" — omit if no SDD change>
   review_trigger:
     - <condition under which this learning should be reconsidered, e.g. "technology X is replaced">
   provenance:
     source: <SDD change path, e.g. "openspec/changes/bootstrap-pkmp" — or "conversation">
     derived_from:
       - <path to related SPEC, e.g. "docs/spec-auth.yaml" — omit if not applicable>
     authored_by:
       role: implementation-agent
       identifier: <AI identifier>
     authored_at: <ISO8601>
   ```

5. **Update existing Documents if needed**

   If a learning materially affects an existing design document or SPEC,
   update that document's canonical YAML and note the change in `provenance`.

6. **Register and publish**

   Add each new record to `registry/records.yaml` with `state: Published`.
   The record's canonical YAML does **not** need a `state` field — the registry is the
   single source of truth for state.
   Run `pkmp-regenerate` for all modified files.

7. **Persist PKMP process improvements**

   If any learnings suggest changes to PKMP workflows, lifecycles, or schemas:

   a. Assign ID: check `registry/records.yaml` for existing `PI-NNN` ids. Use the next
      sequential number, zero-padded to 3 digits (e.g., PI-001, PI-002).

   Create `records/PI-<NNN>.yaml` (same ResearchRecord format) with:
      - `title`: short description of the improvement
      - `context`: which situation revealed the gap
      - `decision`: the proposed change to PKMP configuration
      - `rationale`: why this would improve the loop
      - `implications`: - `applies_to: pkmp-self` (marks it as a PKMP meta-improvement)
   b. Register in `registry/records.yaml` with **`state: Draft`**
      (PI records await human approval — do NOT set state to Published).
      Run `pkmp-regenerate`.
   c. Report to the human that a process improvement has been recorded, not just mentioned.
      Tell them to run `/pkmp:apply-process-improvement` after reviewing the PI record.

   Do not self-modify PKMP configuration (workflows.yaml, lifecycles.yaml, schemas)
   without human approval. Recording the suggestion is not the same as applying it.

**Output**

```
=== PKMP Capture Learnings ===

Source: openspec/changes/bootstrap-pkmp

Extracted 3 learning(s):

[LR-001] Validator should check canonical files only, not views
  → Created: records/LR-001.yaml (Published)

[DC-004] Triggered capture-decision: .pkmp/ is read-only in user projects
  → Created: records/DC-004.yaml (Published)

[PI-001] PKMP process improvement: Consider adding a pre-commit hook for pkmp-verify
  → Created: records/PI-001.yaml (Draft — awaiting human approval)

Regeneration complete.
Self-improvement loop: 2 record(s) added to knowledge base.
```

**Guardrails**
- Do not modify PKMP configuration (workflows.yaml, lifecycles.yaml, schemas) without human approval
- Always link learnings to their source change for traceability
- Prefer creating new records over editing existing ones — append, don't overwrite history
- If the change produced no reusable learnings, report that explicitly rather than creating empty records
