const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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'
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
Be specific, insightful, and avoid generic filler phrases.`;

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
Be specific, insightful, and grounded in psychometric research.`;

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

const generateDISCNarratives = async (reportData, testTaker) => {
  const { percentages = {}, dominant = 'D', secondary = 'I' } = reportData;
  const pattern = reportData.pattern || `${dominant}${secondary}`;
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

const generateBig5Narratives = async (reportData, testTaker) => {
  const scores = reportData.scores || {};
  const normalized = {
    Openness: Math.round(scores.Openness || scores.openness || 0),
    Conscientiousness: Math.round(scores.Conscientiousness || scores.conscientiousness || 0),
    Extraversion: Math.round(scores.Extraversion || scores.extraversion || 0),
    Agreeableness: Math.round(scores.Agreeableness || scores.agreeableness || 0),
    Neuroticism: Math.round(scores.Neuroticism || scores.neuroticism || 0),
  };
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
  const { percentages = {}, dominant = 'D', secondary = 'I' } = reportData;
  const pattern = reportData.pattern || `${dominant}${secondary}`;
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
  const scores = reportData.scores || {};
  const normalized = {
    Openness: Math.round(scores.Openness || scores.openness || 0),
    Conscientiousness: Math.round(scores.Conscientiousness || scores.conscientiousness || 0),
    Extraversion: Math.round(scores.Extraversion || scores.extraversion || 0),
    Agreeableness: Math.round(scores.Agreeableness || scores.agreeableness || 0),
    Neuroticism: Math.round(scores.Neuroticism || scores.neuroticism || 0),
  };

  // Determine dominant trait
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

module.exports = {
  generateDISCNarratives,
  generateBig5Narratives,
  getDISCStaticData,
  getBig5StaticData,
  DISC_TRAITS,
  BIG5_TRAITS,
  PATTERN_PROFILES,
};
