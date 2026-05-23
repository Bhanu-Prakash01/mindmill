const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = 'llama-3.3-70b-versatile';

// ─────────────────────────────────────────────────────────────────
// STATIC LOOKUP TABLES  (no tokens wasted on these)
// ─────────────────────────────────────────────────────────────────

const DISC_TRAITS = {
  D: {
    name: 'Dominance', letter: 'D',
    tagline: 'Results-Driven & Direct',
    description: 'Direct, decisive, results-oriented, competitive',
    color: '#EF4444', gradient: 'linear-gradient(135deg,#EF4444,#DC2626)',
    keywords: ['Decisive', 'Bold', 'Results-Oriented', 'Competitive', 'Driven'],
    high: 'Takes charge, pushes for results, direct communicator',
    low: 'Collaborative, patient, prefers consensus',
  },
  I: {
    name: 'Influence', letter: 'I',
    tagline: 'Persuasive & Enthusiastic',
    description: 'Persuasive, enthusiastic, optimistic, social',
    color: '#F59E0B', gradient: 'linear-gradient(135deg,#F59E0B,#D97706)',
    keywords: ['Enthusiastic', 'Optimistic', 'Persuasive', 'Networker', 'Inspiring'],
    high: 'Inspires others, energizes teams, strong communicator',
    low: 'Reserved, detail-focused, task-oriented',
  },
  S: {
    name: 'Steadiness', letter: 'S',
    tagline: 'Patient & Reliable',
    description: 'Patient, reliable, supportive, calm',
    color: '#10B981', gradient: 'linear-gradient(135deg,#10B981,#059669)',
    keywords: ['Patient', 'Loyal', 'Supportive', 'Dependable', 'Calm'],
    high: 'Team anchor, deeply reliable, creates psychological safety',
    low: 'Adaptable, fast-paced, comfortable with change',
  },
  C: {
    name: 'Conscientiousness', letter: 'C',
    tagline: 'Analytical & Precise',
    description: 'Analytical, systematic, accurate, quality-focused',
    color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#2563EB)',
    keywords: ['Accurate', 'Analytical', 'Systematic', 'Quality-Focused', 'Methodical'],
    high: 'Deep thinker, high standards, data-driven decisions',
    low: 'Action-oriented, flexible, big-picture thinker',
  },
};

const PATTERN_PROFILES = {
  'DI': { name: 'The Persuasive Leader', archetype: 'Charismatic Commander', idealRoles: ['Sales Leadership', 'Business Development', 'Executive Roles', 'Entrepreneurship'] },
  'DS': { name: 'The Determined Stabilizer', archetype: 'Resolute Operator', idealRoles: ['Operations Management', 'Project Management', 'Team Leadership', 'Client Success'] },
  'DC': { name: 'The Strategic Director', archetype: 'Precision Executive', idealRoles: ['Consulting', 'Finance', 'Engineering Management', 'Quality Assurance'] },
  'ID': { name: 'The Charismatic Commander', archetype: 'Visionary Driver', idealRoles: ['Marketing', 'Public Relations', 'Sales', 'Brand Leadership'] },
  'IS': { name: 'The Supportive Influencer', archetype: 'Empathetic Energizer', idealRoles: ['Human Resources', 'Training & Development', 'Customer Success', 'Coaching'] },
  'IC': { name: 'The Thoughtful Innovator', archetype: 'Analytical Communicator', idealRoles: ['Product Management', 'Research', 'Education', 'Technical Sales'] },
  'SD': { name: 'The Supportive Driver', archetype: 'Steady Achiever', idealRoles: ['Account Management', 'Team Coordination', 'Client Services', 'Operations'] },
  'SI': { name: 'The Believing Coordinator', archetype: 'Warm Builder', idealRoles: ['Healthcare', 'Social Services', 'Community Management', 'HR'] },
  'SC': { name: 'The Methodical Helper', archetype: 'Reliable Architect', idealRoles: ['Healthcare Admin', 'Legal Support', 'Research', 'Quality Assurance'] },
  'CD': { name: 'The Precision Driver', archetype: 'Exacting Achiever', idealRoles: ['Finance', 'Engineering', 'Legal', 'Compliance'] },
  'CI': { name: 'The Diplomatic Analyst', archetype: 'Insight Broker', idealRoles: ['Data Analysis', 'Consulting', 'Technical Writing', 'Training'] },
  'CS': { name: 'The Steady Analyst', archetype: 'Methodical Guardian', idealRoles: ['Accounting', 'Compliance', 'Administration', 'Systems Analysis'] },
  'D': { name: 'Pure Dominance', archetype: 'Autonomous Driver', idealRoles: ['Startups', 'Sales', 'Executive Leadership', 'Entrepreneurship'] },
  'I': { name: 'Pure Influence', archetype: 'Social Catalyst', idealRoles: ['Marketing', 'Sales', 'Public Relations', 'Entertainment'] },
  'S': { name: 'Pure Steadiness', archetype: 'Steadfast Anchor', idealRoles: ['Healthcare', 'Education', 'Social Services', 'Administration'] },
  'C': { name: 'Pure Conscientiousness', archetype: 'Quality Guardian', idealRoles: ['Finance', 'Legal', 'Engineering', 'Research'] },
};

const BIG5_TRAITS = {
  Openness: {
    name: 'Openness', fullName: 'Openness to Experience',
    color: '#8B5CF6', gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
    high: 'Imaginative, curious, creative, appreciates ideas and art',
    low: 'Practical, conventional, prefers routine and familiarity',
    icon: '✦',
  },
  Conscientiousness: {
    name: 'Conscientiousness', fullName: 'Conscientiousness',
    color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
    high: 'Organized, disciplined, reliable, goal-directed',
    low: 'Spontaneous, flexible, easy-going, adaptable',
    icon: '◈',
  },
  Extraversion: {
    name: 'Extraversion', fullName: 'Extraversion',
    color: '#F59E0B', gradient: 'linear-gradient(135deg,#F59E0B,#B45309)',
    high: 'Outgoing, energetic, sociable, assertive, enthusiastic',
    low: 'Reserved, reflective, independent, thoughtful',
    icon: '◉',
  },
  Agreeableness: {
    name: 'Agreeableness', fullName: 'Agreeableness',
    color: '#10B981', gradient: 'linear-gradient(135deg,#10B981,#047857)',
    high: 'Cooperative, trusting, empathetic, compassionate',
    low: 'Competitive, direct, questioning, independent-minded',
    icon: '◐',
  },
  Neuroticism: {
    name: 'Neuroticism', fullName: 'Emotional Stability',
    color: '#EF4444', gradient: 'linear-gradient(135deg,#EF4444,#B91C1C)',
    high: 'Sensitive, empathetic, emotionally aware, responsive',
    low: 'Calm, resilient, emotionally stable, even-tempered',
    icon: '◑',
  },
};

// ─────────────────────────────────────────────────────────────────
// HELPER: single focused LLM call returning plain text
// ─────────────────────────────────────────────────────────────────

const callLLM = async (systemPrompt, userPrompt, maxTokens = 450) => {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    model: MODEL,
    temperature: 0.75,
    max_tokens: maxTokens,
  });
  return (completion.choices[0]?.message?.content || '').trim();
};

// ─────────────────────────────────────────────────────────────────
// DISC NARRATIVE GENERATORS
// ─────────────────────────────────────────────────────────────────

const DISC_SYSTEM = `You are a senior organizational psychologist authoring a premium personality report.
Write in clear, confident, human prose — no bullet points, no JSON, no markdown headers.
Speak directly to the hiring manager or HR professional reading the report.
Be specific, insightful, and avoid generic filler phrases.
CRITICAL TONE GUIDELINES:
1. Adopt a polite, diplomatic, and highly constructive tone. Avoid blunt or direct language that could be perceived as rude, especially regarding traits like introversion or reservedness.
2. In your profile deep-dives, explicitly include inferred "Likes and Dislikes" of the person in the office and social spaces.
3. Discuss their tendencies in team interactions and how they react to complex or adverse situations.`;

const generateDISCCoverSummary = async (dominant, secondary, pattern, scores, name) => {
  const patternData = PATTERN_PROFILES[pattern] || PATTERN_PROFILES[dominant] || {};
  const dTrait = DISC_TRAITS[dominant] || DISC_TRAITS.D;
  const sTrait = DISC_TRAITS[secondary] || {};
  return callLLM(
    DISC_SYSTEM,
    `Write a 2-sentence executive headline for ${name}'s DISC report.
Pattern: ${pattern} — "${patternData.name || ''}" (${patternData.archetype || ''})
D=${scores.D}%, I=${scores.I}%, S=${scores.S}%, C=${scores.C}%
Primary trait "${dTrait.name}": ${dTrait.description}.
Secondary trait "${sTrait.name || secondary}": ${sTrait.description || ''}.
The summary should feel compelling, confident, and memorable — like the opening of a premium executive assessment.
Return ONLY the 2 sentences, no labels or prefixes.`,
    180
  );
};

const generateDISCDeepProfile = async (dominant, secondary, pattern, scores, name) => {
  const patternData = PATTERN_PROFILES[pattern] || PATTERN_PROFILES[dominant] || {};
  return callLLM(
    DISC_SYSTEM,
    `Write a 3-paragraph personality deep-dive for ${name} with DISC pattern "${pattern}" (${patternData.name || ''}).
Scores: D=${scores.D}%, I=${scores.I}%, S=${scores.S}%, C=${scores.C}%
Para 1: Core behavioral identity — how this combination of primary (${dominant}) and secondary (${secondary}) shapes who they are at work.
Para 2: How they make decisions, handle pressure, and interact with teams.
Para 3: Their natural energy, blind spots, and what makes them distinctly valuable.
Each paragraph: 3–4 sentences. Psychologist-level depth, not generic HR boilerplate.
Return ONLY the 3 paragraphs separated by blank lines.`,
    520
  );
};

const generateDISCLeadershipInsight = async (dominant, secondary, scores, name) => {
  return callLLM(
    DISC_SYSTEM,
    `Write 2 paragraphs about ${name}'s leadership and team dynamics.
DISC: D=${scores.D}%, I=${scores.I}%, S=${scores.S}%, C=${scores.C}% (Primary: ${dominant}, Secondary: ${secondary})
Para 1: Their natural leadership approach — style, strengths, how they motivate others.
Para 2: How they operate in teams — what they bring, what they need, how to manage them best.
3–4 sentences each. Specific and actionable for a real manager.
Return ONLY the 2 paragraphs separated by a blank line.`,
    380
  );
};

const generateDISCDevelopmentNarrative = async (dominant, secondary, scores, name) => {
  return callLLM(
    DISC_SYSTEM,
    `Write 2 paragraphs about growth and development for ${name}.
DISC: D=${scores.D}%, I=${scores.I}%, S=${scores.S}%, C=${scores.C}% (Primary: ${dominant}, Secondary: ${secondary})
Para 1: Their most important development opportunity — the one gap that, if closed, would make them significantly more effective.
Para 2: What a 12-month growth plan should focus on, and what kind of manager or environment accelerates their development.
3–4 sentences each. Forward-looking and constructive.
Return ONLY the 2 paragraphs separated by a blank line.`,
    380
  );
};

const generateDISCClosingInsight = async (dominant, secondary, pattern, name) => {
  const patternData = PATTERN_PROFILES[pattern] || PATTERN_PROFILES[dominant] || {};
  return callLLM(
    DISC_SYSTEM,
    `Write 1 powerful closing insight for ${name}'s DISC report.
Pattern: ${pattern} — "${patternData.name || ''}" (${patternData.archetype || ''})
This is the final sentence of the report — a memorable, human takeaway that a manager will remember.
It should capture the essence of this person's potential in 2–3 sentences. No clichés.
Return ONLY the insight.`,
    150
  );
};

// ─────────────────────────────────────────────────────────────────
// BIG5 NARRATIVE GENERATORS
// ─────────────────────────────────────────────────────────────────

const BIG5_SYSTEM = `You are a senior industrial-organizational psychologist authoring a premium Big Five personality report (OCEAN model).
Write in clear, authoritative prose — no bullet points, no JSON, no markdown headers.
Address the hiring manager or HR professional reading this confidential report.
Be specific, insightful, and grounded in psychometric research.
CRITICAL TONE GUIDELINES:
1. Adopt a polite, diplomatic, and highly constructive tone. Avoid blunt or direct language that could be perceived as rude, especially regarding introversion, reservedness, or high neuroticism. Frame lower scores constructively.
2. In your profile deep-dives, explicitly include inferred "Likes and Dislikes" of the person in the office and social spaces.
3. Discuss their tendencies in team interactions and how they react to complex or adverse situations.`;

const scoreBand = (score) => {
  if (score >= 75) return 'very high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'moderate';
  if (score >= 25) return 'low';
  return 'very low';
};

const generateBig5CoverSummary = async (scores, name) => {
  const O = scores.Openness || 0, C = scores.Conscientiousness || 0,
    E = scores.Extraversion || 0, A = scores.Agreeableness || 0,
    N = scores.Neuroticism || 0;
  return callLLM(
    BIG5_SYSTEM,
    `Write a 2-sentence executive headline for ${name}'s Big Five personality report.
OCEAN scores: O=${O}% (${scoreBand(O)}), C=${C}% (${scoreBand(C)}), E=${E}% (${scoreBand(E)}), A=${A}% (${scoreBand(A)}), N=${N}% emotional sensitivity (${scoreBand(N)})
The summary should capture their dominant character in 2 vivid, memorable sentences — like the opening of a premium talent assessment.
Return ONLY the 2 sentences, no labels.`,
    180
  );
};

const generateBig5DeepProfile = async (scores, name) => {
  const O = scores.Openness || 0, C = scores.Conscientiousness || 0,
    E = scores.Extraversion || 0, A = scores.Agreeableness || 0,
    N = scores.Neuroticism || 0;
  return callLLM(
    BIG5_SYSTEM,
    `Write a 3-paragraph Big Five personality deep-dive for ${name}.
OCEAN: O=${O}%, C=${C}%, E=${E}%, A=${A}%, N=${N}%
Para 1: How their scores on Openness (${scoreBand(O)}) and Conscientiousness (${scoreBand(C)}) shape their thinking style and work approach.
Para 2: How Extraversion (${scoreBand(E)}) and Agreeableness (${scoreBand(A)}) determine how they relate to people and collaborate.
Para 3: How their Neuroticism/Emotional Sensitivity (${scoreBand(N)}) affects their resilience, stress response, and interpersonal dynamics.
3–4 sentences each. Nuanced, research-grounded, human.
Return ONLY the 3 paragraphs separated by blank lines.`,
    520
  );
};

const generateBig5LeadershipInsight = async (scores, name) => {
  const O = scores.Openness || 0, C = scores.Conscientiousness || 0,
    E = scores.Extraversion || 0, A = scores.Agreeableness || 0,
    N = scores.Neuroticism || 0;
  return callLLM(
    BIG5_SYSTEM,
    `Write 2 paragraphs on ${name}'s leadership and collaboration style based on their Big Five profile.
OCEAN: O=${O}%, C=${C}%, E=${E}%, A=${A}%, N=${N}%
Para 1: Natural leadership tendencies — how they lead, motivate, and make decisions under pressure.
Para 2: Team dynamics — their contribution to group work, potential friction points, and ideal team position.
3–4 sentences each. Practical guidance for a real manager.
Return ONLY the 2 paragraphs separated by a blank line.`,
    380
  );
};

const generateBig5DevelopmentNarrative = async (scores, name) => {
  const O = scores.Openness || 0, C = scores.Conscientiousness || 0,
    E = scores.Extraversion || 0, A = scores.Agreeableness || 0,
    N = scores.Neuroticism || 0;
  return callLLM(
    BIG5_SYSTEM,
    `Write 2 paragraphs on development and growth for ${name}.
OCEAN: O=${O}%, C=${C}%, E=${E}%, A=${A}%, N=${N}%
Para 1: The highest-leverage growth area given their profile — what specific shift would make them most effective.
Para 2: What a strong development environment looks like for this person — management style, feedback approach, culture fit.
3–4 sentences each. Constructive, forward-looking, non-judgmental.
Return ONLY the 2 paragraphs separated by a blank line.`,
    380
  );
};

const generateBig5ClosingInsight = async (scores, name) => {
  const O = scores.Openness || 0, C = scores.Conscientiousness || 0,
    E = scores.Extraversion || 0, A = scores.Agreeableness || 0,
    N = scores.Neuroticism || 0;
  return callLLM(
    BIG5_SYSTEM,
    `Write a powerful closing insight for ${name}'s Big Five report.
OCEAN: O=${O}%, C=${C}%, E=${E}%, A=${A}%, N=${N}%
This is the final statement of the report. 2–3 sentences that leave the reader with a clear, memorable sense of who ${name} is and why they matter.
Avoid clichés. Be honest, specific, and human.
Return ONLY the closing insight.`,
    150
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT: generate all narratives in parallel
// ─────────────────────────────────────────────────────────────────

/**
 * Normalise DISC data regardless of source shape:
 *   Shape A (attempt.discResults): { percentages:{D,I,S,C}, dominant, secondary, pattern }
 *   Shape B (Report DB document):  { dimensions:{ DISC:{ D:{percentage}, I:{percentage}, …, dominant, secondary, pattern } } }
 */
const normalizeDISCData = (reportData) => {
  const src = reportData?.attempt?.discResults || reportData;

  // Shape A — from attempt.discResults (Prioritized!)
  if (src?.percentages) {
    return {
      percentages: {
        D: src.percentages.D ?? 0,
        I: src.percentages.I ?? 0,
        S: src.percentages.S ?? 0,
        C: src.percentages.C ?? 0,
      },
      dominant:  src.dominant  || 'D',
      secondary: src.secondary || 'I',
      pattern:   src.pattern   || `${src.dominant || 'D'}${src.secondary || 'I'}`,
    };
  }

  // Shape B — from Report document (Fallback)
  if (src?.dimensions?.DISC) {
    const disc = src.dimensions.DISC;
    return {
      percentages: {
        D: disc.D?.percentage ?? 0,
        I: disc.I?.percentage ?? 0,
        S: disc.S?.percentage ?? 0,
        C: disc.C?.percentage ?? 0,
      },
      dominant:  disc.dominant  || 'D',
      secondary: disc.secondary || 'I',
      pattern:   disc.pattern   || `${disc.dominant || 'D'}${disc.secondary || 'I'}`,
    };
  }
  
  return {
    percentages: { D: 0, I: 0, S: 0, C: 0 },
    dominant: 'D', secondary: 'I', pattern: 'DI'
  };
};

const generateDISCNarratives = async (reportData, testTaker) => {
  const { percentages, dominant, secondary, pattern } = normalizeDISCData(reportData);
  const name = testTaker?.name || 'the candidate';
  const scores = {
    D: Math.round(percentages.D || 0),
    I: Math.round(percentages.I || 0),
    S: Math.round(percentages.S || 0),
    C: Math.round(percentages.C || 0),
  };

  try {
    const [coverSummary, deepProfile, leadershipInsight, developmentNarrative, closingInsight] =
      await Promise.all([
        generateDISCCoverSummary(dominant, secondary, pattern, scores, name),
        generateDISCDeepProfile(dominant, secondary, pattern, scores, name),
        generateDISCLeadershipInsight(dominant, secondary, scores, name),
        generateDISCDevelopmentNarrative(dominant, secondary, scores, name),
        generateDISCClosingInsight(dominant, secondary, pattern, name),
      ]);

    return { coverSummary, deepProfile, leadershipInsight, developmentNarrative, closingInsight };
  } catch (err) {
    console.error('DISC narrative generation error:', err);
    // Graceful fallback — still produces a complete report
    const pData = PATTERN_PROFILES[pattern] || PATTERN_PROFILES[dominant] || {};
    const dTrait = DISC_TRAITS[dominant] || DISC_TRAITS.D;
    return {
      coverSummary: `${name} presents a compelling ${dTrait.name}-dominant profile (${pattern}), combining ${dTrait.description}. Their assessment reveals a personality ideally suited to high-impact, results-driven environments.`,
      deepProfile: `${name}'s ${pattern} pattern reflects a deliberate blend of assertiveness and adaptability. In work settings, they tend to drive toward outcomes while reading the dynamics of those around them. This combination creates a professional who can both lead when needed and collaborate effectively when required.\n\nDecisions come naturally to this profile — they process information efficiently and are not paralyzed by ambiguity. Under pressure, their dominant traits become more pronounced, making clear communication and alignment on goals especially important.\n\nWhat makes them distinctly valuable is their ability to balance drive with awareness. They enter situations with intent and exit them with results, while leaving relationships largely intact.`,
      leadershipInsight: `${name}'s leadership style is characterized by directness and clarity. They set expectations clearly, hold themselves and others accountable, and create momentum through action rather than deliberation.\n\nIn team settings, they serve as a stabilizing force who keeps the group focused on outcomes. They work best with managers who give clear goals and meaningful autonomy, and they thrive alongside team members who complement their dominant tendencies.`,
      developmentNarrative: `The most significant growth opportunity for ${name} lies in deepening their capacity for patience and perspective-taking, particularly in high-stakes moments. Developing this dimension would make their already considerable strengths even more impactful.\n\nA 12-month plan should focus on structured feedback cycles, opportunities to lead through influence rather than authority, and environments where they can build on their natural strengths while safely expanding into less familiar behavioral territory.`,
      closingInsight: `${name} brings a rare combination of drive, clarity, and adaptability that organizations in motion particularly value. With the right environment and intentional development, their high ceiling makes them an asset worth investing in.`,
    };
  }
};

/**
 * Normalise Big5 data regardless of source shape:
 *   Shape A (attempt.big5Results): { E:{score,percent,level}, A:{…}, C:{…}, N:{…}, O:{…} }
 *   Shape B (Report DB document):  { dimensions:{ BigFive:{ openness, conscientiousness, … } } }
 *   Shape C (legacy / preview):    { scores:{ Openness, Conscientiousness, … } }
 */
const normalizeBig5Data = (reportData) => {
  const src = reportData?.attempt?.big5Results || reportData;

  // Shape A — attempt.big5Results keyed by letter {E, A, C, N, O} (Prioritized!)
  // Returns raw scores (0-40) because pdfService.js will scale them to 0-100%
  if (src?.E || src?.A || src?.C || src?.N || src?.O) {
    return {
      Openness:          Math.round(src.O?.score ?? Math.round((src.O?.percent || 0) * 40 / 100)),
      Conscientiousness: Math.round(src.C?.score ?? Math.round((src.C?.percent || 0) * 40 / 100)),
      Extraversion:      Math.round(src.E?.score ?? Math.round((src.E?.percent || 0) * 40 / 100)),
      Agreeableness:     Math.round(src.A?.score ?? Math.round((src.A?.percent || 0) * 40 / 100)),
      Neuroticism:       Math.round(src.N?.score ?? Math.round((src.N?.percent || 0) * 40 / 100)),
    };
  }

  // Shape B — Report document with dimensions.BigFive (Fallback)
  if (src?.dimensions?.BigFive) {
    const bf = src.dimensions.BigFive;
    // If the DB stored it as a percentage (e.g. 55) by mistake, we must scale it down to a raw score
    // so pdfService.js doesn't scale it to >100%. If it's > 40, it's definitely a percentage.
    const getRaw = (val) => val > 40 ? (val * 40 / 100) : val;
    return {
      Openness:          Math.round(getRaw(bf.openness || 0)),
      Conscientiousness: Math.round(getRaw(bf.conscientiousness || 0)),
      Extraversion:      Math.round(getRaw(bf.extraversion || 0)),
      Agreeableness:     Math.round(getRaw(bf.agreeableness || 0)),
      Neuroticism:       Math.round(getRaw(bf.neuroticism || 0)),
    };
  }
  
  // Shape C — { scores: { Openness, … } } or flat
  const flat = src?.scores || src || {};
  return {
    Openness:          Math.round(flat.Openness          || flat.openness          || 0),
    Conscientiousness: Math.round(flat.Conscientiousness || flat.conscientiousness || 0),
    Extraversion:      Math.round(flat.Extraversion      || flat.extraversion      || 0),
    Agreeableness:     Math.round(flat.Agreeableness     || flat.agreeableness     || 0),
    Neuroticism:       Math.round(flat.Neuroticism       || flat.neuroticism       || 0),
  };
};

const generateBig5Narratives = async (reportData, testTaker) => {
  const normalized = normalizeBig5Data(reportData);
  const name = testTaker?.name || 'the candidate';

  try {
    const [coverSummary, deepProfile, leadershipInsight, developmentNarrative, closingInsight] =
      await Promise.all([
        generateBig5CoverSummary(normalized, name),
        generateBig5DeepProfile(normalized, name),
        generateBig5LeadershipInsight(normalized, name),
        generateBig5DevelopmentNarrative(normalized, name),
        generateBig5ClosingInsight(normalized, name),
      ]);

    return { coverSummary, deepProfile, leadershipInsight, developmentNarrative, closingInsight };
  } catch (err) {
    console.error('Big5 narrative generation error:', err);
    return {
      coverSummary: `${name} presents a well-calibrated personality profile across the Big Five OCEAN dimensions, with a combination of traits that reflects both intellectual engagement and interpersonal effectiveness. Their assessment indicates a professional capable of meaningful contribution across team and individual work contexts.`,
      deepProfile: `${name}'s Openness and Conscientiousness scores together define a thinking style that balances curiosity with follow-through. They are drawn to ideas but grounded enough in structure to see them through — a combination that translates naturally into effective project work.\n\nTheir Extraversion and Agreeableness scores shape a collaborative disposition: they engage with others readily and approach interpersonal conflict with a preference for resolution rather than escalation. In team environments, this translates into a steady, positive presence.\n\nEmotional sensitivity, captured in the Neuroticism dimension, rounds out the picture. Their score suggests a person who feels situations acutely enough to be responsive but maintains the stability to perform consistently under normal and moderate pressure.`,
      leadershipInsight: `${name}'s natural leadership approach is facilitative — they build alignment, listen actively, and move groups toward consensus without domineering. This style works well in collaborative cultures where buy-in matters more than top-down speed.\n\nIn teams, they are a reliable contributor who elevates group quality through conscientiousness and cooperation. They work best when leadership is clear and supportive, and they're most effective when paired with personality types that complement their reflective, agreeable tendencies.`,
      developmentNarrative: `The primary growth opportunity for ${name} involves building greater comfort with assertive decision-making and navigating ambiguity with confidence. Developing this capacity would significantly amplify their existing strengths.\n\nThe ideal development environment offers structured feedback, psychological safety to take risks, and mentorship from leaders who model confident, values-led decision-making. A 12-month plan should include both stretch assignments and reflective practices to deepen self-awareness.`,
      closingInsight: `${name}'s profile reflects a thoughtful, engaged professional whose impact tends to compound over time — they build trust slowly but durably. Organizations that invest in their development will find a contributor who grows into a cornerstone.`,
    };
  }
};

// ─────────────────────────────────────────────────────────────────
// STATIC DATA EXPORTS for template rendering
// ─────────────────────────────────────────────────────────────────

const getDISCStaticData = (reportData) => {
  const { percentages, dominant, secondary, pattern: rawPattern } = normalizeDISCData(reportData);
  const pattern = rawPattern;
  const patternData = PATTERN_PROFILES[pattern] || PATTERN_PROFILES[dominant] || {};

  const scores = {
    D: Math.round(percentages.D || 0),
    I: Math.round(percentages.I || 0),
    S: Math.round(percentages.S || 0),
    C: Math.round(percentages.C || 0),
  };

  const strengthsBank = {
    D: ['Drives results with urgency', 'Makes decisive calls under pressure', 'Sets a high bar for performance', 'Cuts through ambiguity quickly', 'Takes initiative without waiting', 'Challenges the status quo constructively'],
    I: ['Builds energy and enthusiasm in teams', 'Persuades and motivates naturally', 'Creates strong interpersonal networks', 'Communicates vision compellingly', 'Lifts morale during tough periods', 'Adapts communication style fluidly'],
    S: ['Creates psychological safety in teams', 'Follows through with quiet reliability', 'Listens actively and deeply', 'Maintains calm under sustained pressure', 'Builds long-term loyal relationships', 'Provides consistent, dependable output'],
    C: ['Produces high-quality, accurate work', 'Identifies risks before they materialize', 'Applies systematic thinking to problems', 'Maintains high personal standards', 'Asks the right clarifying questions', 'Creates clear, well-documented processes'],
  };

  const growthBank = {
    D: ['Developing patience in collaborative processes', 'Building empathy in high-pressure moments', 'Learning to solicit input before deciding'],
    I: ['Following through on commitments systematically', 'Focusing on detail-oriented tasks more consistently', 'Managing time and priorities more rigorously'],
    S: ['Embracing change and uncertainty with more confidence', 'Advocating more directly for their own ideas', 'Making faster decisions when needed'],
    C: ['Accepting "good enough" when perfection is not required', 'Moving more quickly in ambiguous situations', 'Expressing ideas with greater confidence in meetings'],
  };

  const motivatorsBank = {
    D: ['Clear goals and authority to achieve them', 'Visible impact and measurable results', 'Recognition for outcomes, not just effort', 'Autonomy and decision-making freedom', 'New challenges before the current one gets routine'],
    I: ['Social recognition and appreciation', 'Collaborative environments with energy', 'Variety and creative freedom', 'Opportunities to influence and inspire', 'Celebrations and visible team successes'],
    S: ['Stable environment with clear expectations', 'Feeling genuinely valued and trusted', 'Harmonious team relationships', 'Long-term projects with meaningful impact', 'Predictable routines and consistent leadership'],
    C: ['Freedom to do work to a high standard', 'Access to the data and information needed', 'Clear expectations with logic behind them', 'Recognition of precision and thoroughness', 'Time to analyze before committing'],
  };

  const demotivatorsBank = {
    D: ['Excessive processes that slow outcomes', 'Micromanagement by leadership', 'Lack of recognition for achievement', 'Environments with chronic indecision', 'Tasks with no clear impact'],
    I: ['Isolated, solitary work for long periods', 'Criticism without constructive guidance', 'Rigid, rule-bound environments', 'Tasks requiring sustained detail focus', 'Lack of positive feedback'],
    S: ['Sudden, unexplained change', 'Conflict-heavy or combative team cultures', 'Being pressured to decide too quickly', 'Environments that feel unsafe or unpredictable', 'Feeling like their loyalty is taken for granted'],
    C: ['Rushing to decisions without sufficient data', 'Work environments that accept low quality', 'Unclear or constantly shifting expectations', 'Being dismissed without logical explanation', 'Chaotic, disorganized processes'],
  };

  const careerBank = {
    D: ['Chief Executive Officer / Managing Director', 'Sales Director / VP of Business Development', 'Entrepreneur / Startup Founder', 'Operations Director', 'Management Consultant'],
    I: ['Chief Marketing Officer / Brand Director', 'Account Executive / Sales Manager', 'Public Relations Manager', 'HR Business Partner / Talent Lead', 'Events & Experience Director'],
    S: ['Customer Success Manager', 'HR Manager / People Operations', 'Healthcare Administrator', 'Project Coordinator', 'Community Manager'],
    C: ['Financial Analyst / Controller', 'Data Scientist / Research Analyst', 'Quality Assurance Manager', 'Legal Counsel / Compliance Officer', 'Systems Architect'],
  };

  const interviewTipsBank = {
    D: [
      'Be direct and concise — they value your time as much as their own',
      'Focus on goals, challenges, and tangible outcomes expected in the role',
      'Ask about past results with specific metrics — they respond to evidence',
      'Give them space to ask direct questions without perceiving it as aggression',
      'Avoid over-explaining processes — get to the point quickly',
    ],
    I: [
      'Open with warmth and genuine interest in them as a person',
      'Allow the conversation to feel dynamic, not rigidly structured',
      'Ask about team experiences and highlight collaborative culture',
      'Be enthusiastic about the role\'s visibility and impact potential',
      'Avoid lengthy technical assessments early — build relationship first',
    ],
    S: [
      'Create a calm, unhurried interview environment',
      'Give them time to think — silence is them processing, not avoiding',
      'Ask concrete, behavioral questions with clear structure (STAR format)',
      'Highlight team stability and relationship continuity in the role',
      'Reassure them about transition process if there is significant change involved',
    ],
    C: [
      'Come prepared with detailed role information and clear success metrics',
      'Expect and welcome probing, specific questions — theyve done their research',
      'Allow time for thoughtful answers — they consider before responding',
      'Share data and evidence about organizational performance where relevant',
      'Avoid pressure tactics or aggressive sales approaches',
    ],
  };

  const shortTermGoals = {
    D: ['Identify the 3 highest-leverage priorities and protect time for them', 'Establish weekly outcome check-ins with key stakeholders', 'Build one new feedback loop with a direct report or peer'],
    I: ['Create a consistent follow-up system for outstanding commitments', 'Block dedicated time for focused, solo work each day', 'Set and track 3 measurable output goals for the next 30 days'],
    S: ['Identify one situation per week to practice advocating directly for your view', 'Build a decision-making framework for common recurring choices', 'Schedule a direct conversation with your manager about development goals'],
    C: ['Practice sharing ideas in meetings before they feel "fully ready"', 'Set a personal "good enough" threshold for routine deliverables', 'Block time weekly to connect informally with colleagues'],
  };

  const longTermGoals = {
    D: ['Build a consistent coaching practice with direct reports', 'Develop deeper cross-functional empathy through structured exposure', 'Invest in a formal leadership development program'],
    I: ['Develop expertise in a technical domain that complements communication strengths', 'Build a track record of seeing complex projects through to completion', 'Earn a role that combines influence with measurable strategic impact'],
    S: ['Take on a change-management initiative that requires leading through ambiguity', 'Develop a personal brand that articulates your unique value clearly', 'Build broader organizational influence beyond immediate team relationships'],
    C: ['Move from individual expert to trusted advisor role across the organization', 'Develop comfort with strategic ambiguity and faster decision cycles', 'Build skills in stakeholder communication and executive presence'],
  };

  // pick dominant's data plus blend secondary
  const dominantStrengths = strengthsBank[dominant] || strengthsBank.D;
  const secondaryStrengths = (strengthsBank[secondary] || []).slice(0, 2);
  const allStrengths = [...new Set([...dominantStrengths, ...secondaryStrengths])].slice(0, 7);

  const dominantGrowth = growthBank[dominant] || growthBank.D;
  const secondaryGrowth = (growthBank[secondary] || []).slice(0, 1);
  const allGrowth = [...new Set([...dominantGrowth, ...secondaryGrowth])].slice(0, 4);

  const dominantMotivators = motivatorsBank[dominant] || motivatorsBank.D;
  const secondaryMotivators = (motivatorsBank[secondary] || []).slice(0, 2);
  const allMotivators = [...new Set([...dominantMotivators, ...secondaryMotivators])].slice(0, 6);

  const dominantDemotivators = demotivatorsBank[dominant] || demotivatorsBank.D;
  const secondaryDemotivators = (demotivatorsBank[secondary] || []).slice(0, 2);
  const allDemotivators = [...new Set([...dominantDemotivators, ...secondaryDemotivators])].slice(0, 5);

  return {
    pattern,
    patternName: patternData.name || `${dominant}${secondary} Profile`,
    patternArchetype: patternData.archetype || '',
    idealRoles: patternData.idealRoles || [],
    dominant, secondary,
    scores,
    dominantColor: DISC_TRAITS[dominant]?.color || '#6366F1',
    dominantGradient: DISC_TRAITS[dominant]?.gradient || 'linear-gradient(135deg,#6366F1,#4F46E5)',
    dominantName: DISC_TRAITS[dominant]?.name || dominant,
    dominantTagline: DISC_TRAITS[dominant]?.tagline || '',
    dominantKeywords: DISC_TRAITS[dominant]?.keywords || [],
    strengths: allStrengths,
    growthAreas: allGrowth,
    motivators: allMotivators,
    demotivators: allDemotivators,
    careerPaths: careerBank[dominant] || careerBank.D,
    interviewTips: interviewTipsBank[dominant] || interviewTipsBank.D,
    shortTermGoals: shortTermGoals[dominant] || shortTermGoals.D,
    longTermGoals: longTermGoals[dominant] || longTermGoals.D,
    traitData: Object.entries(DISC_TRAITS).map(([k, t]) => ({
      letter: k,
      name: t.name,
      tagline: t.tagline,
      color: t.color,
      percentage: scores[k] || 0,
      keywords: t.keywords,
      description: scores[k] >= 50 ? t.high : t.low,
    })),
  };
};

const getBig5StaticData = (reportData) => {
  // Use the shared normalizer that handles all three data shapes
  const normalized = normalizeBig5Data(reportData);

  const topTrait = Object.entries(normalized).reduce((a, b) => a[1] >= b[1] ? a : b)[0];

  const strengthsMap = {
    Openness: ['Generates creative and innovative ideas', 'Connects disparate concepts intuitively', 'Adapts approaches readily to new contexts', 'Embraces complexity and intellectual challenge'],
    Conscientiousness: ['Delivers reliable, high-quality outputs consistently', 'Manages time and priorities with discipline', 'Maintains high personal standards under pressure', 'Executes complex projects systematically'],
    Extraversion: ['Builds energy and momentum in group settings', 'Communicates with clarity and confidence', 'Builds professional networks with ease', 'Thrives and excels in client-facing roles'],
    Agreeableness: ['Navigates interpersonal conflict with skill and care', 'Creates trust with colleagues and stakeholders', 'Contributes to psychologically safe team cultures', 'Builds long-term, high-quality professional relationships'],
    Neuroticism: ['Deeply attuned to interpersonal and environmental dynamics', 'Brings empathy and emotional responsiveness', 'Motivates self to perform through emotional engagement', 'Reads situations with nuance and sensitivity'],
  };

  const workplacePrefsMap = {
    Openness: { environment: 'Creative & Exploratory', pace: 'Varied & Stimulating', feedback: 'Conceptual & Forward-Looking', autonomy: 'High', structure: 'Flexible' },
    Conscientiousness: { environment: 'Structured & Goal-Oriented', pace: 'Steady & Predictable', feedback: 'Specific & Measurable', autonomy: 'Moderate', structure: 'High' },
    Extraversion: { environment: 'Collaborative & Social', pace: 'Fast & Dynamic', feedback: 'Frequent & Public', autonomy: 'Moderate', structure: 'Low–Moderate' },
    Agreeableness: { environment: 'Harmonious & Supportive', pace: 'Moderate & Considered', feedback: 'Warm & Constructive', autonomy: 'Flexible', structure: 'Moderate' },
    Neuroticism: { environment: 'Stable & Supportive', pace: 'Steady & Manageable', feedback: 'Regular & Encouraging', autonomy: 'Guided', structure: 'Moderate–High' },
  };

  const careerMap = {
    Openness: ['Creative Director / UX Lead', 'Research Scientist / Academic', 'Strategy Consultant', 'Entrepreneur / Innovation Lead', 'Product Designer'],
    Conscientiousness: ['Financial Controller / CFO', 'Project / Program Manager', 'Quality Assurance Director', 'Operations Manager', 'Compliance Officer'],
    Extraversion: ['Sales Director / Business Development', 'Public Relations Manager', 'HR Business Partner', 'Marketing Lead', 'Executive Coach'],
    Agreeableness: ['Healthcare Professional', 'Social Worker / Counselor', 'Customer Success Manager', 'Team Lead / People Manager', 'Nonprofit Director'],
    Neuroticism: ['Creative Professional', 'Clinical Psychologist', 'Research Analyst', 'Content Strategist', 'Human Resources Specialist'],
  };

  const interviewTipsMap = {
    Openness: ['Engage with open-ended, exploratory questions', 'Discuss future trends and creative challenges in the role', 'Highlight opportunities for innovation and learning', 'Avoid rigid, process-heavy interview formats'],
    Conscientiousness: ['Provide a structured, well-organized interview process', 'Ask for specific examples with measurable outcomes', 'Respect their preparation — they\'ve done their research', 'Discuss clear role expectations, success metrics, and career path'],
    Extraversion: ['Create an energetic, conversational interview tone', 'Discuss team culture and collaboration opportunities', 'Allow them to talk through ideas and examples freely', 'Highlight external visibility and stakeholder interaction in the role'],
    Agreeableness: ['Create a warm, psychologically safe interview environment', 'Ask behavioral questions about teamwork and conflict resolution', 'Discuss the team culture and relationship quality honestly', 'Give space for them to ask questions about the people, not just the role'],
    Neuroticism: ['Establish a calm, supportive interview tone early', 'Structure the interview clearly with predictable flow', 'Normalize mistakes or uncertainties in questions — avoid gotcha formats', 'Reassure them about support structures and onboarding quality'],
  };

  const wellbeingStrengthsMap = {
    Openness: ['Rich capacity for intellectual stimulation', 'Finds meaning through creative expression', 'Natural resilience through curiosity-driven perspective'],
    Conscientiousness: ['Strong sense of self-efficacy through accomplishment', 'Builds resilience through routine and structure', 'Derives well-being from visible progress toward goals'],
    Extraversion: ['Recharges through social connection and interaction', 'Positive emotional energy flows from collaborative work', 'Broad social support network provides resilience'],
    Agreeableness: ['Deep relational satisfaction through helping others', 'Experiences meaning through contribution to others\' growth', 'High-quality relationships as a core source of well-being'],
    Neuroticism: ['Rich emotional life and depth of experience', 'Strong empathy as a driver of connection', 'Motivated to grow through emotional self-awareness'],
  };

  const wellbeingStrategiesMap = {
    Openness: ['Protect time for creative and exploratory work', 'Use journaling or creative outlets to process complex ideas', 'Build intellectual community for stimulation and challenge'],
    Conscientiousness: ['Schedule intentional rest — perfectionism can lead to burnout', 'Celebrate completed milestones, not just final outcomes', 'Practice self-compassion when outcomes fall short of ideal'],
    Extraversion: ['Ensure social connection is built into the work week', 'Channel energy through collaborative formats where possible', 'Create clear boundaries between high-energy and recovery time'],
    Agreeableness: ['Practice healthy boundary-setting in relationships', 'Protect personal needs alongside others\' — not instead of', 'Build habits of direct self-advocacy in low-stakes situations'],
    Neuroticism: ['Build a consistent mindfulness or self-regulation practice', 'Create stable routines that provide grounding during stress', 'Develop trusted relationships where emotional honesty is safe'],
  };

  const shortTermBig5 = {
    Openness: ['Identify one experiment or creative initiative to lead this month', 'Share an unconventional idea in a team forum this week', 'Read one research piece outside your current domain'],
    Conscientiousness: ['Audit current workload against priorities — eliminate lowest-value tasks', 'Set a "done is production-ready" threshold for two regular deliverables', 'Schedule one catch-up with a team member to strengthen relationships'],
    Extraversion: ['Channel communication energy into one high-impact stakeholder relationship', 'Create a focused 2-hour deep work block each morning this month', 'Find one follow-through system (task manager, shared document) that works for you'],
    Agreeableness: ['Practice stating your opinion before asking others\' in three meetings', 'Identify one situation to respectfully push back this month', 'Write down your own priorities before entering a collaborative discussion'],
    Neuroticism: ['Implement a daily 5-minute decompression ritual after high-stakes work', 'Identify your top three stress triggers and one mitigation for each', 'Schedule a check-in with your manager to align on expectations'],
  };

  const longTermBig5 = {
    Openness: ['Build a reputation as an innovation catalyst within the organization', 'Develop deeper technical expertise in one adjacent domain', 'Mentor a junior colleague on creative and strategic thinking'],
    Conscientiousness: ['Move from execution-focused to strategy-influencing roles', 'Develop executive communication skills for broader organizational influence', 'Build a personal advisory relationship with a senior leader'],
    Extraversion: ['Develop a signature expertise that gives depth to communication strengths', 'Build a complex project leadership track record', 'Invest in building cross-functional influence beyond direct team'],
    Agreeableness: ['Take on a leadership role that requires direct accountability for outcomes', 'Develop a personal brand that communicates value and expertise clearly', 'Build skills in commercial thinking alongside relational capabilities'],
    Neuroticism: ['Build a sustained practice of emotional self-regulation (coaching, therapy, mindfulness)', 'Progressively take on higher-ambiguity roles with strong support structures', 'Develop a clear personal identity narrative that grounds decision-making under stress'],
  };

  const prefs = workplacePrefsMap[topTrait] || workplacePrefsMap.Conscientiousness;

  return {
    scores: normalized,
    topTrait,
    topTraitColor: BIG5_TRAITS[topTrait]?.color || '#6366F1',
    topTraitName: BIG5_TRAITS[topTrait]?.fullName || topTrait,
    traitData: Object.entries(BIG5_TRAITS).map(([k, t]) => ({
      key: k,
      name: t.name,
      fullName: t.fullName,
      color: t.color,
      gradient: t.gradient,
      icon: t.icon,
      percentage: normalized[k] || 0,
      band: scoreBand(normalized[k] || 0),
      description: (normalized[k] || 0) >= 50 ? t.high : t.low,
    })),
    strengths: [
      ...(strengthsMap[topTrait] || []),
      // Add 2 from second-highest
      ...Object.entries(normalized)
        .sort((a, b) => b[1] - a[1])
        .slice(1, 3)
        .flatMap(([k]) => (strengthsMap[k] || []).slice(0, 1)),
    ].slice(0, 6),
    workplacePrefs: prefs,
    careerPaths: careerMap[topTrait] || careerMap.Conscientiousness,
    interviewTips: interviewTipsMap[topTrait] || interviewTipsMap.Conscientiousness,
    wellbeingStrengths: wellbeingStrengthsMap[topTrait] || wellbeingStrengthsMap.Conscientiousness,
    wellbeingStrategies: wellbeingStrategiesMap[topTrait] || wellbeingStrategiesMap.Conscientiousness,
    shortTermGoals: shortTermBig5[topTrait] || shortTermBig5.Conscientiousness,
    longTermGoals: longTermBig5[topTrait] || longTermBig5.Conscientiousness,
  };
};

// ─────────────────────────────────────────────────────────────────
// FIRO-B NARRATIVE GENERATORS
// ─────────────────────────────────────────────────────────────────

const FIRO_SYSTEM = `You are a senior industrial-organizational psychologist analyzing a FIRO-B (Fundamental Interpersonal Relations Orientation) profile.
Write in clear, authoritative prose — no bullet points, no JSON, no markdown headers.
Address the hiring manager or HR professional reading this confidential report.
Be specific, insightful, and grounded in psychometric research regarding the interplay of Expressed and Wanted behaviors for Inclusion, Control, and Affection.
CRITICAL TONE GUIDELINES:
1. Adopt a polite, diplomatic, and highly constructive tone. Avoid blunt or direct language that could be perceived as rude or critical of their social needs.
2. In your profile deep-dives, explicitly include inferred "Likes and Dislikes" of the person in the office and social spaces.
3. Discuss their tendencies in team interactions and how they react to complex or adverse situations.`;

const generateFiroCoverSummary = async (eI, wI, eC, wC, eA, wA, name) => {
  return callLLM(
    FIRO_SYSTEM,
    `Write a 2-sentence executive headline for ${name}'s FIRO-B interpersonal profile.
Scores (0-9 scale): Expressed Inclusion=${eI}, Wanted Inclusion=${wI}, Expressed Control=${eC}, Wanted Control=${wC}, Expressed Affection=${eA}, Wanted Affection=${wA}.
The summary should capture their core social dynamic and leadership energy in 2 memorable sentences.
Return ONLY the 2 sentences, no labels.`,
    180
  );
};

const generateFiroDeepProfile = async (eI, wI, eC, wC, eA, wA, name) => {
  return callLLM(
    FIRO_SYSTEM,
    `Write a 3-paragraph FIRO-B personality deep-dive for ${name}.
Scores (0-9):
Inclusion (Involvement/Belonging): Expressed=${eI}, Wanted=${wI}
Control (Influence/Structure): Expressed=${eC}, Wanted=${wC}
Affection (Warmth/Closeness): Expressed=${eA}, Wanted=${wA}
Para 1: Inclusion Dynamics. How their expressed and wanted inclusion scores shape how they join groups, integrate, and network.
Para 2: Control Dynamics. How their control scores dictate their response to structure, authority, and taking charge versus being directed.
Para 3: Affection Dynamics. How their affection scores affect their 1-on-1 relationships, emotional distance, and rapport building.
3–4 sentences each. Analytical, professional, nuanced. No generic filler.
Return ONLY the 3 paragraphs separated by blank lines.`,
    500
  );
};

const generateFiroLeadershipInsight = async (eI, wI, eC, wC, eA, wA, name) => {
  return callLLM(
    FIRO_SYSTEM,
    `Write 2 paragraphs on ${name}'s leadership and team dynamics based on their FIRO-B profile.
Expressed: Inclusion=${eI}, Control=${eC}, Affection=${eA}
Wanted: Inclusion=${wI}, Control=${wC}, Affection=${wA}
Focus on how their highest expressed need dictates their primary leadership mechanism, and how divergence between expressed and wanted needs might cause team friction or misunderstandings.
Return ONLY the 2 paragraphs separated by a blank line.`,
    350
  );
};

const generateFiroDevelopmentNarrative = async (eI, wI, eC, wC, eA, wA, name) => {
  return callLLM(
    FIRO_SYSTEM,
    `Write 2 paragraphs on professional development opportunities for ${name} based on FIRO-B friction points.
Expressed: Inclusion=${eI}, Control=${eC}, Affection=${eA} | Wanted: Inclusion=${wI}, Control=${wC}, Affection=${wA}
Identify the greatest potential blind spot or source of interpersonal exhaustion in their profile. Frame it constructively as a 12-month development focus. Focus on actionable self-awareness regarding their interpersonal boundaries or demands.
Return ONLY the 2 paragraphs separated by a blank line.`,
    350
  );
};

const generateFiroClosingInsight = async (eI, wI, eC, wC, eA, wA, name) => {
  return callLLM(
    FIRO_SYSTEM,
    `Write a 1-sentence manager's takeaway summarizing ${name}'s interpersonal value-add based on FIRO-B (I: ${eI}/${wI}, C: ${eC}/${wC}, A: ${eA}/${wA}). It must be a memorable, human takeaway. Return ONLY the insight.`,
    150
  );
};

const generateFIRONarratives = async (reportData, testTaker) => {
  const eI = reportData.dimensions?.Expressed?.Inclusion || 0;
  const wI = reportData.dimensions?.Wanted?.Inclusion || 0;
  const eC = reportData.dimensions?.Expressed?.Control || 0;
  const wC = reportData.dimensions?.Wanted?.Control || 0;
  const eA = reportData.dimensions?.Expressed?.Affection || 0;
  const wA = reportData.dimensions?.Wanted?.Affection || 0;
  
  const name = testTaker?.name || 'the candidate';

  // Inline helper — splits text on double-newlines and wraps each block in <p>
  const toParas = (text) => (text || '').split(/\n\n+/).map(s => `<p>${s.trim()}</p>`).join('');

  try {
    const [coverSummary, deepProfile, leadershipInsight, developmentNarrative, closingInsight] =
      await Promise.all([
        generateFiroCoverSummary(eI, wI, eC, wC, eA, wA, name),
        generateFiroDeepProfile(eI, wI, eC, wC, eA, wA, name),
        generateFiroLeadershipInsight(eI, wI, eC, wC, eA, wA, name),
        generateFiroDevelopmentNarrative(eI, wI, eC, wC, eA, wA, name),
        generateFiroClosingInsight(eI, wI, eC, wC, eA, wA, name),
      ]);

    return { 
      coverSummary, 
      deepProfileHtml: toParas(deepProfile), 
      leadershipHtml: toParas(leadershipInsight), 
      developmentHtml: toParas(developmentNarrative), 
      closingInsight 
    };
  } catch (err) {
    console.error('FIRO-B narrative generation error:', err);
    return {
      coverSummary: `${name} presents a distinct FIRO-B interpersonal profile that provides essential clues to their preferred social environment. Their assessment maps exactly how they engage with teams across Inclusion, Control, and Affection.`,
      deepProfileHtml: toParas(`${name}'s inclusion dynamics indicate their fundamental approach to group involvement and networking. This dimension highlights whether they prefer to initiate contact and be in the center of activity or maintain a more detached, selective presence.\n\nTheir control dimension describes how they handle hierarchy, influence, and structured environments. It reveals the balance they strike between taking the reins and seeking direction from established leadership.\n\nFinally, their affection scores map their approach to building rapport and close 1-on-1 relationships. This dictates the level of emotional distance they naturally maintain in professional settings.`),
      leadershipHtml: toParas(`${name}'s leadership approach is heavily influenced by the interplay of their expressed behaviors. They lead by enacting their highest behavioral drive—whether that is bringing people together, asserting structure, or fostering interpersonal trust.\n\nUnderstanding the gap between what they express and what they want helps predict how they respond to stress. Coworkers communicating in their preferred dimension will find collaboration significantly more productive.`),
      developmentHtml: toParas(`The primary interpersonal growth opportunity for ${name} involves building awareness around any mismatch between their expressed behaviors and wanted needs. This often leads to misunderstood signals from colleagues.\n\nA deliberate focus on transparently communicating their expectations and recognizing when their internal needs are driving disproportionate reactions will enhance their leadership capacity.`),
      closingInsight: `${name}'s interpersonal profile provides an excellent blueprint for understanding their relational needs and optimizing their placement within team structures.`,
    };
  }
};

const getFIROStaticData = (reportData) => {
  // Extract scores from the new structure created in firoScoringService
  const expressed = reportData.dimensions?.Expressed || { Inclusion: 0, Control: 0, Affection: 0 };
  const wanted = reportData.dimensions?.Wanted || { Inclusion: 0, Control: 0, Affection: 0 };
  const totals = reportData.totals || { totalExpressed: 0, totalWanted: 0, overallTotal: 0 };
  
  const eI = expressed.Inclusion, wI = wanted.Inclusion;
  const eC = expressed.Control,   wC = wanted.Control;
  const eA = expressed.Affection, wA = wanted.Affection;

  const inclusionTotal = eI + wI;
  const controlTotal = eC + wC;
  const affectionTotal = eA + wA;

  const getBand = (score) => {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const getBandTotal = (score) => {
    if (score >= 13) return 'high';
    if (score >= 8) return 'medium';
    return 'low';
  };

  const eI_band = getBand(eI), wI_band = getBand(wI);
  const eC_band = getBand(eC), wC_band = getBand(wC);
  const eA_band = getBand(eA), wA_band = getBand(wA);

  // Interpretation helpers
  const inclusionFulfillment = [];
  if (eI_band === 'high' && wI_band === 'high') {
    inclusionFulfillment.push('You include others and like to be included.');
    inclusionFulfillment.push('You enjoy the opportunity to provide input.');
    inclusionFulfillment.push('You don’t like to get cut off from information and updates.');
    inclusionFulfillment.push('You seek recognition and endorsement from colleagues and superiors.');
  } else if (eI_band === 'low' && wI_band === 'low') {
    inclusionFulfillment.push('You prefer to work quietly without much interaction.');
    inclusionFulfillment.push('You may avoid group gatherings voluntarily.');
    inclusionFulfillment.push('You do not require constant updates or inclusions to feel secure.');
  } else {
    inclusionFulfillment.push('Your need to include others is balanced by an awareness of when to work independently.');
    inclusionFulfillment.push('You engage in group activities contextually, and on your terms.');
  }

  const controlFulfillment = [];
  if (eC_band === 'low' && wC_band === 'high') {
    controlFulfillment.push('You may accept direction from those in authority.');
    controlFulfillment.push('You may not be interested in gaining formal influence.');
    controlFulfillment.push('You are a loyal and cooperative member of the organization.');
    controlFulfillment.push('You like to perform your work according to standard operating procedures.');
  } else if (eC_band === 'high' && wC_band === 'low') {
    controlFulfillment.push('You naturally take charge of situations and direct others.');
    controlFulfillment.push('You prefer autonomous work environments with minimal supervision.');
    controlFulfillment.push('You assume leadership roles effectively when ambiguity is present.');
  } else {
    controlFulfillment.push('You establish a moderate balance of seeking direction and offering guidance.');
    controlFulfillment.push('You are comfortable collaborating on shared goals with established peers.');
  }

  const affectionFulfillment = [];
  if (eA_band === 'high' && wA_band === 'high') {
    affectionFulfillment.push('You are friendly, open, and optimistic.');
    affectionFulfillment.push('You value trustworthiness and meaningful personal bonds.');
    affectionFulfillment.push('You prefer to motivate others by praise and support and are best motivated in the same way.');
    affectionFulfillment.push('You may enjoy resolving conflicts and negotiating.');
  } else if (eA_band === 'low' && wA_band === 'low') {
    affectionFulfillment.push('You maintain a strictly professional demeanor at work.');
    affectionFulfillment.push('You keep personal thoughts and feelings private.');
    affectionFulfillment.push('You prefer objective feedback over emotional support.');
  } else {
    affectionFulfillment.push('You form selective, strong bonds with a few trusted individuals rather than broad arrays of people.');
    affectionFulfillment.push('You recognize boundaries between work and social relationships effectively.');
  }

  const careerInclusion = getBandTotal(inclusionTotal) === 'high' 
    ? ['You have a lot of opportunity to interact with others', 'There are multiple pathways for achieving recognition and status', 'The organization rewards teamwork']
    : ['You have long stretches of uninterrupted deep work', 'Performance is measured individually rather than as a unit', 'You are given distinct tasks with clear boundaries'];

  const careerControl = getBandTotal(controlTotal) === 'medium'
    ? ['New challenges and opportunities are provided with equal amounts of support and self-direction', 'Your job responsibilities include some tasks that are all yours and others that are shared', 'There are general guidelines for performance, but flexibility to deal with exceptions']
    : (getBandTotal(controlTotal) === 'high' ? ['You are given explicit hierarchical tracks', 'Leadership and management paths are well-defined', 'You can clearly shape and govern outcomes'] : ['The environment is flat and non-hierarchical', 'You do not have to manage complex personnel issues', 'Expectations are loose and adaptable']);

  const careerAffection = getBandTotal(affectionTotal) === 'high'
    ? ['The organizational climate is characterized by warmth and personal interest in employees', 'Encouragement and cooperation are welcomed and freely exchanged', 'The organization tries to make the workplace a home away from home']
    : ['The primary focus is on task execution rather than social harmony', 'Feedback is direct, objective, and detached', 'Professional boundaries are strictly maintained'];

  // Identify highest and lowest expressed
  const expressedArray = [
    { name: 'Inclusion', score: eI },
    { name: 'Control', score: eC },
    { name: 'Affection', score: eA }
  ];
  expressedArray.sort((a,b) => b.score - a.score);
  const highestExpressed = expressedArray[0].name;
  const lowestExpressed = expressedArray[2].name;

  return {
    scores: {
      eI, wI, eC, wC, eA, wA,
      inclusionTotal, controlTotal, affectionTotal,
      totalExpressed: totals.totalExpressed,
      totalWanted: totals.totalWanted,
      overallTotal: totals.overallTotal
    },
    fulfillment: {
      Inclusion: inclusionFulfillment,
      Control: controlFulfillment,
      Affection: affectionFulfillment
    },
    career: {
      inclusionBand: getBandTotal(inclusionTotal),
      inclusionTips: careerInclusion,
      controlBand: getBandTotal(controlTotal),
      controlTips: careerControl,
      affectionBand: getBandTotal(affectionTotal),
      affectionTips: careerAffection
    },
    leadership: {
      highestExpressed,
      lowestExpressed
    }
  };
};

// ─────────────────────────────────────────────────────────────────
// PCLA NARRATIVE GENERATORS
// ─────────────────────────────────────────────────────────────────

const PCLA_SYSTEM = `You are a senior organizational psychologist and executive coach specializing in learning agility and coachability assessment.
Write in clear, authoritative prose — no bullet points, no JSON, no markdown headers.
Address the hiring manager or HR professional reading this confidential PCLA™ report.
Be specific, insightful, and grounded in research on adult learning, coachability, and professional development.
CRITICAL TONE GUIDELINES:
1. Adopt a polite, diplomatic, and highly constructive tone. Avoid blunt or direct language.
2. Frame all development areas as opportunities for growth rather than deficits.
3. Discuss the candidate's learning mindset, adaptability signals, and coaching ROI potential with nuance.`;

const generatePclaCoverSummary = async (ci, band, archetype, radarScores, name) => {
  return callLLM(
    PCLA_SYSTEM,
    `Write a 2-sentence executive headline for ${name}'s PCLA — Professional Coachability & Learning Agility Index report.
Coachability Index: ${ci}/100 — Band: ${band} — Archetype: ${archetype}
Radar Scores — Coachability: ${radarScores.Coachability || 0}%, Learning Orientation: ${radarScores['Learning Orientation'] || 0}%, Unlearning: ${radarScores['Unlearning Ability'] || 0}%, Tech Adaptability: ${radarScores['Technology Adaptability'] || 0}%, Reflection: ${radarScores['Reflection & Self-awareness'] || 0}%, Growth Drive: ${radarScores['Growth Drive'] || 0}%
The summary should capture their learning agility signature and coaching ROI potential in 2 memorable sentences.
Return ONLY the 2 sentences, no labels.`,
    180
  );
};

const generatePclaDeepProfile = async (ci, band, archetype, radarScores, dimScores, name) => {
  const dimText = Object.entries(dimScores)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}%`)
    .join(', ');
  return callLLM(
    PCLA_SYSTEM,
    `Write a 3-paragraph coachability deep-dive for ${name} based on their PCLA profile.
Coachability Index: ${ci}/100 — Band: ${band} — Archetype: ${archetype}
Dimension Scores: ${dimText}
Para 1: Learning mindset and coachability disposition — how open they are to feedback, how they process developmental input, and their baseline receptivity to coaching.
Para 2: Their adaptability and unlearning ability — how easily they let go of old patterns and embrace new approaches, technology, and ways of thinking.
Para 3: Their reflection, self-awareness, and growth drive — what motivates their professional development and how they translate experience into wisdom.
Each paragraph: 3–4 sentences. Psychologist-level depth, not generic HR boilerplate.
Return ONLY the 3 paragraphs separated by blank lines.`,
    520
  );
};

const generatePclaLeadershipInsight = async (ci, band, archetype, radarScores, dimScores, strongest, weakest, name) => {
  return callLLM(
    PCLA_SYSTEM,
    `Write 2 paragraphs on ${name}'s leadership development potential and team dynamics based on their PCLA profile.
Coachability Index: ${ci}/100 — Archetype: ${archetype}
Strongest Dimension: ${strongest} — Development Priority: ${weakest}
Focus on how their coachability profile shapes their ability to grow into senior roles, respond to feedback from stakeholders, and navigate complex organizational dynamics.
Return ONLY the 2 paragraphs separated by a blank line.`,
    350
  );
};

const generatePclaDevelopmentNarrative = async (ci, band, archetype, radarScores, strongest, weakest, name) => {
  return callLLM(
    PCLA_SYSTEM,
    `Write 2 paragraphs on professional development opportunities for ${name} based on their PCLA profile.
Coachability Index: ${ci}/100 — Band: ${band} — Archetype: ${archetype}
Strongest: ${strongest} — Weakest: ${weakest}
Identify the greatest coaching leverage point in their profile. Frame it constructively as a 12-month development focus with specific recommendations. Address how their learning style affects their response to coaching interventions.
Return ONLY the 2 paragraphs separated by a blank line.`,
    350
  );
};

const generatePclaClosingInsight = async (ci, band, archetype, name) => {
  return callLLM(
    PCLA_SYSTEM,
    `Write a 1-sentence manager's takeaway summarizing ${name}'s learning agility and coachability based on PCLA (Coachability Index: ${ci}/100, Band: ${band}, Archetype: ${archetype}). It must be a memorable, human takeaway about their development potential. Return ONLY the insight.`,
    150
  );
};

const generatePCLANarratives = async (reportData, testTaker) => {
  const ci = reportData.coachabilityIndex || 0;
  const band = reportData.band || 'N/A';
  const archetype = reportData.archetype || 'Learning Professional';
  const radarScores = reportData.radarScores || {};
  const dimScores = reportData.dimensionScores || {};
  const strongest = reportData.strongestDimension || (Object.entries(dimScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A');
  const weakest = reportData.weakestDimension || (Object.entries(dimScores).sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A');
  const name = testTaker?.name || 'the candidate';

  const toParas = (text) => (text || '').split(/\n\n+/).map(s => `<p>${s.trim()}</p>`).join('');

  try {
    const [coverSummary, deepProfile, leadershipInsight, developmentNarrative, closingInsight] =
      await Promise.all([
        generatePclaCoverSummary(ci, band, archetype, radarScores, name),
        generatePclaDeepProfile(ci, band, archetype, radarScores, dimScores, name),
        generatePclaLeadershipInsight(ci, band, archetype, radarScores, dimScores, strongest, weakest, name),
        generatePclaDevelopmentNarrative(ci, band, archetype, radarScores, strongest, weakest, name),
        generatePclaClosingInsight(ci, band, archetype, name),
      ]);

    return {
      coverSummary,
      deepProfileHtml: toParas(deepProfile),
      leadershipHtml: toParas(leadershipInsight),
      developmentHtml: toParas(developmentNarrative),
      closingInsight,
    };
  } catch (err) {
    console.error('PCLA narrative generation error:', err);
    return {
      coverSummary: `${name} presents a Coachability Index of ${ci}/100 (${band}), indicating their readiness to benefit from coaching and professional development interventions. Their learning agility profile provides valuable insights for maximizing training ROI.`,
      deepProfileHtml: toParas(`${name}'s coachability profile reveals a ${archetype} learning personality. Their receptivity to feedback and developmental input shapes how effectively they translate experience into growth.\n\nTheir adaptability signals indicate how readily they embrace new approaches and technologies. This dimension of their profile determines how efficiently they can pivot when roles or strategies change.\n\nTheir growth drive and self-awareness complete the picture of their development potential. Together, these dimensions create a distinct coachability signature that predicts their response to various development interventions.`),
      leadershipHtml: toParas(`${name}'s potential for leadership development is shaped by their learning agility profile. Their ability to absorb feedback and adapt behavior will be a key factor in their advancement trajectory.\n\nThe gap between their strongest and weakest coachability dimensions highlights where coaching investment will yield the highest return.`),
      developmentHtml: toParas(`The primary coaching leverage point for ${name} lies in strengthening their ${weakest} dimension. A focused 12-month development plan should pair targeted interventions here with opportunities that leverage their strength in ${strongest}.\n\nTheir ${archetype} learning style suggests that experiential coaching methods combined with reflective practice will be most effective.`),
      closingInsight: `${name}'s PCLA profile provides a clear roadmap for maximizing their development investment — focusing coaching where the ROI is highest and leveraging their natural learning strengths.`,
    };
  }
};

// ─────────────────────────────────────────────────────────────────
// ESJI (SJT) NARRATIVE GENERATORS
// ─────────────────────────────────────────────────────────────────

const ESJI_SYSTEM = `You are a senior executive assessment psychologist specializing in leadership under pressure and situational judgement.
Write in clear, authoritative prose — no bullet points, no JSON, no markdown headers.
Address the hiring manager or HR professional reading this confidential ESJI™ report.
Be specific, insightful, and grounded in research on executive decision-making, crisis leadership, and management potential.
CRITICAL TONE GUIDELINES:
1. Adopt a polite, diplomatic, and highly constructive tone. Avoid blunt or direct language.
2. Frame all development areas as opportunities for growth rather than deficits.
3. Discuss the candidate's leadership signal, decision quality, and executive readiness with nuance.`;

const generateEsjiCoverSummary = async (si, band, grade, percentile, radarScores, name) => {
  return callLLM(
    ESJI_SYSTEM,
    `Write a 2-sentence executive headline for ${name}'s ESJI — Executive Situational Judgement Index report.
Situational Index: ${si}/100 — Band: ${band} — Grade: ${grade} — Percentile: ${percentile}th
Radar Scores — Composure: ${radarScores.Composure || 0}%, Decision Quality: ${radarScores['Decision Quality'] || 0}%, Crisis Communication: ${radarScores['Crisis Communication'] || 0}%, Stakeholder Handling: ${radarScores['Stakeholder Handling'] || 0}%, Business Continuity: ${radarScores['Business Continuity'] || 0}%, Resourcefulness: ${radarScores.Resourcefulness || 0}%, Escalation Judgement: ${radarScores['Escalation Judgement'] || 0}%
The summary should capture their executive leadership signal and crisis decision-making profile in 2 memorable sentences.
Return ONLY the 2 sentences, no labels.`,
    180
  );
};

const generateEsjiDeepProfile = async (si, band, grade, radarScores, dimScores, name) => {
  const dimText = Object.entries(dimScores)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}%`)
    .join(', ');
  return callLLM(
    ESJI_SYSTEM,
    `Write a 3-paragraph leadership under pressure deep-dive for ${name} based on their ESJI profile.
Situational Index: ${si}/100 — Band: ${band} — Grade: ${grade}
Dimension Scores: ${dimText}
Para 1: Their core leadership signal under pressure — how they handle crisis, ambiguity, and high-stakes decision-making. What drives their situational judgement.
Para 2: Their team and stakeholder dynamics — how they communicate during crisis, manage escalation, and maintain composure when leading others through uncertainty.
Para 3: Their executive maturity and readiness — how their pattern across all dimensions signals readiness for larger roles, and what distinguishes their leadership approach.
Each paragraph: 3–4 sentences. Executive assessment depth, not generic feedback.
Return ONLY the 3 paragraphs separated by blank lines.`,
    520
  );
};

const generateEsjiLeadershipInsight = async (si, band, radarScores, strongest, weakest, name) => {
  return callLLM(
    ESJI_SYSTEM,
    `Write 2 paragraphs on ${name}'s leadership style and team impact based on their ESJI profile.
Situational Index: ${si}/100 — Band: ${band}
Strongest Competency: ${strongest} — Development Priority: ${weakest}
Radar: Composure=${radarScores.Composure || 0}%, Decision=${radarScores['Decision Quality'] || 0}%, Communication=${radarScores['Crisis Communication'] || 0}%, Stakeholder=${radarScores['Stakeholder Handling'] || 0}%, Continuity=${radarScores['Business Continuity'] || 0}%, Resourcefulness=${radarScores.Resourcefulness || 0}%, Escalation=${radarScores['Escalation Judgement'] || 0}%
Focus on how their situational judgement profile shapes their leadership approach, their crisis response style, and the kind of team environments where they thrive and struggle.
Return ONLY the 2 paragraphs separated by a blank line.`,
    350
  );
};

const generateEsjiDevelopmentNarrative = async (si, band, grade, radarScores, strongest, weakest, name) => {
  return callLLM(
    ESJI_SYSTEM,
    `Write 2 paragraphs on professional development opportunities for ${name} based on their ESJI profile.
Situational Index: ${si}/100 — Band: ${band} — Grade: ${grade}
Strongest: ${strongest} — Weakest: ${weakest}
Identify the highest-leverage development area in their leadership profile. Frame it constructively as a 12-month executive development focus. Address how their current situational judgement strengths can be leveraged to build their weaker areas.
Return ONLY the 2 paragraphs separated by a blank line.`,
    350
  );
};

const generateEsjiClosingInsight = async (si, band, grade, name) => {
  return callLLM(
    ESJI_SYSTEM,
    `Write a 1-sentence manager's takeaway summarizing ${name}'s executive leadership potential based on ESJI (Situational Index: ${si}/100, Band: ${band}, Grade: ${grade}). It must be a memorable, human takeaway about their crisis leadership and promotion readiness. Return ONLY the insight.`,
    150
  );
};

const generateSJTNarratives = async (reportData, testTaker) => {
  const sjtData = reportData.sjtResults || reportData.attempt?.sjtResults || reportData.scores || reportData;
  const si = sjtData.situationalIndex ?? Math.round(sjtData.percentage || 0);
  const band = sjtData.band || 'Developing';
  const grade = sjtData.grade || 'C';
  const percentile = sjtData.percentile || 50;
  const radarScores = sjtData.radar || {};
  const dimScores = sjtData.dimensionScores || {};
  const strongest = sjtData.strongestDimension || (Object.entries(dimScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A');
  const weakest = sjtData.weakestDimension || (Object.entries(dimScores).sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A');
  const name = testTaker?.name || 'the candidate';

  const toParas = (text) => (text || '').split(/\n\n+/).map(s => `<p>${s.trim()}</p>`).join('');

  try {
    const [coverSummary, deepProfile, leadershipInsight, developmentNarrative, closingInsight] =
      await Promise.all([
        generateEsjiCoverSummary(si, band, grade, percentile, radarScores, name),
        generateEsjiDeepProfile(si, band, grade, radarScores, dimScores, name),
        generateEsjiLeadershipInsight(si, band, radarScores, strongest, weakest, name),
        generateEsjiDevelopmentNarrative(si, band, grade, radarScores, strongest, weakest, name),
        generateEsjiClosingInsight(si, band, grade, name),
      ]);

    return {
      coverSummary,
      deepProfileHtml: toParas(deepProfile),
      leadershipHtml: toParas(leadershipInsight),
      developmentHtml: toParas(developmentNarrative),
      closingInsight,
    };
  } catch (err) {
    console.error('ESJI narrative generation error:', err);
    return {
      coverSummary: `${name} presents an Executive Situational Index of ${si}/100 (${band}, Grade ${grade}, ${percentile}th percentile), indicating their capacity for leadership under pressure and complex decision-making. Their profile provides a clear signal of their executive readiness and crisis management potential.`,
      deepProfileHtml: toParas(`${name}'s ESJI profile reveals a distinct leadership signature shaped by their pattern across all seven executive competencies measured. Their strongest areas indicate where they naturally excel in high-stakes environments.\n\nTheir situational judgement under pressure reflects how they process complex scenarios, weigh competing priorities, and make decisions when stakes are high. This composite signal is the most reliable predictor of their crisis leadership capability.\n\nAcross all dimensions, their profile paints a picture of their executive maturity and readiness. Understanding this full pattern is essential for placing them in roles where they can succeed and grow.`),
      leadershipHtml: toParas(`${name}'s leadership style is shaped by the interplay of their strongest and weakest competencies. Their approach to team leadership during crisis reflects their composite profile across all seven dimensions.\n\nThe gap between their peak competency (${strongest}) and development priority (${weakest}) provides clear direction for leadership coaching. Strengthening the weaker area while leveraging the stronger one creates the fastest path to executive readiness.`),
      developmentHtml: toParas(`The highest-leverage development opportunity for ${name} centers around strengthening their ${weakest} competency. A focused 12-month executive development plan should pair targeted coaching here with stretch assignments that build on their strength in ${strongest}.\n\nTheir current profile at Band ${band} (Grade ${grade}) suggests that deliberate practice in real-world high-stakes scenarios, combined with structured reflection, will accelerate their readiness for larger leadership roles.`),
      closingInsight: `${name}'s ESJI profile provides a clear signal of their executive leadership potential under pressure — focusing development on their competency gaps will unlock their readiness for broader leadership responsibility.`,
    };
  }
};

module.exports = {
  generateDISCNarratives,
  generateBig5Narratives,
  generateFIRONarratives,
  generatePCLANarratives,
  generateSJTNarratives,
  getDISCStaticData,
  getBig5StaticData,
  getFIROStaticData,
  DISC_TRAITS,
  BIG5_TRAITS,
  PATTERN_PROFILES,
};
