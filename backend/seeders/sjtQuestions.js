/**
 * Executive Situational Judgement Index (ESJI™) — 40 Questions
 * Scoring: Best=4, Good=3, Weak=2, Poor=1
 * Each question maps to a named dimension/competency
 */

const SJT_QUESTIONS = [
  // PART 1 — Q1–Q12: Immediate Crisis Leadership
  {
    order: 1,
    questionText: "Q1 — Client Escalation Crisis\n\nA major client angrily escalates repeated delivery failures and threatens contract termination. Your team is visibly anxious.\n\nYour first move:",
    dimension: "Crisis Leadership",
    options: [
      { key: "A", text: "Defend your team immediately", weight: 2 },
      { key: "B", text: "Wait until emotions cool down", weight: 2 },
      { key: "C", text: "Stabilize stakeholders, gather facts quickly, and create a visible recovery plan with communication cadence", weight: 4 },
      { key: "D", text: "Escalate blame internally", weight: 1 },
    ]
  },
  {
    order: 2,
    questionText: "Q2 — Team Panic Situation\n\nA critical system outage affects operations, and your team starts panicking.\n\nYou:",
    dimension: "Composure Under Stress",
    options: [
      { key: "A", text: "React emotionally and demand answers", weight: 1 },
      { key: "B", text: "Take control calmly, assign responsibilities, prioritize recovery actions, and communicate confidence", weight: 4 },
      { key: "C", text: "Wait for technical experts only", weight: 2 },
      { key: "D", text: "Escalate immediately without assessment", weight: 2 },
    ]
  },
  {
    order: 3,
    questionText: "Q3 — Impossible Deadline\n\nLeadership demands delivery in 5 days for work realistically needing 12 days.\n\nBest response:",
    dimension: "Decision Under Pressure",
    options: [
      { key: "A", text: "Agree immediately and pressure team", weight: 1 },
      { key: "B", text: "Reject outright", weight: 2 },
      { key: "C", text: "Reassess scope, prioritize essentials, negotiate trade-offs, and align realistic delivery architecture", weight: 4 },
      { key: "D", text: "Delay response", weight: 1 },
    ]
  },
  {
    order: 4,
    questionText: "Q4 — Critical Resource Loss\n\nA key team member exits suddenly during a high-priority project.\n\nYou:",
    dimension: "Resourcefulness",
    options: [
      { key: "A", text: "Panic about delivery risk", weight: 1 },
      { key: "B", text: "Redistribute work without planning", weight: 2 },
      { key: "C", text: "Re-map dependencies, prioritize critical tasks, and activate backup capability quickly", weight: 4 },
      { key: "D", text: "Escalate helplessly", weight: 1 },
    ]
  },
  {
    order: 5,
    questionText: "Q5 — Customer Anger\n\nA demanding customer becomes hostile during a review call.\n\nBest response:",
    dimension: "Stakeholder Handling",
    options: [
      { key: "A", text: "Match aggression", weight: 1 },
      { key: "B", text: "Stay silent", weight: 2 },
      { key: "C", text: "Acknowledge concerns calmly, reframe conversation toward facts, actions, and trust rebuilding", weight: 4 },
      { key: "D", text: "End the discussion abruptly", weight: 1 },
    ]
  },
  {
    order: 6,
    questionText: "Q6 — Project Slippage\n\nA strategic project slips significantly, but publicly exposing it may create executive concern.\n\nYou:",
    dimension: "Leadership Integrity Under Pressure",
    options: [
      { key: "A", text: "Hide issue temporarily", weight: 1 },
      { key: "B", text: "Minimize severity", weight: 2 },
      { key: "C", text: "Surface reality early, propose mitigation, and demonstrate control through action planning", weight: 4 },
      { key: "D", text: "Wait for others to notice", weight: 1 },
    ]
  },
  {
    order: 7,
    questionText: "Q7 — Simultaneous Priorities\n\nThree urgent business issues hit at once.\n\nYou:",
    dimension: "Prioritization Under Stress",
    options: [
      { key: "A", text: "Jump between issues reactively", weight: 2 },
      { key: "B", text: "Focus only on loudest escalation", weight: 2 },
      { key: "C", text: "Triage by business impact, assign owners, and manage execution rhythm deliberately", weight: 4 },
      { key: "D", text: "Wait for leadership instruction", weight: 1 },
    ]
  },
  {
    order: 8,
    questionText: "Q8 — Team Morale Under Stress\n\nYour team is exhausted after sustained delivery pressure.\n\nYou:",
    dimension: "Sustainable Leadership",
    options: [
      { key: "A", text: "Push harder", weight: 1 },
      { key: "B", text: "Ignore morale signals", weight: 1 },
      { key: "C", text: "Balance delivery expectations with energy management, recognition, and recovery capacity", weight: 4 },
      { key: "D", text: "Replace tired staff quickly", weight: 2 },
    ]
  },
  {
    order: 9,
    questionText: "Q9 — Operational Ambiguity\n\nConflicting reports arrive during a crisis.\n\nYou:",
    dimension: "Judgement in Ambiguity",
    options: [
      { key: "A", text: "Act on first information", weight: 2 },
      { key: "B", text: "Freeze due to uncertainty", weight: 1 },
      { key: "C", text: "Validate key facts quickly, make provisional decisions, and adapt as clarity improves", weight: 4 },
      { key: "D", text: "Escalate confusion upward", weight: 1 },
    ]
  },
  {
    order: 10,
    questionText: "Q10 — Reputation Risk\n\nA service failure may damage brand reputation.\n\nYou:",
    dimension: "Enterprise Crisis Thinking",
    options: [
      { key: "A", text: "Focus only internally", weight: 2 },
      { key: "B", text: "Hide external impact", weight: 1 },
      { key: "C", text: "Manage operations, stakeholder messaging, and brand confidence simultaneously", weight: 4 },
      { key: "D", text: "Wait for PR team only", weight: 2 },
    ]
  },
  {
    order: 11,
    questionText: "Q11 — Senior Leadership Pressure\n\nSenior leadership demands hourly updates during crisis, distracting execution teams.\n\nYou:",
    dimension: "Managing Upward Under Pressure",
    options: [
      { key: "A", text: "Keep updating constantly", weight: 2 },
      { key: "B", text: "Ignore update requests", weight: 1 },
      { key: "C", text: "Establish structured update cadence that informs leadership without disrupting execution focus", weight: 4 },
      { key: "D", text: "Complain about pressure", weight: 1 },
    ]
  },
  {
    order: 12,
    questionText: "Q12 — Personal Stress\n\nYou feel mentally overwhelmed during a demanding period.\n\nYou:",
    dimension: "Self-management",
    options: [
      { key: "A", text: "Hide stress completely", weight: 2 },
      { key: "B", text: "Let emotions drive behaviour", weight: 1 },
      { key: "C", text: "Regulate yourself, seek support where needed, and maintain professional steadiness", weight: 4 },
      { key: "D", text: "Withdraw from responsibility", weight: 1 },
    ]
  },

  // PART 2 — Q13–Q24: Stakeholder Pressure & Executive Composure
  {
    order: 13,
    questionText: "Q13 — Conflicting Executive Priorities\n\nTwo senior leaders give conflicting directions on a strategic project, both expecting immediate execution.\n\nYou:",
    dimension: "Executive Alignment Judgement",
    options: [
      { key: "A", text: "Follow the more powerful leader", weight: 2 },
      { key: "B", text: "Delay execution until conflict resolves itself", weight: 1 },
      { key: "C", text: "Clarify intent, surface the conflict diplomatically, and align stakeholders around business priorities before execution", weight: 4 },
      { key: "D", text: "Ask your team to guess the best direction", weight: 1 },
    ]
  },
  {
    order: 14,
    questionText: "Q14 — Critical Client Commitment Risk\n\nA major client expects a commitment by end of day, but operational feasibility is uncertain.\n\nYou:",
    dimension: "Client Pressure Management",
    options: [
      { key: "A", text: "Commit immediately to protect relationship", weight: 1 },
      { key: "B", text: "Avoid responding until certainty emerges", weight: 2 },
      { key: "C", text: "Communicate transparently, confirm what is feasible, and align expectations while protecting trust", weight: 4 },
      { key: "D", text: "Push operations to commit regardless", weight: 1 },
    ]
  },
  {
    order: 15,
    questionText: "Q15 — Team Breakdown During Crisis\n\nA stressed project team begins blaming each other publicly during a critical delivery period.\n\nYou:",
    dimension: "Team Leadership Under Pressure",
    options: [
      { key: "A", text: "Allow conflict to play out", weight: 1 },
      { key: "B", text: "Take sides quickly", weight: 2 },
      { key: "C", text: "Stabilize emotions, reset shared purpose, clarify ownership, and restore execution discipline", weight: 4 },
      { key: "D", text: "Escalate team conflict immediately", weight: 1 },
    ]
  },
  {
    order: 16,
    questionText: "Q16 — Resource Shortfall\n\nBudget cuts reduce manpower in a mission-critical account.\n\nYou:",
    dimension: "Business Continuity Thinking",
    options: [
      { key: "A", text: "Deliver same commitments with fewer people indefinitely", weight: 2 },
      { key: "B", text: "Lower service quietly", weight: 1 },
      { key: "C", text: "Reprioritize service architecture, redesign workflows, and align expectations transparently with stakeholders", weight: 4 },
      { key: "D", text: "Wait for business to solve it", weight: 1 },
    ]
  },
  {
    order: 17,
    questionText: "Q17 — Executive Escalation Pressure\n\nSenior leadership demands immediate escalation on every operational issue.\n\nYou:",
    dimension: "Escalation Judgement",
    options: [
      { key: "A", text: "Escalate everything upward", weight: 2 },
      { key: "B", text: "Resist escalation requests", weight: 1 },
      { key: "C", text: "Filter strategically—solve what can be solved locally, escalate only material risks with solution framing", weight: 4 },
      { key: "D", text: "Delay escalation entirely", weight: 1 },
    ]
  },
  {
    order: 18,
    questionText: "Q18 — High Visibility Failure\n\nA mistake by your team becomes visible to senior leadership and key customers.\n\nYou:",
    dimension: "Accountability Under Pressure",
    options: [
      { key: "A", text: "Protect team by hiding root causes", weight: 1 },
      { key: "B", text: "Shift blame externally", weight: 1 },
      { key: "C", text: "Own the situation, address facts transparently, and lead visible corrective recovery confidently", weight: 4 },
      { key: "D", text: "Stay silent until asked", weight: 1 },
    ]
  },
  {
    order: 19,
    questionText: "Q19 — Sustained Workload Stress\n\nYour team has been operating at peak pressure for months.\n\nYou:",
    dimension: "Sustainable Execution Leadership",
    options: [
      { key: "A", text: "Keep intensity high without change", weight: 1 },
      { key: "B", text: "Assume pressure is part of work", weight: 2 },
      { key: "C", text: "Rebalance workload, create capacity buffers, and protect long-term execution sustainability", weight: 4 },
      { key: "D", text: "Replace tired employees", weight: 1 },
    ]
  },
  {
    order: 20,
    questionText: "Q20 — Operational Ambiguity\n\nInformation is incomplete, but business cannot wait for perfect clarity.\n\nYou:",
    dimension: "Decision-making in Ambiguity",
    options: [
      { key: "A", text: "Wait for full data", weight: 1 },
      { key: "B", text: "Make random quick decisions", weight: 1 },
      { key: "C", text: "Build the best fact pattern available, make a provisional decision, and adapt dynamically as information improves", weight: 4 },
      { key: "D", text: "Escalate uncertainty upward", weight: 2 },
    ]
  },
  {
    order: 21,
    questionText: "Q21 — Difficult Customer Negotiation\n\nA key client demands concessions that hurt your business margins significantly.\n\nYou:",
    dimension: "Commercial Stakeholder Judgement",
    options: [
      { key: "A", text: "Accept to retain account", weight: 2 },
      { key: "B", text: "Reject bluntly", weight: 2 },
      { key: "C", text: "Understand underlying client needs, explore alternatives, and negotiate value without damaging business sustainability", weight: 4 },
      { key: "D", text: "Delay engagement", weight: 1 },
    ]
  },
  {
    order: 22,
    questionText: "Q22 — Multiple Firefights\n\nThree urgent business problems arise simultaneously: client escalation, delivery failure, internal people issue.\n\nYou:",
    dimension: "Pressure Prioritization",
    options: [
      { key: "A", text: "Focus only on the loudest problem", weight: 2 },
      { key: "B", text: "React to all simultaneously without structure", weight: 1 },
      { key: "C", text: "Prioritize by business impact, assign capable owners, and manage rhythm of execution deliberately", weight: 4 },
      { key: "D", text: "Wait for leadership instruction", weight: 1 },
    ]
  },
  {
    order: 23,
    questionText: "Q23 — Organizational Politics Under Stress\n\nA politically influential stakeholder pressures you to divert resources unfairly to their agenda during a critical period.\n\nYou:",
    dimension: "Political Pressure Handling",
    options: [
      { key: "A", text: "Comply immediately", weight: 2 },
      { key: "B", text: "Resist emotionally", weight: 1 },
      { key: "C", text: "Stay calm, anchor resource allocation to transparent business priorities, and communicate rationale professionally", weight: 4 },
      { key: "D", text: "Avoid decision", weight: 1 },
    ]
  },
  {
    order: 24,
    questionText: "Q24 — Personal Leadership Presence\n\nDuring intense stress, teams begin looking to you for emotional cues.\n\nYou:",
    dimension: "Leadership Presence Under Stress",
    options: [
      { key: "A", text: "Show visible anxiety", weight: 1 },
      { key: "B", text: "Withdraw from communication", weight: 1 },
      { key: "C", text: "Demonstrate calm, clarity, confidence, and realistic optimism that stabilizes others", weight: 4 },
      { key: "D", text: "Overpromise confidence without realism", weight: 2 },
    ]
  },

  // PART 3 — Q25–Q40: Executive Resilience & Strategic Calm
  {
    order: 25,
    questionText: "Q25 — Long-running Crisis Fatigue\n\nYour organization has been in continuous firefighting mode for months. Leadership energy is dropping, teams are exhausted, and execution quality is slipping.\n\nYou:",
    dimension: "Resilience Leadership",
    options: [
      { key: "A", text: "Push harder until results improve", weight: 2 },
      { key: "B", text: "Wait for pressure to naturally reduce", weight: 1 },
      { key: "C", text: "Reset priorities, simplify execution focus, restore energy, and create sustainable operating rhythm", weight: 4 },
      { key: "D", text: "Replace teams aggressively", weight: 1 },
    ]
  },
  {
    order: 26,
    questionText: "Q26 — Strategic Reputation Risk\n\nA high-profile failure could damage investor confidence and client trust.\n\nYou:",
    dimension: "Enterprise Crisis Thinking",
    options: [
      { key: "A", text: "Minimize disclosure", weight: 1 },
      { key: "B", text: "Focus only on fixing operations internally", weight: 2 },
      { key: "C", text: "Address operations, stakeholder confidence, and trust messaging simultaneously with transparency and control", weight: 4 },
      { key: "D", text: "Let communications team handle reputation separately", weight: 2 },
    ]
  },
  {
    order: 27,
    questionText: "Q27 — Severe Resource Constraint\n\nDemand is rising sharply, but resources are constrained and hiring is frozen.\n\nYou:",
    dimension: "Adaptive Resourcefulness",
    options: [
      { key: "A", text: "Accept overload as normal", weight: 1 },
      { key: "B", text: "Delay commitments", weight: 2 },
      { key: "C", text: "Re-engineer workflows, automate where possible, reprioritize strategically, and optimize scarce capacity intelligently", weight: 4 },
      { key: "D", text: "Escalate helplessly", weight: 1 },
    ]
  },
  {
    order: 28,
    questionText: "Q28 — Leadership Visibility Under Pressure\n\nTeams perceive senior leadership as disconnected during a stressful period.\n\nYou:",
    dimension: "Leadership Visibility & Presence",
    options: [
      { key: "A", text: "Stay behind the scenes", weight: 1 },
      { key: "B", text: "Increase control through instructions only", weight: 2 },
      { key: "C", text: "Become visibly present, communicate often, and provide calm leadership direction with realism and confidence", weight: 4 },
      { key: "D", text: "Delegate communication entirely", weight: 1 },
    ]
  },
  {
    order: 29,
    questionText: "Q29 — Board-level Decision Ambiguity\n\nExecutives are divided on whether to make a risky strategic investment during uncertain markets.\n\nYou:",
    dimension: "Executive Strategic Judgement",
    options: [
      { key: "A", text: "Support whichever side is strongest politically", weight: 1 },
      { key: "B", text: "Avoid taking a position", weight: 1 },
      { key: "C", text: "Evaluate strategic upside, downside risk, timing, and enterprise resilience before advocating a balanced recommendation", weight: 4 },
      { key: "D", text: "Delay all action indefinitely", weight: 2 },
    ]
  },
  {
    order: 30,
    questionText: "Q30 — Failure of a Trusted Leader\n\nA high-performing leader in your organization makes a major judgement error.\n\nYou:",
    dimension: "Balanced Leadership Judgement",
    options: [
      { key: "A", text: "Remove them immediately", weight: 2 },
      { key: "B", text: "Ignore because past results were strong", weight: 1 },
      { key: "C", text: "Evaluate intent, learning capacity, severity, and organizational impact before deciding corrective action", weight: 4 },
      { key: "D", text: "Publicly criticize them", weight: 1 },
    ]
  },
  {
    order: 31,
    questionText: "Q31 — Sudden Client Exit Threat\n\nA strategic client indicates they may terminate the relationship due to cumulative dissatisfaction.\n\nYou:",
    dimension: "Client Crisis Recovery",
    options: [
      { key: "A", text: "Offer deep discounts immediately", weight: 2 },
      { key: "B", text: "Defend current performance strongly", weight: 1 },
      { key: "C", text: "Conduct executive-level reset—listen deeply, diagnose core trust gaps, and create a visible recovery architecture with accountability", weight: 4 },
      { key: "D", text: "Wait for formal notice", weight: 1 },
    ]
  },
  {
    order: 32,
    questionText: "Q32 — Organizational Uncertainty\n\nRestructuring creates fear, rumours, and productivity decline.\n\nYou:",
    dimension: "Change Leadership Under Stress",
    options: [
      { key: "A", text: "Avoid discussing uncertainty", weight: 1 },
      { key: "B", text: "Give overly optimistic reassurance", weight: 2 },
      { key: "C", text: "Communicate honestly, reduce speculation, and create clarity on what teams can focus on productively now", weight: 4 },
      { key: "D", text: "Wait for HR communication only", weight: 1 },
    ]
  },
  {
    order: 33,
    questionText: "Q33 — Personal Leadership Stress\n\nYou are under intense pressure personally while leading a demanding business challenge.\n\nYou:",
    dimension: "Self-regulation & Executive Stamina",
    options: [
      { key: "A", text: "Absorb pressure silently until burnout", weight: 2 },
      { key: "B", text: "Become emotionally reactive", weight: 1 },
      { key: "C", text: "Manage energy deliberately, seek support intelligently, and remain steady in visible leadership behaviour", weight: 4 },
      { key: "D", text: "Withdraw from visible leadership", weight: 1 },
    ]
  },
  {
    order: 34,
    questionText: "Q34 — Escalation Discipline\n\nOperational teams escalate too many issues upward, slowing decision velocity.\n\nYou:",
    dimension: "Escalation Governance",
    options: [
      { key: "A", text: "Continue escalating everything", weight: 2 },
      { key: "B", text: "Stop escalations entirely", weight: 1 },
      { key: "C", text: "Define escalation thresholds, empower ownership, and build sharper decision discipline locally", weight: 4 },
      { key: "D", text: "Ignore the pattern", weight: 1 },
    ]
  },
  {
    order: 35,
    questionText: "Q35 — Unexpected Competitive Shock\n\nA competitor launches a major disruptive offering, creating panic internally.\n\nYou:",
    dimension: "Strategic Calm Under Shock",
    options: [
      { key: "A", text: "React impulsively with rushed decisions", weight: 1 },
      { key: "B", text: "Ignore competitive moves", weight: 1 },
      { key: "C", text: "Assess impact objectively, identify strategic implications, and respond with measured but decisive action", weight: 4 },
      { key: "D", text: "Wait for market clarity", weight: 2 },
    ]
  },
  {
    order: 36,
    questionText: "Q36 — Cross-functional Breakdown\n\nMultiple departments stop collaborating during a critical execution phase.\n\nYou:",
    dimension: "Enterprise Collaboration Under Pressure",
    options: [
      { key: "A", text: "Blame uncooperative functions", weight: 1 },
      { key: "B", text: "Escalate conflict upward", weight: 2 },
      { key: "C", text: "Re-anchor teams around shared business outcomes, rebuild alignment, and define clear operating rhythm collaboratively", weight: 4 },
      { key: "D", text: "Focus only on your function", weight: 1 },
    ]
  },
  {
    order: 37,
    questionText: "Q37 — Ethical Pressure During Crisis\n\nBusiness pressure makes leaders consider operational shortcuts that compromise compliance.\n\nYou:",
    dimension: "Integrity Under Pressure",
    options: [
      { key: "A", text: "Approve shortcuts for survival", weight: 1 },
      { key: "B", text: "Ignore compliance temporarily", weight: 1 },
      { key: "C", text: "Protect ethical and compliance boundaries while solving business urgency creatively within acceptable limits", weight: 4 },
      { key: "D", text: "Delay action", weight: 2 },
    ]
  },
  {
    order: 38,
    questionText: "Q38 — Leadership Succession Under Stress\n\nA critical leader unexpectedly exits during an important transformation.\n\nYou:",
    dimension: "Continuity Leadership",
    options: [
      { key: "A", text: "Panic about disruption", weight: 1 },
      { key: "B", text: "Freeze decisions", weight: 1 },
      { key: "C", text: "Activate succession depth, stabilize leadership confidence, and protect continuity through structured transition planning", weight: 4 },
      { key: "D", text: "Wait for replacement", weight: 2 },
    ]
  },
  {
    order: 39,
    questionText: "Q39 — Sustained Ambiguity\n\nYou must lead for months without clear external certainty (market, policy, client outlook).\n\nYou:",
    dimension: "Leading Through Uncertainty",
    options: [
      { key: "A", text: "Pause strategic movement", weight: 1 },
      { key: "B", text: "Operate defensively only", weight: 2 },
      { key: "C", text: "Create adaptive strategy, maintain execution momentum, and revise intelligently as reality evolves", weight: 4 },
      { key: "D", text: "Wait for perfect clarity", weight: 1 },
    ]
  },
  {
    order: 40,
    questionText: "Q40 — Next-level Role Readiness Under Pressure\n\nYou are offered a larger role in a difficult business environment.\n\nYou:",
    dimension: "Executive Readiness Under Complexity",
    options: [
      { key: "A", text: "Accept only for title growth", weight: 2 },
      { key: "B", text: "Decline due to uncertainty", weight: 1 },
      { key: "C", text: "Accept with thoughtful preparation—build support systems, understand risks, and create execution architecture for success", weight: 4 },
      { key: "D", text: "Delay indefinitely", weight: 1 },
    ]
  },
];

/**
 * Score bands for ESJI (percentage 0-100)
 * Max raw score = 40 * 4 = 160 → normalize to 0-100
 */
const SJT_BANDS = [
  { min: 90, label: 'Crisis-ready Executive', grade: 'A+', promotionReadiness: 'Ready for larger responsibilities', description: 'Exceptional executive composure. Consistently makes optimal decisions under extreme pressure.' },
  { min: 80, label: 'Strong Situational Leader', grade: 'A', promotionReadiness: 'Ready for larger responsibilities', description: 'High situational maturity. Handles complex stakeholder and delivery pressure with confidence.' },
  { min: 70, label: 'Reliable Manager', grade: 'B+', promotionReadiness: 'Ready with coaching', description: 'Solid operational capability. Performs reliably under moderate pressure with some coaching needed.' },
  { min: 60, label: 'Moderately Prepared', grade: 'B', promotionReadiness: 'Ready with coaching', description: 'Foundational situational capability exists. Needs structured resilience development.' },
  { min: 0,  label: 'Stress Vulnerable', grade: 'C', promotionReadiness: 'Needs resilience development', description: 'Significant gaps in pressure leadership. Requires targeted coaching and capability building.' },
];

module.exports = { SJT_QUESTIONS, SJT_BANDS };
