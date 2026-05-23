/**
 * Critical Thinking Assessment Seeder
 * Creates a pre-configured critical thinking assessment with 20 MCQ questions
 * Covers argument analysis, logical fallacies, evidence evaluation, and analytical reasoning
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Assessment, Question, User, Organization } = require('../models');

// Critical thinking questions data
const criticalThinkingQuestions = [
  // Argument Analysis (5 questions)
  {
    type: 'argument-analysis',
    questionText: 'Argument: "Allowing students to use calculators in exams will make them dependent on technology and unable to perform basic mental arithmetic. Therefore, calculators should be banned from all exams." Which of the following best describes the flaw in this argument?',
    options: [
      { text: "It assumes that using calculators necessarily leads to inability in mental arithmetic without evidence", isCorrect: true },
      { text: "Calculators are more accurate than mental arithmetic", isCorrect: false },
      { text: "Students should be allowed to use any technology they want", isCorrect: false },
      { text: "The argument doesn't consider that exams test understanding, not calculation speed", isCorrect: false }
    ],
    explanation: "The argument commits a slippery slope fallacy - it assumes without evidence that calculator use will inevitably lead to inability to perform mental arithmetic."
  },
  {
    type: 'argument-analysis',
    questionText: 'Statement: "If a company has high employee turnover, it must have poor management. Company XYZ has poor management. Therefore, Company XYZ must have high employee turnover." This reasoning is:',
    options: [
      { text: 'Valid — the conclusion follows necessarily from the premises', isCorrect: false },
      { text: 'Invalid — it confuses a necessary condition with a sufficient condition (affirming the consequent)', isCorrect: true },
      { text: 'Invalid — the premise about Company XYZ is false', isCorrect: false },
      { text: 'Valid — both premises are true statements', isCorrect: false }
    ],
    explanation: "This is the fallacy of affirming the consequent. High turnover might indicate poor management, but poor management doesn't guarantee high turnover. The argument reverses the conditional relationship."
  },
  {
    type: 'argument-analysis',
    questionText: 'Which of the following is an unstated assumption of this argument? "The new marketing campaign increased sales by 30% in the first quarter. Therefore, the campaign was a success."',
    options: [
      { text: 'Sales increase is the only measure of a campaign\'s success', isCorrect: true },
      { text: 'The campaign was expensive to run', isCorrect: false },
      { text: 'The sales increase was sustained throughout the quarter', isCorrect: false },
      { text: 'Other factors did not contribute to the sales increase', isCorrect: false }
    ],
    explanation: "The argument assumes that a sales increase alone defines success. It ignores other factors like profitability, brand impact, customer satisfaction, and long-term effects."
  },
  {
    type: 'argument-analysis',
    questionText: 'Identify the main conclusion of this argument: "Studies show that teams with diverse backgrounds make better decisions. Our company has implemented a diversity hiring initiative. Since better decisions lead to higher profitability, we should expect improved financial results."',
    options: [
      { text: 'Teams with diverse backgrounds make better decisions', isCorrect: false },
      { text: 'The company should implement diversity initiatives', isCorrect: false },
      { text: 'The company should expect improved financial results', isCorrect: true },
      { text: 'Better decisions lead to higher profitability', isCorrect: false }
    ],
    explanation: "The conclusion is the final claim: the company should expect improved financial results. The other statements are premises that support this conclusion."
  },
  {
    type: 'argument-analysis',
    questionText: 'Argument: "Either we increase the marketing budget, or we will lose market share to competitors. We cannot afford to lose market share, so we must increase the marketing budget." This argument:',
    options: [
      { text: 'Is logically valid but presents a false dilemma', isCorrect: true },
      { text: 'Is completely sound and should be followed', isCorrect: false },
      { text: 'Is invalid because the premises contradict each other', isCorrect: false },
      { text: 'Is valid and considers all possible options', isCorrect: false }
    ],
    explanation: "The argument presents a false dilemma by suggesting only two options exist. There could be other strategies to maintain market share without increasing the marketing budget."
  },

  // Logical Fallacies (5 questions)
  {
    type: 'fallacies',
    questionText: '"We should not listen to Dr. Smith\'s arguments about climate change because he is not a climate scientist." This is an example of which fallacy?',
    options: [
      { text: 'Ad hominem (attacking the person rather than the argument)', isCorrect: false },
      { text: 'Appeal to authority (wrongly using authority as evidence)', isCorrect: false },
      { text: 'Genetic fallacy (judging argument by its origin rather than merit)', isCorrect: true },
      { text: 'Straw man (misrepresenting the opposing position)', isCorrect: false }
    ],
    explanation: "This is a genetic fallacy — dismissing an argument based on its source (Dr. Smith's credentials) rather than engaging with the actual argument. While expertise matters, the validity of an argument should be judged on its own merits."
  },
  {
    type: 'fallacies',
    questionText: '"If we allow remote work on Fridays, soon everyone will work from home full-time, and our office culture will completely collapse." This reasoning commits which fallacy?',
    options: [
      { text: 'Slippery slope (assuming a small step will lead to extreme consequences without evidence)', isCorrect: true },
      { text: 'Hasty generalization (drawing a conclusion from insufficient evidence)', isCorrect: false },
      { text: 'False cause (assuming correlation implies causation)', isCorrect: false },
      { text: 'Circular reasoning (assuming what needs to be proven)', isCorrect: false }
    ],
    explanation: "This is a slippery slope fallacy. It assumes without evidence that a limited remote work policy will inevitably escalate to full remote work and cultural collapse."
  },
  {
    type: 'fallacies',
    questionText: '"Most people in our survey prefer Product A over Product B. Therefore, Product A is objectively better." Which fallacy does this best illustrate?',
    options: [
      { text: 'Bandwagon fallacy (popularity does not equal quality)', isCorrect: true },
      { text: 'Confirmation bias (seeking evidence that confirms beliefs)', isCorrect: false },
      { text: 'Appeal to emotion (using emotions instead of logic)', isCorrect: false },
      { text: 'Red herring (introducing irrelevant information)', isCorrect: false }
    ],
    explanation: "This is a bandwagon (appeal to popularity) fallacy. The fact that most people prefer something doesn't make it objectively better. Quality is determined by objective criteria, not popularity."
  },
  {
    type: 'fallacies',
    questionText: '"You claim that our new policy will reduce efficiency. But you\'re the same person who was late to three meetings last month. Why should anyone listen to you?" This is primarily:',
    options: [
      { text: 'Ad hominem (attacking the person instead of addressing the argument)', isCorrect: true },
      { text: 'Tu quoque (pointing out hypocrisy)', isCorrect: false },
      { text: 'Straw man (misrepresenting the position)', isCorrect: false },
      { text: 'Red herring (distracting from the main issue)', isCorrect: false }
    ],
    explanation: "This is an ad hominem fallacy. The response attacks the person's credibility based on irrelevant personal behavior rather than engaging with their argument about efficiency."
  },
  {
    type: 'fallacies',
    questionText: '"If we don\'t invest in AI now, our competitors will overtake us and we\'ll go out of business within five years." This argument relies on:',
    options: [
      { text: 'False dilemma (presenting only extreme options as if they are the only possibilities)', isCorrect: true },
      { text: 'Appeal to fear (using fear to persuade)', isCorrect: false },
      { text: 'Straw man (misrepresenting the alternative position)', isCorrect: false },
      { text: 'Hasty generalization (conclusion based on insufficient evidence)', isCorrect: false }
    ],
    explanation: "This is primarily a false dilemma. It presents only two extreme outcomes (invest in AI or go out of business) while ignoring other possibilities like measured investment, partnerships, or alternative strategies."
  },

  // Evidence Evaluation (5 questions)
  {
    type: 'evidence-evaluation',
    questionText: 'A pharmaceutical company claims its new drug reduces headaches by 50%. Which additional information would most strengthen this claim?',
    options: [
      { text: 'A double-blind, placebo-controlled study with 10,000 participants showed a 50% reduction', isCorrect: true },
      { text: 'The company invested $500 million in developing the drug', isCorrect: false },
      { text: 'The CEO of the company uses the drug personally', isCorrect: false },
      { text: 'The drug is more expensive than existing alternatives', isCorrect: false }
    ],
    explanation: "A double-blind, placebo-controlled study with a large sample size is the gold standard for medical evidence. It eliminates bias and provides reliable data."
  },
  {
    type: 'evidence-evaluation',
    questionText: 'Survey result: "85% of doctors recommend Brand X pain reliever." To evaluate this claim, the most important question to ask is:',
    options: [
      { text: 'How many doctors were surveyed and how were they selected?', isCorrect: true },
      { text: 'Is Brand X available in stores near me?', isCorrect: false },
      { text: 'How much does Brand X cost compared to alternatives?', isCorrect: false },
      { text: 'What color is the packaging of Brand X?', isCorrect: false }
    ],
    explanation: "The credibility of survey data depends on sample size and selection methodology. A small or biased sample can produce misleading results regardless of the percentage."
  },
  {
    type: 'evidence-evaluation',
    questionText: 'Correlation: "Cities with more ice cream sales have higher crime rates." Which is the most reasonable interpretation?',
    options: [
      { text: 'Ice cream consumption causes people to commit crimes', isCorrect: false },
      { text: 'A third factor (e.g., warm weather) likely causes both increased ice cream sales and higher crime rates', isCorrect: true },
      { text: 'Higher crime rates make people seek comfort in ice cream', isCorrect: false },
      { text: 'The correlation is coincidental and meaningless', isCorrect: false }
    ],
    explanation: "Correlation does not imply causation. A confounding variable (warm weather) likely explains both: people buy more ice cream in summer, and crime rates also increase in warmer months."
  },
  {
    type: 'evidence-evaluation',
    questionText: 'A study shows that students who sleep 8+ hours per night get better grades than those who sleep less. To conclude that "more sleep causes better grades," what additional evidence would be most valuable?',
    options: [
      { text: 'A controlled experiment where students are randomly assigned to different sleep durations', isCorrect: true },
      { text: 'A survey asking students how much they study', isCorrect: false },
      { text: 'The average GPA of students in the study', isCorrect: false },
      { text: 'The cost of tuition at the students\' universities', isCorrect: false }
    ],
    explanation: "A randomized controlled experiment would establish causation by controlling for confounding variables. The current study only shows correlation — students who sleep more might differ in other ways (motivation, schedule, etc.)."
  },
  {
    type: 'evidence-evaluation',
    questionText: 'Which of the following is the strongest evidence that a training program improves employee productivity?',
    options: [
      { text: 'Productivity metrics before and after the program show a 15% improvement', isCorrect: false },
      { text: 'A controlled experiment: one group receives training, another doesn\'t; the trained group shows 15% higher productivity', isCorrect: true },
      { text: 'Participants report feeling more productive after the training', isCorrect: false },
      { text: 'The training program is used by several Fortune 500 companies', isCorrect: false }
    ],
    explanation: "A controlled experiment with a comparison group is the strongest evidence. It isolates the effect of the training from other factors (market conditions, seasonal effects, etc.)."
  },

  // Analytical Reasoning (5 questions)
  {
    type: 'analytical',
    questionText: 'Five friends — A, B, C, D, and E — are sitting in a row. A is not at either end. B is to the immediate right of A. C is two places away from B. D is at the far left end. Who is at the far right end?',
    options: [
      { text: 'E', isCorrect: true },
      { text: 'C', isCorrect: false },
      { text: 'A', isCorrect: false },
      { text: 'B', isCorrect: false }
    ],
    explanation: "D is at far left. A is not at either end. B is immediately right of A. C is two places away from B. The arrangement is: D, A, B, C, E. So E is at the far right."
  },
  {
    type: 'analytical',
    questionText: 'All marketing managers are team players. Some team players are creative. Which of the following must be true?',
    options: [
      { text: 'Some marketing managers are creative', isCorrect: false },
      { text: 'All team players are marketing managers', isCorrect: false },
      { text: 'It is possible that no marketing manager is creative', isCorrect: true },
      { text: 'Some creative people are marketing managers', isCorrect: false }
    ],
    explanation: "\"All M are T\" and \"Some T are C\" does not guarantee that any M is C. The creative team players could be in a different department. So it's possible that no marketing manager is creative."
  },
  {
    type: 'analytical',
    questionText: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
    options: [
      { text: '$0.10', isCorrect: false },
      { text: '$0.05', isCorrect: true },
      { text: '$0.15', isCorrect: false },
      { text: '$0.01', isCorrect: false }
    ],
    explanation: "Let ball = x, bat = x + 1.00. So x + (x + 1.00) = 1.10 → 2x + 1.00 = 1.10 → 2x = 0.10 → x = 0.05. The ball costs $0.05."
  },
  {
    type: 'analytical',
    questionText: 'A company has a policy that if an employee is late more than three times in a month, they lose their bonus. Sarah was late twice in January and once in February. Which conclusion is logically valid?',
    options: [
      { text: 'Sarah will lose her bonus', isCorrect: false },
      { text: 'The policy does not apply because the late days are in different months', isCorrect: true },
      { text: 'Sarah should be warned about her tardiness', isCorrect: false },
      { text: 'Sarah will be fired', isCorrect: false }
    ],
    explanation: "The policy specifies \"more than three times in a month.\" Sarah was late twice in January and once in February — never more than three times in a single month. So the policy does not apply based on the given information."
  },
  {
    type: 'analytical',
    questionText: 'Four cards are placed on a table showing: [3] [8] [Red] [Blue]. Each card has a number on one side and a color on the other. Which card(s) must you turn over to test the rule: "If a card shows an even number, the other side must be Red"?',
    options: [
      { text: '8 only', isCorrect: false },
      { text: '8 and Blue', isCorrect: true },
      { text: '3 and Red', isCorrect: false },
      { text: 'All four cards', isCorrect: false }
    ],
    explanation: "This is the Wason selection task. You need to check: (1) the 8 (even number) to ensure its other side is Red, and (2) the Blue card to ensure its other side is NOT an even number (which would violate the rule). The 3 (odd) and Red don't matter — the rule only applies to even numbers."
  },
];

const seedCriticalThinking = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmill');
    console.log('Connected to MongoDB');

    let organization = await Organization.findOne({ slug: 'default-org' });
    if (!organization) {
      organization = await Organization.create({
        name: 'Default Organization',
        slug: 'default-org',
        description: 'Default organization for critical thinking assessment'
      });
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
      category: 'cognitive',
      subCategory: 'Critical Thinking',
      organization: organization._id 
    });

    if (existingAssessment) {
      console.log('Critical Thinking assessment already exists:', existingAssessment.title);
      console.log('Recreating with updated content...');
      await Question.deleteMany({ assessment: existingAssessment._id });
      await Assessment.deleteOne({ _id: existingAssessment._id });
    }

    const assessment = await Assessment.create({
      title: 'Critical Thinking Assessment',
      description: 'The Critical Thinking Assessment evaluates your ability to analyze arguments, identify logical fallacies, evaluate evidence, and draw sound conclusions. This assessment measures higher-order reasoning skills essential for effective decision-making and problem-solving.',
      category: 'cognitive',
      subCategory: 'Critical Thinking',
      organization: organization._id,
      createdBy: adminUser._id,
      difficulty: 'moderate',
      timeBound: {
        enabled: true,
        durationMinutes: 35
      },
      purpose: 'Critical thinking evaluation and analytical reasoning assessment',
      audience: 'Individuals seeking to measure critical thinking and analytical skills',
      instructions: `This assessment consists of 20 questions covering argument analysis, logical fallacies, evidence evaluation, and analytical reasoning.

For each question:
1. Read the question carefully
2. Select the best answer from the four options
3. You have 35 minutes to complete all questions

Answer each question based on the information provided. There is only one correct answer per question.`,
      isActive: true,
      isPublished: true,
      isLockedStructure: false,
      isEditable: true,
      totalQuestions: 20,
      totalMarks: 20,
      passingScore: 12,
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
      tags: ['cognitive', 'critical-thinking', 'reasoning', 'analytical', 'logic', 'problem-solving']
    });

    console.log('Created Critical Thinking assessment:', assessment.title);

    const questionDocs = await Promise.all(
      criticalThinkingQuestions.map((q, idx) => 
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
          dimension: q.type,
          order: idx + 1,
          marks: 1,
          isRequired: true,
          explanation: q.explanation,
          tags: ['cognitive', 'critical-thinking', q.type]
        })
      )
    );

    assessment.questions = questionDocs.map(q => q._id);
    await assessment.save();

    console.log(`Created ${questionDocs.length} Critical Thinking questions`);
    console.log('\n✅ Critical Thinking assessment seeded successfully!');
    console.log('\nAssessment Details:');
    console.log('- Title:', assessment.title);
    console.log('- ID:', assessment._id);
    console.log('- Category:', assessment.category);
    console.log('- Subcategory:', assessment.subCategory);
    console.log('- Questions:', assessment.totalQuestions);
    console.log('- Duration:', assessment.timeBound.durationMinutes, 'minutes');
    console.log('- Status:', assessment.isPublished ? 'Published' : 'Draft');

  } catch (error) {
    console.error('Error seeding Critical Thinking assessment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

if (require.main === module) {
  seedCriticalThinking();
}

module.exports = seedCriticalThinking;
