/**
 * Seed script — Professional Coachability & Learning Agility Index (PCLA™)
 * Creates the Assessment document and all 35 Questions in MongoDB.
 *
 * Usage:
 *   node backend/seeders/seedPcla.js
 *
 * Requires: MONGODB_URI in environment or backend/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { PCLA_QUESTIONS } = require('./pclaQuestions');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  MONGODB_URI not set'); process.exit(1); }

// Minimal inline schemas so we don't drag the whole model tree
const questionSchema = new mongoose.Schema({
  assessment: mongoose.Schema.Types.ObjectId,
  type: String,
  questionText: String,
  order: Number,
  dimension: String,
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
  const existing = await Assessment.findOne({ subCategory: 'PCLA', title: /PCLA/i });
  if (existing) {
    console.log('⚠️   PCLA Assessment already seeded (id:', existing._id, ')');
    await mongoose.disconnect();
    return;
  }

  // Create assessment shell
  const assessment = await Assessment.create({
    title: 'Professional Coachability & Learning Agility Index (PCLA™)',
    description:
      'A 35-question scenario-based assessment measuring an individual\'s readiness to learn, ' +
      'unlearn, relearn, and grow. Identifies coaching receptivity, growth mindset, ' +
      'technology adaptability, and reinvention capacity for L&D, HR, and leadership teams.',
    category: 'professional',
    subCategory: 'PCLA',
    difficulty: 'moderate',
    timeBound: { enabled: true, durationMinutes: 25 },
    isActive: true,
    isPublished: true,
    reportConfig: { type: 'standard', format: 'pcla' },
    audience: 'Employees | Managers | Senior Leaders | High Potentials | CXO Pipeline',
    purpose: 'Identifies who is most coachable, learning-agile, and ready for future roles.',
    instructions:
      'Read each scenario carefully and select the response that best reflects your natural ' +
      'behaviour—not what you think is the "right" answer. There are no right or wrong responses.',
  });

  console.log('📋  Assessment created:', assessment._id);

  // Create all 35 questions
  const questionDocs = PCLA_QUESTIONS.map(q => ({
    assessment: assessment._id,
    type: 'mcq',
    questionText: q.questionText,
    order: q.order,
    dimension: q.dimension,
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

  console.log(`✅  ${created.length} questions seeded for PCLA™ assessment`);
  console.log('    Assessment ID:', assessment._id.toString());
  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌  Seeder error:', err); process.exit(1); });
