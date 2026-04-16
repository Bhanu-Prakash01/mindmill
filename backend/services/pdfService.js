const puppeteer = require('puppeteer');
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
    return `<circle cx="${cx}" cy="${cy}" r="${gridR}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  }).join('');

  // Axis lines
  const axisLines = pts.map(({ angle }) => {
    const end = toXY(angle, 100, r);
    return `<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
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
  <polygon points="${polyPoints}" fill="rgba(99,102,241,0.25)" stroke="rgba(99,102,241,0.8)" stroke-width="2" stroke-linejoin="round"/>
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
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  }).join('');

  // Axis lines
  const axisLines = angles.map(a => {
    const end = toXY(a, 100);
    return `<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
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
  <polygon points="${polyPoints}" fill="rgba(99,102,241,0.22)" stroke="rgba(139,92,246,0.8)" stroke-width="2" stroke-linejoin="round"/>
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
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
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
  const latestFile = files.sort().pop();
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
    // Parallel: LLM narratives + static data (no waiting dependency)
    const [narratives, staticData] = await Promise.all([
      generateDISCNarratives(report, testTaker),
      Promise.resolve(getDISCStaticData(report)),
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
    const [narratives, staticData] = await Promise.all([
      generateBig5Narratives(report, testTaker),
      Promise.resolve(getBig5StaticData(report)),
    ]);

    const { scores, topTrait, traitData } = staticData;
    const topTraitInfo = BIG5_TRAITS[topTrait] || BIG5_TRAITS.Conscientiousness;
    const prefs = staticData.workplacePrefs || {};

    const descFor = (key) => {
      const t = BIG5_TRAITS[key];
      if (!t) return '';
      return (scores[key] || 0) >= 50 ? t.high : t.low;
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

    const templateData = {
      /* meta */
      candidateName:  esc(testTaker?.name || 'N/A'),
      candidateEmail: esc(testTaker?.email || 'N/A'),
      assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

      /* top trait */
      topTraitColor: topTraitInfo.color,
      topTraitName:  esc(topTraitInfo.fullName),

      /* scores */
      oScore: scores.Openness,
      cScore: scores.Conscientiousness,
      eScore: scores.Extraversion,
      aScore: scores.Agreeableness,
      nScore: scores.Neuroticism,

      /* bands */
      oBand: scoreBand(scores.Openness),
      cBand: scoreBand(scores.Conscientiousness),
      eBand: scoreBand(scores.Extraversion),
      aBand: scoreBand(scores.Agreeableness),
      nBand: scoreBand(scores.Neuroticism),

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
        `${topTraitInfo.fullName} dimension (${scores[topTrait] || 0}%). ` +
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

      /* SVG */
      pentagonSvg: generateOceanPentagonSvg(scores),
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
    // Report document stores FIRO scores under report.dimensions.FIRO — extract and normalize
    const firoRaw = report.dimensions?.FIRO;
    const firoData = firoRaw
      ? { dimensions: firoRaw.dimensions, totals: firoRaw.totals }
      : report; // fallback: caller already passed firoResults shape directly

    const staticData = getFIROStaticData(firoData);

    const templateData = {
      candidateName:  esc(testTaker?.name || 'N/A'),
      candidateEmail: esc(testTaker?.email || 'N/A'),
      assessmentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

      eI: staticData.scores.eI,
      wI: staticData.scores.wI,
      eC: staticData.scores.eC,
      wC: staticData.scores.wC,
      eA: staticData.scores.eA,
      wA: staticData.scores.wA,

      inclusionTotal: staticData.scores.inclusionTotal,
      controlTotal: staticData.scores.controlTotal,
      affectionTotal: staticData.scores.affectionTotal,

      totalExpressed: staticData.scores.totalExpressed,
      totalWanted: staticData.scores.totalWanted,
      overallTotal: staticData.scores.overallTotal,

      inclusionFulfillment: staticData.fulfillment.Inclusion,
      controlFulfillment: staticData.fulfillment.Control,
      affectionFulfillment: staticData.fulfillment.Affection,

      inclusionBand: staticData.career.inclusionBand,
      inclusionTips: staticData.career.inclusionTips,
      controlBand: staticData.career.controlBand,
      controlTips: staticData.career.controlTips,
      affectionBand: staticData.career.affectionBand,
      affectionTips: staticData.career.affectionTips,

      highestExpressed: staticData.leadership.highestExpressed,
      lowestExpressed: staticData.leadership.lowestExpressed
    };

    if (options.type === 'comprehensive' || !options.type) {
      const narratives = await generateFIRONarratives(firoData, testTaker);
      templateData.coverSummary = esc(narratives.coverSummary);
      templateData.deepProfileHtml = narratives.deepProfileHtml;
      templateData.leadershipHtml = narratives.leadershipHtml;
      templateData.developmentHtml = narratives.developmentHtml;
      templateData.closingInsight = esc(narratives.closingInsight);
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
  const name = testTaker?.name || 'Candidate';
  let title, subtitle, scoreLines = [];

  if (isDisc) {
    const sd = getDISCStaticData(report);
    title = sd.patternName;
    subtitle = sd.patternArchetype;
    scoreLines = Object.entries(sd.scores).map(([k, v]) =>
      `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:${DISC_TRAITS[k]?.color};
            display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px;">${k}</div>
        <div style="flex:1;height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden;">
          <div style="width:${v}%;height:100%;background:${DISC_TRAITS[k]?.color};border-radius:4px;"></div>
        </div>
        <span style="font-weight:700;color:${DISC_TRAITS[k]?.color};font-size:13px;">${v}%</span>
      </div>`
    );
  } else if (isFiro) {
    const sd = getFIROStaticData(report);
    title = "FIRO-B Behavioral Profile";
    subtitle = "Fundamental Interpersonal Relations Orientation";
    const firoColors = { Inclusion: '#8B5CF6', Control: '#F59E0B', Affection: '#10B981' };
    const max = 18;
    scoreLines = [
      { name: 'Inclusion', score: sd.scores.inclusionTotal, label: 'I' },
      { name: 'Control', score: sd.scores.controlTotal, label: 'C' },
      { name: 'Affection', score: sd.scores.affectionTotal, label: 'A' },
    ].map(item => 
      `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:${firoColors[item.name]};
            display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px;">${item.label}</div>
        <div style="flex:1;height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden;">
          <div style="width:${(item.score/max)*100}%;height:100%;background:${firoColors[item.name]};border-radius:4px;"></div>
        </div>
        <span style="font-weight:700;color:${firoColors[item.name]};font-size:13px;">${item.score}/18</span>
      </div>`
    );
  } else {
    const sd = getBig5StaticData(report);
    title = sd.topTraitName;
    subtitle = 'Big Five (OCEAN) Profile';
    const colors = { Openness:'#8B5CF6',Conscientiousness:'#3B82F6',Extraversion:'#F59E0B',Agreeableness:'#10B981',Neuroticism:'#EF4444' };
    const letters = { Openness:'O',Conscientiousness:'C',Extraversion:'E',Agreeableness:'A',Neuroticism:'N' };
    scoreLines = Object.entries(sd.scores).map(([k, v]) =>
      `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:${colors[k]};
            display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px;">${letters[k]}</div>
        <div style="flex:1;height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden;">
          <div style="width:${v}%;height:100%;background:${colors[k]};border-radius:4px;"></div>
        </div>
        <span style="font-weight:700;color:${colors[k]};font-size:13px;">${v}%</span>
      </div>`
    );
  }

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
.label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;margin-bottom:14px;}
.footer{font-size:9px;color:#94A3B8;margin-top:24px;}
</style></head><body>
<div class="card">
  <div class="brand">MindMill · ${isDisc ? 'DISC' : (isFiro ? 'FIRO-B' : 'Big Five')} Assessment</div>
  <div class="big-name">${esc(name)}</div>
  <div class="sub">${esc(title)} — ${esc(subtitle)}</div>
  <div class="scores">
    <div class="label">Score Overview</div>
    ${scoreLines.join('')}
  </div>
  <div class="footer">Generated by MindMill · ${new Date().toLocaleDateString()}</div>
</div>
</body></html>`;

  return await generatePdfFromHtml(html);
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
  <div class="brand">MindMill · Standard Assessment</div>
  <div class="big-name">${esc(name)}</div>
  <div class="sub">Assessment Report</div>
  <div class="scores" style="text-align:center;">
    <div style="font-size:48px;font-weight:700;color:#6366F1;margin-bottom:8px;">${Math.round(score)}%</div>
    <div style="font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:2px;">Overall Score</div>
  </div>
  <div class="footer">Generated by MindMill · ${new Date().toLocaleDateString()}</div>
</div>
</body></html>`;

  return await generatePdfFromHtml(html);
};

module.exports = {
  generateDiscReportPdf,
  generateBig5ReportPdf,
  generateFiroReportPdf,
  generateQuickSummaryPdf,
  generateGenericReportPdf,
  savePdfToDisk,
  getCachedPdf,
  deleteCachedPdfs,
};
