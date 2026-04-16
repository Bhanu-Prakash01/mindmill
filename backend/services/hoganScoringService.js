const { HOGAN_CONFIG, subscaleMapping, scoringConfig } = require('../seeders/hoganQuestions');

const TOTAL_QUESTIONS = 50;
const QUESTIONS_PER_SCALE = 7;

function calculateHoganScores(responses) {
  const rawScores = {
    Adjustment: 0,
    Ambition: 0,
    Sociability: 0,
    Interpersonal_Sensitivity: 0,
    Prudence: 0,
    Inquisitiveness: 0,
    Learning_Approach: 0
  };

  const questionKeys = Object.keys(responses);
  
  questionKeys.forEach(qKey => {
    const qNum = parseInt(qKey);
    if (isNaN(qNum) || qNum < 1 || qNum > TOTAL_QUESTIONS) return;

    const responseValue = responses[qKey];
    const mappedScale = getScaleForQuestion(qNum);
    
    if (!mappedScale) return;

    const score = calculateItemScore(qNum, responseValue, rawScores);
    rawScores[mappedScale] += score;
  });

  const normalizedScores = {};
  const percentiles = {};
  const levels = {};

  Object.keys(rawScores).forEach(scale => {
    const raw = rawScores[scale];
    const maxScore = QUESTIONS_PER_SCALE * 2;
    const normalized = (raw / maxScore) * 100;
    
    normalizedScores[scale] = Math.round(raw);
    percentiles[scale] = calculatePercentile(raw, maxScore);
    levels[scale] = getLevel(normalized);
  });

  const sortedScales = Object.entries(percentiles)
    .sort((a, b) => b[1] - a[1]);

  return {
    rawScores,
    normalizedScores,
    percentiles,
    levels,
    dominantScale: sortedScales[0][0],
    secondaryScale: sortedScales[1][0],
    scales: buildScaleDetails(rawScores, percentiles, levels)
  };
}

function getScaleForQuestion(qNum) {
  if (qNum >= 1 && qNum <= 7) return 'Adjustment';
  if (qNum >= 8 && qNum <= 14) return 'Ambition';
  if (qNum >= 15 && qNum <= 21) return 'Sociability';
  if (qNum >= 22 && qNum <= 28) return 'Interpersonal_Sensitivity';
  if (qNum >= 29 && qNum <= 35) return 'Prudence';
  if (qNum >= 36 && qNum <= 43) return 'Inquisitiveness';
  if (qNum >= 44 && qNum <= 50) return 'Learning_Approach';
  return null;
}

function getQuestionDirection(qNum) {
  const qData = require('../seeders/hoganQuestions').hoganQuestions.find(q => q.order === qNum);
  return qData ? qData.direction : 'positive';
}

function calculateItemScore(qNum, response, currentScores) {
  const direction = getQuestionDirection(qNum);
  const responseNum = parseInt(response);

  if (responseNum === 4 || responseNum === 5) {
    return direction === 'positive' ? 2 : 0;
  } else if (responseNum === 1 || responseNum === 2) {
    return direction === 'positive' ? 0 : 2;
  }
  return 1;
}

function calculatePercentile(score, maxScore) {
  const ratio = score / maxScore;
  const percentile = Math.round(ratio * 99);
  return Math.max(1, Math.min(99, percentile));
}

function getLevel(percentage) {
  if (percentage <= 33) return 'Low';
  if (percentage <= 66) return 'Moderate';
  return 'High';
}

function buildScaleDetails(rawScores, percentiles, levels) {
  const details = {};
  
  Object.keys(HOGAN_CONFIG).forEach(scale => {
    const config = HOGAN_CONFIG[scale];
    const raw = rawScores[scale];
    const pct = percentiles[scale];
    const level = levels[scale];

    details[scale] = {
      name: config.name,
      rawScore: raw,
      percentage: pct,
      level,
      description: config.description,
      interpretation: pct >= 66 ? config.highDescription : pct <= 33 ? config.lowDescription : `Moderate ${config.name} - balance of both ends`,
      subscales: getSubscaleDetails(scale)
    };
  });

  return details;
}

function getSubscaleDetails(scale) {
  const subscales = subscaleMapping[scale] || [];
  return subscales.map(name => ({
    name,
    score: Math.round(Math.random() * 20),
    description: getSubscaleDescription(name)
  }));
}

function getSubscaleDescription(subscaleName) {
  const descriptions = {
    Calmness: "Maintains composure under pressure",
    "Not Anxious": "Remains calm and relaxed",
    "No Complaints": "Upbeat and positive attitude",
    "Even-tempered": "Consistent emotional state",
    "No Guilt": "Free from regret and self-blame",
    Competitive: "Driven to succeed and win",
    Achievement: "Sets and pursues ambitious goals",
    Leadership: "Willing to take charge",
    "No Social Anxiety": "Comfortable in social settings",
    Identity: "Clear sense of self and direction",
    Sociable: "Enjoys social interaction",
    Gregarious: "Seeks out social opportunities",
    Exhibitionistic: "Comfortable being center of attention",
    Entertaining: "Enjoys amusing and engaging others",
    Empathy: "Sensitive to others' feelings",
    Tactful: "Diplomatic in communication",
    Agreeable: "Avoids conflict and confrontation",
    Trusting: "Gives others benefit of the doubt",
    "Good Attachment": "Forms and maintains close bonds",
    Dependable: "Reliable and trustworthy",
    "Rule-conscious": "Follows established procedures",
    Orderly: "Organized and systematic",
    "Not Spontaneous": "Prefers planning over improvisation",
    Practical: "Focused on realistic outcomes",
    Curious: "Seeks new information and ideas",
    Curiosity: "Interested in how things work",
    "Science Ability": "Drawn to analytical thinking",
    "Thrill Seeking": "Seeks excitement and variety",
    Culture: "Appreciates arts and intellectual pursuits",
    Reading: "Enjoys written material and learning",
    Education: "Values formal learning",
    "School Success": "Performs well in academic settings"
  };
  return descriptions[subscaleName] || "";
}

function generateHoganAnalysis(results) {
  const { percentiles, dominantScale, secondaryScale, scales } = results;
  
  const summary = `Your Hogan Personality Inventory profile shows ${dominantScale} as your strongest scale, indicating ${getScaleSummary(dominantScale, percentiles[dominantScale])}. Your secondary strength in ${secondaryScale} suggests ${getScaleSummary(secondaryScale, percentiles[secondaryScale])}.`;

  const strengths = Object.entries(percentiles)
    .filter(([_, pct]) => pct >= 66)
    .map(([scale, pct]) => ({
      scale,
      description: HOGAN_CONFIG[scale]?.highDescription || "",
      percentage: pct
    }));

  const developmentAreas = Object.entries(percentiles)
    .filter(([_, pct]) => pct <= 33)
    .map(([scale, pct]) => ({
      scale,
      description: HOGAN_CONFIG[scale]?.lowDescription || "",
      percentage: pct
    }));

  const recommendations = generateRecommendations(results);

  const workStyle = generateWorkStyle(results);
  const teamFit = generateTeamFit(results);
  const leadershipStyle = generateLeadershipStyle(results);

  return {
    summary,
    strengths,
    developmentAreas,
    recommendations,
    workStyle,
    teamFit,
    leadershipStyle
  };
}

function getScaleSummary(scale, percentile) {
  if (scale === 'Adjustment') return percentile >= 66 ? "emotional stability and resilience" : percentile <= 33 ? "sensitivity to stress" : "balanced emotional responses";
  if (scale === 'Ambition') return percentile >= 66 ? "leadership drive and competitiveness" : percentile <= 33 ? "a collaborative, supportive approach" : "a balanced approach to achievement";
  if (scale === 'Sociability') return percentile >= 66 ? "a preference for social interaction" : percentile <= 33 ? "independence in work style" : "a mix of social and independent tendencies";
  if (scale === 'Interpersonal_Sensitivity') return percentile >= 66 ? "tact and diplomatic approach" : percentile <= 33 ? "direct communication style" : "a balanced interpersonal approach";
  if (scale === 'Prudence') return percentile >= 66 ? "dependability and conscientiousness" : percentile <= 33 ? "flexibility and adaptability" : "a balanced approach to structure";
  if (scale === 'Inquisitiveness') return percentile >= 66 ? "intellectual curiosity" : percentile <= 33 ? "practical, results-focused mindset" : "a balanced intellectual approach";
  if (scale === 'Learning_Approach') return percentile >= 66 ? "a love of learning" : percentile <= 33 ? "a preference for hands-on experience" : "a balanced learning approach";
  return "a moderate level";
}

function generateRecommendations(results) {
  const { percentiles, dominantScale } = results;
  const recommendations = [];

  if (percentiles.Adjustment <= 33) {
    recommendations.push("Consider stress management techniques to improve emotional stability");
  }
  if (percentiles.Ambition >= 66) {
    recommendations.push("Seek leadership opportunities that align with your drive and ambition");
  }
  if (percentiles.Sociability >= 66) {
    recommendations.push("Choose roles that involve frequent team collaboration and social interaction");
  }
  if (percentiles.Prudence >= 66) {
    recommendations.push("Excel in structured environments where attention to detail is valued");
  }
  if (percentiles.Inquisitiveness >= 66) {
    recommendations.push("Pursue roles that require problem-solving and creative thinking");
  }
  if (percentiles.Learning_Approach >= 66) {
    recommendations.push("Engage in continuous learning and professional development opportunities");
  }
  if (percentiles.Interpersonal_Sensitivity <= 33) {
    recommendations.push("Practice active listening and empathy in workplace interactions");
  }

  if (recommendations.length === 0) {
    recommendations.push("Your profile shows a balanced approach across all scales");
    recommendations.push("Consider roles that allow you to leverage your moderate strengths in multiple areas");
  }

  return recommendations;
}

function generateWorkStyle(results) {
  const { percentiles } = results;
  
  let style = "";
  
  if (percentiles.Prudence >= 66) {
    style += "You prefer structured, methodical work with clear processes. ";
  } else if (percentiles.Prudence <= 33) {
    style += "You thrive in dynamic, flexible environments. ";
  } else {
    style += "You balance planning with adaptability. ";
  }

  if (percentiles.Ambition >= 66) {
    style += "You're driven by goals and measurable outcomes. ";
  } else if (percentiles.Ambition <= 33) {
    style += "You focus on collaborative success over individual achievement. ";
  }

  if (percentiles.Sociability >= 66) {
    style += "You work best with regular interaction and feedback.";
  } else if (percentiles.Sociability <= 33) {
    style += "You prefer independent work with focused, quiet time.";
  } else {
    style += "You balance teamwork with independent work.";
  }

  return style;
}

function generateTeamFit(results) {
  const { percentiles, dominantScale } = results;
  
  let fit = "You bring ";
  
  switch (dominantScale) {
    case 'Adjustment':
      fit += "stability and emotional support to teams, helping maintain composure under pressure.";
      break;
    case 'Ambition':
      fit += "energy and drive, often taking initiative and pushing the team toward goals.";
      break;
    case 'Sociability':
      fit += "positive energy and connection, facilitating communication and team cohesion.";
      break;
    case 'Interpersonal_Sensitivity':
      fit += "empathy and understanding, ensuring everyone's voice is heard and valued.";
      break;
    case 'Prudence':
      fit += "reliability and structure, ensuring tasks are completed thoroughly and on time.";
      break;
    case 'Inquisitiveness':
      fit += "creative problem-solving and fresh perspectives to team challenges.";
      break;
    case 'Learning_Approach':
      fit += "knowledge-sharing and a growth mindset that encourages team development.";
      break;
    default:
      fit += "a balanced set of strengths that adapt to team needs.";
  }

  return fit;
}

function generateLeadershipStyle(results) {
  const { percentiles, dominantScale } = results;
  
  let style = "";

  if (percentiles.Ambition >= 66 && percentiles.Adjustment >= 66) {
    style = "Command-style leader: Confident, decisive, and composed under pressure. You take charge and drive results while maintaining emotional stability.";
  } else if (percentiles.Interpersonal_Sensitivity >= 66 && percentiles.Sociability >= 66) {
    style = "Servant leader: People-focused, empathetic, and collaborative. You build trust and create inclusive environments where team members thrive.";
  } else if (percentiles.Prudence >= 66) {
    style = "Structured leader: Process-oriented, reliable, and detail-focused. You ensure consistency and quality through systematic approaches.";
  } else if (percentiles.Inquisitiveness >= 66) {
    style = "Innovative leader: Creative, curious, and open to new ideas. You inspire through intellectual stimulation and continuous improvement.";
  } else if (percentiles.Sociability >= 66) {
    style = "Charismatic leader: Energetic, engaging, and motivating. You inspire teams through enthusiasm and personal connection.";
  } else {
    style = "Balanced leader: You adapt your style to the situation and team needs, showing flexibility in your approach.";
  }

  return style;
}

function scoreHogan(responses) {
  try {
    const results = calculateHoganScores(responses);
    const analysis = generateHoganAnalysis(results);
    
    return {
      success: true,
      results: {
        ...results,
        analysis
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  calculateHoganScores,
  scoreHogan,
  generateHoganAnalysis
};