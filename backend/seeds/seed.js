/**
 * Mindmill Database Seeder
 *
 * ⚠️  DESTRUCTIVE: This script deletes ALL existing data before seeding.
 *     Only use for development/reset purposes.
 *
 * Usage: npm run seed
 *
 * Creates:
 *   - 3 Organizations (Demo, Global Talent, Peak Performance)
 *   - 10 Users (1 superadmin, 3 admins, 6 regular users)
 *   - DISC Personality Assessment (28 questions)
 *   - Big Five Personality Test (50 questions)
 *   - Cognitive Aptitude Test (3 questions)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/database');
const { User, Organization, Assessment, Question, Attempt } = require('../models');

// Import official question sets
const { big5Questions } = require('../seeders/big5Questions');
const { discQuestions } = require('../seeders/discQuestions');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB...\n');

    // ──────────────────────────────────────────────
    // 1. CLEAR ALL EXISTING DATA
    // ──────────────────────────────────────────────
    console.log('⚠️  CLEARING ALL EXISTING DATA...');
    await Attempt.deleteMany({});
    await Question.deleteMany({});
    await Assessment.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});
    console.log('✅ All existing data deleted\n');

    // ──────────────────────────────────────────────
    // 2. CREATE ORGANIZATIONS
    // ──────────────────────────────────────────────
    const demoOrg = await Organization.create({
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'A demo organization for testing Mindmill Assessments',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      brandingEnabled: true,
      publicProfileEnabled: true,
      publicProfile: {
        headline: 'Leading the Future of Talent Assessment',
        about: 'We use cutting-edge psychometric assessments to identify and develop top talent.',
        website: 'https://example.com',
        linkedin: 'https://linkedin.com/company/demo-org',
        location: 'San Francisco, CA',
        industry: 'Technology',
        companySize: '50-200 employees'
      },
      credits: {
        total: 1000,
        used: 0,
        expiryDate: new Date('2026-12-31')
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date('2026-12-31')
      }
    });

    const globalTalent = await Organization.create({
      name: 'Global Talent Solutions',
      slug: 'global-talent',
      description: 'International recruitment and talent management specialists.',
      primaryColor: '#0ea5e9',
      secondaryColor: '#2dd4bf',
      brandingEnabled: true,
      credits: { total: 5000, used: 0, expiryDate: new Date('2026-12-31') }
    });

    const peakPerformance = await Organization.create({
      name: 'Peak Performance Inc.',
      slug: 'peak-performance',
      description: 'Helping companies reach their full potential through data-driven insights.',
      primaryColor: '#f43f5e',
      secondaryColor: '#fb923c',
      brandingEnabled: true,
      credits: { total: 2500, used: 0, expiryDate: new Date('2026-12-31') }
    });

    console.log('✅ Created 3 Organizations');

    // ──────────────────────────────────────────────
    // 3. CREATE USERS
    // ──────────────────────────────────────────────

    // SuperAdmin (no organization)
    const superAdmin = await User.create({
      email: 'super@admin.com',
      password: 'supperadmin',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      organization: null,
      isActive: true
    });

    // Admin for Demo Org
    const admin = await User.create({
      email: 'admin@admin.com',
      password: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      organization: demoOrg._id,
      isActive: true,
      jobTitle: 'HR Manager'
    });

    // Admin for Global Talent
    const sarah = await User.create({
      email: 'sarah.j@globaltalent.com',
      password: 'password',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: 'admin',
      organization: globalTalent._id,
      isActive: true,
      jobTitle: 'Senior Recruiter'
    });

    // Admin for Peak Performance
    const michael = await User.create({
      email: 'm.chen@peakperformance.com',
      password: 'password',
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'admin',
      organization: peakPerformance._id,
      isActive: true,
      jobTitle: 'Operations Director'
    });

    // Regular user for Demo Org (primary test user)
    const user = await User.create({
      email: 'user@user.com',
      password: 'user',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      organization: demoOrg._id,
      isActive: true,
      jobTitle: 'Software Engineer'
    });

    // Regular user for Demo Org
    const david = await User.create({
      email: 'd.wilson@demo.com',
      password: 'password',
      firstName: 'David',
      lastName: 'Wilson',
      role: 'user',
      organization: demoOrg._id,
      isActive: true,
      jobTitle: 'Product Designer'
    });

    // Regular user 1 for Global Talent
    const emily = await User.create({
      email: 'emily.r@globaltalent.com',
      password: 'password',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      role: 'user',
      organization: globalTalent._id,
      isActive: true,
      jobTitle: 'Talent Scout'
    });

    // Regular user 2 for Global Talent
    const james = await User.create({
      email: 'james.k@globaltalent.com',
      password: 'password',
      firstName: 'James',
      lastName: 'Kim',
      role: 'user',
      organization: globalTalent._id,
      isActive: true,
      jobTitle: 'HR Coordinator'
    });

    // Regular user 1 for Peak Performance
    const lisa = await User.create({
      email: 'lisa.p@peakperformance.com',
      password: 'password',
      firstName: 'Lisa',
      lastName: 'Patel',
      role: 'user',
      organization: peakPerformance._id,
      isActive: true,
      jobTitle: 'Business Analyst'
    });

    // Regular user 2 for Peak Performance
    const ryan = await User.create({
      email: 'ryan.t@peakperformance.com',
      password: 'password',
      firstName: 'Ryan',
      lastName: 'Thompson',
      role: 'user',
      organization: peakPerformance._id,
      isActive: true,
      jobTitle: 'Sales Manager'
    });

    console.log('✅ Created 10 Users');

    // ──────────────────────────────────────────────
    // 4. CREATE DISC ASSESSMENT (28 questions)
    // ──────────────────────────────────────────────
    const discAssessment = await Assessment.create({
      title: 'DISC Personality Assessment',
      description: 'The DISC assessment measures four behavioral styles: Dominance (D), Influence (I), Steadiness (S), and Conscientiousness (C). This scientifically validated assessment helps you understand your natural behavioral tendencies and how you interact with others.',
      category: 'disc',
      subCategory: 'personality',
      organization: demoOrg._id,
      createdBy: admin._id,
      difficulty: 'basic',
      timeBound: { enabled: true, durationMinutes: 25 },
      purpose: 'Personality profiling, team dynamics, and self-awareness',
      audience: 'Individuals seeking to understand their behavioral style',
      instructions: `This assessment consists of 28 questions. For each question, you will see four statements representing different behavioral styles (D, I, S, C).

For each question:
1. Select the statement that is MOST like you in a work environment
2. Select the statement that is LEAST like you in a work environment

Answer based on your natural behavior, not how you think you should behave. There are no right or wrong answers.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: true,
      isEditable: false,
      totalQuestions: 28,
      totalMarks: 280,
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
      tags: ['personality', 'disc', 'psychometric', 'behavioral', 'team-dynamics'],
      assignedUsers: [user._id, david._id]
    });

    const discQuestionDocs = await Promise.all(
      discQuestions.map(q =>
        Question.create({
          assessment: discAssessment._id,
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
            score: 0
          })),
          difficulty: 'basic',
          category: 'personality',
          dimension: 'DISC',
          order: q.order,
          marks: 2,
          isRequired: true,
          tags: ['disc', 'personality', 'behavioral']
        })
      )
    );

    discAssessment.questions = discQuestionDocs.map(q => q._id);
    discAssessment.totalQuestions = discQuestionDocs.length;
    await discAssessment.save();

    console.log(`✅ Created DISC Assessment (${discQuestionDocs.length} questions)`);

    // ──────────────────────────────────────────────
    // 5. CREATE BIG5 ASSESSMENT (50 questions)
    // ──────────────────────────────────────────────
    const big5Assessment = await Assessment.create({
      title: 'Big Five Personality Test (BFPT-50)',
      description: 'The Big Five Personality Test measures five major dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism (OCEAN). This scientifically validated assessment uses 50 questions to provide insights into your personality traits.',
      category: 'big5',
      subCategory: 'personality',
      organization: demoOrg._id,
      createdBy: admin._id,
      difficulty: 'moderate',
      timeBound: { enabled: true, durationMinutes: 30 },
      purpose: 'Personality assessment and self-discovery',
      audience: 'Individuals seeking to understand their personality traits',
      instructions: `Please respond to each statement honestly based on how you see yourself.

Use the following scale:
1 = Disagree
2 = Slightly Disagree
3 = Neutral
4 = Slightly Agree
5 = Agree

There are no right or wrong answers. Answer based on your natural tendencies, not how you think you should be.`,
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
      tags: ['personality', 'big5', 'psychometric', 'ocean', 'traits'],
      assignedUsers: [user._id]
    });

    const big5QuestionDocs = await Promise.all(
      big5Questions.map(q =>
        Question.create({
          assessment: big5Assessment._id,
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
          tags: [q.trait.toLowerCase(), 'big5', 'personality']
        })
      )
    );

    big5Assessment.questions = big5QuestionDocs.map(q => q._id);
    big5Assessment.totalQuestions = big5QuestionDocs.length;
    await big5Assessment.save();

    console.log(`✅ Created Big5 Assessment (${big5QuestionDocs.length} questions)`);

    // ──────────────────────────────────────────────
    // 6. CREATE COGNITIVE ASSESSMENT (3 sample questions)
    // ──────────────────────────────────────────────
    const cognitiveAssessment = await Assessment.create({
      title: 'Cognitive Aptitude Test',
      description: 'Test your problem-solving abilities, critical thinking, and logical reasoning.',
      category: 'cognitive',
      subCategory: 'General Aptitude',
      organization: demoOrg._id,
      createdBy: admin._id,
      difficulty: 'moderate',
      timeBound: { enabled: true, durationMinutes: 30 },
      purpose: 'Evaluate cognitive abilities for hiring decisions',
      audience: 'Job candidates',
      instructions: 'Read each question carefully. You have 30 minutes to complete this assessment.',
      isActive: true,
      isPublished: true,
      passingScore: 60,
      reportConfig: {
        type: 'standard',
        showScores: true,
        showFullReport: true,
        showPercentile: true
      },
      tags: ['cognitive', 'aptitude', 'hiring', 'recruitment'],
      assignedUsers: [user._id]
    });

    const cognitiveQuestions = [
      {
        assessment: cognitiveAssessment._id,
        type: 'mcq',
        questionText: 'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
        options: [
          { text: '38', score: 0, isCorrect: false },
          { text: '40', score: 0, isCorrect: false },
          { text: '42', score: 1, isCorrect: true },
          { text: '44', score: 0, isCorrect: false }
        ],
        difficulty: 'moderate',
        category: 'Numerical Reasoning',
        order: 1,
        marks: 1,
        explanation: 'The pattern is: n(n+1) where n starts at 1. 1x2=2, 2x3=6, 3x4=12, 4x5=20, 5x6=30, 6x7=42'
      },
      {
        assessment: cognitiveAssessment._id,
        type: 'mcq',
        questionText: 'If all Bloops are Bleeps and all Bleeps are Blops, then:',
        options: [
          { text: 'All Bloops are definitely Blops', score: 1, isCorrect: true },
          { text: 'All Blops are definitely Bloops', score: 0, isCorrect: false },
          { text: 'Bloops may or may not be Blops', score: 0, isCorrect: false },
          { text: 'None of the above', score: 0, isCorrect: false }
        ],
        difficulty: 'moderate',
        category: 'Logical Reasoning',
        order: 2,
        marks: 1,
        explanation: 'If A -> B and B -> C, then A -> C (transitive property)'
      },
      {
        assessment: cognitiveAssessment._id,
        type: 'mcq',
        questionText: 'A train travels 240 miles in 4 hours. What is its average speed?',
        options: [
          { text: '50 mph', score: 0, isCorrect: false },
          { text: '55 mph', score: 0, isCorrect: false },
          { text: '60 mph', score: 1, isCorrect: true },
          { text: '65 mph', score: 0, isCorrect: false }
        ],
        difficulty: 'basic',
        category: 'Numerical Reasoning',
        order: 3,
        marks: 1,
        explanation: 'Speed = Distance / Time = 240 / 4 = 60 mph'
      }
    ];

    const createdCognitiveQuestions = await Question.insertMany(
      cognitiveQuestions.map(q => ({ ...q, isRequired: true, tags: ['cognitive'] }))
    );
    cognitiveAssessment.questions = createdCognitiveQuestions.map(q => q._id);
    cognitiveAssessment.totalQuestions = createdCognitiveQuestions.length;
    await cognitiveAssessment.save();

    console.log(`✅ Created Cognitive Assessment (${createdCognitiveQuestions.length} questions)`);

    // ──────────────────────────────────────────────
    // 7. LINK ASSESSMENTS TO USERS
    // ──────────────────────────────────────────────
    user.assignedAssessments = [discAssessment._id, big5Assessment._id, cognitiveAssessment._id];
    await user.save();

    david.assignedAssessments = [discAssessment._id];
    await david.save();

    console.log('✅ Linked assessments to users');

    // ──────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55));
    console.log('  DATABASE SEEDED SUCCESSFULLY');
    console.log('═'.repeat(55));

    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log('  ┌──────────────────────────────────────────────────────┐');
    console.log('  │ SuperAdmin:       super@admin.com / supperadmin      │');
    console.log('  ├──────────────────────────────────────────────────────┤');
    console.log('  │ Admin (Demo):     admin@admin.com / admin            │');
    console.log('  │ User (Demo 1):    user@user.com / user               │');
    console.log('  │ User (Demo 2):    d.wilson@demo.com / password       │');
    console.log('  ├──────────────────────────────────────────────────────┤');
    console.log('  │ Admin (Global):   sarah.j@globaltalent.com / password │');
    console.log('  │ User (Global 1):  emily.r@globaltalent.com / password │');
    console.log('  │ User (Global 2):  james.k@globaltalent.com / password │');
    console.log('  ├──────────────────────────────────────────────────────┤');
    console.log('  │ Admin (Peak):     m.chen@peakperformance.com / password');
    console.log('  │ User (Peak 1):    lisa.p@peakperformance.com / password');
    console.log('  │ User (Peak 2):    ryan.t@peakperformance.com / password');
    console.log('  └──────────────────────────────────────────────────────┘');

    console.log('\n🏢 ORGANIZATIONS:');
    console.log('  - Demo Organization (pro plan, 1000 credits)');
    console.log('  - Global Talent Solutions (5000 credits)');
    console.log('  - Peak Performance Inc. (2500 credits)');

    console.log('\n📝 ASSESSMENTS (all under Demo Org):');
    console.log(`  - DISC Personality Assessment (${discQuestionDocs.length} questions)`);
    console.log(`  - Big Five Personality Test (${big5QuestionDocs.length} questions)`);
    console.log(`  - Cognitive Aptitude Test (${createdCognitiveQuestions.length} questions)`);

    console.log('\n👤 ASSIGNED TO: user@user.com, d.wilson@demo.com');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
