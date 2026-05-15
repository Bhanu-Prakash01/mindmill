Excellent. We’ll build this like a real psychometric instrument—not obvious right/wrong questions, but **weighted judgement scenarios** where the strongest option reflects executive maturity.

# **Executive Critical Thinking Index (ECTI™)**

### **Part 1 — Questions 1–12**

**Theme:** Core Executive Judgement | Problem Framing | Stakeholder Thinking | Decision Quality

**Instructions to candidate:**  
*Choose the option that best reflects how you would most likely respond in a real professional situation. There may be more than one reasonable answer; select the one that demonstrates the strongest judgement.*

Scoring logic:

* Best executive response \= **4**  
* Good response \= **3**  
* Limited response \= **2**  
* Weak response \= **1**

---

# **Q1 — Client Escalation Under Pressure**

A long-term client raises an urgent complaint that service quality has dropped sharply over the last two months and threatens contract review. Internal data shows delivery KPIs are still within SLA, but customer sentiment is clearly deteriorating.

Your first response:

**A)** Defend SLA performance with documented reports  
**B)** Immediately promise service credits  
**C)** Meet the client, understand perception gaps, and investigate root causes beyond SLA metrics ✅  
**D)** Escalate blame internally to the operations team

**Dimension:** Problem Framing  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q2 — Scope Creep**

A strategic client keeps adding “small” requests outside scope. Your team is overloaded, but the relationship is commercially important.

Best course:

**A)** Continue accepting requests to preserve goodwill  
**B)** Stop all extra work immediately  
**C)** Define boundaries, quantify impact, and renegotiate scope while protecting relationship ✅  
**D)** Push the team harder to absorb work

**Dimension:** Stakeholder Judgement  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q3 — Team Underperformance**

A capable manager in your team has missed targets for 3 consecutive quarters.

You should first:

**A)** Replace the manager  
**B)** Diagnose capability, motivation, environment, and structural blockers before acting ✅  
**C)** Publicly warn them  
**D)** Lower expectations

**Dimension:** Analytical Evaluation  
**Weights:** A=2 | B=4 | C=1 | D=1

---

# **Q4 — Cross-functional Conflict**

Operations and Sales are blaming each other for poor customer onboarding.

Best leadership action:

**A)** Choose the side with stronger argument  
**B)** Conduct a blame review  
**C)** Map the end-to-end onboarding process and identify systemic failure points jointly ✅  
**D)** Escalate issue upward

**Dimension:** Systems Thinking  
**Weights:** A=2 | B=1 | C=4 | D=2

---

# **Q5 — Risky Opportunity**

A new project offers high upside revenue but requires aggressive execution timelines and stretches team capacity.

Your lens:

**A)** Reject because risk is high  
**B)** Approve because upside is attractive  
**C)** Evaluate upside, delivery risk, mitigation options, and strategic value before deciding ✅  
**D)** Delay indefinitely

**Dimension:** Risk Evaluation  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q6 — Resource Constraint**

Budget cuts force reduction in manpower on a client account.

Best approach:

**A)** Reduce service quietly  
**B)** Ask remaining staff to compensate indefinitely  
**C)** Reprioritize deliverables, redesign workflows, and align expectations transparently ✅  
**D)** Escalate without solution options

**Dimension:** Execution Thinking  
**Weights:** A=1 | B=2 | C=4 | D=2

---

# **Q7 — Leadership Bias**

A senior leader strongly prefers one vendor because “they’ve always delivered,” despite new vendors showing stronger capability and pricing.

Best response:

**A)** Support existing vendor loyalty  
**B)** Challenge the leader emotionally  
**C)** Re-evaluate options using objective criteria and comparative evidence ✅  
**D)** Avoid involvement

**Dimension:** Bias Awareness  
**Weights:** A=2 | B=1 | C=4 | D=1

---

# **Q8 — Difficult Employee / High Performer**

A top performer consistently delivers excellent results but damages team morale through abrasive behaviour.

Best action:

**A)** Ignore behaviour because performance is strong  
**B)** Remove immediately  
**C)** Address behaviour directly, coach expectations, and link leadership conduct to long-term growth ✅  
**D)** Shift them elsewhere quietly

**Dimension:** People Judgement  
**Weights:** A=1 | B=2 | C=4 | D=2

---

# **Q9 — Client Promise vs Operational Reality**

Sales commits a delivery timeline that operations cannot realistically meet.

Your action:

**A)** Force operations to deliver somehow  
**B)** Refuse client commitment outright  
**C)** Reassess delivery options, communicate realistic commitments, and protect long-term trust ✅  
**D)** Stay neutral

**Dimension:** Decision Quality  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q10 — Change Resistance**

A major transformation initiative faces silent resistance from middle management.

Most effective first move:

**A)** Enforce compliance harder  
**B)** Replace resisting managers  
**C)** Diagnose resistance drivers (fear, capability, incentives, clarity) and address them systematically ✅  
**D)** Slow down change indefinitely

**Dimension:** Strategic Judgement  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q11 — Ethical Grey Zone**

A major client requests an operational workaround that benefits them but breaches your company’s compliance policy.

Best response:

**A)** Accept due to business value  
**B)** Reject bluntly  
**C)** Protect compliance while exploring compliant alternatives for client needs ✅  
**D)** Ignore request

**Dimension:** Ethical Reasoning  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q12 — Crisis Communication**

A serious service failure affects a large client. Facts are still emerging.

Best communication approach:

**A)** Wait until complete clarity emerges  
**B)** Issue vague reassurance  
**C)** Communicate early, acknowledge issue, outline immediate actions, and commit to transparent updates ✅  
**D)** Minimize seriousness

**Dimension:** Leadership Communication  
**Weights:** A=2 | B=1 | C=4 | D=1

---

# **NodeJS Schema for Part 1**

const questionBankPart1 \= \[  
{  
 id:"Q1",  
 dimension:"Problem Framing",  
 options:\[  
   {key:"A", weight:2},  
   {key:"B", weight:2},  
   {key:"C", weight:4},  
   {key:"D", weight:1}  
 \]  
},  
{  
 id:"Q2",  
 dimension:"Stakeholder Judgement",  
 options:\[  
   {key:"A", weight:2},  
   {key:"B", weight:2},  
   {key:"C", weight:4},  
   {key:"D", weight:1}  
 \]  
},  
{  
 id:"Q3",  
 dimension:"Analytical Evaluation",  
 options:\[  
   {key:"A", weight:2},  
   {key:"B", weight:4},  
   {key:"C", weight:1},  
   {key:"D", weight:1}  
 \]  
}  
// continue through Q12  
\];

module.exports \= questionBankPart1;

---

### **Psychometric note**

This instrument is **not measuring correctness**, but **quality of judgement**—which makes it powerful for readiness for the next role.

Next: **Part 2 (Q13–Q24)** — tougher scenarios involving ambiguity, political complexity, competing stakeholders, and executive trade-offs.

Excellent. This section becomes tougher—closer to real executive life where there is **no clean answer**, only stronger judgement.

# **Executive Critical Thinking Index (ECTI™)**

## **Part 2 — Questions 13–24**

**Theme:** Ambiguity | Political Complexity | Competing Priorities | Client & Leadership Trade-offs

---

# **Q13 — Managing Upward Pressure**

Your CEO wants a transformation initiative launched in 30 days. Your team assessment suggests execution readiness needs at least 75 days.

Best response:

**A)** Launch in 30 days to meet CEO expectations  
**B)** Reject the CEO’s timeline outright  
**C)** Present readiness gaps, propose a phased rollout, and align urgency with execution reality ✅  
**D)** Delay discussion

**Dimension:** Executive Influence  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q14 — Internal Politics**

Two senior department heads are competing for ownership of a strategic initiative. Their rivalry is affecting delivery quality.

Your approach:

**A)** Assign ownership to the more influential leader  
**B)** Split ownership equally  
**C)** Clarify decision rights, define governance, and align accountability to business outcomes—not personalities ✅  
**D)** Escalate conflict to top leadership immediately

**Dimension:** Organizational Judgement  
**Weights:** A=1 | B=2 | C=4 | D=2

---

# **Q15 — Unhappy Strategic Client**

A strategic client repeatedly raises concerns, but investigation shows expectations are shifting rather than service quality falling.

Best action:

**A)** Push back strongly using contract terms  
**B)** Continue accommodating every request  
**C)** Re-anchor expectations, clarify scope, and collaboratively redefine success metrics ✅  
**D)** Reduce account focus

**Dimension:** Client Leadership  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q16 — Team Burnout**

A high-performing team is showing fatigue after sustained intense delivery pressure.

First executive move:

**A)** Push through until project closure  
**B)** Replace tired performers  
**C)** Reassess workload, prioritize ruthlessly, and create recovery capacity without harming commitments ✅  
**D)** Ignore fatigue signals

**Dimension:** Sustainable Leadership  
**Weights:** A=2 | B=1 | C=4 | D=1

---

# **Q17 — Conflicting Data**

Finance reports strong profitability. Operations data shows rising hidden inefficiencies. Client feedback indicates declining experience.

Most effective lens:

**A)** Trust finance numbers  
**B)** Trust client sentiment only  
**C)** Integrate financial, operational, and customer signals before concluding ✅  
**D)** Wait for quarterly review

**Dimension:** Evidence Integration  
**Weights:** A=1 | B=2 | C=4 | D=2

---

# **Q18 — Difficult Decision / Layoff Scenario**

Market slowdown forces headcount reduction.

Best leadership decision approach:

**A)** Cut highest-cost employees first  
**B)** Reduce across all teams equally  
**C)** Evaluate strategic capability, business continuity, and long-term organizational health before deciding ✅  
**D)** Avoid action until crisis worsens

**Dimension:** Strategic Decision Quality  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q19 — Innovation vs Stability**

Your company can deploy new technology that improves productivity by 30%, but operational disruption risk is moderate.

Best path:

**A)** Avoid change  
**B)** Deploy fully immediately  
**C)** Pilot, measure impact, mitigate disruption, then scale deliberately ✅  
**D)** Wait for competitors first

**Dimension:** Change Judgement  
**Weights:** A=1 | B=2 | C=4 | D=2

---

# **Q20 — Underperforming Client Account**

A large account is profitable but consistently operationally difficult and draining leadership bandwidth.

Best executive lens:

**A)** Retain at all cost  
**B)** Exit immediately  
**C)** Reassess strategic value, operational burden, and relationship reset options before deciding ✅  
**D)** Delegate issue downward

**Dimension:** Portfolio Thinking  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q21 — Credibility Challenge**

You inherit a function where trust in leadership is low.

Most effective first step:

**A)** Announce major changes quickly  
**B)** Replace leadership team  
**C)** Listen deeply, understand trust deficits, and create visible early wins that rebuild credibility ✅  
**D)** Maintain status quo

**Dimension:** Leadership Reset Capability  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **Q22 — Supplier Crisis**

A key supplier suddenly fails, threatening service continuity to clients.

Best response:

**A)** Pressure supplier aggressively  
**B)** Inform clients only after internal resolution  
**C)** Activate contingency plans, assess exposure, and communicate responsibly with affected stakeholders early ✅  
**D)** Wait to see if supplier recovers

**Dimension:** Crisis Management  
**Weights:** A=2 | B=1 | C=4 | D=1

---

# **Q23 — Talent Succession**

A senior leader is indispensable but has developed no second line.

Best leadership action:

**A)** Keep relying on them  
**B)** Hire externally only  
**C)** Build structured succession, capability transfer, and leadership bench strength urgently ✅  
**D)** Ignore until vacancy arises

**Dimension:** Leadership Continuity Thinking  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q24 — Executive Conflict**

Board wants aggressive growth. Operating leadership wants cautious expansion due to capability limitations.

Best executive judgement:

**A)** Follow board blindly  
**B)** Support operations entirely  
**C)** Balance ambition with capability reality through phased strategic growth planning ✅  
**D)** Delay strategic decision

**Dimension:** Strategic Balance  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **NodeJS Schema — Part 2**

const questionBankPart2 \= \[  
{  
 id:"Q13",  
 dimension:"Executive Influence",  
 options:\[  
   {key:"A", weight:2},  
   {key:"B", weight:2},  
   {key:"C", weight:4},  
   {key:"D", weight:1}  
 \]  
},  
{  
 id:"Q14",  
 dimension:"Organizational Judgement",  
 options:\[  
   {key:"A", weight:1},  
   {key:"B", weight:2},  
   {key:"C", weight:4},  
   {key:"D", weight:2}  
 \]  
},  
{  
 id:"Q15",  
 dimension:"Client Leadership",  
 options:\[  
   {key:"A", weight:2},  
   {key:"B", weight:2},  
   {key:"C", weight:4},  
   {key:"D", weight:1}  
 \]  
}  
// continue through Q24  
\];

module.exports \= questionBankPart2;

---

## **Psychometric strength added in Part 2**

This section differentiates professionals on:

✔ stakeholder maturity  
✔ organizational influence  
✔ ambiguity tolerance  
✔ crisis handling  
✔ succession thinking  
✔ strategic balance  
✔ enterprise judgement  
✔ client leadership maturity

---

Next: **Part 3 (Q25–Q36)** — the toughest layer: **ethics, executive maturity, long-term thinking, and boardroom-quality judgement**.

Excellent. This is the final and most discriminating layer—the section that separates **strong operators** from **leadership-ready executives**. These scenarios assess **executive maturity, ethical courage, enterprise perspective, strategic foresight, and judgement under ambiguity**.

# **Executive Critical Thinking Index (ECTI™)**

## **Part 3 — Questions 25–36**

**Theme:** Executive Maturity | Ethics | Enterprise Thinking | Long-term Judgement | Leadership Readiness

---

# **Q25 — Ethical Commercial Pressure**

A large client privately suggests that future business depends on “special commercial consideration” outside standard policy.

Your response:

**A)** Agree quietly to protect revenue  
**B)** Refuse bluntly and threaten contract exit  
**C)** Protect ethical boundaries, escalate appropriately, and explore legitimate commercial solutions within policy ✅  
**D)** Ignore and hope the matter fades

**Dimension:** Ethical Leadership  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q26 — Short-Term Gain vs Long-Term Trust**

Your team can meet quarterly targets by pushing a service commitment you know will be difficult to sustain next quarter.

Best decision:

**A)** Commit now; solve later  
**B)** Reject opportunity immediately  
**C)** Balance commercial ambition with delivery credibility and protect long-term trust ✅  
**D)** Leave decision to junior managers

**Dimension:** Trust-based Decision Quality  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q27 — Strategic Ambiguity**

A new market opportunity is promising, but data is incomplete and competitor moves are unclear.

Best executive action:

**A)** Wait for full clarity  
**B)** Enter aggressively without preparation  
**C)** Develop strategic hypotheses, test assumptions quickly, and commit through staged learning ✅  
**D)** Avoid opportunity due to uncertainty

**Dimension:** Strategic Ambiguity Handling  
**Weights:** A=2 | B=1 | C=4 | D=2

---

# **Q28 — Leadership Accountability**

A major transformation project fails. The failure is partly due to weak execution by your team and partly due to unrealistic executive timelines.

Best leadership behaviour:

**A)** Blame execution teams  
**B)** Highlight executive pressure only  
**C)** Own your leadership role, surface systemic causes, and define corrective learning openly ✅  
**D)** Move on quietly

**Dimension:** Accountability Maturity  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q29 — Enterprise Perspective**

Your business unit is profitable, but its operating model creates friction and hidden costs for other functions.

Best lens:

**A)** Protect your unit performance only  
**B)** Ask other functions to adapt  
**C)** Evaluate enterprise-wide impact and optimize beyond functional silos ✅  
**D)** Ignore external friction

**Dimension:** Enterprise Thinking  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q30 — Executive Talent Call**

A technically brilliant leader is delivering results but repeatedly weakens cross-functional trust.

Best decision:

**A)** Ignore because performance is high  
**B)** Remove immediately  
**C)** Intervene firmly—coach, set behavioural expectations, and evaluate leadership sustainability objectively ✅  
**D)** Transfer the issue elsewhere

**Dimension:** Leadership Judgement  
**Weights:** A=1 | B=2 | C=4 | D=2

---

# **Q31 — Political Pressure**

A senior influential stakeholder asks you to prioritize their project ahead of higher-value organizational priorities.

Best response:

**A)** Prioritize influence  
**B)** Refuse emotionally  
**C)** Re-anchor decisions on transparent business priorities and stakeholder alignment ✅  
**D)** Delay response indefinitely

**Dimension:** Political Neutrality & Executive Courage  
**Weights:** A=1 | B=1 | C=4 | D=2

---

# **Q32 — Crisis Transparency**

An operational failure may become public and damage brand reputation.

Leadership response:

**A)** Hide issue until resolved  
**B)** Shift blame externally  
**C)** Respond transparently, contain operational fallout, and communicate accountability with corrective action ✅  
**D)** Minimize disclosure

**Dimension:** Crisis Integrity  
**Weights:** A=1 | B=1 | C=4 | D=1

---

# **Q33 — Innovation Decision**

Your organization’s legacy model is profitable today but clearly vulnerable over 3–5 years.

Best executive lens:

**A)** Maximize current model only  
**B)** Wait until decline becomes visible  
**C)** Protect current strength while investing in future capability transition now ✅  
**D)** Exit legacy business immediately

**Dimension:** Strategic Foresight  
**Weights:** A=2 | B=1 | C=4 | D=2

---

# **Q34 — Leadership Resilience**

A highly visible initiative you championed fails despite your conviction.

Most mature response:

**A)** Defend decision aggressively  
**B)** Distance yourself from failure  
**C)** Extract learning openly, adapt quickly, and demonstrate resilience through responsible course correction ✅  
**D)** Avoid future bold decisions

**Dimension:** Adaptive Leadership  
**Weights:** A=2 | B=1 | C=4 | D=1

---

# **Q35 — Succession vs Dependency**

A business is overly dependent on a few high-performing individuals.

Best long-term decision:

**A)** Continue rewarding star dependency  
**B)** Hire more stars only  
**C)** Build scalable capability, succession depth, and systemized leadership continuity ✅  
**D)** Wait until dependency becomes a crisis

**Dimension:** Organizational Sustainability Thinking  
**Weights:** A=1 | B=2 | C=4 | D=1

---

# **Q36 — Next-Level Leadership Readiness**

You are offered a significantly larger leadership role, but know your team has capability gaps that may stretch your effectiveness.

Best response:

**A)** Accept immediately and figure it out later  
**B)** Decline due to uncertainty  
**C)** Accept with clarity on support, succession planning, capability building, and execution architecture ✅  
**D)** Delay decision indefinitely

**Dimension:** Executive Readiness  
**Weights:** A=2 | B=2 | C=4 | D=1

---

# **NodeJS Schema — Part 3**

const questionBankPart3 \= \[  
{  
 id:"Q25",  
 dimension:"Ethical Leadership",  
 options:\[  
   {key:"A", weight:1},  
   {key:"B", weight:2},  
   {key:"C", weight:4},  
   {key:"D", weight:1}  
 \]  
},  
{  
 id:"Q26",  
 dimension:"Trust-based Decision Quality",  
 options:\[  
   {key:"A", weight:1},  
   {key:"B", weight:2},  
   {key:"C", weight:4},  
   {key:"D", weight:1}  
 \]  
},  
{  
 id:"Q27",  
 dimension:"Strategic Ambiguity Handling",  
 options:\[  
   {key:"A", weight:2},  
   {key:"B", weight:1},  
   {key:"C", weight:4},  
   {key:"D", weight:2}  
 \]  
}  
// continue through Q36  
\];

module.exports \= questionBankPart3;

---

# **Final Psychometric Interpretation Model (All 36 Questions)**

## **Dimension Clusters**

**Operational Judgement** → Q1–Q8  
**Strategic Decision Quality** → Q9–Q16  
**Stakeholder / Client Maturity** → Q17–Q24  
**Executive Leadership Maturity** → Q25–Q36

## **Scoring Bands**

**126–144** → **Elite Executive Thinker** *(Next-level leadership ready)*  
**108–125** → **Strong Strategic Leader** *(High potential)*  
**90–107** → **Solid Functional Leader** *(Ready with development)*  
**72–89** → **Emerging Leader** *(Capability building needed)*  
**Below 72** → **Execution-focused / Developing critical judgement**

## **Report Output**

The report can map:  
✔ Promotion readiness  
✔ Leadership maturity  
✔ Decision quality  
✔ Executive courage  
✔ Stakeholder judgement  
✔ Ethical maturity  
✔ CXO potential signal  
✔ Development themes

---

You now have a **full executive critical thinking assessment IP (36 questions)** that complements your cognitive ability assessment and PIRO framework.

