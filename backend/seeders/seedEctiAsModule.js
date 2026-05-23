/**
 * ECTI™ Module Seeder — Executive Critical Thinking Index
 *
 * Module-compatible version (no process.exit / mongoose.disconnect) so it can
 * be composed inside the unified seed runner (backend/seeds/seed.js).
 *
 * Idempotent: skips creation if an ECTI assessment already exists.
 */

const mongoose = require('mongoose');
const { Assessment, Question } = require('../models');
const { ECTI_QUESTIONS } = require('./ectiQuestions');

async function seedEctiAsModule() {
  // Idempotency check — use existing registered models
  const existing = await Assessment.findOne({ subCategory: 'ECTI' });
  if (existing) {
    console.log('  ⚠️  ECTI Assessment already seeded, skipping…');
    return;
  }

  // Resolve the superadmin user id so createdBy is set
  const { User } = require('../models');
  const superAdmin = await User.findOne({ role: 'superadmin' });
  const createdBy  = superAdmin?._id || new mongoose.Types.ObjectId();

  // Create assessment shell
  const assessment = await Assessment.create({
    title: 'Executive Critical Thinking Index (ECTI™)',
    description:
      'A 36-question scenario-based assessment measuring executive maturity, ' +
      'ethical courage, enterprise perspective, strategic foresight, and ' +
      'judgement under ambiguity. Designed for mid-career to CXO pipeline candidates.',
    category:    'cognitive',
    subCategory: 'ECTI',
    difficulty:  'tough',
    timeBound:   { enabled: true, durationMinutes: 45 },
    isActive:    true,
    isPublished: true,
    isLockedStructure: true,
    isEditable:  false,
    reportConfig: { type: 'standard', format: 'ecti', showScores: true, showFullReport: true, showPercentile: true, includeRecommendations: true },
    audience:    'Mid-Career | Senior Managers | Directors | CXO Pipeline',
    purpose:     'Assesses readiness for next-level leadership and executive decision quality.',
    instructions:
      'Choose the option that best reflects how you would most likely respond in a real ' +
      'professional situation. There may be more than one reasonable answer; select the ' +
      'one that demonstrates the strongest executive judgement.',
    createdBy,
    totalQuestions: 36,
    totalMarks: 144,
    passingScore: 60,
    passingPercentage: 60,
    allowMultipleAttempts: false,
    maxAttempts: 1,
    randomizeQuestions: false,
    randomizeOptions: false,
    tags: ['ecti', 'executive', 'critical-thinking', 'leadership', 'professional'],
  });

  // Create all 36 questions
  const questionDocs = ECTI_QUESTIONS.map(q => ({
    assessment: assessment._id,
    type:       'mcq',
    questionText: q.questionText,
    order:      q.order,
    dimension:  q.dimension,
    cluster:    q.cluster,
    marks:      4,
    isRequired: true,
    difficulty: 'tough',
    category:   'cognitive',
    subCategory: 'ECTI',
    options:    q.options.map(o => ({
      text:      o.text,
      score:     o.weight,
      isCorrect: o.weight === 4,
      order:     ['A', 'B', 'C', 'D'].indexOf(o.key),
      metadata:  { key: o.key, weight: o.weight },
    })),
    tags: ['ecti', q.dimension?.toLowerCase().replace(/[^a-z0-9]/g, '-')],
    explanation: `Dimension: ${q.dimension}. Best answer (weight 4) reflects the strongest executive judgement.`,
  }));

  const created = await Question.insertMany(questionDocs);
  const questionIds = created.map(d => d._id);

  assessment.questions = questionIds;
  await assessment.save();

  console.log(`  ✅  ECTI™: ${created.length} questions seeded (Assessment ID: ${assessment._id})`);
}

module.exports = seedEctiAsModule;
