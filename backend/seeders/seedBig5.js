/**
 * Big Five Personality Test (BFPT) Seeder
 * Creates a pre-configured Big5 assessment with 50 official questions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');
const { big5Questions } = require('./big5Questions');

const seedBig5 = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmill');
    console.log('Connected to MongoDB');

    // Find or create a default organization
    let organization = await Organization.findOne({ slug: 'default-org' });
    
    if (!organization) {
      organization = await Organization.create({
        name: 'Default Organization',
        slug: 'default-org',
        description: 'Default organization for Big5 assessment'
      });
      console.log('Created default organization');
    }

    // Find or create an admin user
    let adminUser = await User.findOne({ email: 'admin@mindmill.com' });
    
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

    // Check if Big5 assessment already exists
    const existingAssessment = await Assessment.findOne({ 
      category: 'big5',
      organization: organization._id 
    });

    if (existingAssessment) {
      console.log('Big5 assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      // Delete old questions
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old Big5 questions');
      
      // Delete old assessment
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old Big5 assessment');
    }

    // Create Big5 assessment
    const assessment = await Assessment.create({
      title: 'Big Five Personality Test (BFPT-50)',
      description: 'The Big Five Personality Test measures five major dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism (OCEAN). This scientifically validated assessment uses 50 questions to provide insights into your personality traits.',
      category: 'personality',
      subCategory: 'Big5',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'moderate',
      timeBound: {
        enabled: true,
        durationMinutes: 30
      },
      purpose: 'Personality assessment and self-discovery',
      audience: 'Individuals seeking to understand their personality traits',
      instructions: `Please respond to each statement honestly based on how you see yourself. 

Use the following scale:
1 = Disagree
2 = Slightly Disagree  
3 = Neutral
4 = Slightly Agree
5 = Agree

There are no right or wrong answers. Answer based on your natural tendencies, not how you think you should be. Take your time and answer all 50 questions.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: true,
      isEditable: false,
      totalQuestions: 50,
      totalMarks: 250, // 50 questions x 5 max points
      passingScore: 0, // Not applicable for personality tests
      passingPercentage: 0,
      allowMultipleAttempts: false,
      maxAttempts: 1,
      showResultsImmediately: true,
      randomizeQuestions: false, // Order matters for Big5 scoring
      randomizeOptions: false,
      reportConfig: {
        type: 'auto-psychometric',
        showScores: true,
        showFullReport: true,
        showPercentile: true,
        showCorrectAnswers: false,
        includeRecommendations: true
      },
      tags: ['personality', 'big5', 'psychometric', 'ocean', 'traits']
    });

    console.log('Created Big5 assessment:', assessment.title);

    // Create Big5 questions
    const questionDocs = await Promise.all(
      big5Questions.map(q => 
        Question.create({
          assessment: assessment._id,
          type: 'rating',
          questionText: q.questionText,
          options: [
            { text: 'Disagree', score: 1, isCorrect: false },
            { text: 'Slightly Disagree', score: 2, isCorrect: false },
            { text: 'Neutral', score: 3, isCorrect: false },
            { text: 'Slightly Agree', score: 4, isCorrect: false },
            { text: 'Agree', score: 5, isCorrect: false }
          ],
          difficulty: 'moderate',
          category: 'personality',
          dimension: q.trait,
          trait: q.trait,
          direction: q.direction,
          order: q.order,
          marks: 5,
          isRequired: true,
          explanation: `This question measures ${q.trait === 'E' ? 'Extraversion' : q.trait === 'A' ? 'Agreeableness' : q.trait === 'C' ? 'Conscientiousness' : q.trait === 'N' ? 'Neuroticism' : 'Openness'}.`,
          tags: [q.trait.toLowerCase(), 'big5', 'personality']
        })
      )
    );

    // Update assessment with question IDs
    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} Big5 questions`);
    console.log('\n✅ Big5 assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');

  } catch (error) {
    console.error('Error seeding Big5:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedBig5();
}

module.exports = seedBig5;
