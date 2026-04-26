/**
 * Situational Judgement Assessment Seeder
 * Creates a pre-configured Situational Judgement assessment with 10 workplace scenario questions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');

const situationalQuestions = [
  {
    questionText: "You're working on a critical project with a tight deadline. A colleague asks you to help them with their unrelated task, saying it's urgent. What do you do?",
    order: 1,
    options: [
      { text: "Politely explain you're on a tight deadline and suggest they ask the manager for help or prioritize their task differently", isCorrect: true },
      { text: "Immediately help them since they said it's urgent", isCorrect: false },
      { text: "Ignore them and continue with your work without responding", isCorrect: false },
      { text: "Tell your manager that the colleague is not managing their time properly", isCorrect: false }
    ]
  },
  {
    questionText: "During a team meeting, you realize your colleague's idea has a significant flaw that could cause the project to fail. They seem very confident about their proposal. How do you handle this?",
    order: 2,
    options: [
      { text: "Ask thoughtful questions that highlight the concern while giving them opportunity to address it", isCorrect: true },
      { text: "Immediately point out the flaw in front of everyone to prevent failure", isCorrect: false },
      { text: "Stay quiet to avoid conflict and let the project fail", isCorrect: false },
      { text: "Wait until after the meeting to tell only your manager about the problem", isCorrect: false }
    ]
  },
  {
    questionText: "You discover that a team member has been taking credit for work that you did. When you confront them, they deny it and become defensive. What's the best approach?",
    order: 3,
    options: [
      { text: "Document your contributions with evidence and bring the matter to your manager with facts", isCorrect: true },
      { text: "Publicly expose them in the next team meeting", isCorrect: false },
      { text: "Let it go to maintain peace in the team", isCorrect: false },
      { text: "Retaliate by taking credit for their work", isCorrect: false }
    ]
  },
  {
    questionText: "Your manager assigns you a task that's outside your job description and more challenging than your usual work. They're clearly testing your capabilities. How do you respond?",
    order: 4,
    options: [
      { text: "Accept the challenge enthusiastically and ask for clarification on expectations and any needed resources", isCorrect: true },
      { text: "Refuse because it's not in your job description", isCorrect: false },
      { text: "Accept it but complain to colleagues about being overworked", isCorrect: false },
      { text: "Accept it without questions but do minimum required to get by", isCorrect: false }
    ]
  },
  {
    questionText: "You notice a new team member is struggling with their tasks and seems overwhelmed. They're not asking for help. What do you do?",
    order: 5,
    options: [
      { text: "Approach them privately, offer help, and ask if they'd like guidance on prioritizing their workload", isCorrect: true },
      { text: "Report to manager that they're not performing well", isCorrect: false },
      { text: "Wait for them to ask for help since it's not your responsibility", isCorrect: false },
      { text: "Publicly offer help in the next team meeting so everyone sees you're supportive", isCorrect: false }
    ]
  },
  {
    questionText: "Your team is divided on how to approach a major project. Some want to follow the traditional method while others want to try an innovative approach. There's no clear manager direction. What do you suggest?",
    order: 6,
    options: [
      { text: "Propose a small pilot test of the innovative approach alongside the traditional method to compare results", isCorrect: true },
      { text: "Insist on the traditional method since it's proven and less risky", isCorrect: false },
      { text: "Push for the innovative approach because it's more exciting", isCorrect: false },
      { text: "Refuse to participate in the decision and let others figure it out", isCorrect: false }
    ]
  },
  {
    questionText: "You make a mistake on an important report that gets sent to a client. Your manager hasn't noticed yet. What do you do?",
    order: 7,
    options: [
      { text: "Immediately inform your manager, take responsibility, and propose a solution to correct the error before the client sees it", isCorrect: true },
      { text: "Hope the client doesn't notice and say nothing", isCorrect: false },
      { text: "Blame the mistake on a colleague", isCorrect: false },
      { text: "Wait to see if anyone notices before addressing it", isCorrect: false }
    ]
  },
  {
    questionText: "A colleague frequently interrupts your work to chat about non-work topics. You've been unable to meet your deadlines. What's the best way to address this?",
    order: 8,
    options: [
      { text: "Have a private, respectful conversation explaining the impact on your work and setting boundaries for chat times", isCorrect: true },
      { text: "Report them to management immediately", isCorrect: false },
      { text: "Start ignoring them completely without explanation", isCorrect: false },
      { text: "Complain about them to other colleagues", isCorrect: false }
    ]
  },
  {
    questionText: "You're given constructive feedback by your manager that you believe is unfair or incorrect. How do you respond?",
    order: 9,
    options: [
      { text: "Listen fully, ask specific questions to understand their perspective, then respectfully share your viewpoint with examples", isCorrect: true },
      { text: "Immediately argue and defend yourself without listening", isCorrect: false },
      { text: "Accept it silently but hold resentment", isCorrect: false },
      { text: "Escalate to upper management to dispute the feedback", isCorrect: false }
    ]
  },
  {
    questionText: "Your team is working on a project and one member consistently arrives late to meetings and submits incomplete work. The deadline is approaching. How do you handle this as a team?",
    order: 10,
    options: [
      { text: "Have a team conversation to discuss the impact on the project and collaboratively find solutions while supporting each other", isCorrect: true },
      { text: "Do their work for them to ensure the deadline is met", isCorrect: false },
      { text: "Report them to management immediately for discipline", isCorrect: false },
      { text: "Complain about them to other team members but avoid addressing it directly", isCorrect: false }
    ]
  }
];

const seedSituational = async () => {
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
        description: 'Default organization for assessments'
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
        password: 'admin',
        role: 'admin',
        organization: organization._id
      });
      console.log('Created admin user');
    }

    // Check if Situational Judgement assessment already exists
    const existingAssessment = await Assessment.findOne({ 
      category: 'situational',
      subCategory: 'Situational Judgement',
      organization: organization._id 
    });

    if (existingAssessment) {
      console.log('Situational Judgement assessment already exists:', existingAssessment.title);
      console.log('Deleting old assessment and questions to recreate with updated content...');
      
      // Delete old questions
      await Question.deleteMany({ assessment: existingAssessment._id });
      console.log('Deleted old Situational Judgement questions');
      
      // Delete old assessment
      await Assessment.deleteOne({ _id: existingAssessment._id });
      console.log('Deleted old Situational Judgement assessment');
    }

    // Create Situational Judgement assessment
    const assessment = await Assessment.create({
      title: 'Situational Judgement Test',
      description: 'The Situational Judgement Test assesses your ability to handle real-world workplace scenarios effectively. These scenario-based questions evaluate your problem-solving skills, interpersonal judgment, and decision-making in professional contexts.',
      category: 'situational',
      subCategory: 'Situational Judgement',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'moderate',
      timeBound: {
        enabled: true,
        durationMinutes: 20
      },
      purpose: 'Job readiness, workplace judgment, and interpersonal skills assessment',
      audience: 'Job candidates, employees, and organizations assessing workplace competencies',
      instructions: `This assessment consists of 10 workplace scenarios.

For each scenario:
1. Read the situation carefully
2. Select the response that demonstrates the most effective workplace behavior
3. Choose the best answer based on professional standards

Consider aspects like: professionalism, communication, teamwork, problem-solving, and ethical behavior.

Complete all 10 scenarios honestly for accurate results.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: false,
      isEditable: true,
      totalQuestions: 10,
      totalMarks: 10,
      passingScore: 6,
      passingPercentage: 60,
      allowMultipleAttempts: true,
      maxAttempts: 3,
      showResultsImmediately: true,
      randomizeQuestions: true,
      randomizeOptions: true,
      reportConfig: {
        type: 'standard',
        showScores: true,
        showFullReport: true,
        showCorrectAnswers: true,
        showPercentile: false,
        includeRecommendations: true
      },
      tags: ['situational', 'judgment', 'workplace', 'professional', 'scenario']
    });

    console.log('Created Situational Judgement assessment:', assessment.title);

    // Create situational judgment questions
    const questionDocs = await Promise.all(
      situationalQuestions.map(q => 
        Question.create({
          assessment: assessment._id,
          type: 'mcq',
          questionText: q.questionText,
          options: q.options.map((opt, idx) => ({
            text: opt.text,
            order: idx,
            isCorrect: opt.isCorrect
          })),
          difficulty: 'moderate',
          category: 'situational',
          dimension: 'Workplace Judgment',
          order: q.order,
          marks: 1,
          isRequired: true,
          explanation: 'This scenario evaluates your approach to handling common workplace situations effectively and professionally.',
          tags: ['situational', 'judgment', 'scenario', 'workplace']
        })
      )
    );

    // Update assessment with question IDs
    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} Situational Judgement questions`);
    console.log('\n✅ Situational Judgement assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Sub-Category:', assessment.subCategory);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Passing Score:', assessment.passingScore, 'out of', assessment.totalMarks);
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');

  } catch (error) {
    console.error('Error seeding Situational Judgement:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedSituational();
}

module.exports = seedSituational;