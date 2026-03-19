const { Attempt, Assessment, Question, Report, Organization } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get user's attempts
 * @route   GET /api/attempts
 * @access  Private
 */
const getAttempts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, assessmentId } = req.query;

  let query = { user: req.user._id };

  if (status) {
    query.status = status;
  }

  if (assessmentId) {
    query.assessment = assessmentId;
  }

  const attempts = await Attempt.find(query)
    .populate('assessment', 'title category difficulty timeBound')
    .populate('report', 'generatedAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Attempt.countDocuments(query);

  res.json({
    success: true,
    data: {
      attempts,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Get single attempt
 * @route   GET /api/attempts/:id
 * @access  Private
 */
const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id)
    .populate('assessment')
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'answers.question',
      model: 'Question'
    });

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Public attempts can be accessed without auth for test-taking
  if (attempt.isPublicAttempt) {
    return res.json({
      success: true,
      data: { attempt }
    });
  }

  // For authenticated attempts, check permissions
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    if (attempt.user && attempt.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Admin can only view attempts from their organization
  if (req.user.role === 'admin') {
    if (attempt.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({
    success: true,
    data: { attempt }
  });
});

/**
 * @desc    Get public attempt (for test takers without auth)
 * @route   GET /api/attempts/public/attempt/:id
 * @access  Public
 */
const getPublicAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id)
    .populate({
      path: 'assessment',
      select: 'title category description timeBound instructions questions totalQuestions'
    })
    .populate({
      path: 'assessment.questions',
      model: 'Question',
      select: 'questionText order statements options type'
    });

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Check if this is a public attempt
  if (!attempt.isPublicAttempt) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: { attempt }
  });
});

/**
 * @desc    Start new attempt
 * @route   POST /api/assessments/:assessmentId/start
 * @access  Private
 */
const startAttempt = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { passcode } = req.body;

  const assessment = await Assessment.findById(assessmentId)
    .populate('questions');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!assessment.isActive || !assessment.isPublished) {
    throw new ApiError(400, 'Assessment is not available');
  }

  // Check if user has access to this assessment
  const hasAccess = req.user.role === 'superadmin' ||
    req.user.role === 'admin' ||
    req.user.assignedAssessments.includes(assessmentId) ||
    assessment.assignedUsers.includes(req.user._id);

  if (!hasAccess) {
    throw new ApiError(403, 'You do not have access to this assessment');
  }

  // Validate passcode if required
  if (assessment.requirePasscode && assessment.passcode) {
    if (!passcode) {
      throw new ApiError(400, 'Passcode is required to start this assessment');
    }
    if (passcode !== assessment.passcode) {
      throw new ApiError(400, 'Invalid passcode');
    }
  }

  // Check for existing in-progress attempts
  const existingAttempt = await Attempt.findOne({
    user: req.user._id,
    assessment: assessmentId,
    status: 'in-progress'
  });

  if (existingAttempt) {
    return res.json({
      success: true,
      message: 'Resuming existing attempt',
      data: { attempt: existingAttempt }
    });
  }

  // Check attempt limits
  if (!assessment.allowMultipleAttempts) {
    const previousAttempts = await Attempt.countDocuments({
      user: req.user._id,
      assessment: assessmentId,
      status: { $in: ['completed', 'expired'] }
    });

    if (previousAttempts >= assessment.maxAttempts) {
      throw new ApiError(400, 'Maximum attempts reached for this assessment');
    }
  }

  // Check organization credits (based on assessment category)
  const organization = await Organization.findById(req.user.organization);
  const creditsRequired = assessment.creditsRequired || organization.credits.creditCost?.[assessment.category] || 5;
  const remainingCredits = organization.credits.total - organization.credits.used;

  if (remainingCredits < creditsRequired) {
    throw new ApiError(403, `Insufficient credits. This assessment requires ${creditsRequired} credits.`);
  }

  // Calculate expiry time
  let expiresAt = null;
  if (assessment.timeBound.enabled) {
    expiresAt = new Date(Date.now() + assessment.timeBound.durationMinutes * 60 * 1000);
  }

  // Create attempt
  const attempt = await Attempt.create({
    user: req.user._id,
    assessment: assessmentId,
    organization: req.user.organization._id,
    status: 'in-progress',
    expiresAt,
    timeLimit: assessment.timeBound.enabled ? assessment.timeBound.durationMinutes * 60 : 0,
    totalQuestions: assessment.questions.length,
    totalMarks: assessment.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Deduct credit based on assessment category
  organization.credits.used += creditsRequired;
  
  // Track usage in oldest non-expired batch first
  const now = new Date();
  let remainingToTrack = creditsRequired;
  for (const batch of organization.credits.batches) {
    if (batch.expiresAt && batch.expiresAt > now && batch.used < batch.amount) {
      const availableInBatch = batch.amount - batch.used;
      const toDeduct = Math.min(availableInBatch, remainingToTrack);
      batch.used += toDeduct;
      remainingToTrack -= toDeduct;
      if (remainingToTrack <= 0) break;
    }
  }
  
  await organization.save();

  // Prepare questions for test (randomize if enabled)
  let questions = assessment.questions;
  if (assessment.randomizeQuestions) {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }

  await attempt.populate('assessment');

  res.status(201).json({
    success: true,
    message: 'Attempt started successfully',
    data: {
      attempt,
      questions: questions.map(q => ({
        id: q._id,
        type: q.type,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: assessment.randomizeOptions ? [...q.options].sort(() => Math.random() - 0.5) : q.options,
        order: q.order,
        marks: q.marks,
        timeLimit: q.timeLimit
      }))
    }
  });
});

/**
 * @desc    Save answer
 * @route   POST /api/attempts/:id/answer
 * @access  Private
 */
const saveAnswer = asyncHandler(async (req, res) => {
  const { questionId, selectedOption, textAnswer, ratingAnswer, timeSpent } = req.body;

  const attempt = await Attempt.findById(req.params.id);

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.status !== 'in-progress') {
    throw new ApiError(400, 'Attempt is not in progress');
  }

  // Check if attempt has expired
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = 'expired';
    await attempt.save();
    throw new ApiError(400, 'Attempt has expired');
  }

  // Find existing answer
  const answerIndex = attempt.answers.findIndex(
    a => a.question.toString() === questionId
  );

  const answerData = {
    question: questionId,
    selectedOption: selectedOption !== undefined ? selectedOption : null,
    textAnswer: textAnswer || '',
    ratingAnswer: ratingAnswer !== undefined ? ratingAnswer : null,
    timeSpent: timeSpent || 0,
    answeredAt: new Date()
  };

  if (answerIndex >= 0) {
    attempt.answers[answerIndex] = answerData;
  } else {
    attempt.answers.push(answerData);
  }

  await attempt.save();

  res.json({
    success: true,
    message: 'Answer saved successfully',
    data: { attempt }
  });
});

/**
 * @desc    Submit attempt
 * @route   POST /api/attempts/:id/submit
 * @access  Private
 */
const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id)
    .populate({
      path: 'answers.question',
      model: 'Question'
    });

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.status !== 'in-progress') {
    throw new ApiError(400, 'Attempt is already completed');
  }

  const assessment = await Assessment.findById(attempt.assessment);

  // Calculate scores
  let totalScore = 0;
  let maxScore = 0;
  const dimensionScores = {};

  attempt.answers.forEach(answer => {
    const question = answer.question;
    if (!question) return;

    maxScore += question.marks || 1;

    // Calculate score based on question type
    if (question.type === 'mcq') {
      const selectedOption = question.options[answer.selectedOption];
      if (selectedOption) {
        answer.isCorrect = selectedOption.isCorrect;
        answer.marksObtained = selectedOption.score || (selectedOption.isCorrect ? question.marks : 0);
        totalScore += answer.marksObtained;
      }
    } else if (question.type === 'text') {
      // For text questions, manual grading might be needed
      answer.marksObtained = 0;
    } else if (question.type === 'rating') {
      answer.marksObtained = answer.ratingAnswer || 0;
      totalScore += answer.marksObtained;
    }

    // Track dimension scores for psychometric assessments
    if (question.dimension) {
      if (!dimensionScores[question.dimension]) {
        dimensionScores[question.dimension] = { score: 0, count: 0 };
      }
      dimensionScores[question.dimension].score += answer.marksObtained;
      dimensionScores[question.dimension].count += 1;
    }
  });

  // Calculate percentage
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  // Update attempt
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.score = totalScore;
  attempt.totalMarks = maxScore;
  attempt.percentage = percentage;
  attempt.passed = percentage >= assessment.passingPercentage;
  attempt.dimensionScores = dimensionScores;

  await attempt.save();

  // Generate report
  const report = await generateReport(attempt, assessment, dimensionScores);
  attempt.report = report._id;
  await attempt.save();

  res.json({
    success: true,
    message: 'Attempt submitted successfully',
    data: {
      attempt,
      report: assessment.showResultsImmediately ? report : null
    }
  });
});

/**
 * @desc    Auto-save progress
 * @route   POST /api/attempts/:id/auto-save
 * @access  Private
 */
const autoSave = asyncHandler(async (req, res) => {
  const { answers, timeSpent } = req.body;

  const attempt = await Attempt.findById(req.params.id);

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.status !== 'in-progress') {
    throw new ApiError(400, 'Attempt is not in progress');
  }

  // Update answers
  answers.forEach(answerData => {
    const answerIndex = attempt.answers.findIndex(
      a => a.question.toString() === answerData.questionId
    );

    if (answerIndex >= 0) {
      attempt.answers[answerIndex] = {
        ...attempt.answers[answerIndex],
        ...answerData,
        answeredAt: new Date()
      };
    } else {
      attempt.answers.push({
        question: answerData.questionId,
        selectedOption: answerData.selectedOption,
        textAnswer: answerData.textAnswer,
        ratingAnswer: answerData.ratingAnswer,
        answeredAt: new Date()
      });
    }
  });

  if (timeSpent) {
    attempt.timeSpent = timeSpent;
  }

  await attempt.save();

  res.json({
    success: true,
    message: 'Progress saved'
  });
});

/**
 * Helper function to generate report
 */
async function generateReport(attempt, assessment, dimensionScores) {
  const Report = require('../models/Report');

  // Calculate category scores
  const categoryScores = [];
  const categoryMap = {};

  attempt.answers.forEach(answer => {
    const question = answer.question;
    if (!question || !question.category) return;

    if (!categoryMap[question.category]) {
      categoryMap[question.category] = { score: 0, maxScore: 0 };
    }
    categoryMap[question.category].score += answer.marksObtained || 0;
    categoryMap[question.category].maxScore += question.marks || 1;
  });

  Object.entries(categoryMap).forEach(([category, data]) => {
    categoryScores.push({
      category,
      score: data.score,
      maxScore: data.maxScore,
      percentage: data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0
    });
  });

  // Generate analysis based on assessment type
  let analysis = {
    summary: '',
    strengths: [],
    developmentAreas: [],
    recommendations: []
  };

  if (assessment.category === 'psychometric') {
    analysis = generatePsychometricAnalysis(dimensionScores, attempt.percentage);
  } else {
    analysis.summary = `You scored ${attempt.percentage.toFixed(1)}% on this assessment.`;
    if (attempt.passed) {
      analysis.strengths.push('Successfully passed the assessment');
    } else {
      analysis.developmentAreas.push('Review the material and try again');
    }
  }

  const report = await Report.create({
    attempt: attempt._id,
    user: attempt.user,
    assessment: attempt.assessment,
    organization: attempt.organization,
    type: assessment.category === 'psychometric' ? 'psychometric' : 'standard',
    scores: {
      total: attempt.score,
      maxScore: attempt.totalMarks,
      percentage: attempt.percentage,
      byCategory: categoryScores
    },
    dimensions: {
      DISC: calculateDISC(dimensionScores),
      MBTI: calculateMBTI(dimensionScores),
      dominantTraits: Object.entries(dimensionScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 3)
        .map(([trait]) => trait)
    },
    analysis,
    questionAnalysis: attempt.answers.map(a => ({
      question: a.question._id,
      userAnswer: a.selectedOption !== null ? a.selectedOption : a.textAnswer || a.ratingAnswer,
      isCorrect: a.isCorrect,
      timeSpent: a.timeSpent
    }))
  });

  return report;
}

function generatePsychometricAnalysis(dimensionScores, overallPercentage) {
  const traits = Object.entries(dimensionScores)
    .sort((a, b) => b[1].score - a[1].score);

  const strengths = traits.slice(0, 2).map(([trait]) => `Strong ${trait.toLowerCase()}`);
  const developmentAreas = traits.slice(-2).map(([trait]) => `Developing ${trait.toLowerCase()}`);

  return {
    summary: `Your assessment reveals a unique profile with notable strengths in ${traits[0]?.[0] || 'various areas'}.`,
    strengths,
    developmentAreas,
    recommendations: [
      'Leverage your strengths in daily activities',
      'Focus on developing areas that scored lower',
      'Consider seeking feedback from peers'
    ]
  };
}

function calculateDISC(dimensionScores) {
  // Simplified DISC calculation
  return {
    D: dimensionScores['Dominance']?.score || 0,
    I: dimensionScores['Influence']?.score || 0,
    S: dimensionScores['Steadiness']?.score || 0,
    C: dimensionScores['Compliance']?.score || 0,
    dominant: Object.entries(dimensionScores)
      .sort((a, b) => b[1].score - a[1].score)[0]?.[0] || ''
  };
}

function calculateMBTI(dimensionScores) {
  // Simplified MBTI calculation
  return {
    EI: 50 + (dimensionScores['Extraversion']?.score || 0) * 5,
    SN: 50 + (dimensionScores['Sensing']?.score || 0) * 5,
    TF: 50 + (dimensionScores['Thinking']?.score || 0) * 5,
    JP: 50 + (dimensionScores['Judging']?.score || 0) * 5,
    type: ''
  };
}

/**
 * @desc    Verify passcode for assessment
 * @route   POST /api/assessments/:assessmentId/verify-passcode
 * @access  Private
 */
const verifyPasscode = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { passcode } = req.body;

  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!assessment.requirePasscode || !assessment.passcode) {
    return res.json({
      success: true,
      data: { required: false }
    });
  }

  if (!passcode) {
    throw new ApiError(400, 'Passcode is required');
  }

  if (passcode !== assessment.passcode) {
    throw new ApiError(400, 'Invalid passcode');
  }

  res.json({
    success: true,
    data: { required: true, valid: true }
  });
});

/**
 * @desc    Log proctoring event
 * @route   POST /api/attempts/:id/proctoring-log
 * @access  Private
 */
const logProctoringEvent = asyncHandler(async (req, res) => {
  const { event, details } = req.body;
  const attempt = await Attempt.findById(req.params.id);

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user && attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  attempt.proctoringLogs.push({
    event,
    details,
    timestamp: new Date()
  });

  if (event === 'tab_switch') {
    attempt.tabSwitchCount += 1;
  }
  if (event === 'fullscreen_exit') {
    attempt.fullscreenExits += 1;
  }

  await attempt.save();

  res.json({
    success: true,
    message: 'Proctoring event logged successfully'
  });
});

/**
 * @desc    Start public attempt (for test takers)
 * @route   POST /api/attempts/public/:assessmentId/start
 * @access  Public
 */
const startPublicAttempt = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { testTakerName, passcode } = req.body;

  const assessment = await Assessment.findById(assessmentId)
    .populate('questions');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!assessment.isActive || !assessment.isPublished || assessment.isMuted) {
    throw new ApiError(400, 'Assessment is not available');
  }

  // Validate passcode if required
  if (assessment.requirePasscode && assessment.passcode) {
    if (!passcode) {
      throw new ApiError(400, 'Passcode is required to start this assessment');
    }
    if (passcode !== assessment.passcode) {
      throw new ApiError(400, 'Invalid passcode');
    }
  }

  // Check organization credits based on assessment category
  const organization = await Organization.findById(assessment.organization);
  const creditsRequired = assessment.creditsRequired || organization.credits.creditCost?.[assessment.category] || 5;
  const remainingCredits = organization.credits.total - organization.credits.used;

  if (remainingCredits < creditsRequired) {
    throw new ApiError(403, `Insufficient credits. This assessment requires ${creditsRequired} credits.`);
  }

  // Calculate expiry time
  let expiresAt = null;
  if (assessment.timeBound.enabled) {
    expiresAt = new Date(Date.now() + assessment.timeBound.durationMinutes * 60 * 1000);
  }

  // Create public attempt (no user association)
  const attempt = await Attempt.create({
    user: null,
    testTakerName,
    assessment: assessmentId,
    organization: assessment.organization,
    isPublicAttempt: true,
    status: 'in-progress',
    expiresAt,
    timeLimit: assessment.timeBound.enabled ? assessment.timeBound.durationMinutes * 60 : 0,
    totalQuestions: assessment.questions.length,
    totalMarks: assessment.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Deduct credit based on assessment category
  organization.credits.used += creditsRequired;
  
  // Track usage in oldest non-expired batch first
  const now = new Date();
  let remainingToTrack = creditsRequired;
  for (const batch of organization.credits.batches) {
    if (batch.expiresAt && batch.expiresAt > now && batch.used < batch.amount) {
      const availableInBatch = batch.amount - batch.used;
      const toDeduct = Math.min(availableInBatch, remainingToTrack);
      batch.used += toDeduct;
      remainingToTrack -= toDeduct;
      if (remainingToTrack <= 0) break;
    }
  }
  
  await organization.save();

  await attempt.populate('assessment');

  res.status(201).json({
    success: true,
    message: 'Assessment started successfully',
    data: {
      attempt,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        category: assessment.category,
        timeBound: assessment.timeBound,
        instructions: assessment.instructions
      },
      questions: assessment.questions.map(q => ({
        id: q._id,
        type: q.type,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: q.options,
        order: q.order,
        marks: q.marks,
        timeLimit: q.timeLimit,
        statements: q.statements
      }))
    }
  });
});

/**
 * @desc    Request report access (for test takers)
 * @route   POST /api/attempts/:id/request-report
 * @access  Public
 */
const requestReportAccess = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const attempt = await Attempt.findById(req.params.id);

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.status !== 'completed') {
    throw new ApiError(400, 'Assessment must be completed before requesting report access');
  }

  attempt.reportRequest = {
    requested: true,
    requestedAt: new Date(),
    message: message || '',
    status: 'pending'
  };

  await attempt.save();

  res.json({
    success: true,
    message: 'Report access requested successfully. You will be notified when approved.'
  });
});

module.exports = {
  getAttempts,
  getAttempt,
  getPublicAttempt,
  startAttempt,
  startPublicAttempt,
  saveAnswer,
  submitAttempt,
  autoSave,
  verifyPasscode,
  logProctoringEvent,
  requestReportAccess
};
