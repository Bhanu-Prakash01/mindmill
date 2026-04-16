/**
 * MBTI Personality Assessment - OEJTS Bipolar Format (32 Questions)
 * 
 * Based on Open Extended Jungian Type Scales (OEJTS) methodology.
 * Uses bipolar Likert scale format rather than forced-choice.
 * 
 * Scale: 1 = Strongly left trait, 3 = Neutral, 5 = Strongly right trait
 * 
 * Dimensions:
 * EI = Extraversion vs Introversion
 * SN = Sensing vs Intuition
 * TF = Thinking vs Feeling (INVERTED: low score = Thinking, high score = Feeling)
 * JP = Judging vs Perceiving
 * 
 * Scoring: Sum scores per dimension (8-40 range)
 * Threshold: Score > 24 = right preference, Score <= 24 = left preference
 */

const mbtiQuestions = [
  {
    order: 1,
    dimension: "EI",
    leftTrait: "I prefer working alone and in quiet environments",
    rightTrait: "I prefer working with others and in lively environments"
  },
  {
    order: 2,
    dimension: "EI",
    leftTrait: "I gain energy from spending time alone",
    rightTrait: "I gain energy from being around people"
  },
  {
    order: 3,
    dimension: "EI",
    leftTrait: "I prefer to think before speaking",
    rightTrait: "I prefer to speak before thinking"
  },
  {
    order: 4,
    dimension: "EI",
    leftTrait: "I enjoy one-on-one conversations more than group discussions",
    rightTrait: "I enjoy group discussions more than one-on-one conversations"
  },
  {
    order: 5,
    dimension: "EI",
    leftTrait: "I prefer written communication over verbal communication",
    rightTrait: "I prefer verbal communication over written communication"
  },
  {
    order: 6,
    dimension: "EI",
    leftTrait: "I tend to keep my thoughts private",
    rightTrait: "I tend to share my thoughts openly"
  },
  {
    order: 7,
    dimension: "EI",
    leftTrait: "I prefer depth over breadth in my relationships",
    rightTrait: "I prefer breadth over depth in my relationships"
  },
  {
    order: 8,
    dimension: "EI",
    leftTrait: "I am more reflective and inward-focused",
    rightTrait: "I am more outgoing and externally focused"
  },

  {
    order: 9,
    dimension: "SN",
    leftTrait: "I focus on facts, details, and concrete information",
    rightTrait: "I focus on possibilities, patterns, and abstract concepts"
  },
  {
    order: 10,
    dimension: "SN",
    leftTrait: "I trust experience and what has been proven",
    rightTrait: "I trust inspiration and gut instincts"
  },
  {
    order: 11,
    dimension: "SN",
    leftTrait: "I prefer practical, hands-on learning",
    rightTrait: "I prefer theoretical, conceptual learning"
  },
  {
    order: 12,
    dimension: "SN",
    leftTrait: "I notice specific details that others might miss",
    rightTrait: "I see the big picture and overall patterns"
  },
  {
    order: 13,
    dimension: "SN",
    leftTrait: "I prefer standard procedures and established methods",
    rightTrait: "I prefer innovative approaches and new possibilities"
  },
  {
    order: 14,
    dimension: "SN",
    leftTrait: "I learn best through direct experience and practice",
    rightTrait: "I learn best through imagination and exploration"
  },
  {
    order: 15,
    dimension: "SN",
    leftTrait: "I value realism and practicality",
    rightTrait: "I value creativity and innovation"
  },
  {
    order: 16,
    dimension: "SN",
    leftTrait: "I prefer dealing with concrete, tangible things",
    rightTrait: "I prefer dealing with ideas and possibilities"
  },

  {
    order: 17,
    dimension: "TF",
    leftTrait: "I make decisions based on logic and objective analysis",
    rightTrait: "I make decisions based on personal values and emotions"
  },
  {
    order: 18,
    dimension: "TF",
    leftTrait: "I value fairness and justice above harmony",
    rightTrait: "I value harmony and compassion above fairness"
  },
  {
    order: 19,
    dimension: "TF",
    leftTrait: "I am more comfortable with critique than praise",
    rightTrait: "I am more comfortable with praise than critique"
  },
  {
    order: 20,
    dimension: "TF",
    leftTrait: "I prefer to be honest and straightforward",
    rightTrait: "I prefer to be tactful and diplomatic"
  },
  {
    order: 21,
    dimension: "TF",
    leftTrait: "I believe truth is more important than sensitivity",
    rightTrait: "I believe sensitivity is more important than truth"
  },
  {
    order: 22,
    dimension: "TF",
    leftTrait: "I evaluate situations using objective standards",
    rightTrait: "I evaluate situations considering personal impact"
  },
  {
    order: 23,
    dimension: "TF",
    leftTrait: "I prefer to work with systems and structures",
    rightTrait: "I prefer to work with people and relationships"
  },
  {
    order: 24,
    dimension: "TF",
    leftTrait: "I am more convinced by data than feelings",
    rightTrait: "I am more convinced by feelings than data"
  },

  {
    order: 25,
    dimension: "JP",
    leftTrait: "I prefer to have plans and schedules",
    rightTrait: "I prefer to go with the flow and be spontaneous"
  },
  {
    order: 26,
    dimension: "JP",
    leftTrait: "I like to make lists and keep track of things",
    rightTrait: "I prefer to rely on memory and keep options open"
  },
  {
    order: 27,
    dimension: "JP",
    leftTrait: "I prefer to have decisions made in advance",
    rightTrait: "I prefer to keep decisions open until necessary"
  },
  {
    order: 28,
    dimension: "JP",
    leftTrait: "I feel comfortable with structure and order",
    rightTrait: "I feel comfortable with flexibility and ambiguity"
  },
  {
    order: 29,
    dimension: "JP",
    leftTrait: "I prefer to follow through on commitments",
    rightTrait: "I prefer to stay open to new options"
  },
  {
    order: 30,
    dimension: "JP",
    leftTrait: "I like to complete tasks before moving on",
    rightTrait: "I like to work on multiple tasks simultaneously"
  },
  {
    order: 31,
    dimension: "JP",
    leftTrait: "I prefer clear expectations and deadlines",
    rightTrait: "I prefer freedom to decide as I go"
  },
  {
    order: 32,
    dimension: "JP",
    leftTrait: "I am more comfortable when things are settled",
    rightTrait: "I am more comfortable when things are adaptable"
  }
];

const MBTI_CONFIG = {
  EI: {
    name: "Extraversion vs Introversion",
    leftLabel: "Introversion",
    rightLabel: "Extraversion",
    description: "How you direct your energy and interact with the world",
    leftCharacteristics: ["Prefer solitude", "Think before speaking", "Reflective", "Private"],
    rightCharacteristics: ["Sociable", "Outgoing", "Express freely", "Public"],
    scoringNote: "Score > 24 indicates Extraversion preference"
  },
  SN: {
    name: "Sensing vs Intuition",
    leftLabel: "Sensing",
    rightLabel: "Intuition",
    description: "How you perceive information and generate ideas",
    leftCharacteristics: ["Practical", "Detail-oriented", "Experience-based", "Concrete"],
    rightCharacteristics: ["Imaginative", "Pattern-focused", "Innovative", "Abstract"],
    scoringNote: "Score > 24 indicates Intuition preference"
  },
  TF: {
    name: "Thinking vs Feeling",
    leftLabel: "Thinking",
    rightLabel: "Feeling",
    description: "How you make decisions and evaluate options",
    leftCharacteristics: ["Logical", "Objective", "Analytical", "Fair-minded"],
    rightCharacteristics: ["Empathetic", "Values-driven", "Compassionate", "Harmonious"],
    scoringNote: "INVERTED: Score <= 24 indicates Thinking preference, Score > 24 indicates Feeling preference",
    inverted: true
  },
  JP: {
    name: "Judging vs Perceiving",
    leftLabel: "Judging",
    rightLabel: "Perceiving",
    description: "How you approach structure and flexibility in life",
    leftCharacteristics: ["Structured", "Planful", "Decisive", "Organized"],
    rightCharacteristics: ["Flexible", "Spontaneous", "Open-ended", "Adaptable"],
    scoringNote: "Score > 24 indicates Perceiving preference"
  }
};

const TYPE_DESCRIPTIONS = {
  ISTJ: {
    name: "Logistician",
    description: "Practical, fact-minded individuals with unwavering determination"
  },
  ISFJ: {
    name: "Defender",
    description: "Quiet, warm, and dedicated protectors always ready to defend loved ones"
  },
  INFJ: {
    name: "Advocate",
    description: "Quiet and mystical, yet very inspiring and determined idealists"
  },
  INTJ: {
    name: "Architect",
    description: "Imaginative and strategic thinkers with a plan for everything"
  },
  ISTP: {
    name: "Virtuoso",
    description: "Bold and practical experimenters, masters of all kinds of tools"
  },
  ISFP: {
    name: "Adventurer",
    description: "Flexible and charming artists, always ready to explore and experience something new"
  },
  INFP: {
    name: "Mediator",
    description: "Poetic, kind, and altruistic people, always eager to help a good cause"
  },
  INTP: {
    name: "Logician",
    description: "Innovative inventors with an unquenchable thirst for knowledge"
  },
  ESTP: {
    name: "Entrepreneur",
    description: "Smart, energetic, and very perceptive people who truly enjoy living on the edge"
  },
  ESFP: {
    name: "Entertainer",
    description: "Spontaneous, energetic, and enthusiastic people who love being the center of attention"
  },
  ENFP: {
    name: "Campaigner",
    description: "Enthusiastic, creative, and socially free spirits who can always find a reason to smile"
  },
  ENTP: {
    name: "Debater",
    description: "Smart and energetic thinkers who love intellectually confronting complex challenges"
  },
  ENFJ: {
    name: "Protagonist",
    description: "Charismatic and inspiring leaders able to mesmerize their listeners"
  },
  ESTJ: {
    name: "Executive",
    description: "Excellent administrators, unmatched in managing people or projects"
  },
  ESFJ: {
    name: "Consul",
    description: "Extraordinarily caring, social, and popular people always eager to help"
  },
  ENTJ: {
    name: "Commander",
    description: "Bold, imaginative, and strong-willed leaders who always find a way to get things done"
  }
};

module.exports = {
  mbtiQuestions,
  MBTI_CONFIG,
  TYPE_DESCRIPTIONS
};
