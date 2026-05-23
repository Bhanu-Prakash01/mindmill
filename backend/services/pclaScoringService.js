'use strict';
/**
 * PCLA™ Scoring Service — Professional Coachability & Learning Agility Index
 *
 * Input:  responses = { "Q1": "A", "Q2": "C", ... }  (questionId → option key)
 *         questions  = array from pclaQuestions.js (with .order and .options[].weight)
 *
 * Output: {
 *   rawScore,            // 0–140
 *   maxRaw,              // 140
 *   coachabilityIndex,   // 0–100 percentage
 *   percentile,
 *   band,                // label string
 *   grade,
 *   promotionReadiness,
 *   bandDescription,
 *   dimensionScores,     // { [dimensionName]: 0–100 }
 *   radarScores,         // { curiosity, coachability, unlearning, relearning, technology, reflection, growthDrive }
 *   strongestDimension,
 *   weakestDimension,
 *   trainingROI,         // 0–100 derived estimate
 *   promotionReadinessScore, // 0–100 derived
 *   greenFlags,          // string[]
 *   amberFlags,          // string[]
 *   archetype,           // learning archetype label
 *   summary,
 * }
 */

const { PCLA_QUESTIONS, PCLA_BANDS, PCLA_RADAR_AXIS_MAP } = require('../seeders/pclaQuestions');

function getBand(score) {
  return PCLA_BANDS.find(b => score >= b.min) || PCLA_BANDS[PCLA_BANDS.length - 1];
}

function getPercentile(score) {
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 70;
  if (score >= 60) return 55;
  return 35;
}

/**
 * Map letter key (A/B/C/D) to option array index, or vice versa.
 * Supports both formats since PCLA questions may use key ("A"–"D")
 * or array index (0–3) as the selectedKey.
 */
function resolveOption(options, selectedKey) {
  // Direct key match (PCLA_QUESTIONS format: { key: 'A', weight: 4 })
  let opt = (options || []).find(o => o.key === selectedKey);
  if (opt) return opt;

  // Try matching by score (standard Question format: { score: 4, isCorrect: true })
  // selectedKey could be "A" → index 0, "B" → 1, etc.
  const LETTERS = ['A', 'B', 'C', 'D'];
  const idx = LETTERS.indexOf(selectedKey);
  if (idx >= 0 && options[idx]) return options[idx];

  // Try numeric key (order-based responses: "1" → index 0)
  const numIdx = parseInt(selectedKey, 10);
  if (!isNaN(numIdx) && options[numIdx]) return options[numIdx];

  return null;
}

function getWeight(opt) {
  return opt.weight ?? opt.score ?? 1;
}

/**
 * Build 6-axis radar by averaging dimension scores that belong to each axis.
 */
function buildRadar(dimensionScores) {
  const radar = {};
  for (const [axis, dims] of Object.entries(PCLA_RADAR_AXIS_MAP)) {
    const relevant = dims.filter(d => dimensionScores[d] != null);
    if (relevant.length === 0) { radar[axis] = 0; continue; }
    const avg = relevant.reduce((sum, d) => sum + dimensionScores[d], 0) / relevant.length;
    radar[axis] = Math.round(avg);
  }
  return radar;
}

function deriveArchetype(score, radarScores) {
  if (score >= 88) return 'The Adaptive Growth Leader';
  if (score >= 75) {
    const tech = radarScores['Technology Adaptability'] || 0;
    if (tech >= 80) return 'The Digital Reinvention Leader';
    return 'The Curious Builder';
  }
  if (score >= 63) return 'The Reinvention-Ready Professional';
  if (score >= 50) return 'The Stable Performer';
  return 'The Resistant Specialist';
}

function deriveGreenFlags(dimensionScores) {
  const flags = [];
  if ((dimensionScores['Coachability'] || 0) >= 75) flags.push('Open to Feedback');
  if ((dimensionScores['Learning Orientation'] || 0) >= 75) flags.push('Learns Beyond Comfort Zone');
  if ((dimensionScores['Reflection & Self-awareness'] || 0) >= 75) flags.push('Strong Self-awareness');
  if ((dimensionScores['Growth Drive'] || 0) >= 75) flags.push('High Learning Ownership');
  if ((dimensionScores['Technology Adaptability'] || 0) >= 75) flags.push('Technology Positive');
  if ((dimensionScores['Unlearning Ability'] || 0) >= 75) flags.push('Ready to Unlearn & Rebuild');
  if ((dimensionScores['Adaptability to Coaching'] || 0) >= 75) flags.push('Adapts Style to Context');
  if ((dimensionScores['Emotional Coachability'] || 0) >= 75) flags.push('Emotionally Receptive to Coaching');
  return flags;
}

function deriveAmberFlags(dimensionScores) {
  const flags = [];
  const techScore = dimensionScores['Technology Adaptability'] || 0;
  const unlearn   = dimensionScores['Unlearning Ability'] || 0;
  const coachScore = dimensionScores['Coachability'] || 0;
  if (techScore >= 50 && techScore < 75) flags.push('Digital Confidence Moderate — Adoption good, mastery still building');
  if (unlearn >= 50 && unlearn < 75) flags.push('Selective Unlearning — May hold onto older strengths');
  if (coachScore >= 50 && coachScore < 75) flags.push('Learning Application Gap — May learn faster than apply consistently');
  return flags;
}

/**
 * Main scoring function
 * @param {Object} responses  { "Q1": "A", ... } or { 1: "A", ... } (order-based)
 * @param {Array}  questions  populated Question documents or PCLA_QUESTIONS array
 */
function scorePCLA(responses, questions) {
  // Normalise response keys — support both "Q1" and order-number keys
  const normalized = {};
  for (const [k, v] of Object.entries(responses || {})) {
    normalized[String(k).replace(/^Q/i, '')] = v; // strip leading Q → "1"
  }

  let rawScore = 0;
  let maxRaw   = 0;
  const dimAccumulator = {}; // { dimName: { score, max } }

  for (const q of questions) {
    const orderKey = String(q.order);
    const qIdKey   = q.id ? String(q.id).replace(/^Q/i, '') : null;
    const selectedKey = normalized[orderKey] || (qIdKey ? normalized[qIdKey] : null);

    const dim = q.dimension || 'General';
    if (!dimAccumulator[dim]) dimAccumulator[dim] = { score: 0, max: 0 };

    const maxPerQ = Math.max(...(q.options || []).map(o => getWeight(o)), 4);
    maxRaw += maxPerQ;
    dimAccumulator[dim].max += maxPerQ;

    if (!selectedKey) continue; // unanswered

    const opt = resolveOption(q.options, selectedKey);
    const weight = opt ? getWeight(opt) : 1;
    rawScore += weight;
    dimAccumulator[dim].score += weight;
  }

  const coachabilityIndex = maxRaw > 0 ? Math.round((rawScore / maxRaw) * 100) : 0;

  // Dimension percentages
  const dimensionScores = {};
  for (const [dim, { score, max }] of Object.entries(dimAccumulator)) {
    dimensionScores[dim] = max > 0 ? Math.round((score / max) * 100) : 0;
  }

  const dims = Object.entries(dimensionScores);
  const strongestDimension = dims.length ? dims.reduce((a, b) => a[1] >= b[1] ? a : b)[0] : null;
  const weakestDimension   = dims.length ? dims.reduce((a, b) => a[1] <= b[1] ? a : b)[0] : null;

  const bandInfo   = getBand(coachabilityIndex);
  const radarScores = buildRadar(dimensionScores);

  // Derived composite metrics
  const trainingROI            = Math.min(100, Math.round(coachabilityIndex * 1.02));
  const promotionReadinessScore = Math.min(100, Math.round(
    (coachabilityIndex * 0.6) + ((dimensionScores['Growth Drive'] || 0) * 0.4)
  ));

  const greenFlags = deriveGreenFlags(dimensionScores);
  const amberFlags = deriveAmberFlags(dimensionScores);
  const archetype  = deriveArchetype(coachabilityIndex, radarScores);

  return {
    rawScore,
    maxRaw,
    coachabilityIndex,
    percentile:            getPercentile(coachabilityIndex),
    band:                  bandInfo.label,
    grade:                 bandInfo.grade,
    promotionReadiness:    bandInfo.promotionReadiness,
    bandDescription:       bandInfo.description,
    dimensionScores,
    radarScores,
    strongestDimension,
    weakestDimension,
    trainingROI,
    promotionReadinessScore,
    greenFlags,
    amberFlags,
    archetype,
    summary: `Candidate demonstrates ${bandInfo.label} orientation toward coaching, learning agility, and career adaptability. ${bandInfo.description}`,
  };
}

module.exports = { scorePCLA, getBand, getPercentile, buildRadar, PCLA_BANDS };
