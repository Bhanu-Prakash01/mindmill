const mongoose = require('mongoose');
const Assessment = require('../backend/models/Assessment');
const Question = require('../backend/models/Question');
require('dotenv').config({ path: __dirname + '/../backend/.env' });

// No external imports needed for this fix

// Since cognitiveAbilityQuestions.js uses `export const`, we can just read it or parse it, but wait, it's easier to just write the specific images here for the fix script.

const fixOptionImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mindmill', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');

    const assessments = await Assessment.find({ title: /Cognitive Ability Composite/i });
    if (!assessments.length) {
      console.log('No assessments found');
      return;
    }

    let updatedCount = 0;

    for (const assessment of assessments) {
      const questions = await Question.find({ assessment: assessment._id, dimension: 'lr' });
      for (const q of questions) {
        // match by order or partial text
        if (q.questionText.includes('Select the option that best completes the logical 3x3 pattern')) {
          q.options[0].image = 'cacs-images/options/q6_a.svg';
          q.options[1].image = 'cacs-images/options/q6_b.svg';
          q.options[2].image = 'cacs-images/options/q6_c.svg';
          q.options[3].image = 'cacs-images/options/q6_d.svg';
          q.options[4].image = 'cacs-images/options/q6_e.svg';
          await q.save();
          updatedCount++;
        }
        else if (q.questionText.includes('Select the option that completes the logical shape sequence')) {
          q.options[0].image = 'cacs-images/options/q7_a.svg';
          q.options[1].image = 'cacs-images/options/q7_b.svg';
          q.options[2].image = 'cacs-images/options/q7_c.svg';
          q.options[3].image = 'cacs-images/options/q7_d.svg';
          q.options[4].image = 'cacs-images/options/q7_e.svg';
          await q.save();
          updatedCount++;
        }
        else if (q.questionText.includes('Select the option that logically completes the 2x2 matrix relation')) {
          q.options[0].image = 'cacs-images/options/q8_a.svg';
          q.options[1].image = 'cacs-images/options/q8_b.svg';
          q.options[2].image = 'cacs-images/options/q8_c.svg';
          q.options[3].image = 'cacs-images/options/q8_d.svg';
          q.options[4].image = 'cacs-images/options/q8_e.svg';
          await q.save();
          updatedCount++;
        }
        else if (q.questionText.includes('Select the option that logically completes the 90-degree clockwise rotation series')) {
          q.options[0].image = 'cacs-images/options/q9_a.svg';
          q.options[1].image = 'cacs-images/options/q9_b.svg';
          q.options[2].image = 'cacs-images/options/q9_c.svg';
          q.options[3].image = 'cacs-images/options/q9_d.svg';
          q.options[4].image = 'cacs-images/options/q9_e.svg';
          await q.save();
          updatedCount++;
        }
        else if (q.questionText.includes('Select the option that logically completes the nested shape relation')) {
          q.options[0].image = 'cacs-images/options/q10_a.svg';
          q.options[1].image = 'cacs-images/options/q10_b.svg';
          q.options[2].image = 'cacs-images/options/q10_c.svg';
          q.options[3].image = 'cacs-images/options/q10_d.svg';
          q.options[4].image = 'cacs-images/options/q10_e.svg';
          await q.save();
          updatedCount++;
        }
        else if (q.questionText.includes('Select the option that logically matches the pattern of increasing parallel elements')) {
          q.options[0].image = 'cacs-images/options/q11_a.svg';
          q.options[1].image = 'cacs-images/options/q11_b.svg';
          q.options[2].image = 'cacs-images/options/q11_c.svg';
          q.options[3].image = 'cacs-images/options/q11_d.svg';
          q.options[4].image = 'cacs-images/options/q11_e.svg';
          await q.save();
          updatedCount++;
        }
        else if (q.questionText.includes('Select the option that logically represents the horizontal flip of the pattern')) {
          q.options[0].image = 'cacs-images/options/q12_a.svg';
          q.options[1].image = 'cacs-images/options/q12_b.svg';
          q.options[2].image = 'cacs-images/options/q12_c.svg';
          q.options[3].image = 'cacs-images/options/q12_d.svg';
          q.options[4].image = 'cacs-images/options/q12_e.svg';
          await q.save();
          updatedCount++;
        }
      }
    }
    
    console.log(`Successfully updated ${updatedCount} questions with option images.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixOptionImages();
