/**
 * MBTI Scoring Service
 * 
 * Open Extended Jungian Type Scales (OEJTS) Scientific Methodology.
 * 32 questions, 8 per dimension (EI, SN, TF, JP)
 * 
 * Scoring Formula:
 * - Raw Score = Sum of 8 answers per dimension (range: 8-40)
 * - Midpoint threshold: 24
 * - Type: Score > 24 = right preference (E, N, T, P), Score <= 24 = left preference (I, S, F, J)
 * - Percentage: ((rawScore - 8) / 32) * 100
 * - TF is INVERTED: Low raw score = Thinking (T), High raw score = Feeling (F)
 * - Cross-pressure handling for scores near 24 threshold
 */

const { mbtiQuestions, MBTI_CONFIG, TYPE_DESCRIPTIONS } = require('../seeders/mbtiQuestions');

// Questions per dimension
const QUESTIONS_PER_DIMENSION = 8;

// Raw score range
const MIN_RAW_SCORE = 8;
const MAX_RAW_SCORE = 40;
const SCORE_RANGE = MAX_RAW_SCORE - MIN_RAW_SCORE; // 32

// Type determination threshold
const TYPE_THRESHOLD = 24;

// Cross-pressure zone (within this range of the threshold, indicates tension)
const CROSS_PRESSURE_RANGE = 4; // 22-26 range

/**
 * Calculate raw MBTI scores per dimension from responses
 * @param {Array|Object} responses - Array of {order, answer} or object with order as key
 * @returns {Object} Raw scores per dimension {EI, SN, TF, JP}
 */
function calculateMBTIScores(responses) {
  // Initialize raw scores
  const rawScores = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0
  };

  // Count questions per dimension for validation
  const dimensionCounts = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0
  };

  // Process responses
  const responseArray = Array.isArray(responses) ? responses : Object.entries(responses).map(([order, answer]) => ({
    order: parseInt(order),
    answer
  }));

  responseArray.forEach(response => {
    const { order, answer } = response;
    if (order === undefined || answer === undefined) return;

    const question = mbtiQuestions.find(q => q.order === order);
    if (!question) return;

    const score = parseInt(answer);
    if (isNaN(score) || score < 1 || score > 5) {
      throw new Error(`Invalid answer value for question ${order}: ${answer}. Must be 1-5.`);
    }

    const dimension = question.dimension;
    rawScores[dimension] += score;
    dimensionCounts[dimension]++;
  });

  // Validate all questions answered
  Object.entries(dimensionCounts).forEach(([dim, count]) => {
    if (count !== QUESTIONS_PER_DIMENSION) {
      throw new Error(`${dim} dimension has ${count} responses, expected ${QUESTIONS_PER_DIMENSION}`);
    }
  });

  return rawScores;
}

/**
 * Calculate percentages from raw scores
 * Formula: ((rawScore - 8) / 32) * 100
 * @param {Object} rawScores - Raw scores {EI, SN, TF, JP}
 * @returns {Object} Percentages {EI, SN, TF, JP}
 */
function calculatePercentages(rawScores) {
  const percentages = {};

  Object.entries(rawScores).forEach(([dimension, rawScore]) => {
    const percentage = ((rawScore - MIN_RAW_SCORE) / SCORE_RANGE) * 100;
    percentages[dimension] = Math.round(Math.max(0, Math.min(100, percentage)));
  });

  return percentages;
}

/**
 * Determine MBTI type from scores
 * @param {Object} rawScores - Raw scores {EI, SN, TF, JP}
 * @returns {Object} Type information with letter and cross-pressure indicators
 */
function determineMBTIType(rawScores) {
  const type = {
    letters: {
      EI: '',      // E or I
      SN: '',      // S or N
      TF: '',      // T or F
      JP: ''       // J or P
    },
    crossPressure: {
      EI: false,
      SN: false,
      TF: false,
      JP: false
    },
    rawScores: {},
    percentages: {}
  };

  // Process each dimension
  Object.entries(rawScores).forEach(([dimension, rawScore]) => {
    type.rawScores[dimension] = rawScore;
    type.percentages[dimension] = calculatePercentages({ [dimension]: rawScore })[dimension];

    let letter;
    let isCrossPressure = false;

    if (dimension === 'TF') {
      // TF is INVERTED: 
      // Low score (1) = strong LEFT trait = Thinking (T)
      // High score (5) = strong RIGHT trait = Feeling (F)
      // Score 8-24 → LEFT preference = T
      // Score 25-40 → RIGHT preference = F
      if (rawScore <= TYPE_THRESHOLD) {
        letter = 'T'; // Thinking (left preference)
      } else {
        letter = 'F'; // Feeling (right preference)
      }
    } else {
      // Normal dimensions:
      // Low score (1) = strong LEFT trait → LEFT preference (E, S, J)
      // High score (5) = strong RIGHT trait → RIGHT preference (I, N, P)
      if (rawScore <= TYPE_THRESHOLD) {
        // Left preference: E, S, J
        letter = dimension === 'EI' ? 'E' : dimension === 'SN' ? 'S' : 'J';
      } else {
        // Right preference: I, N, P
        letter = dimension === 'EI' ? 'I' : dimension === 'SN' ? 'N' : 'P';
      }
    }

    // Check for cross-pressure (scores near threshold)
    const distanceFromThreshold = Math.abs(rawScore - TYPE_THRESHOLD);
    if (distanceFromThreshold <= CROSS_PRESSURE_RANGE) {
      isCrossPressure = true;
    }

    type.letters[dimension] = letter;
    type.crossPressure[dimension] = isCrossPressure;
  });

  // Build 4-letter type
  type.type = type.letters.EI + type.letters.SN + type.letters.TF + type.letters.JP;
  type.name = TYPE_DESCRIPTIONS[type.type]?.name || 'Unknown';
  type.description = TYPE_DESCRIPTIONS[type.type]?.description || 'Unable to determine personality type';

  // Overall cross-pressure (if any dimension has cross-pressure)
  type.hasCrossPressure = Object.values(type.crossPressure).some(v => v);

  return type;
}

/**
 * Complete MBTI scoring with all metadata
 * @param {Array|Object} responses - Array of {order, answer} or object with order as key
 * @returns {Object} Complete MBTI results
 */
function scoreMBTI(responses) {
  const rawScores = calculateMBTIScores(responses);
  const typeInfo = determineMBTIType(rawScores);
  const percentages = calculatePercentages(rawScores);

  // Build dimension details
  const dimensions = {};
  Object.keys(rawScores).forEach(dim => {
    const config = MBTI_CONFIG[dim];
    dimensions[dim] = {
      rawScore: rawScores[dim],
      percentage: percentages[dim],
      letter: typeInfo.letters[dim],
      crossPressure: typeInfo.crossPressure[dim],
      label: typeInfo.letters[dim] === config.rightLabel.charAt(0) ? config.rightLabel : config.leftLabel,
      ...config
    };
  });

  return {
    type: typeInfo.type,
    name: typeInfo.name,
    description: typeInfo.description,
    rawScores,
    percentages,
    dimensions,
    crossPressure: typeInfo.crossPressure,
    hasCrossPressure: typeInfo.hasCrossPressure,
    interpretation: generateInterpretation(typeInfo, dimensions),
    cognitiveFunctions: generateCognitiveFunctions(typeInfo.type)
  };
}

/**
 * Generate interpretation based on results
 */
function generateInterpretation(typeInfo, dimensions) {
  const interpretations = [];

  // Add dimension interpretations
  Object.entries(dimensions).forEach(([dim, data]) => {
    const prefix = typeInfo.crossPressure[dim] 
      ? `${data.label} (with ${dim} tension)` 
      : data.label;
    interpretations.push(`${dim}: ${prefix} (${data.percentage}%)`);
  });

  return interpretations.join(' | ');
}

/**
 * Generate cognitive functions based on MBTI type
 * @param {String} type - 4-letter MBTI type
 * @returns {Array} Array of cognitive functions
 */
function generateCognitiveFunctions(type) {
  const cognitiveFunctionStacks = {
    ISTJ: ['Si', 'Te', 'Ni', 'Fe', 'Se', 'Ti', 'Ne', 'Fi'],
    ISFJ: ['Si', 'Fe', 'Ni', 'Te', 'Se', 'Fi', 'Ne', 'Ti'],
    INFJ: ['Ni', 'Fe', 'Ti', 'Se', 'Ne', 'Fi', 'Te', 'Si'],
    INTJ: ['Ni', 'Te', 'Fi', 'Se', 'Ne', 'Ti', 'Fe', 'Si'],
    ISTP: ['Ti', 'Se', 'Ni', 'Fe', 'Te', 'Si', 'Ne', 'Fi'],
    ISFP: ['Fi', 'Se', 'Ni', 'Te', 'Fe', 'Si', 'Ne', 'Ti'],
    INFP: ['Ne', 'Fi', 'Te', 'Si', 'Ni', 'Fe', 'Ti', 'Se'],
    INTP: ['Ti', 'Ne', 'Si', 'Fe', 'Te', 'Ni', 'Se', 'Fi'],
    ESTP: ['Se', 'Ti', 'Fe', 'Ni', 'Si', 'Te', 'Ne', 'Fi'],
    ESFP: ['Se', 'Fi', 'Te', 'Ni', 'Si', 'Fe', 'Ne', 'Ti'],
    ENFP: ['Ne', 'Fi', 'Te', 'Si', 'Ni', 'Fe', 'Ti', 'Se'],
    ENTP: ['Ne', 'Ti', 'Fe', 'Si', 'Te', 'Ni', 'Se', 'Fi'],
    ENFJ: ['Fe', 'Ni', 'Se', 'Ti', 'Ne', 'Fi', 'Si', 'Te'],
    ESTJ: ['Te', 'Si', 'Ne', 'Fi', 'Ti', 'Se', 'Ni', 'Fe'],
    ESFJ: ['Fe', 'Si', 'Ne', 'Ti', 'Se', 'Ni', 'Fi', 'Te'],
    ENTJ: ['Te', 'Ni', 'Se', 'Fi', 'Ti', 'Ne', 'Si', 'Fe']
  };

  return cognitiveFunctionStacks[type] || [];
}

/**
 * Get score interpretation (low, moderate, high)
 * @param {Number} percentage - Score percentage
 * @returns {String} Interpretation level
 */
function getScoreLevel(percentage) {
  if (percentage <= 30) return 'Low';
  if (percentage <= 70) return 'Moderate';
  return 'High';
}

/**
 * Calculate dimension preference strength
 * @param {Number} rawScore - Raw score for dimension
 * @param {Boolean} isInverted - Whether dimension is inverted (TF)
 * @returns {Object} Strength information
 */
function calculatePreferenceStrength(rawScore, isInverted = false) {
  const distance = Math.abs(rawScore - TYPE_THRESHOLD);
  let direction;
  
  if (isInverted) {
    // TF: low = T, high = F
    direction = rawScore > TYPE_THRESHOLD ? 'F' : 'T';
  } else {
    direction = rawScore > TYPE_THRESHOLD ? 'R' : 'L'; // R = Right preference, L = Left preference
  }

  let strength;
  if (distance <= CROSS_PRESSURE_RANGE) {
    strength = 'Moderate';
  } else if (distance <= 8) {
    strength = 'Clear';
  } else {
    strength = 'Strong';
  }

  return {
    direction,
    strength,
    distanceFromThreshold: distance,
    isCrossPressure: distance <= CROSS_PRESSURE_RANGE
  };
}

module.exports = {
  calculateMBTIScores,
  calculatePercentages,
  determineMBTIType,
  scoreMBTI,
  calculatePreferenceStrength,
  getScoreLevel,
  generateCognitiveFunctions,
  QUESTIONS_PER_DIMENSION,
  MIN_RAW_SCORE,
  MAX_RAW_SCORE,
  TYPE_THRESHOLD,
  CROSS_PRESSURE_RANGE
};