/**
 * DISC Scoring Service
 * 
 * Professional DISC Assessment Scoring Logic (Forced-Choice Format):
 * - 28 questions total (professional standard)
 * - Each question has 4 statements (D, I, S, C)
 * - Respondent selects MOST like me and LEAST like me only
 * - Scoring: MOST selection = +1, LEAST selection = -1
 * - Raw scores can range from -28 to +28 per dimension
 * - Normalized scores: Add constant to make all positive (0 to 56)
 * - Percentile scores: (Normalized Score / 56) * 100
 * - Profile pattern: Based on highest scores and combinations
 */

const { DISC_CONFIG } = require('../seeders/discQuestions');

// Professional DISC standard: 28 questions
const TOTAL_QUESTIONS = 28;

/**
 * Calculate DISC scores from responses using professional forced-choice format
 * @param {Array} responses - Array of question responses (MOST/LEAST selections)
 * @param {Number} totalQuestionsCount - Optional. Actual number of questions (defaults to 28)
 * @returns {Object} DISC scores and analysis
 */
function calculateDISCScores(responses, totalQuestionsCount = TOTAL_QUESTIONS) {
  // Initialize raw scores (can be negative with forced-choice format)
  const rawScores = {
    D: 0,
    I: 0,
    S: 0,
    C: 0
  };

  // Calculate raw scores using MOST (+1) / LEAST (-1) scoring
  responses.forEach(response => {
    if (response.answers && Array.isArray(response.answers)) {
      response.answers.forEach(answer => {
        const trait = answer.trait;
        const score = parseInt(answer.score) || 0; // +1 for MOST, -1 for LEAST
        if (rawScores.hasOwnProperty(trait)) {
          rawScores[trait] += score;
        }
      });
    }
  });

  // Normalize scores to positive scale
  // With N questions: raw scores range from -N to +N
  // Add totalQuestionsCount to shift to 0 to 2*N range
  const normalizedScores = {
    D: rawScores.D + totalQuestionsCount,
    I: rawScores.I + totalQuestionsCount,
    S: rawScores.S + totalQuestionsCount,
    C: rawScores.C + totalQuestionsCount
  };

  // Calculate percentages (max normalized is 2 * totalQuestionsCount)
  const maxNormalized = totalQuestionsCount * 2;
  const percentages = {
    D: maxNormalized > 0 ? Math.round((normalizedScores.D / maxNormalized) * 100) : 0,
    I: maxNormalized > 0 ? Math.round((normalizedScores.I / maxNormalized) * 100) : 0,
    S: maxNormalized > 0 ? Math.round((normalizedScores.S / maxNormalized) * 100) : 0,
    C: maxNormalized > 0 ? Math.round((normalizedScores.C / maxNormalized) * 100) : 0
  };

  // Determine dominant trait(s)
  const sortedTraits = Object.entries(percentages)
    .sort((a, b) => b[1] - a[1]);
  
  const dominant = sortedTraits[0][0];
  const secondary = sortedTraits[1][0];
  
  // Determine profile pattern
  const pattern = determinePattern(percentages, dominant, secondary);

  // Generate analysis
  const analysis = generateAnalysis(percentages, dominant, secondary);

  return {
    rawScores,
    normalizedScores,
    percentages,
    dominant,
    secondary,
    pattern,
    analysis,
    dimensions: {
      D: {
        rawScore: rawScores.D,
        score: normalizedScores.D,
        percentage: percentages.D,
        ...DISC_CONFIG.D
      },
      I: {
        rawScore: rawScores.I,
        score: normalizedScores.I,
        percentage: percentages.I,
        ...DISC_CONFIG.I
      },
      S: {
        rawScore: rawScores.S,
        score: normalizedScores.S,
        percentage: percentages.S,
        ...DISC_CONFIG.S
      },
      C: {
        rawScore: rawScores.C,
        score: normalizedScores.C,
        percentage: percentages.C,
        ...DISC_CONFIG.C
      }
    }
  };
}

/**
 * Determine DISC profile pattern
 */
function determinePattern(percentages, dominant, secondary) {
  const patterns = {
    'DI': 'Achiever - Results-driven with strong people skills',
    'DS': 'Developer - Results-oriented with supportive approach',
    'DC': 'Perfectionist - Results-focused with attention to detail',
    'ID': 'Persuader - Enthusiastic leader who drives results',
    'IS': 'Inspirer - Motivating and supportive team player',
    'IC': 'Evaluator - Enthusiastic with analytical approach',
    'SD': 'Specialist - Supportive with results focus',
    'SI': 'Counselor - Supportive and enthusiastic collaborator',
    'SC': 'Planner - Supportive with systematic approach',
    'CD': 'Objective Thinker - Analytical with results orientation',
    'CI': 'Analyst - Analytical with strong communication',
    'CS': 'Implementer - Systematic and supportive worker'
  };

  const key = dominant + secondary;
  return patterns[key] || `${DISC_CONFIG[dominant].name} Dominant`;
}

/**
 * Generate comprehensive analysis
 */
function generateAnalysis(percentages, dominant, secondary) {
  const dominantConfig = DISC_CONFIG[dominant];
  const secondaryConfig = DISC_CONFIG[secondary];
  
  // Generate summary
  const summary = `Your DISC profile shows ${dominantConfig.name} as your dominant style with ${secondaryConfig.name} as your secondary style. ` +
    `You are naturally ${dominantConfig.description.toLowerCase()}. ` +
    `Your approach combines ${dominantConfig.characteristics.slice(0, 2).join(' and ')} with ${secondaryConfig.characteristics.slice(0, 2).join(' and ')}.`;

  // Determine strengths
  const strengths = [
    ...dominantConfig.strengths.slice(0, 2),
    ...secondaryConfig.strengths.slice(0, 1)
  ];

  // Determine development areas
  const developmentAreas = [
    ...dominantConfig.weaknesses.slice(0, 1),
    ...secondaryConfig.weaknesses.slice(0, 1)
  ];

  // Generate recommendations
  const recommendations = generateRecommendations(dominant, secondary);

  // Work style description
  const workStyle = `In professional settings, you ${dominantConfig.workStyle.toLowerCase()}. ` +
    `You work best when ${getWorkEnvironment(dominant, secondary)}.`;

  // Communication style
  const communicationStyle = getCommunicationStyle(dominant, secondary);

  // Leadership style
  const leadershipStyle = getLeadershipStyle(dominant, secondary);

  return {
    summary,
    strengths,
    developmentAreas,
    recommendations,
    workStyle,
    communicationStyle,
    leadershipStyle
  };
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(dominant, secondary) {
  const recommendations = {
    D: [
      'Practice patience with team members who need more time',
      'Listen to input before making decisions',
      'Recognize and appreciate others\' contributions'
    ],
    I: [
      'Focus on follow-through and completion',
      'Pay attention to details and accuracy',
      'Allow time for quiet reflection'
    ],
    S: [
      'Be more open to change and new approaches',
      'Speak up when you disagree',
      'Set more ambitious personal goals'
    ],
    C: [
      'Make decisions with incomplete information',
      'Share your ideas even if not perfect',
      'Be more flexible with rules when appropriate'
    ]
  };

  return [
    ...recommendations[dominant].slice(0, 2),
    ...recommendations[secondary].slice(0, 1)
  ];
}

/**
 * Get work environment preferences
 */
function getWorkEnvironment(dominant, secondary) {
  const environments = {
    D: 'given autonomy and challenging goals',
    I: 'there is social interaction and recognition',
    S: 'there is stability and clear expectations',
    C: 'there are clear standards and quality processes'
  };

  return `${environments[dominant]} and ${environments[secondary]}`;
}

/**
 * Get communication style description
 */
function getCommunicationStyle(dominant, secondary) {
  const styles = {
    D: 'direct and to the point',
    I: 'expressive and engaging',
    S: 'patient and supportive',
    C: 'precise and detailed'
  };

  return {
    style: `You communicate ${styles[dominant]}, often using ${styles[secondary]} approaches when needed.`,
    preferences: {
      likes: getCommunicationPreferences(dominant, 'likes'),
      dislikes: getCommunicationPreferences(dominant, 'dislikes')
    }
  };
}

/**
 * Get communication preferences
 */
function getCommunicationPreferences(trait, type) {
  const preferences = {
    D: {
      likes: ['Brief, focused conversations', 'Clear action items', 'Direct feedback'],
      dislikes: ['Long explanations', 'Emotional discussions', 'Vague instructions']
    },
    I: {
      likes: ['Social interaction', 'Brainstorming sessions', 'Positive reinforcement'],
      dislikes: ['Isolation', 'Negative criticism', 'Rigid structure']
    },
    S: {
      likes: ['One-on-one conversations', 'Time to process', 'Harmonious discussions'],
      dislikes: ['Sudden changes', 'Confrontation', 'Rushed decisions']
    },
    C: {
      likes: ['Detailed information', 'Written communication', 'Logical arguments'],
      dislikes: ['Errors or inaccuracies', 'Emotional appeals', 'Disorganization']
    }
  };

  return preferences[trait][type];
}

/**
 * Get leadership style description
 */
function getLeadershipStyle(dominant, secondary) {
  const styles = {
    D: 'directive and results-focused',
    I: 'inspirational and people-oriented',
    S: 'supportive and team-focused',
    C: 'analytical and process-oriented'
  };

  return {
    style: `As a leader, you tend to be ${styles[dominant]}, incorporating ${styles[secondary]} elements.`,
    approach: getLeadershipApproach(dominant),
    teamImpact: getTeamImpact(dominant, secondary)
  };
}

/**
 * Get leadership approach
 */
function getLeadershipApproach(trait) {
  const approaches = {
    D: 'You set ambitious goals and drive the team toward results.',
    I: 'You motivate through enthusiasm and build strong relationships.',
    S: 'You create stability and develop team members\' potential.',
    C: 'You ensure quality and establish efficient systems.'
  };

  return approaches[trait];
}

/**
 * Get team impact description
 */
function getTeamImpact(dominant, secondary) {
  const impacts = {
    D: 'pushes the team to achieve challenging targets',
    I: 'keeps morale high and encourages collaboration',
    S: 'maintains harmony and supports team members',
    C: 'ensures accuracy and follows best practices'
  };

  return `Your team benefits when you ${impacts[dominant]} while also ${impacts[secondary]}.`;
}

/**
 * Generate narrative report
 */
function generateNarrativeReport(discResults) {
  const { percentages, dominant, secondary, pattern, analysis } = discResults;
  
  return {
    title: `DISC Profile: ${pattern}`,
    overview: analysis.summary,
    scores: {
      D: { value: percentages.D, label: 'Dominance', level: getScoreLevel(percentages.D) },
      I: { value: percentages.I, label: 'Influence', level: getScoreLevel(percentages.I) },
      S: { value: percentages.S, label: 'Steadiness', level: getScoreLevel(percentages.S) },
      C: { value: percentages.C, label: 'Conscientiousness', level: getScoreLevel(percentages.C) }
    },
    dominantStyle: {
      trait: dominant,
      name: DISC_CONFIG[dominant].name,
      description: DISC_CONFIG[dominant].description,
      characteristics: DISC_CONFIG[dominant].characteristics
    },
    secondaryStyle: {
      trait: secondary,
      name: DISC_CONFIG[secondary].name,
      description: DISC_CONFIG[secondary].description
    },
    analysis,
    careerInsights: generateCareerInsights(dominant, secondary),
    teamDynamics: generateTeamDynamics(dominant, secondary)
  };
}

/**
 * Get score level
 */
function getScoreLevel(percentage) {
  if (percentage >= 75) return 'High';
  if (percentage >= 50) return 'Moderate-High';
  if (percentage >= 25) return 'Moderate';
  return 'Low';
}

/**
 * Generate career insights
 */
function generateCareerInsights(dominant, secondary) {
  const careers = {
    D: ['Executive Leadership', 'Sales Management', 'Entrepreneurship', 'Project Management'],
    I: ['Marketing', 'Public Relations', 'Human Resources', 'Training & Development'],
    S: ['Customer Service', 'Healthcare', 'Education', 'Administrative Support'],
    C: ['Accounting', 'Engineering', 'Quality Assurance', 'Research & Analysis']
  };

  return {
    bestFit: [...careers[dominant].slice(0, 2), ...careers[secondary].slice(0, 2)],
    workEnvironment: getWorkEnvironment(dominant, secondary)
  };
}

/**
 * Generate team dynamics insights
 */
function generateTeamDynamics(dominant, secondary) {
  return {
    contribution: `You contribute to teams by ${DISC_CONFIG[dominant].strengths[0].toLowerCase()} and ${DISC_CONFIG[secondary].strengths[0].toLowerCase()}.`,
    collaboration: `Work best with team members who complement your ${DISC_CONFIG[dominant].name} style with their own strengths.`,
    potentialConflicts: `May experience tension with those who are ${getOppositeTrait(dominant).toLowerCase()}.`,
    idealPartners: `Partner well with those strong in ${getComplementaryTrait(dominant)} and ${getComplementaryTrait(secondary)}.`
  };
}

/**
 * Get opposite trait
 */
function getOppositeTrait(trait) {
  const opposites = {
    D: 'overly cautious or resistant to change',
    I: 'isolated or overly analytical',
    S: 'aggressive or impatient',
    C: 'disorganized or impulsive'
  };
  return opposites[trait];
}

/**
 * Get complementary trait
 */
function getComplementaryTrait(trait) {
  const complementary = {
    D: 'S (Steadiness)',
    I: 'C (Conscientiousness)',
    S: 'D (Dominance)',
    C: 'I (Influence)'
  };
  return complementary[trait];
}

module.exports = {
  calculateDISCScores,
  generateNarrativeReport,
  DISC_CONFIG
};
