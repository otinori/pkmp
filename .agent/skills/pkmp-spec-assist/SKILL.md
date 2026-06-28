---
name: pkmp-spec-assist
description: Draft a SPEC document before starting SDD work. Uses Conclave for multi-persona requirements deliberation when available, falls back to single-AI drafting otherwise.
license: MIT
compatibility: Requires PKMP project structure (registry/). Conclave integration is optional but recommended for higher-quality SPECs.
metadata:
  author: pkmp
  version: "1.0"
---

Create a SPEC document to guide SDD work.

Implements the `spec-assist` workflow defined in `registry/workflows.yaml`.

A good SPEC requires multiple perspectives: product value, technical feasibility,
security risk, and user experience. Conclave provides this through multi-persona
deliberation. Without Conclave, a single AI drafts the SPEC.

**Input**: Optionally describe what needs to be built. If omitted, read from `inbox/` or ask the human.

**Steps**

1. **Read existing project knowledge**

   Before any drafting, scan accumulated knowledge so the SPEC builds on prior work.
   Use a two-pass approach to avoid reading all records when the knowledge base is large.

   **Pass 1 — index scan (always)**
   a. Read `registry/records.yaml` (index only — do not read canonical files yet)
   b. Build the **superseded set**: collect every `id` that appears as a `supersedes` value
      in any other record entry. Records in this set are outdated and must be excluded.
   c. From the remaining entries, keep only those where:
      - `state: Published`
      - `type` is `LearningRecord`, `ResearchRecord`, or `DecisionRecord`
   d. Score each by title-keyword overlap with the SPEC topic (rough match — split both
      into words, count overlapping tokens). Keep the top 5 by score.
      If fewer than 5 exist, keep all.

   **Pass 2 — full read (top matches only)**
   e. If all selected records scored 0 (no token overlap at all), skip Pass 2.
      Proceed with empty prior knowledge summary and note "No relevant prior knowledge found."
   f. Read the canonical YAML for each record selected in Pass 1 (only if at least one scored > 0).
   g. Summarize as a bullet list (max 5 items), reading type-specific fields:
      - `LearningRecord`: read `learning` field (fall back to `decision` if `learning` absent)
        → pattern or pitfall to carry forward into this SPEC
      - `ResearchRecord`: read `decision` field
        → research finding or proposed approach to consider
      - `DecisionRecord`: read `decision` field; include record id for traceability (e.g., "per DC-003")
        → prior architectural choice that constrains or informs this SPEC

   If no relevant records exist, note that and proceed.

   This summary is used as:
   - **Path A**: opening context handed to the Conclave session before deliberation begins
   - **Path B**: seed content for the Constraints and Open Questions sections

2. **Check which spec-deliberation provider is active**

   Read `registry/capabilities.yaml` and find `id: spec-deliberation`.
   - If `provider: conclave`:
     - Verify Conclave is installed by checking `.conclave/config.yaml` exists on disk
     - If installed → follow **Path A: Conclave**
     - If NOT installed → warn: "capabilities.yaml specifies Conclave but `.conclave/` not found.
       Falling back to Path B. Consider running Conclave setup or updating capabilities.yaml."
       → follow **Path B: PKMP built-in**
   - If `provider: pkmp-builtin` or entry absent → follow **Path B: PKMP built-in**

   If the registry entry is absent entirely, also check for `.conclave/config.yaml`:
   - Exists → Conclave is available but not registered; ask the human if they want to use it
   - Not found → follow **Path B**

---

## Path A: Conclave (recommended)

Conclave deliberates requirements from multiple expert angles before PKMP
structures them into a formal SPEC. Produces higher-quality SPECs by surfacing
conflicts, assumptions, and constraints that single-AI drafting misses.

2A. **Gather topic from requirements**

   Read from, in order:
   - User input from this invocation
   - Unprocessed files in `inbox/`
   - Conversation context

   Summarize the topic in 1-3 sentences for the Conclave session.

3A. **Summon relevant Conclave personas**

   Invoke `/conclave-summon` with:
   - `topic`: the SPEC topic summary
   - `context`: prior knowledge summary from Step 1 (paste bullet list as session context)
   - `confidentiality`: INTERNAL (default) or as specified by the human
   - `personas`: suggest relevant guilds based on topic nature:
     - Always: `architecture` (technical feasibility, constraints)
     - If user-facing: `field` (UX/usability) and `business` (value/ROI)
     - If security-sensitive: `governance` (risk, compliance)
     - If complex/multi-stakeholder (3+ personas): add `facilitation`

   Announce: "Summoning Conclave for SPEC deliberation: <topic>"

4A. **Guide deliberation toward SPEC structure**

   During the Conclave session, guide personas to address:
   - **Purpose**: What problem does this solve and why now?
   - **Scope**: What is in and explicitly out of scope?
   - **Constraints**: Technical, business, or time constraints each persona sees
   - **Acceptance criteria**: How will we know it's done? (measurable)
   - **Risks and holds**: What could go wrong? What's unresolved?

   Let personas disagree — conflicts and holds in the minutes are valuable input.

5A. **Dismiss and capture minutes**

   Invoke `/conclave-dismiss`.
   This writes minutes to `.conclave/sessions/<session-id>/minutes.md`.
   Note the session ID for provenance.

6A. **Distill minutes into SPEC YAML**

   Read the generated minutes. Extract and structure:

   - **Purpose** ← Topic + agreements on "why"
   - **Scope** ← Agreements on what's in/out
   - **Constraints** ← Each persona's constraints (merge, keep source persona)
   - **Acceptance criteria** ← Agreed measurable outcomes
   - **Open questions** ← Holds and unresolved conflicts

   ID naming convention: `spec-<kebab-case-feature-name>` (e.g., `spec-oauth-auth`,
   `spec-user-permissions`). Check `registry/documents.yaml` for conflicts before using.

   Create `docs/spec-<id>.yaml`:
   ```yaml
   id: spec-<id>
   title: <feature/change name>
   content: |
     ## Purpose
     <from minutes agreements>

     ## Scope
     <from minutes agreements>

     ## Out of Scope
     <from minutes agreements>

     ## Constraints
     <merged from all persona perspectives>

     ## Acceptance Criteria
     - <measurable criterion from agreements>

     ## Open Questions
     <from holds and conflicts in minutes>
   provenance:
     source: conclave/<session-id>
     derived_from:
       - .conclave/sessions/<session-id>/minutes.md
     authored_by:
       role: implementation-agent
       identifier: <AI identifier>
     authored_at: <ISO8601>
   ```

7A. **Register, generate view, request approval**

   Add to `registry/documents.yaml` with `state: Draft` and `lifecycle: spec`.
   Run `pkmp-regenerate`. Update state to `Reviewed` (SPEC lifecycle uses `Reviewed`, not `InReview`).
   Inform the human that deliberation is complete and SPEC is ready for review.

---

## Path B: PKMP built-in (fallback)

Use when Conclave is not available. Single AI drafts the SPEC.

2B. **Gather requirements**

   Check in order: user input → `inbox/` → conversation context.
   If still unclear, ask the human before drafting.

3B. **Incorporate prior knowledge**

   Take the prior knowledge summary from Step 1.
   If the summary is empty (no relevant records found), skip to Step 4B.
   Otherwise, determine which items apply to this SPEC:
   - Applicable `LearningRecord` or `ResearchRecord` items → add to **Constraints** section
   - Applicable `DecisionRecord` items → add to **Constraints** section with reference (`records/<id>.yaml`)
   - Unresolved items → add to **Open Questions** section

4B. **Clarify scope**

   Confirm with the human:
   - What problem is being solved?
   - What is explicitly out of scope?
   - Known constraints (performance, compatibility, security)?
   - Acceptance criteria?

5B. **Draft the SPEC document**

   ID naming convention: `spec-<kebab-case-feature-name>` (e.g., `spec-oauth-auth`,
   `spec-user-permissions`). Check `registry/documents.yaml` for conflicts before using.

   Create `docs/spec-<id>.yaml`:
   ```yaml
   id: spec-<id>
   title: <feature/change name>
   content: |
     ## Purpose
     <what problem this solves and why>

     ## Scope
     <what is in scope>

     ## Out of Scope
     <what is explicitly excluded>

     ## Constraints
     <known technical or business constraints>

     ## Acceptance Criteria
     - <measurable criterion>

     ## Open Questions
     <unresolved questions>
   provenance:
     source: <inbox file or "conversation">
     authored_by:
       role: implementation-agent
       identifier: <AI identifier>
     authored_at: <ISO8601>
   ```

6B. **Register, generate view, request approval**

   Add to `registry/documents.yaml` with `state: Draft` and `lifecycle: spec`.
   Run `pkmp-regenerate`. Update state to `Reviewed` (SPEC lifecycle uses `Reviewed`, not `InReview`).

---

**Output (Path A)**

```
=== PKMP Spec Assist (via Conclave) ===

Conclave session: sess-20260628-143022
Personas: architecture, field, governance, facilitation
Minutes: .conclave/sessions/sess-20260628-143022/minutes.md

Distilled into SPEC:
  Created: docs/spec-auth.yaml
  View:    docs/spec-auth.md
  State:   Reviewed

Key conflicts captured as Open Questions:
  - Hold (governance): OAuth token expiry policy needs legal review
  - Conflict (architecture vs field): offline mode scope unclear

SPEC is ready for your review and approval.
```

**Output (Path B)**

```
=== PKMP Spec Assist ===

SPEC drafted: docs/spec-auth.yaml
View generated: docs/spec-auth.md
State: Reviewed

SPEC is ready for your review and approval.
```

**Guardrails**
- Prefer Conclave when available — conflicts and holds in minutes improve SPEC quality
- Never mark a SPEC as Approved — only the human can approve
- Preserve Conclave conflicts as Open Questions in the SPEC — do not silently resolve them
- Keep acceptance criteria measurable; reject vague criteria like "should be fast"
- In Path A: always link provenance to the Conclave session for traceability
