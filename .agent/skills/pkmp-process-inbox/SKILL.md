---
name: pkmp-process-inbox
description: Process files placed in inbox/ by humans and convert them to PKMP knowledge models. Use when new requirements, review results, or decisions arrive in inbox/.
license: MIT
compatibility: Requires PKMP project structure (registry/, inbox/).
metadata:
  author: pkmp
  version: "1.0"
---

Process files in `inbox/` and convert to PKMP YAML models.

Implements the `process-inbox` workflow defined in `registry/workflows.yaml`.

**Input**: None required. Processes all unprocessed files found in `inbox/`.

**Steps**

1. **Scan inbox/**

   List all files in `inbox/` excluding `.gitkeep` and files already in `inbox/processed/`.
   If no files found, report inbox is empty and exit.

2. **Classify each file**

   For each file, determine its nature:
   - **Requirements / Feature request** → will produce a Document (type: Spec or general)
   - **Review result / Approval** → will update an existing Document's state
   - **Architectural decision** → delegate to `/pkmp:capture-decision` (do not create DecisionRecord directly — capture-decision handles UDR routing, rejected_alternatives, and supersedes logic)
   - **Learnings / Retrospective** → will produce a Record (type: LearningRecord)
   - **Other / Unclear** → ask the human for classification before proceeding

3. **Check existing knowledge for conflicts and constraints**

   For files classified as Requirements / Feature request (→ Spec):
   a. Read `registry/records.yaml` index
   b. Build superseded set (collect ids that appear in other records' `supersedes` field)
   c. From remaining Published LearningRecords, ResearchRecords, and DecisionRecords,
      find any whose title keywords overlap with this inbox file's topic
   d. Note relevant constraints and prior decisions (max 5 bullet points).
      For each item include the record id for traceability (e.g., "per DC-001: ...").
      Format: `- <constraint summary> (per <record-id>, <record-type>)`

   These notes will be added to the Spec's Constraints section in Step 4.
   Skip this sub-step for Review results and state updates — they target existing artifacts.

4. **Create or update YAML canonical files**

   For new Documents (Spec):
   - Create `docs/<id>.yaml` using the document schema (id: spec-<kebab-case-topic>)
   - Set `provenance.source` to the inbox filename
   - Include constraints from Step 3 in the `content` Constraints section
   - Register in `registry/documents.yaml` with `state: Draft` and `lifecycle: spec`

   For new Records:
   - `DecisionRecord`: **delegate to `/pkmp:capture-decision`** rather than creating
     directly. Pass the inbox file content as context. capture-decision handles UDR
     routing, rejected_alternatives, and supersedes logic.
   - `LearningRecord`: create `records/LR-<NNN>.yaml` with `id`, `type`, `context`,
     `learning`, `applicability`, `source_change` (inbox filename), `provenance`
   - Register LearningRecords in `registry/records.yaml` with `state: Published`
     (Records go directly to Published — AI can publish without human review)

   For state updates to existing artifacts (review result / approval):
   - Read the existing canonical YAML; check `lifecycle` in its registry entry
   - Add `provenance.reviewed_at` (ISO8601) and `provenance.reviewed_by` (human id/name)
   - Update `registry/documents.yaml` state entry (registry is source of truth for state):
     - Document lifecycle: Draft→InReview (AI), InReview→Published (Human only)
     - Spec lifecycle: Draft→Reviewed (AI), Reviewed→Approved (Human only), Approved→Implemented (AI)
   - Only Humans can move artifacts to Published, Approved, or Archived states

5. **Register in registry**

   Add new artifacts to `registry/documents.yaml` or `registry/records.yaml`.
   Do not add duplicates — check `id` before inserting.

6. **Regenerate views**

   Run `pkmp-regenerate` to generate Markdown views for all modified artifacts.

7. **Archive processed files**

   Move each **successfully processed** file to `inbox/processed/<filename>`.
   Create `inbox/processed/` if it doesn't exist.
   Do NOT archive files that could not be classified or whose artifact creation failed —
   leave them in `inbox/` and report the failure so the human can resolve them.

**Output**

```
=== Processing inbox/ ===

Found 2 file(s):
  - inbox/requirements-auth.md
  - inbox/decision-db-choice.md

[requirements-auth.md] → Document (Spec)
  Created: docs/spec-auth.yaml
  Registered: registry/documents.yaml
  View: views/docs/spec-auth.md

[decision-db-choice.md] → Record (DecisionRecord)
  Created: records/DC-003.yaml
  Registered: registry/records.yaml
  View: views/records/DC-003.md

Archived to inbox/processed/

Processing complete. 2 artifact(s) created.
```

**Guardrails**
- Never delete inbox files — move to `inbox/processed/` instead
- Ask the human before creating artifacts from ambiguous files
- Always assign a unique `id` — check existing registry entries to avoid collisions
- Do not register an artifact if its canonical file could not be created
