/**
 * Seed script — Executive Critical Thinking Index (ECTI™)
 * Creates the Assessment document and all 36 Questions in MongoDB.
 *
 * Usage:
 *   node backend/seeders/seedEcti.js
 *
 * Requires: MONGODB_URI in environment or backend/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { ECTI_QUESTIONS } = require('./ectiQuestions');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  MONGODB_URI not set'); process.exit(1); }

// Minimal inline schemas so we don't drag the whole model tree
const questionSchema = new mongoose.Schema({
  assessment: mongoose.Schema.Types.ObjectId,
  type: String,
  questionText: String,
  order: Number,
  dimension: String,
  cluster: String,
  options: [{ key: String, text: String, weight: Number, isCorrect: Boolean, score: Number }],
  marks: { type: Number, default: 4 },
}, { timestamps: true });

const assessmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  subCategory: String,
  questions: [mongoose.Schema.Types.ObjectId],
  difficulty: { type: String, default: 'moderate' },
  timeBound: Object,
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: true },
  reportConfig: Object,
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  totalQuestions: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  passingPercentage: { type: Number, default: 60 },
  audience: String,
  instructions: String,
  purpose: String,
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const Question   = mongoose.models.Question   || mongoose.model('Question',   questionSchema);
  const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);

  // Idempotency check
  const existing = await Assessment.findOne({ subCategory: 'ECTI', title: /ECTI/i });
  if (existing) {
    console.log('⚠️   ECTI Assessment already seeded (id:', existing._id, ')');
    await mongoose.disconnect();
    return;
  }

  // Create assessment shell
  const assessment = await Assessment.create({
    title: 'Executive Critical Thinking Index (ECTI™)',
    description:
      'A 36-question scenario-based assessment measuring an individual\'s critical thinking, ' +
      'executive maturity, ethical courage, enterprise perspective, strategic foresight, ' +
      'and judgement under ambiguity.',
    category: 'cognitive',
    subCategory: 'ECTI',
    difficulty: 'tough',
    timeBound: { enabled: true, durationMinutes: 45 },
    isActive: true,
    isPublished: true,
    reportConfig: { type: 'standard', format: 'ecti' },
    audience: 'Senior Leaders | Executives | CXO Pipeline',
    purpose: 'Assesses readiness for next-level leadership and executive decision quality.',
    instructions:
      'Choose the option that best reflects how you would most likely respond in a real ' +
      'professional situation. There may be more than one reasonable answer; select the ' +
      'one that demonstrates the strongest judgement.',
  });

  console.log('📋  Assessment created:', assessment._id);

  // Create all 36 questions
  const questionDocs = ECTI_QUESTIONS.map(q => ({
    assessment: assessment._id,
    type: 'mcq',
    questionText: q.questionText,
    order: q.order,
    dimension: q.dimension,
    cluster: q.cluster,
    marks: 4,
    options: q.options.map(o => ({
      key: o.key,
      text: o.text,
      weight: o.weight,
      isCorrect: o.weight === 4,
      score: o.weight,
    })),
  }));

  const created = await Question.insertMany(questionDocs);
  const questionIds = created.map(d => d._id);

  assessment.questions    = questionIds;
  assessment.totalQuestions = questionIds.length;
  assessment.totalMarks   = questionIds.length * 4; // max 4 per question
  await assessment.save();

  console.log(`✅  ${created.length} questions seeded for ECTI™ assessment`);
  console.log('    Assessment ID:', assessment._id.toString());
  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌  Seeder error:', err); process.exit(1); });
