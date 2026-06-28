---
name: pkmp-simulate
description: Run a loop-engineering simulation to find gaps in PKMP skills, code, and documentation. Use autonomously to improve PKMP quality through repeated scenario tracing.
license: MIT
compatibility: Requires PKMP project structure (registry/, .pkmp/, .agent/skills/).
metadata:
  author: pkmp
  version: "1.0"
---

Systematically simulate the PKMP self-improvement loop to surface gaps before real usage does.

Each invocation runs one **simulation round**: pick a scenario, trace it step-by-step against
the actual skills and code, record findings, apply fixes, and commit. Repeat until no new
actionable gaps are found.

**Input**: Optionally specify a scenario name or focus area. If omitted, pick the highest-value
untested scenario automatically (see Scenario Catalogue below).

---

## Round structure

Each round follows this fixed structure:

### 1. Pick a scenario

Select from the Scenario Catalogue. Prefer scenarios that:
- Have not been simulated recently (check recent LR/PI records for coverage)
- Touch code paths that changed since the last simulation
- Cover integration between two or more skills (higher gap density)

If all scenarios have recent coverage, focus on the one with the most recent skill changes.

### 2. Trace the scenario

For the chosen scenario, mentally execute each step of the relevant SKILL.md(s) **against
the actual files on disk**:

- Follow every step in sequence, reading the actual SKILL.md as if you were a fresh AI
  encountering it for the first time (no prior knowledge assumptions)
- For each step that references a file path, verify the file exists on disk
- For each step that references a schema field, verify the field exists in the schema
- For each step that references another skill, verify that skill exists in `.agent/skills/`
- For each code path mentioned, read the actual implementation in `.pkmp/lib/` or `.pkmp/bin/`
  and confirm the behavior matches what the skill documents
- Note every discrepancy as a **candidate finding**

### 3. Classify findings

For each candidate finding, determine its severity and type:

| Finding type | Action |
|---|---|
| Skill step does wrong thing if followed literally | PI record (process improvement to the skill) |
| Skill step references non-existent file / wrong path | Fix directly + LR |
| Skill step numbering / label error | Fix directly + LR only if first occurrence |
| Code does not match what the skill documents | Fix code or fix skill doc + PI/LR |
| Schema missing a field the skill template uses | PI record |
| Human-only step missing from guardrails | PI record |
| Loop-breaking gap (silent skip, data lost) | PI record — mark as critical |
| Minor documentation ambiguity | LR only (no fix needed) |

**Skip** findings that:
- Are already captured as a Draft PI record
- Are cosmetic with no functional consequence
- Were fixed in a previous round (check `source_change` in recent LRs)

### 4. Apply fixes

For findings classified as "fix directly":
- Edit the relevant SKILL.md, schema, or `.pkmp/` code file
- Run `pkmp-verify` after any code change
- Run `pkmp-regenerate` after any canonical YAML change

For PI records: create `records/PI-<NNN>.yaml` and register as `state: Draft`.
Do not self-modify `registry/workflows.yaml`, `registry/lifecycles.yaml`, or `registry/schemas.yaml`
without human approval.

### 5. Record learnings

Create `records/LR-<NNN>.yaml` for each significant finding, even if no fix was applied.
Register with `state: Published`.
Use `source_change: simulation-round-<N>` where N is the current round number.

Determine the round number by counting how many LR/PI records have
`source_change` starting with `simulation-round-` in `registry/records.yaml`, then add 1.

### 6. Commit

Run `pkmp-verify` to confirm all checks pass.
Run `pkmp-regenerate`.
Commit with message: `sim(round-<N>): <one-line summary of what was found and fixed>`

---

## Scenario Catalogue

Work through these in order on first pass. On repeat passes, re-run scenarios whose
skills changed since the previous simulation of that scenario.

### S1 — New project init
**Skill**: `pkmp-init`
**Trace**: Follow every step. Verify `dist/registry/` files exist and are non-empty.
Confirm Next Steps output includes CLAUDE.md trigger table instruction.
**Key checks**:
- `dist/registry/lifecycles.yaml`, `workflows.yaml`, `schemas.yaml`, `capabilities.yaml` all non-empty
- Step 0 guard: `.pkmp/` check described correctly
- `pkmp-verify` call in Step 5 references the right command

### S2 — Inbox processing (new Spec)
**Skill**: `pkmp-process-inbox`
**Trace**: Simulate an inbox file containing a feature request.
Follow classification → knowledge retrieval → Spec YAML creation → registry → regenerate → archive.
**Key checks**:
- Step 2: "Architectural decision" correctly delegates to `capture-decision`, not creates directly
- Step 4: LR template uses `learning` + `applicability`, not `decision` + `rationale`
- Step 4: DC creation is delegated, not inlined
- Step 5: registry check for duplicate id before inserting
- Step 7: file moved to `inbox/processed/`, not deleted
- Output paths: `views/docs/` and `views/records/`, not `docs/` or `records/`

### S3 — Spec drafting (Path B, no Conclave)
**Skill**: `pkmp-spec-assist`
**Trace**: Simulate a topic with 3 relevant existing LR records, one of which is Superseded.
**Key checks**:
- Pass 1: Superseded set is built correctly (ids from `supersedes` values, not from `state`)
- Pass 1: Only Published LR/DC/ResearchRecord kept
- Pass 2: only runs if at least one record scored > 0
- Pass 2: step labels are sequential (no duplicates)
- Path B Step 6B: state set to `Reviewed` (not `Draft`, not `Published`)
- Output path for SPEC YAML: `docs/spec-<id>.yaml`, view: `views/docs/spec-<id>.md`

### S4 — Decision capture (Path B, no UDR)
**Skill**: `pkmp-capture-decision`
**Trace**: Simulate a new decision that supersedes an older one.
**Key checks**:
- Step labels: 2B/3B/4B/5B/6B — no duplicates
- Supersedes: new DC gets `supersedes: <old-id>` in registry; old DC state → Superseded
- Output view path: `views/records/DC-NNN.md`
- `rejected_alternatives` requires substantive reason (not single word)

### S5 — Learnings capture after SDD archive
**Skill**: `pkmp-capture-learnings`
**Trace**: Simulate a completed openspec change with `proposal.md` and `design.md`.
Follow all 7 steps. Generate one LR and one PI from the same change.
**Key checks**:
- Step 3: PI classification requires PKMP process change, not domain knowledge
- Step 4: LR YAML template does NOT include `state:` field (registry is truth)
- Step 6: LR registered with `state: Published` — not `state: Draft`
- Step 7b: PI registered with `state: Draft` — NOT Published
- Step 7c: Output shows PI as "(Draft — awaiting human approval)"
- No self-modification of `registry/workflows.yaml` or `registry/lifecycles.yaml`

### S6 — Apply process improvement
**Skill**: `pkmp-apply-process-improvement`
**Trace**: Simulate applying a Draft PI that changes a SKILL.md and a schema file.
**Key checks**:
- Step 1: Superseded PI → stop immediately (idempotent guard)
- Step 3: reads `decision` field from PI canonical YAML, not summary
- Step 4: `pkmp-verify` runs BEFORE marking as Superseded
- Step 5: BOTH `registry/records.yaml` AND canonical YAML `state:` (if present) updated
- Step 6: `pkmp-regenerate` runs after Superseded marking
- CLAUDE.md changes flagged as human-only (not applied by AI)

### S7 — Verify tool accuracy
**Skill**: `pkmp-verify` SKILL.md vs `.pkmp/lib/validators/`
**Trace**: Compare what the SKILL.md says verify does vs what the code actually does.
**Key checks**:
- Schema validation (step 1-3) matches `validateAllSchemas` in `schema.js`
- Registry consistency (step 4-5) matches `validateRegistry` in `registry.js`
- `[WARN]` vs `[FAIL]` classification matches code (`startsWith('[WARN]')` filter in `pkmp.js`)
- Stale-reference check: scans `docs/` content only (not `records/` content)
- Governance check: documents only, records excluded (records can go to Published without human)
- `external/` schema entries skipped in records validation

### S8 — Regenerate tool accuracy
**Skill**: `pkmp-regenerate` SKILL.md vs `.pkmp/lib/renderers/` and `.pkmp/bin/pkmp.js`
**Key checks**:
- `views: []` entries skipped (external record handling)
- `renderRecord` receives `registryState` from caller
- State shown in Metadata table of individual record views
- `renderIndexFiles` reads state from registry entry, not canonical YAML
- Output paths in SKILL.md match actual `console.log` output in code

### S9 — Cross-skill integration: full loop
**Trace**: Simulate one complete cycle:
  1. inbox → process-inbox → Spec created
  2. Spec → spec-assist → knowledge retrieval pulls relevant LR records
  3. Implementation (mocked) → archive-change → capture-learnings
  4. capture-learnings → LR created, PI created
  5. PI approved → apply-process-improvement
  6. verify → regenerate → commit

**Key checks**:
- Knowledge retrieval in step 2 correctly excludes the Superseded PI from step 5
- PI from step 4 appears in `all-records.md` as `Draft`
- After step 5, PI shows `Superseded` in `all-records.md` (from registry)
- The cycle can repeat from step 1 with new knowledge

---

## Stopping criteria

Stop the loop (do not schedule another round) when:
- The last 3 consecutive rounds each produced zero PI records and zero actionable LR records
- All scenarios in the catalogue have been covered at least once with no findings

When stopping, output:
```
=== Simulation loop complete ===

Rounds run: <N>
PI records created: <count>
LR records created: <count>
Open PI records (Draft, awaiting human): <list of ids>

No new actionable gaps found across 3 consecutive rounds.
Recommend real-world testing: run one full SDD cycle with capture-learnings
to surface gaps that simulation cannot detect.
```

---

## Guardrails
- Never modify `registry/workflows.yaml`, `registry/lifecycles.yaml`, or `registry/schemas.yaml`
  without a PI record and human approval
- Never modify `CLAUDE.md`, `AGENTS.md`, or `README.md` — describe the change and create a PI
- Always run `pkmp-verify` before committing; do not commit if verify fails
- Each round must produce at least one commit (even if only a "no findings" LR)
- Do not re-simulate a scenario that was just simulated in the previous round —
  rotate through scenarios to maximize coverage
- If `pkmp-verify` fails after a code fix, revert the fix and create a PI describing
  the intended change instead of applying it
