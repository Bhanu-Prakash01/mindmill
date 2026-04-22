/**
 * MBTI Type-Specific Insights Data
 * Contains content for Communication, Leadership, Team Dynamics, and Recommendations
 * for each of the 16 MBTI personality types
 */

export const mbtiTypeInsights = {
  ISTJ: {
    strength: 'Practical, organized, dependable, systematic',
    communication: {
      style: 'Direct and practical',
      listening: 'Detail-focused, facts-first',
      approach: 'Prefers clear, factual communication over small talk'
    },
    leadership: {
      style: 'Structured and results-oriented',
      decisions: 'Uses established procedures and logic',
      motivation: 'Respects competence, loyalty, and tradition'
    },
    team: {
      contribution: 'Bringing stability, thoroughness, and follow-through',
      idealPartners: ['ENFP', 'ESFJ'],
      conflict: 'Prefers to address issues directly and logically'
    },
    recommendations: [
      'Excel in roles requiring attention to detail and accuracy',
      'Strengthen flexibility by embracing new approaches occasionally',
      'Develop patience when working with spontaneous team members',
      'Share your expertise through mentoring junior colleagues',
      'Balance high standards with recognition of team efforts'
    ]
  },
  ISFJ: {
    strength: 'Loyal, caring, practical, devoted',
    communication: {
      style: 'Warm and supportive',
      listening: 'Empathetic and patient',
      approach: 'Prefers face-to-face, values personal connections'
    },
    leadership: {
      style: 'Supportive and nurturing',
      decisions: 'Considers team needs and individual circumstances',
      motivation: 'Driven by helping others and maintaining harmony'
    },
    team: {
      contribution: 'Providing caring support, reliability, and institutional memory',
      idealPartners: ['ESFP', 'ENFJ'],
      conflict: 'Avoids confrontation, seeks harmony'
    },
    recommendations: [
      'Excel in supportive roles that make a difference to individuals',
      'Practice advocating for your own needs alongside caring for others',
      'Develop comfort with voicing constructive criticism',
      'Trust your strong memory and attention to detail',
      'Build resilience when plans change unexpectedly'
    ]
  },
  INFJ: {
    strength: 'Intuitive, insightful, inspiring, principled',
    communication: {
      style: 'Insightful and inspiring',
      listening: 'Deeply attentive to meaning and underlying themes',
      approach: 'Prefers meaningful discussions over surface conversations'
    },
    leadership: {
      style: 'Visionary and inspirational',
      decisions: 'Guided by long-term impact and values',
      motivation: 'Inspired by positive change and helping others reach potential'
    },
    team: {
      contribution: 'Offering deep insights, vision, and ethical guidance',
      idealPartners: ['ENFP', 'ENTJ'],
      conflict: 'Dislikes conflict, seeks win-win solutions'
    },
    recommendations: [
      'Pursue work that aligns with your values and creates positive impact',
      'Balance your insight with action - not all ideas need perfection',
      'Build a support network that appreciates your depth',
      'Practice patience when others don\'t see your vision yet',
      'Set healthy boundaries to sustain your energy'
    ]
  },
  INTJ: {
    strength: 'Strategic, independent, logical, determined',
    communication: {
      style: 'Direct and precise',
      listening: 'Focuses on competence and ideas',
      approach: 'Values efficiency, dislikes repetition'
    },
    leadership: {
      style: 'Strategic and results-driven',
      decisions: 'Data-driven, focused on outcomes',
      motivation: 'Motivated by complex challenges and achieving goals'
    },
    team: {
      contribution: 'Providing strategic vision, competence, and innovation',
      idealPartners: ['ENTP', 'ENFP'],
      conflict: 'Addresses problems logically, not personally'
    },
    recommendations: [
      'Lead with your strategic vision - your long-term thinking is rare',
      'Develop emotional intelligence to complement your analytical strengths',
      'Practice explaining complex ideas to varied audiences',
      'Balance critique with recognition of achievements',
      'Value diverse perspectives in problem-solving'
    ]
  },
  ISTP: {
    strength: 'Practical, analytical, adaptable, hands-on',
    communication: {
      style: 'Action-oriented and practical',
      listening: 'Focuses on how things work',
      approach: 'Prefers action over discussion, flexible with time'
    },
    leadership: {
      style: 'Practical problem-solver',
      decisions: 'Adapts to circumstances, uses logic',
      motivation: 'Motivated by challenges and autonomy'
    },
    team: {
      contribution: 'Solving problems, bringing practical solutions, staying calm under pressure',
      idealPartners: ['ENTJ', 'ENFJ'],
      conflict: 'Sees conflict as problems to solve'
    },
    recommendations: [
      'Excel in hands-on, technical roles where you can see immediate impact',
      'Develop planning skills to complement your adaptability',
      'Practice following through on long-term commitments',
      'Communicate your needs clearly rather than assuming understanding',
      'Build relationships that provide stability and support'
    ]
  },
  ISFP: {
    strength: 'Artistic, gentle, spontaneous, caring',
    communication: {
      style: 'Gentle and expressive',
      listening: 'Appreciates aesthetics and personal values',
      approach: 'Prefers harmony, dislikes conflict'
    },
    leadership: {
      style: 'Supporting and flexible',
      decisions: 'Considers personal impact and values',
      motivation: 'Motivated by authenticity and helping others'
    },
    team: {
      contribution: 'Bringing creativity, flexibility, and warmth',
      idealPartners: ['ESFJ', 'ENFJ'],
      conflict: 'Avoids conflict, may withdraw when stressed'
    },
    recommendations: [
      'Pursue creative and meaningful work that honors your values',
      'Develop comfort with voicing your needs and opinions',
      'Set clear goals to maintain focus and follow-through',
      'Create environments that support your creativity',
      'Build confidence in your unique perspective'
    ]
  },
  INFP: {
    strength: 'Idealistic, creative, authentic, values-driven',
    communication: {
      style: 'Meaningful and authentic',
      listening: 'Focuses on meaning and possibilities',
      approach: 'Prefers depth over surface conversations'
    },
    leadership: {
      style: 'Visionary and values-driven',
      decisions: 'Considers personal meaning and impact',
      motivation: 'Motivated by authenticity and positive change'
    },
    team: {
      contribution: 'Bringing creativity, idealism, and purpose',
      idealPartners: ['ENFJ', 'ENTJ'],
      conflict: 'May take criticism personally, seeks harmony'
    },
    recommendations: [
      'Find work that aligns with your core values and permits creativity',
      'Practice realism - balance ideals with practical constraints',
      'Communicate your vision in practical terms',
      'Develop comfort with conflict in service of values',
      'Build systems to maintain follow-through'
    ]
  },
  INTP: {
    strength: 'Logical, analytical, inventive, abstract',
    communication: {
      style: 'Logical and theoretical',
      listening: 'Analyzes underlying principles',
      approach: 'Values competence over social pleasantries'
    },
    leadership: {
      style: 'Analytical and innovative',
      decisions: 'Uses logical analysis, considers possibilities',
      motivation: 'Motivated by understanding and complex challenges'
    },
    team: {
      contribution: 'Solving complex problems, innovative thinking, theory building',
      idealPartners: ['ENTJ', 'ENFJ'],
      conflict: 'Prefers to address issues intellectually'
    },
    recommendations: [
      'Excel in technical or research roles requiring deep analysis',
      'Develop practical communication skills for varied audiences',
      'Balance theory with practical application',
      'Practice showing appreciation through actions',
      'Build relationships by engaging with shared activities'
    ]
  },
  ESTP: {
    strength: 'Energetic, practical, action-oriented, bold',
    communication: {
      style: 'Direct, enthusiastic, action-focused',
      listening: 'Focused on facts and practical application',
      approach: 'Prefers hands-on, dislikes theory'
    },
    leadership: {
      style: 'Bold and action-oriented',
      decisions: 'Decides quickly, adapts rapidly',
      motivation: 'Motivated by excitement and immediate results'
    },
    team: {
      contribution: 'Bringing energy, quick decisions, and crisis management',
      idealPartners: ['ISFJ', 'ISTJ'],
      conflict: 'Addresses conflict through action'
    },
    recommendations: [
      'Excel in fast-paced roles requiring quick decisions',
      'Develop patience for detailed follow-through',
      'Balance risk-taking with risk assessment',
      'Practice listening to understand different perspectives',
      'Build depth in relationships beyond surface interactions'
    ]
  },
  ESFP: {
    strength: 'Energetic, enthusiastic, caring, spontaneous',
    communication: {
      style: 'Enthusiastic and engaging',
      listening: 'Tuned into emotions and experiences',
      approach: 'Lives in the moment, values fun'
    },
    leadership: {
      style: 'Enthusiastic and supportive',
      decisions: 'Considers team morale and practical impact',
      motivation: 'Motivated by excitement and helping others enjoy'
    },
    team: {
      contribution: 'Bringing energy, optimism, and practical help',
      idealPartners: ['ISTJ', 'INTJ'],
      conflict: 'Dislikes conflict, may avoid issues'
    },
    recommendations: [
      'Excel in roles requiring engagement and social interaction',
      'Develop planning and follow-through skills',
      'Balance spontaneity with necessary structure',
      'Practice focusing on less exciting but important tasks',
      'Communicate needs clearly to maintain balance'
    ]
  },
  ENFP: {
    strength: 'Enthusiastic, creative, inspiring, caring',
    communication: {
      style: 'Enthusiastic and inspiring',
      listening: 'Focuses on possibilities and meaning',
      approach: 'Values authenticity and new ideas'
    },
    leadership: {
      style: 'Inspiring and visionary',
      decisions: 'Considers impact on people and possibilities',
      motivation: 'Motivated by inspiring others and new ventures'
    },
    team: {
      contribution: 'Bringing inspiration, creativity, and emotional intelligence',
      idealPartners: ['INTJ', 'ISTJ'],
      conflict: 'Seeks harmonious resolutions'
    },
    recommendations: [
      'Pursue creative work that allows exploration of ideas',
      'Develop follow-through systems to execute visions',
      'Balance big-picture thinking with attention to details',
      'Practice delivering critical feedback constructively',
      'Build support structures for sustained energy'
    ]
  },
  ENTP: {
    strength: 'Innovative, strategic, enthusiastic, logical',
    communication: {
      style: 'Inventive and challenging',
      listening: 'Questions to understand deeply',
      approach: 'Values debate and intellectual stimulation'
    },
    leadership: {
      style: 'Strategic and inventive',
      decisions: 'Explores all options, adapts quickly',
      motivation: 'Motivated by intellectual challenges'
    },
    team: {
      contribution: 'Bringing innovation, debate, and strategic thinking',
      idealPartners: ['INTJ', 'INFJ'],
      conflict: 'Enjoys intellectual sparring'
    },
    recommendations: [
      'Excel in roles that reward innovation and strategic thinking',
      'Develop follow-through to execute brilliant ideas',
      'Balance debate with appreciation',
      'Practice listening to intuitive insights',
      'Build depth in expertise rather than breadth'
    ]
  },
  ESTJ: {
    strength: 'Organized, practical, responsible, leader-like',
    communication: {
      style: 'Direct and systematic',
      listening: 'Focuses on efficiency and results',
      approach: 'Values competence and traditional methods'
    },
    leadership: {
      style: 'Structured and directive',
      decisions: 'Uses established procedures and logic',
      motivation: 'Motivated by achievement and competence'
    },
    team: {
      contribution: 'Bringing organization, structure, and execution',
      idealPartners: ['ISFP', 'INFP'],
      conflict: 'Addresses issues through established procedures'
    },
    recommendations: [
      'Excel in structured, result-oriented leadership roles',
      'Develop flexibility to accommodate change',
      'Practice delegating rather than controlling everything',
      'Balance efficiency with emotional intelligence',
      'Recognize when traditional methods need updating'
    ]
  },
  ESFJ: {
    strength: 'Caring, social, practical, organized',
    communication: {
      style: 'Warm and supportive',
      listening: 'Deeply attentive to others\' needs',
      approach: 'Values harmony and practical help'
    },
    leadership: {
      style: 'Supportive and organized',
      decisions: 'Considers team needs and traditions',
      motivation: 'Motivated by helping others and belonging'
    },
    team: {
      contribution: 'Providing care, support, and practical organization',
      idealPartners: ['ISFP', 'INFP'],
      conflict: 'Seeks harmony, may avoid issues'
    },
    recommendations: [
      'Excel in caring, service-oriented roles',
      'Practice voicing needs and opinions',
      'Balance caring for others with self-care',
      'Develop comfort with change and new approaches',
      'Build resilience when situations feel out of control'
    ]
  },
  ENFJ: {
    strength: 'Charismatic, caring, inspiring, organized',
    communication: {
      style: 'Warm and inspiring',
      listening: 'Deeply attuned to others\' potential',
      approach: 'Values authenticity and growth'
    },
    leadership: {
      style: 'Charismatic and inspiring',
      decisions: 'Focuses on people development and growth',
      motivation: 'Motivated by helping others reach potential'
    },
    team: {
      contribution: 'Inspiring others, facilitating communication, bringing out best',
      idealPartners: ['INTP', 'ISTP'],
      conflict: 'Seeks harmonious resolutions'
    },
    recommendations: [
      'Excel in developmental and leadership roles',
      'Practice letting others find their own solutions',
      'Balance giving with receiving',
      'Develop comfort with difficult conversations',
      'Set boundaries to prevent burnout'
    ]
  },
  ENTJ: {
    strength: 'Strategic, decisive, logical, commanding',
    communication: {
      style: 'Direct and strategic',
      listening: 'Focused on efficiency and ideas',
      approach: 'Values competence and results'
    },
    leadership: {
      style: 'Directive and strategic',
      decisions: 'Quick, logical, focused on outcomes',
      motivation: 'Motivated by achievement and competence'
    },
    team: {
      contribution: 'Bringing strategic vision, leadership, and drive',
      idealPartners: ['INFP', 'ISFP'],
      conflict: 'Addresses issues directly and logically'
    },
    recommendations: [
      'Excel in strategic leadership roles',
      'Develop patience with slower movers',
      'Balance directness with emotional intelligence',
      'Practice listening without immediately solving',
      'Value diverse perspectives in decision-making'
    ]
  }
};

// Helper function to get insights for a specific MBTI type
export const getTypeInsights = (type) => {
  return mbtiTypeInsights[type] || mbtiTypeInsights.INTJ;
};

// Default insights for unknown types
const defaultInsights = {
  strength: 'Versatile and adaptable',
  communication: {
    style: 'Flexible and open',
    listening: 'Open to various perspectives',
    approach: 'Adapts communication to audience'
  },
  leadership: {
    style: 'Adaptive and strategic',
    decisions: 'Considers multiple factors',
    motivation: 'Driven by complex challenges'
  },
  team: {
    contribution: 'Bringing adaptability and open-mindedness',
    idealPartners: ['Various types'],
    conflict: 'Seeks collaborative solutions'
  },
  recommendations: [
    'Find roles that match your unique strengths',
    'Develop both your natural talents and complementary skills',
    'Build relationships with diverse personality types',
    'Practice self-awareness and growth',
    'Pursue continuous learning and development'
  ]
};

export const getDefaultInsights = () => defaultInsights;