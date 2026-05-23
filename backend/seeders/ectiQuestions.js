const ECTI_QUESTIONS = [
  {
    "order": 1,
    "questionText": "A long-term client raises an urgent complaint that service quality has dropped sharply over the last two months and threatens contract review. Internal data shows delivery KPIs are still within SLA, but customer sentiment is clearly deteriorating.\nYour first response:",
    "options": [
      {
        "key": "A",
        "text": "Defend SLA performance with documented reports",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Immediately promise service credits",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Meet the client, understand perception gaps, and investigate root causes beyond SLA metrics",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Escalate blame internally to the operations team",
        "weight": 1
      }
    ],
    "dimension": "Problem Framing",
    "cluster": "Operational Judgement"
  },
  {
    "order": 2,
    "questionText": "A strategic client keeps adding “small” requests outside scope. Your team is overloaded, but the relationship is commercially important.\nBest course:",
    "options": [
      {
        "key": "A",
        "text": "Continue accepting requests to preserve goodwill",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Stop all extra work immediately",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Define boundaries, quantify impact, and renegotiate scope while protecting relationship",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Push the team harder to absorb work",
        "weight": 1
      }
    ],
    "dimension": "Stakeholder Judgement",
    "cluster": "Operational Judgement"
  },
  {
    "order": 3,
    "questionText": "A capable manager in your team has missed targets for 3 consecutive quarters.\nYou should first:",
    "options": [
      {
        "key": "A",
        "text": "Replace the manager",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Diagnose capability, motivation, environment, and structural blockers before acting",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Publicly warn them",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Lower expectations",
        "weight": 1
      }
    ],
    "dimension": "Analytical Evaluation",
    "cluster": "Operational Judgement"
  },
  {
    "order": 4,
    "questionText": "Operations and Sales are blaming each other for poor customer onboarding.\nBest leadership action:",
    "options": [
      {
        "key": "A",
        "text": "Choose the side with stronger argument",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Conduct a blame review",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Map the end-to-end onboarding process and identify systemic failure points jointly",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Escalate issue upward",
        "weight": 2
      }
    ],
    "dimension": "Systems Thinking",
    "cluster": "Operational Judgement"
  },
  {
    "order": 5,
    "questionText": "A new project offers high upside revenue but requires aggressive execution timelines and stretches team capacity.\nYour lens:",
    "options": [
      {
        "key": "A",
        "text": "Reject because risk is high",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Approve because upside is attractive",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Evaluate upside, delivery risk, mitigation options, and strategic value before deciding",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Delay indefinitely",
        "weight": 1
      }
    ],
    "dimension": "Risk Evaluation",
    "cluster": "Operational Judgement"
  },
  {
    "order": 6,
    "questionText": "Budget cuts force reduction in manpower on a client account.\nBest approach:",
    "options": [
      {
        "key": "A",
        "text": "Reduce service quietly",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Ask remaining staff to compensate indefinitely",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Reprioritize deliverables, redesign workflows, and align expectations transparently",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Escalate without solution options",
        "weight": 2
      }
    ],
    "dimension": "Execution Thinking",
    "cluster": "Operational Judgement"
  },
  {
    "order": 7,
    "questionText": "A senior leader strongly prefers one vendor because “they’ve always delivered,” despite new vendors showing stronger capability and pricing.\nBest response:",
    "options": [
      {
        "key": "A",
        "text": "Support existing vendor loyalty",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Challenge the leader emotionally",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Re-evaluate options using objective criteria and comparative evidence",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Avoid involvement",
        "weight": 1
      }
    ],
    "dimension": "Bias Awareness",
    "cluster": "Operational Judgement"
  },
  {
    "order": 8,
    "questionText": "A top performer consistently delivers excellent results but damages team morale through abrasive behaviour.\nBest action:",
    "options": [
      {
        "key": "A",
        "text": "Ignore behaviour because performance is strong",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Remove immediately",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Address behaviour directly, coach expectations, and link leadership conduct to long-term growth",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Shift them elsewhere quietly",
        "weight": 2
      }
    ],
    "dimension": "People Judgement",
    "cluster": "Operational Judgement"
  },
  {
    "order": 9,
    "questionText": "Sales commits a delivery timeline that operations cannot realistically meet.\nYour action:",
    "options": [
      {
        "key": "A",
        "text": "Force operations to deliver somehow",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Refuse client commitment outright",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Reassess delivery options, communicate realistic commitments, and protect long-term trust",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Stay neutral",
        "weight": 1
      }
    ],
    "dimension": "Decision Quality",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 10,
    "questionText": "A major transformation initiative faces silent resistance from middle management.\nMost effective first move:",
    "options": [
      {
        "key": "A",
        "text": "Enforce compliance harder",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Replace resisting managers",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Diagnose resistance drivers (fear, capability, incentives, clarity) and address them systematically",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Slow down change indefinitely",
        "weight": 1
      }
    ],
    "dimension": "Strategic Judgement",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 11,
    "questionText": "A major client requests an operational workaround that benefits them but breaches your company’s compliance policy.\nBest response:",
    "options": [
      {
        "key": "A",
        "text": "Accept due to business value",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Reject bluntly",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Protect compliance while exploring compliant alternatives for client needs",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Ignore request",
        "weight": 1
      }
    ],
    "dimension": "Ethical Reasoning",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 12,
    "questionText": "A serious service failure affects a large client. Facts are still emerging.\nBest communication approach:",
    "options": [
      {
        "key": "A",
        "text": "Wait until complete clarity emerges",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Issue vague reassurance",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Communicate early, acknowledge issue, outline immediate actions, and commit to transparent updates",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Minimize seriousness",
        "weight": 1
      }
    ],
    "dimension": "Leadership Communication",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 13,
    "questionText": "Your CEO wants a transformation initiative launched in 30 days. Your team assessment suggests execution readiness needs at least 75 days.\nBest response:",
    "options": [
      {
        "key": "A",
        "text": "Launch in 30 days to meet CEO expectations",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Reject the CEO’s timeline outright",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Present readiness gaps, propose a phased rollout, and align urgency with execution reality",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Delay discussion",
        "weight": 1
      }
    ],
    "dimension": "Executive Influence",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 14,
    "questionText": "Two senior department heads are competing for ownership of a strategic initiative. Their rivalry is affecting delivery quality. Your approach:",
    "options": [
      {
        "key": "A",
        "text": "Assign ownership to the more influential leader",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Split ownership equally",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Clarify decision rights, define governance, and align accountability to business outcomes—not personalities",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Escalate conflict to top leadership immediately",
        "weight": 2
      }
    ],
    "dimension": "Organizational Judgement",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 15,
    "questionText": "A strategic client repeatedly raises concerns, but investigation shows expectations are shifting rather than service quality falling.\nBest action:",
    "options": [
      {
        "key": "A",
        "text": "Push back strongly using contract terms",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Continue accommodating every request",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Re-anchor expectations, clarify scope, and collaboratively redefine success metrics",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Reduce account focus",
        "weight": 1
      }
    ],
    "dimension": "Client Leadership",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 16,
    "questionText": "A high-performing team is showing fatigue after sustained intense delivery pressure.\nFirst executive move:",
    "options": [
      {
        "key": "A",
        "text": "Push through until project closure",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Replace tired performers",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Reassess workload, prioritize ruthlessly, and create recovery capacity without harming commitments",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Ignore fatigue signals",
        "weight": 1
      }
    ],
    "dimension": "Sustainable Leadership",
    "cluster": "Strategic Decision Quality"
  },
  {
    "order": 17,
    "questionText": "Finance reports strong profitability. Operations data shows rising hidden inefficiencies. Client feedback indicates declining experience.\nMost effective lens:",
    "options": [
      {
        "key": "A",
        "text": "Trust finance numbers",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Trust client sentiment only",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Integrate financial, operational, and customer signals before concluding",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Wait for quarterly review",
        "weight": 2
      }
    ],
    "dimension": "Evidence Integration",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 18,
    "questionText": "Market slowdown forces headcount reduction.\nBest leadership decision approach:",
    "options": [
      {
        "key": "A",
        "text": "Cut highest-cost employees first",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Reduce across all teams equally",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Evaluate strategic capability, business continuity, and long-term organizational health before deciding",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Avoid action until crisis worsens",
        "weight": 1
      }
    ],
    "dimension": "Strategic Decision Quality",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 19,
    "questionText": "Your company can deploy new technology that improves productivity by 30%, but operational disruption risk is moderate.\nBest path:",
    "options": [
      {
        "key": "A",
        "text": "Avoid change",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Deploy fully immediately",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Pilot, measure impact, mitigate disruption, then scale deliberately",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Wait for competitors first",
        "weight": 2
      }
    ],
    "dimension": "Change Judgement",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 20,
    "questionText": "A large account is profitable but consistently operationally difficult and draining leadership bandwidth.\nBest executive lens:",
    "options": [
      {
        "key": "A",
        "text": "Retain at all cost",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Exit immediately",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Reassess strategic value, operational burden, and relationship reset options before deciding",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Delegate issue downward",
        "weight": 1
      }
    ],
    "dimension": "Portfolio Thinking",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 21,
    "questionText": "You inherit a function where trust in leadership is low.\nMost effective first step:",
    "options": [
      {
        "key": "A",
        "text": "Announce major changes quickly",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Replace leadership team",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Listen deeply, understand trust deficits, and create visible early wins that rebuild credibility",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Maintain status quo",
        "weight": 1
      }
    ],
    "dimension": "Leadership Reset Capability",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 22,
    "questionText": "A key supplier suddenly fails, threatening service continuity to clients.\nBest response:",
    "options": [
      {
        "key": "A",
        "text": "Pressure supplier aggressively",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Inform clients only after internal resolution",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Activate contingency plans, assess exposure, and communicate responsibly with affected stakeholders early",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Wait to see if supplier recovers",
        "weight": 1
      }
    ],
    "dimension": "Crisis Management",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 23,
    "questionText": "A senior leader is indispensable but has developed no second line.\nBest leadership action:",
    "options": [
      {
        "key": "A",
        "text": "Keep relying on them",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Hire externally only",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Build structured succession, capability transfer, and leadership bench strength urgently",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Ignore until vacancy arises",
        "weight": 1
      }
    ],
    "dimension": "Leadership Continuity Thinking",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 24,
    "questionText": "Board wants aggressive growth. Operating leadership wants cautious expansion due to capability limitations.\nBest executive judgement:",
    "options": [
      {
        "key": "A",
        "text": "Follow board blindly",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Support operations entirely",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Balance ambition with capability reality through phased strategic growth planning",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Delay strategic decision",
        "weight": 1
      }
    ],
    "dimension": "Strategic Balance",
    "cluster": "Stakeholder / Client Maturity"
  },
  {
    "order": 25,
    "questionText": "A large client privately suggests that future business depends on “special commercial consideration” outside standard policy. Your response:",
    "options": [
      {
        "key": "A",
        "text": "Agree quietly to protect revenue",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Refuse bluntly and threaten contract exit",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Protect ethical boundaries, escalate appropriately, and explore legitimate commercial solutions within policy",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Ignore and hope the matter fades",
        "weight": 1
      }
    ],
    "dimension": "Ethical Leadership",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 26,
    "questionText": "Your team can meet quarterly targets by pushing a service commitment you know will be difficult to sustain next quarter.\nBest decision:",
    "options": [
      {
        "key": "A",
        "text": "Commit now; solve later",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Reject opportunity immediately",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Balance commercial ambition with delivery credibility and protect long-term trust",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Leave decision to junior managers",
        "weight": 1
      }
    ],
    "dimension": "Trust-based Decision Quality",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 27,
    "questionText": "A new market opportunity is promising, but data is incomplete and competitor moves are unclear.\nBest executive action:",
    "options": [
      {
        "key": "A",
        "text": "Wait for full clarity",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Enter aggressively without preparation",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Develop strategic hypotheses, test assumptions quickly, and commit through staged learning",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Avoid opportunity due to uncertainty",
        "weight": 2
      }
    ],
    "dimension": "Strategic Ambiguity Handling",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 28,
    "questionText": "A major transformation project fails. The failure is partly due to weak execution by your team and partly due to unrealistic executive timelines.\nBest leadership behaviour:",
    "options": [
      {
        "key": "A",
        "text": "Blame execution teams",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Highlight executive pressure only",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Own your leadership role, surface systemic causes, and define corrective learning openly",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Move on quietly",
        "weight": 1
      }
    ],
    "dimension": "Accountability Maturity",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 29,
    "questionText": "Your business unit is profitable, but its operating model creates friction and hidden costs for other functions. Best lens:",
    "options": [
      {
        "key": "A",
        "text": "Protect your unit performance only",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Ask other functions to adapt",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Evaluate enterprise-wide impact and optimize beyond functional silos",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Ignore external friction",
        "weight": 1
      }
    ],
    "dimension": "Enterprise Thinking",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 30,
    "questionText": "A technically brilliant leader is delivering results but repeatedly weakens cross-functional trust.\nBest decision:",
    "options": [
      {
        "key": "A",
        "text": "Ignore because performance is high",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Remove immediately",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Intervene firmly—coach, set behavioural expectations, and evaluate leadership sustainability objectively",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Transfer the issue elsewhere",
        "weight": 2
      }
    ],
    "dimension": "Leadership Judgement",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 31,
    "questionText": "A senior influential stakeholder asks you to prioritize their project ahead of higher-value organizational priorities.\nBest response:",
    "options": [
      {
        "key": "A",
        "text": "Prioritize influence",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Refuse emotionally",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Re-anchor decisions on transparent business priorities and stakeholder alignment",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Delay response indefinitely",
        "weight": 2
      }
    ],
    "dimension": "Political Neutrality & Executive Courage",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 32,
    "questionText": "An operational failure may become public and damage brand reputation.\nLeadership response:",
    "options": [
      {
        "key": "A",
        "text": "Hide issue until resolved",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Shift blame externally",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Respond transparently, contain operational fallout, and communicate accountability with corrective action",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Minimize disclosure",
        "weight": 1
      }
    ],
    "dimension": "Crisis Integrity",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 33,
    "questionText": "Your organization’s legacy model is profitable today but clearly vulnerable over 3–5 years.\nBest executive lens:",
    "options": [
      {
        "key": "A",
        "text": "Maximize current model only",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Wait until decline becomes visible",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Protect current strength while investing in future capability transition now",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Exit legacy business immediately",
        "weight": 2
      }
    ],
    "dimension": "Strategic Foresight",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 34,
    "questionText": "A highly visible initiative you championed fails despite your conviction.\nMost mature response:",
    "options": [
      {
        "key": "A",
        "text": "Defend decision aggressively",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Distance yourself from failure",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Extract learning openly, adapt quickly, and demonstrate resilience through responsible course correction",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Avoid future bold decisions",
        "weight": 1
      }
    ],
    "dimension": "Adaptive Leadership",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 35,
    "questionText": "A business is overly dependent on a few high-performing individuals.\nBest long-term decision:",
    "options": [
      {
        "key": "A",
        "text": "Continue rewarding star dependency",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Hire more stars only",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Build scalable capability, succession depth, and systemized leadership continuity",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Wait until dependency becomes a crisis",
        "weight": 1
      }
    ],
    "dimension": "Organizational Sustainability Thinking",
    "cluster": "Executive Leadership Maturity"
  },
  {
    "order": 36,
    "questionText": "You are offered a significantly larger leadership role, but know your team has capability gaps that may stretch your effectiveness.\nBest response:",
    "options": [
      {
        "key": "A",
        "text": "Accept immediately and figure it out later",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Decline due to uncertainty",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Accept with clarity on support, succession planning, capability building, and execution architecture",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Delay decision indefinitely",
        "weight": 1
      }
    ],
    "dimension": "Executive Readiness",
    "cluster": "Executive Leadership Maturity"
  }
];

const ECTI_BANDS = [
  { min: 126, label: 'Elite Executive Thinker', description: 'Next-level leadership ready' },
  { min: 108, label: 'Strong Strategic Leader', description: 'High potential' },
  { min: 90, label: 'Solid Functional Leader', description: 'Ready with development' },
  { min: 72, label: 'Emerging Leader', description: 'Capability building needed' },
  { min: 0, label: 'Execution-focused', description: 'Developing critical judgement' }
];

module.exports = {
  ECTI_QUESTIONS,
  ECTI_BANDS
};
