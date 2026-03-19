/**
 * DISC Personality Assessment - Official 24 Questions
 * 
 * DISC measures four behavioral styles:
 * D = Dominance (Direct, Results-oriented, Strong-willed, Forceful)
 * I = Influence (Outgoing, Enthusiastic, Optimistic, High-spirited)
 * S = Steadiness (Even-tempered, Accommodating, Patient, Humble)
 * C = Conscientiousness (Analytical, Reserved, Precise, Systematic)
 * 
 * Each question presents four statements. The respondent assigns:
 * 4 = Most like me
 * 3 = Quite like me
 * 2 = Somewhat like me
 * 1 = Least like me
 * 
 * Scoring: Sum the scores for each dimension across all questions
 */

const discQuestions = [
  {
    order: 1,
    questionText: "Choose the statement that is MOST like you and the statement that is LEAST like you in a work environment.",
    statements: [
      { text: "I enjoy competitive challenges and winning", trait: "D", score: 4 },
      { text: "I like to influence and persuade others", trait: "I", score: 4 },
      { text: "I prefer steady, predictable work environments", trait: "S", score: 4 },
      { text: "I focus on accuracy and quality in my work", trait: "C", score: 4 }
    ]
  },
  {
    order: 2,
    questionText: "Select what describes you best and least in team situations.",
    statements: [
      { text: "I take charge and make decisions quickly", trait: "D", score: 4 },
      { text: "I create enthusiasm and motivate others", trait: "I", score: 4 },
      { text: "I listen carefully and support team harmony", trait: "S", score: 4 },
      { text: "I analyze data and ensure correctness", trait: "C", score: 4 }
    ]
  },
  {
    order: 3,
    questionText: "Choose your typical approach to problems.",
    statements: [
      { text: "I tackle problems head-on and act fast", trait: "D", score: 4 },
      { text: "I brainstorm creative solutions with others", trait: "I", score: 4 },
      { text: "I consider how decisions affect people", trait: "S", score: 4 },
      { text: "I research thoroughly before acting", trait: "C", score: 4 }
    ]
  },
  {
    order: 4,
    questionText: "Select what best describes your communication style.",
    statements: [
      { text: "I'm direct, brief, and to the point", trait: "D", score: 4 },
      { text: "I'm animated, expressive, and engaging", trait: "I", score: 4 },
      { text: "I'm calm, patient, and a good listener", trait: "S", score: 4 },
      { text: "I'm precise, detailed, and logical", trait: "C", score: 4 }
    ]
  },
  {
    order: 5,
    questionText: "Choose your preferred work pace and style.",
    statements: [
      { text: "Fast-paced with quick results", trait: "D", score: 4 },
      { text: "Energetic with variety and interaction", trait: "I", score: 4 },
      { text: "Steady with established routines", trait: "S", score: 4 },
      { text: "Methodical with careful planning", trait: "C", score: 4 }
    ]
  },
  {
    order: 6,
    questionText: "Select how you typically handle change.",
    statements: [
      { text: "I initiate change and drive new directions", trait: "D", score: 4 },
      { text: "I embrace change as exciting opportunities", trait: "I", score: 4 },
      { text: "I adapt gradually with support from others", trait: "S", score: 4 },
      { text: "I evaluate change carefully before accepting", trait: "C", score: 4 }
    ]
  },
  {
    order: 7,
    questionText: "Choose your approach to rules and procedures.",
    statements: [
      { text: "I bend rules to achieve results faster", trait: "D", score: 4 },
      { text: "I interpret rules flexibly based on people", trait: "I", score: 4 },
      { text: "I follow established procedures consistently", trait: "S", score: 4 },
      { text: "I ensure all rules are followed precisely", trait: "C", score: 4 }
    ]
  },
  {
    order: 8,
    questionText: "Select how you make important decisions.",
    statements: [
      { text: "Quickly, based on gut instinct", trait: "D", score: 4 },
      { text: "Based on input and consensus from others", trait: "I", score: 4 },
      { text: "Carefully, considering everyone's feelings", trait: "S", score: 4 },
      { text: "After thorough analysis of all facts", trait: "C", score: 4 }
    ]
  },
  {
    order: 9,
    questionText: "Choose your typical response to conflict.",
    statements: [
      { text: "I confront it directly and resolve it quickly", trait: "D", score: 4 },
      { text: "I use humor and diplomacy to ease tension", trait: "I", score: 4 },
      { text: "I seek compromise and maintain relationships", trait: "S", score: 4 },
      { text: "I analyze the root cause objectively", trait: "C", score: 4 }
    ]
  },
  {
    order: 10,
    questionText: "Select what motivates you most at work.",
    statements: [
      { text: "Achieving results and winning", trait: "D", score: 4 },
      { text: "Recognition and social approval", trait: "I", score: 4 },
      { text: "Stability and helping others succeed", trait: "S", score: 4 },
      { text: "Quality and expertise in my field", trait: "C", score: 4 }
    ]
  },
  {
    order: 11,
    questionText: "Choose how you prefer to lead others.",
    statements: [
      { text: "By setting ambitious goals and pushing for results", trait: "D", score: 4 },
      { text: "By inspiring and energizing the team", trait: "I", score: 4 },
      { text: "By supporting and developing team members", trait: "S", score: 4 },
      { text: "By ensuring accuracy and following best practices", trait: "C", score: 4 }
    ]
  },
  {
    order: 12,
    questionText: "Select your approach to meeting deadlines.",
    statements: [
      { text: "I push hard to finish early", trait: "D", score: 4 },
      { text: "I motivate the team to work together", trait: "I", score: 4 },
      { text: "I work steadily and reliably", trait: "S", score: 4 },
      { text: "I plan carefully to ensure quality", trait: "C", score: 4 }
    ]
  },
  {
    order: 13,
    questionText: "Choose how you typically handle criticism.",
    statements: [
      { text: "I dismiss it and focus on my goals", trait: "D", score: 4 },
      { text: "I try to charm my way out of it", trait: "I", score: 4 },
      { text: "I take it personally and feel hurt", trait: "S", score: 4 },
      { text: "I analyze whether it's valid and accurate", trait: "C", score: 4 }
    ]
  },
  {
    order: 14,
    questionText: "Select your preferred role in group projects.",
    statements: [
      { text: "The leader who directs the effort", trait: "D", score: 4 },
      { text: "The promoter who generates excitement", trait: "I", score: 4 },
      { text: "The supporter who ensures cooperation", trait: "S", score: 4 },
      { text: "The analyst who checks the details", trait: "C", score: 4 }
    ]
  },
  {
    order: 15,
    questionText: "Choose how you set personal goals.",
    statements: [
      { text: "Aggressive, challenging targets", trait: "D", score: 4 },
      { text: "Goals that involve people and recognition", trait: "I", score: 4 },
      { text: "Realistic, achievable objectives", trait: "S", score: 4 },
      { text: "Specific, measurable outcomes", trait: "C", score: 4 }
    ]
  },
  {
    order: 16,
    questionText: "Select your attitude toward risk.",
    statements: [
      { text: "I take bold risks for big rewards", trait: "D", score: 4 },
      { text: "I take social risks to meet people", trait: "I", score: 4 },
      { text: "I prefer low-risk, stable situations", trait: "S", score: 4 },
      { text: "I calculate risks carefully before acting", trait: "C", score: 4 }
    ]
  },
  {
    order: 17,
    questionText: "Choose how you prefer to receive information.",
    statements: [
      { text: "Brief summaries with key points only", trait: "D", score: 4 },
      { text: "Interactive discussions with others", trait: "I", score: 4 },
      { text: "Personal explanations with time to process", trait: "S", score: 4 },
      { text: "Detailed data and comprehensive reports", trait: "C", score: 4 }
    ]
  },
  {
    order: 18,
    questionText: "Select how you build relationships at work.",
    statements: [
      { text: "Through achieving shared goals", trait: "D", score: 4 },
      { text: "Through socializing and networking", trait: "I", score: 4 },
      { text: "Through trust and long-term loyalty", trait: "S", score: 4 },
      { text: "Through competence and reliability", trait: "C", score: 4 }
    ]
  },
  {
    order: 19,
    questionText: "Choose your typical response to stress.",
    statements: [
      { text: "I become more demanding and controlling", trait: "D", score: 4 },
      { text: "I become more talkative and seek attention", trait: "I", score: 4 },
      { text: "I become withdrawn and seek stability", trait: "S", score: 4 },
      { text: "I become overly critical and perfectionist", trait: "C", score: 4 }
    ]
  },
  {
    order: 20,
    questionText: "Select what you value most in a workplace.",
    statements: [
      { text: "Autonomy and authority to make decisions", trait: "D", score: 4 },
      { text: "A fun, social atmosphere", trait: "I", score: 4 },
      { text: "Security and a sense of belonging", trait: "S", score: 4 },
      { text: "Clear standards and quality focus", trait: "C", score: 4 }
    ]
  },
  {
    order: 21,
    questionText: "Choose how you handle multiple priorities.",
    statements: [
      { text: "I prioritize by urgency and impact", trait: "D", score: 4 },
      { text: "I delegate and involve others", trait: "I", score: 4 },
      { text: "I work through them methodically", trait: "S", score: 4 },
      { text: "I organize them systematically by importance", trait: "C", score: 4 }
    ]
  },
  {
    order: 22,
    questionText: "Select your approach to learning new skills.",
    statements: [
      { text: "I learn by doing and taking charge", trait: "D", score: 4 },
      { text: "I learn through interaction and discussion", trait: "I", score: 4 },
      { text: "I learn with guidance and practice", trait: "S", score: 4 },
      { text: "I learn through study and research", trait: "C", score: 4 }
    ]
  },
  {
    order: 23,
    questionText: "Choose how you express disagreement.",
    statements: [
      { text: "I state my position firmly and directly", trait: "D", score: 4 },
      { text: "I try to persuade others to my view", trait: "I", score: 4 },
      { text: "I avoid confrontation if possible", trait: "S", score: 4 },
      { text: "I present logical arguments and facts", trait: "C", score: 4 }
    ]
  },
  {
    order: 24,
    questionText: "Select what best describes your overall work approach.",
    statements: [
      { text: "Results-driven and competitive", trait: "D", score: 4 },
      { text: "People-focused and enthusiastic", trait: "I", score: 4 },
      { text: "Team-oriented and dependable", trait: "S", score: 4 },
      { text: "Quality-focused and analytical", trait: "C", score: 4 }
    ]
  },
  {
    order: 25,
    questionText: "When working on a project, I prefer to:",
    statements: [
      { text: "Take the lead and make key decisions", trait: "D", score: 4 },
      { text: "Collaborate and build team enthusiasm", trait: "I", score: 4 },
      { text: "Maintain consistent progress and stability", trait: "S", score: 4 },
      { text: "Ensure all details are correct and complete", trait: "C", score: 4 }
    ]
  },
  {
    order: 26,
    questionText: "In meetings, I typically:",
    statements: [
      { text: "Take charge and drive the agenda", trait: "D", score: 4 },
      { text: "Engage others and generate ideas", trait: "I", score: 4 },
      { text: "Listen carefully and provide support", trait: "S", score: 4 },
      { text: "Focus on facts and logical analysis", trait: "C", score: 4 }
    ]
  },
  {
    order: 27,
    questionText: "When facing a deadline, I:",
    statements: [
      { text: "Push to complete early and exceed expectations", trait: "D", score: 4 },
      { text: "Motivate the team to work together efficiently", trait: "I", score: 4 },
      { text: "Work steadily to ensure quality and consistency", trait: "S", score: 4 },
      { text: "Plan carefully to avoid mistakes and ensure accuracy", trait: "C", score: 4 }
    ]
  },
  {
    order: 28,
    questionText: "My approach to feedback is:",
    statements: [
      { text: "I want direct, actionable feedback to improve results", trait: "D", score: 4 },
      { text: "I prefer positive feedback that recognizes my contributions", trait: "I", score: 4 },
      { text: "I value constructive feedback that helps me support others", trait: "S", score: 4 },
      { text: "I appreciate detailed feedback that helps me improve accuracy", trait: "C", score: 4 }
    ]
  }
];

// DISC trait configuration
const DISC_CONFIG = {
  D: {
    name: 'Dominance',
    description: 'Direct, Results-oriented, Strong-willed, Forceful',
    characteristics: ['Competitive', 'Ambitious', 'Decisive', 'Assertive'],
    strengths: ['Takes charge', 'Makes quick decisions', 'Overcomes obstacles', 'Drives results'],
    weaknesses: ['Can be impatient', 'May overlook details', 'Can appear blunt', 'May dominate others'],
    workStyle: 'Prefers challenging assignments, autonomy, and opportunities for advancement'
  },
  I: {
    name: 'Influence',
    description: 'Outgoing, Enthusiastic, Optimistic, High-spirited',
    characteristics: ['Persuasive', 'Sociable', 'Optimistic', 'Energetic'],
    strengths: ['Builds relationships', 'Motivates others', 'Creates enthusiasm', 'Communicates well'],
    weaknesses: ['May lack follow-through', 'Can be disorganized', 'May oversell', 'Can be impulsive'],
    workStyle: 'Prefers collaborative environments, social recognition, and variety in tasks'
  },
  S: {
    name: 'Steadiness',
    description: 'Even-tempered, Accommodating, Patient, Humble',
    characteristics: ['Supportive', 'Reliable', 'Patient', 'Loyal'],
    strengths: ['Listens well', 'Maintains stability', 'Supports team members', 'Follows through'],
    weaknesses: ['Resists change', 'Avoids conflict', 'May be too accommodating', 'Slow to decide'],
    workStyle: 'Prefers stable environments, clear expectations, and opportunities to help others'
  },
  C: {
    name: 'Conscientiousness',
    description: 'Analytical, Reserved, Precise, Systematic',
    characteristics: ['Accurate', 'Systematic', 'Cautious', 'Detail-oriented'],
    strengths: ['Ensures quality', 'Analyzes thoroughly', 'Follows procedures', 'Identifies risks'],
    weaknesses: ['Can be overly critical', 'May overanalyze', 'Can be rigid', 'Slow to decide'],
    workStyle: 'Prefers structured environments, clear standards, and time for careful analysis'
  }
};

module.exports = {
  discQuestions,
  DISC_CONFIG
};
