const { Attempt, Assessment, Question, Report, Organization, TestTakerInvite } = require('../models');
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
      select: 'title category description timeBound instructions questions totalQuestions',
      populate: {
        path: 'questions',
        model: 'Question',
        select: 'questionText order statements options type'
      }
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
      status: { $in: ['completed', 'expired', 'abandoned'] }
    });

    if (previousAttempts >= assessment.maxAttempts) {
      throw new ApiError(400, 'Maximum attempts reached for this assessment');
    }
  }

  // Check if assessment is unlocked for this organization (test slot available)
  const isSuperAdmin = req.user.role === 'superadmin';
  if (!isSuperAdmin) {
    const orgId = req.user.organization?._id?.toString();
    if (!orgId) {
      throw new ApiError(403, 'You must belong to an organization to take assessments');
    }

    const unlockEntry = assessment.unlockedBy?.find(
      u => u.organization.toString() === orgId
    );

    if (!unlockEntry) {
      throw new ApiError(403, 'Assessment not unlocked. Contact your admin to purchase test slots.');
    }

    const remainingTests = unlockEntry.testsAllowed - unlockEntry.testsUsed;
    if (remainingTests <= 0) {
      throw new ApiError(403, 'No test slots remaining. Admin needs to purchase more test slots.');
    }
  }

  // Calculate expiry time
  let expiresAt = null;
  if (assessment.timeBound.enabled) {
    expiresAt = new Date(Date.now() + assessment.timeBound.durationMinutes * 60 * 1000);
  }

  // Create attempt
  let orgId = req.user.organization?._id;
  if (!orgId && isSuperAdmin) {
    const { Organization } = require('../models');
    let mindmilOrg = await Organization.findOne({ slug: 'mindmil' });
    if (!mindmilOrg) {
      mindmilOrg = await Organization.create({
        name: 'Mindmil Direct',
        slug: 'mindmil',
        description: 'Direct Mindmil tests created by superadmin'
      });
    }
    orgId = mindmilOrg._id;
  }

  const attempt = await Attempt.create({
    user: req.user._id,
    assessment: assessmentId,
    organization: orgId,
    status: 'in-progress',
    expiresAt,
    timeLimit: assessment.timeBound.enabled ? assessment.timeBound.durationMinutes * 60 : 0,
    totalQuestions: assessment.questions.length,
    totalMarks: assessment.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

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

  // Allow public/invite-based attempts (user is null, req.user may be null)
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.status !== 'in-progress') {
    throw new ApiError(400, 'Attempt is not in progress');
  }

  // Check if attempt has expired
  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    attempt.status = 'expired';

    // Apply 3-question rule: deduct test slot only if >= 3 answers
    if (!attempt.creditDeducted && !attempt.isPublicAttempt) {
      const { User } = require('../models');
      const user = await User.findById(attempt.user);
      if (user?.role !== 'superadmin') {
        const answerCount = attempt.answers.length;
        if (answerCount >= 3) {
          attempt.creditDeducted = true;
          const assessment = await Assessment.findById(attempt.assessment);
          if (assessment) {
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
      }
    }

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

  // Allow public/invite-based attempts (user is null, req.user may be null)
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.status !== 'in-progress') {
    throw new ApiError(400, 'Attempt is already completed');
  }

  const assessment = await Assessment.findById(attempt.assessment);

  // Route Big5 and DISC assessments to their specialized scoring
  if (assessment.category === 'big5') {
    return await handleBig5Submit(req, res, attempt, assessment);
  }
  if (assessment.category === 'disc') {
    return await handleDiscSubmit(req, res, attempt, assessment);
  }

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

  // Deduct test slot from assessment's unlock pool (completed = always counts)
  // For invite-based attempts (isPublicAttempt=true but has invite), we also deduct
  if (!attempt.creditDeducted) {
    const shouldDeduct = !attempt.isPublicAttempt || attempt.invite;
    if (shouldDeduct) {
      attempt.creditDeducted = true;
      const orgId = attempt.organization.toString();
      
      const { User } = require('../models');
      const user = await User.findById(attempt.user);
      const isSuperAdminUser = user?.role === 'superadmin';
      
      const unlockEntry = assessment.unlockedBy?.find(
        u => u.organization.toString() === orgId
      );
      if (unlockEntry) {
        unlockEntry.testsUsed += 1;
        
        if (!isSuperAdminUser) {
          const { Organization } = require('../models');
          const organization = await Organization.findById(orgId);
          if (organization) {
            let creditCost = assessment.creditCostPerTest;
            if (creditCost == null) {
              creditCost = organization.credits?.creditCost?.[assessment.category] ?? 5;
            }
            
            organization.credits.locked = Math.max(0, (organization.credits.locked || 0) - creditCost);
            organization.credits.used += creditCost;
            
            const now = new Date();
            let remainingToTrack = creditCost;
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
          }
        }
        
        await assessment.save();
      }
    }
  }

  await attempt.save();

  // Generate report
  const report = await generateReport(attempt, assessment, dimensionScores);
  attempt.report = report._id;
  await attempt.save();

  // Update invite status if this was an invite-based attempt
  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, {
      status: 'completed'
    });
  }

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

  // Allow public/invite-based attempts (user is null, req.user may be null)
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString()) {
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

  // Resolve who conducted the assessment
  let conductedBy = attempt.user; // default: the user themselves
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
    type: assessment.category === 'psychometric' ? 'psychometric' : 'standard',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
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
  const total = Object.values(dimensionScores).reduce((sum, d) => sum + (d.score || 0), 0) || 1;
  return {
    D: {
      rawScore: dimensionScores['Dominance']?.score || 0,
      score: dimensionScores['Dominance']?.score || 0,
      percentage: Math.round(((dimensionScores['Dominance']?.score || 0) / total) * 100)
    },
    I: {
      rawScore: dimensionScores['Influence']?.score || 0,
      score: dimensionScores['Influence']?.score || 0,
      percentage: Math.round(((dimensionScores['Influence']?.score || 0) / total) * 100)
    },
    S: {
      rawScore: dimensionScores['Steadiness']?.score || 0,
      score: dimensionScores['Steadiness']?.score || 0,
      percentage: Math.round(((dimensionScores['Steadiness']?.score || 0) / total) * 100)
    },
    C: {
      rawScore: dimensionScores['Compliance']?.score || 0,
      score: dimensionScores['Compliance']?.score || 0,
      percentage: Math.round(((dimensionScores['Compliance']?.score || 0) / total) * 100)
    },
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

  // Allow public/invite-based attempts (user is null, req.user may be null)
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString()) {
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

  // Check if assessment is unlocked for its organization (test slot available)
  const orgId = assessment.organization?.toString();
  if (!orgId) {
    throw new ApiError(400, 'Assessment has no associated organization.');
  }
  const unlockEntry = assessment.unlockedBy?.find(
    u => u.organization.toString() === orgId
  );

  if (!unlockEntry) {
    throw new ApiError(403, 'Assessment not unlocked. Contact the organization admin.');
  }

  const remainingTests = unlockEntry.testsAllowed - unlockEntry.testsUsed;
  if (remainingTests <= 0) {
    throw new ApiError(403, 'No test slots remaining for this assessment.');
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

/**
 * @desc    Abandon an in-progress attempt
 * @route   POST /api/attempts/:id/abandon
 * @access  Private
 */
const abandonAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id);

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.status !== 'in-progress') {
    throw new ApiError(400, 'Attempt is not in progress');
  }

  attempt.status = 'abandoned';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);

  // Apply 3-question rule
  let creditDeducted = false;
  if (!attempt.creditDeducted && !attempt.isPublicAttempt) {
    const { User } = require('../models');
    const user = await User.findById(attempt.user);
    if (user?.role !== 'superadmin') {
      const answerCount = attempt.answers.length;
      if (answerCount >= 3) {
        attempt.creditDeducted = true;
        creditDeducted = true;
        const assessment = await Assessment.findById(attempt.assessment);
        if (assessment) {
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
    }
  }

  await attempt.save();

  res.json({
    success: true,
    message: creditDeducted
      ? 'Attempt abandoned. 1 test credit was used (3+ questions answered).'
      : 'Attempt abandoned. No test credit was used (fewer than 3 questions answered).',
    data: {
      attempt,
      creditDeducted
    }
  });
});

/**
 * @desc    Start attempt via invite token
 * @route   POST /api/attempts/invite/:token/start
 * @access  Public
 */
const startInviteAttempt = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { testTakerName, testTakerEmail, testTakerPhone } = req.body;

  // Find the invite
  const invite = await TestTakerInvite.findOne({ token })
    .populate({
      path: 'assessment',
      populate: { path: 'questions' }
    });

  if (!invite) {
    throw new ApiError(404, 'Invalid or expired invite link');
  }

  if (invite.status === 'completed') {
    throw new ApiError(400, 'This assessment has already been completed');
  }

  if (invite.status === 'expired') {
    throw new ApiError(410, 'This invite has expired');
  }

  // Check expiry
  if (invite.expiresAt && new Date() > invite.expiresAt) {
    invite.status = 'expired';
    await invite.save();
    throw new ApiError(410, 'This invite has expired');
  }

  const assessment = invite.assessment;

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!assessment.isActive || !assessment.isPublished || assessment.isMuted) {
    throw new ApiError(400, 'Assessment is not available');
  }

  // Check if there's already an in-progress attempt for this invite
  if (invite.status === 'started' && invite.attempt) {
    const existingAttempt = await Attempt.findById(invite.attempt)
      .populate('assessment');

    if (existingAttempt && existingAttempt.status === 'in-progress') {
      return res.json({
        success: true,
        message: 'Resuming existing attempt',
        data: {
          attempt: existingAttempt,
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
    }
  }

  const inviteCreatedBy = await require('../models').User.findById(invite.invitedBy);
  const isSuperAdminInvite = inviteCreatedBy?.role === 'superadmin';
  
  const orgId = invite.organization?.toString();
  if (!orgId) {
    throw new ApiError(400, 'Invite has no associated organization');
  }

  if (!isSuperAdminInvite) {
    const unlockEntry = assessment.unlockedBy?.find(
      u => u.organization.toString() === orgId
    );

    if (!unlockEntry) {
      throw new ApiError(403, 'Assessment not unlocked');
    }

    const remainingTests = unlockEntry.testsAllowed - unlockEntry.testsUsed;
    if (remainingTests <= 0) {
      throw new ApiError(403, 'No test slots remaining for this assessment');
    }
  }

  // Calculate expiry time
  let expiresAt = null;
  if (assessment.timeBound.enabled) {
    expiresAt = new Date(Date.now() + assessment.timeBound.durationMinutes * 60 * 1000);
  }

  // Create attempt linked to invite
  const attempt = await Attempt.create({
    user: null,
    testTakerName: testTakerName || invite.testTakerName,
    testTakerEmail: testTakerEmail || invite.testTakerEmail,
    testTakerPhone: testTakerPhone || invite.testTakerPhone,
    invite: invite._id,
    assessment: assessment._id,
    organization: invite.organization || assessment.organization,
    isPublicAttempt: true,
    status: 'in-progress',
    expiresAt,
    timeLimit: assessment.timeBound.enabled ? assessment.timeBound.durationMinutes * 60 : 0,
    totalQuestions: assessment.questions.length,
    totalMarks: assessment.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Update invite status
  invite.status = 'started';
  invite.attempt = attempt._id;
  await invite.save();

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
 * Handle Big5 submit — delegates to Big5 scoring and report generation
 */
async function handleBig5Submit(req, res, attempt, assessment) {
  const { scoreBig5, generateNarrative, getDominantTraits, getTraitDescription } = require('../services/big5ScoringService');

  // Big5Test sends responses directly in the body: { responses: { 1: 5, 2: 3, ... } }
  let responses = {};

  if (req.body && req.body.responses && typeof req.body.responses === 'object' && Object.keys(req.body.responses).length > 0) {
    responses = req.body.responses;
  }

  // Fallback: build from saved attempt.answers
  if (Object.keys(responses).length === 0 && attempt.answers && attempt.answers.length > 0) {
    attempt.answers.forEach(answer => {
      if (answer.question) {
        const qOrder = answer.question.order || 0;
        if (answer.selectedOption !== undefined && answer.selectedOption !== null) {
          responses[qOrder] = answer.selectedOption;
        } else if (answer.ratingAnswer !== undefined && answer.ratingAnswer !== null) {
          responses[qOrder] = answer.ratingAnswer;
        }
      }
    });
  }

  // Last resort: check if Big5Test sent responses as raw body keys
  if (Object.keys(responses).length === 0 && req.body) {
    for (let i = 1; i <= 50; i++) {
      if (req.body[String(i)] !== undefined) {
        responses[i] = req.body[String(i)];
      }
    }
  }

  if (Object.keys(responses).length === 0) {
    console.log('BIG5 DEBUG - body keys:', Object.keys(req.body || {}));
    console.log('BIG5 DEBUG - body.responses:', req.body?.responses);
    console.log('BIG5 DEBUG - attempt.answers:', attempt.answers?.length);
    throw new ApiError(400, 'No responses received. Please answer all questions and try submitting again.');
  }

  const big5Results = scoreBig5(responses);

  // Update attempt with results
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.big5Results = big5Results;
  attempt.answeredQuestions = attempt.answers.length;

  // Deduct test slot
  await deductTestSlot(attempt, assessment);

  await attempt.save();

  // Resolve who conducted the assessment
  let conductedBy = attempt.user;
  if (attempt.invite) {
    const invite = await TestTakerInvite.findById(attempt.invite).select('invitedBy');
    if (invite?.invitedBy) conductedBy = invite.invitedBy;
  }

  // Generate Big5 report
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
    scores: {
      byTrait: {
        E: big5Results.E, A: big5Results.A, C: big5Results.C,
        N: big5Results.N, O: big5Results.O
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
      dominantTraits: getDominantTraits(big5Results),
      narrative: generateNarrative(big5Results)
    },
    analysis: {
      summary: generateNarrative(big5Results),
      strengths: getDominantTraits(big5Results).map(trait => getTraitDescription(trait).high),
      developmentAreas: [],
      recommendations: []
    }
  });

  attempt.report = report._id;
  await attempt.save();

  // Update invite status
  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  res.json({
    success: true,
    message: 'Big5 assessment completed successfully',
    data: { attempt, results: big5Results, report }
  });
}

/**
 * Handle DISC submit — delegates to DISC scoring and report generation
 */
async function handleDiscSubmit(req, res, attempt, assessment) {
  const { calculateDISCScores, generateNarrativeReport } = require('../services/discScoringService');

  // DiscTest sends formattedResponses as array in body
  const responses = req.body.responses;
  if (!responses || !Array.isArray(responses)) {
    throw new ApiError(400, 'Invalid DISC responses format');
  }

  const totalQuestionsCount = assessment.questions?.length || responses.length;
  const discResults = calculateDISCScores(responses, totalQuestionsCount);

  // Update attempt with results
  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.discResults = discResults;
  attempt.answeredQuestions = attempt.answers.length;

  // Deduct test slot
  await deductTestSlot(attempt, assessment);

  await attempt.save();

  // Resolve who conducted the assessment
  let conductedBy = attempt.user;
  if (attempt.invite) {
    const invite = await TestTakerInvite.findById(attempt.invite).select('invitedBy');
    if (invite?.invitedBy) conductedBy = invite.invitedBy;
  }

  // Generate DISC report
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
        D: { rawScore: discResults.rawScores.D, score: discResults.normalizedScores.D, percentage: discResults.percentages.D },
        I: { rawScore: discResults.rawScores.I, score: discResults.normalizedScores.I, percentage: discResults.percentages.I },
        S: { rawScore: discResults.rawScores.S, score: discResults.normalizedScores.S, percentage: discResults.percentages.S },
        C: { rawScore: discResults.rawScores.C, score: discResults.normalizedScores.C, percentage: discResults.percentages.C }
      },
      dominantTraits: [discResults.dominant, discResults.secondary],
      pattern: discResults.pattern
    },
    analysis: discResults.analysis
  });

  attempt.report = report._id;
  await attempt.save();

  // Update invite status
  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  res.json({
    success: true,
    message: 'DISC assessment completed successfully',
    data: { attempt, results: discResults, report }
  });
}

/**
 * Deduct test slot from unlock pool
 */
async function deductTestSlot(attempt, assessment) {
  if (attempt.creditDeducted) return;
  
  const { User } = require('../models');
  const user = await User.findById(attempt.user);
  if (user?.role === 'superadmin') {
    attempt.creditDeducted = true;
    return;
  }
  
  const shouldDeduct = !attempt.isPublicAttempt || attempt.invite;
  if (!shouldDeduct) return;

  attempt.creditDeducted = true;
  const orgId = attempt.organization?.toString();
  if (!orgId) return;

  const unlockEntry = assessment.unlockedBy?.find(
    u => u.organization.toString() === orgId
  );
  if (!unlockEntry) return;

  unlockEntry.testsUsed += 1;

  const { Organization } = require('../models');
  const organization = await Organization.findById(orgId);
  if (organization) {
    let creditCost = assessment.creditCostPerTest;
    if (creditCost == null) {
      creditCost = organization.credits?.creditCost?.[assessment.category] ?? 5;
    }
    organization.credits.locked = Math.max(0, (organization.credits.locked || 0) - creditCost);
    organization.credits.used += creditCost;
    await organization.save();
  }

  await assessment.save();
}

module.exports = {
  getAttempts,
  getAttempt,
  getPublicAttempt,
  startAttempt,
  startPublicAttempt,
  startInviteAttempt,
  saveAnswer,
  submitAttempt,
  autoSave,
  verifyPasscode,
  logProctoringEvent,
  requestReportAccess,
  abandonAttempt
};
