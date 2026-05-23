'use strict';
/**
 * ECTI™ Scoring Service — Executive Critical Thinking Index
 *
 * Input:  responses = { "Q1": "C", "Q2": "C", ... }  (questionId → option key)
 *         questions = array from ectiQuestions.js (with .order and .options[].weight)
 *
 * Output: Full executive intelligence dossier including:
 *   - Weighted scores, band, percentile, EJQ
 *   - Radar dimensions (6-axis)
 *   - Executive Archetype + Behavioural Decision Lens
 *   - Green / Amber / Red Flags
 *   - Promotion Readiness Matrix
 *   - Leadership Risk Meter
 *   - Role Fit Mapping
 *   - Development Recommendations
 *   - Final Recommendation
 *   - AI-style board-level summary
 */

const { ECTI_QUESTIONS, ECTI_BANDS } = require('../seeders/ectiQuestions');

// ─── Band helpers ────────────────────────────────────────────────────────────

function getBand(rawScore) {
  return ECTI_BANDS.find(b => rawScore >= b.min) || ECTI_BANDS[ECTI_BANDS.length - 1];
}

function getPercentile(rawScore) {
  if (rawScore >= 126) return 95;
  if (rawScore >= 108) return 85;
  if (rawScore >= 90)  return 68;
  if (rawScore >= 72)  return 45;
  return 22;
}

// ─── Archetype Engine ────────────────────────────────────────────────────────

const ARCHETYPES = [
  {
    id: 'strategic_integrator',
    label: 'The Strategic Integrator',
    traits: ['sees bigger picture', 'balances people and business', 'strong under ambiguity', 'calm decision maker', 'enterprise-first mindset'],
    risk: 'May over-analyse before moving quickly.',
    condition: (r) => r.strategic >= 75 && r.stakeholder >= 70 && r.ethical >= 70,
  },
  {
    id: 'ethical_guardian',
    label: 'The Ethical Guardian',
    traits: ['deeply principled', 'protects long-term trust', 'integrity-first decisions', 'high accountability maturity', 'trusted by stakeholders'],
    risk: 'May be overly cautious in grey-area commercial decisions.',
    condition: (r) => r.ethical >= 80 && r.decision >= 65,
  },
  {
    id: 'execution_warrior',
    label: 'The Execution Warrior',
    traits: ['drives results relentlessly', 'high delivery focus', 'pragmatic under pressure', 'strong operational command', 'decisive in crisis'],
    risk: 'May underinvest in long-term strategic thinking.',
    condition: (r) => r.execution >= 75 && r.strategic < 70,
  },
  {
    id: 'commercial_operator',
    label: 'The Commercial Operator',
    traits: ['revenue-focused', 'client relationship master', 'value-maximizing mindset', 'strong deal instinct', 'competitive intelligence'],
    risk: 'May sacrifice ethics for commercial gain under extreme pressure.',
    condition: (r) => r.decision >= 75 && r.stakeholder >= 70,
  },
  {
    id: 'systems_thinker',
    label: 'The Systems Thinker',
    traits: ['connects dots across functions', 'root-cause focused', 'diagnoses before acting', 'process optimization mindset', 'evidence-based decisions'],
    risk: 'May over-engineer solutions where speed is needed.',
    condition: (r) => r.framing >= 75 && r.strategic >= 65,
  },
  {
    id: 'diplomatic_leader',
    label: 'The Diplomatic Leader',
    traits: ['stakeholder harmony focused', 'conflict de-escalator', 'politically aware', 'relationship capital builder', 'collaborative decision maker'],
    risk: 'May avoid necessary confrontation and hard calls.',
    condition: (r) => r.stakeholder >= 78 && r.ethical >= 65,
  },
  {
    id: 'change_catalyst',
    label: 'The Change Catalyst',
    traits: ['embraces disruption', 'early adopter mindset', 'drives transformation agendas', 'challenges status quo constructively', 'innovation leadership'],
    risk: 'May underestimate organizational change fatigue.',
    condition: (r) => r.strategic >= 72 && r.framing >= 65 && r.execution >= 60,
  },
  {
    id: 'developing_leader',
    label: 'The Developing Leader',
    traits: ['growing executive capability', 'operational grounding', 'improving strategic awareness', 'building stakeholder skills', 'coachable and driven'],
    risk: 'Needs structured mentoring and broader strategic exposure.',
    condition: () => true, // fallback
  },
];

function determineArchetype(radar) {
  for (const archetype of ARCHETYPES) {
    if (archetype.condition(radar)) return archetype;
  }
  return ARCHETYPES[ARCHETYPES.length - 1];
}

function getAlternativeArchetypes(primaryId) {
  const alts = ARCHETYPES.filter(a => a.id !== primaryId && a.id !== 'developing_leader');
  return alts.slice(0, 4).map(a => a.label);
}

// ─── Behavioural Decision Lens ────────────────────────────────────────────────

function buildBehaviouralLens(radar, percentage) {
  const p = percentage;
  return [
    { behaviour: 'Diagnose before acting',        probability: Math.min(95, Math.round(radar.framing * 0.85 + 15)) },
    { behaviour: 'Balance stakeholders',           probability: Math.min(95, Math.round(radar.stakeholder * 0.9 + 5)) },
    { behaviour: 'Protect long-term trust',        probability: Math.min(98, Math.round(radar.ethical * 0.95 + 5)) },
    { behaviour: 'Think systemically',             probability: Math.min(95, Math.round(radar.strategic * 0.85 + 10)) },
    { behaviour: 'Escalate prematurely',           probability: Math.max(5,  Math.round(40 - p * 0.3)) },
    { behaviour: 'Avoid conflict',                 probability: Math.max(5,  Math.round(50 - radar.ethical * 0.4)) },
    { behaviour: 'React emotionally',              probability: Math.max(3,  Math.round(30 - radar.ethical * 0.25)) },
    { behaviour: 'Defend ego position',            probability: Math.max(5,  Math.round(35 - radar.decision * 0.3)) },
  ];
}

// ─── Leadership Risk Meter ────────────────────────────────────────────────────

function buildRiskMeter(radar) {
  const riskLevel = (score, thresholds) => {
    if (score >= thresholds[0]) return 'VERY LOW';
    if (score >= thresholds[1]) return 'LOW';
    if (score >= thresholds[2]) return 'MODERATE';
    return 'HIGH';
  };

  return {
    decisionRisk:       riskLevel(radar.decision,    [85, 70, 55]),
    ethicsRisk:         riskLevel(radar.ethical,     [88, 75, 60]),
    stakeholderRisk:    riskLevel(radar.stakeholder, [85, 70, 55]),
    politicalRisk:      riskLevel(radar.stakeholder, [80, 65, 50]),
    executionStretch:   riskLevel(radar.execution,   [80, 65, 50]),
    leadershipMaturity: riskLevel(Math.round((radar.strategic + radar.ethical + radar.decision) / 3), [85, 70, 55]),
  };
}

// ─── Promotion Readiness Matrix ───────────────────────────────────────────────

function buildPromotionMatrix(percentage, radar) {
  const p = percentage;
  return {
    currentRole:    Math.min(99, Math.round(p * 0.85 + 20)),
    nextRole:       Math.min(95, Math.round(p * 0.75 + 10)),
    largeTeam:      Math.min(90, Math.round((p + radar.stakeholder) / 2 * 0.7 + 10)),
    enterprise:     Math.min(88, Math.round((p + radar.strategic) / 2 * 0.65 + 5)),
    cxoPipeline:    Math.min(85, Math.round((p + radar.ethical + radar.strategic) / 3 * 0.6)),
  };
}

// ─── Role Fit Mapping ─────────────────────────────────────────────────────────

function buildRoleFit(radar, percentage) {
  const isStrong  = (dims) => dims.every(d => radar[d] >= 72) && percentage >= 65;
  const isFuture  = (dims) => dims.every(d => radar[d] >= 60) && percentage >= 55;

  const roleFit = {
    strongFit:  [],
    futureFit:  [],
    lowerFit:   [],
  };

  if (isStrong(['strategic', 'stakeholder', 'decision']))     roleFit.strongFit.push('Business Unit Head');
  if (isStrong(['decision', 'execution', 'stakeholder']))     roleFit.strongFit.push('Project Director');
  if (isStrong(['stakeholder', 'execution']))                  roleFit.strongFit.push('Regional Operations Head');
  if (isStrong(['stakeholder', 'ethical']))                    roleFit.strongFit.push('Client Success Head');
  if (isStrong(['framing', 'stakeholder', 'ethical']))         roleFit.strongFit.push('HR Business Partner Leader');
  if (isStrong(['execution', 'decision', 'strategic']))        roleFit.strongFit.push('Delivery Head');

  if (isFuture(['strategic', 'ethical', 'stakeholder']))       roleFit.futureFit.push('COO Track');
  if (isFuture(['strategic', 'ethical', 'decision']))          roleFit.futureFit.push('CXO Pipeline');
  if (isFuture(['strategic', 'framing', 'execution']))         roleFit.futureFit.push('Transformation Leadership');

  if (percentage < 65 || radar.execution < 55) {
    roleFit.lowerFit.push('High-chaos startup environments needing impulsive speed');
  }

  if (roleFit.strongFit.length === 0) roleFit.strongFit.push('Functional Management Roles');
  if (roleFit.futureFit.length === 0) roleFit.futureFit.push('Senior Leadership (with development)');

  return roleFit;
}

// ─── Development Recommendations ─────────────────────────────────────────────

function buildDevelopmentPlan(radar, percentage) {
  const recs = [];
  if (radar.execution < 70)   recs.push('Sharpen fast executive decision cycles');
  if (radar.stakeholder < 75) recs.push('Improve political navigation sophistication');
  if (radar.strategic < 70)   recs.push('Develop long-term strategic foresight');
  if (radar.ethical < 75)     recs.push('Strengthen ethical leadership under commercial pressure');
  if (percentage < 80)        recs.push('Increase strategic influence upward and across functions');
  recs.push('Develop boardroom storytelling and executive communication capability');
  recs.push('Strengthen delegation architecture and succession thinking');
  return recs.slice(0, 5);
}

// ─── Final Recommendation ─────────────────────────────────────────────────────

function buildFinalRecommendation(rawScore, percentage, radar) {
  let verdict, succession, potential, trustQuotient, confidence;

  if (rawScore >= 126) {
    verdict = 'Strongly Recommended'; succession = '6–12 months'; potential = 'Very High';
    trustQuotient = 'Very High'; confidence = Math.min(97, Math.round(percentage * 0.95 + 10));
  } else if (rawScore >= 108) {
    verdict = 'Recommended'; succession = '12–24 months'; potential = 'High';
    trustQuotient = 'High'; confidence = Math.round(percentage * 0.88 + 8);
  } else if (rawScore >= 90) {
    verdict = 'Conditionally Recommended'; succession = '18–30 months'; potential = 'Moderate-High';
    trustQuotient = 'Moderate'; confidence = Math.round(percentage * 0.80 + 5);
  } else if (rawScore >= 72) {
    verdict = 'Under Development'; succession = '30–48 months'; potential = 'Moderate';
    trustQuotient = 'Moderate'; confidence = Math.round(percentage * 0.72);
  } else {
    verdict = 'Not Recommended at This Stage'; succession = '48+ months'; potential = 'Developing';
    trustQuotient = 'Low'; confidence = Math.round(percentage * 0.60);
  }

  return { verdict, succession, potential, trustQuotient, confidence };
}

// ─── AI-style Board Summary Generator ────────────────────────────────────────

function generateBoardSummary(rawScore, band, radar, archetype, greenFlags, redFlags) {
  const radarAvg = Math.round(Object.values(radar).reduce((a, b) => a + b, 0) / Object.values(radar).length);
  const strengths = greenFlags.slice(0, 3).join(', ');
  const watchAreas = redFlags.length > 0
    ? ` Key watch areas include ${redFlags.slice(0, 2).join(' and ')}.`
    : '';

  const sentences = [
    `The candidate scored ${rawScore}/144 on the Executive Critical Thinking Index, placing them in the "${band}" band with an average capability score of ${radarAvg}%.`,
    `Their profile as "${archetype.label}" reflects ${archetype.traits.slice(0, 3).join(', ')}.`,
    `Core executive signals include ${strengths}, indicating strong readiness for leadership accountability.`,
    `This profile reflects ${radarAvg >= 75 ? 'high trust leadership potential' : 'solid functional leadership'}, especially in roles demanding ${radarAvg >= 80 ? 'client-facing maturity, enterprise judgement, and leadership resilience' : 'operational discipline and stakeholder management'}.`,
    redFlags.length > 0 ? `Development focus is recommended on ${redFlags[0].toLowerCase()}.${watchAreas}` : 'No significant red flags were identified across the assessment dimensions.',
  ];

  return sentences.join(' ');
}

// ─── Green / Amber / Red Flag Builder ────────────────────────────────────────

function buildFlags(radar, percentage) {
  const green = [];
  const amber = [];
  const red   = [];

  // Green Flags
  if (radar.ethical >= 82)      green.push('Ethical Courage');
  if (radar.stakeholder >= 78)  green.push('Mature Stakeholder Handling');
  if (radar.strategic >= 78)    green.push('Enterprise Thinking');
  if (radar.decision >= 78)     green.push('Balanced Commercial Judgement');
  if (radar.framing >= 75)      green.push('Problem Framing Strength');
  if (radar.execution >= 75)    green.push('Execution Reliability');
  if (percentage >= 80)         green.push('High Trust Leadership');
  if (radar.ethical >= 85 && radar.stakeholder >= 80) green.push('Client-facing Executive Maturity');

  // Amber Flags
  if (radar.execution < 70)     amber.push('Execution Fatigue Risk');
  if (radar.decision < 68)      amber.push('Consensus Dependence');
  if (radar.stakeholder < 65)   amber.push('Political Sensitivity');
  if (radar.strategic < 65)     amber.push('Slow in Fast-moving Decisions');

  // Red Flags
  if (radar.strategic < 50)     red.push('Short-term thinking');
  if (radar.ethical < 55)       red.push('Ethical compromise under pressure');
  if (radar.execution < 45)     red.push('Decision paralysis');
  if (radar.stakeholder < 45)   red.push('Conflict avoidance');
  if (radar.decision < 45)      red.push('Over-compliance / weak challenge behaviour');

  // Ensure at least one green flag
  if (green.length === 0) green.push('Operational Competence');
  if (amber.length === 0) amber.push('Requires broader strategic exposure');

  return { greenFlags: green, amberFlags: amber, redFlags: red };
}

// ─── Main Scorer ──────────────────────────────────────────────────────────────

function scoreECTI(responses, questions) {
  // Normalise responses keys: "Q1" → "1"
  const normalized = {};
  for (const [k, v] of Object.entries(responses || {})) {
    normalized[String(k).replace(/^Q/i, '')] = v;
  }

  let rawScore = 0;
  let maxRaw   = 0;

  const clusterAccumulator = {
    'Operational Judgement':         { score: 0, max: 0 },
    'Strategic Decision Quality':    { score: 0, max: 0 },
    'Stakeholder / Client Maturity': { score: 0, max: 0 },
    'Executive Leadership Maturity': { score: 0, max: 0 },
  };

  const dimensionScores = {};

  for (const q of questions) {
    const orderKey   = String(q.order);
    const qIdKey     = q.id ? String(q.id).replace(/^Q/i, '') : null;
    const selectedKey = normalized[orderKey] || (qIdKey ? normalized[qIdKey] : null);

    const cluster = q.cluster || 'Operational Judgement';
    const dim     = q.dimension || 'General';

    if (!dimensionScores[dim]) dimensionScores[dim] = { score: 0, max: 0 };

    const maxPerQ = Math.max(...(q.options || []).map(o => o.weight || 0), 4);
    maxRaw += maxPerQ;
    if (clusterAccumulator[cluster]) clusterAccumulator[cluster].max += maxPerQ;
    dimensionScores[dim].max += maxPerQ;

    if (!selectedKey) continue;

    const opt    = (q.options || []).find(o => o.key === selectedKey);
    const weight = opt ? (opt.weight || 0) : 0;

    rawScore += weight;
    if (clusterAccumulator[cluster]) clusterAccumulator[cluster].score += weight;
    dimensionScores[dim].score += weight;
  }

  // ── Cluster & dimension percentages ─────────────────────────────────────────
  const clusterPercentages = {};
  for (const [cl, { score, max }] of Object.entries(clusterAccumulator)) {
    clusterPercentages[cl] = max > 0 ? Math.round((score / max) * 100) : 0;
  }

  const dimPercentages = {};
  for (const [d, { score, max }] of Object.entries(dimensionScores)) {
    dimPercentages[d] = max > 0 ? Math.round((score / max) * 100) : 0;
  }

  const percentage = maxRaw > 0 ? Math.round((rawScore / maxRaw) * 100) : 0;
  const percentile = getPercentile(rawScore);
  const bandInfo   = getBand(rawScore);

  // ── Radar (6 capability axes) ────────────────────────────────────────────────
  const radar = {
    strategic:   clusterPercentages['Strategic Decision Quality']    || dimPercentages['Strategic Judgement'] || percentage,
    ethical:     dimPercentages['Ethical Reasoning']   || dimPercentages['Ethical Leadership']   || percentage,
    decision:    dimPercentages['Decision Quality']    || dimPercentages['Strategic Decision Quality'] || percentage,
    stakeholder: clusterPercentages['Stakeholder / Client Maturity'] || percentage,
    execution:   dimPercentages['Execution Thinking']  || percentage,
    framing:     dimPercentages['Problem Framing']     || percentage,
  };

  // ── Derived scores ───────────────────────────────────────────────────────────
  const ejq              = Math.min(145, Math.round(70 + (percentage * 0.55) + (radar.strategic * 0.12)));
  const promotionReadiness = Math.round((percentage * 0.70) + (radar.strategic * 0.30));
  const cxoPotential       = Math.round((percentage * 0.50) + (radar.strategic * 0.35) + (radar.ethical * 0.15));

  // ── Rich output sections ─────────────────────────────────────────────────────
  const { greenFlags, amberFlags, redFlags } = buildFlags(radar, percentage);
  const archetype     = determineArchetype(radar);
  const altArchetypes = getAlternativeArchetypes(archetype.id);
  const behaviouralLens = buildBehaviouralLens(radar, percentage);
  const riskMeter     = buildRiskMeter(radar);
  const promotionMatrix = buildPromotionMatrix(percentage, radar);
  const roleFit       = buildRoleFit(radar, percentage);
  const development   = buildDevelopmentPlan(radar, percentage);
  const finalRec      = buildFinalRecommendation(rawScore, percentage, radar);
  const boardSummary  = generateBoardSummary(rawScore, bandInfo.label, radar, archetype, greenFlags, redFlags);

  return {
    // Core scores
    rawScore,
    maxRaw,
    percentage,
    percentile,
    band:            bandInfo.label,
    bandDescription: bandInfo.description,
    ectiScore:       percentage,
    ejq,
    promotionReadiness,
    cxoPotential,

    // Cluster & dimension breakdowns
    clusterScores:   clusterPercentages,
    dimensionScores: dimPercentages,

    // Radar
    radar,

    // Flags
    greenFlags,
    amberFlags,
    redFlags,

    // Executive Archetype
    archetype: {
      label:      archetype.label,
      traits:     archetype.traits,
      risk:       archetype.risk,
      alternates: altArchetypes,
    },

    // Behavioural Decision Lens
    behaviouralLens,

    // Risk Meter
    riskMeter,

    // Promotion Readiness Matrix
    promotionMatrix,

    // Role Fit
    roleFit,

    // Development Plan
    development,

    // Final Recommendation
    finalRecommendation: finalRec,

    // AI Board-level Summary
    summary:     boardSummary,
    boardSummary,
  };
}

module.exports = { scoreECTI, getBand, getPercentile, ECTI_BANDS };
