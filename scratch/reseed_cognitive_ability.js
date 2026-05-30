const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const Assessment = require('../backend/models/Assessment');
const Question = require('../backend/models/Question');
const seedCognitiveAbility = require('../backend/seeders/seedCognitiveAbility');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmill';
    await mongoose.connect(uri);
    console.log('Connected.');

    // Find and delete the existing Cognitive Ability Assessment and its associated questions
    const existing = await Assessment.findOne({ title: 'Cognitive Ability Composite Assessment' });
    if (existing) {
      console.log('Deleting existing questions for Cognitive Ability assessment...');
      await Question.deleteMany({ assessment: existing._id });
      console.log('Deleting existing Cognitive Ability assessment...');
      await Assessment.deleteOne({ _id: existing._id });
      console.log('Cleanup complete.');
    }

    console.log('Running seeder for Cognitive Ability...');
    await seedCognitiveAbility();
    console.log('Seeder completed successfully!');

  } catch (err) {
    console.error('Error during reseeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
