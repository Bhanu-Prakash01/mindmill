const { chromium } = require('playwright');
const fs        = require('fs');
const path      = require('path');

const {
  generateDISCNarratives,
  generateBig5Narratives,
  getDISCStaticData,
  getBig5StaticData,
  generateFIRONarratives,
  getFIROStaticData,
  DISC_TRAITS,
  BIG5_TRAITS,
} = require('./llmReportService');

// ─────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────

let LOGO_BASE64Cache = null;
const getLogoBase64 = () => {
  if (LOGO_BASE64Cache) return LOGO_BASE64Cache;
  try {
    const p = path.resolve(__dirname, '../../frontend/public/logo.png');
    if (fs.existsSync(p)) {
       LOGO_BASE64Cache = fs.readFileSync(p).toString('base64');
    }
  } catch(err) {}
  return LOGO_BASE64Cache || '';
};

const getAttemptMetrics = (testTaker) => {
  const qAttempted = testTaker?.answeredQuestions || 0;
  const qTotal = testTaker?.totalQuestions || 0;
  const attemptPct = qTotal > 0 ? Math.round((qAttempted / qTotal) * 100) : 100;
  const timeSpent = testTaker?.timeSpent || 0;
  const timeTakenMins = Math.max(1, Math.round(timeSpent / 60));
  
  let startTimeFormatted = 'N/A';
  if (testTaker?.startedAt) {
     startTimeFormatted = new Date(testTaker.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return {
    logoBase64: `data:image/png;base64,${getLogoBase64()}`,
    startTimeFormatted,
    timeTakenMins,
    averageTimeMins: 15,
    attemptPct,
    hasAttemptMetrics: !!testTaker?.startedAt,
  };
};

const readTemplate = (name) =>
  fs.readFileSync(path.join(__dirname, '../templates/reports', name), 'utf8');

/** Escape a value for HTML injection */
const esc = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Lightweight handlebars-style renderer.
 * Supports: {{key}}, {{#each arr}}...{{/each}}, {{#if val}}...{{/if}}
 */
const render = (template, data) => {
  let out = template;

  // {{#each key}} ... {{/each}}
  out = out.replace(/\{\{#each (\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, keyPath, inner) => {
      const items = keyPath.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : []), data);
      if (!Array.isArray(items) || !items.length) return '';
      return items.map((item, idx) => {
        let row = inner;
        if (item && typeof item === 'object') {
          Object.entries(item).forEach(([k, v]) => {
            row = row.replace(new RegExp(`\\{\\{this\\.${k}\\}\\}`, 'g'), esc(v));
            row = row.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), esc(v));
          });
        } else {
          row = row.replace(/\{\{this\}\}/g, esc(item));
        }
        row = row
          .replace(/\{\{addOne @index\}\}/g, String(idx + 1))
          .replace(/\{\{@index\}\}/g, String(idx));
        return row;
      }).join('');
    }
  );

  // {{#if key}} ... {{/if}}
  out = out.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, inner) =>
    data[key] ? inner : ''
  );

  // Deep key access   {{a.b.c}}
  const deepReplace = (tpl, ctx) =>
    tpl.replace(/\{\{([\w.]+)\}\}/g, (_, keyPath) => {
      const v = keyPath.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : ''), ctx);
      return v != null ? String(v) : '';
    });

  return deepReplace(out, data);
};

/** Convert multi-paragraph text (separated by \n\n) → HTML <p> tags */
const paragraphsToHtml = (text = '') =>
  (text || '')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${esc(p)}</p>`)
    .join('\n');

/** Pause; used to simulate "paragraph break" in a single narrative */
const paras = paragraphsToHtml;

// ─────────────────────────────────────────────────────────────────
// SVG HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a 4-axis radar SVG for DISC (D, I, S, C).
 * Returns an inline SVG string.
 */
const generateDiscRadarSvg = (scores) => {
  const cx = 100, cy = 100, r = 80;
  const pts = [
    { angle: -90, score: scores.D, color: '#EF4444', label: 'D' }, // top
    { angle:   0, score: scores.I, color: '#F59E0B', label: 'I' }, // right
    { angle:  90, score: scores.S, color: '#10B981', label: 'S' }, // bottom
    { angle: 180, score: scores.C, color: '#3B82F6', label: 'C' }, // left
  ];

  const toXY = (angle, pct, maxR) => {
    const rad = (angle * Math.PI) / 180;
    const dist = maxR * (pct / 100);
    return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) };
  };

  // Grid circles
  const gridCircles = [20, 40, 60, 80, 100].map(pct => {
    const gridR = r * (pct / 100);
    return `<circle cx="${cx}" cy="${cy}" r="${gridR}" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>`;
  }).join('');

  // Axis lines
  const axisLines = pts.map(({ angle }) => {
    const end = toXY(angle, 100, r);
    return `<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>`;
  }).join('');

  // Data polygon
  const polyPoints = pts.map(({ angle, score }) => {
    const p = toXY(angle, score, r);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Colored dots at tips
  const dots = pts.map(({ angle, score, color, label }) => {
    const p = toXY(angle, score, r);
    const lab = toXY(angle, 112, r);
    return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}"/>
            <text x="${lab.x}" y="${lab.y}" text-anchor="middle" dominant-baseline="central"
                  font-family="DM Sans, Inter, sans-serif" font-size="11" font-weight="700"
                  fill="${color}">${label}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  ${gridCircles}
  ${axisLines}
  <polygon points="${polyPoints}" fill="rgba(200,200,220,0.15)" stroke="rgba(255,255,255,0.95)" stroke-width="2.5" stroke-linejoin="round"/>
  ${dots}
</svg>`;
};

/**
 * Generate an OCEAN pentagon SVG for Big Five.
 * Pentagon points ordered: top (O), top-right (C), bottom-right (E), bottom-left (A), top-left (N)
 */
const generateOceanPentagonSvg = (scores) => {
  const cx = 100, cy = 105, r = 80;
  const angles = [-90, -18, 54, 126, 198]; // Pentagon vertices
  const keys   = ['Openness','Conscientiousness','Extraversion','Agreeableness','Neuroticism'];
  const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#10B981', '#EF4444'];
  const labels = ['O', 'C', 'E', 'A', 'N'];

  const toXY = (angle, pct) => {
    const rad = (angle * Math.PI) / 180;
    const dist = r * (pct / 100);
    return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) };
  };

  // Grid pentagons at 20 / 40 / 60 / 80 / 100%
  const gridLines = [20, 40, 60, 80, 100].map(pct => {
    const pts = angles.map(a => { const p = toXY(a, pct); return `${p.x},${p.y}`; }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>`;
  }).join('');

  // Axis lines
  const axisLines = angles.map(a => {
    const end = toXY(a, 100);
    return `<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>`;
  }).join('');

  // Data polygon
  const polyPoints = keys.map((k, i) => {
    const p = toXY(angles[i], scores[k] || 0);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Dots and labels
  const dots = keys.map((k, i) => {
    const p = toXY(angles[i], scores[k] || 0);
    const lab = toXY(angles[i], 116);
    return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${colors[i]}"/>
            <text x="${lab.x}" y="${lab.y}" text-anchor="middle" dominant-baseline="central"
                  font-family="DM Sans, Inter, sans-serif" font-size="11" font-weight="700"
                  fill="${colors[i]}">${labels[i]}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="210" viewBox="0 0 210 210">
  ${gridLines}
  ${axisLines}
  <polygon points="${polyPoints}" fill="rgba(200,200,220,0.15)" stroke="rgba(255,255,255,0.95)" stroke-width="2.5" stroke-linejoin="round"/>
  ${dots}
</svg>`;
};

/**
 * CSS ring stroke-dashoffset for a ring with circumference ~201 (r=32)
 */
const ringOffset = (pct) => Math.round(201 - (201 * Math.min(pct, 100)) / 100);

// ─────────────────────────────────────────────────────────────────
// PDF GENERATION
// ─────────────────────────────────────────────────────────────────

const generatePdfFromHtml = async (html) => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

const REPORTS_DIR = path.join(__dirname, '../uploads/reports');

const ensureReportsDir = () => {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
};

const savePdfToDisk = async (buffer, reportId, type) => {
  ensureReportsDir();
  const filename = `${reportId}_${type}_${Date.now()}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return filepath;
};

const getCachedPdf = (reportId, type) => {
  ensureReportsDir();
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.startsWith(`${reportId}_${type}_`));
  if (files.length === 0) return null;
  const latestFile = files
    .map(f => ({ name: f, ts: parseInt(f.split('_').pop(), 10) }))
    .sort((a, b) => b.ts - a.ts)[0].name;
  const filepath = path.join(REPORTS_DIR, latestFile);
  return fs.readFileSync(filepath);
};

const deleteCachedPdfs = (reportId) => {
  ensureReportsDir();
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.startsWith(`${reportId}_`));
  files.forEach(f => {
    fs.unlinkSync(path.join(REPORTS_DIR, f));
  });
};

// ─────────────────────────────────────────────────────────────────
// DISC REPORT
// ─────────────────────────────────────────────────────────────────

const generateDiscReportPdf = async (report, testTaker, options = {}) => {
  try {
    // Normalise: Mongoose documents must be plain objects for property access
    const reportObj = report?.toObject ? report.toObject() : report;

    // Parallel: LLM narratives + static data (no waiting dependency)
    const [narratives, staticData] = await Promise.all([
      generateDISCNarratives(reportObj, testTaker),
      Promise.resolve(getDISCStaticData(reportObj)),
    ]);

    const { dominant, secondary, pattern, scores } = staticData;
    const dTrait = DISC_TRAITS[dominant] || DISC_TRAITS.D;
    const sTrait = DISC_TRAITS[secondary] || {};

    // Build trait descriptions (score-level conditional text)
    const descFor = (key) => {
      const t = DISC_TRAITS[key];
      if (!t) return '';
      return scores[key] >= 50 ? t.high : t.low;
    };

    // Pattern interpretation blurb (static)
    const patternInterpretation =
      `${staticData.candidateName || testTaker?.name || 'This candidate'} presents a ` +
      `${dTrait.name}-dominant (${scores.D}%) personality with a notable ${sTrait.name || secondary} ` +
      `secondary dimension (${scores[secondary] || 0}%). This ${pattern} pattern — "${staticData.patternName}" — ` +
      `combines ${dTrait.tagline?.toLowerCase() || 'direct, results-driven tendencies'} ` +
      `with ${sTrait.tagline?.toLowerCase() || 'secondary behavioral characteristics'}, ` +
      `creating a distinctive profile suited to high-impact, ${staticData.idealRoles?.[0] || 'results-oriented'} environments.`;

    /** Split leadership narrative into two <p> blocks */
    const leadershipHtml = paras(narratives.leadershipInsight);
    const deepProfileHtml = paras(narratives.deepProfile);
    const developmentHtml = narratives.developmentNarrative?.split(/\n\n/)?.[0] || '';

    const templateData = {
      /* meta */
      candidateName:  esc(testTaker?.name || 'N/A'),
      candidateEmail: esc(testTaker?.email || 'N/A'),
      assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

      /* pattern */
      pattern,
      patternName:      esc(staticData.patternName),
      patternArchetype: esc(staticData.patternArchetype),
      dominantName:     esc(dTrait.name),
      secondaryName:    esc(sTrait.name || secondary),
      dominantColor:    dTrait.color,
      dominantGradient: dTrait.gradient,

      /* scores */
      dScore: scores.D,
      iScore: scores.I,
      sScore: scores.S,
      cScore: scores.C,

      /* ring offsets */
      dDashOffset: ringOffset(scores.D),
      iDashOffset: ringOffset(scores.I),
      sDashOffset: ringOffset(scores.S),
      cDashOffset: ringOffset(scores.C),

      /* trait descriptions */
      dDescription: descFor('D'),
      iDescription: descFor('I'),
      sDescription: descFor('S'),
      cDescription: descFor('C'),

      /* pattern interpretation */
      patternInterpretation: esc(patternInterpretation),

      /* lists */
      strengths:       staticData.strengths,
      growthAreas:     staticData.growthAreas,
      motivators:      staticData.motivators,
      demotivators:    staticData.demotivators,
      careerPaths:     staticData.careerPaths,
      interviewTips:   staticData.interviewTips,
      idealRoles:      staticData.idealRoles,
      shortTermGoals:  staticData.shortTermGoals,
      longTermGoals:   staticData.longTermGoals,

      /* workplace prefs for page 6 */
      workplaceEnvironment: 'Fast-Paced & Results-Focused',
      workplacePace:        'High-Energy & Decisive',
      feedbackPreference:   'Direct & Outcome-Oriented',
      autonomyLevel:        'High Autonomy Preferred',

      /* LLM narratives */
      coverSummary:    esc(narratives.coverSummary),
      deepProfileHtml,
      leadershipHtml,
      developmentHtml: esc(developmentHtml),
      closingInsight:  esc(narratives.closingInsight),

      /* SVGs */
      radarSvg: generateDiscRadarSvg(scores),

      /* Common Metrics */
      ...getAttemptMetrics(testTaker),
    };

    const template = readTemplate('disc-comprehensive.html');
    const html = render(template, templateData);
    return await generatePdfFromHtml(html);
  } catch (err) {
    console.error('DISC PDF generation error:', err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────
// BIG5 REPORT
// ─────────────────────────────────────────────────────────────────

const scoreBand = (score) => {
  if (score >= 75) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  if (score >= 25) return 'Low';
  return 'Very Low';
};

const generateBig5ReportPdf = async (report, testTaker, options = {}) => {
  try {
    // Normalise: Mongoose documents must be plain objects for property access
    const reportObj = report?.toObject ? report.toObject() : report;

    const [narratives, staticData] = await Promise.all([
      generateBig5Narratives(reportObj, testTaker),
      Promise.resolve(getBig5StaticData(reportObj)),
    ]);

    const { scores, topTrait, traitData } = staticData;
    const topTraitInfo = BIG5_TRAITS[topTrait] || BIG5_TRAITS.Conscientiousness;
    const prefs = staticData.workplacePrefs || {};

    const descFor = (key) => {
      const t = BIG5_TRAITS[key];
      if (!t) return '';
      // Compare percentile (0-100), not raw score (0-40); >= 50% = high
      return Math.round(((scores[key] || 0) / 40) * 100) >= 50 ? t.high : t.low;
    };

    const leadershipHtml = paras(narratives.leadershipInsight);
    const deepProfileHtml = paras(narratives.deepProfile);
    const developmentHtml = narratives.developmentNarrative?.split(/\n\n/)?.[0] || '';

    // Big5 motivators/demotivators — derived from profile
    const motivatorsMap = {
      Openness:          ['Creative freedom and latitude to experiment', 'Intellectual stimulation and new challenges', 'Diverse projects that prevent monotony', 'Freedom to explore and ideate', 'Environments that reward curiosity'],
      Conscientiousness: ['Clear goals with measurable outcomes', 'Recognition for precision and thoroughness', 'Structured environments with predictable expectations', 'Opportunities to continuously improve processes', 'Visible progress toward meaningful targets'],
      Extraversion:      ['Social recognition and public acknowledgment', 'Collaborative, energetic team environments', 'High-visibility stakeholder and client work', 'Opportunities to lead conversations and present ideas', 'Team celebrations and shared wins'],
      Agreeableness:     ['Meaningful relationships with trusted colleagues', 'Work that creates visible positive impact', 'Collaborative environments with mutual respect', 'Feeling genuinely valued by the team', 'Contributing to others\' growth and success'],
      Neuroticism:       ['Genuine support from manager and team', 'Clear role expectations and structured onboarding', 'Stable team relationships and low internal conflict', 'Freedom to build competence before high visibility', 'Regular, positive feedback and encouragement'],
    };

    const demotivatorsMap = {
      Openness:          ['Repetitive, routine work without variation', 'Rigidly structured environments with no flexibility', 'Being unable to explore new approaches', 'Micromanagement of creative process', 'Intellectual stagnation and lack of learning'],
      Conscientiousness: ['Unclear goals or constantly shifting expectations', 'Environments that reward speed over quality', 'Lack of control over output quality', 'Recognition for effort rather than results', 'Chaotic, disorganized work environments'],
      Extraversion:      ['Isolated, independent work for long periods', 'Lack of social interaction or team connection', 'Low-visibility roles with limited stakeholder contact', 'Minimal recognition or acknowledgment', 'Environments where speaking up is discouraged'],
      Agreeableness:     ['Conflict-heavy or politically charged environments', 'Being pressured to harm others for gain', 'Lack of genuine appreciation from leadership', 'Competitive dynamics that require interpersonal aggression', 'Feeling invisible or unappreciated by the team'],
      Neuroticism:       ['Sudden, unexplained organizational change', 'Public criticism or high-stakes failure exposure', 'Environments with unpredictable expectations', 'Lack of clear guidance and regular check-ins', 'Isolation without access to support or feedback'],
    };

    const motivators  = motivatorsMap[topTrait]  || motivatorsMap.Conscientiousness;
    const demotivators = demotivatorsMap[topTrait] || demotivatorsMap.Conscientiousness;

    // Convert raw scores (0-40 scale) to percentiles (0-100) for display
    const toPercentile = (raw) => Math.round((raw / 40) * 100);
    const percentiles = {
      Openness:          toPercentile(scores.Openness),
      Conscientiousness: toPercentile(scores.Conscientiousness),
      Extraversion:      toPercentile(scores.Extraversion),
      Agreeableness:     toPercentile(scores.Agreeableness),
      Neuroticism:       toPercentile(scores.Neuroticism),
    };

    const templateData = {
      /* meta */
      candidateName:  esc(testTaker?.name || 'N/A'),
      candidateEmail: esc(testTaker?.email || 'N/A'),
      assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

      /* top trait */
      topTraitColor: topTraitInfo.color,
      topTraitName:  esc(topTraitInfo.fullName),

      /* scores — use percentiles (0-100) for display, not raw (0-40) */
      oScore: percentiles.Openness,
      cScore: percentiles.Conscientiousness,
      eScore: percentiles.Extraversion,
      aScore: percentiles.Agreeableness,
      nScore: percentiles.Neuroticism,

      /* bands — based on percentile scale */
      oBand: scoreBand(percentiles.Openness),
      cBand: scoreBand(percentiles.Conscientiousness),
      eBand: scoreBand(percentiles.Extraversion),
      aBand: scoreBand(percentiles.Agreeableness),
      nBand: scoreBand(percentiles.Neuroticism),

      /* trait descriptions */
      oDescription: descFor('Openness'),
      cDescription: descFor('Conscientiousness'),
      eDescription: descFor('Extraversion'),
      aDescription: descFor('Agreeableness'),
      nDescription: descFor('Neuroticism'),

      /* lists */
      strengths:         staticData.strengths,
      growthAreas:       staticData.wellbeingStrategies || staticData.wellbeingStrengths || [],
      careerPaths:       staticData.careerPaths,
      interviewTips:     staticData.interviewTips,
      wellbeingStrengths: staticData.wellbeingStrengths,
      wellbeingStrategies: staticData.wellbeingStrategies,
      wellbeingPractices:  staticData.wellbeingStrengths || [],
      idealEnvironments:   staticData.wellbeingStrategies || [],
      shortTermGoals:    staticData.shortTermGoals,
      longTermGoals:     staticData.longTermGoals,
      motivators,
      demotivators,

      /* workplace prefs */
      workplaceEnvironment: prefs.environment || 'Structured & Collaborative',
      workplacePace:        prefs.pace || 'Steady & Purposeful',
      feedbackPreference:   prefs.feedback || 'Constructive & Regular',
      autonomyLevel:        prefs.autonomy || 'Moderate',
      structureLevel:       prefs.structure || 'Collaborative & Flexible',
      collaborationStyle:   prefs.collaboration || 'Team-Oriented',

      /* top trait extra */
      topTraitLetter: topTrait.charAt(0),
      profileInterpretation: esc(
        `${testTaker?.name || 'This candidate'}'s OCEAN profile is shaped by a dominant ` +
        `${topTraitInfo.fullName} dimension (${percentiles[topTrait] || 0}%). ` +
        `This produces a distinctive behavioral signature characterized by ` +
        `${topTraitInfo.high || 'strong characteristic tendencies'}, ` +
        `which profoundly influences how they approach their work, relationships, and decision-making.`
      ),

      /* LLM narratives */
      coverSummary:    esc(narratives.coverSummary),
      deepProfileHtml,
      leadershipHtml,
      developmentHtml: esc(developmentHtml),
      closingInsight:  esc(narratives.closingInsight),

      /* SVG — pass percentile values so the pentagon scales correctly */
      pentagonSvg: generateOceanPentagonSvg(percentiles),

      /* Common Metrics */
      ...getAttemptMetrics(testTaker),
    };

    const template = readTemplate('big5-comprehensive.html');
    const html = render(template, templateData);
    return await generatePdfFromHtml(html);
  } catch (err) {
    console.error('Big5 PDF generation error:', err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────
// FIRO-B REPORT
// ─────────────────────────────────────────────────────────────────

const generateFiroReportPdf = async (report, testTaker, options = {}) => {
  try {
    // Normalise: Mongoose documents must be plain objects for property access
    const reportPlain = report?.toObject ? report.toObject() : report;
    let firoData;

    // Priority 1: Attempt with firoResults directly
    const firoResults = reportPlain.firoResults;
    if (firoResults?.dimensions) {
      firoData = { dimensions: firoResults.dimensions, totals: firoResults.totals };
    // Priority 2: Report document with dimensions.FIRO.dimensions
    } else if (reportPlain.dimensions?.FIRO?.dimensions) {
      firoData = {
        dimensions: reportPlain.dimensions.FIRO.dimensions,
        totals: reportPlain.dimensions.FIRO.totals,
      };
    // Priority 3: attempt populated on report document
    } else if (reportPlain.attempt?.firoResults?.dimensions) {
      firoData = {
        dimensions: reportPlain.attempt.firoResults.dimensions,
        totals: reportPlain.attempt.firoResults.totals,
      };
    } else if (reportPlain.FIRO?.dimensions || reportPlain.FIRO?.totals) {
      firoData = { dimensions: reportPlain.FIRO.dimensions, totals: reportPlain.FIRO.totals };
    } else {
      firoData = reportPlain;
    }

    const staticData = getFIROStaticData(firoData);
    const { scores, fulfillment, career, leadership } = staticData;

    const templateData = {
      candidateName:  esc(testTaker?.name || 'N/A'),
      candidateEmail: esc(testTaker?.email || 'N/A'),
      assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

      /* Score matrix */
      eI: scores.eI,
      wI: scores.wI,
      eC: scores.eC,
      wC: scores.wC,
      eA: scores.eA,
      wA: scores.wA,

      /* Totals */
      inclusionTotal:  scores.inclusionTotal,
      controlTotal:    scores.controlTotal,
      affectionTotal:  scores.affectionTotal,
      totalExpressed:  scores.totalExpressed,
      totalWanted:     scores.totalWanted,
      overallTotal:    scores.overallTotal,

      /* Need fulfillment lists (for {{#each ...}}) */
      inclusionFulfillment: fulfillment.Inclusion,
      controlFulfillment:   fulfillment.Control,
      affectionFulfillment: fulfillment.Affection,

      /* Career/environment tips */
      inclusionBand: career.inclusionBand,
      inclusionTips: career.inclusionTips,
      controlBand:   career.controlBand,
      controlTips:   career.controlTips,
      affectionBand: career.affectionBand,
      affectionTips: career.affectionTips,

      /* Leadership */
      highestExpressed: leadership.highestExpressed,
      lowestExpressed:  leadership.lowestExpressed,

      /* LLM narratives — only for comprehensive */
      deepProfileHtml: '',
      leadershipHtml:  '',
      developmentHtml: '',
      closingInsight:  '',

      /* Common Metrics */
      ...getAttemptMetrics(testTaker),
    };

    if (options.type !== 'summary') {
      const narratives = await generateFIRONarratives(firoData, testTaker);
      templateData.coverSummary    = esc(narratives.coverSummary);
      templateData.deepProfileHtml = narratives.deepProfileHtml;
      templateData.leadershipHtml  = narratives.leadershipHtml;
      templateData.developmentHtml = narratives.developmentHtml;
      templateData.closingInsight  = esc(narratives.closingInsight);
    }

    const template = readTemplate('firo-comprehensive.html');
    const html = render(template, templateData);
    return await generatePdfFromHtml(html);
  } catch (err) {
    console.error('FIRO-B PDF generation error:', err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────
// QUICK SUMMARY (kept lean, no LLM call needed for preview)
// ─────────────────────────────────────────────────────────────────

const generateQuickSummaryPdf = async (type, report, testTaker) => {
  const isDisc = type === 'disc';
  const isFiro = type === 'firo' || type === 'firo-b';
  const isMbti = type === 'mbti';
  const isBig5 = type === 'big5' || type === 'bigfive';
  
  const name = testTaker?.name || 'Candidate';
  const email = testTaker?.email || 'N/A';
  
  let title, subtitle, themeColor, themeGradient;
  let scores = [];
  let strengths = [], growthAreas = [], motivators = [], careerPaths = [];

  if (isDisc) {
    const sd = getDISCStaticData(report);
    title = sd.patternName;
    subtitle = "DISC Behavioral Archetype: " + sd.patternArchetype;
    themeColor = '#F59E0B'; // Amber
    themeGradient = 'linear-gradient(135deg, #F59E0B, #FCD34D)';
    
    scores = Object.entries(sd.scores).map(([k, v]) => ({
      label: k,
      name: k === 'D' ? 'Dominance' : k === 'I' ? 'Influence' : k === 'S' ? 'Steadiness' : 'Conscientiousness',
      percentage: v,
color: DISC_TRAITS[k]?.color || themeColor,
      text: `${v}%`
    }));
    
    strengths = sd.strengths?.slice(0, 4) || [];
    growthAreas = sd.growthAreas?.slice(0, 4) || [];
    motivators = sd.motivators?.slice(0, 4) || [];
    careerPaths = sd.careerPaths?.slice(0, 4) || [];

  } else if (isFiro) {
    const sd = getFIROStaticData(report);
    title = "Behavioral Profile";
    subtitle = "Fundamental Interpersonal Relations Orientation";
    themeColor = '#3B82F6'; // Blue
    themeGradient = 'linear-gradient(135deg, #3B82F6, #93C5FD)';
    
    const firoColors = { Inclusion: '#8B5CF6', Control: '#F59E0B', Affection: '#10B981' };
    const max = 18;
    
    scores = [
      { name: 'Inclusion', score: sd.scores.inclusionTotal, label: 'I' },
      { name: 'Control', score: sd.scores.controlTotal, label: 'C' },
      { name: 'Affection', score: sd.scores.affectionTotal, label: 'A' },
    ].map(item => ({
      label: item.label,
      name: item.name,
      percentage: (item.score / max) * 100,
      color: firoColors[item.name],
      text: `${item.score} / 18`
    }));

    // Generate pseudo strengths/growth for summary from the dimensions
    if (sd.dimensions) {
if (sd.dimensions.Expressed) {
         strengths.push(`Inclusion (Expressed): ${sd.dimensions.Expressed.Inclusion.level} - ${sd.dimensions.Expressed.Inclusion.description}`);
         strengths.push(`Control (Expressed): ${sd.dimensions.Expressed.Control.level} - ${sd.dimensions.Expressed.Control.description}`);
      }
if (sd.dimensions.Wanted) {
         motivators.push(`Inclusion (Wanted): ${sd.dimensions.Wanted.Inclusion.level} - ${sd.dimensions.Wanted.Inclusion.description}`);
         careerPaths.push(`Control (Wanted): ${sd.dimensions.Wanted.Control.level} - ${sd.dimensions.Wanted.Control.description}`);
       }
     }

  } else if (isMbti) {
    // Normalize MBTI from any shape: attempt.mbtiResults, report.dimensions.MBTI, or wrapped attempt
    const rawReport = report?.toObject ? report.toObject() : report;
    const mbtiResults = rawReport.mbtiResults
      || rawReport.dimensions?.MBTI
      || rawReport.attempt?.mbtiResults
      || {};
    // If it has .percentages (from scoreMBTI output), unwrap them
    const mbti = mbtiResults.percentages
      ? { ...mbtiResults.percentages, type: mbtiResults.type }
      : mbtiResults;
    const mbtiType = mbti.type || rawReport.analysis?.personalityProfile || 'INTJ';
    const { TYPE_DESCRIPTIONS } = require('../seeders/mbtiQuestions');
    const typeDesc = TYPE_DESCRIPTIONS[mbtiType] || { name: 'Unknown', description: '' };

    title = mbtiType;
    subtitle = "Myers-Briggs Type: " + typeDesc.name;
    themeColor = '#8B5CF6'; // Purple
    themeGradient = 'linear-gradient(135deg, #8B5CF6, #A78BFA)';
    
    const pctEI = mbti.EI ?? 50;
    const pctSN = mbti.SN ?? 50;
    const pctTF = mbti.TF ?? 50;
    const pctJP = mbti.JP ?? 50;
    
scores = [
      { name: 'Extraversion vs Introversion', label: mbtiType[0], percentage: pctEI, color: '#EC4899', text: `${pctEI}%` },
      { name: 'Sensing vs Intuition',       label: mbtiType[1], percentage: pctSN, color: '#F59E0B', text: `${pctSN}%` },
      { name: 'Thinking vs Feeling',        label: mbtiType[2], percentage: pctTF, color: '#10B981', text: `${pctTF}%` },
      { name: 'Judging vs Perceiving',      label: mbtiType[3], percentage: pctJP, color: '#3B82F6', text: `${pctJP}%` },
    ];

    const td = MBTI_TYPE_DATA;
    strengths = (td.strengths[mbtiType] || td.strengths.INTJ).slice(0, 4);
    growthAreas = (td.growthAreas[mbtiType] || td.growthAreas.INTJ).slice(0, 4);
    motivators = (td.motivators[mbtiType] || td.motivators.INTJ).slice(0, 4);
    careerPaths = (td.careerPaths[mbtiType] || td.careerPaths.INTJ).slice(0, 4).map(c => c.title);

  } else {
    // BIG5
    const sd = getBig5StaticData(report);
    title = sd.topTraitName;
    subtitle = 'Big Five (OCEAN) Profile';
    themeColor = '#10B981'; // Emerald/Teal
    themeGradient = 'linear-gradient(135deg, #10B981, #6EE7B7)';

    const colors = { Openness:'#8B5CF6',Conscientiousness:'#3B82F6',Extraversion:'#F59E0B',Agreeableness:'#10B981',Neuroticism:'#EF4444' };
    const letters = { Openness:'O',Conscientiousness:'C',Extraversion:'E',Agreeableness:'A',Neuroticism:'N' };
    
    scores = Object.entries(sd.scores).map(([k, v]) => ({
      label: letters[k],
      name: k,
      percentage: v,
      color: colors[k] || themeColor,
      text: `${v}%`
    }));

    strengths = sd.strengths?.slice(0, 4) || [];
    growthAreas = sd.growthAreas?.slice(0, 4) || [];
    motivators = sd.motivators?.slice(0, 4) || [];
    careerPaths = sd.careerPaths?.slice(0, 4) || [];
  }

  const templateData = {
    assessmentName: isDisc ? 'DISC' : isFiro ? 'FIRO-B' : isMbti ? 'MBTI' : 'Big Five',
    candidateName: esc(name),
    candidateEmail: esc(email),
    assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    title: esc(title),
    subtitle: esc(subtitle),
    themeColor,
    themeGradient,
    scores,
    hasStrengths: strengths.length > 0,
    strengths: strengths.map(esc),
    hasGrowthAreas: growthAreas.length > 0,
    growthAreas: growthAreas.map(esc),
    hasMotivators: motivators.length > 0,
    motivators: motivators.map(esc),
    hasCareerPaths: careerPaths.length > 0,
    careerPaths: careerPaths.map(esc),

    /* Common Metrics */
    ...getAttemptMetrics(testTaker),
  };

  const template = readTemplate('summary-report.html');
  const html = render(template, templateData);
  return await generatePdfFromHtml(html);
};

// ─────────────────────────────────────────────────────────────────
// MBTI REPORT
// ─────────────────────────────────────────────────────────────────

// Static rich content lookup per MBTI type
const MBTI_TYPE_DATA = {
  strengths: {
    INTJ:['Strategic long-range planning','Independent, decisive leadership','Complex problem-solving','Original thinking & innovation','High standards and thoroughness'],
    INTP:['Deep analytical thinking','Creative problem-solving','Intellectual curiosity','Independent exploration','Objective, critical assessment'],
    ENTJ:['Commanding visionary leadership','Strategic planning & execution','Decisive and confident','Efficient team organisation','Long-term goal orientation'],
    ENTP:['Innovative brainstorming','Quick adaptive thinking','Debating and idea synthesis','Broad knowledge integration','Entrepreneurial risk-taking'],
    INFJ:['Visionary, meaningful insight','Deep empathy for individuals','Value-driven decision making','Strategic planning for change','Inspiring others toward purpose'],
    INFP:['Deep empathy and compassion','Creative, original expression','Strong personal integrity','Adaptable, open-minded','Genuine care for others'],
    ENFJ:['Inspiring and motivating others','Strong interpersonal connection','Empathetic leadership','Collaborative team building','Developing others\' potential'],
    ENFP:['Infectious enthusiasm and energy','Creative and imaginative thinking','Strong interpersonal skills','Broad pattern recognition','Championing new possibilities'],
    ISTJ:['Methodical, dependable execution','Detail-oriented thoroughness','Strong sense of duty','Reliable and consistent','Systematic organisation'],
    ISFJ:['Warm, supportive care for others','Meticulous attention to detail','Loyal and dependable commitment','Practical helpfulness','Creating harmonious environments'],
    ESTJ:['Strong administrative leadership','Clear structure and standards','Decisive task management','Reliable follow-through','Effective team direction'],
    ESFJ:['Warm, enthusiastic relationship-building','Practical care for others','Organisational harmony','Loyal team support','Creating welcoming environments'],
    ISTP:['Efficient, hands-on problem solving','Calm under pressure','Logical and objective analysis','Technical mastery','Adaptive troubleshooting'],
    ISFP:['Artistic, sensory creativity','Deep, authentic empathy','Loyal and flexible','Practical aesthetic sensitivity','Living fully in the present'],
    ESTP:['Energetic, action-oriented response','Quick reading of situations','Practical problem solving','Persuasive interpersonal skills','Adaptability in crisis'],
    ESFP:['Warm, entertaining social presence','Spontaneous practical creativity','Building joyful connections','Adaptable and energetic','Motivating through enthusiasm'],
  },
  growthAreas: {
    INTJ:['Balancing perfectionism with pragmatism','Developing emotional awareness','Communicating vision accessibly','Tolerating ambiguity in timelines','Building collaborative trust'],
    INTP:['Following through to completion','Making timely decisions','Communicating concisely','Acknowledging emotional factors','Building accountability systems'],
    ENTJ:['Listening before directing','Exercising patience with slower pace','Delegating trust fully','Recognising emotional needs','Avoiding overcommitment'],
    ENTP:['Prioritising and executing consistently','Managing detail and follow-through','Respecting established processes','Avoiding debate for debate\'s sake','Completing projects before pivoting'],
    INFJ:['Sharing insights before perfecting them','Setting healthy interpersonal limits','Making peace with imperfection','Delegating without over-scrutiny','Resilience through conflict'],
    INFP:['Making objective, timely decisions','Asserting needs in conflict','Managing practical logistics','Prioritising when overwhelmed','Following through consistently'],
    ENFJ:['Setting personal boundaries','Balancing others\' needs with own','Receiving criticism constructively','Delegating without micromanaging','Accepting imperfect compromises'],
    ENFP:['Sustaining focus on one project','Managing time and organisation','Following through on commitments','Tolerating routine tasks','Making dispassionate decisions'],
    ISTJ:['Adapting to unexpected change','Acknowledging others\' emotional states','Considering unconventional approaches','Delegating control','Experimenting with new methods'],
    ISFJ:['Asserting own needs and ideas','Adapting to rapid change','Accepting constructive criticism','Delegating without guilt','Setting firmer interpersonal limits'],
    ESTJ:['Flexibility with unpredictability','Acknowledging emotional intelligence','Listening to minority viewpoints','Patience with slower processes','Empowering rather than directing'],
    ESFJ:['Making unpopular decisions','Managing conflict confidently','Tolerating criticism','Prioritising own development','Dealing with change gracefully'],
    ISTP:['Communicating openly and proactively','Planning ahead strategically','Emotional expression in relationships','Long-term commitment','Working within structured teams'],
    ISFP:['Long-term goal planning','Assertiveness and confidence','Handling criticism','Making difficult decisions','Follow-through on commitments'],
    ESTP:['Long-term strategic patience','Respecting rules and protocols','Completing projects fully','Listening before acting','Managing impulsive decisions'],
    ESFP:['Long-range planning and goals','Managing distraction','Following structured processes','Handling conflict directly','Financial and logistical discipline'],
  },
  motivators: {
    INTJ:['Autonomy to pursue strategic vision','Intellectual challenge and mastery','Complex problems with real impact','A competent team sharing high standards','Freedom from micromanagement'],
    INTP:['Intellectual freedom to explore deeply','Solving genuinely difficult problems','Theoretical and conceptual work','Minimal bureaucratic constraints','Peer debate and idea exchange'],
    ENTJ:['High-impact leadership opportunities','Ambitious, measurable goals','Efficient, capable teams','Clear authority and accountability','Constant strategic challenge'],
    ENTP:['Novel, intellectually stimulating work','Freedom to innovate and disrupt','Debate and mental sparring','Variety and rapid context-switching','Visionary projects'],
    INFJ:['Meaningful work aligned with values','Creating positive systemic change','Deep 1-on-1 relationships','Creative expression and insight','Making a lasting difference'],
    INFP:['Work that reflects personal values','Creative and expressive latitude','Genuine, trusting relationships','Helping others develop','Making a positive difference'],
    ENFJ:['Supporting others\' growth','Leading meaningful initiatives','Harmony and team cohesion','Recognition for contribution','Inspiring collective purpose'],
    ENFP:['Creative, open-ended exploration','Connecting ideas across domains','Energising group experiences','Meaningful human connection','Championing underserved causes'],
    ISTJ:['Clear expectations and standards','Stability and reliable structure','Recognition for thoroughness','Completing meaningful work','Proven, effective methods'],
    ISFJ:['Helping and supporting others','Stable, predictable environments','Recognition for dedication','Close team relationships','Clear role and responsibilities'],
    ESTJ:['Clear organizational goals','Visible results and accomplishments','Managing complex operations','Leading disciplined teams','Being the reliable authority'],
    ESFJ:['Creating harmony and belonging','Being genuinely appreciated','Helping and nurturing others','Collaborative team achievement','Social recognition and warmth'],
    ISTP:['Hands-on technical mastery','Freedom to work independently','Real-world problem solving','Crisis response and adaptation','Skill-building and tool mastery'],
    ISFP:['Creative, sensory work','Authentic self-expression','Helping and caring for others','Flexibility and autonomy','Peaceful, harmonious environments'],
    ESTP:['Fast-paced action and challenge','Crisis response and real results','Negotiation and competitive scenarios','Visible, immediate impact','Social interaction and energy'],
    ESFP:['High-energy social environments','Creative and expressive activities','Making others happy','Variety and spontaneous experience','Being appreciated and celebrated'],
  },
  demotivators: {
    INTJ:['Inefficiency and bureaucratic waste','Being micromanaged or over-monitored','Lack of strategic vision from leadership','Social small-talk obligations','Shallow, unrigorous work'],
    INTP:['Repetitive routine without intellectual challenge','Strict rules without logical rationale','Being forced to decide prematurely','Emotional drama in decision-making','Micromanagement of thinking process'],
    ENTJ:['Incompetence and lack of accountability','Slow, indecisive leadership','Bureaucracy impeding results','Trivial or low-impact work','Being undermined or overruled without reason'],
    ENTP:['Rigid, unchanging procedures','Repetitive or routine tasks','Micromanagement of approach','Ideas dismissed without debate','Stagnant intellectual environments'],
    INFJ:['Work that conflicts with core values','Shallow or manipulative environments','Frequent conflict and interpersonal tension','Bureaucracy impeding meaningful impact','Being unable to complete visionary projects'],
    INFP:['Work that violates personal values','Harsh, critical environments','Conflict and interpersonal aggression','Being forced to compromise integrity','Repetitive, mechanical tasks'],
    ENFJ:['Team disharmony and unresolved conflict','Feeling unappreciated or unseen','Having to make deeply unpopular decisions','Environments lacking empathy','Inability to help or develop others'],
    ENFP:['Routine without variety or novelty','Rigid, micromanaged structures','Having ideas dismissed','Conflict and social drama','Prolonged detail-oriented work'],
    ISTJ:['Sudden, unexplained organizational change','Inefficiency or lack of discipline','Ambiguous expectations','Environments that reward style over substance','Lack of clear protocols'],
    ISFJ:['Conflict and interpersonal tension','Sudden disruptive change','Being taken for granted','Criticism of careful efforts','Unreliable or inconsistent teammates'],
    ESTJ:['Incompetence in direct reports','Broken processes and lack of standards','Indecisive leadership','Being undermined by politics','Emotional decision-making ignoring logic'],
    ESFJ:['Conflict and unresolved tension','Being criticised or unappreciated','Isolation from social interaction','Having to make others unhappy','Environments with interpersonal coldness'],
    ISTP:['Overemotional environments','Strict protocols limiting practical solutions','Constant social demands','Long-term theoretical work without results','Being micromanaged'],
    ISFP:['Conflict and confrontation','Rigid, strict environments','Being pushed to lead when preferring support role','Environments lacking beauty or creativity','Harsh criticism'],
    ESTP:['Slow, bureaucratic decision processes','Abstract, purely theoretical work','Repetitive, low-energy tasks','Being over-prepared for simple situations','Micromanagement'],
    ESFP:['Isolation from others','Rigid, rule-bound environments','Abstract or theoretical work','Conflict and tension without resolution','Long-term planning without immediate results'],
  },
  shortTermGoals: {
    INTJ:['Define a clear 90-day strategic priority','Strengthen one key collaborative relationship','Practice direct, accessible communication','Seek structured feedback on blind spots'],
    INTP:['Set a firm deadline for one ongoing project','Communicate progress to stakeholders weekly','Practice one decision without over-analysis','Join a structured intellectual peer group'],
    ENTJ:['Audit team for accountability gaps','Practice active listening in one-to-ones','Identify one area to delegate fully','Schedule reflective thinking time weekly'],
    ENTP:['Complete one initiative before starting a new one','Build a prioritisation habit for competing ideas','Establish a weekly review routine','Identify one relationship to deepen'],
    INFJ:['Share one insight before it is perfected','Set a boundary with one draining commitment','Schedule solo restoration time','Identify a high-impact project to champion'],
    INFP:['Articulate one key need in a difficult conversation','Build a simple daily prioritisation habit','Complete one practical project fully','Identify an aligned creative outlet'],
    ENFJ:['Set a clear boundary with one overcommitment','Schedule personal reflection time','Practice receiving feedback non-defensively','Delegate one responsibility with full trust'],
    ENFP:['Implement a daily focus system','Complete one project before adopting another','Build a weekly review habit','Identify one critical relationship to deepen'],
    ISTJ:['Identify one process to modernise','Practice presenting ideas before fully formed','Seek one perspective outside your methodology','Set a stretch goal in an ambiguous area'],
    ISFJ:['Assert one important need this week','Identify one task to delegate','Practice self-advocacy in a low-stakes situation','Build a personal development routine'],
    ESTJ:['Practice one listening-first conversation','Identify a process for improvement via feedback','Empower one direct report autonomously','Seek feedback on communication style'],
    ESFJ:['Set one firm boundary to protect your time','Practice objective decision-making in one area','Schedule personal development time','Seek feedback from a trusted colleague'],
    ISTP:['Proactively update a stakeholder on progress','Create a simple 30-day project plan','Practice one open emotional check-in','Join a cross-functional project for breadth'],
    ISFP:['Articulate one personal goal clearly','Build a simple routine for consistency','Seek feedback on one area of development','Identify one boundary to establish'],
    ESTP:['Plan one project two weeks in advance','Practice full listening before responding','Follow one established process deliberately','Build a habit of documenting key decisions'],
    ESFP:['Build a simple weekly planning routine','Practise completing one task at a time','Schedule one focused solo work block daily','Identify one long-term goal with milestones'],
  },
  longTermGoals: {
    INTJ:['Build a high-performance team aligned to long-range vision','Develop emotional intelligence as a strategic leadership asset','Lead a transformational initiative with systemic impact','Cultivate a board-level mentor relationship'],
    INTP:['Publish or present a significant intellectual contribution','Build a system that multiplies your ideas through others','Develop a reliable execution partnership','Lead an R&D or innovation function'],
    ENTJ:['Build and exit a significant organisation or division','Develop a legacy of talent who become leaders themselves','Cultivate emotional intelligence as a C-suite advantage','Create systemic positive organisational change'],
    ENTP:['Launch and scale a disruptive venture or initiative','Build an innovation ecosystem around your ideas','Develop a consistent execution muscle to complement ideation','Become a recognised thought leader in your domain'],
    INFJ:['Lead a purpose-driven organisation or initiative','Develop scalable systems for delivering your vision','Build deep mentoring relationships that outlast you','Create a body of work aligned to your core values'],
    INFP:['Create enduring work that expresses and extends your values','Build authentic influence in your professional community','Develop into a mentor and model for others','Contribute to meaningful systemic change'],
    ENFJ:['Build a high-performing, purpose-aligned team','Develop a coaching or leadership development legacy','Lead a significant community or organisational transformation','Cultivate emotional resilience for long-term leadership'],
    ENFP:['Launch and lead a movement or transformational initiative','Build a creative portfolio with lasting social impact','Cultivate depth and execution to complement your vision','Develop one signature area of mastery'],
    ISTJ:['Build a reputation for reliable, high-standard delivery','Lead a standards body or operational excellence function','Mentor emerging talent in your specialist domain','Develop adaptability as a leadership differentiator'],
    ISFJ:['Build a legacy of genuine service and contribution','Develop assertiveness as a leadership strength','Lead a values-driven team with high loyalty','Create enduring support systems for others'],
    ESTJ:['Lead a complex multi-stakeholder organisation','Build operational systems that outlast your leadership','Mentor a generation of disciplined leaders','Develop empathy as a strategic leadership capability'],
    ESFJ:['Build a thriving, people-first organisational culture','Lead a community or service institution people love','Develop confidence as a strategic decision-maker','Create systems that sustain the warmth you embody'],
    ISTP:['Become the leading technical expert in your domain','Build a scalable system around your practical mastery','Develop your communication to amplify your impact','Lead a high-stakes technical or operational function'],
    ISFP:['Build a creative body of work with lasting impact','Lead a values-aligned team with your unique aesthetic','Develop confidence presenting your ideas to broader audiences','Cultivate your natural empathy into a coaching strength'],
    ESTP:['Build and lead high-performance teams in dynamic markets','Develop strategic patience as a leadership advantage','Create a portfolio of high-impact initiatives','Become a senior adviser in a fast-moving sector'],
    ESFP:['Build a warm, high-energy team culture as a leader','Develop discipline and planning as leadership strengths','Create lasting positive impact through your unique energy','Inspire a community through authentic leadership'],
  },
  idealEnvironments: {
    INTJ:['Autonomous & strategic','Complex problem-focused','High-calibre team','Minimal bureaucracy','Vision-led culture'],
    INTP:['Intellectually stimulating','Freedom to theorise','Flexible deadlines','Peer debate culture','Low political noise'],
    ENTJ:['Fast-paced & ambitious','Meritocratic culture','High-impact mandate','Clear accountability','Visionary leadership'],
    ENTP:['Innovation-friendly','Debate-positive culture','Variety & novelty','Entrepreneurial mindset','Ideas celebrated'],
    INFJ:['Purpose-driven mission','Collaborative & trusting','Creative latitude','Deep work focus time','Minimal conflict'],
    INFP:['Values-aligned organisation','Creative expression welcome','Trusting relationships','Flexible structure','Meaningful contribution'],
    ENFJ:['People-first culture','Collaborative teams','Mission-driven purpose','Recognition of contribution','High psychological safety'],
    ENFP:['Creative & open-ended','Energetic collaboration','Idea-positive culture','Meaningful impact','Flexibility & autonomy'],
    ISTJ:['Clear standards & procedures','Stable & predictable','Meritocratic recognition','Dependable colleagues','Structure and order'],
    ISFJ:['Warm & supportive team','Clear role definition','Stable environment','Recognition for care','Meaningful daily contribution'],
    ESTJ:['Clear hierarchy & accountability','Results-driven culture','Structured processes','Competent colleagues','Visible leadership authority'],
    ESFJ:['Warm & collaborative team','Harmony & mutual support','Social recognition','Stable, caring culture','Service & contribution focus'],
    ISTP:['Hands-on & technical','Autonomous problem-solving','Fast feedback loops','Low interpersonal politics','Practical, real results'],
    ISFP:['Creative & expressive','Low-conflict team dynamics','Flexible autonomy','Supportive relationships','Aesthetic & values-aligned'],
    ESTP:['Fast-moving & dynamic','Competitive energy','Immediate impact visible','Flexible & action-oriented','Social and stimulating'],
    ESFP:['High-energy social environment','Creative & expressive','Warm team culture','Spontaneous & varied','Visible contribution impact'],
  },
  workStyle: {
    INTJ:'Operates as a strategist who thinks far ahead and builds rigorous systems to achieve ambitious goals. Works best with autonomy, high standards, and complex long-horizon challenges. Prefers depth and precision over superficiality.',
    INTP:'Approaches work as an intellectual exploration, dissecting problems to their logical foundations. Thrives when given freedom to theorise and explore. Most productive when shielded from unnecessary meetings and bureaucracy.',
    ENTJ:'Works as a decisive executive who coordinates resources, sets direction, and drives results. Operates with urgency and strategic clarity. Expects high performance and delivers measurable outcomes efficiently.',
    ENTP:'Operates as an innovator who thrives on generating novel ideas and challenging the status quo. Highly energised by brainstorming, debate, and rapid iteration. Transitions best when matched with strong implementation partners.',
    INFJ:'Works as a purposeful visionary who invests deeply in meaningful projects. Prefers collaborative environments with shared values. Balances creative insight with disciplined execution on initiatives that matter.',
    INFP:'Operates authentically from their values, producing creative, heartfelt work when given expressive latitude. Functions best in trusting, empathetic environments. Brings originality and integrity to everything they touch.',
    ENFJ:'Works as a natural orchestrator of people and purpose, channelling energy into building team capability and cohesion. Highly effective in collaborative, emotionally engaged environments where growth is prioritised.',
    ENFP:'Brings boundless creative energy and connective enthusiasm to projects. Works with great spontaneity and breadth, excelling when variety and meaning are present. Most effective with structured partners who support follow-through.',
    ISTJ:'Operates methodically and dependably, executing responsibilities with discipline and thoroughness. Works well within defined roles and established processes. Delivers consistent, high-quality outcomes over time.',
    ISFJ:'Functions as a warm, reliable contributor who supports others while maintaining meticulous quality. Works best in stable, caring environments where contribution is valued and relationships are stable.',
    ESTJ:'Works as a systematic administrator who drives order, standards, and productivity. Excels in clear hierarchical structures with defined expectations. Brings discipline, consistency, and reliable leadership to operations.',
    ESFJ:'Operates as a supportive, relationship-centred collaborator who creates warmth and cohesion. Most effective in socially engaged, appreciation-rich environments where helping others is the priority.',
    ISTP:'Works as a practical troubleshooter and technical expert. Functions best with hands-on challenges and real-time problem-solving. Prefers independence, efficiency, and tangible results over theoretical frameworks.',
    ISFP:'Brings quiet creativity and genuine empathy to their work. Operates best with aesthetic, sensory, or people-centered tasks. Functions well with autonomy and in environments with low conflict and high trust.',
    ESTP:'Operates with high energy and practical decisiveness, excelling in fast-changing environments that demand immediate action. Brings competitive drive and persuasive skill to dynamic, results-oriented roles.',
    ESFP:'Works with infectious enthusiasm and a focus on people and experience. Brings energy, warmth, and creativity to collaborative environments. Most effective when spontaneity and social connection are possible.',
  },
  careerPaths: {
    INTJ:[{title:'Strategic Leadership',description:'C-suite, strategy director, management consultant'},{title:'Research & Science',description:'Research director, data scientist, academic'},{title:'Technology',description:'Systems architect, CTO, product strategist'},{title:'Finance & Investment',description:'Hedge fund analyst, financial planner, economist'},{title:'Law & Policy',description:'Barrister, policy director, judge'}],
    INTP:[{title:'Research & Analysis',description:'Scientist, analyst, mathematician, researcher'},{title:'Technology',description:'Software engineer, systems architect, AI researcher'},{title:'Academia',description:'Professor, lecturer, knowledge curator'},{title:'Philosophy & Strategy',description:'Philosopher, systems thinker, innovation lead'},{title:'Finance & Data',description:'Quantitative analyst, economist, actuary'}],
    ENTJ:[{title:'Executive Leadership',description:'CEO, managing director, COO'},{title:'Entrepreneurship',description:'Founder, venture capitalist, business developer'},{title:'Consulting',description:'Management consultant, strategy advisor'},{title:'Legal & Advocacy',description:'Barrister, arbitrator, senior counsel'},{title:'Finance',description:'Investment banker, private equity, CFO'}],
    ENTP:[{title:'Entrepreneurship',description:'Founder, product innovator, start-up builder'},{title:'Consulting',description:'Strategy consultant, innovation adviser'},{title:'Legal & Debate',description:'Barrister, lobbyist, policy advocate'},{title:'Media & Ideas',description:'Journalist, broadcaster, thought leader'},{title:'Technology',description:'Product manager, CTO, venture builder'}],
    INFJ:[{title:'Counselling & Coaching',description:'Psychologist, therapist, life coach'},{title:'Social Impact',description:'NGO leader, social entrepreneur, policy maker'},{title:'Writing & Advocacy',description:'Author, journalist, campaigner'},{title:'Medicine',description:'Psychiatrist, GP, holistic practitioner'},{title:'Education',description:'Academic, curriculum designer, professor'}],
    INFP:[{title:'Creative Arts',description:'Writer, poet, filmmaker, musician'},{title:'Counselling',description:'Therapist, counsellor, social worker'},{title:'Education',description:'Teacher, learning designer, coach'},{title:'Non-Profit',description:'Charity leader, advocacy director'},{title:'UX & Design',description:'UX designer, graphic designer, creative lead'}],
    ENFJ:[{title:'Coaching & Development',description:'Executive coach, L&D director, mentor'},{title:'Education',description:'Principal, professor, curriculum designer'},{title:'Politics & Leadership',description:'Politician, community leader, public servant'},{title:'Healthcare',description:'Psychiatrist, counsellor, nurse manager'},{title:'Marketing',description:'Brand director, communications lead, PR'}],
    ENFP:[{title:'Creative & Media',description:'Journalist, filmmaker, content creator'},{title:'Entrepreneurship',description:'Start-up founder, creative director'},{title:'Coaching & Training',description:'Facilitator, coach, motivational speaker'},{title:'Marketing & PR',description:'Brand strategist, campaign creative'},{title:'Social Work',description:'Community director, charity leader'}],
    ISTJ:[{title:'Finance & Accounting',description:'Accountant, auditor, financial controller'},{title:'Law & Compliance',description:'Solicitor, compliance officer, regulator'},{title:'Operations',description:'Operations manager, project manager, administrator'},{title:'Military & Public Service',description:'Officer, civil servant, police'},{title:'Engineering',description:'Civil or structural engineer, quantity surveyor'}],
    ISFJ:[{title:'Healthcare',description:'Nurse, doctor, occupational therapist'},{title:'Education',description:'Teacher, special needs educator, librarian'},{title:'Social Work',description:'Case worker, counsellor, charity worker'},{title:'Administration',description:'Office manager, executive assistant'},{title:'Hospitality',description:'Catering manager, hotel professional'}],
    ESTJ:[{title:'Management & Operations',description:'Operations director, general manager, COO'},{title:'Law & Compliance',description:'Judge, solicitor, compliance director'},{title:'Finance',description:'CFO, financial controller, bank manager'},{title:'Military & Government',description:'Commander, public administrator, politician'},{title:'Real Estate',description:'Property developer, estate agent, surveyor'}],
    ESFJ:[{title:'Healthcare',description:'Nurse, doctor, physiotherapist'},{title:'Education',description:'Teacher, school administrator, librarian'},{title:'Social Services',description:'Social worker, charity coordinator'},{title:'Sales & Customer Success',description:'Account manager, customer director'},{title:'Events',description:'Wedding planner, events manager, hospitality'}],
    ISTP:[{title:'Engineering',description:'Mechanical, electrical or aerospace engineer'},{title:'Technology',description:'Software developer, cybersecurity analyst'},{title:'Trades',description:'Surgeon, pilot, mechanic, electrician'},{title:'Finance',description:'Trader, forensic accountant, quantitative analyst'},{title:'Emergency Services',description:'Paramedic, firefighter, detective'}],
    ISFP:[{title:'Arts & Design',description:'Visual artist, graphic designer, photographer'},{title:'Healthcare',description:'Nurse, physiotherapist, vet'},{title:'Nature & Conservation',description:'Conservationist, forest ranger, zoologist'},{title:'Hospitality',description:'Chef, baker, interior designer'},{title:'Social Care',description:'Support worker, therapist aide'}],
    ESTP:[{title:'Sales & Business',description:'Sales director, entrepreneur, broker'},{title:'Emergency Response',description:'Paramedic, firefighter, police detective'},{title:'Sport & Coaching',description:'Athlete, sports coach, personal trainer'},{title:'Finance & Trading',description:'Trader, investment advisor, financial broker'},{title:'Construction & Engineering',description:'Project manager, site engineer'}],
    ESFP:[{title:'Performance & Media',description:'Actor, musician, broadcaster, presenter'},{title:'Hospitality & Tourism',description:'Events director, travel consultant, chef'},{title:'Education',description:'Primary teacher, children\'s facilitator'},{title:'Sales & Marketing',description:'Brand ambassador, PR manager'},{title:'Healthcare',description:'Nurse, care worker, occupational therapist'}],
  },
};

const generateMbtiReportPdf = async (report, testTaker, options = {}) => {
  try {
    const reportObj = report.toObject ? report.toObject() : report;

    // Resolve MBTI data from multiple possible shapes:
    // Shape A: Attempt document with mbtiResults (from downloadMbtiReport)
    // Shape B: Report document with dimensions.MBTI (from reportController.downloadReport)
    // Shape C: attempt populated on report
    const mbtiResults = reportObj.mbtiResults
      || reportObj.dimensions?.MBTI
      || reportObj.attempt?.mbtiResults
      || {};

    // The dimensions.MBTI sub-document stores EI/SN/TF/JP percentages directly.
    // mbtiResults (from scoring) stores { percentages:{EI,SN,TF,JP}, type, dimensions, ... }
    const mbti = mbtiResults.percentages
      ? { ...mbtiResults.percentages, type: mbtiResults.type, typeName: mbtiResults.name }
      : mbtiResults;  // dimensions.MBTI already has EI, SN, TF, JP at top level

    const type = mbti.type || reportObj.analysis?.personalityProfile || '';
    const fallbackType = type || 'INTJ';
    const { TYPE_DESCRIPTIONS, MBTI_CONFIG } = require('../seeders/mbtiQuestions');
    const { generateCognitiveFunctions } = require('./mbtiScoringService');
    const typeDesc = TYPE_DESCRIPTIONS[fallbackType] || { name: 'Unknown', description: '' };

    const pctEI = mbti.EI ?? 50;
    const pctSN = mbti.SN ?? 50;
    const pctTF = mbti.TF ?? 50;
    const pctJP = mbti.JP ?? 50;

    const [lEI, lSN, lTF, lJP] = fallbackType.split('');
    const labelEI = pctEI > 50 ? MBTI_CONFIG.EI.rightLabel : MBTI_CONFIG.EI.leftLabel;
    const labelSN = pctSN > 50 ? MBTI_CONFIG.SN.rightLabel : MBTI_CONFIG.SN.leftLabel;
    const labelTF = pctTF > 50 ? MBTI_CONFIG.TF.rightLabel : MBTI_CONFIG.TF.leftLabel;
    const labelJP = pctJP > 50 ? MBTI_CONFIG.JP.rightLabel : MBTI_CONFIG.JP.leftLabel;

    const fns = generateCognitiveFunctions(fallbackType);

    // Cross-pressure (score within 12 points of 50 means weak preference)
    const cpDims = [];
    if (Math.abs(pctEI - 50) <= 12) cpDims.push('E/I');
    if (Math.abs(pctSN - 50) <= 12) cpDims.push('S/N');
    if (Math.abs(pctTF - 50) <= 12) cpDims.push('T/F');
    if (Math.abs(pctJP - 50) <= 12) cpDims.push('J/P');
    const hasCrossPressure = cpDims.length > 0;

    // Static per-type content
    const td = MBTI_TYPE_DATA;
    const strengths    = td.strengths[fallbackType]    || td.strengths.INTJ;
    const growthAreas  = td.growthAreas[fallbackType]  || td.growthAreas.INTJ;
    const motivators   = td.motivators[fallbackType]   || td.motivators.INTJ;
    const demotivators = td.demotivators[fallbackType] || td.demotivators.INTJ;
    const shortTerm    = td.shortTermGoals[fallbackType] || td.shortTermGoals.INTJ;
    const longTerm     = td.longTermGoals[fallbackType]  || td.longTermGoals.INTJ;
    const idealEnvs    = td.idealEnvironments[fallbackType] || td.idealEnvironments.INTJ;
    const workStyle    = td.workStyle[fallbackType] || td.workStyle.INTJ;
    const careerPaths  = td.careerPaths[fallbackType]  || td.careerPaths.INTJ;

    // Dimension-level description (short)
    const descFor = (dim, letter) => {
      const c = MBTI_CONFIG[dim];
      return letter === c.leftLabel.charAt(0) || letter === 'I' || letter === 'S' || letter === 'T' || letter === 'J'
        ? c.leftCharacteristics?.join(' · ') || ''
        : c.rightCharacteristics?.join(' · ') || '';
    };
    const descEI = descFor('EI', lEI);
    const descSN = descFor('SN', lSN);
    const descTF = descFor('TF', lTF);
    const descJP = descFor('JP', lJP);

    // Work style tags
    const wsTagColors = ['#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6'];
    const wsTagLabels = [
      lEI === 'I' ? 'Introvert Focus' : 'Extravert Energy',
      lSN === 'S' ? 'Pragmatic Thinker' : 'Visionary Thinker',
      lTF === 'T' ? 'Logic-Driven' : 'Values-Driven',
      lJP === 'J' ? 'Structured Planner' : 'Flexible Explorer',
      typeDesc.name || type
    ];
    const workStyleTags = wsTagLabels.map((label, i) => ({ label, color: wsTagColors[i] }));

    const templateData = {
      /* meta */
      candidateName:  esc(testTaker?.name || 'N/A'),
      candidateEmail: esc(testTaker?.email || 'N/A'),
      assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

      /* type */
      mbtiType:        fallbackType,
      typeName:        esc(typeDesc.name),
      typeDescription: esc(typeDesc.description),

      /* 4 dimension letters */
      letterEI: lEI, labelEI: esc(labelEI), pctEI, descEI: esc(descEI),
      letterSN: lSN, labelSN: esc(labelSN), pctSN, descSN: esc(descSN),
      letterTF: lTF, labelTF: esc(labelTF), pctTF, descTF: esc(descTF),
      letterJP: lJP, labelJP: esc(labelJP), pctJP, descJP: esc(descJP),

      /* cross-pressure */
      hasCrossPressure,
      crossPressureDimensions: cpDims.join(', '),

      /* cognitive functions */
      fn0: fns[0] || '—', fn1: fns[1] || '—', fn2: fns[2] || '—', fn3: fns[3] || '—',
      fn4: fns[4] || '', fn5: fns[5] || '', fn6: fns[6] || '', fn7: fns[7] || '',

      /* lists */
      strengths,
      growthAreas,
      motivators,
      demotivators,
      shortTermGoals: shortTerm,
      longTermGoals:  longTerm,
      idealEnvironments: idealEnvs,
      workStyleTags,
      careerPaths,

      /* work style */
      workStyle: esc(workStyle),

      deepProfileHtml: '',
      leadershipHtml:  '',
      developmentHtml: '',
      closingInsight:  esc(`${testTaker?.name || 'This candidate'} is an ${fallbackType} — the ${typeDesc.name}. Their personality profile represents a clear asset for the right environment, and understanding their interpersonal style will unlock their full potential as a contributor and leader.`),

      /* Common Metrics */
      ...getAttemptMetrics(testTaker),
    };

    const template = readTemplate('mbti-comprehensive.html');
    const html = render(template, templateData);
    return await generatePdfFromHtml(html);
  } catch (err) {
    console.error('MBTI PDF generation error:', err);
    throw err;
  }
};

const generateGenericReportPdf = async (report) => {
  const name = report.testTakerName || (report.user ? `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() : null) || 'Candidate';
  const score = report.scores?.percentage || 0;
  
  const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;background:#0F172A;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.card{background:#fff;border-radius:20px;padding:48px;max-width:480px;width:100%;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,0.3);}
.brand{font-size:13px;font-weight:700;color:#6366F1;letter-spacing:1px;margin-bottom:24px;}
.big-name{font-family:'DM Serif Display',serif;font-size:36px;line-height:1.1;color:#0F172A;margin-bottom:6px;}
.sub{font-size:12px;color:#64748B;margin-bottom:32px;}
.scores{margin-bottom:32px;text-align:left;}
.footer{font-size:9px;color:#94A3B8;margin-top:24px;}
</style></head><body>
<div class="card">
  <div class="brand">Mindmil · Standard Assessment</div>
  <div class="big-name">${esc(name)}</div>
  <div class="sub">Assessment Report</div>
  <div class="scores" style="text-align:center;">
    <div style="font-size:48px;font-weight:700;color:#6366F1;margin-bottom:8px;">${Math.round(score)}%</div>
    <div style="font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:2px;">Overall Score</div>
  </div>
  <div class="footer">Generated by Mindmil · ${new Date().toLocaleDateString()}</div>
</div>
</body></html>`;

  return await generatePdfFromHtml(html);
};

// ─────────────────────────────────────────────────────────────────
// HOGAN REPORT
// ─────────────────────────────────────────────────────────────────

const HOGAN_SCALES = {
  Adjustment: { name: 'Adjustment', color: '#6366F1', description: 'Ability to maintain composure under pressure and handle stress' },
  Ambition: { name: 'Ambition', color: '#10B981', description: 'Desire for achievement, leadership, and career advancement' },
  Sociability: { name: 'Sociability', color: '#F59E0B', description: 'Comfort with social interaction and interpersonal engagement' },
  Interpersonal_Sensitivity: { name: 'Interpersonal Sensitivity', color: '#EC4899', description: 'Awareness of how one affects others and sensitivity to criticism' },
  Prudence: { name: 'Prudence', color: '#8B5CF6', description: 'Degree of self-discipline, caution, and responsibility' },
  Inquisitiveness: { name: 'Inquisitiveness', color: '#06B6D4', description: 'Interest in learning, intellectual curiosity, and creative thinking' },
  Learning_Approach: { name: 'Learning Approach', color: '#EF4444', description: 'Attitude toward learning and development opportunities' }
};

const getLevelLabel = (percentile) => {
  if (percentile >= 66) return { label: 'High', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' };
  if (percentile <= 33) return { label: 'Low', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
  return { label: 'Moderate', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' };
};

const generateHoganReportPdf = async (report, testTaker, options = {}) => {
  try {
    const reportObj = report?.toObject ? report.toObject() : report;
    let hoganData = {};
    
    // Priority 1: hoganResults directly on the object (attempt or wrapped attempt)
    const hr = reportObj.hoganResults || reportObj.attempt?.hoganResults;
    if (hr?.percentiles) {
      // Build normalized scale objects from raw hoganResults
      hoganData = {
        Adjustment: { score: hr.rawScores?.Adjustment || 0, percentage: hr.percentiles?.Adjustment || 0, level: hr.levels?.Adjustment || 'Moderate' },
        Ambition: { score: hr.rawScores?.Ambition || 0, percentage: hr.percentiles?.Ambition || 0, level: hr.levels?.Ambition || 'Moderate' },
        Sociability: { score: hr.rawScores?.Sociability || 0, percentage: hr.percentiles?.Sociability || 0, level: hr.levels?.Sociability || 'Moderate' },
        Interpersonal_Sensitivity: { score: hr.rawScores?.Interpersonal_Sensitivity || hr.rawScores?.InterpersonalSensitivity || 0, percentage: hr.percentiles?.Interpersonal_Sensitivity || hr.percentiles?.InterpersonalSensitivity || 0, level: hr.levels?.Interpersonal_Sensitivity || hr.levels?.InterpersonalSensitivity || 'Moderate' },
        Prudence: { score: hr.rawScores?.Prudence || 0, percentage: hr.percentiles?.Prudence || 0, level: hr.levels?.Prudence || 'Moderate' },
        Inquisitiveness: { score: hr.rawScores?.Inquisitiveness || hr.rawScores?.Inquisitive || 0, percentage: hr.percentiles?.Inquisitiveness || hr.percentiles?.Inquisitive || 0, level: hr.levels?.Inquisitiveness || hr.levels?.Inquisitive || 'Moderate' },
        Learning_Approach: { score: hr.rawScores?.Learning_Approach || hr.rawScores?.LearningApproach || 0, percentage: hr.percentiles?.Learning_Approach || hr.percentiles?.LearningApproach || 0, level: hr.levels?.Learning_Approach || hr.levels?.LearningApproach || 'Moderate' }
      };
    // Priority 2: scales object from hoganResults (buildScaleDetails output)
    } else if (hr?.scales) {
      hoganData = hr.scales;
    // Priority 3: dimensions.Hogan from Report document or manually built reportData
    } else {
      hoganData = reportObj.dimensions?.Hogan || {};
    }

    // Ensure we iterate over the canonical 7 scales
    const scaleKeys = ['Adjustment', 'Ambition', 'Sociability', 'Interpersonal_Sensitivity', 'Prudence', 'Inquisitiveness', 'Learning_Approach'];
    const fallbackKeys = { 'Interpersonal_Sensitivity': 'InterpersonalSensitivity', 'Inquisitiveness': 'Inquisitive', 'Learning_Approach': 'LearningApproach' };

    const scales = scaleKeys.map((key) => {
      const scaleInfo = HOGAN_SCALES[key] || { name: key.replace('_', ' '), color: '#6366F1', description: '' };
      const fallbackKey = fallbackKeys[key];
      const value = hoganData[key] || (fallbackKey ? hoganData[fallbackKey] : null) || {};
      
      const percentile = value.percentage ?? value.score ?? 0;
      const level = getLevelLabel(percentile);
      return {
        key,
        name: scaleInfo.name,
        color: scaleInfo.color,
        description: scaleInfo.description,
        percentile,
        rawScore: value.score || value.rawScore || 0,
        level: level.label,
        levelColor: level.color,
        levelBgColor: level.bgColor
      };
    });

    const sortedScales = [...scales].sort((a, b) => b.percentile - a.percentile);
    const domKey = report.dominantScale || reportObj.attempt?.hoganResults?.dominantScale || sortedScales[0]?.key;
    const secKey = report.secondaryScale || reportObj.attempt?.hoganResults?.secondaryScale || sortedScales[1]?.key;
    
    const dominantScale = HOGAN_SCALES[domKey]?.name || domKey || 'N/A';
    const secondaryScale = HOGAN_SCALES[secKey]?.name || secKey || 'N/A';

    const templateData = {
      candidateName: esc(testTaker?.name || 'N/A'),
      candidateEmail: esc(testTaker?.email || 'N/A'),
      assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      dominantScale,
      secondaryScale,
      scales,
      scalesJson: JSON.stringify(scales),
      analysis: report.analysis || {},
      ...getAttemptMetrics(testTaker),
    };

    const template = readTemplate('hogan-comprehensive.html');
    const html = render(template, templateData);
    return await generatePdfFromHtml(html);
  } catch (err) {
    console.error('Hogan PDF generation error:', err);
    throw err;
  }
};

module.exports = {
  generateDiscReportPdf,
  generateBig5ReportPdf,
  generateFiroReportPdf,
  generateMbtiReportPdf,
  generateQuickSummaryPdf,
  generateGenericReportPdf,
  generateHoganReportPdf,
  savePdfToDisk,
  getCachedPdf,
  deleteCachedPdfs,
};
