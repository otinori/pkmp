---
name: pkmp-apply-process-improvement
description: Apply an approved PI (Process Improvement) record to PKMP configuration. Use after a human approves a Draft PI record to implement the proposed changes to workflows, lifecycles, schemas, or code.
license: MIT
compatibility: Requires PKMP project structure (registry/). Modifies .pkmp/ runtime files.
metadata:
  author: pkmp
  version: "1.0"
---

Apply an approved PI record's proposed changes to PKMP configuration.

Implements the `apply-process-improvement` workflow defined in `registry/workflows.yaml`.

**Input**: PI record ID (e.g., PI-009). If omitted, prompt the human for the ID.

**Steps**

1. **Read the PI record**

   Read `records/PI-<NNN>.yaml`.
   - Confirm it is a `ResearchRecord` with a `decision` field.
   - The `decision` field describes the exact change to apply.
   - If the record is already `Superseded` in the registry, it has already been applied — stop.
   - If the record is `Draft`, proceed (human approval was given by invoking this skill).

2. **Identify target files**

   From the `decision` field, determine which files need to change:
   - Workflow changes → `registry/workflows.yaml` + `dist/registry/workflows.yaml`
   - Lifecycle changes → `registry/lifecycles.yaml` + `dist/registry/lifecycles.yaml`
   - Schema changes → `.pkmp/schemas/` (specific schema file from decision)
   - Registry schema changes → `.pkmp/schemas/registry/` (specific schema file)
   - Code changes → `.pkmp/lib/validators/` or `.pkmp/lib/renderers/` or `.pkmp/bin/`
   - Skill/doc changes → `.agent/skills/pkmp-*/SKILL.md` or `CLAUDE.md` (human-only for CLAUDE.md)
   - `dist/` sync → if `registry/workflows.yaml` or `lifecycles.yaml` changed, copy to `dist/`

3. **Apply the changes**

   Make each change described in the `decision` field exactly as specified.
   For schema changes, verify the change does not break existing canonical files.

4. **Run pkmp-verify**

   Run `pkmp-verify` to confirm all schemas and registry are valid after the change.
   If verify fails:
   - Report the failure and what needs to be fixed
   - Do NOT mark the PI as Superseded yet
   - Fix the regression, then re-run verify before continuing

5. **Mark PI as Superseded**

   Update `registry/records.yaml`: change the PI record's `state` from `Draft` to `Superseded`.

   If the canonical YAML file (`records/PI-<NNN>.yaml`) contains a `state:` field, update it
   to `Superseded` as well — keep canonical and registry consistent.

6. **Run pkmp-regenerate**

   Run `pkmp-regenerate` to refresh all views (including the PI record's view).

7. **Commit**

   Create a commit with a message referencing the PI record ID:
   `apply: implement <PI-NNN> — <short description from title>`

**Output**

```
=== PKMP Apply Process Improvement ===

PI record: records/PI-001.yaml
Title: Apply-process-improvement workflow is missing

Changes applied:
  [OK] registry/workflows.yaml — added apply-process-improvement workflow
  [OK] dist/registry/workflows.yaml — synced

pkmp-verify: All checks passed.

Registry updated: PI-001 → Superseded
Views regenerated.

Committed: apply: implement PI-001 — apply-process-improvement workflow
```

**Guardrails**
- Never apply a PI record without confirming human approval (human invokes this skill)
- Always run pkmp-verify before marking the PI as Superseded
- If verify fails after change, fix the regression before completing
- CLAUDE.md changes require human to apply manually — AI cannot modify CLAUDE.md
  (create a clear diff description and ask the human to apply it)
- After applying, if `dist/` registry files were affected, always sync them
- Prefer exact implementation as described in `decision` field — do not improvise scope
