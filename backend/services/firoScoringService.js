/**
 * FIRO-B Scoring Service (lightweight, stateless implementation)
 * Exposes:
 *  - calculateFiroScores(responses): computes exact dimensional scores
 *  - config: static FIRO-B configuration for reference
 */

const DIMENSIONS = ['eI', 'wI', 'eC', 'wC', 'eA', 'wA'];
const ITEMS_PER_DIMENSION = 9;

function calculateFiroScores(responses) {
  // Coerce responses to numbers
  const valid = Array.isArray(responses) ? responses.map(v => Number(v) || 0) : [];
  
  // Cutoff heuristic: Options are 1-6 (1:Never to 6:Usually). 
  // We award 1 point if the answer is 4 (Sometimes), 5 (Often), or 6 (Usually).
  const scoresByDimension = {
    eI: 0, wI: 0,
    eC: 0, wC: 0,
    eA: 0, wA: 0
  };

  valid.forEach((val, idx) => {
    // 0-8: eI, 9-17: wI, 18-26: eC, 27-35: wC, 36-44: eA, 45-53: wA
    const dimIndex = Math.floor(idx / ITEMS_PER_DIMENSION);
    const dimension = DIMENSIONS[dimIndex];
    if (dimension) {
      if (val >= 4) {
        scoresByDimension[dimension] += 1;
      }
    }
  });

  const { eI, wI, eC, wC, eA, wA } = scoresByDimension;

  // Composite structures
  const inclusionTotal = eI + wI;
  const controlTotal = eC + wC;
  const affectionTotal = eA + wA;

  const totalExpressed = eI + eC + eA;
  const totalWanted = wI + wC + wA;
  const overallTotal = totalExpressed + totalWanted;

  // For generalized interfaces expecting "rawScores" per trait
  const rawScores = {
    Inclusion: inclusionTotal, // 0-18
    Control: controlTotal,     // 0-18
    Affection: affectionTotal  // 0-18
  };

  // Determine dominant/secondary traits by total needs (highest need area)
  const totals = [
    { trait: 'Inclusion', score: inclusionTotal },
    { trait: 'Control', score: controlTotal },
    { trait: 'Affection', score: affectionTotal }
  ].sort((a, b) => b.score - a.score);

  const dominant = totals[0]?.trait || 'Inclusion';
  const secondary = totals[1]?.trait || 'Control';

  // Analysis skeleton for generic assessment logic (we use llmReportService for full static data)
  const analysis = {
    summary: `Dominant FIRO-B interpersonal need is ${dominant}.`,
    strengths: [],
    developmentAreas: [],
    recommendations: []
  };

  return {
    rawScores,
    dimensions: {
      Expressed: { Inclusion: eI, Control: eC, Affection: eA },
      Wanted: { Inclusion: wI, Control: wC, Affection: wA }
    },
    totals: {
      totalExpressed,
      totalWanted,
      overallTotal
    },
    normalizedScores: rawScores, // Provided for schema compatibility
    dominant,
    secondary,
    analysis
  };
}

// Static configuration (shared with controller)
const config = {
  name: 'FIRO-B',
  scales: [
    { name: 'Inclusion', short: 'In' },
    { name: 'Control', short: 'Ct' },
    { name: 'Affection', short: 'Af' }
  ],
  items: 54
};

module.exports = {
  calculateFiroScores,
  config
};
