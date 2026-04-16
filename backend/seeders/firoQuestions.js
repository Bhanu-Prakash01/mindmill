/**
 * FIRO-B Seed Data (54 Questions)
 * - 6 scales: Expressed Inclusion (eI), Wanted Inclusion (wI), Expressed Control (eC),
 *   Wanted Control (wC), Expressed Affection (eA), Wanted Affection (wA)
 * - Each question uses a 6-point Likert scale: [Never, Rarely, Occasionally, Sometimes, Often, Usually]
 * - Questions 1-9   => eI
 * - Questions 10-18 => wI
 * - Questions 19-27 => eC
 * - Questions 28-36 => wC
 * - Questions 37-45 => eA
 * - Questions 46-54 => wA
 *
 * NOTE: This file uses generic FIRO-B style items (not MBTI proprietary content).
 */

const scaleOptions = [
  'Never',
  'Rarely',
  'Occasionally',
  'Sometimes',
  'Often',
  'Usually'
];

const firoQuestions = [
  // Expressed Inclusion (eI) - 9 questions
  { order: 1,  questionText: 'I proactively invite others to join my plans and activities.', trait: 'eI', options: scaleOptions },
  { order: 2,  questionText: 'I look for chances to include newcomers in team conversations.', trait: 'eI', options: scaleOptions },
  { order: 3,  questionText: 'I try to ensure that everyone feels welcome during group activities.', trait: 'eI', options: scaleOptions },
  { order: 4,  questionText: 'I speak up to make sure others have a place in discussions.', trait: 'eI', options: scaleOptions },
  { order: 5,  questionText: 'I actively introduce people to each other to foster inclusion.', trait: 'eI', options: scaleOptions },
  { order: 6,  questionText: 'I check in with teammates to see if they feel part of the group.', trait: 'eI', options: scaleOptions },
  { order: 7,  questionText: 'I invite others to join planned activities even if they are busy.', trait: 'eI', options: scaleOptions },
  { order: 8,  questionText: 'I show interest in others’ ideas to include them in decisions.', trait: 'eI', options: scaleOptions },
  { order: 9,  questionText: 'I actively work to prevent anyone from feeling left out.', trait: 'eI', options: scaleOptions },

  // Wanted Inclusion (wI) - 9 questions
  { order: 10, questionText: 'I want others to invite me to join social or work plans.', trait: 'wI', options: scaleOptions },
  { order: 11, questionText: 'I expect to be included in group activities from the start.', trait: 'wI', options: scaleOptions },
  { order: 12, questionText: 'I desire others to check in with me about plans and opportunities.', trait: 'wI', options: scaleOptions },
  { order: 13, questionText: 'I want my ideas to be sought and valued in discussions.', trait: 'wI', options: scaleOptions },
  { order: 14, questionText: 'I feel best when I’m invited to collaborate with others on tasks.', trait: 'wI', options: scaleOptions },
  { order: 15, questionText: 'I want to be included in both social and project-related activities.', trait: 'wI', options: scaleOptions },
  { order: 16, questionText: 'I wish people would consider my presence when forming teams.', trait: 'wI', options: scaleOptions },
  { order: 17, questionText: 'I would feel valued if colleagues regularly included me in plans.', trait: 'wI', options: scaleOptions },
  { order: 18, questionText: 'I want to feel welcomed and accepted by new teammates.', trait: 'wI', options: scaleOptions },

  // Expressed Control (eC) - 9 questions
  { order: 19, questionText: 'I express influence by directing tasks and setting clear goals.', trait: 'eC', options: scaleOptions },
  { order: 20, questionText: 'I take charge of projects and steer discussions toward outcomes.', trait: 'eC', options: scaleOptions },
  { order: 21, questionText: 'I feel comfortable asserting my decisions to shape outcomes.', trait: 'eC', options: scaleOptions },
  { order: 22, questionText: 'I push for fast decisions when there is ambiguity or delay.', trait: 'eC', options: scaleOptions },
  { order: 23, questionText: 'I challenge others when I think there is a better approach.', trait: 'eC', options: scaleOptions },
  { order: 24, questionText: 'I often take the lead to ensure results are delivered.', trait: 'eC', options: scaleOptions },
  { order: 25, questionText: 'I assert what needs to be done even if others resist.', trait: 'eC', options: scaleOptions },
  { order: 26, questionText: 'I prefer having clear roles and responsibilities from the outset.', trait: 'eC', options: scaleOptions },
  { order: 27, questionText: 'I direct resources and priorities to maximize efficiency.', trait: 'eC', options: scaleOptions },

  // Wanted Control (wC) - 9 questions
  { order: 28, questionText: 'I want others to provide direction and structure for my work.', trait: 'wC', options: scaleOptions },
  { order: 29, questionText: 'I rely on others to organize tasks and set deadlines.', trait: 'wC', options: scaleOptions },
  { order: 30, questionText: 'I value guidance from leaders when approaching a project.', trait: 'wC', options: scaleOptions },
  { order: 31, questionText: 'I appreciate clear standards and expectations from others.', trait: 'wC', options: scaleOptions },
  { order: 32, questionText: 'I prefer someone to outline what needs to be done before starting.', trait: 'wC', options: scaleOptions },
  { order: 33, questionText: 'I want feedback that helps me understand the big picture and goals.', trait: 'wC', options: scaleOptions },
  { order: 34, questionText: 'I expect others to coordinate plans so there is a cohesive approach.', trait: 'wC', options: scaleOptions },
  { order: 35, questionText: 'I look for leaders who can guide teams through complex tasks.', trait: 'wC', options: scaleOptions },
  { order: 36, questionText: 'I feel more secure when someone organizes the process for me.', trait: 'wC', options: scaleOptions },

  // Expressed Affection (eA) - 9 questions
  { order: 37, questionText: 'I express warmth and friendliness to people I know.', trait: 'eA', options: scaleOptions },
  { order: 38, questionText: 'I show care by listening closely and being present with others.', trait: 'eA', options: scaleOptions },
  { order: 39, questionText: 'I share personal stories to help others feel closer to me.', trait: 'eA', options: scaleOptions },
  { order: 40, questionText: 'I regularly offer physical warmth (e.g., hugs) when appropriate.', trait: 'eA', options: scaleOptions },
  { order: 41, questionText: 'I try to connect with people on a deeper emotional level.', trait: 'eA', options: scaleOptions },
  { order: 42, questionText: 'I express appreciation and warmth toward colleagues often.', trait: 'eA', options: scaleOptions },
  { order: 43, questionText: 'I am comfortable sharing personal experiences with friends.', trait: 'eA', options: scaleOptions },
  { order: 44, questionText: 'I value close, trusting relationships in my personal life.', trait: 'eA', options: scaleOptions },
  { order: 45, questionText: 'I actively nurture friendships by spending quality time together.', trait: 'eA', options: scaleOptions },

  // Wanted Affection (wA) - 9 questions
  { order: 46, questionText: 'I want others to share personal thoughts and feelings with me.', trait: 'wA', options: scaleOptions },
  { order: 47, questionText: 'I desire emotional closeness with people I care about.', trait: 'wA', options: scaleOptions },
  { order: 48, questionText: 'I expect friends to confide in me and be open about their lives.', trait: 'wA', options: scaleOptions },
  { order: 49, questionText: 'I would feel valued if others reveal personal details to me.', trait: 'wA', options: scaleOptions },
  { order: 50, questionText: 'I want people to show warmth and affection regularly.', trait: 'wA', options: scaleOptions },
  { order: 51, questionText: 'I wish friends would include me in intimate conversations.', trait: 'wA', options: scaleOptions },
  { order: 52, questionText: 'I long for deep, trusting connections with others.', trait: 'wA', options: scaleOptions },
  { order: 53, questionText: 'I hope colleagues will share personal perspectives with me.', trait: 'wA', options: scaleOptions },
  { order: 54, questionText: 'I want to feel emotionally connected with people in my circle.', trait: 'wA', options: scaleOptions }
];

// FIRO-B scale descriptions (config)
const firoConfig = {
  eI: {
    name: 'Expressed Inclusion',
    description: 'The extent to which you express inclusion toward others',
  },
  wI: {
    name: 'Wanted Inclusion',
    description: 'The extent to which you want others to include you in their activities',
  },
  eC: {
    name: 'Expressed Control',
    description: 'The extent to which you try to control and influence things',
  },
  wC: {
    name: 'Wanted Control',
    description: 'The extent to which you want others to provide direction and structure',
  },
  eA: {
    name: 'Expressed Affection',
    description: 'The extent to which you try to get close to people on a personal level',
  },
  wA: {
    name: 'Wanted Affection',
    description: 'The extent to which you want people to get close and share personal things with you',
  }
};

module.exports = {
  firoQuestions,
  firoConfig
};
