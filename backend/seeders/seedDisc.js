/**
 * DISC Personality Assessment Seeder
 * Creates a pre-configured DISC assessment with 28 official questions (professional standard)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');
const { discQuestions, DISC_CONFIG } = require('./discQuestions');

const seedDisc = async () => {
  const isStandalone = mongoose.connection.readyState === 0;
  try {
    if (isStandalone) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmill');
      console.log('Connected to MongoDB');
    }

    // Find or create a default organization
    let organization = await Organization.findOne({ slug: 'default-org' });
    
    if (!organization) {
      organization = await Organization.create({
        name: 'Default Organization',
        slug: 'default-org',
        description: 'Default organization for DISC assessment'
      });
      console.log('Created default organization');
    }

    // Find or create an admin user
    let adminUser = await User.findOne({ email: 'admin@mindmill.com' }) ||
                    await User.findOne({ role: 'superadmin' });
    
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@mindmill.com',
        password: 'admin',
        role: 'admin',
        organization: organization._id
      });
      console.log('Created admin user');
    }

    // Check if DISC assessment already exists
    const existingAssessment = await Assessment.findOne({ 
      category: 'disc',
      organization: organization._id 
    });

    if (existingAssessment) {
      console.log('DISC assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      // Delete old questions
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old DISC questions');
      
      // Delete old assessment
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old DISC assessment');
    }

    // Create DISC assessment
    const assessment = await Assessment.create({
      title: 'DISC Personality Assessment',
      description: 'The DISC assessment measures four behavioral styles: Dominance (D), Influence (I), Steadiness (S), and Conscientiousness (C). This scientifically validated assessment helps you understand your natural behavioral tendencies and how you interact with others.',
      category: 'personality',
      subCategory: 'DISC',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'basic',
      timeBound: {
        enabled: true,
        durationMinutes: 25
      },
      purpose: 'Personality profiling, team dynamics, and self-awareness',
      audience: 'Individuals seeking to understand their behavioral style',
      instructions: `This assessment consists of 28 questions. For each question, you will see four statements representing different behavioral styles (D, I, S, C).

For each question:
1. Select the statement that is MOST like you in a work environment
2. Select the statement that is LEAST like you in a work environment

Answer based on your natural behavior, not how you think you should behave. There are no right or wrong answers.

Complete all 28 questions honestly for accurate results.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: true,
      isEditable: false,
      totalQuestions: 28,
      totalMarks: 280, // 28 questions x 10 max points (4+3+2+1)
      passingScore: 0, // Not applicable for personality tests
      passingPercentage: 0,
      allowMultipleAttempts: false,
      maxAttempts: 1,
      showResultsImmediately: true,
      randomizeQuestions: false, // Order matters for DISC
      randomizeOptions: false, // Options have fixed positions
      reportConfig: {
        type: 'auto-psychometric',
        showScores: true,
        showFullReport: true,
        showPercentile: true,
        showCorrectAnswers: false,
        includeRecommendations: true
      },
      tags: ['personality', 'disc', 'psychometric', 'behavioral', 'team-dynamics']
    });

    console.log('Created DISC assessment:', assessment.title);

    // Create DISC questions
    const questionDocs = await Promise.all(
      discQuestions.map(q => 
        Question.create({
          assessment: assessment._id,
          type: 'disc-ranking',
          questionText: q.questionText,
          statements: q.statements.map(s => ({
            text: s.text,
            trait: s.trait,
            score: s.score
          })),
          options: q.statements.map((s, idx) => ({
            text: s.text,
            trait: s.trait,
            order: idx,
            score: 0 // Will be assigned by user (4,3,2,1)
          })),
          difficulty: 'basic',
          category: 'personality',
          dimension: 'DISC',
          order: q.order,
          marks: 2, // +1 for MOST, -1 for LEAST = 2 points possible per question
          isRequired: true,
          explanation: `This question measures your ${q.statements.map(s => DISC_CONFIG[s.trait].name).join(', ')} tendencies.`,
          tags: ['disc', 'personality', 'behavioral']
        })
      )
    );

    // Update assessment with question IDs
    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} DISC questions`);
    console.log('\n✅ DISC assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');
    console.log('\nDISC Traits:');
    console.log('- D (Dominance):', DISC_CONFIG.D.description);
    console.log('- I (Influence):', DISC_CONFIG.I.description);
    console.log('- S (Steadiness):', DISC_CONFIG.S.description);
    console.log('- C (Conscientiousness):', DISC_CONFIG.C.description);

  } catch (error) {
    console.error('Error seeding DISC:', error);
  } finally {
    if (isStandalone) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDisc();
}

module.exports = seedDisc;
