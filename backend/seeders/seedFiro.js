/**
 * FIRO-B Assessment Seeder
 * Creates a pre-configured FIRO-B assessment with 54 questions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');
const { firoQuestions } = require('./firoQuestions');

const seedFiro = async () => {
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
        description: 'Default organization for FIRO-B assessment'
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
        password: 'admin123',
        role: 'admin',
        organization: organization._id
      });
      console.log('Created admin user');
    }

    // Check if FIRO-B assessment already exists
    const existingAssessment = await Assessment.findOne({ 
      subCategory: 'FIRO-B'
    });

    if (existingAssessment) {
      console.log('FIRO-B assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      // Delete old questions
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old FIRO-B questions');
      
      // Delete old assessment
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old FIRO-B assessment');
    }

    // Create FIRO-B assessment
    const assessment = await Assessment.create({
      title: 'FIRO-B Assessment',
      description: 'The FIRO-B assessment measures interpersonal needs across three dimensions: Inclusion, Control, and Affection. It helps understand how you relate to others and what you need in relationships.',
      category: 'personality',
      subCategory: 'FIRO-B',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'basic',
      timeBound: {
        enabled: true,
        durationMinutes: 20
      },
      purpose: 'Interpersonal needs assessment and team dynamics',
      audience: 'Individuals seeking to understand their interpersonal needs',
      instructions: `Please respond to each statement honestly based on how you typically behave.

Use the following scale:
- Never (1)
- Rarely (2)
- Occasionally (3)
- Sometimes (4)
- Often (5)
- Usually (6)

There are no right or wrong answers. Answer based on your natural behavior, not how you think you should behave.

Complete all 54 questions for accurate results.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: true,
      isEditable: false,
      totalQuestions: 54,
      totalMarks: 324, // 54 questions x 6 max points
      passingScore: 0,
      passingPercentage: 0,
      allowMultipleAttempts: false,
      maxAttempts: 1,
      showResultsImmediately: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      reportConfig: {
        type: 'auto-psychometric',
        showScores: true,
        showFullReport: true,
        showPercentile: true,
        showCorrectAnswers: false,
        includeRecommendations: true
      },
      tags: ['personality', 'firo', 'psychometric', 'interpersonal', 'team-dynamics']
    });

    console.log('Created FIRO-B assessment:', assessment.title);

    // Create FIRO-B questions
    const questionDocs = await Promise.all(
      firoQuestions.map(q => 
        Question.create({
          assessment: assessment._id,
          type: 'rating',
          questionText: q.questionText,
          options: q.options.map((opt, idx) => ({
            text: opt,
            value: idx + 1,
            order: idx
          })),
          trait: q.trait,
          dimension: q.trait,
          difficulty: 'basic',
          category: 'personality',
          order: q.order,
          marks: 6,
          isRequired: true,
          tags: ['firo', 'personality', 'interpersonal']
        })
      )
    );

    // Update assessment with question IDs
    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} FIRO-B questions`);
    console.log('\n✅ FIRO-B assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');
    console.log('\nFIRO-B Dimensions:');
    console.log('- Expressed Inclusion (eI): Questions 1-9');
    console.log('- Wanted Inclusion (wI): Questions 10-18');
    console.log('- Expressed Control (eC): Questions 19-27');
    console.log('- Wanted Control (wC): Questions 28-36');
    console.log('- Expressed Affection (eA): Questions 37-45');
    console.log('- Wanted Affection (wA): Questions 46-54');

  } catch (error) {
    console.error('Error seeding FIRO-B:', error);
  } finally {
    if (isStandalone) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedFiro();
}

module.exports = seedFiro;
