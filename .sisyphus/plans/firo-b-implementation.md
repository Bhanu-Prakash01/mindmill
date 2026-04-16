# Plan: FIRO-B Assessment Implementation

## TL;DR
> **Summary**: Implement FIRO-B (Fundamental Interpersonal Relations Orientation-Behavior) assessment with 54 questions across 6 scales, scoring service with scientific formulas, backend controller/routes, frontend test page and comprehensive report.
> **Deliverables**: Question seeder, scoring service, controller/routes, frontend test + report pages
> **Effort**: Medium-Large (comparable to Big5 implementation)
> **Parallel**: YES - Frontend/backend can be developed in parallel after core files created
> **Critical Path**: Questions → Scoring → Controller → Integration → Frontend

## Context
### Original Request
Implement FIRO-B assessment similar to existing DISC and Big5 implementations. Must include:
- Proper questions and choices based on FIRO-B theory
- Report generation with scientific formulas and derived methods
- Web search for FIRO-B implementation guidance

### Interview Summary
- **Assessment Type**: Personality/Interpersonal needs assessment
- **Structure**: 54 questions (9 per scale × 6 scales)
- **Dimensions**: 
  - Inclusion (I): Need for belonging, group membership
  - Control (C): Need for authority, influence, power
  - Affection (A): Need for closeness, warmth, intimacy
- **Directions**:
  - Expressed (e): Behavior directed toward others
  - Wanted (w): Behavior desired from others
- **Scoring**: Guttman scale 0-9 per dimension, responses on 1-6 or 1-7 scale
- **Reference Implementation**: DISC (28 forced-choice questions), Big5 (50 Likert-scale questions)

### Metis Review (gaps addressed)
- Validated FIRO-B theory against multiple sources (Myers-Briggs, Wikipedia, academic papers)
- Confirmed standard 54-item structure with 9 items per scale
- Identified scoring methodology: sum of responses per scale (0-9 range)
- Noted potential compatibility analysis for team building (future scope)

## Work Objectives
### Core Objective
Create a fully functional FIRO-B assessment module matching the architecture and quality of existing DISC/Big5 implementations.

### Deliverables
1. **Backend**:
   - `backend/seeders/firoQuestions.js` - 54 questions with proper trait mapping
   - `backend/services/firoScoringService.js` - Scoring with scientific formulas
   - `backend/controllers/firoController.js` - API endpoints
   - `backend/routes/firoRoutes.js` - Route definitions
   - `backend/seeders/seedFiro.js` - Database seeder

2. **Frontend**:
   - `frontend/src/pages/assessments/FiroTest.jsx` - Test interface
   - `frontend/src/pages/reports/FiroReport.jsx` - Results display
   - Update `Assessments.jsx` to include FIRO-B option

### Definition of Done (verifiable conditions with commands)
- [ ] `curl http://localhost:5000/api/firo/questions` returns 54 questions
- [ ] POST to `/api/firo/submit` with valid responses returns scored results
- [ ] Frontend test page renders all 54 questions with proper choices
- [ ] Report page displays all 6 scale scores with percentages
- [ ] Integration test: Complete test flow from start to report

### Must Have
- 54 questions covering all 6 scales (eI, wI, eC, wC, eA, wA)
- 6-point Likert scale responses (1-6: Never to Usually)
- Raw scores (0-9), percentages, and level classifications (Low/Medium/High)
- Narrative interpretation for each dimension
- Scientific scoring formulas documented in code

### Must NOT Have
- Element B (updated version) - stick to classic FIRO-B
- Compatibility analysis between multiple users (future feature)
- Any proprietary MBTI content - use publicly available questions

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after (like DISC/Big5 patterns)
- QA policy: Every task has agent-executed scenarios
- Evidence: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy
### Parallel Execution Waves
Wave 1: [Backend core - questions + scoring + controller]
Wave 2: [Frontend + integration]

### Dependency Matrix (full, all tasks)
- Task 1 (Questions) → Task 2 (Scoring) → Task 3 (Controller) → Task 7 (Integration)
- Task 4 (Routes) can parallel after Controller
- Task 5 (Frontend Test) after Scoring complete
- Task 6 (Report) depends on Controller + Scoring

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1: 4 tasks (build - backend core)
- Wave 2: 3 tasks (visual-engineering - frontend, build - integration)

## TODOs

- [x] 1. Create FIRO-B questions seeder (54 questions, 6 scales)

  **What to do**: Create `backend/seeders/firoQuestions.js` with 54 questions covering:
  - Expressed Inclusion (eI): Questions 1-9
  - Wanted Inclusion (wI): Questions 10-18
  - Expressed Control (eC): Questions 19-27
  - Wanted Control (wC): Questions 28-36
  - Expressed Affection (eA): Questions 37-45
  - Wanted Affection (wA): Questions 46-54
  Each question has 6 response options (1=Never to 6=Usually)

  **Must NOT do**: Copy exact MBTI proprietary questions; create generic FIRO-B style questions

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Creating structured assessment content with proper psychometric design
  - Skills: [] - Not needed
  - Omitted: [] - Not needed

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [] | Blocked By: []

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `backend/seeders/discQuestions.js` - Question structure with trait mapping
  - Pattern: `backend/seeders/big5Questions.js` - Direction (positive/negative) mapping
  - API/Type: `backend/models/Question.js` - Question schema
  - External: `https://scales.arabpsychology.com/s/fundamental-interpersonal-relationship-orientation/` - Sample FIRO-B questions
  - External: `https://www.themyersbriggs.com/-/media/Myers-Briggs/Files/Global-Resource-Hub-Files/Resource-Library/Guide/Wanted-and-Expressed-Interpersonal-Needs-and-the-FIROB-Tool_US.pdf` - Official FIRO-B guide

  **Acceptance Criteria** (agent-executable only):
  - [ ] File created at `backend/seeders/firoQuestions.js`
  - [ ] Contains 54 questions with order 1-54
  - [ ] Each question has trait mapping (eI/wI/eC/wC/eA/wA)
  - [ ] 6 response options per question (1-6 scale)

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: File structure validation
    Tool: Bash
    Steps: node -e "const q = require('./backend/seeders/firoQuestions.js'); console.log('Questions:', q.firoQuestions.length, 'Scales:', Object.keys(q.firoConfig || {}).length)"
    Expected: Questions: 54, Scales: 6
    Evidence: .sisyphus/evidence/task-1-firo-questions-structure.json
  ```

  **Commit**: YES | Message: `feat(assessments): add FIRO-B 54-question seeder` | Files: [backend/seeders/firoQuestions.js]

- [x] 2. Create FIRO-B scoring service with scientific formulas

  **What to do**: Create `backend/services/firoScoringService.js` with:
  - Score calculation: Sum responses for each scale (each scale has 9 questions)
  - Raw scores: 0-9 per dimension
  - Percentages: (rawScore / 9) * 100
  - Level classification: Low (0-3), Medium (4-6), High (7-9)
  - Profile classification based on e vs w patterns
  - Narrative generation for each dimension

  **Must NOT do**: Use arbitrary formulas - must follow standard FIRO-B scoring

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Mathematical scoring logic with psychometric formulas
  - Skills: [] - Not needed
  - Omitted: [] - Not needed

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [3, 5, 6] | Blocked By: [1]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `backend/services/discScoringService.js` - Scoring service structure
  - Pattern: `backend/services/big5ScoringService.js` - Big5 formula patterns (base + add - subtract)
  - API/Type: Expected output structure matches DISC/Big5
  - External: Wikipedia FIRO-B - Scoring methodology (0-9 per scale)

  **Acceptance Criteria** (agent-executable only):
  - [ ] File created at `backend/services/firoScoringService.js`
  - [ ] `calculateFiroScores(responses)` returns raw scores, percentages, levels
  - [ ] All 6 scales calculated (eI, wI, eC, wC, eA, wA)
  - [ ] Narrative generation works for all dimensions

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Scoring calculation validation
    Tool: Bash
    Steps: node -e "const svc = require('./backend/services/firoScoringService.js'); const test = {1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1}; const result = svc.calculateFiroScores(test); console.log(JSON.stringify(result, null, 2));"
    Expected: eI score should be 9 (minimum), percentage 100%
    Evidence: .sisyphus/evidence/task-2-firo-scoring-min.json

  Scenario: Maximum score validation
    Tool: Bash
    Steps: node -e "const svc = require('./backend/services/firoScoringService.js'); const test = {}; for(let i=1;i<=54;i++) test[i]=6; const result = svc.calculateFiroScores(test); console.log('eI:', result.scores.eI)"
    Expected: eI score should be 54 (9*6), percentage 100%
    Evidence: .sisyphus/evidence/task-2-firo-scoring-max.json
  ```

  **Commit**: YES | Message: `feat(assessments): add FIRO-B scoring service` | Files: [backend/services/firoScoringService.js]

- [x] 3. Create FIRO-B controller
- [x] 4. Create FIRO-B routes

- [x] 5. Create database seeder

  **What to do**: Create `backend/seeders/seedFiro.js` to populate questions in database

  **Must NOT do**: Skip database seeding step

  **Recommended Agent Profile**:
  - Category: `quick` - Simple seeder following existing pattern
  - Skills: [] - Not needed
  - Omitted: [] - Not needed

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [] | Blocked By: [1]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `backend/seeders/seedDisc.js` - Seeder pattern

  **Acceptance Criteria** (agent-executable only):
  - [ ] File created at `backend/seeders/seedFiro.js`
  - [ ] Seeder populates 54 questions to database

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Seeder execution
    Tool: Bash
    Steps: cd backend && node seeders/seedFiro.js
    Expected: "Seeded 54 FIRO-B questions" or similar success message
    Evidence: .sisyphus/evidence/task-5-firo-seeder.json
  ```

  **Commit**: YES | Message: `feat(assessments): add FIRO-B database seeder` | Files: [backend/seeders/seedFiro.js]

- [x] 6. Create frontend test page

  **What to do**: Create `frontend/src/pages/assessments/FiroTest.jsx` with:
  - Display all 54 questions
  - 6-option Likert scale for each question
  - Progress indicator
  - Submit functionality
  - Match styling with DiscTest.jsx and Big5Test.jsx

  **Must NOT do**: Use different UI pattern than existing tests

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Frontend UI component
  - Skills: [] - Not needed
  - Omitted: [] - Not needed

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [7] | Blocked By: [2, 3]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `frontend/src/pages/assessments/DiscTest.jsx` - Test page structure
  - Pattern: `frontend/src/pages/assessments/Big5Test.jsx` - Similar structure

  **Acceptance Criteria** (agent-executable only):
  - [ ] File created at `frontend/src/pages/assessments/FiroTest.jsx`
  - [ ] All 54 questions render
  - [ ] 6 response options per question
  - [ ] Submit sends correct payload to API

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Frontend render check
    Tool: Playwright
    Steps: Navigate to /assessments/firo, verify question count
    Expected: 54 questions visible
    Evidence: .sisyphus/evidence/task-6-firo-frontend.png
  ```

  **Commit**: YES | Message: `feat(frontend): add FIRO-B test page` | Files: [frontend/src/pages/assessments/FiroTest.jsx]

- [x] 7. Create frontend report page

  **What to do**: Create `frontend/src/pages/reports/FiroReport.jsx` with:
  - Display all 6 scale scores with percentages
  - Bar chart visualization for each dimension
  - Level classifications (Low/Medium/High)
  - Narrative interpretation for each dimension
  - Profile type classification based on pattern
  - Match styling with DiscReport.jsx and Big5Report.jsx

  **Must NOT do**: Skip any of the 6 dimensions in display

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Report visualization
  - Skills: [] - Not needed
  - Omitted: [] - Not needed

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [] | Blocked By: [2, 3, 6]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `frontend/src/pages/reports/DiscReport.jsx` - Report structure
  - Pattern: `frontend/src/pages/reports/Big5Report.jsx` - Similar structure

  **Acceptance Criteria** (agent-executable only):
  - [ ] File created at `frontend/src/pages/reports/FiroReport.jsx`
  - [ ] All 6 scales displayed with scores and percentages
  - [ ] Visual representation (bar charts)
  - [ ] Level classifications shown

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Report display validation
    Tool: Playwright
    Steps: Complete test, verify report shows all 6 dimensions
    Expected: eI, wI, eC, wC, eA, wA all visible
    Evidence: .sisyphus/evidence/task-7-firo-report.png
  ```

  **Commit**: YES | Message: `feat(frontend): add FIRO-B report page` | Files: [frontend/src/pages/reports/FiroReport.jsx]

- [x] 8. Update Assessments.jsx to include FIRO-B option

  **What to do**: Add FIRO-B to the assessment selection in `frontend/src/pages/assessments/Assessments.jsx`

  **Must NOT do**: Duplicate existing assessments structure

  **Recommended Agent Profile**:
  - Category: `quick` - Simple config addition
  - Skills: [] - Not needed
  - Omitted: [] - Not needed

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [] | Blocked By: []

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `frontend/src/pages/assessments/Assessments.jsx` - Existing structure

  **Acceptance Criteria** (agent-executable only):
  - [ ] FIRO-B appears in assessment selection
  - [ ] Clicking navigates to FiroTest.jsx

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Navigation test
    Tool: Playwright
    Steps: Go to /assessments, click FIRO-B, verify URL contains /firo
    Expected: URL changes to assessment/firo
    Evidence: .sisyphus/evidence/task-8-firo-nav.json
  ```

  **Commit**: YES | Message: `feat(frontend): add FIRO-B to assessment list` | Files: [frontend/src/pages/assessments/Assessments.jsx]

- [x] 9. Integration test - full flow

  **What to do**: Verify complete FIRO-B assessment flow works end-to-end

  **Must NOT do**: Skip integration testing

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - End-to-end verification
  - Skills: [] - Not needed
  - Omitted: [] - Not needed

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [] | Blocked By: [1, 2, 3, 4, 5, 6, 7, 8]

  **References** (executor has NO interview context - be exhaustive):
  - N/A - Integration test

  **Acceptance Criteria** (agent-executable only):
  - [ ] Questions load → Complete test → Submit → View report
  - [ ] All 6 scores display correctly

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Full end-to-end flow
    Tool: Playwright
    Steps: Start at /assessments → Select FIRO-B → Answer all 54 → Submit → Verify report
    Expected: Complete flow without errors, all 6 dimensions in report
    Evidence: .sisyphus/evidence/task-9-firo-e2e.json
  ```

  **Commit**: NO | Message: `` | Files: []

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep
## Commit Strategy
- Each task commits individually as specified
- All commits use conventional format: `feat(area): description`
- Group related files in single commit when appropriate

## Success Criteria
- FIRO-B assessment fully functional matching DISC/Big5 quality
- All 54 questions properly structured with 6 response options
- Scoring uses scientific formulas (0-9 per scale)
- Report displays all 6 dimensions with percentages and levels
- End-to-end flow works without errors