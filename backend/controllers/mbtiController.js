/**
 * MBTI Personality Assessment Controller
 * Handles MBTI-specific operations including scoring and reporting
 */

const { Attempt, Assessment, Report } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { 
  scoreMBTI,
  calculateMBTIScores,
  determineMBTIType
} = require('../services/mbtiScoringService');
const { QUESTIONS_PER_DIMENSION } = require('../services/mbtiScoringService');

/**
 * @desc    Submit MBTI assessment responses and get results
 * @route   POST /api/mbti/submit
 * @access  Private
 */
const submitMbti = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { responses } = req.body;

  // Verify assessment exists and is MBTI
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  const category = assessment.category?.toLowerCase();
  const subCategory = assessment.subCategory?.toLowerCase();
  if (category !== 'mbti' && subCategory !== 'mbti') {
    throw new ApiError(400, 'This is not an MBTI assessment');
  }

  // Validate and normalize responses
  // Frontend sends responses as an object {1: val, 2: val, ...}
  // The scoring service (mbtiScoringService) already handles this {order: answer} object format natively
  const totalQuestionsCount = assessment.questions?.length || 0;

  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    throw new ApiError(400, 'Invalid responses format. Expected {questionOrder: answer} object.');
  }

  const answeredCount = Object.keys(responses).length;
  if (answeredCount !== totalQuestionsCount) {
    throw new ApiError(400, `Invalid responses. Expected ${totalQuestionsCount} question responses, got ${answeredCount}.`);
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

  // Calculate MBTI scores — pass the {order: answer} object directly
  const mbtiResults = scoreMBTI(responses);

  // Update attempt with results
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.mbtiResults = mbtiResults;
  attempt.answeredQuestions = totalQuestionsCount;

  // Deduct test slot or free trial/credits (for individual users)
  if (!attempt.creditDeducted && !attempt.isPublicAttempt) {
    const { User } = require('../models');
    const user = await User.findById(attempt.user);
    if (user?.role !== 'superadmin') {
      attempt.creditDeducted = true;
      const isIndividualUser = user?.accountType === 'individual' && !user?.organization;
      if (isIndividualUser) {
        if (!user.freeTrialUsed) {
          user.freeTrialUsed = true;
          user.freeTrialAssessmentId = attempt.assessment;
          user.freeTrialAttemptId = attempt._id;
        } else {
          user.personalCredits.used = (user.personalCredits.used || 0) + 1;
        }
        await user.save();
      } else {
        const orgId = attempt.organization?.toString();
        if (orgId) {
          const unlockEntry = assessment.unlockedBy?.find(
            u => u.organization.toString() === orgId
          );
          if (unlockEntry) {
            unlockEntry.testsUsed += 1;
            await assessment.save();
          }
        }
      }
    }
  }

  await attempt.save();

  // Generate MBTI report
  const report = await generateMbtiReport(attempt, assessment, mbtiResults);
  attempt.report = report._id;
  await attempt.save();

  res.json({
    success: true,
    message: 'MBTI assessment completed successfully',
    data: {
      attempt,
      results: mbtiResults,
      report: assessment.showResultsImmediately ? report : null
    }
  });
});

/**
 * @desc    Get MBTI results for an attempt
 * @route   GET /api/mbti/results/:attemptId
 * @access  Private
 */
const getMbtiResults = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId)
    .populate('assessment', 'title category subCategory showResultsImmediately');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Check permissions — allow public/invite-based attempts (user is null)
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Access denied');
  }

  const category = attempt.assessment.category?.toLowerCase();
  const subCategory = attempt.assessment.subCategory?.toLowerCase();

  if (category !== 'mbti' && subCategory !== 'mbti') {
    throw new ApiError(400, 'This is not an MBTI assessment attempt');
  }

  if (!attempt.mbtiResults) {
    throw new ApiError(400, 'MBTI results not available for this attempt');
  }

  res.json({
    success: true,
    data: {
      results: attempt.mbtiResults,
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
 * @desc    Get MBTI analytics for organization
 * @route   GET /api/mbti/analytics
 * @access  Private (Admin, SuperAdmin)
 */
const getMbtiAnalytics = asyncHandler(async (req, res) => {
  const orgId = req.user.organization?._id;
  
  if (!orgId && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Organization required');
  }

  // Build query
  let query = { status: 'completed' };
  if (req.user.role !== 'superadmin') {
    query.organization = orgId;
  }

  // Get all MBTI attempts
  const attempts = await Attempt.find(query)
    .populate({
      path: 'assessment',
      match: { category: 'mbti' },
      select: 'title'
    })
    .select('mbtiResults completedAt');

  const mbtiAttempts = attempts.filter(a => a.assessment !== null);

  if (mbtiAttempts.length === 0) {
    return res.json({
      success: true,
      data: {
        totalAssessments: 0,
        typeDistribution: {},
        dimensionAverages: { EI: 50, SN: 50, TF: 50, JP: 50 }
      }
    });
  }

  // Calculate type distribution and dimension averages
  const typeDistribution = {};
  const dimensionSums = { EI: 0, SN: 0, TF: 0, JP: 0 };

  mbtiAttempts.forEach(attempt => {
    // Track type distribution
    const type = attempt.mbtiResults?.type;
    if (type) {
      if (!typeDistribution[type]) {
        typeDistribution[type] = 0;
      }
      typeDistribution[type]++;
    }

    // Sum dimension percentages
    ['EI', 'SN', 'TF', 'JP'].forEach(dim => {
      const percentage = attempt.mbtiResults?.percentages?.[dim];
      if (percentage !== undefined) {
        dimensionSums[dim] += percentage;
      }
    });
  });

  const count = mbtiAttempts.length;
  const dimensionAverages = {
    EI: Math.round(dimensionSums.EI / count),
    SN: Math.round(dimensionSums.SN / count),
    TF: Math.round(dimensionSums.TF / count),
    JP: Math.round(dimensionSums.JP / count)
  };

  res.json({
    success: true,
    data: {
      totalAssessments: count,
      typeDistribution,
      dimensionAverages,
      dominantTypes: Object.entries(typeDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([type]) => type)
        .slice(0, 5)
    }
  });
});

/**
 * Helper function to generate MBTI report
 */
async function generateMbtiReport(attempt, assessment, mbtiResults) {
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
    type: 'mbti',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    scores: {
      total: mbtiResults.percentages ? 
        Math.round((mbtiResults.percentages.EI + mbtiResults.percentages.SN + 
                   mbtiResults.percentages.TF + mbtiResults.percentages.JP) / 4) : 0,
      maxScore: 100,
      percentage: mbtiResults.percentages ? 
        Math.round((mbtiResults.percentages.EI + mbtiResults.percentages.SN + 
                   mbtiResults.percentages.TF + mbtiResults.percentages.JP) / 4) : 0
    },
    dimensions: {
      MBTI: {
        EI: mbtiResults.percentages?.EI || 50,
        SN: mbtiResults.percentages?.SN || 50,
        TF: mbtiResults.percentages?.TF || 50,
        JP: mbtiResults.percentages?.JP || 50,
        type: mbtiResults.type || '',
        typeName: mbtiResults.name || '',
        description: mbtiResults.description || ''
      },
      cognitiveFunctions: mbtiResults.cognitiveFunctions || []
    },
    analysis: {
      summary: mbtiResults.description || '',
      strengths: mbtiResults.dimensions ? 
        Object.values(mbtiResults.dimensions).map(d => `${d.label} (${d.percentage}%)`) : [],
      workStyle: mbtiResults.interpretation || '',
      personalityProfile: mbtiResults.type || ''
    }
  });

  return report;
}

/**
 * @desc    Download MBTI report as PDF
 * @route   GET /api/attempts/:attemptId/mbti-report/download
 * @access  Private
 */
const downloadMbtiReport = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { type = 'comprehensive' } = req.query;

  const attempt = await Attempt.findById(attemptId)
    .populate('user', 'firstName lastName email')
    .populate('assessment', 'title category subCategory');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user && req.user && attempt.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Access denied');
  }

  const category = attempt.assessment.category?.toLowerCase();
  const subCategory = attempt.assessment.subCategory?.toLowerCase();

  if (category !== 'mbti' && subCategory !== 'mbti') {
    throw new ApiError(400, 'This is not an MBTI assessment attempt');
  }

  if (!attempt.mbtiResults) {
    throw new ApiError(400, 'MBTI results not available for this attempt');
  }

  try {
    const { generateMbtiReportPdf } = require('../services/pdfService');

    const testTaker = {
      name: attempt.testTakerName || (attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}`.trim() : null),
      email: attempt.testTakerEmail || attempt.user?.email,
      phone: attempt.testTakerPhone
    };

    const mbtiData = attempt.mbtiResults;
    const pdfBuffer = await generateMbtiReportPdf(attempt, testTaker, { type });
    const assessmentTitle = attempt.assessment?.title?.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_') || 'MBTI';
    const candidateName = (testTaker.name || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 50);
    const typeLabel = type === 'summary' ? 'Summary' : 'Comprehensive';
    const filename = `${assessmentTitle}_${typeLabel}_${candidateName}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('MBTI PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate PDF');
  }
});

module.exports = {
  submitMbti,
  getMbtiResults,
  getMbtiAnalytics,
  downloadMbtiReport
};
