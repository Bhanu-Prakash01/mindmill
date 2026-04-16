FIRO-B QA - Architectural and design decisions
- Decision: Do not modify existing plan file (.sisyphus/plans/*.md). All changes are tracked in notepads for traceability.
- Rationale: The FIRO-B feature currently has frontend expectations that are not 1:1 with the backend scoring output. This must be resolved to enable true end-to-end QA.
- Chosen approach for now: document gaps and propose alignment changes; implement API payload shape changes only after confirmation on scope.
- Risks: If not implemented, UI could render incomplete data or crash when no narrative/patterns are present.
- Next steps: align backend scores payload with frontend expectations; consider updating frontend to rely on existing shapes or to fetch additional narrative data from new endpoint.
