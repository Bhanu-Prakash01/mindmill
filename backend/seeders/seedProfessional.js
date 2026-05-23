/**
 * General Aptitude/Professional Assessment Seeder
 * Creates a pre-configured Professional assessment with 15 questions
 * covering workplace skills, problem-solving, and communication
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');

const professionalQuestions = [
  // Rating Questions - Workplace Skills (1-8)
  {
    type: 'rating',
    questionText: 'I take initiative to complete tasks without waiting for explicit instructions.',
    dimension: 'Workplace Skills',
    order: 1
  },
  {
    type: 'rating',
    questionText: 'I manage my time effectively to meet deadlines.',
    dimension: 'Workplace Skills',
    order: 2
  },
  {
    type: 'rating',
    questionText: 'I adapt quickly to new technologies and processes at work.',
    dimension: 'Workplace Skills',
    order: 3
  },
  {
    type: 'rating',
    questionText: 'I maintain attention to detail in my work quality.',
    dimension: 'Workplace Skills',
    order: 4
  },
  // Rating Questions - Communication (5-8)
  {
    type: 'rating',
    questionText: 'I clearly articulate my ideas in team meetings.',
    dimension: 'Communication',
    order: 5
  },
  {
    type: 'rating',
    questionText: 'I actively listen to understand others\' perspectives before responding.',
    dimension: 'Communication',
    order: 6
  },
  {
    type: 'rating',
    questionText: 'I communicate complex information in simple terms.',
    dimension: 'Communication',
    order: 7
  },
  {
    type: 'rating',
    questionText: 'I provide constructive feedback to colleagues respectfully.',
    dimension: 'Communication',
    order: 8
  },
  // MCQ Questions - Problem Solving (9-12)
  {
    type: 'mcq',
    questionText: 'When faced with a complex problem, what is typically your first approach?',
    dimension: 'Problem Solving',
    options: [
      { text: 'Break it down into smaller, manageable parts', score: 4, isCorrect: true },
      { text: 'Wait for someone else to provide a solution', score: 1, isCorrect: false },
      { text: 'Try random solutions until something works', score: 2, isCorrect: false },
      { text: 'Avoid the problem until it resolves itself', score: 1, isCorrect: false }
    ],
    order: 9
  },
  {
    type: 'mcq',
    questionText: 'Which approach best demonstrates critical thinking?',
    dimension: 'Problem Solving',
    options: [
      { text: 'Accepting information at face value without questioning', score: 1, isCorrect: false },
      { text: 'Analyzing multiple sources and questioning assumptions', score: 4, isCorrect: true },
      { text: 'Following the majority opinion', score: 2, isCorrect: false },
      { text: 'Making quick decisions without research', score: 1, isCorrect: false }
    ],
    order: 10
  },
  {
    type: 'mcq',
    questionText: 'How should you handle a situation with no clear solution?',
    dimension: 'Problem Solving',
    options: [
      { text: 'Give up immediately', score: 1, isCorrect: false },
      { text: 'Research alternatives and consult experts', score: 4, isCorrect: true },
      { text: 'Guess a random answer', score: 1, isCorrect: false },
      { text: 'Ignore the situation', score: 1, isCorrect: false }
    ],
    order: 11
  },
  {
    type: 'mcq',
    questionText: 'What is the most effective way to solve recurring problems?',
    dimension: 'Problem Solving',
    options: [
      { text: 'Apply the same solution repeatedly', score: 2, isCorrect: false },
      { text: 'Identify and address the root cause', score: 4, isCorrect: true },
      { text: 'Avoid situations that cause problems', score: 2, isCorrect: false },
      { text: 'Delegate the problem to someone else', score: 1, isCorrect: false }
    ],
    order: 12
  },
  // MCQ Questions - Workplace Scenarios (13-15)
  {
    type: 'mcq',
    questionText: 'What is the best approach when you disagree with a colleague\'s idea?',
    dimension: 'Communication',
    options: [
      { text: 'Publicly criticize their idea to show flaws', score: 1, isCorrect: false },
      { text: 'Respectfully explain your perspective with reasoning', score: 4, isCorrect: true },
      { text: 'Stay silent and let it fail', score: 1, isCorrect: false },
      { text: 'Report them to management', score: 1, isCorrect: false }
    ],
    order: 13
  },
  {
    type: 'mcq',
    questionText: 'When receiving criticism about your work, the best response is to:',
    dimension: 'Communication',
    options: [
      { text: 'Argue immediately about the criticism', score: 1, isCorrect: false },
      { text: 'Dismiss it without consideration', score: 1, isCorrect: false },
      { text: 'Listen, ask clarifying questions, and reflect on feedback', score: 4, isCorrect: true },
      { text: 'Take it personally and hold a grudge', score: 1, isCorrect: false }
    ],
    order: 14
  },
  {
    type: 'mcq',
    questionText: 'What characterizes effective professional communication?',
    dimension: 'Communication',
    options: [
      { text: 'Using technical jargon to sound knowledgeable', score: 2, isCorrect: false },
      { text: 'Being clear, concise, and audience-appropriate', score: 4, isCorrect: true },
      { text: 'Speaking as much as possible', score: 1, isCorrect: false },
      { text: 'Sending long emails with minimal content', score: 1, isCorrect: false }
    ],
    order: 15
  }
];

const seedProfessional = async () => {
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
        description: 'Default organization for Professional assessment'
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

    // Check if Professional assessment already exists
    const existingAssessment = await Assessment.findOne({ 
      category: 'professional',
      subCategory: 'General Aptitude',
      organization: organization._id 
    });

    if (existingAssessment) {
      console.log('Professional assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      // Delete old questions
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old Professional questions');
      
      // Delete old assessment
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old Professional assessment');
    }

    // Create Professional assessment
    const assessment = await Assessment.create({
      title: 'General Aptitude Assessment',
      description: 'The General Aptitude Assessment measures workplace skills, problem-solving abilities, and communication effectiveness. This assessment helps identify strengths and areas for professional development.',
      category: 'professional',
      subCategory: 'General Aptitude',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'moderate',
      timeBound: {
        enabled: true,
        durationMinutes: 25
      },
      purpose: 'Professional skills evaluation and career development',
      audience: 'Individuals seeking to assess their workplace competencies',
      instructions: `This assessment consists of 15 questions covering workplace skills, problem-solving, and communication.

For rating questions, use the following scale:
1 = Never
2 = Sometimes
3 = Often
4 = Always

For MCQ questions, select the best answer based on your professional judgment.

Answer honestly based on your natural tendencies. There are no right or wrong answers.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: false,
      isEditable: false,
      totalQuestions: 15,
      totalMarks: 60,
      passingScore: 0,
      passingPercentage: 0,
      allowMultipleAttempts: true,
      maxAttempts: 3,
      showResultsImmediately: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      reportConfig: {
        type: 'standard',
        showScores: true,
        showFullReport: true,
        showPercentile: false,
        showCorrectAnswers: true,
        includeRecommendations: true
      },
      tags: ['professional', 'aptitude', 'workplace', 'skills', 'communication']
    });

    console.log('Created Professional assessment:', assessment.title);

    // Create Professional questions
    const questionDocs = await Promise.all(
      professionalQuestions.map(q => {
        const commonFields = {
          assessment: assessment._id,
          type: q.type,
          questionText: q.questionText,
          difficulty: 'moderate',
          category: 'professional',
          dimension: q.dimension,
          order: q.order,
          marks: q.type === 'rating' ? 4 : 4,
          isRequired: true,
          tags: ['professional', 'aptitude', q.dimension.toLowerCase().replace(' ', '-')]
        };

        if (q.type === 'rating') {
          return Question.create({
            ...commonFields,
            options: [
              { text: 'Never', score: 1, isCorrect: false },
              { text: 'Sometimes', score: 2, isCorrect: false },
              { text: 'Often', score: 3, isCorrect: false },
              { text: 'Always', score: 4, isCorrect: false }
            ],
            explanation: `This question measures ${q.dimension.toLowerCase()} competency.`
          });
        } else {
          return Question.create({
            ...commonFields,
            options: q.options,
            explanation: `This question assesses ${q.dimension.toLowerCase()} skills.`
          });
        }
      })
    );

    // Update assessment with question IDs
    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} Professional questions`);
    console.log('\n✅ Professional assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- SubCategory:', assessment.subCategory);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');

  } catch (error) {
    console.error('Error seeding Professional:', error);
  } finally {
    if (isStandalone) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedProfessional();
}

module.exports = seedProfessional;