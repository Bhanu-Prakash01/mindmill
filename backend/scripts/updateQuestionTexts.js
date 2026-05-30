const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Question = require('../models/Question');

// Map of partial old text prefix -> new full question text
const updates = [
  {
    prefix: 'Select the option that best completes the logical 3x3 pattern.',
    newText: 'Select the option that best completes the logical 3×3 pattern shown below:'
  },
  {
    prefix: 'Select the option that completes the logical shape sequence:',
    newText: 'Select the option that completes the logical shape sequence shown below:'
  },
  {
    prefix: 'Select the option that logically completes the 2x2 matrix relation:',
    newText: 'Select the option that logically completes the 2×2 matrix relation shown below:'
  },
  {
    prefix: 'Select the option that logically completes the 90-degree clockwise rotation series:',
    newText: 'Select the option that logically completes the 90-degree clockwise rotation series shown below:'
  },
  {
    prefix: 'Select the option that logically completes the nested shape relation:',
    newText: 'Select the option that logically completes the nested shape relation shown below:'
  },
  {
    prefix: 'Select the option that logically matches the pattern of increasing parallel elements:',
    newText: 'Select the option that logically matches the pattern of increasing parallel elements shown below:'
  },
  {
    prefix: 'Select the option that logically represents the horizontal flip of the pattern:',
    newText: 'Select the option that logically represents the result of flipping the pattern shown below horizontally:'
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmill');
  console.log('Connected to MongoDB');

  let totalUpdated = 0;
  for (const u of updates) {
    // Find all questions where questionText starts with the prefix
    const qs = await Question.find({ questionText: { $regex: '^' + u.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\?$/, '\\?') } });
    console.log(`Found ${qs.length} questions matching prefix: "${u.prefix.substring(0, 60)}..."`);
    for (const q of qs) {
      q.questionText = u.newText;
      await q.save();
      totalUpdated++;
    }
  }

  console.log(`\nTotal questions updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
