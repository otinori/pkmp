---
name: pkmp-regenerate
description: Render all YAML canonical files to Markdown views. Use after updating any YAML model to refresh human-readable output.
license: MIT
compatibility: Requires PKMP project structure (registry/).
metadata:
  author: pkmp
  version: "1.0"
---

Render all YAML canonical files to Markdown views.

**Input**: None required. Optionally specify a single file path to regenerate only that file.

**Steps**

1. **Load registry**

   Read `registry/documents.yaml` and `registry/records.yaml`.

2. **Render document models**

   For each entry in `registry/documents.yaml`:
   - Read the `canonical` YAML file
   - Render to Markdown using the document rendering template (see below)
   - Write to each path listed in `views`
   - Report: `[OK] docs/example.yaml → docs/example.md`

3. **Render record models**

   For each entry in `registry/records.yaml`:
   - Skip entries with `views: []` (empty array) — these are externally managed records
     (e.g., UDR cross-references). Do NOT write any file for these entries.
   - Read the `canonical` YAML file
   - Render to Markdown using the record rendering template (see below)
   - Write to the first path listed in `views`
   - Report: `[OK] records/DC-001.yaml → records/DC-001.md`

4. **Generate index views**

   Generate cross-cutting index files in `views/`:
   - `views/all-records.md` — ALL record entries (DC, LR, PI, etc.) in a table,
     titled "Project Knowledge Records Index"

**Document Markdown Template**

```markdown
# {title}

## Metadata

| Key | Value |
| --- | --- |
| ID | {id} |
| Source | {provenance.source} |
| Authored By | {provenance.authored_by.role} ({provenance.authored_by.identifier}) |
| Authored At | {provenance.authored_at} |

## Content

{content}
```

**Record Markdown Template**

```markdown
# [{id}] {title}

## Metadata

| Key | Value |
| --- | --- |
| ID | {id} |
| Type | {type} |
| Authored By | {provenance.authored_by.role} ({provenance.authored_by.identifier}) |
| Authored At | {provenance.authored_at} |

## Context

{context}

<!-- DecisionRecord only -->
## Decision

{decision}

## Rationale

{rationale}
<!-- /DecisionRecord only -->

<!-- If implications array is present -->
## Implications

- {implications[0]}

<!-- If LearningRecord -->
## Learning

{learning}

## Applicability

{applicability}

**Source change**: {source_change}
<!-- /LearningRecord -->
```

**Output**

```
=== PKMP Regenerate ===

--- Rendering Documents ---
  [OK] /path/to/views/docs/pkmp-charter.md

--- Rendering Records ---
  [OK] /path/to/views/records/DC-001.md
  [OK] /path/to/views/records/DC-002.md
  [SKIP] records/udr-ref.yaml (no views defined — external record)

--- Generating Index Views ---
Generated Knowledge Records Index: /path/to/views/all-records.md

=== Regeneration complete. ===
```

**Guardrails**
- Never edit canonical YAML files — only read them
- Always overwrite view files (they are regenerable, not canonical)
- Skip files listed in registry but not found on disk — report as warning, not error
