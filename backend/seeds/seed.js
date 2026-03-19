const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { User, Organization, Assessment, Question } = require('../models');

const connectDB = require('../config/database');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Connected to MongoDB...');
    console.log('Seeding database...\n');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Assessment.deleteMany({});
    await Question.deleteMany({});

    console.log('Cleared existing data');

    // Create Organizations
    const demoOrg = await Organization.create({
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'A demo organization for testing Mindmil Assessments',
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
        expiryDate: new Date('2025-12-31')
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        startDate: new Date(),
        endDate: new Date('2025-12-31')
      }
    });

    const globalTalent = await Organization.create({
      name: 'Global Talent Solutions',
      slug: 'global-talent',
      description: 'International recruitment and talent management specialists.',
      primaryColor: '#0ea5e9',
      secondaryColor: '#2dd4bf',
      brandingEnabled: true,
      credits: { total: 5000, used: 0, expiryDate: new Date('2025-12-31') }
    });

    const peakPerformance = await Organization.create({
      name: 'Peak Performance Inc.',
      slug: 'peak-performance',
      description: 'Helping companies reach their full potential through data-driven insights.',
      primaryColor: '#f43f5e',
      secondaryColor: '#fb923c',
      brandingEnabled: true,
      credits: { total: 2500, used: 0, expiryDate: new Date('2025-12-31') }
    });

    console.log('Created Organizations: Demo Organization, Global Talent Solutions, Peak Performance Inc.');

    // Create SuperAdmin
    const superAdmin = await User.create({
      email: 'super@admin.com',
      password: 'super',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      organization: null,
      isActive: true
    });

    console.log('Created SuperAdmin: super@admin.com / super');

    // Create Admins for new Orgs
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

    // Create Admin for Demo Org
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

    console.log('Created Admins: admin@admin.com, sarah.j@globaltalent.com, m.chen@peakperformance.com');

    // Create Regular Users
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

    console.log('Created Users: user@user.com, d.wilson@demo.com, emily.r@globaltalent.com');

    // Create Sample Psychometric Assessment
    const psychometricAssessment = await Assessment.create({
      title: 'DISC Personality Assessment',
      description: 'Discover your behavioral style and how you interact with others.',
      category: 'psychometric',
      subCategory: 'DISC',
      organization: demoOrg._id,
      createdBy: admin._id,
      difficulty: 'basic',
      timeBound: {
        enabled: true,
        durationMinutes: 20
      },
      purpose: 'Personality profiling and team dynamics',
      audience: 'All employees',
      instructions: 'Answer each question honestly based on your natural behavior, not how you think you should behave.',
      isActive: true,
      isPublished: true,
      passingScore: 0,
      reportConfig: {
        type: 'auto-psychometric',
        showScores: false,
        showFullReport: true,
        includeRecommendations: true
      },
      tags: ['personality', 'disc', 'psychometric', 'team-building'],
      assignedUsers: [user._id]
    });

    // Create DISC Questions
    const discQuestions = [
      {
        assessment: psychometricAssessment._id,
        type: 'mcq',
        questionText: 'In a team meeting, I typically:',
        options: [
          { text: 'Take charge and direct the discussion', score: 4, isCorrect: false },
          { text: 'Encourage others to share their ideas', score: 3, isCorrect: false },
          { text: 'Listen carefully and provide thoughtful input', score: 2, isCorrect: false },
          { text: 'Focus on the details and accuracy of information', score: 1, isCorrect: false }
        ],
        difficulty: 'basic',
        dimension: 'Dominance',
        order: 1,
        marks: 1
      },
      {
        assessment: psychometricAssessment._id,
        type: 'mcq',
        questionText: 'When facing a challenge, I prefer to:',
        options: [
          { text: 'Take immediate action and solve it quickly', score: 4, isCorrect: false },
          { text: 'Collaborate with others to find a solution', score: 3, isCorrect: false },
          { text: 'Think carefully before making any moves', score: 2, isCorrect: false },
          { text: 'Analyze all possible outcomes first', score: 1, isCorrect: false }
        ],
        difficulty: 'basic',
        dimension: 'Dominance',
        order: 2,
        marks: 1
      },
      {
        assessment: psychometricAssessment._id,
        type: 'mcq',
        questionText: 'In social situations, I am usually:',
        options: [
          { text: 'The center of attention', score: 4, isCorrect: false },
          { text: 'Friendly and engaging with everyone', score: 3, isCorrect: false },
          { text: 'Comfortable with a small group of friends', score: 2, isCorrect: false },
          { text: 'Observant and prefer to listen', score: 1, isCorrect: false }
        ],
        difficulty: 'basic',
        dimension: 'Influence',
        order: 3,
        marks: 1
      },
      {
        assessment: psychometricAssessment._id,
        type: 'mcq',
        questionText: 'When working on a project, I prioritize:',
        options: [
          { text: 'Achieving results quickly', score: 4, isCorrect: false },
          { text: 'Keeping the team motivated and engaged', score: 3, isCorrect: false },
          { text: 'Maintaining stability and harmony', score: 2, isCorrect: false },
          { text: 'Ensuring accuracy and quality', score: 1, isCorrect: false }
        ],
        difficulty: 'basic',
        dimension: 'Steadiness',
        order: 4,
        marks: 1
      },
      {
        assessment: psychometricAssessment._id,
        type: 'mcq',
        questionText: 'I prefer work environments that are:',
        options: [
          { text: 'Fast-paced and challenging', score: 4, isCorrect: false },
          { text: 'Collaborative and social', score: 3, isCorrect: false },
          { text: 'Stable and predictable', score: 2, isCorrect: false },
          { text: 'Structured and organized', score: 1, isCorrect: false }
        ],
        difficulty: 'basic',
        dimension: 'Compliance',
        order: 5,
        marks: 1
      }
    ];

    const createdDiscQuestions = await Question.insertMany(discQuestions);
    psychometricAssessment.questions = createdDiscQuestions.map(q => q._id);
    psychometricAssessment.totalQuestions = createdDiscQuestions.length;
    await psychometricAssessment.save();

    console.log('Created Psychometric Assessment: DISC Personality Assessment (5 questions)');

    // Create Sample Cognitive Assessment
    const cognitiveAssessment = await Assessment.create({
      title: 'Cognitive Aptitude Test',
      description: 'Test your problem-solving abilities, critical thinking, and logical reasoning.',
      category: 'cognitive',
      subCategory: 'General Aptitude',
      organization: demoOrg._id,
      createdBy: admin._id,
      difficulty: 'moderate',
      timeBound: {
        enabled: true,
        durationMinutes: 30
      },
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

    // Create Cognitive Questions
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
        explanation: 'The pattern is: n(n+1) where n starts at 1. 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42'
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
        explanation: 'If A → B and B → C, then A → C (transitive property)'
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
        explanation: 'Speed = Distance ÷ Time = 240 ÷ 4 = 60 mph'
      }
    ];

    const createdCognitiveQuestions = await Question.insertMany(cognitiveQuestions);
    cognitiveAssessment.questions = createdCognitiveQuestions.map(q => q._id);
    cognitiveAssessment.totalQuestions = createdCognitiveQuestions.length;
    await cognitiveAssessment.save();

    console.log('Created Cognitive Assessment: Cognitive Aptitude Test (3 questions)');

    // Add assessments to user's assigned assessments
    user.assignedAssessments = [psychometricAssessment._id, cognitiveAssessment._id];
    await user.save();

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   SuperAdmin:  super@admin.com / super');
    console.log('   Admin (Demo): admin@admin.com / admin');
    console.log('   User (Demo):  user@user.com / user');
    console.log('   Admin (Global): sarah.j@globaltalent.com / password');
    console.log('   Admin (Peak):   m.chen@peakperformance.com / password');
    console.log('   User (Demo):    d.wilson@demo.com / password');
    console.log('   User (Global):  emily.r@globaltalent.com / password');
    console.log('\n🏢 Organizations:');
    console.log('   - Demo Organization');
    console.log('   - Global Talent Solutions');
    console.log('   - Peak Performance Inc.');
    console.log('📝 Assessments: Sample assessments created/linked');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
