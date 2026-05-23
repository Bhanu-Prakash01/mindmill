const fs = require('fs');

const content = fs.readFileSync('MM Critical Thinking Test - Questions + Codes.md', 'utf8');
const lines = content.split('\n');

const questions = [];
let currentQ = null;
let optionsMode = false;
let order = 1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  const qMatch = line.match(/^# \*\*Q(\d+)\s+—\s+(.*?)\*\*$/);
  if (qMatch) {
    if (currentQ) questions.push(currentQ);
    
    currentQ = {
      order: parseInt(qMatch[1], 10),
      questionText: "",
      options: [],
      dimension: "",
      cluster: ""
    };
    
    if (currentQ.order <= 8) currentQ.cluster = 'Operational Judgement';
    else if (currentQ.order <= 16) currentQ.cluster = 'Strategic Decision Quality';
    else if (currentQ.order <= 24) currentQ.cluster = 'Stakeholder / Client Maturity';
    else currentQ.cluster = 'Executive Leadership Maturity';
    
    optionsMode = false;
    continue;
  }
  
  if (!currentQ) continue;
  
  if (line.match(/^Your first response:/) || line.match(/^Best course:/) || line.match(/^You should first:/) || line.match(/^Best leadership action:/) || line.match(/^Your lens:/) || line.match(/^Best approach:/) || line.match(/^Best response:/) || line.match(/^Best action:/) || line.match(/^Your action:/) || line.match(/^Most effective first move:/) || line.match(/^Best communication approach:/) || line.match(/^Most effective lens:/) || line.match(/^Best leadership decision approach:/) || line.match(/^Best path:/) || line.match(/^Best executive lens:/) || line.match(/^Most effective first step:/) || line.match(/^Best executive judgement:/) || line.match(/^Best decision:/) || line.match(/^Most mature response:/) || line.match(/^Best long-term decision:/) || line.match(/^First executive move:/) || line.match(/^Leadership response:/) || line.match(/^Best executive action:/) || line.match(/^Best leadership behaviour:/)) {
    currentQ.questionText += (currentQ.questionText ? '\n' : '') + line;
    optionsMode = true;
    continue;
  }
  
  if (line.startsWith('**A)**') || line.startsWith('**B)**') || line.startsWith('**C)**') || line.startsWith('**D)**')) {
    const key = line.match(/^\*\*(.)\)\*\*/)[1];
    let text = line.replace(/^\*\*(.)\)\*\*\s*/, '').replace(/✅\s*$/, '').trim();
    currentQ.options.push({ key, text, weight: 0 });
    continue;
  }
  
  if (line.startsWith('**Dimension:**')) {
    currentQ.dimension = line.replace('**Dimension:**', '').trim();
    continue;
  }
  
  if (line.startsWith('**Weights:**')) {
    const wMatch = line.match(/A=(\d)\s*\|\s*B=(\d)\s*\|\s*C=(\d)\s*\|\s*D=(\d)/);
    if (wMatch) {
      currentQ.options.find(o => o.key === 'A').weight = parseInt(wMatch[1], 10);
      currentQ.options.find(o => o.key === 'B').weight = parseInt(wMatch[2], 10);
      currentQ.options.find(o => o.key === 'C').weight = parseInt(wMatch[3], 10);
      currentQ.options.find(o => o.key === 'D').weight = parseInt(wMatch[4], 10);
    }
    continue;
  }
  
  if (!optionsMode && !line.startsWith('---') && !line.startsWith('#') && line.length > 0) {
    if (!line.includes('NodeJS Schema') && !line.includes('const questionBank')) {
      currentQ.questionText += (currentQ.questionText ? ' ' : '') + line;
    }
  }
}

if (currentQ) questions.push(currentQ);

const output = `const ECTI_QUESTIONS = ${JSON.stringify(questions, null, 2)};

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
`;

fs.writeFileSync('backend/seeders/ectiQuestions.js', output);
console.log("Parsed " + questions.length + " questions.");
