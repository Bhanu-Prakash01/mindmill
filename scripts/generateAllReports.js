#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────
 * MindMill — Generate All Report Types (Dummy Scores)
 * ─────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   node scripts/generateAllReports.js
 *   GROQ_API_KEY=gsk_xxx node scripts/generateAllReports.js   # with LLM narratives
 *
 * Outputs all PDFs to ./reports-output/ directory.
 * Runs every assessment type in both summary AND comprehensive modes.
 *
 * Without a valid GROQ_API_KEY the script still generates all PDFs —
 * LLM narrative calls fall back to static placeholder text.
 *
 * Reports generated:
 *   1.  disc-comprehensive.pdf
 *   2.  disc-summary.pdf
 *   3.  big5-comprehensive.pdf
 *   4.  big5-summary.pdf
 *   5.  firo-comprehensive.pdf
 *   6.  firo-summary.pdf
 *   7.  mbti-comprehensive.pdf
 *   8.  mbti-summary.pdf
 *   9.  hogan-comprehensive.pdf
 *   10. sjt-comprehensive.pdf
 *   11. sjt-summary.pdf
 *   12. pcla-comprehensive.pdf
 *   13. pcla-summary.pdf
 *   14. ecti-comprehensive.pdf
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ── Load env vars (backend .env or root .env) ─────────────────────
const path = require('path');
const fs   = require('fs');

const ROOT   = path.resolve(__dirname, '..');

// Try loading dotenv from backend or root
const dotenvPaths = [
  path.join(ROOT, 'backend', '.env'),
  path.join(ROOT, '.env'),
];
for (const p of dotenvPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}

// Ensure GROQ_API_KEY exists so SDK doesn't throw at import time.
// With a dummy key the SDK will initialize fine; actual LLM calls will
// fail gracefully and pdfService will use its static narrative fallbacks.
if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = 'dummy-key-for-pdf-render-only';
  console.log('  ℹ️   No GROQ_API_KEY found — LLM narratives will use static fallback text.\n');
}

const OUTPUT = path.join(ROOT, 'reports-output');
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

// ── Load services ────────────────────────────────────────────────
const pdfSvc = require(path.join(ROOT, 'backend/services/pdfService'));

// ── Shared dummy test-taker ──────────────────────────────────────
const TAKER = {
  name:            'Alex Johnson',
  email:           'alex.johnson@example.com',
  startedAt:       new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  timeSpent:       22 * 60,           // 22 minutes
  answeredQuestions: 40,
  totalQuestions:    40,
};

// ── Helper ───────────────────────────────────────────────────────
const save = async (name, buffer) => {
  const filePath = path.join(OUTPUT, name);
  fs.writeFileSync(filePath, buffer);
  console.log(`  ✅  ${name}  (${Math.round(buffer.length / 1024)} KB)`);
};

// ── DUMMY DATA ───────────────────────────────────────────────────
// DISC — scores 0–100
const DISC_REPORT = {
  scores:    { D: 72, I: 58, S: 44, C: 81 },
  dominant:  'C',
  secondary: 'D',
  pattern:   'CD',
};

// Big Five — raw scores 0–40 per trait
const BIG5_REPORT = {
  scores: {
    Openness:          32,
    Conscientiousness: 35,
    Extraversion:      24,
    Agreeableness:     28,
    Neuroticism:       18,
  },
};

// FIRO-B — expressed/wanted 0–9 each
const FIRO_REPORT = {
  firoResults: {
    dimensions: {
      Expressed: {
        Inclusion:  { score: 7, level: 'High',     description: 'You actively seek out social interaction.' },
        Control:    { score: 5, level: 'Moderate',  description: 'You prefer balanced control in situations.' },
        Affection:  { score: 6, level: 'High',     description: 'You express warmth openly to close associates.' },
      },
      Wanted: {
        Inclusion:  { score: 6, level: 'High',     description: 'You want to be included in group activities.' },
        Control:    { score: 4, level: 'Moderate',  description: 'You prefer some guidance from others.' },
        Affection:  { score: 7, level: 'High',     description: 'You value close, warm relationships.' },
      },
    },
    totals: {
      inclusionTotal:  13, controlTotal:  9, affectionTotal: 13,
      totalExpressed:  18, totalWanted:   17, overallTotal:  35,
    },
  },
};

// MBTI — percentages 0–100 per axis
const MBTI_REPORT = {
  mbtiResults: {
    percentages: { EI: 62, SN: 74, TF: 45, JP: 68 },
    type:        'INTJ',
    name:        'The Architect',
  },
};

// Hogan HPI — percentile scores 0–100
const HOGAN_REPORT = {
  hoganResults: {
    percentiles: {
      Adjustment:               78,
      Ambition:                 82,
      Sociability:              55,
      Interpersonal_Sensitivity: 63,
      Prudence:                 71,
      Inquisitiveness:          88,
      Learning_Approach:        79,
    },
    rawScores: {
      Adjustment:               28,
      Ambition:                 30,
      Sociability:              20,
      Interpersonal_Sensitivity: 23,
      Prudence:                 26,
      Inquisitiveness:          32,
      Learning_Approach:        29,
    },
    levels: {
      Adjustment:               'High',
      Ambition:                 'High',
      Sociability:              'Moderate',
      Interpersonal_Sensitivity:'Moderate',
      Prudence:                 'High',
      Inquisitiveness:          'High',
      Learning_Approach:        'High',
    },
    dominantScale: 'Inquisitiveness',
    secondaryScale: 'Ambition',
  },
};

// SJT — situational judgement scores
const SJT_REPORT = {
  sjtResults: {
    situationalIndex:    82,
    rawScore:            131,
    maxRaw:              160,
    percentile:          85,
    band:                'Strategic Leader',
    grade:               'A',
    promotionReadiness:  'Ready for Senior Promotion',
    strongestDimension:  'Decision Quality',
    weakestDimension:    'Crisis Communication',
    radar: {
      'Composure':            88,
      'Decision Quality':     91,
      'Crisis Communication': 68,
      'Stakeholder Handling': 85,
      'Business Continuity':  79,
      'Resourcefulness':      83,
      'Escalation Judgement': 76,
    },
    dimensionScores: {
      'Executive Presence':   85,
      'Analytical Thinking':  82,
      'Team Leadership':      78,
      'Risk Management':      74,
    },
  },
};

// PCLA — coachability scores
const PCLA_REPORT = {
  pclaResults: {
    coachabilityIndex:    78,
    band:                 'Agile Learner',
    grade:                'B+',
    percentile:           74,
    promotionReadiness:   'Development Recommended',
    promotionReadinessScore: 78,
    archetype:            'The Adaptive Professional',
    bandDescription:      'Demonstrates strong learning orientation with healthy receptivity to feedback. Capable of significant growth with targeted coaching.',
    strongestDimension:   'Learning Orientation',
    weakestDimension:     'Unlearning Ability',
    trainingROI:          82,
    summary:              'Alex demonstrates strong coachability characteristics with a clear appetite for continuous learning. Coaching engagement is likely to yield measurable performance uplift within 6 months.',
    radarScores: {
      'Coachability':               78,
      'Learning Orientation':       85,
      'Unlearning Ability':         62,
      'Technology Adaptability':    74,
      'Reflection & Self-awareness':81,
      'Growth Drive':               79,
    },
    dimensionScores: {
      'Feedback Receptivity':       80,
      'Learning Agility':           77,
      'Change Adaptability':        69,
      'Self-Improvement Drive':     82,
      'Reflection Depth':           75,
    },
    greenFlags: [
      'Strong learning motivation',
      'High self-awareness',
      'Actively seeks feedback',
    ],
    amberFlags: [
      'May resist unlearning established habits',
      'Technology adoption pace could improve',
    ],
  },
};

// ECTI — executive critical thinking
const ECTI_REPORT = {
  ectiResults: {
    percentage:  74,
    band:        'Executive Ready',
    percentile:  79,
    summary:     'Alex demonstrates strong executive critical thinking with notable proficiency in strategic foresight and commercial acumen. Ambiguity tolerance remains an area for targeted development.',
    clusters: {
      'Strategic Foresight':    80,
      'Ambiguity Tolerance':    65,
      'Ethical Judgement':      82,
      'Commercial Acumen':      76,
      'Systems Thinking':       72,
    },
    dimensions: {
      'Pattern Recognition':    78,
      'Hypothesis Testing':     74,
      'Decision Under Pressure':71,
      'Stakeholder Framing':    80,
      'Risk Calibration':       69,
      'Data Interpretation':    77,
      'Ethical Reasoning':      83,
      'Commercial Impact':      75,
    },
  },
};

// ── RUNNER ───────────────────────────────────────────────────────
const run = async () => {
  console.log('\n🚀  MindMill Report Generator — All Types\n');
  console.log(`📁  Output: ${OUTPUT}\n`);

  const tasks = [

    // ── 1. DISC Comprehensive ──────────────────────────────────
    {
      label: 'disc-comprehensive.pdf',
      fn: () => pdfSvc.generateDiscReportPdf(DISC_REPORT, TAKER),
    },

    // ── 2. DISC Summary (quick summary template) ───────────────
    {
      label: 'disc-summary.pdf',
      fn: () => pdfSvc.generateQuickSummaryPdf('disc', DISC_REPORT, TAKER),
    },

    // ── 3. Big Five Comprehensive ──────────────────────────────
    {
      label: 'big5-comprehensive.pdf',
      fn: () => pdfSvc.generateBig5ReportPdf(BIG5_REPORT, TAKER),
    },

    // ── 4. Big Five Summary ────────────────────────────────────
    {
      label: 'big5-summary.pdf',
      fn: () => pdfSvc.generateQuickSummaryPdf('big5', BIG5_REPORT, TAKER),
    },

    // ── 5. FIRO-B Comprehensive ────────────────────────────────
    {
      label: 'firo-comprehensive.pdf',
      fn: () => pdfSvc.generateFiroReportPdf(FIRO_REPORT, TAKER, { type: 'comprehensive' }),
    },

    // ── 6. FIRO-B Summary ─────────────────────────────────────
    {
      label: 'firo-summary.pdf',
      fn: () => pdfSvc.generateQuickSummaryPdf('firo', FIRO_REPORT.firoResults, TAKER),
    },

    // ── 7. MBTI Comprehensive ──────────────────────────────────
    {
      label: 'mbti-comprehensive.pdf',
      fn: () => pdfSvc.generateMbtiReportPdf(MBTI_REPORT, TAKER),
    },

    // ── 8. MBTI Summary ───────────────────────────────────────
    {
      label: 'mbti-summary.pdf',
      fn: () => pdfSvc.generateQuickSummaryPdf('mbti', MBTI_REPORT, TAKER),
    },

    // ── 9. Hogan Comprehensive ─────────────────────────────────
    {
      label: 'hogan-comprehensive.pdf',
      fn: () => pdfSvc.generateHoganReportPdf(HOGAN_REPORT, TAKER),
    },

    // ── 10. SJT Comprehensive ─────────────────────────────────
    {
      label: 'sjt-comprehensive.pdf',
      fn: () => pdfSvc.generateSjtReportPdf(SJT_REPORT, TAKER, { summary: false }),
    },

    // ── 11. SJT Summary ───────────────────────────────────────
    {
      label: 'sjt-summary.pdf',
      fn: () => pdfSvc.generateSjtReportPdf(SJT_REPORT, TAKER, { summary: true }),
    },

    // ── 12. PCLA Comprehensive ────────────────────────────────
    {
      label: 'pcla-comprehensive.pdf',
      fn: () => pdfSvc.generatePclaReportPdf(PCLA_REPORT, TAKER, { summary: false }),
    },

    // ── 13. PCLA Summary ──────────────────────────────────────
    {
      label: 'pcla-summary.pdf',
      fn: () => pdfSvc.generatePclaReportPdf(PCLA_REPORT, TAKER, { summary: true }),
    },

    // ── 14. ECTI Comprehensive ────────────────────────────────
    {
      label: 'ecti-comprehensive.pdf',
      fn: () => pdfSvc.generateEctiReportPdf(ECTI_REPORT, TAKER),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const task of tasks) {
    process.stdout.write(`  ⏳  Generating ${task.label} ... `);
    const t0 = Date.now();
    try {
      const buf = await task.fn();
      if (!buf || buf.length < 500) throw new Error('PDF buffer too small — likely render error');
      await save(task.label, buf);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  [${elapsed}s]`);
      passed++;
    } catch (err) {
      console.log(`\n  ❌  FAILED: ${task.label}`);
      console.error(`     ${err.message}`);
      if (process.env.VERBOSE) console.error(err.stack);
      failed++;
    }
  }

  console.log('\n─────────────────────────────────────────────────────');
  console.log(`  📊  Results: ${passed} passed, ${failed} failed`);
  console.log(`  📁  PDFs saved to: ${OUTPUT}`);
  console.log('─────────────────────────────────────────────────────\n');

  if (failed > 0) process.exit(1);
};

run().catch(err => {
  console.error('\n💥  Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
