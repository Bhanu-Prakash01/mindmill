/**
 * Seed script — Executive Situational Judgement Index (ESJI™)
 * Creates the Assessment document and all 40 Questions in MongoDB.
 *
 * Usage:
 *   node backend/seeders/seedSjt.js
 *
 * Requires: MONGODB_URI in environment or .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { SJT_QUESTIONS } = require('./sjtQuestions');

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
  timeBound: { type: Boolean, default: false },
  duration: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  reportConfig: { type: { type: String }, format: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const Question  = mongoose.models.Question  || mongoose.model('Question',  questionSchema);
  const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ role: String, email: String }, { strict: false }));

  // Look up a superadmin to set as creator
  const superAdmin = await User.findOne({ role: 'superadmin' });
  if (!superAdmin) {
    console.error('❌  No superadmin user found. Seed the database first (npm run seed).');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Check if already seeded
  const existing = await Assessment.findOne({ subCategory: 'Situational Judgement', title: /ESJI/i });
  if (existing) {
    console.log('⚠️   SJT Assessment already seeded (id:', existing._id, ')');
    await mongoose.disconnect();
    return;
  }

  // Create assessment shell first (no questions yet)
  const assessment = await Assessment.create({
    title: 'Executive Situational Judgement Index (ESJI™)',
    description: 'A 40-question scenario-based assessment measuring executive composure, decision quality, crisis leadership, stakeholder management, and business continuity under pressure.',
    category: 'situational',
    subCategory: 'Situational Judgement',
    difficulty: 'moderate',
    timeBound: true,
    duration: 45,
    isActive: true,
    reportConfig: { type: 'standard', format: 'sjt' },
    createdBy: superAdmin._id,
  });

  console.log('📋  Assessment created:', assessment._id, ' creator will be', superAdmin.email);

  // Create all questions
  const questionDocs = SJT_QUESTIONS.map(q => ({
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
      // isCorrect = option with highest weight
      isCorrect: o.weight === 4,
      // score mirrors weight for generic MCQ scoring fallback
      score: o.weight,
    })),
  }));

  const created = await Question.insertMany(questionDocs);
  const questionIds = created.map(d => d._id);

  // Link questions to assessment
  assessment.questions = questionIds;
  await assessment.save();

  console.log(`✅  ${created.length} questions seeded for ESJI™ assessment`);
  console.log('    Assessment ID:', assessment._id.toString());
  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌  Seeder error:', err); process.exit(1); });
