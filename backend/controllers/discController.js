/**
 * DISC Personality Assessment Controller
 * Handles DISC-specific operations including scoring and reporting
 */

const { Attempt, Assessment, Report } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { 
  calculateDISCScores, 
  generateNarrativeReport 
} = require('../services/discScoringService');

/**
 * @desc    Submit DISC assessment responses and get results
 * @route   POST /api/assessments/:assessmentId/disc/submit
 * @access  Private
 */
const submitDisc = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { responses } = req.body;

  // Verify assessment exists and is DISC
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  if (assessment.category !== 'disc') {
    throw new ApiError(400, 'This is not a DISC assessment');
  }

  // Validate responses (professional DISC standard is 28, but we handle variations)
  const totalQuestionsCount = assessment.questions?.length || 0;
  if (!responses || !Array.isArray(responses) || responses.length !== totalQuestionsCount) {
    throw new ApiError(400, `Invalid responses. Expected ${totalQuestionsCount} question responses.`);
  }

  // Get or create attempt
  let attempt = await Attempt.findOne({
    user: req.user._id,
    assessment: assessmentId,
    status: 'in-progress'
  });

  if (!attempt) {
    throw new ApiError(400, 'No active attempt found. Please start the assessment first.');
  }

  // Calculate DISC scores
  const discResults = calculateDISCScores(responses, totalQuestionsCount);

  // Update attempt with results
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.discResults = discResults;
  attempt.answeredQuestions = totalQuestionsCount;

  // Deduct test slot from assessment's unlock pool
  if (!attempt.creditDeducted && !attempt.isPublicAttempt) {
    const { User } = require('../models');
    const user = await User.findById(attempt.user);
    if (user?.role !== 'superadmin') {
      attempt.creditDeducted = true;
      const orgId = attempt.organization.toString();
      const unlockEntry = assessment.unlockedBy?.find(
        u => u.organization.toString() === orgId
      );
      if (unlockEntry) {
        unlockEntry.testsUsed += 1;
        await assessment.save();
      }
    }
  }

  await attempt.save();

  // Generate DISC report
  const report = await generateDiscReport(attempt, assessment, discResults);
  attempt.report = report._id;
  await attempt.save();

  res.json({
    success: true,
    message: 'DISC assessment completed successfully',
    data: {
      attempt,
      results: discResults,
      report: assessment.showResultsImmediately ? report : null
    }
  });
});

/**
 * @desc    Get DISC results for an attempt
 * @route   GET /api/attempts/:attemptId/disc/results
 * @access  Private
 */
const getDiscResults = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId)
    .populate('assessment', 'title category showResultsImmediately');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Check permissions — allow public/invite-based attempts (user is null)
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.assessment.category !== 'disc') {
    throw new ApiError(400, 'This is not a DISC assessment attempt');
  }

  if (!attempt.discResults) {
    throw new ApiError(400, 'DISC results not available for this attempt');
  }

  // Generate narrative report
  const narrativeReport = generateNarrativeReport(attempt.discResults);

  res.json({
    success: true,
    data: {
      results: attempt.discResults,
      narrativeReport,
      completedAt: attempt.completedAt,
      testTaker: {
        name: attempt.testTakerName || null,
        email: attempt.testTakerEmail || null,
        phone: attempt.testTakerPhone || null
      }
    }
  });
});

/**
 * @desc    Get DISC analytics for organization
 * @route   GET /api/disc/analytics
 * @access  Private (Admin, SuperAdmin)
 */
const getDiscAnalytics = asyncHandler(async (req, res) => {
  const orgId = req.user.organization?._id;
  
  if (!orgId && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Organization required');
  }

  // Build query
  let query = { status: 'completed' };
  if (req.user.role !== 'superadmin') {
    query.organization = orgId;
  }

  // Get all DISC attempts
  const attempts = await Attempt.find(query)
    .populate({
      path: 'assessment',
      match: { category: 'disc' },
      select: 'title'
    })
    .select('discResults completedAt');

  const discAttempts = attempts.filter(a => a.assessment !== null);

  if (discAttempts.length === 0) {
    return res.json({
      success: true,
      data: {
        totalAssessments: 0,
        averageScores: { D: 0, I: 0, S: 0, C: 0 },
        traitDistribution: { D: {}, I: {}, S: {}, C: {} },
        patternDistribution: {}
      }
    });
  }

  // Calculate averages
  const traitSums = { D: 0, I: 0, S: 0, C: 0 };
  const traitDistribution = { D: {}, I: {}, S: {}, C: {} };
  const patternDistribution = {};

  discAttempts.forEach(attempt => {
    ['D', 'I', 'S', 'C'].forEach(trait => {
      const percentage = attempt.discResults?.percentages?.[trait];
      if (percentage !== undefined) {
        traitSums[trait] += percentage;
        
        // Track percentage distribution (buckets of 10)
        const bucket = Math.floor(percentage / 10) * 10;
        if (!traitDistribution[trait][bucket]) {
          traitDistribution[trait][bucket] = 0;
        }
        traitDistribution[trait][bucket]++;
      }
    });

    // Track pattern distribution
    const pattern = attempt.discResults?.pattern;
    if (pattern) {
      if (!patternDistribution[pattern]) {
        patternDistribution[pattern] = 0;
      }
      patternDistribution[pattern]++;
    }
  });

  const count = discAttempts.length;
  const averageScores = {
    D: Math.round(traitSums.D / count),
    I: Math.round(traitSums.I / count),
    S: Math.round(traitSums.S / count),
    C: Math.round(traitSums.C / count)
  };

  res.json({
    success: true,
    data: {
      totalAssessments: count,
      averageScores,
      averagePercentages: averageScores,
      traitDistribution,
      patternDistribution,
      dominantTraits: Object.entries(averageScores)
        .sort((a, b) => b[1] - a[1])
        .map(([trait]) => trait)
    }
  });
});

/**
 * @desc    Get DISC comparison data
 * @route   GET /api/disc/comparison
 * @access  Private
 */
const getDiscComparison = asyncHandler(async (req, res) => {
  const { attemptIds } = req.query;
  
  if (!attemptIds) {
    throw new ApiError(400, 'Attempt IDs required');
  }

  const ids = attemptIds.split(',');
  
  const attempts = await Attempt.find({
    _id: { $in: ids },
    user: req.user._id,
    status: 'completed'
  }).populate('assessment', 'title completedAt');

  const comparisons = attempts.map(attempt => ({
    attemptId: attempt._id,
    assessment: attempt.assessment,
    completedAt: attempt.completedAt,
    results: attempt.discResults
  }));

  res.json({
    success: true,
    data: { comparisons }
  });
});

/**
 * Helper function to generate DISC report
 */
async function generateDiscReport(attempt, assessment, discResults) {
  const narrativeReport = generateNarrativeReport(discResults);

  // Resolve who conducted the assessment
  let conductedBy = attempt.user;
  if (attempt.invite) {
    const { TestTakerInvite } = require('../models');
    const invite = await TestTakerInvite.findById(attempt.invite).select('invitedBy');
    if (invite?.invitedBy) conductedBy = invite.invitedBy;
  }

  const report = await Report.create({
    attempt: attempt._id,
    user: attempt.user,
    conductedBy,
    assessment: attempt.assessment,
    organization: attempt.organization,
    type: 'disc',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    scores: {
      byTrait: {
        D: { score: discResults.normalizedScores.D, percentage: discResults.percentages.D },
        I: { score: discResults.normalizedScores.I, percentage: discResults.percentages.I },
        S: { score: discResults.normalizedScores.S, percentage: discResults.percentages.S },
        C: { score: discResults.normalizedScores.C, percentage: discResults.percentages.C }
      }
    },
    dimensions: {
      DISC: {
        D: {
          rawScore: discResults.rawScores.D,
          score: discResults.normalizedScores.D,
          percentage: discResults.percentages.D
        },
        I: {
          rawScore: discResults.rawScores.I,
          score: discResults.normalizedScores.I,
          percentage: discResults.percentages.I
        },
        S: {
          rawScore: discResults.rawScores.S,
          score: discResults.normalizedScores.S,
          percentage: discResults.percentages.S
        },
        C: {
          rawScore: discResults.rawScores.C,
          score: discResults.normalizedScores.C,
          percentage: discResults.percentages.C
        },
        dominant: discResults.dominant,
        secondary: discResults.secondary,
        pattern: discResults.pattern
      }
    },
    analysis: {
      summary: discResults.analysis.summary,
      strengths: discResults.analysis.strengths,
      developmentAreas: discResults.analysis.developmentAreas,
      recommendations: discResults.analysis.recommendations
    }
  });

  return report;
}

module.exports = {
  submitDisc,
  getDiscResults,
  getDiscAnalytics,
  getDiscComparison
};
