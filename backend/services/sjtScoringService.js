'use strict';
/**
 * SJT Scoring Service — Executive Situational Judgement Index (ESJI™)
 *
 * Input:  responses = { "Q1": "A", "Q2": "C", ... }  (questionId → option key)
 *         questionBank = array from sjtQuestions.js  (with .order and .options[].weight)
 *
 * Output: {
 *   situationalIndex,   // 0-100 percentage
 *   rawScore,           // 0-160
 *   maxRaw,             // 160
 *   percentile,
 *   band,               // label string
 *   grade,
 *   promotionReadiness,
 *   dimensionScores,    // { [dimensionName]: 0-100 }
 *   strongestDimension,
 *   weakestDimension,
 *   summary,
 *   radar,              // aggregated 7-axis radar scores
 * }
 */

const { SJT_BANDS } = require('../seeders/sjtQuestions');

// Map the 40 dimensions into 7 radar axes for the report chart
const RADAR_AXIS_MAP = {
  'Composure': [
    'Composure Under Stress', 'Self-management', 'Self-regulation & Executive Stamina',
    'Leadership Presence Under Stress', 'Resilience Leadership'
  ],
  'Decision Quality': [
    'Decision Under Pressure', 'Judgement in Ambiguity', 'Decision-making in Ambiguity',
    'Executive Strategic Judgement', 'Balanced Leadership Judgement', 'Executive Readiness Under Complexity'
  ],
  'Crisis Communication': [
    'Crisis Leadership', 'Leadership Integrity Under Pressure', 'Change Leadership Under Stress',
    'Leadership Visibility & Presence', 'Enterprise Crisis Thinking'
  ],
  'Stakeholder Handling': [
    'Stakeholder Handling', 'Client Pressure Management', 'Commercial Stakeholder Judgement',
    'Client Crisis Recovery', 'Political Pressure Handling', 'Managing Upward Under Pressure',
    'Executive Alignment Judgement'
  ],
  'Business Continuity': [
    'Business Continuity Thinking', 'Enterprise Collaboration Under Pressure',
    'Continuity Leadership', 'Integrity Under Pressure', 'Enterprise Crisis Thinking'
  ],
  'Resourcefulness': [
    'Resourcefulness', 'Adaptive Resourcefulness', 'Sustainable Leadership',
    'Sustainable Execution Leadership', 'Escalation Governance', 'Strategic Calm Under Shock'
  ],
  'Escalation Judgement': [
    'Escalation Judgement', 'Managing Upward Under Pressure', 'Prioritization Under Stress',
    'Pressure Prioritization', 'Team Leadership Under Pressure', 'Accountability Under Pressure',
    'Leading Through Uncertainty'
  ],
};

function getBand(score) {
  return SJT_BANDS.find(b => score >= b.min) || SJT_BANDS[SJT_BANDS.length - 1];
}

function getPercentile(score) {
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 70;
  if (score >= 60) return 55;
  return 35;
}

/**
 * Build radar axes by averaging dimension scores that belong to each axis
 */
function buildRadar(dimensionScores) {
  const radar = {};
  for (const [axis, dims] of Object.entries(RADAR_AXIS_MAP)) {
    const relevant = dims.filter(d => dimensionScores[d] != null);
    if (relevant.length === 0) { radar[axis] = 0; continue; }
    const avg = relevant.reduce((sum, d) => sum + dimensionScores[d], 0) / relevant.length;
    radar[axis] = Math.round(avg);
  }
  return radar;
}

/**
 * Main scoring function
 * @param {Object} responses  { "Q1": "A", ... } or { 1: "A", ... } (order-based)
 * @param {Array}  questions  populated Question documents or SJT_QUESTIONS array
 */
function scoreSJT(responses, questions) {
  // Normalise response keys — support both "Q1" and order-number keys
  const normalized = {};
  for (const [k, v] of Object.entries(responses || {})) {
    normalized[String(k).replace(/^Q/i, '')] = v; // strip leading Q → "1"
  }

  let rawScore = 0;
  let maxRaw = 0;
  const dimAccumulator = {}; // { dimName: { score, max } }

  for (const q of questions) {
    const orderKey = String(q.order);
    const qIdKey = q.id ? String(q.id).replace(/^Q/i, '') : null;
    const selectedKey = normalized[orderKey] || (qIdKey ? normalized[qIdKey] : null);

    const dim = q.dimension || 'General';
    if (!dimAccumulator[dim]) dimAccumulator[dim] = { score: 0, max: 0 };

    const maxPerQ = Math.max(...(q.options || []).map(o => o.weight || 0), 4);
    maxRaw += maxPerQ;
    dimAccumulator[dim].max += maxPerQ;

    if (!selectedKey) continue; // unanswered

    const opt = (q.options || []).find(o => o.key === selectedKey);
    const weight = opt ? (opt.weight || 1) : 1;
    rawScore += weight;
    dimAccumulator[dim].score += weight;
  }

  const situationalIndex = maxRaw > 0 ? Math.round((rawScore / maxRaw) * 100) : 0;

  // Dimension percentages
  const dimensionScores = {};
  for (const [dim, { score, max }] of Object.entries(dimAccumulator)) {
    dimensionScores[dim] = max > 0 ? Math.round((score / max) * 100) : 0;
  }

  const dims = Object.entries(dimensionScores);
  const strongestDimension = dims.length ? dims.reduce((a, b) => a[1] >= b[1] ? a : b)[0] : null;
  const weakestDimension   = dims.length ? dims.reduce((a, b) => a[1] <= b[1] ? a : b)[0] : null;

  const bandInfo = getBand(situationalIndex);
  const radar = buildRadar(dimensionScores);

  return {
    rawScore,
    maxRaw,
    situationalIndex,
    percentile: getPercentile(situationalIndex),
    band: bandInfo.label,
    grade: bandInfo.grade,
    promotionReadiness: bandInfo.promotionReadiness,
    bandDescription: bandInfo.description,
    dimensionScores,
    strongestDimension,
    weakestDimension,
    radar,
    summary: `Candidate demonstrates ${bandInfo.label} capability with a Situational Index of ${situationalIndex}%. ${bandInfo.description}`,
  };
}

module.exports = { scoreSJT, getBand, getPercentile, buildRadar, RADAR_AXIS_MAP };
