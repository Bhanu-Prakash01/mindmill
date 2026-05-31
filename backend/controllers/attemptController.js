const mongoose = require('mongoose');
const { Attempt, Assessment, Question, Report, Organization, TestTakerInvite, User } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { sendTestCompletedEmail, sendTestAbandonedEmail, sendTestTakerThankYouEmail } = require('../services/emailService');
const { scoreMBTI, calculateMBTIScores, determineMBTIType, generateCognitiveFunctions, generateInterpretation } = require('../services/mbtiScoringService');

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
    .populate('assessment', 'title category subCategory difficulty timeBound')
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
    if (attempt.user && attempt.user._id && attempt.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Admin can only view attempts from their organization
  if (req.user.role === 'admin') {
    const attemptOrgId = attempt.organization?.toString?.() || attempt.organization;
    const userOrgId = req.user.organization?._id?.toString?.() || req.user.organization?.toString?.();
    if (attemptOrgId && userOrgId && attemptOrgId !== userOrgId) {
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
      select: 'title category subCategory description bannerImage timeBound instructions questions totalQuestions',
      populate: {
        path: 'questions',
        model: 'Question',
        select: 'questionText questionImage order statements options type leftTrait rightTrait dimension'
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
  // Individual users (no org) can access any active/published assessment — credit check is done below
  const isIndividual = req.user.accountType === 'individual' && !req.user.organization;
  const hasAccess = req.user.role === 'superadmin' ||
    req.user.role === 'admin' ||
    isIndividual ||
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

  if (!assessment.allowMultipleAttempts && !isIndividual) {
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

  if (!isSuperAdmin && !isIndividual) {
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

  let creditsPreDeducted = false;
  if (isIndividual) {
    const creditBalance = (req.user.personalCredits?.total || 0) - (req.user.personalCredits?.used || 0);
    const freeTrialAvailable = !req.user.freeTrialUsed;
    const effectiveCreditCost = assessment.getEffectiveCreditCost();

    if (!freeTrialAvailable && creditBalance < effectiveCreditCost) {
      throw new ApiError(403, `Insufficient credits. You need ${effectiveCreditCost} credits for this assessment. Please purchase more credits.`);
    }

    if (!freeTrialAvailable) {
      // Factor in pending credits from in-progress attempts to prevent overdraft
      const pendingAttempts = await Attempt.find({
        user: req.user._id,
        status: 'in-progress',
        creditDeducted: false
      }).populate('assessment');
      let totalPendingCost = 0;
      for (const pa of pendingAttempts) {
        totalPendingCost += pa.assessment?.getEffectiveCreditCost?.() ?? 5;
      }
      const availableAfterPending = creditBalance - totalPendingCost;
      if (availableAfterPending < effectiveCreditCost) {
        throw new ApiError(403, `Insufficient credits. You have ${creditBalance} credits but ${totalPendingCost} are reserved for assessments in progress. Please complete or submit those first.`);
      }

      // Pre-deduct credits at start so submit handlers don't double-deduct
      req.user.personalCredits.used = (req.user.personalCredits.used || 0) + effectiveCreditCost;
      await req.user.save();
      creditsPreDeducted = true;
    }
  }

  // Calculate expiry time
  let expiresAt = null;
  if (assessment.timeBound.enabled) {
    expiresAt = new Date(Date.now() + assessment.timeBound.durationMinutes * 60 * 1000);
  }

  // Create attempt
  let orgId = req.user.organization?._id || null;
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
  // Individual users: orgId remains null — Attempt.organization is now optional

  const attempt = await Attempt.create({
    user: req.user._id,
    assessment: assessmentId,
    organization: orgId,  // null for individual users
    status: 'in-progress',
    expiresAt,
    timeLimit: assessment.timeBound.enabled ? assessment.timeBound.durationMinutes * 60 : 0,
    totalQuestions: assessment.questions.length,
    totalMarks: assessment.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    creditDeducted: creditsPreDeducted  // pre-deducted for non-free-trial individual users
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
        _id: q._id,
        id: q._id,
        type: q.type,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: assessment.randomizeOptions ? [...q.options].sort(() => Math.random() - 0.5) : q.options,
        statements: q.statements || [],
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
  const attemptId = req.params.id;

  const attempt = await Attempt.findById(attemptId)
    .select('status user userAgent ipAddress expiresAt timeLimit assessment organization isPublicAttempt creditDeducted')
    .populate({
      path: 'assessment',
      populate: { path: 'questions', select: '_id order' }
    });

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Resolve actual question ObjectId from order number if needed
  let actualQuestionId = questionId;
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    const questionOrder = parseInt(questionId, 10);
    if (!isNaN(questionOrder) && attempt.assessment?.questions) {
      const question = attempt.assessment.questions.find(q => q.order === questionOrder);
      if (question) {
        actualQuestionId = question._id.toString();
      }
    }
    if (!actualQuestionId || actualQuestionId === questionId) {
      console.error('Question lookup failed:', { questionId, questionOrder, questions: attempt.assessment?.questions });
      throw new ApiError(400, 'Invalid question ID');
    }
  }

  // Allow public/invite-based attempts
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
        const fullAttempt = await Attempt.findById(attemptId).select('answers');
        if (fullAttempt.answers.length >= 3) {
          attempt.creditDeducted = true;
          const assessment = await Assessment.findById(attempt.assessment);
          if (assessment) {
            const isIndividualUser = user?.accountType === 'individual' && !user?.organization;
            if (isIndividualUser) {
              if (!user.freeTrialUsed) {
                user.freeTrialUsed = true;
                user.freeTrialAssessmentId = attempt.assessment;
                user.freeTrialAttemptId = attempt._id;
              } else {
                const creditCost = assessment.getEffectiveCreditCost();
                user.personalCredits.used = (user.personalCredits.used || 0) + creditCost;
              }
              await user.save();
            } else {
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
    }

    // Refund: pre-deducted individual user who expired early (< 3 answers)
    if (attempt.creditDeducted && !attempt.isPublicAttempt) {
      const fullAttempt = await Attempt.findById(attemptId).select('answers');
      if (fullAttempt.answers.length < 3) {
        const { User } = require('../models');
        const user = await User.findById(attempt.user);
        if (user?.accountType === 'individual' && !user?.organization && user.freeTrialUsed) {
          const assessment = await Assessment.findById(attempt.assessment);
          if (assessment) {
            const creditCost = assessment.getEffectiveCreditCost();
            user.personalCredits.used = Math.max(0, (user.personalCredits.used || 0) - creditCost);
            await user.save();
            attempt.creditDeducted = false;
          }
        }
      }
    }

    await attempt.save();
    throw new ApiError(400, 'Attempt has expired');
  }

  const answerData = {
    question: actualQuestionId,
    selectedOption: selectedOption !== undefined ? selectedOption : null,
    textAnswer: textAnswer || '',
    ratingAnswer: ratingAnswer !== undefined ? ratingAnswer : null,
    timeSpent: timeSpent || 0,
    answeredAt: new Date()
  };

  // Try to update existing answer using MongoDB atomic operator
  const updateResult = await Attempt.updateOne(
    { _id: attemptId, 'answers.question': actualQuestionId },
    { $set: { 'answers.$': answerData } }
  );

  // If answer wasn't updated, it doesn't exist yet, so push it
  if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
    await Attempt.updateOne(
      { _id: attemptId },
      { $push: { answers: answerData } }
    );
  }

  res.json({
    success: true,
    message: 'Answer saved successfully',
    data: { attempt: { _id: attemptId } }
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

const assessment = await Assessment.findById(attempt.assessment).populate('questions');

  const assessCategory = (assessment.category || '').toLowerCase();
  const assessSubCategory = (assessment.subCategory || '').toLowerCase();
  const isDiscAssessment = assessSubCategory === 'disc' || assessCategory === 'disc' || assessCategory === 'personality' || assessment.reportConfig?.type === 'auto-psychometric';
  
  if (assessSubCategory === 'big5' || assessCategory === 'big5') {
    return await handleBig5Submit(req, res, attempt, assessment);
  }
  
  if (isDiscAssessment && assessment.questions && assessment.questions.some(q => q.type === 'disc-ranking')) {
    return await handleDiscSubmit(req, res, attempt, assessment);
  }
  
  if (assessSubCategory === 'mbti' || assessCategory === 'mbti') {
    return await handleMbtiSubmit(req, res, attempt, assessment);
  }
  
  if (assessSubCategory === 'hogan' || assessCategory === 'hogan') {
    return await handleHoganSubmit(req, res, attempt, assessment);
  }
  
  if (assessSubCategory === 'firo' || assessSubCategory === 'firo-b' || assessCategory === 'firo' || assessCategory === 'firo-b') {
    return await handleFiroSubmit(req, res, attempt, assessment);
  }

  if (assessSubCategory === 'sjt' || assessSubCategory === 'situational judgement' || assessCategory === 'sjt') {
    return await handleSjtSubmit(req, res, attempt, assessment);
  }

  if (assessSubCategory === 'pcla' || assessSubCategory === 'coachability' || assessCategory === 'pcla') {
    return await handlePclaSubmit(req, res, attempt, assessment);
  }

  if (assessSubCategory === 'ecti' || assessCategory === 'ecti') {
    return await handleEctiSubmit(req, res, attempt, assessment);
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
      const dim = question.dimension.toLowerCase().trim();
      if (!dimensionScores[dim]) {
        dimensionScores[dim] = { score: 0, count: 0 };
      }
      dimensionScores[dim].score += answer.marksObtained;
      dimensionScores[dim].count += 1;
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

  // Deduct test slot / credits on completion
  if (!attempt.creditDeducted) {
    const shouldDeduct = !attempt.isPublicAttempt || attempt.invite;
    if (shouldDeduct) {
      attempt.creditDeducted = true;

      const { User } = require('../models');
      const user = await User.findById(attempt.user);
      const isSuperAdminUser = user?.role === 'superadmin';
      const isIndividualUser = user?.accountType === 'individual' && !user?.organization;

      if (isIndividualUser) {
        // Individual: use free trial (any assessment) or deduct personalCredits
        if (!user.freeTrialUsed) {
          user.freeTrialUsed = true;
          user.freeTrialAssessmentId = attempt.assessment;
          user.freeTrialAttemptId = attempt._id;
        } else {
          const creditCost = assessment.getEffectiveCreditCost();
          user.personalCredits.used = (user.personalCredits.used || 0) + creditCost;
        }
        await user.save();
      } else if (!isSuperAdminUser) {
        const orgId = attempt.organization?.toString();
        if (!orgId) return; // safety guard — no org, skip credit deduction
        const unlockEntry = assessment.unlockedBy?.find(
          u => u.organization.toString() === orgId
        );
        if (unlockEntry) {
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
          await assessment.save();
        }
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

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

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
  const attemptId = req.params.id;

  const attempt = await Attempt.findById(attemptId).select('status user');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (attempt.status !== 'in-progress') {
    throw new ApiError(400, 'Attempt is not in progress');
  }

  // Process all submitted answers in autoSave via atomic arrays
  const bulkOperations = answers.map(answerData => {
    const data = {
      question: answerData.questionId,
      selectedOption: answerData.selectedOption !== undefined ? answerData.selectedOption : null,
      textAnswer: answerData.textAnswer || '',
      ratingAnswer: answerData.ratingAnswer !== undefined ? answerData.ratingAnswer : null,
      answeredAt: new Date()
    };
    
    // We update via a fallback logic or simply use full doc saving since bulk is heavy
    // Let's just fallback to atomic operation loops for safe scaling
    return [
      {
        updateOne: {
          filter: { _id: attemptId, 'answers.question': answerData.questionId },
          update: { $set: { 'answers.$': data } }
        }
      },
      {
        updateOne: {
          filter: { _id: attemptId, 'answers.question': { $ne: answerData.questionId } },
          update: { $push: { answers: data } }
        }
      }
    ];
  }).flat();
  
  if (bulkOperations.length > 0) {
    // Execute all at once to keep it atomic 
    try {
      await Attempt.bulkWrite(bulkOperations, { ordered: false });
    } catch(e) { } // Bulk push might fail on duplicate, that's perfectly fine
  }

  if (timeSpent) {
    await Attempt.updateOne({ _id: attemptId }, { $set: { timeSpent } });
  }

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
    timeSpent: attempt.timeSpent || null,
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
  const attemptId = req.params.id;
  
  const attempt = await Attempt.findById(attemptId).select('status user');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  const logEntry = {
    event,
    details,
    timestamp: new Date()
  };

  const updateDoc = {
    $push: { proctoringLogs: logEntry }
  };

  if (event === 'tab_switch') {
    updateDoc.$inc = { ...updateDoc.$inc, tabSwitchCount: 1 };
  }
  if (event === 'fullscreen_exit') {
    updateDoc.$inc = { ...updateDoc.$inc, fullscreenExits: 1 };
  }

  await Attempt.updateOne({ _id: attemptId }, updateDoc);

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
        bannerImage: assessment.bannerImage,
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
          const isIndividualUser = user?.accountType === 'individual' && !user?.organization;
          if (isIndividualUser) {
            if (!user.freeTrialUsed) {
              user.freeTrialUsed = true;
              user.freeTrialAssessmentId = attempt.assessment;
              user.freeTrialAttemptId = attempt._id;
            } else {
              const creditCost = assessment.getEffectiveCreditCost();
              user.personalCredits.used = (user.personalCredits.used || 0) + creditCost;
            }
            await user.save();
          } else {
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
  }

  // Refund: pre-deducted individual user who abandoned early (< 3 answers)
  if (attempt.creditDeducted && !attempt.isPublicAttempt) {
    const answerCount = attempt.answers.length;
    if (answerCount < 3) {
      const { User } = require('../models');
      const user = await User.findById(attempt.user);
      if (user?.accountType === 'individual' && !user?.organization && user.freeTrialUsed) {
        const assessment = await Assessment.findById(attempt.assessment);
        if (assessment) {
          const creditCost = assessment.getEffectiveCreditCost();
          user.personalCredits.used = Math.max(0, (user.personalCredits.used || 0) - creditCost);
          await user.save();
          attempt.creditDeducted = false;
        }
      }
    }
  }

  await attempt.save();

  // Notify inviter (non-blocking)
  if (attempt.invite) {
    Assessment.findById(attempt.assessment).select('title questions').lean().then(assessment => {
      sendAttemptNotification(attempt, assessment, 'abandoned');
    }).catch(err => {
      console.error('Failed to load assessment for abandon notification:', err.message);
    });
  }

  const finalCreditState = attempt.creditDeducted && !attempt.isPublicAttempt;
  res.json({
    success: true,
    message: finalCreditState
      ? 'Attempt abandoned. Credits were deducted (3+ questions answered).'
      : 'Attempt abandoned. No credit was deducted (fewer than 3 questions answered).',
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
      populate: { path: 'questions', options: { sort: { order: 1 } } }
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
        bannerImage: assessment.bannerImage,
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
    timeSpent: attempt.timeSpent || null,
    scores: {
      byTrait: {
        E: big5Results.E, A: big5Results.A, C: big5Results.C,
        N: big5Results.N, O: big5Results.O
      }
    },
    dimensions: {
      BigFive: {
        extraversion: big5Results.E.percent,
        agreeableness: big5Results.A.percent,
        conscientiousness: big5Results.C.percent,
        neuroticism: big5Results.N.percent,
        openness: big5Results.O.percent
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

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

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
  
  if (responses === undefined || responses === null) {
    throw new ApiError(400, 'DISC responses are required. Expected format: { responses: [{ questionId, answers: [{ trait, score, type }] }] }');
  }
  
  if (!Array.isArray(responses)) {
    throw new ApiError(400, `Invalid DISC responses format. Expected array, got ${typeof responses}`);
  }
  
  if (responses.length === 0) {
    throw new ApiError(400, 'No DISC responses provided. Please answer all questions before submitting.');
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

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

  res.json({
    success: true,
    message: 'DISC assessment completed successfully',
    data: { attempt, results: discResults, report }
  });
}

/**
 * Handle MBTI submit — delegates to MBTI scoring and report generation
 */
async function handleMbtiSubmit(req, res, attempt, assessment) {
  let responses = {};

  if (req.body && req.body.responses && typeof req.body.responses === 'object' && Object.keys(req.body.responses).length > 0) {
    responses = req.body.responses;
  }

  if (Object.keys(responses).length === 0 && attempt.answers && attempt.answers.length > 0) {
    attempt.answers.forEach(answer => {
      if (answer.question) {
        const qOrder = answer.question.order || 0;
        if (answer.ratingAnswer !== undefined && answer.ratingAnswer !== null) {
          responses[qOrder] = answer.ratingAnswer;
        } else if (answer.selectedOption !== undefined && answer.selectedOption !== null) {
          responses[qOrder] = answer.selectedOption;
        }
      }
    });
  }

  if (!responses || Object.keys(responses).length === 0) {
    throw new ApiError(400, 'Invalid MBTI responses format');
  }

  const totalQuestionsCount = assessment.questions?.length || Object.keys(responses).length;
  const mbtiResults = scoreMBTI(responses);

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.mbtiResults = mbtiResults;
  attempt.answeredQuestions = totalQuestionsCount;

  await deductTestSlot(attempt, assessment);
  await attempt.save();

  let conductedBy = attempt.user;
  if (attempt.invite) {
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

  attempt.report = report._id;
  await attempt.save();

  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

  res.json({
    success: true,
    message: 'MBTI assessment completed successfully',
    data: { attempt, results: mbtiResults, report }
  });
}

async function handleHoganSubmit(req, res, attempt, assessment) {
  const { scoreHogan } = require('../services/hoganScoringService');

  let responses = {};
  if (req.body && req.body.responses && typeof req.body.responses === 'object') {
    responses = req.body.responses;
  }

  if (Object.keys(responses).length === 0 && attempt.answers && attempt.answers.length > 0) {
    attempt.answers.forEach(answer => {
      if (answer.question) {
        const qOrder = answer.question.order || 0;
        responses[qOrder] = answer.ratingAnswer || answer.selectedOption;
      }
    });
  }

  if (!responses || Object.keys(responses).length === 0) {
    throw new ApiError(400, 'Invalid Hogan responses format');
  }

  const responseKeys = Object.keys(responses);
  const totalQuestionsCount = assessment.questions?.length || 50;

  if (responseKeys.length < totalQuestionsCount * 0.67) {
    throw new ApiError(400, 'Please answer at least 67% of questions');
  }

  const hoganResults = scoreHogan(responses);
  if (!hoganResults.success) {
    throw new ApiError(400, hoganResults.error || 'Failed to score Hogan assessment');
  }

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.hoganResults = hoganResults.results;
  attempt.answeredQuestions = responseKeys.length;

  await deductTestSlot(attempt, assessment);
  await attempt.save();

  let conductedBy = attempt.user;
  if (attempt.invite) {
    const invite = await TestTakerInvite.findById(attempt.invite).select('invitedBy');
    if (invite?.invitedBy) conductedBy = invite.invitedBy;
  }

  const report = await Report.create({
    attempt: attempt._id,
    user: attempt.user,
    conductedBy,
    assessment: attempt.assessment,
    organization: attempt.organization,
    type: 'hogan',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    scores: hoganResults.results,
    analysis: {
      summary: hoganResults.results?.description || 'Hogan Personality Assessment completed'
    }
  });

  attempt.report = report._id;
  await attempt.save();

  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

  res.json({
    success: true,
    message: 'Hogan assessment completed successfully',
    data: { attempt, results: hoganResults.results, report }
  });
}

async function handleFiroSubmit(req, res, attempt, assessment) {
  const { calculateFiroScores } = require('../services/firoScoringService');

  let responses = [];
  if (req.body && req.body.responses && typeof req.body.responses === 'object') {
    // Convert object {1: 3, 2: 5} to array [null, 3, 5, ...]
    const respObj = req.body.responses;
    const maxOrder = Math.max(...Object.keys(respObj).map(Number), 0);
    responses = new Array(maxOrder + 1).fill(0);
    Object.entries(respObj).forEach(([order, val]) => {
      responses[parseInt(order, 10)] = val;
    });
  }

  if ((!responses || responses.length === 0) && attempt.answers && attempt.answers.length > 0) {
    // Need to populate questions to get their order
    const attemptWithQuestions = await Attempt.findById(attempt._id)
      .populate({
        path: 'answers.question',
        select: 'order'
      });
    
    if (attemptWithQuestions?.answers) {
      responses = new Array(54).fill(0);
      attemptWithQuestions.answers.forEach(answer => {
        if (answer.question && answer.question.order) {
          responses[answer.question.order] = answer.selectedOption || 0;
        }
      });
    }
  }

  if (!responses || responses.length === 0 || responses.every(v => !v || v === 0)) {
    throw new ApiError(400, 'No FIRO responses found. Please complete the assessment first.');
  }

  const firoResults = calculateFiroScores(responses);

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.firoResults = firoResults;
  attempt.answeredQuestions = Object.keys(responses).length;

  await deductTestSlot(attempt, assessment);
  await attempt.save();

  let conductedBy = attempt.user;
  if (attempt.invite) {
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
    scores: {
      total: firoResults.totals?.overallTotal || 0,
      maxScore: 54,
      percentage: firoResults.totals?.overallTotal ? Math.round((firoResults.totals.overallTotal / 54) * 100) : 0
    },
    dimensions: {
      FIRO: {
        dimensions: firoResults.dimensions,
        totals: firoResults.totals
      }
    },
    analysis: {
      summary: 'FIRO-B Assessment completed'
    }
  });

  attempt.report = report._id;
  await attempt.save();

  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

  res.json({
    success: true,
    message: 'FIRO-B assessment completed successfully',
    data: { attempt, results: firoResults, report }
  });
}

// ─────────────────────────────────────────────────────────────
// SJT — Executive Situational Judgement Index
// ─────────────────────────────────────────────────────────────
async function handleSjtSubmit(req, res, attempt, assessment) {
  const { scoreSJT } = require('../services/sjtScoringService');
  const { SJT_QUESTIONS } = require('../seeders/sjtQuestions');

  // Build responses map: { "Q1": "A", ... } from req.body.responses
  // Frontend sends { questionId: selectedIndex } for MCQ
  // We also support { order: optionKey } and attempt.answers fallback
  let responses = {};

  if (req.body && req.body.responses && typeof req.body.responses === 'object') {
    responses = req.body.responses;
  }

  // Fallback: reconstruct from saved answers on the attempt
  if (!Object.keys(responses).length && attempt.answers && attempt.answers.length > 0) {
    const attemptWithQ = await Attempt.findById(attempt._id).populate({
      path: 'answers.question',
      select: 'order options'
    });
    if (attemptWithQ?.answers) {
      for (const ans of attemptWithQ.answers) {
        if (!ans.question) continue;
        const order = ans.question.order;
        const optionIndex = ans.selectedOption;
        const optKeys = ['A', 'B', 'C', 'D'];
        if (optionIndex != null && optKeys[optionIndex]) {
          responses[`Q${order}`] = optKeys[optionIndex];
        }
      }
    }
  }

  // Use the seeded question bank (weights are embedded)
  // If questions are populated on the assessment, prefer them;
  // otherwise fall back to SJT_QUESTIONS seeder for weights.
  const questionBank = SJT_QUESTIONS;

  const sjtResults = scoreSJT(responses, questionBank);

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.sjtResults = sjtResults;
  attempt.score = sjtResults.rawScore;
  attempt.totalMarks = sjtResults.maxRaw;
  attempt.percentage = sjtResults.situationalIndex;
  attempt.answeredQuestions = Object.keys(responses).length;

  await deductTestSlot(attempt, assessment);
  await attempt.save();

  let conductedBy = attempt.user;
  if (attempt.invite) {
    const invite = await TestTakerInvite.findById(attempt.invite).select('invitedBy');
    if (invite?.invitedBy) conductedBy = invite.invitedBy;
  }

  const report = await Report.create({
    attempt: attempt._id,
    user: attempt.user,
    conductedBy,
    assessment: attempt.assessment,
    organization: attempt.organization,
    type: 'sjt',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    scores: {
      total: sjtResults.rawScore,
      maxScore: sjtResults.maxRaw,
      percentage: sjtResults.situationalIndex,
      percentile: sjtResults.percentile,
    },
    analysis: {
      summary: sjtResults.summary,
      personalityProfile: sjtResults.band,
      strengths: sjtResults.strongestDimension ? [sjtResults.strongestDimension] : [],
    }
  });

  attempt.report = report._id;
  await attempt.save();

  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

  res.json({
    success: true,
    message: 'Situational Judgement Assessment completed successfully',
    data: { attempt, results: sjtResults, report }
  });
}

async function handlePclaSubmit(req, res, attempt, assessment) {
  const { scorePCLA } = require('../services/pclaScoringService');
  const { PCLA_QUESTIONS } = require('../seeders/pclaQuestions');

  // Build responses map: { "Q1": "A", ... } from req.body.responses
  let responses = {};

  if (req.body && req.body.responses && typeof req.body.responses === 'object') {
    responses = req.body.responses;
  }

  // Fallback: reconstruct from saved answers on the attempt
  if (!Object.keys(responses).length && attempt.answers && attempt.answers.length > 0) {
    const attemptWithQ = await Attempt.findById(attempt._id).populate({
      path: 'answers.question',
      select: 'order options'
    });
    if (attemptWithQ?.answers) {
      for (const ans of attemptWithQ.answers) {
        if (!ans.question) continue;
        const order = ans.question.order;
        const optionIndex = ans.selectedOption;
        const optKeys = ['A', 'B', 'C', 'D'];
        if (optionIndex != null && optKeys[optionIndex]) {
          responses[`Q${order}`] = optKeys[optionIndex];
        }
      }
    }
  }

  // Guard: prevent saving all-zero results when no responses were provided
  if (!Object.keys(responses).length) {
    throw new ApiError(400, 'Cannot submit PCLA assessment with no answers. Please answer at least one question.');
  }

  const questionBank = PCLA_QUESTIONS;
  const pclaResults = scorePCLA(responses, questionBank);

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.sjtResults = pclaResults; // reuse sjtResults field (Mixed type) for PCLA
  attempt.score = pclaResults.rawScore;
  attempt.totalMarks = pclaResults.maxRaw;
  attempt.percentage = pclaResults.coachabilityIndex;
  attempt.answeredQuestions = Object.keys(responses).length;

  await deductTestSlot(attempt, assessment);
  await attempt.save();

  let conductedBy = attempt.user;
  if (attempt.invite) {
    const invite = await TestTakerInvite.findById(attempt.invite).select('invitedBy');
    if (invite?.invitedBy) conductedBy = invite.invitedBy;
  }

  const report = await Report.create({
    attempt: attempt._id,
    user: attempt.user,
    conductedBy,
    assessment: attempt.assessment,
    organization: attempt.organization,
    type: 'pcla',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    scores: {
      total: pclaResults.rawScore,
      maxScore: pclaResults.maxRaw,
      percentage: pclaResults.coachabilityIndex,
      percentile: pclaResults.percentile,
    },
    analysis: {
      summary: pclaResults.summary,
      personalityProfile: pclaResults.band,
      strengths: pclaResults.greenFlags || [],
    }
  });

  attempt.report = report._id;
  await attempt.save();

  if (attempt.invite) {
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

  res.json({
    success: true,
    message: 'Coachability Assessment completed successfully',
    data: { attempt, results: pclaResults, report }
  });
}

async function handleEctiSubmit(req, res, attempt, assessment) {
  const { scoreECTI } = require('../services/ectiScoringService');
  const { ECTI_QUESTIONS } = require('../seeders/ectiQuestions');

  // Build responses map: { "Q1": "A", ... } from req.body.responses
  let responses = {};

  if (req.body && req.body.responses && typeof req.body.responses === 'object') {
    responses = req.body.responses;
  }

  // Fallback: reconstruct from saved answers on the attempt
  if (!Object.keys(responses).length && attempt.answers && attempt.answers.length > 0) {
    const attemptWithQ = await Attempt.findById(attempt._id).populate({
      path: 'answers.question',
      select: 'order options'
    });
    if (attemptWithQ?.answers) {
      for (const ans of attemptWithQ.answers) {
        if (!ans.question) continue;
        const order = ans.question.order;
        const optionIndex = ans.selectedOption;
        const optKeys = ['A', 'B', 'C', 'D'];
        if (optionIndex != null && optKeys[optionIndex]) {
          responses[`Q${order}`] = optKeys[optionIndex];
        }
      }
    }
  }

  const questionBank = ECTI_QUESTIONS;
  const ectiResults = scoreECTI(responses, questionBank);

  attempt.status = 'completed';
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
  attempt.ectiResults = ectiResults;
  attempt.score = ectiResults.rawScore;
  attempt.totalMarks = ectiResults.maxRaw;
  attempt.percentage = ectiResults.percentage;
  attempt.answeredQuestions = Object.keys(responses).length;

  await deductTestSlot(attempt, assessment);
  await attempt.save();

  let conductedBy = attempt.user;
  if (attempt.invite) {
    const { TestTakerInvite } = require('../models');
    const invite = await TestTakerInvite.findById(attempt.invite).select('invitedBy');
    if (invite?.invitedBy) conductedBy = invite.invitedBy;
  }

  const { Report } = require('../models');
  const report = await Report.create({
    attempt: attempt._id,
    user: attempt.user,
    conductedBy,
    assessment: attempt.assessment,
    organization: attempt.organization,
    type: 'ecti',
    testTakerName: attempt.testTakerName || null,
    testTakerEmail: attempt.testTakerEmail || null,
    testTakerPhone: attempt.testTakerPhone || null,
    timeSpent: attempt.timeSpent || null,
    scores: {
      total: ectiResults.rawScore,
      maxScore: ectiResults.maxRaw,
      percentage: ectiResults.percentage,
      percentile: ectiResults.percentile,
    },
    analysis: {
      summary: ectiResults.summary,
      personalityProfile: ectiResults.band,
      strengths: []
    }
  });

  attempt.report = report._id;
  await attempt.save();

  if (attempt.invite) {
    const { TestTakerInvite } = require('../models');
    await TestTakerInvite.findByIdAndUpdate(attempt.invite, { status: 'completed' });
  }

  // Notify inviter (non-blocking)
  sendAttemptNotification(attempt, assessment, 'completed');

  res.json({
    success: true,
    message: 'ECTI Assessment completed successfully',
    data: { attempt, results: ectiResults, report }
  });
}

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

/**
 * Send email notifications when an attempt is completed or abandoned.
 * Non-blocking — errors are logged and swallowed.
 */
async function sendAttemptNotification(attempt, assessment, status) {
  try {
    const testTakerName = attempt.testTakerName || 'Test Taker';
    const assessmentTitle = assessment?.title || 'Assessment';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 1. Send Thank You Email to the test taker (if completed and email is available)
    if (status === 'completed') {
      let takerEmail = attempt.testTakerEmail;
      
      // If no explicit testTakerEmail but there's a user attached, try to get their email
      if (!takerEmail && attempt.user) {
        const user = await User.findById(attempt.user).select('email').lean();
        if (user && user.email) {
          takerEmail = user.email;
        }
      }

      // If no email yet, maybe it's in the invite
      if (!takerEmail && attempt.invite) {
        const inviteForTaker = await TestTakerInvite.findById(attempt.invite).select('testTakerEmail').lean();
        if (inviteForTaker && inviteForTaker.testTakerEmail) {
          takerEmail = inviteForTaker.testTakerEmail;
        }
      }

      if (takerEmail) {
        sendTestTakerThankYouEmail({
          to: takerEmail,
          testTakerName,
          assessmentTitle,
          organizationName: 'MindMil'
        }).catch(err => console.error('Failed to send thank you email:', err.message));
      }
    }

    // 2. Send notification to the inviter (if it was an invite-based attempt)
    if (attempt.invite) {
      const invite = await TestTakerInvite.findById(attempt.invite)
        .populate('invitedBy', 'email')
        .lean();

      if (invite?.invitedBy?.email) {
        const recipientEmail = invite.invitedBy.email;
        const inviterTestTakerName = attempt.testTakerName || invite.testTakerName || 'Test Taker';

        if (status === 'completed') {
          const reportUrl = attempt.report
            ? `${frontendUrl}/reports/${attempt.report}`
            : `${frontendUrl}/assessments/${attempt.assessment}`;

          await sendTestCompletedEmail({
            to: recipientEmail,
            testTakerName: inviterTestTakerName,
            assessmentTitle,
            organizationName: 'MindMil',
            reportUrl,
            percentage: attempt.percentage,
            passed: attempt.passed
          });
        } else if (status === 'abandoned') {
          await sendTestAbandonedEmail({
            to: recipientEmail,
            testTakerName: inviterTestTakerName,
            assessmentTitle,
            organizationName: 'MindMil',
            questionsAnswered: attempt.answers?.length || 0,
            totalQuestions: assessment?.questions?.length || 0
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to send attempt notification:', err.message);
  }
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
  abandonAttempt,
  sendAttemptNotification
};
