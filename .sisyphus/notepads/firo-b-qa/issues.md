FIRO-B manual QA issues and blockers
- Mismatch between FIRO submit API response shape and FIRO report UI expectations:
  - Backend returns: { scores: { rawScores, normalizedScores, percentages, dominant, secondary, pattern, analysis } }
  - Frontend FIRO report UI expects: data.scores.percentages, data.scores.patterns, data.narrative (overview + perDimension), and data.profileType resolved on client.
- No endpoint currently providing /api/attempts/:id/firo-results, yet FiroReport.jsx fetches from that path. This will fail in a real end-to-end flow unless implemented or UI updated.
- The FiroReport.jsx references report.narrative and report.scores (including percentages and patterns) but the seed-based scoring currently returns only percentages and dominant/secondary; there is no narrative or per-dimension patterns data from the scoring service.
- No explicit test wired for 54 questions in API tests beyond seed length check; require running full MongoDB-backed server to exercise the endpoints.
- DB connection needs environment (MONGODB_URI) and seed data; in this environment, DB is not spinning up, so end-to-end HTTP tests cannot be executed here.

Risk: If not aligned, frontend render and downstream reports will fail in production.
- Impacted components: backend/firoRoutes and firoController, backend/firoScoringService, frontend/FiroTest.jsx, frontend/FiroReport.jsx
- Proposed mitigations:
  1) Align API response payload to frontend expectations (scores: { percentages, patterns, narrative, profileType }) or adjust frontend to parse the existing payload.
  2) Implement /api/attempts/:id/firo-results endpoint or adapt FIRO report to use /api/firo/submit results and pass to the report UI via route state or a separate API call.
  3) Add unit tests around calculateFiroScores for boundary values (min/max) and inconsistent input handling for invalid arrays.
- Priority: high for end-to-end QA readiness.
