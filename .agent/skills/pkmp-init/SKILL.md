---
name: pkmp-init
description: Initialize a new project with PKMP structure. Use when starting a new project that will use PKMP for knowledge management.
license: MIT
compatibility: No prerequisites. Creates PKMP project structure in the current repository.
metadata:
  author: pkmp
  version: "1.0"
---

Initialize a new project with PKMP structure.

**Input**: Optionally specify project name and owner. If omitted, infer from repository context or prompt.

**Steps**

0. **Ensure PKMP runtime is present**

   Check that `.pkmp/` exists in the repository root.
   - Exists → proceed to step 1
   - Not found → download from GitHub and copy into the project:

   ```bash
   git clone --depth=1 https://github.com/otinori/pkmp.git /tmp/pkmp-download
   cp -r /tmp/pkmp-download/.pkmp ./
   cp -r /tmp/pkmp-download/dist ./
   rm -rf /tmp/pkmp-download
   ```

   Confirm `.pkmp/` now exists before proceeding.

   `.pkmp/bin/pkmp.js` (verify/regenerate) requires Node packages `yaml` and
   `jsonschema` — it will fail with `ERR_MODULE_NOT_FOUND` without them. Copy
   the runtime's `package.json` and `package-lock.json` from `dist/` into the
   project root (do not overwrite if they already exist — merge `dependencies`
   instead), then install:

   ```bash
   cp dist/package.json ./package.json   # or merge if one already exists
   cp dist/package-lock.json ./package-lock.json
   npm install
   ```

   Confirm `node .pkmp/bin/pkmp.js verify` runs without a module-resolution
   error before proceeding to step 1.

1. **Gather project information**

   Collect or confirm:
   - Project name (`repository.id`, `repository.name`)
   - Owner name (`repository.owner`)
   - Current date for `created` and `updated` fields

2. **Create directory structure**

   Create the following directories if they don't exist:
   ```
   registry/
   docs/
   records/
   inbox/
   views/
   provenance/
   ```

3. **Create registry files**

   The PKMP distribution (`dist/`) provides starter versions of all registry files.
   Copy each file below from `dist/registry/` into `registry/`. Do not overwrite if it already exists.

   Files to copy from `dist/registry/`:
   - `capabilities.yaml` — built-in provider defaults (UDR, Conclave fallbacks)
   - `schemas.yaml` — built-in schema paths pointing to `.pkmp/schemas/`
   - `lifecycles.yaml` — document, record, spec lifecycle definitions
   - `workflows.yaml` — process-inbox, spec-assist, capture-decision, capture-learnings, pkmp-verify, apply-process-improvement

   Then create project-specific files with initial empty/placeholder content:

   `registry/repository.yaml` — fill in project name, owner, current date:
   ```yaml
   repository:
     id: <project-id>
     name: <project-name>
     version: 1.0.0
     owner: <owner>
     created: <ISO8601>
     updated: <ISO8601>
     top_level:
       - docs/
       - records/
       - views/
       - registry/
       - inbox/
       - provenance/
   ```

   `registry/documents.yaml`:
   ```yaml
   documents: []
   ```

   `registry/records.yaml`:
   ```yaml
   records: []
   ```

4. **Create inbox placeholder**

   Create `inbox/.gitkeep` if `inbox/` is empty.

5. **Confirm setup**

   Run `pkmp-verify` to confirm the structure is valid.
   Report what was created.

**Output**

```
PKMP initialized for: <project-name>

Created:
  registry/repository.yaml
  registry/documents.yaml
  registry/records.yaml
  registry/capabilities.yaml
  registry/schemas.yaml
  registry/lifecycles.yaml
  registry/workflows.yaml
  inbox/.gitkeep

All checks passed. Ready to use PKMP.

Next steps:
  1. Add PKMP skill trigger table to CLAUDE.md (and AGENTS.md if present).
     Without this step, the AI agent will not automatically invoke PKMP skills
     after SDD events (see LR-004: trigger table is the only connection).

     Trigger table to add to CLAUDE.md:
     | Trigger | Skill |
     |---|---|
     | inbox/ にファイルがある | `/pkmp:process-inbox` |
     | SDD作業を始める前にSPECが必要 | `/pkmp:spec-assist` |
     | 設計・技術的な判断が生まれた | `/pkmp:capture-decision` |
     | SDDのChangeがアーカイブされた | `/pkmp:capture-learnings` |
     | Canonical YAMLを変更した | `/pkmp:regenerate` |
     | コミット前・整合性確認 | `/pkmp:verify` |
     | 承認済みのPIレコードがある | `/pkmp:apply-process-improvement` |

  2. Start using PKMP:
     /pkmp:process-inbox     — process requirements from inbox/
     /pkmp:spec-assist       — draft a SPEC before starting SDD work
     /pkmp:capture-decision  — record an architectural decision
```

**Guardrails**
- Never overwrite existing registry files
- Always set state of new registry to valid initial values
- Confirm with the user if project name/owner cannot be inferred
