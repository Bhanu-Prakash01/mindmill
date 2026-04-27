const { Attempt, Assessment, Report, User, Organization } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { scoreHogan, calculateHoganScores } = require('../services/hoganScoringService');
const { generateHoganReport } = require('../services/hoganReportService');
const { generateHoganReportPdf } = require('../services/pdfService');

const submitHogan = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { responses } = req.body;

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  const category = assessment.category?.toLowerCase();
  const subCategory = assessment.subCategory?.toLowerCase();
  if (category !== 'hogan' && subCategory !== 'hogan') {
    throw new ApiError(400, 'This is not a Hogan assessment');
  }

  const totalQuestionsCount = assessment.questions?.length || 50;
  if (!responses || typeof responses !== 'object') {
    throw new ApiError(400, 'Invalid responses format');
  }

  const responseKeys = Object.keys(responses);
  if (responseKeys.length < totalQuestionsCount * 0.67) {
    throw new ApiError(400, 'Please answer at least 67% of questions');
  }

  let attempt = await Attempt.findOne({
    user: req.user._id,
    assessment: assessmentId,
    status: 'in-progress'
  });

  if (!attempt) {
    attempt = await Attempt.create({
      user: req.user._id,
      assessment: assessmentId,
      organization: req.user.organization,
      status: 'in-progress',
      startedAt: new Date(),
      isPublicAttempt: false
    });
  }

  const hoganResults = scoreHogan(responses);
  if (!hoganResults.success) {
    throw new ApiError(400, hoganResults.error);
  }

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.hoganResults = hoganResults.results;
  attempt.answeredQuestions = responseKeys.length;
  attempt.answers = responseKeys.map(qNum => ({
    question: qNum,
    selectedOption: responses[qNum],
    textAnswer: null,
    ratingAnswer: null
  }));

  if (!attempt.creditDeducted && !attempt.isPublicAttempt && req.user.role !== 'superadmin') {
    attempt.creditDeducted = true;
  }

  await attempt.save();

  const report = await generateHoganReport(attempt, assessment, hoganResults.results);
  if (report) {
    attempt.report = report._id;
    await attempt.save();
  }

  res.status(200).json({
    success: true,
    message: 'Hogan assessment submitted successfully',
    data: {
      attemptId: attempt._id,
      results: hoganResults.results,
      reportId: report?._id
    }
  });
});

const getHoganResults = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  const attempt = await Attempt.findById(attemptId)
    .populate('assessment', 'title category subCategory')
    .populate('report');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (!attempt.hoganResults) {
    throw new ApiError(400, 'No Hogan results found for this attempt');
  }

  const isOwner = attempt.user.toString() === req.user._id.toString() ||
    req.user.role === 'superadmin' || 
    req.user.role === 'admin';

  if (!isOwner) {
    throw new ApiError(403, 'Not authorized to view this result');
  }

  res.status(200).json({
    success: true,
    data: {
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        completedAt: attempt.completedAt,
        timeSpent: attempt.timeSpent,
        answeredQuestions: attempt.answeredQuestions
      },
      assessment: attempt.assessment,
      results: attempt.hoganResults,
      report: attempt.report
    }
  });
});

const startHogan = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  const category = assessment.category?.toLowerCase();
  const subCategory = assessment.subCategory?.toLowerCase();
  if (category !== 'hogan' && subCategory !== 'hogan') {
    throw new ApiError(400, 'This is not a Hogan assessment');
  }
  if (!assessment.isPublished) {
    throw new ApiError(400, 'Assessment is not published');
  }

  let attempt = await Attempt.findOne({
    user: req.user._id,
    assessment: assessmentId,
    status: 'in-progress'
  });

  if (attempt) {
    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        alreadyStarted: true,
        timeSpent: Math.floor((Date.now() - attempt.startedAt) / 1000)
      }
    });
  }

  attempt = await Attempt.create({
    user: req.user._id,
    assessment: assessmentId,
    organization: req.user.organization,
    status: 'in-progress',
    startedAt: new Date(),
    isPublicAttempt: req.query.public === 'true'
  });

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        totalQuestions: assessment.questions?.length || 50,
        duration: assessment.timeBound?.enabled ? assessment.timeBound.durationMinutes : null,
        instructions: assessment.instructions
      }
    }
  });
});

const saveHoganProgress = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { responses, currentQuestion } = req.body;

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Not authorized');
  }

  if (!attempt.answers) {
    attempt.answers = [];
  }

  if (responses) {
    Object.keys(responses).forEach(qNum => {
      const existingIdx = attempt.answers.findIndex(a => a.question === qNum);
      if (existingIdx >= 0) {
        attempt.answers[existingIdx].selectedOption = responses[qNum];
      } else {
        attempt.answers.push({
          question: qNum,
          selectedOption: responses[qNum],
          textAnswer: null,
          ratingAnswer: null
        });
      }
    });
  }

  await attempt.save();

  res.status(200).json({
    success: true,
    data: {
      attemptId: attempt._id,
      answeredCount: attempt.answers.length,
      lastQuestion: currentQuestion
    }
  });
});

const getHoganAnalytics = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  const attempt = await Attempt.findById(attemptId)
    .populate('assessment', 'title category subCategory');

  if (!attempt || !attempt.hoganResults) {
    throw new ApiError(404, 'Hogan results not found');
  }

  const { percentiles, scales, dominantScale, secondaryScale } = attempt.hoganResults;

  const distribution = Object.entries(percentiles).map(([scale, percentile]) => ({
    scale,
    percentile,
    category: percentile >= 66 ? 'High' : percentile <= 33 ? 'Low' : 'Moderate'
  }));

  res.status(200).json({
    success: true,
    data: {
      summary: {
        dominantScale,
        secondaryScale,
        highestPercentile: Math.max(...Object.values(percentiles)),
        lowestPercentile: Math.min(...Object.values(percentiles)),
        averagePercentile: Math.round(
          Object.values(percentiles).reduce((a, b) => a + b, 0) / Object.values(percentiles).length
        )
      },
      scales: distribution,
      interpretation: {
        highScales: distribution.filter(d => d.category === 'High').map(d => d.scale),
        moderateScales: distribution.filter(d => d.category === 'Moderate').map(d => d.scale),
        lowScales: distribution.filter(d => d.category === 'Low').map(d => d.scale)
      }
    }
  });
});

const submitHoganPublic = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { responses } = req.body;
  const { TestTakerInvite, Assessment, Attempt } = require('../models');

  const invite = await TestTakerInvite.findOne({ token, status: 'pending' })
    .populate('assessment');

  if (!invite) {
    throw new ApiError(404, 'Invalid or expired invite');
  }

  const assessment = invite.assessment;
  const category = assessment?.category?.toLowerCase();
  const subCategory = assessment?.subCategory?.toLowerCase();
  if (!assessment || (category !== 'hogan' && subCategory !== 'hogan')) {
    throw new ApiError(400, 'This is not a Hogan assessment');
  }

  const totalQuestionsCount = assessment.questions?.length || 50;
  if (!responses || typeof responses !== 'object') {
    throw new ApiError(400, 'Invalid responses format');
  }

  const responseKeys = Object.keys(responses);
  if (responseKeys.length < totalQuestionsCount * 0.67) {
    throw new ApiError(400, 'Please answer at least 67% of questions');
  }

  let attempt = await Attempt.findById(invite.attemptId);
  if (!attempt || attempt.status !== 'in-progress') {
    throw new ApiError(400, 'No active attempt found');
  }

  const hoganResults = scoreHogan(responses);
  if (!hoganResults.success) {
    throw new ApiError(400, hoganResults.error);
  }

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.hoganResults = hoganResults.results;
  attempt.answeredQuestions = responseKeys.length;
  attempt.answers = responseKeys.map(qNum => ({
    question: qNum,
    selectedOption: responses[qNum],
    textAnswer: null,
    ratingAnswer: null
  }));

  await attempt.save();

  const report = await generateHoganReport(attempt, assessment, hoganResults.results);
  if (report) {
    attempt.report = report._id;
    await attempt.save();
  }

  await TestTakerInvite.findByIdAndUpdate(invite._id, { status: 'completed' });

  res.status(200).json({
    success: true,
    message: 'Hogan assessment submitted successfully',
    data: {
      attemptId: attempt._id,
      results: hoganResults.results,
      reportId: report?._id
    }
  });
});

const downloadHoganPdf = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { type = 'comprehensive' } = req.query;

  const attempt = await Attempt.findById(attemptId)
    .populate('assessment', 'title category subCategory')
    .populate('user', 'firstName lastName email');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (!attempt.hoganResults) {
    throw new ApiError(400, 'No Hogan results found for this attempt');
  }

  const isOwner = attempt.user && attempt.user._id.toString() === req.user._id.toString() ||
    req.user.role === 'superadmin' || 
    req.user.role === 'admin';

  if (!isOwner) {
    throw new ApiError(403, 'Not authorized to download this report');
  }

  try {
    const testTaker = {
      name: attempt.testTakerName || (attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}`.trim() : 'Candidate'),
      email: attempt.testTakerEmail || attempt.user?.email,
      phone: attempt.testTakerPhone,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      totalQuestions: attempt.assessment?.questions?.length || 50,
      answeredQuestions: attempt.answeredQuestions
    };

    // Pass attempt directly — generateHoganReportPdf will read hoganResults
    // from reportObj.hoganResults (priority 1 path) which gives accurate scores.
    try {
      const pdfBuffer = await generateHoganReportPdf(attempt, testTaker, { type });
      
      const candidateName = testTaker.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Hogan_${type === 'summary' ? 'Summary' : 'Comprehensive'}_${candidateName}_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Hogan PDF generation error:', error);
      throw new ApiError(500, 'Failed to generate PDF report');
    }
  } catch (error) {
    if (error.status) throw error;
    console.error('Hogan PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate PDF report');
  }
});

module.exports = {
  submitHogan,
  submitHoganPublic,
  getHoganResults,
  startHogan,
  saveHoganProgress,
  getHoganAnalytics,
  downloadHoganPdf
};