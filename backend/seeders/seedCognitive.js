/**
 * Cognitive Reasoning Assessment Seeder
 * Creates a pre-configured cognitive reasoning assessment with 15 MCQ questions
 * Covers logical, numerical, and verbal reasoning
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');

// Cognitive reasoning questions data
const cognitiveQuestions = [
  // Logical Reasoning (5 questions)
  {
    type: 'logical',
    questionText: 'If all roses are flowers and some flowers fade quickly, which statement is definitely true?',
    options: [
      { text: 'All roses fade quickly', isCorrect: false },
      { text: 'Some roses might fade quickly', isCorrect: true },
      { text: 'No roses fade quickly', isCorrect: false },
      { text: 'All flowers are roses', isCorrect: false }
    ],
    explanation: 'Since all roses are flowers, and some flowers fade quickly, we cannot conclude that roses specifically fade quickly - only that some flowers (which includes roses) might.'
  },
  {
    type: 'logical',
    questionText: 'Complete the pattern: 2, 6, 12, 20, 30, ?',
    options: [
      { text: '42', isCorrect: true },
      { text: '40', isCorrect: false },
      { text: '44', isCorrect: false },
      { text: '36', isCorrect: false }
    ],
    explanation: 'The differences between consecutive numbers are: 4, 6, 8, 10, 12. So 30 + 12 = 42.'
  },
  {
    type: 'logical',
    questionText: 'If it rains, the ground gets wet. The ground is wet today. Therefore:',
    options: [
      { text: 'It rained', isCorrect: false },
      { text: 'It might have rained', isCorrect: true },
      { text: 'It did not rain', isCorrect: false },
      { text: 'Cannot be determined', isCorrect: false }
    ],
    explanation: 'The ground could be wet from other sources (sprinkler, hose, etc.). We cannot definitively conclude it rained.'
  },
  {
    type: 'logical',
    questionText: 'Which number should come next in the series: 1, 1, 2, 3, 5, 8, 13, ?',
    options: [
      { text: '18', isCorrect: false },
      { text: '21', isCorrect: true },
      { text: '20', isCorrect: false },
      { text: '17', isCorrect: false }
    ],
    explanation: 'This is the Fibonacci sequence. Each number is the sum of the two preceding ones: 8 + 13 = 21.'
  },
  {
    type: 'logical',
    questionText: 'If all programmers use computers and John is a programmer, then:',
    options: [
      { text: 'John might use a computer', isCorrect: false },
      { text: 'John uses a computer', isCorrect: true },
      { text: 'John does not use a computer', isCorrect: false },
      { text: 'Cannot be determined', isCorrect: false }
    ],
    explanation: 'Since all programmers use computers and John is a programmer, it logically follows that John uses a computer.'
  },
  // Numerical Reasoning (5 questions)
  {
    type: 'numerical',
    questionText: 'What is 15% of 240?',
    options: [
      { text: '36', isCorrect: true },
      { text: '32', isCorrect: false },
      { text: '38', isCorrect: false },
      { text: '34', isCorrect: false }
    ],
    explanation: '15% of 240 = (15/100) × 240 = 0.15 × 240 = 36.'
  },
  {
    type: 'numerical',
    questionText: 'A shop offers 25% discount on a $200 item. What is the final price?',
    options: [
      { text: '$150', isCorrect: true },
      { text: '$175', isCorrect: false },
      { text: '$125', isCorrect: false },
      { text: '$160', isCorrect: false }
    ],
    explanation: '25% discount on $200 = $200 - (25/100 × 200) = $200 - $50 = $150.'
  },
  {
    type: 'numerical',
    questionText: 'If x + 5 = 12, what is the value of 2x + 3?',
    options: [
      { text: '17', isCorrect: true },
      { text: '14', isCorrect: false },
      { text: '18', isCorrect: false },
      { text: '19', isCorrect: false }
    ],
    explanation: 'x + 5 = 12, so x = 7. Then 2x + 3 = 2(7) + 3 = 14 + 3 = 17.'
  },
  {
    type: 'numerical',
    questionText: 'What is the average of 12, 15, 18, 21, and 24?',
    options: [
      { text: '18', isCorrect: true },
      { text: '17', isCorrect: false },
      { text: '19', isCorrect: false },
      { text: '20', isCorrect: false }
    ],
    explanation: 'Sum = 12 + 15 + 18 + 21 + 24 = 90. Average = 90/5 = 18.'
  },
  {
    type: 'numerical',
    questionText: 'A car travels 360 km in 6 hours. What is its speed in km/h?',
    options: [
      { text: '60 km/h', isCorrect: true },
      { text: '50 km/h', isCorrect: false },
      { text: '65 km/h', isCorrect: false },
      { text: '55 km/h', isCorrect: false }
    ],
    explanation: 'Speed = Distance/Time = 360/6 = 60 km/h.'
  },
  // Verbal Reasoning (5 questions)
  {
    type: 'verbal',
    questionText: 'Select the word most similar in meaning to "ephemeral":',
    options: [
      { text: 'temporary', isCorrect: true },
      { text: 'permanent', isCorrect: false },
      { text: 'fragile', isCorrect: false },
      { text: 'eternal', isCorrect: false }
    ],
    explanation: 'Ephemeral means lasting for a very short time, synonymous with temporary.'
  },
  {
    type: 'verbal',
    questionText: 'Select the word most opposite in meaning to "pragmatic":',
    options: [
      { text: 'idealistic', isCorrect: true },
      { text: 'practical', isCorrect: false },
      { text: 'realistic', isCorrect: false },
      { text: 'sensible', isCorrect: false }
    ],
    explanation: 'Pragmatic means dealing with things sensibly and realistically. Idealistic is the opposite, focusing on ideals rather than practical realities.'
  },
  {
    type: 'verbal',
    questionText: 'Complete the analogy: Book is to Reader as Knife is to:',
    options: [
      { text: 'Cut', isCorrect: false },
      { text: 'Chef', isCorrect: true },
      { text: 'Steel', isCorrect: false },
      { text: 'Table', isCorrect: false }
    ],
    explanation: 'A book is used by a reader. Similarly, a knife is used by a chef. The relationship is user to object.'
  },
  {
    type: 'verbal',
    questionText: 'Select the correct meaning of the idiom "beat around the bush":',
    options: [
      { text: 'Avoid the main topic', isCorrect: true },
      { text: 'Exercise regularly', isCorrect: false },
      { text: 'Travel frequently', isCorrect: false },
      { text: 'Work hard physically', isCorrect: false }
    ],
    explanation: '"Beating around the bush" means to avoid addressing the main topic or issue directly.'
  },
  {
    type: 'verbal',
    questionText: 'Which word best completes the sentence?: The CEO made a _______ decision to expand into new markets.',
    options: [
      { text: 'bold', isCorrect: true },
      { text: 'boldly', isCorrect: false },
      { text: 'bolder', isCorrect: false },
      { text: 'boldness', isCorrect: false }
    ],
    explanation: 'An adjective is needed to modify "decision." "Bold" is the correct adjective form.'
  }
];

const seedCognitive = async () => {
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
        description: 'Default organization for cognitive assessment'
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

    // Check if Cognitive Reasoning assessment already exists
    const existingAssessment = await Assessment.findOne({ 
      category: 'cognitive',
      subCategory: 'Reasoning',
      organization: organization._id 
    });

    if (existingAssessment) {
      console.log('Cognitive Reasoning assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      // Delete old questions
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old Cognitive questions');
      
      // Delete old assessment
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old Cognitive assessment');
    }

    // Create Cognitive Reasoning assessment
    const assessment = await Assessment.create({
      title: 'Cognitive Reasoning Assessment',
      description: 'The Cognitive Reasoning Assessment evaluates your logical thinking, numerical ability, and verbal reasoning skills. This assessment helps measure problem-solving capabilities and intellectual aptitude.',
      category: 'cognitive',
      subCategory: 'Reasoning',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'moderate',
      timeBound: {
        enabled: true,
        durationMinutes: 30
      },
      purpose: 'Cognitive ability evaluation and problem-solving assessment',
      audience: 'Individuals seeking to measure reasoning and analytical skills',
      instructions: `This assessment consists of 15 questions covering logical reasoning, numerical reasoning, and verbal reasoning.

For each question:
1. Read the question carefully
2. Select the best answer from the four options
3. You have 30 minutes to complete all questions

Answer each question based on the information provided. There is only one correct answer per question.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: false,
      isEditable: true,
      totalQuestions: 15,
      totalMarks: 15,
      passingScore: 9,
      passingPercentage: 60,
      allowMultipleAttempts: true,
      maxAttempts: 3,
      showResultsImmediately: true,
      randomizeQuestions: false,
      randomizeOptions: true,
      reportConfig: {
        type: 'standard',
        showScores: true,
        showFullReport: true,
        showPercentile: false,
        showCorrectAnswers: true,
        includeRecommendations: true
      },
      tags: ['cognitive', 'reasoning', 'aptitude', 'logical', 'numerical', 'verbal']
    });

    console.log('Created Cognitive Reasoning assessment:', assessment.title);

    // Create Cognitive questions
    const questionDocs = await Promise.all(
      cognitiveQuestions.map((q, idx) => 
        Question.create({
          assessment: assessment._id,
          type: 'mcq',
          questionText: q.questionText,
          options: q.options.map((opt, optIdx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: optIdx
          })),
          difficulty: 'moderate',
          category: 'cognitive',
          dimension: q.type, // logical, numerical, verbal
          order: idx + 1,
          marks: 1,
          isRequired: true,
          explanation: q.explanation,
          tags: ['cognitive', 'reasoning', q.type]
        })
      )
    );

    // Update assessment with question IDs
    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} Cognitive Reasoning questions`);
    console.log('\n✅ Cognitive Reasoning assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Subcategory:', assessment.subCategory);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');

  } catch (error) {
    console.error('Error seeding Cognitive Reasoning assessment:', error);
  } finally {
    if (isStandalone) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedCognitive();
}

module.exports = seedCognitive;