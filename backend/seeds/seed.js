/**
 * Mindmill Database Seeder - Unified Runner
 *
 * Seeds all 8 assessment types in sequence.
 * ⚠️  DESTRUCTIVE: This script clears ALL existing data before seeding.
 *     Only use for development/reset purposes.
 *
 * Usage: npm run seed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/database');
const { User, Organization, Assessment, Question, Attempt } = require('../models');

const seedDisc = require('../seeders/seedDisc');
const seedBig5 = require('../seeders/seedBig5');
const seedMbti = require('../seeders/seedMbti');
const seedHogan = require('../seeders/seedHogan');
const seedFiro = require('../seeders/seedFiro');
const seedCognitive = require('../seeders/seedCognitive');
const seedCognitiveAbility = require('../seeders/seedCognitiveAbility');
const seedCriticalThinking = require('../seeders/seedCriticalThinking');
const seedSituational = require('../seeders/seedSituational');
const seedProfessional = require('../seeders/seedProfessional');
const seedEctiStandalone = require('../seeders/seedEctiAsModule');

const seededAssessments = [];

const seedAllAssessments = async () => {
  const seeders = [
    { name: 'DISC Personality', fn: seedDisc },
    { name: 'Big Five', fn: seedBig5 },
    { name: 'MBTI', fn: seedMbti },
    { name: 'Hogan', fn: seedHogan },
    { name: 'FIRO-B', fn: seedFiro },
    { name: 'Cognitive Reasoning', fn: seedCognitive },
    { name: 'Cognitive Ability Composite', fn: seedCognitiveAbility },
    // { name: 'Critical Thinking', fn: seedCriticalThinking },
    { name: 'Situational Judgement', fn: seedSituational },
    { name: 'Professional Aptitude', fn: seedProfessional },
    { name: 'Executive Critical Thinking (ECTI™)', fn: seedEctiStandalone },
  ];

  console.log('\n' + '='.repeat(50));
  console.log('  MINDMILL ASSESSMENT SEEDER');
  console.log('='.repeat(50) + '\n');

  for (const seeder of seeders) {
    process.stdout.write(`Seeding ${seeder.name}... `);
    try {
      await seeder.fn();
      seededAssessments.push({ name: seeder.name, status: 'success' });
      console.log('✅');
    } catch (error) {
      seededAssessments.push({ name: seeder.name, status: 'failed', error: error.message });
      console.log('❌');
      console.error(`  Error seeding ${seeder.name}:`, error.message);
    }
  }

  console.log('\n' + '-'.repeat(50));
  console.log('  SEEDING SUMMARY');
  console.log('-'.repeat(50));

  const successful = seededAssessments.filter(a => a.status === 'success');
  const failed = seededAssessments.filter(a => a.status === 'failed');

  console.log(`\n✅ Successfully seeded: ${successful.length}/10`);
  successful.forEach(a => console.log(`   - ${a.name}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/10`);
    failed.forEach(a => console.log(`   - ${a.name}: ${a.error}`));
  }

  console.log('\n' + '='.repeat(50));
  console.log('  All assessments seeded!');
  console.log('='.repeat(50) + '\n');
};

const createSuperAdmin = async () => {
  const existingAdmin = await User.findOne({ email: 'super@admin.com' });

  if (existingAdmin) {
    console.log('SuperAdmin already exists, skipping...');
    return;
  }

  await User.create({
    email: 'super@admin.com',
    password: 'supperadmin',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'superadmin',
    organization: null,
    isActive: true
  });

  console.log('✅ SuperAdmin created: super@admin.com / supperadmin');
};

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB...\n');

    console.log('⚠️  CLEARING ALL EXISTING DATA...');
    await Attempt.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});
    console.log('✅ All existing data cleared\n');

    console.log('Creating SuperAdmin...');
    await createSuperAdmin();
    console.log('');

    await seedAllAssessments();

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
    process.exit(0);
  }
};

seedData();