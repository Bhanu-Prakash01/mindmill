require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');
const { mbtiQuestions, MBTI_CONFIG } = require('./mbtiQuestions');

const seedMbti = async () => {
  const isStandalone = mongoose.connection.readyState === 0;
  try {
    if (isStandalone) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmil');
      console.log('Connected to MongoDB');
    }

    let organization = await Organization.findOne({ slug: 'default-org' });
    
    if (!organization) {
      organization = await Organization.create({
        name: 'Default Organization',
        slug: 'default-org',
        description: 'Default organization for MBTI assessment'
      });
      console.log('Created default organization');
    }

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

    const existingAssessment = await Assessment.findOne({ 
      subCategory: 'MBTI',
    });

    if (existingAssessment) {
      console.log('MBTI assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old MBTI questions');
      
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old MBTI assessment');
    }

    const assessment = await Assessment.create({
      title: 'MBTI Personality Assessment',
      description: 'The MBTI (Myers-Briggs Type Indicator) assessment measures four dimensions of personality: Extraversion-Introversion, Sensing-Intuition, Thinking-Feeling, and Judging-Perceiving. This scientifically validated assessment helps you understand your unique personality type and how you interact with the world.',
      category: 'personality',
      subCategory: 'MBTI',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'basic',
      timeBound: {
        enabled: true,
        durationMinutes: 20
      },
      purpose: 'Personality profiling, self-discovery, and career development',
      audience: 'Individuals seeking to understand their personality type',
      instructions: `This assessment consists of 32 questions across four dimensions. For each question, you will see two statements representing opposite personality traits.

For each question:
1. Rate how much each statement describes you (1-5 scale)
2. 1 = Strongly left trait, 3 = Neutral, 5 = Strongly right trait

Answer based on your natural behavior, not how you think you should behave. There are no right or wrong answers.

Complete all 32 questions honestly for accurate results.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: true,
      isEditable: false,
      totalQuestions: 32,
      totalMarks: 160,
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
      tags: ['personality', 'mbti', 'psychometric', 'type-indicator', 'jungian']
    });

    console.log('Created MBTI assessment:', assessment.title);

    const questionDocs = await Promise.all(
      mbtiQuestions.map(q => 
        Question.create({
          assessment: assessment._id,
          type: 'rating',
          questionText: `${q.leftTrait} — ${q.rightTrait}`,
          leftTrait: q.leftTrait,
          rightTrait: q.rightTrait,
          options: [
            { text: 'Strongly left trait', score: 1, isCorrect: false },
            { text: 'Moderately left trait', score: 2, isCorrect: false },
            { text: 'Neutral', score: 3, isCorrect: false },
            { text: 'Moderately right trait', score: 4, isCorrect: false },
            { text: 'Strongly right trait', score: 5, isCorrect: false }
          ],
          dimension: q.dimension,
          difficulty: 'basic',
          category: 'personality',
          order: q.order,
          marks: 5,
          isRequired: true,
          explanation: `This question measures your ${MBTI_CONFIG[q.dimension].name} tendency.`,
          tags: ['mbti', 'personality', 'dimension', q.dimension.toLowerCase()]
        })
      )
    );

    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} MBTI questions`);
    console.log('\n✅ MBTI assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');
    console.log('\nMBTI Dimensions:');
    console.log('- EI (Extraversion vs Introversion):', MBTI_CONFIG.EI.description);
    console.log('- SN (Sensing vs Intuition):', MBTI_CONFIG.SN.description);
    console.log('- TF (Thinking vs Feeling):', MBTI_CONFIG.TF.description);
    console.log('- JP (Judging vs Perceiving):', MBTI_CONFIG.JP.description);

  } catch (error) {
    console.error('Error seeding MBTI:', error);
  } finally {
    if (isStandalone) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
};

if (require.main === module) {
  seedMbti();
}

module.exports = seedMbti;
