const { Report, User } = require('../models');

async function generateHoganReport(attempt, assessment, results) {
  try {
    const user = await User.findById(attempt.user);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Anonymous';

    const reportData = {
      type: 'hogan',
      attemptId: attempt._id,
      user: attempt.user,
      organization: attempt.organization,
      assessment: assessment._id,
      testTakerName: userName,
      testTakerEmail: user?.email,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      totalQuestions: assessment.questions?.length || 50,
      answeredQuestions: attempt.answeredQuestions,
      dimensions: {
        Hogan: {
          Adjustment: {
            score: results.normalizedScores?.Adjustment || 0,
            percentage: results.percentiles?.Adjustment || 0,
            level: results.levels?.Adjustment || 'Moderate'
          },
          Ambition: {
            score: results.normalizedScores?.Ambition || 0,
            percentage: results.percentiles?.Ambition || 0,
            level: results.levels?.Ambition || 'Moderate'
          },
          Sociability: {
            score: results.normalizedScores?.Sociability || 0,
            percentage: results.percentiles?.Sociability || 0,
            level: results.levels?.Sociability || 'Moderate'
          },
          Interpersonal_Sensitivity: {
            score: results.normalizedScores?.Interpersonal_Sensitivity || 0,
            percentage: results.percentiles?.Interpersonal_Sensitivity || 0,
            level: results.levels?.Interpersonal_Sensitivity || 'Moderate'
          },
          Prudence: {
            score: results.normalizedScores?.Prudence || 0,
            percentage: results.percentiles?.Prudence || 0,
            level: results.levels?.Prudence || 'Moderate'
          },
          Inquisitiveness: {
            score: results.normalizedScores?.Inquisitiveness || 0,
            percentage: results.percentiles?.Inquisitiveness || 0,
            level: results.levels?.Inquisitiveness || 'Moderate'
          },
          Learning_Approach: {
            score: results.normalizedScores?.Learning_Approach || 0,
            percentage: results.percentiles?.Learning_Approach || 0,
            level: results.levels?.Learning_Approach || 'Moderate'
          }
        }
      },
      analysis: results.analysis || {},
      dominantScale: results.dominantScale,
      secondaryScale: results.secondaryScale,
      reportConfig: assessment.reportConfig
    };

    const report = await Report.create(reportData);
    return report;
  } catch (error) {
    console.error('Error generating Hogan report:', error);
    return null;
  }
}

module.exports = { generateHoganReport };