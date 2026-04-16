/**
 * Hogan Personality Inventory (HPI) - 50 True/False Questions
 * 
 * The HPI measures normal personality characteristics relevant to workplace performance.
 * Uses True/False format where users respond True or False to self-descriptive statements.
 * 
 * 7 Primary Scales:
 * 1. Adjustment - Emotional stability, stress management, self-acceptance
 * 2. Ambition - Leadership drive, competitiveness, desire for achievement
 * 3. Sociability - Social interaction needs, extraversion
 * 4. Interpersonal Sensitivity - Tact, empathy, ability to relate to others
 * 5. Prudence - Conscientiousness, self-discipline, dependability
 * 6. Inquisitive - Creativity, intellectual curiosity, openness to ideas
 * 7. Learning Approach - Educational preferences, desire for knowledge
 */

const hoganQuestions = [
  { order: 1, questionText: "I generally remain calm even when facing difficult situations.", correctAnswer: true, scale: "Adjustment", keyed: "positive" },
  { order: 2, questionText: "I tend to worry about things that might go wrong.", correctAnswer: false, scale: "Adjustment", keyed: "negative" },
  { order: 3, questionText: "I am comfortable with who I am as a person.", correctAnswer: true, scale: "Adjustment", keyed: "positive" },
  { order: 4, questionText: "I often feel nervous or anxious about upcoming events.", correctAnswer: false, scale: "Adjustment", keyed: "negative" },
  { order: 5, questionText: "I maintain a positive outlook even when things don't go as planned.", correctAnswer: true, scale: "Adjustment", keyed: "positive" },
  { order: 6, questionText: "I get easily upset when things don't go my way.", correctAnswer: false, scale: "Adjustment", keyed: "negative" },
  { order: 7, questionText: "I handle criticism without taking it personally.", correctAnswer: true, scale: "Adjustment", keyed: "positive" },

  { order: 8, questionText: "I am driven to achieve my goals and succeed in my career.", correctAnswer: true, scale: "Ambition", keyed: "positive" },
  { order: 9, questionText: "I prefer to stay in my comfort zone rather than take risks.", correctAnswer: false, scale: "Ambition", keyed: "negative" },
  { order: 10, questionText: "I actively seek opportunities to take on leadership responsibilities.", correctAnswer: true, scale: "Ambition", keyed: "positive" },
  { order: 11, questionText: "I am content with maintaining the status quo.", correctAnswer: false, scale: "Ambition", keyed: "negative" },
  { order: 12, questionText: "I enjoy competitive environments where performance is measured.", correctAnswer: true, scale: "Ambition", keyed: "positive" },
  { order: 13, questionText: "I avoid situations where I have to prove myself to others.", correctAnswer: false, scale: "Ambition", keyed: "negative" },
  { order: 14, questionText: "I am always looking for ways to advance my career.", correctAnswer: true, scale: "Ambition", keyed: "positive" },

  { order: 15, questionText: "I enjoy meeting new people and making new friends.", correctAnswer: true, scale: "Sociability", keyed: "positive" },
  { order: 16, questionText: "I prefer working alone rather than in a team.", correctAnswer: false, scale: "Sociability", keyed: "negative" },
  { order: 17, questionText: "I feel energized when interacting with others.", correctAnswer: true, scale: "Sociability", keyed: "positive" },
  { order: 18, questionText: "I prefer to keep a low profile in social situations.", correctAnswer: false, scale: "Sociability", keyed: "negative" },
  { order: 19, questionText: "I like being the center of attention at social gatherings.", correctAnswer: true, scale: "Sociability", keyed: "positive" },
  { order: 20, questionText: "I find large social events draining.", correctAnswer: false, scale: "Sociability", keyed: "negative" },
  { order: 21, questionText: "I frequently reach out to friends and colleagues just to catch up.", correctAnswer: true, scale: "Sociability", keyed: "positive" },

  { order: 22, questionText: "I am sensitive to the feelings and needs of others.", correctAnswer: true, scale: "InterpersonalSensitivity", keyed: "positive" },
  { order: 23, questionText: "I sometimes say things without considering how others might feel.", correctAnswer: false, scale: "InterpersonalSensitivity", keyed: "negative" },
  { order: 24, questionText: "I am skilled at reading people and understanding their motivations.", correctAnswer: true, scale: "InterpersonalSensitivity", keyed: "positive" },
  { order: 25, questionText: "I tend to be blunt and straightforward even when it might hurt feelings.", correctAnswer: false, scale: "InterpersonalSensitivity", keyed: "negative" },
  { order: 26, questionText: "I can adapt my communication style to work with different types of people.", correctAnswer: true, scale: "InterpersonalSensitivity", keyed: "positive" },
  { order: 27, questionText: "I find it difficult to understand why people react emotionally to situations.", correctAnswer: false, scale: "InterpersonalSensitivity", keyed: "negative" },
  { order: 28, questionText: "I make an effort to consider others' perspectives before making decisions.", correctAnswer: true, scale: "InterpersonalSensitivity", keyed: "positive" },

  { order: 29, questionText: "I am very organized and keep my work area tidy.", correctAnswer: true, scale: "Prudence", keyed: "positive" },
  { order: 30, questionText: "I sometimes make careless mistakes in my work.", correctAnswer: false, scale: "Prudence", keyed: "negative" },
  { order: 31, questionText: "I always meet deadlines and keep my promises.", correctAnswer: true, scale: "Prudence", keyed: "positive" },
  { order: 32, questionText: "I prefer to take shortcuts when completing tasks.", correctAnswer: false, scale: "Prudence", keyed: "negative" },
  { order: 33, questionText: "I follow rules and procedures consistently.", correctAnswer: true, scale: "Prudence", keyed: "positive" },
  { order: 34, questionText: "I sometimes act impulsively without thinking through the consequences.", correctAnswer: false, scale: "Prudence", keyed: "negative" },
  { order: 35, questionText: "I plan ahead and think carefully before making important decisions.", correctAnswer: true, scale: "Prudence", keyed: "positive" },

  { order: 36, questionText: "I enjoy exploring new ideas and ways of doing things.", correctAnswer: true, scale: "Inquisitive", keyed: "positive" },
  { order: 37, questionText: "I prefer familiar methods over trying new approaches.", correctAnswer: false, scale: "Inquisitive", keyed: "negative" },
  { order: 38, questionText: "I am curious about how things work and enjoy learning new skills.", correctAnswer: true, scale: "Inquisitive", keyed: "positive" },
  { order: 39, questionText: "I prefer practical knowledge over theoretical understanding.", correctAnswer: false, scale: "Inquisitive", keyed: "negative" },
  { order: 40, questionText: "I enjoy intellectual discussions and debating ideas.", correctAnswer: true, scale: "Inquisitive", keyed: "positive" },
  { order: 41, questionText: "I find abstract thinking to be a waste of time.", correctAnswer: false, scale: "Inquisitive", keyed: "negative" },
  { order: 42, questionText: "I often question conventional wisdom and look for better solutions.", correctAnswer: true, scale: "Inquisitive", keyed: "positive" },
  { order: 43, questionText: "I prefer concrete, practical solutions over theoretical ideas.", correctAnswer: false, scale: "Inquisitive", keyed: "negative" },

  { order: 44, questionText: "I enjoy reading and learning new things in my free time.", correctAnswer: true, scale: "LearningApproach", keyed: "positive" },
  { order: 45, questionText: "I prefer hands-on learning over reading about concepts.", correctAnswer: false, scale: "LearningApproach", keyed: "negative" },
  { order: 46, questionText: "I am committed to continuous self-improvement through education.", correctAnswer: true, scale: "LearningApproach", keyed: "positive" },
  { order: 47, questionText: "I feel that formal education is overrated.", correctAnswer: false, scale: "LearningApproach", keyed: "negative" },
  { order: 48, questionText: "I actively seek out educational resources to expand my knowledge.", correctAnswer: true, scale: "LearningApproach", keyed: "positive" },
  { order: 49, questionText: "I prefer to learn from experience rather than formal training.", correctAnswer: false, scale: "LearningApproach", keyed: "negative" },
  { order: 50, questionText: "I believe that learning is essential for personal and professional growth.", correctAnswer: true, scale: "LearningApproach", keyed: "positive" }
];

const HOGAN_CONFIG = {
  Adjustment: {
    name: 'Adjustment',
    description: 'Emotional stability, stress management, self-acceptance',
    highCharacteristics: ['Calm', 'Self-accepting', 'Resilient', 'Even-tempered', 'Composed under pressure'],
    lowCharacteristics: ['Anxious', 'Self-critical', 'Moody', 'Complaining', 'Stress-prone'],
    strengths: ['Handles stress well', 'Maintains composure', 'Accepts feedback gracefully', 'Stays calm under pressure'],
    weaknesses: ['Can be overly critical of self', 'May dismiss concerns of others', 'May appear indifferent to problems']
  },
  Ambition: {
    name: 'Ambition',
    description: 'Leadership drive, competitiveness, desire for achievement',
    highCharacteristics: ['Driven', 'Competitive', 'Goal-oriented', 'Leadership-minded', 'Self-promoting'],
    lowCharacteristics: ['Unaggressive', 'Content', 'Modest', 'Uncompetitive', 'Passive'],
    strengths: ['Drives results', 'Takes initiative', 'Seeks advancement opportunities', 'Motivates others'],
    weaknesses: ['Can be overly competitive', 'May step on others to succeed', 'Can appear arrogant', 'Impatient with slower progress']
  },
  Sociability: {
    name: 'Sociability',
    description: 'Social interaction needs, extraversion, friendliness',
    highCharacteristics: ['Outgoing', 'Talkative', 'Friendly', 'Enthusiastic', 'Socially confident'],
    lowCharacteristics: ['Reserved', 'Quiet', 'Private', 'Thoughtful', 'Independent'],
    strengths: ['Builds relationships easily', 'Creates positive atmosphere', 'Networks effectively', 'Collaborates well'],
    weaknesses: ['May avoid difficult conversations', 'Can be distracted by social opportunities', 'May not work well alone']
  },
  InterpersonalSensitivity: {
    name: 'Interpersonal Sensitivity',
    description: 'Tact, empathy, ability to relate to and influence others',
    highCharacteristics: ['Diplomatic', 'Empathetic', 'Perceptive', 'Tactful', 'Socially aware'],
    lowCharacteristics: ['Blunt', 'Direct', 'Insensitive', 'Tactless', 'Poor reader of others'],
    strengths: ['Navigates office politics well', 'Builds consensus', 'Manages difficult situations diplomatically'],
    weaknesses: ['May avoid giving honest feedback', 'Can be seen as too political', 'May struggle with direct confrontation']
  },
  Prudence: {
    name: 'Prudence',
    description: 'Conscientiousness, self-discipline, dependability, rule-following',
    highCharacteristics: ['Organized', 'Reliable', 'Methodical', 'Careful', 'Responsible'],
    lowCharacteristics: ['Impulsive', 'Careless', 'Flexible', 'Spontaneous', 'Risk-taking'],
    strengths: ['Ensures quality work', 'Follows through on commitments', 'Manages risk effectively', 'Creates reliable processes'],
    weaknesses: ['Can be overly rigid', 'May micromanage', 'Difficulty adapting to change', 'Perfectionist tendencies']
  },
  Inquisitive: {
    name: 'Inquisitive',
    description: 'Creativity, intellectual curiosity, openness to ideas',
    highCharacteristics: ['Curious', 'Creative', 'Imaginative', 'Intellectually curious', 'Open-minded'],
    lowCharacteristics: ['Practical', 'Focused', 'Concrete', 'Traditional', 'Grounded'],
    strengths: ['Generates innovative ideas', 'Embraces change', 'Solves complex problems', 'Explores new possibilities'],
    weaknesses: ['May appear unfocused', 'Can be impractical', 'May neglect routine tasks', 'Too much analysis']
  },
  LearningApproach: {
    name: 'Learning Approach',
    description: 'Educational preferences, desire for knowledge, intellectual development',
    highCharacteristics: ['Scholarly', 'Knowledge-seeking', 'Intellectually engaged', 'Self-educating', 'Curious learner'],
    lowCharacteristics: ['Pragmatic', 'Experience-focused', 'Action-oriented', 'Hands-on', 'Practical'],
    strengths: ['Quick learner', 'Adapts to new technologies', 'Values professional development', 'Stays current in field'],
    weaknesses: ['May over-learn topics', 'Can be theoretical rather than practical', 'May delay action for more study']
  }
};

module.exports = {
  hoganQuestions,
  HOGAN_CONFIG
};
