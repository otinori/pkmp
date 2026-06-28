# PKMP_PROJECT_KNOWLEDGE_v1.0

# Purpose

This document is the canonical transfer of architectural knowledge from
ChatGPT (Web) to any future CLI or implementation agent.

The CLI SHALL treat this document as the highest-priority design
knowledge. Where detailed specifications are incomplete, the CLI SHALL
preserve the principles and decisions recorded here.

# Non-Negotiable Decisions

1.  Knowledge is the primary deliverable.
2.  Information Model is the Canonical Source.
3.  Repository is a generated projection of the model.
4.  Markdown is a rendered view only.
5.  OpenSpec defines executable capabilities.
6.  UDR records architectural decisions.
7.  Repository Snapshots are complete snapshots.
8.  Published Knowledge supersedes Draft Knowledge.
9.  AI acts as Chief Architect.
10. Human acts as Knowledge Owner.
11. CLI is an implementation agent, not an architect.

# Architectural Intent

The CLI SHALL NOT redesign PKMP.

The CLI SHALL: - generate repositories; - expand specifications; -
implement deterministic algorithms; - validate; - review; - refactor
without changing architecture.

The CLI SHALL NOT: - introduce new architectural concepts unless
existing concepts cannot express the requirement; - silently rename
canonical identifiers; - discard provenance.

# Knowledge Preservation

Conversation is temporary. Knowledge is permanent.

Every architectural decision SHALL eventually exist in a repository
artifact.

Conversation history SHALL NEVER be required for reconstruction.

# Repository Philosophy

Repository == Projection

Knowledge == Canonical

Model == Truth

Everything else is generated.

# Development Strategy

1.  Preserve this document.
2.  Expand implementation specifications.
3.  Generate repository.
4.  Execute validator.
5.  Execute reviewer.
6.  Human review.
7.  Publish.

# Success Criteria

Success is NOT completion of documents.

Success is achieved when an independent CLI reconstructs PKMP from the
published knowledge without needing prior chat history.

# Work Remaining

The implementation specifications created in previous drafts are
outlines and section-level contracts.

The CLI SHALL expand them into complete artifacts: - full YAML schemas -
full JSON schemas - OpenSpec definitions - repository manifests -
validators - renderers - bootstrap repository - reference
implementation - conformance tests

while preserving every decision recorded in this document.

# Final Directive

If any implementation detail is ambiguous:

1.  Preserve existing architectural decisions.
2.  Preserve canonical identifiers.
3.  Prefer extending the model over creating new concepts.
4.  Record every new decision as knowledge before implementation.
