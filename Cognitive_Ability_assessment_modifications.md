# Cognitive Ability Composite Assessment – Modification Guide

## 1️⃣ Overview
This document explains **what was changed** in earlier work, **how those changes affect the system**, and provides a **step‑by‑step guide** to add or modify a new *Cognitive Ability Composite Assessment* (CACA) in the **mindmill** codebase.

---

## 2️⃣ Impact of Past Updates (Why the system behaved differently)
| Update | Files Modified | What Changed | Direct Impact | Indirect Impact |
|--------|----------------|--------------|---------------|----------------|
| **Question text simplification** | `frontend/src/data/cognitiveAbilityQuestions.js` | Stripped long descriptive text from Q6‑Q12, left only a concise prompt. | UI now shows a clean one‑liner; less visual clutter. | Reduced DB‑side updates – only the `questionText` field needed to be rewritten for existing questions. |
| **Seeder sync** | `backend/seeders/seedCognitiveAbility.js` | Updated the same simplified prompts in the seed data. | New assessments created via `npm run seed` now contain the short prompts. | Guarantees that freshly seeded DB matches the front‑end data. |
| **MongoDB bulk update script** | `backend/scripts/updateQuestionTexts.js` (new) | Ran a script that updated *all* existing question documents in the live DB to the new prompts. | Existing assessments in production now display the short prompts. | No further manual DB migrations needed. |
| **Question rendering UI** | `frontend/src/pages/test/TakeTest.jsx` | Added `renderQuestionText()` – parses markdown tables and **bold** markup. Replaced plain `<h2>` with this renderer. | Tables and `**bold**` text inside `questionText` now render as a styled HTML table and bold spans. | Improves readability for the final 2‑3 LR questions that use pipe‑tables. |
| **Image replacement for Q7** | Replaced `public/cacs-images/logical_sequence_triangles.png` with a clean sequence image. | The visual now matches the answer options (progressive triangle count). | Test‑takers see a clear pattern → answer A is obvious. | No code changes required; only asset swap. |
| **Backend controller fix** | `backend/controllers/attemptController.js` (added `questionImage` to populate) | Public attempts now include `questionImage`. | Images are sent to the front‑end for both public and private attempts. | Eliminates 400 errors when trying to fetch missing images. |
| **Frontend image rendering** | `frontend/src/pages/test/TakeTest.jsx` (added conditional `question.questionImage` rendering) | Images now appear above options. | All question images (including the new Q7 image) display correctly. | Consistent UI across all assessments. |

> **Bottom line:** All recent changes were *non‑breaking* to core business logic. They only added data fields, UI helpers, and asset updates. No existing API contracts were altered, so other parts of the system remain stable.

---

## 3️⃣ Adding a New "Cognitive Ability Composite Assessment"
### 3.1 📂 Files to Create / Edit
| Layer | File | Purpose |
|------|------|---------|
| **Front‑end data** | `frontend/src/data/cognitiveAbilityQuestions.js` | Add a new question object (order, dimension, `questionText`, optional `questionImage`, and options). |
| **Seeder** | `backend/seeders/seedCognitiveAbility.js` | Mirror the new question entry so that fresh DB seeds include it. |
| **Model (optional)** | `backend/models/Question.js` – *usually unchanged* unless you need new fields (e.g., `explanation`). |
| **Controller** | No change needed unless you expose a new route or custom logic. |
| **Route** | If you want an admin‑only endpoint to create assessments dynamically, add to `backend/routes/assessmentRoutes.js`. |
| **UI Component** | `frontend/src/pages/assessment/AssessmentForm.jsx` (or reuse existing *Create Assessment* page) – ensure the form supports the new question type (`type: 'mcq'` is fine). |
| **Static assets** | `frontend/public/cacs-images/…` | Add any new question or option images. Use the same naming convention `cacs-images/<filename>.png` and `cacs-images/options/<filename>.svg`. |

### 3.2 🛠️ Step‑by‑Step Implementation
1. **Design the question**
   - Write a concise `questionText`. If you need a table, use Markdown pipe syntax (e.g., `| Header1 | Header2 |`).
   - Prepare any image (`questionImage`) and option images (`options[].image`).
2. **Add to front‑end data**
   ```js
   // Example – new LR question (order: 13)
   {
     order: 13,
     dimension: 'lr',
     questionText: 'Select the option that logically matches the pattern of increasing parallel elements shown below:',
     questionImage: 'cacs-images/logical_parallel_lines.png',
     options: [
       { text: '4 vertical parallel lines', image: 'cacs-images/options/q13_a.svg', isCorrect: true },
       { text: '5 intersecting lines',      image: 'cacs-images/options/q13_b.svg', isCorrect: false },
       // …other options…
     ]
   },
   ```
3. **Update the seeder** – copy the same object into `seedCognitiveAbility.js` inside the `Logical Reasoning` section.
4. **Add images**
   - Place `questionImage` under `frontend/public/cacs-images/`.
   - Place each option SVG under `frontend/public/cacs-images/options/`.
   - Commit the assets so they are served statically.
5. **Run the DB seed (if you need a fresh DB)**
   ```bash
   npm run seed   # or the specific seeder script defined in package.json
   ```
6. **Test the UI**
   - Start the dev server (`npm run dev`).
   - Navigate to the assessment creation page, add the new assessment, publish it, and then take the test.
   - Verify that:
     - The question text appears (via `renderQuestionText`).
     - The image shows above the options.
     - Option images render correctly.
7. **Optional – Admin API**
   - If you need a REST endpoint to **programmatically** create assessments, add a POST route in `backend/routes/assessmentRoutes.js` that uses the `Assessment` model to store the new assessment document.
   - Ensure the route is protected by the `isAdmin` middleware.
8. **Run impact analysis (GitNexus)**
   - Even though we only touch data files, run:
     ```bash
     gitnexus_impact --target "frontend/src/data/cognitiveAbilityQuestions.js" --direction upstream
     ```
   - Review the blast‑radius (should be *low* – only UI rendering). If any high‑risk symbols appear, address them before merging.
9. **Commit & PR**
   - Follow the repo’s contribution guide (branch, PR, code‑review).
   - Include the updated `Cognitive_Ability_assessment_modifications.md` in the PR so reviewers see the full change log.

---

## 4️⃣ Checklist Before Merging
- [ ] **Documentation** – `Cognitive_Ability_assessment_modifications.md` updated (this file). 
- [ ] **GitNexus impact analysis** – No HIGH/CRITICAL warnings.
- [ ] **Images** – All referenced files exist in `public/cacs-images/` and are correctly named.
- [ ] **Seeder** – New question appears when running `npm run seed`.
- [ ] **Front‑end rendering** – `renderQuestionText` correctly formats any markdown tables or `**bold**` text.
- [ ] **Backend API** – `attemptController.getPublicAttempt` still populates `questionImage` (no regression).
- [ ] **Manual QA** – Create a new CACA, publish, and complete the test on both private and public URLs.

---

## 5️⃣ Frequently Asked Questions (FAQ)
| Question | Answer |
|----------|--------|
| *Do I need to modify the database schema?* | No, the existing `Question` schema already contains `questionText`, `questionImage`, and an `options` array. Only add new documents. |
| *What if I want a different question type (e.g., rating)?* | Add `type: 'rating'` and follow the existing pattern in `cognitiveAbilityQuestions.js`. The UI already supports `rating` and `text` types. |
| *Can I reuse the table‑renderer for other assessments?* | Absolutely – `renderQuestionText` is a generic markdown parser; any assessment using pipe‑tables will benefit without extra code. |
| *Will changing question text affect existing attempts?* | Existing attempt records store a *snapshot* of the question at the time of the attempt, so historic attempts stay unchanged. New attempts will see the updated text. |
| *Do I need to run `gitnexus_detect_changes` before committing?* | Yes – run it after all code changes to ensure only the intended symbols were touched. |

---

## 6️⃣ References
- **GitNexus guide** – `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`
- **Cognitive Ability question data** – `frontend/src/data/cognitiveAbilityQuestions.js`
- **Seeder** – `backend/seeders/seedCognitiveAbility.js`
- **Image assets** – `frontend/public/cacs-images/`
- **UI renderer** – `frontend/src/pages/test/TakeTest.jsx`

*End of document.*
