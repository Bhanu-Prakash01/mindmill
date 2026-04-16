require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');
const { hoganQuestions, HOGAN_CONFIG } = require('./hoganQuestions');

const seedHogan = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmill');
    console.log('Connected to MongoDB');

    let organization = await Organization.findOne({ slug: 'default-org' });
    
    if (!organization) {
      organization = await Organization.create({
        name: 'Default Organization',
        slug: 'default-org',
        description: 'Default organization for Hogan assessment'
      });
      console.log('Created default organization');
    }

    let adminUser = await User.findOne({ email: 'admin@mindmill.com' });
    
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
      category: 'hogan',
      organization: organization._id 
    });

    if (existingAssessment) {
      console.log('Hogan assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old Hogan questions');
      
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old Hogan assessment');
    }

    const assessment = await Assessment.create({
      title: 'Hogan Personality Inventory (HPI)',
      description: 'The Hogan Personality Inventory measures the "bright side" of personality - how you relate to others when at your best. Based on the Five-Factor Model with 7 primary scales: Adjustment, Ambition, Sociability, Interpersonal Sensitivity, Prudence, Inquisitiveness, and Learning Approach.',
      category: 'personality',
      subCategory: 'Hogan',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'moderate',
      timeBound: {
        enabled: true,
        durationMinutes: 25
      },
      purpose: 'Leadership assessment, talent selection, and self-awareness',
      audience: 'Professionals and leaders seeking to understand their workplace personality',
      instructions: `This assessment consists of 50 statements. For each statement, indicate how much you agree or disagree.

Use the following scale:
1 = Strongly Disagree
2 = Disagree
3 = Neither Agree nor Disagree
4 = Agree
5 = Strongly Agree

There are no right or wrong answers. Answer honestly based on how you typically behave in work situations.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: true,
      isEditable: false,
      totalQuestions: 50,
      totalMarks: 250,
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
      tags: ['personality', 'hogan', 'psychometric', 'leadership', 'hpi']
    });

    console.log('Created Hogan assessment:', assessment.title);

    const questionDocs = await Promise.all(
      hoganQuestions.map(q => 
        Question.create({
          assessment: assessment._id,
          type: 'mcq',
          questionText: q.questionText,
          options: [
            { text: 'Strongly Disagree', score: 1, isCorrect: false },
            { text: 'Disagree', score: 2, isCorrect: false },
            { text: 'Neither Agree nor Disagree', score: 3, isCorrect: false },
            { text: 'Agree', score: 4, isCorrect: false },
            { text: 'Strongly Agree', score: 5, isCorrect: false }
          ],
          difficulty: 'moderate',
          category: 'personality',
          dimension: q.scale,
          trait: q.scale,
          direction: q.keyed,
          subscale: q.scale,
          order: q.order,
          marks: 5,
          isRequired: true,
          explanation: `This statement measures ${q.scale} (${q.keyed} keyed).`,
          tags: ['hogan', 'personality', q.scale.toLowerCase()]
        })
      )
    );

    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} Hogan questions`);
    console.log('\n✅ Hogan assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');
    console.log('\nHogan Scales:');
    Object.keys(HOGAN_CONFIG).forEach(scale => {
      console.log(`- ${scale}:`, HOGAN_CONFIG[scale].description);
    });

  } catch (error) {
    console.error('Error seeding Hogan:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

if (require.main === module) {
  seedHogan();
}

module.exports = seedHogan;