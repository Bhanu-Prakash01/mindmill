/**
 * Big Five Personality Test (BFPT) Scoring Service
 * Official 50-question structure with standardized scoring formulas
 * 
 * Trait Structure:
 * - Extraversion (E): Base 20
 * - Agreeableness (A): Base 14
 * - Conscientiousness (C): Base 14
 * - Neuroticism (N): Base 38
 * - Openness (O): Base 8
 * 
 * Final standardized range: 0-40 for each trait
 */

/**
 * Generic trait computation function
 * @param {Object} responses - Object with question numbers as keys (1-50) and values (1-5)
 * @param {Number} base - Base score for the trait
 * @param {Array} addList - Array of question numbers to add
 * @param {Array} subtractList - Array of question numbers to subtract
 * @returns {Number} Raw trait score
 */
function computeTrait(responses, base, addList, subtractList) {
  let score = base;

  addList.forEach(q => {
    const responseValue = responses[q];
    if (responseValue === undefined || responseValue === null) {
      throw new Error(`Missing response for question ${q}`);
    }
    score += responseValue;
  });

  subtractList.forEach(q => {
    const responseValue = responses[q];
    if (responseValue === undefined || responseValue === null) {
      throw new Error(`Missing response for question ${q}`);
    }
    score -= responseValue;
  });

  return score;
}

/**
 * Calculate all Big5 trait scores
 * @param {Object} responses - Object with question numbers as keys (1-50) and values (1-5)
 * @returns {Object} Object containing all trait scores
 */
function calculateBig5(responses) {
  // Validate all 50 questions are answered
  for (let i = 1; i <= 50; i++) {
    if (responses[i] === undefined || responses[i] === null) {
      throw new Error(`Question ${i} is not answered`);
    }
    if (!Number.isInteger(responses[i]) || responses[i] < 1 || responses[i] > 5) {
      throw new Error(`Question ${i} has invalid value: ${responses[i]}. Must be integer 1-5.`);
    }
  }

  // Calculate raw scores using official formulas
  const scores = {
    E: computeTrait(responses, 20, [1, 11, 21, 31, 41], [6, 16, 26, 36, 46]),
    A: computeTrait(responses, 14, [7, 17, 27, 37, 42, 47], [2, 12, 22, 32]),
    C: computeTrait(responses, 14, [3, 13, 23, 33, 43, 48], [8, 18, 28, 38]),
    N: computeTrait(responses, 38, [9, 19], [4, 14, 24, 29, 34, 39, 44, 49]),
    O: computeTrait(responses, 8, [5, 15, 25, 35, 40, 45, 50], [10, 20, 30])
  };

  return scores;
}

/**
 * Get trait level classification
 * @param {Number} score - Raw trait score (0-40)
 * @returns {String} Level: 'Low', 'Moderate', or 'High'
 */
function getTraitLevel(score) {
  if (score <= 13) return 'Low';
  if (score <= 26) return 'Moderate';
  return 'High';
}

/**
 * Normalize score to percentage (0-100)
 * @param {Number} score - Raw trait score (0-40)
 * @returns {Number} Percentage (0-100)
 */
function normalizeToPercent(score) {
  return Math.round((score / 40) * 100);
}

/**
 * Complete Big5 scoring with all metadata
 * @param {Object} responses - Object with question numbers as keys (1-50) and values (1-5)
 * @returns {Object} Complete Big5 results with scores, percentages, and levels
 */
function scoreBig5(responses) {
  const scores = calculateBig5(responses);

  return {
    E: {
      score: scores.E,
      percent: normalizeToPercent(scores.E),
      level: getTraitLevel(scores.E)
    },
    A: {
      score: scores.A,
      percent: normalizeToPercent(scores.A),
      level: getTraitLevel(scores.A)
    },
    C: {
      score: scores.C,
      percent: normalizeToPercent(scores.C),
      level: getTraitLevel(scores.C)
    },
    N: {
      score: scores.N,
      percent: normalizeToPercent(scores.N),
      level: getTraitLevel(scores.N)
    },
    O: {
      score: scores.O,
      percent: normalizeToPercent(scores.O),
      level: getTraitLevel(scores.O)
    }
  };
}

/**
 * Generate narrative summary based on Big5 results
 * @param {Object} results - Big5 results object
 * @returns {String} Narrative summary
 */
function generateNarrative(results) {
  const traits = [];
  
  if (results.E.level === 'High') traits.push('outgoing and energetic');
  else if (results.E.level === 'Low') traits.push('reserved and reflective');
  
  if (results.A.level === 'High') traits.push('friendly and compassionate');
  else if (results.A.level === 'Low') traits.push('challenging and detached');
  
  if (results.C.level === 'High') traits.push('organized and dependable');
  else if (results.C.level === 'Low') traits.push('spontaneous and flexible');
  
  if (results.N.level === 'High') traits.push('emotionally sensitive');
  else if (results.N.level === 'Low') traits.push('emotionally stable');
  
  if (results.O.level === 'High') traits.push('curious and creative');
  else if (results.O.level === 'Low') traits.push('practical and traditional');

  if (traits.length === 0) {
    return 'Your personality profile shows a balanced mix of traits across all dimensions.';
  }

  return `Your personality profile indicates you tend to be ${traits.join(', ')}.`;
}

/**
 * Get dominant traits (highest scores)
 * @param {Object} results - Big5 results object
 * @param {Number} count - Number of top traits to return
 * @returns {Array} Array of trait codes
 */
function getDominantTraits(results, count = 2) {
  return Object.entries(results)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, count)
    .map(([trait]) => trait);
}

/**
 * Get trait descriptions
 * @param {String} trait - Trait code (E, A, C, N, O)
 * @returns {Object} Trait description
 */
function getTraitDescription(trait) {
  const descriptions = {
    E: {
      name: 'Extraversion',
      fullName: 'Extraversion vs. Introversion',
      description: 'Energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others.',
      high: 'Outgoing, energetic, talkative, enjoys being the center of attention',
      low: 'Reserved, reflective, prefers solitude, quiet and deliberate'
    },
    A: {
      name: 'Agreeableness',
      fullName: 'Agreeableness vs. Antagonism',
      description: 'A tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.',
      high: 'Friendly, compassionate, cooperative, values harmony',
      low: 'Challenging, detached, competitive, values self-interest'
    },
    C: {
      name: 'Conscientiousness',
      fullName: 'Conscientiousness vs. Lack of Direction',
      description: 'A tendency to show self-discipline, act dutifully, and aim for achievement against measures or outside expectations.',
      high: 'Organized, dependable, disciplined, goal-oriented',
      low: 'Spontaneous, flexible, prefers variety over routine'
    },
    N: {
      name: 'Neuroticism',
      fullName: 'Neuroticism vs. Emotional Stability',
      description: 'The tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.',
      high: 'Emotionally sensitive, reactive to stress, prone to worry',
      low: 'Emotionally stable, calm, resilient under pressure'
    },
    O: {
      name: 'Openness',
      fullName: 'Openness to Experience vs. Closedness',
      description: 'Appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.',
      high: 'Curious, creative, appreciates novelty and complexity',
      low: 'Practical, traditional, prefers familiarity and routine'
    }
  };

  return descriptions[trait];
}

module.exports = {
  computeTrait,
  calculateBig5,
  getTraitLevel,
  normalizeToPercent,
  scoreBig5,
  generateNarrative,
  getDominantTraits,
  getTraitDescription
};
