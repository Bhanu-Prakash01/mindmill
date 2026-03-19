/**
 * Big Five Personality Test (BFPT) - Custom 50 Questions from Big5.txt
 * Predefined questions from Big5.txt with proper trait mapping
 * 
 * Scoring Formulas:
 * E = 20 + (1,11,21,31,41) - (6,16,26,36,46)
 * A = 14 + (7,17,27,37,42,47) - (2,12,22,32)
 * C = 14 + (3,13,23,33,43,48) - (8,18,28,38)
 * N = 38 + (9,19) - (4,14,24,29,34,39,44,49)
 * O = 8 + (5,15,25,35,40,45,50) - (10,20,30)
 */

// Predefined questions from Big5.txt mapped to positions with proper trait mapping
const big5Questions = [
  // Extraversion (E) - Positive: 1, 11, 21, 31, 41 | Negative: 6, 16, 26, 36, 46
  { order: 1, questionText: "I find that too much planning takes the fun out of life.", trait: "E", direction: "positive", facet: 1 },
  { order: 2, questionText: "I find value in listening and validating the feelings of others.", trait: "A", direction: "negative", facet: 2 },
  { order: 3, questionText: "I feel calm when everything is scheduled and in its place.", trait: "C", direction: "positive", facet: 1 },
  { order: 4, questionText: "I feel invigorated when I can solve complex problems logically.", trait: "N", direction: "negative", facet: 2 },
  { order: 5, questionText: "I get anxious when I disagree with people", trait: "O", direction: "positive", facet: 1 },
  { order: 6, questionText: "I enjoy finding deeper meanings in the information I come across.", trait: "E", direction: "negative", facet: 2 },
  { order: 7, questionText: "I tend to stick to proven methods and reliable routines.", trait: "A", direction: "positive", facet: 1 },
  { order: 8, questionText: "When facing a challenge, my first step is to seek input and advice from others.", trait: "C", direction: "negative", facet: 2 },
  { order: 9, questionText: "I think unexpected changes are interesting.", trait: "N", direction: "positive", facet: 3 },
  { order: 10, questionText: "In conversations, I'm quick to respond and enjoy rapid exchanges.", trait: "O", direction: "negative", facet: 2 },
  { order: 11, questionText: "I enjoy the adrenaline and focus that come when working under pressure.", trait: "E", direction: "positive", facet: 3 },
  { order: 12, questionText: "I prefer social activities over individual ones.", trait: "A", direction: "negative", facet: 2 },
  { order: 13, questionText: "I find joy in achieving set goals through systematic planning.", trait: "C", direction: "positive", facet: 3 },
  { order: 14, questionText: "I make decisions based on what makes sense rather than what feels right.", trait: "N", direction: "negative", facet: 4 },
  { order: 15, questionText: "I tend to avoid arguing with others, even when I have a different opinion.", trait: "O", direction: "positive", facet: 3 },
  { order: 16, questionText: "I find inspiration and creativity in open-ended approaches rather than a detailed plan.", trait: "E", direction: "negative", facet: 4 },
  { order: 17, questionText: "I like to listen rather than take the lead in group conversations.", trait: "A", direction: "positive", facet: 3 },
  { order: 18, questionText: "I enjoy providing emotional support for my friends when they need it.", trait: "C", direction: "negative", facet: 4 },
  { order: 19, questionText: "When learning something new, I like to start with the theory and general concepts.", trait: "N", direction: "positive", facet: 6 },
  { order: 20, questionText: "I like starting projects and seeing where my creativity leads over planning everything out first.", trait: "O", direction: "negative", facet: 5 },
  { order: 21, questionText: "I prefer a structured approach when learning something new, following a clear plan and guidelines.", trait: "E", direction: "positive", facet: 6 },
  { order: 22, questionText: "I enjoy quick chats and frequent check-ins with colleagues throughout the workday.", trait: "A", direction: "negative", facet: 4 },
  { order: 23, questionText: "In team discussions, I focus on grounding our approach in what we know works.", trait: "C", direction: "positive", facet: 5 },
  { order: 24, questionText: "I value practicality over experimental ideas.", trait: "N", direction: "negative", facet: 1 },
  { order: 25, questionText: "I often think about new ideas and future projects, even when currently working on something.", trait: "O", direction: "positive", facet: 6 },
  { order: 26, questionText: "I enjoy figuring out the big picture and how my decisions will impact the future.", trait: "A", direction: "negative", facet: 6 },
  { order: 27, questionText: "I prioritize the feelings of others when making decisions.", trait: "C", direction: "positive", facet: 6 },
  { order: 28, questionText: "I excel in environments where I can work quietly and independently.", trait: "E", direction: "negative", facet: 1 },
  { order: 29, questionText: "I enjoy engaging with new people frequently.", trait: "N", direction: "negative", facet: 4 },
  { order: 30, questionText: "I favor effectiveness when making decisions, even if it hurts someone's feelings.", trait: "O", direction: "negative", facet: 2 },
  { order: 31, questionText: "I think mistakes should have consequences.", trait: "E", direction: "positive", facet: 2 },
  { order: 32, questionText: "During meetings, I like to discuss issues openly and exchange ideas with others.", trait: "A", direction: "negative", facet: 3 },
  { order: 33, questionText: "Meeting new people often makes me feel anxious or stressed.", trait: "N", direction: "positive", facet: 3 },
  { order: 34, questionText: "I work best under pressure and often complete tasks at the last minute.", trait: "E", direction: "negative", facet: 3 },
  { order: 35, questionText: "I prefer ordering my favorite dishes rather than trying something new.", trait: "O", direction: "positive", facet: 3 },
  { order: 36, questionText: "When working on a group project, I encourage setting clear roles and deadlines from the beginning.", trait: "A", direction: "negative", facet: 3 },
  { order: 37, questionText: "When solving problems, I start by considering the existing conditions and constraints.", trait: "C", direction: "positive", facet: 3 },
  { order: 38, questionText: "I usually wait for others to initiate conversations in social settings.", trait: "N", direction: "negative", facet: 4 },
  { order: 39, questionText: "I feel comfortable and confident in social situations, even with people I don't know well.", trait: "E", direction: "negative", facet: 4 },
  { order: 40, questionText: "I feel most relaxed when I can enjoy my own company.", trait: "O", direction: "positive", facet: 4 },
  { order: 41, questionText: "I'm fascinated by complex, detailed and innovative ideas.", trait: "E", direction: "positive", facet: 5 },
  { order: 42, questionText: "I prefer exploring new possibilities and solutions without sticking to a strict plan.", trait: "A", direction: "positive", facet: 5 },
  { order: 43, questionText: "I enjoy taking chances and exploring uncharted territories to discover new solutions.", trait: "C", direction: "positive", facet: 5 },
  { order: 44, questionText: "I often feel drained after socializing and need time alone to recharge.", trait: "N", direction: "negative", facet: 5 },
  { order: 45, questionText: "I prefer to stay in the background during social events.", trait: "O", direction: "positive", facet: 5 },
  { order: 46, questionText: "I often make lists and schedules to organize my activities.", trait: "E", direction: "negative", facet: 5 },
  { order: 47, questionText: "I don't enjoy participating in creative expression, like writing or making music.", trait: "A", direction: "positive", facet: 6 },
  { order: 48, questionText: "I like to keep my work and personal life separate.", trait: "C", direction: "positive", facet: 6 },
  { order: 49, questionText: "I find it challenging to remain detached when others are experiencing emotional distress.", trait: "N", direction: "positive", facet: 6 },
  { order: 50, questionText: "I appreciate movies with clear themes and messages rather than those open to interpretation.", trait: "O", direction: "positive", facet: 6 }
];

// Trait mapping for scoring reference
const traitMapping = {
  E: {
    name: 'Extraversion',
    positive: [1, 11, 21, 31, 41],
    negative: [6, 16, 26, 36, 46],
    base: 20
  },
  A: {
    name: 'Agreeableness',
    positive: [7, 17, 27, 37, 42, 47],
    negative: [2, 12, 22, 32],
    base: 14
  },
  C: {
    name: 'Conscientiousness',
    positive: [3, 13, 23, 33, 43, 48],
    negative: [8, 18, 28, 38],
    base: 14
  },
  N: {
    name: 'Neuroticism',
    positive: [9, 19],
    negative: [4, 14, 24, 29, 34, 39, 44, 49],
    base: 38
  },
  O: {
    name: 'Openness',
    positive: [5, 15, 25, 35, 40, 45, 50],
    negative: [10, 20, 30],
    base: 8
  }
};

module.exports = {
  big5Questions,
  traitMapping
};
