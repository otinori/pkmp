---
name: pkmp-verify
description: Validate all YAML models against their schemas and check registry consistency. Use before committing or when checking project health.
license: MIT
compatibility: Requires PKMP project structure (registry/).
metadata:
  author: pkmp
  version: "1.0"
---

Validate all YAML canonical files and registry consistency.

Implements the `pkmp-verify` workflow defined in `registry/workflows.yaml`.

**Input**: None required.

**Steps**

1. **Load registry**

   Read `registry/documents.yaml` and `registry/records.yaml` for registered artifacts.
   Each entry specifies its own `schema` path — schema lookup is per-entry, not from
   `registry/schemas.yaml`. (`registry/schemas.yaml` is a catalog for human reference
   and is validated against its own schema, but not used for model validation.)

2. **Validate document models**

   For each entry in `registry/documents.yaml`:
   - Confirm `canonical` file exists on disk
   - Parse the YAML file
   - Validate against the schema specified in the registry entry
   - Collect any validation errors

3. **Validate record models**

   For each entry in `registry/records.yaml`:
   - Skip entries where `schema` starts with `external/` — these are externally managed
     (e.g., UDR cross-references) and the external tool is responsible for their validity
   - Confirm `canonical` file exists on disk
   - Parse the YAML file
   - Validate against the schema specified in the registry entry
   - Collect any validation errors

4. **Validate registry files themselves**

   Validate each registry file against its own schema:
   - `registry/repository.yaml`
   - `registry/documents.yaml`
   - `registry/records.yaml`
   - `registry/capabilities.yaml`
   - `registry/schemas.yaml`
   - `registry/lifecycles.yaml`
   - `registry/workflows.yaml`

5. **Registry consistency checks (additional)**

   Beyond file existence, pkmp-verify also runs:
   - **Stale-reference detection** (warning): scans docs/ content for record ids whose
     registry state is `Superseded`. Reports as `[WARN]` — non-blocking.
   - **Governance check** (warning): warns when a Document is in a Human-only state
     (`Published`, `Approved`, `Archived`) but the canonical YAML lacks
     `provenance.reviewed_at` or `provenance.published_at`. Reports as `[WARN]`.

6. **Report results**

   `[FAIL]` entries are blocking — resolve before committing.
   `[WARN]` entries are informational — surfaced in output but do not block commits.

**Output (success)**

```
=== PKMP Verify ===

--- Schema Validation ---
  All schemas valid.

--- Registry Validation ---
  Registry is consistent with file system.

=== All checks passed. ===
```

**Output (with warnings)**

```
=== PKMP Verify ===

--- Schema Validation ---
  All schemas valid.

--- Registry Validation ---
  [WARN] docs/spec-auth.yaml
         [WARN] references DC-003 which is Superseded. Consider updating.

=== All checks passed. ===
```

**Output (failure)**

```
=== PKMP Verify ===

--- Schema Validation ---
  [FAIL] docs/example.yaml
         instance.provenance is required

--- Registry Validation ---
  [FAIL] registry/records.yaml
         [LR-002] Referenced file not found: records/LR-002.yaml

=== Verify failed with 2 error group(s). ===
```

**Guardrails**
- Never auto-fix errors — only report them
- Always validate registry files themselves, not just the models they reference
- If a schema file is missing, report it as an error rather than skipping
- `[WARN]` messages are surfaced but never block commits — do not escalate them to errors
