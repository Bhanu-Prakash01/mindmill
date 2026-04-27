/**
 * Big Five Personality Test (BFPT) Controller
 * Handles Big5-specific operations including scoring and reporting
 */

const { Attempt, Assessment, Report } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { 
  scoreBig5, 
  generateNarrative, 
  getDominantTraits,
  getTraitDescription 
} = require('../services/big5ScoringService');

/**
 * @desc    Submit Big5 assessment responses and get results
 * @route   POST /api/assessments/:assessmentId/big5/submit
 * @access  Private
 */
const submitBig5 = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const responses = req.validatedBig5Responses;

  // Verify assessment exists and is Big5
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  const category = assessment.category?.toLowerCase();
  const subCategory = assessment.subCategory?.toLowerCase();
  if (category !== 'big5' && subCategory !== 'big5') {
    throw new ApiError(400, 'This is not a Big5 assessment');
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

  // Calculate Big5 scores
  const big5Results = scoreBig5(responses);

  // Update attempt with results
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.big5Results = big5Results;
  attempt.answeredQuestions = 50;

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

  // Generate Big5 report
  const report = await generateBig5Report(attempt, assessment, big5Results);
  attempt.report = report._id;
  await attempt.save();

  res.json({
    success: true,
    message: 'Big5 assessment completed successfully',
    data: {
      attempt,
      results: big5Results,
      report: assessment.showResultsImmediately ? report : null
    }
  });
});

/**
 * @desc    Get Big5 results for an attempt
 * @route   GET /api/attempts/:attemptId/big5/results
 * @access  Private
 */
const getBig5Results = asyncHandler(async (req, res) => {
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

  if (category !== 'big5' && subCategory !== 'big5' && !attempt.big5Results) {
    throw new ApiError(400, 'This is not a Big5 assessment attempt');
  }

  if (!attempt.big5Results) {
    throw new ApiError(400, 'Big5 results not available for this attempt');
  }

  // Get trait descriptions
  const traitDetails = {};
  ['E', 'A', 'C', 'N', 'O'].forEach(trait => {
    traitDetails[trait] = {
      ...attempt.big5Results[trait],
      ...getTraitDescription(trait)
    };
  });

  res.json({
    success: true,
    data: {
      results: attempt.big5Results,
      traitDetails,
      dominantTraits: getDominantTraits(attempt.big5Results),
      narrative: generateNarrative(attempt.big5Results),
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
 * @desc    Get Big5 analytics for organization
 * @route   GET /api/big5/analytics
 * @access  Private (Admin, SuperAdmin)
 */
const getBig5Analytics = asyncHandler(async (req, res) => {
  const orgId = req.user.organization?._id;
  
  if (!orgId && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Organization required');
  }

  // Build query
  let query = { status: 'completed' };
  if (req.user.role !== 'superadmin') {
    query.organization = orgId;
  }

  // Get all Big5 attempts
  const attempts = await Attempt.find(query)
    .populate({
      path: 'assessment',
      match: { category: 'big5' },
      select: 'title'
    })
    .select('big5Results completedAt');

  const big5Attempts = attempts.filter(a => a.assessment !== null);

  if (big5Attempts.length === 0) {
    return res.json({
      success: true,
      data: {
        totalAssessments: 0,
        averageScores: { E: 0, A: 0, C: 0, N: 0, O: 0 },
        traitDistribution: { E: {}, A: {}, C: {}, N: {}, O: {} },
        levelDistribution: { Low: 0, Moderate: 0, High: 0 }
      }
    });
  }

  // Calculate averages
  const traitSums = { E: 0, A: 0, C: 0, N: 0, O: 0 };
  const traitDistribution = { E: {}, A: {}, C: {}, N: {}, O: {} };
  const levelDistribution = { Low: 0, Moderate: 0, High: 0 };

  big5Attempts.forEach(attempt => {
    ['E', 'A', 'C', 'N', 'O'].forEach(trait => {
      const result = attempt.big5Results[trait];
      if (result) {
        traitSums[trait] += result.score;
        
        // Track score distribution
        if (!traitDistribution[trait][result.score]) {
          traitDistribution[trait][result.score] = 0;
        }
        traitDistribution[trait][result.score]++;

        // Track level distribution
        levelDistribution[result.level]++;
      }
    });
  });

  const count = big5Attempts.length;
  const averageScores = {
    E: Math.round(traitSums.E / count * 10) / 10,
    A: Math.round(traitSums.A / count * 10) / 10,
    C: Math.round(traitSums.C / count * 10) / 10,
    N: Math.round(traitSums.N / count * 10) / 10,
    O: Math.round(traitSums.O / count * 10) / 10
  };

  res.json({
    success: true,
    data: {
      totalAssessments: count,
      averageScores,
      averagePercentages: {
        E: Math.round((averageScores.E / 40) * 100),
        A: Math.round((averageScores.A / 40) * 100),
        C: Math.round((averageScores.C / 40) * 100),
        N: Math.round((averageScores.N / 40) * 100),
        O: Math.round((averageScores.O / 40) * 100)
      },
      traitDistribution,
      levelDistribution
    }
  });
});

/**
 * @desc    Get Big5 comparison data
 * @route   GET /api/big5/comparison
 * @access  Private
 */
const getBig5Comparison = asyncHandler(async (req, res) => {
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
    results: attempt.big5Results
  }));

  res.json({
    success: true,
    data: { comparisons }
  });
});

/**
 * Helper function to generate Big5 report
 */
async function generateBig5Report(attempt, assessment, big5Results) {
  const dominantTraits = getDominantTraits(big5Results);
  const narrative = generateNarrative(big5Results);

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
    type: 'big5',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    scores: {
      byTrait: {
        E: big5Results.E,
        A: big5Results.A,
        C: big5Results.C,
        N: big5Results.N,
        O: big5Results.O
      }
    },
    dimensions: {
      BigFive: {
        extraversion: big5Results.E.score,
        agreeableness: big5Results.A.score,
        conscientiousness: big5Results.C.score,
        neuroticism: big5Results.N.score,
        openness: big5Results.O.score
      },
      dominantTraits,
      narrative
    },
    analysis: {
      summary: narrative,
      strengths: dominantTraits.map(trait => getTraitDescription(trait).high),
      developmentAreas: [], // Could be calculated based on lowest scores
      recommendations: generateRecommendations(big5Results)
    }
  });

  return report;
}

/**
 * Generate recommendations based on Big5 results
 */
function generateRecommendations(results) {
  const recommendations = [];

  if (results.N.level === 'High') {
    recommendations.push('Consider stress management techniques and mindfulness practices');
  }
  if (results.C.level === 'Low') {
    recommendations.push('Try using organizational tools and setting clear goals');
  }
  if (results.E.level === 'Low') {
    recommendations.push('Gradually expand your social circle in comfortable settings');
  }
  if (results.O.level === 'High') {
    recommendations.push('Explore creative outlets and new learning opportunities');
  }
  if (results.A.level === 'Low') {
    recommendations.push('Practice active listening and empathy in conversations');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue leveraging your balanced personality profile');
    recommendations.push('Focus on areas where you want to grow based on personal goals');
  }

  return recommendations;
}

/**
 * @desc    Download Big5 assessment PDF report
 * @route   GET /api/attempts/:attemptId/big5-report/download
 * @access  Private
 */
const downloadBig5Report = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { type = 'comprehensive' } = req.query;

  const attempt = await Attempt.findById(attemptId)
    .populate('user', 'firstName lastName email')
    .populate('assessment', 'title category subCategory');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Access denied');
  }

  const category = attempt.assessment.category?.toLowerCase();
  const subCategory = attempt.assessment.subCategory?.toLowerCase();

  if (category !== 'big5' && subCategory !== 'big5' && !attempt.big5Results) {
    throw new ApiError(400, 'This is not a Big5 assessment attempt');
  }

  if (!attempt.big5Results) {
    throw new ApiError(400, 'Big5 results not available for this attempt');
  }

  try {
    const { downloadPdf } = require('../services/pdfDownloadService');

    const testTaker = {
      name: attempt.testTakerName || (attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}`.trim() : null),
      email: attempt.testTakerEmail || attempt.user?.email,
      phone: attempt.testTakerPhone
    };

    const { buffer: pdfBuffer } = await downloadPdf(attempt.big5Results, testTaker, 'big5', type);
    const assessmentTitle = attempt.assessment?.title?.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_') || 'Big5';
    const candidateName = (testTaker.name || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 50);
    const typeLabel = type === 'summary' ? 'Summary' : 'Comprehensive';
    const filename = `${assessmentTitle}_${typeLabel}_${candidateName}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Big5 PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate PDF');
  }
});

module.exports = {
  submitBig5,
  getBig5Results,
  getBig5Analytics,
  getBig5Comparison,
  generateBig5Report,
  downloadBig5Report
};
