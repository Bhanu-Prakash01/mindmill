/**
 * FIRO-B Controller
 * Handles FIRO-B operations including scoring and reporting
 */
const mongoose = require('mongoose');
const { Attempt, Assessment, Report } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const firoService = require('../services/firoScoringService');
const { getFIROStaticData, generateFIRONarratives } = require('../services/llmReportService');
const { firoQuestions, firoConfig } = require('../seeders/firoQuestions');

/**
 * Get all FIRO-B questions (54 items)
 */
const getFiroQuestions = asyncHandler(async (req, res) => {
  const questions = firoQuestions.map((q, idx) => ({
    id: idx + 1,
    text: q.questionText,
    trait: q.trait,
    options: q.options
  }));

  res.json({ success: true, data: { questions } });
});

/**
 * Submit FIRO-B responses and return scored results
 */
const submitFiro = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { responses } = req.body;
  const total = 54;
  
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // FIRO-B UI from FiroTest.jsx parses responses as an object { "1": val, "2": val... }
  const responseValues = Object.values(responses);
  if (!responses || typeof responses !== 'object' || responseValues.length !== total) {
    throw new ApiError(400, `Invalid responses. Expected ${total} responses.`);
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

  // Calculate FIRO-B scores using the scoring service
  const firoResults = firoService.calculateFiroScores(responseValues);

  // Update attempt with results
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.firoResults = firoResults;
  attempt.answeredQuestions = total;

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

  // Generate FIRO-B report
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
    type: 'firo',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    FIRO: {
      totals: firoResults.totals,
      dimensions: firoResults.dimensions
    }
  });

  attempt.report = report._id;
  await attempt.save();

  res.json({
    success: true,
    message: 'FIRO-B assessment completed successfully',
    data: {
      attempt,
      results: firoResults,
      report: assessment.showResultsImmediately ? report : null,
      responsesLength: total
    }
  });
});

/**
 * Get FIRO-B configuration
 */
const getFiroConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, data: firoConfig });
});

/**
 * Get FIRO-B results for an attempt
 */
const getFiroResults = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId)
    .populate('assessment', 'title category showResultsImmediately');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Check permissions
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.assessment.category !== 'firo' && attempt.assessment.category !== 'firo-b') {
    throw new ApiError(400, 'This is not a FIRO-B assessment attempt');
  }

  if (!attempt.firoResults) {
    throw new ApiError(400, 'FIRO-B results not available for this attempt');
  }

  // Render static interpretive content based on dimension matrix limits
  const { dimensions, totals } = attempt.firoResults;
  
  let report = attempt.report;
  if (!report) {
    report = await Report.findOne({ attempt: attempt._id });
  } else if (typeof report === 'string' || report instanceof mongoose.Types.ObjectId) {
    report = await Report.findById(report);
  }

  let analysis = report?.analysis;

  // On-demand LLM generation if missing
  if (!analysis || !analysis.coverSummary) {
    try {
      const testTaker = { name: attempt.testTakerName || 'the candidate' };
      const narrativeKeys = await generateFIRONarratives(attempt.firoResults, testTaker);
      const staticData = getFIROStaticData(dimensions, totals);

      // Merge LLM narrative with static matrices for React
      analysis = {
        ...staticData,
        ...narrativeKeys
      };

      if (report) {
        report.analysis = analysis;
        await report.save();
      }
    } catch (err) {
      console.error('Failed to generate FIRO analysis:', err);
      analysis = getFIROStaticData(dimensions, totals);
    }
  }

  res.json({
    success: true,
    data: {
      results: attempt.firoResults,
      analysis,
      reportId: report?._id,
      completedAt: attempt.completedAt,
      testTaker: {
        name: attempt.testTakerName || null,
        email: attempt.testTakerEmail || null,
        phone: attempt.testTakerPhone || null
      }
    }
  });
});

module.exports = {
  getFiroQuestions,
  submitFiro,
  getFiroConfig,
  getFiroResults
};
