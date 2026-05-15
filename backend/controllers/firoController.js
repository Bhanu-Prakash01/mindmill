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
  const { assessmentId: paramAssessmentId } = req.params;
  const { responses, assessmentId: bodyAssessmentId } = req.body;
  const assessmentId = paramAssessmentId || bodyAssessmentId;
  const total = 54;
  
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // FIRO-B UI from FiroTest.jsx parses responses as an object { "1": val, "2": val... }
  if (!responses || typeof responses !== 'object') {
    throw new ApiError(400, `Invalid responses. Expected ${total} responses.`);
  }
  const responseValues = new Array(total).fill(0);
  Object.entries(responses).forEach(([order, val]) => {
    const idx = parseInt(order, 10) - 1;
    if (idx >= 0 && idx < total) {
      responseValues[idx] = val;
    }
  });

  if (responseValues.filter(v => v !== 0).length !== total) {
    throw new ApiError(400, `Invalid responses. Expected ${total} valid responses.`);
  }

  let attempt;
  if (req.user) {
    attempt = await Attempt.findOne({
      user: req.user._id,
      assessment: assessmentId,
      status: 'in-progress'
    });
  } else {
    attempt = await Attempt.findOne({
      assessment: assessmentId,
      status: 'in-progress'
    });
  }

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
    dimensions: {
      FIRO: {
        totals: firoResults.totals,
        dimensions: firoResults.dimensions
      }
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
    .populate('assessment', 'title category subCategory showResultsImmediately');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Check permissions
  if (attempt.user && req.user && attempt.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Access denied');
  }

  const category = attempt.assessment.category?.toLowerCase();
  const subCategory = attempt.assessment.subCategory?.toLowerCase();

  if (category !== 'firo' && category !== 'firo-b' && subCategory !== 'firo' && subCategory !== 'firo-b') {
    throw new ApiError(400, 'This is not a FIRO-B assessment attempt');
  }

  if (!attempt.firoResults) {
    if (attempt.dimensionScores) {
      const ds = attempt.dimensionScores;
      const eI = ds.eI?.score || 0;
      const wI = ds.wI?.score || 0;
      const eC = ds.eC?.score || 0;
      const wC = ds.wC?.score || 0;
      const eA = ds.eA?.score || 0;
      const wA = ds.wA?.score || 0;
      
      attempt.firoResults = {
        dimensions: {
          Expressed: { Inclusion: eI, Control: eC, Affection: eA },
          Wanted: { Inclusion: wI, Control: wC, Affection: wA }
        },
        totals: {
          totalExpressed: eI + eC + eA,
          totalWanted: wI + wC + wA,
          overall: (eI + eC + eA) + (wI + wC + wA)
        },
        analysis: {
          inclusion: `Your expressed inclusion need is ${eI}/9 and wanted inclusion is ${wI}/9. ${eI > wI ? 'You tend to express more inclusion than you desire from others.' : wI > eI ? 'You desire more inclusion from others than you naturally express.' : 'Your expressed and wanted inclusion needs are balanced.'}`,
          control: `Your expressed control need is ${eC}/9 and wanted control is ${wC}/9. ${eC > wC ? 'You take charge more than you prefer to be controlled.' : wC > eC ? 'You prefer to be led more than you take charge.' : 'Your control needs are balanced.'}`,
          affection: `Your expressed affection need is ${eA}/9 and wanted affection is ${wA}/9. ${eA > wA ? 'You express more warmth than you seek in return.' : wA > eA ? 'You seek more warmth than you naturally express.' : 'Your affection needs are balanced.'}`,
          leadership: 'Your interpersonal needs shape your leadership style in unique ways.',
          summary: `Overall, your FIRO-B profile shows total expressed: ${eI + eC + eA}/27 and total wanted: ${wI + wC + wA}/27. This indicates your fundamental interpersonal orientation.`
        }
      };
    } else {
      throw new ApiError(400, 'FIRO-B results not available for this attempt');
    }
  }

  // Render static interpretive content based on dimension matrix limits
  const { dimensions, totals } = attempt.firoResults;
  
  let report = attempt.report;
  if (!report) {
    report = await Report.findOne({ attempt: attempt._id });
  } else if (typeof report === 'string' || report instanceof mongoose.Types.ObjectId) {
    report = await Report.findById(report);
  }

  let analysis = report?.analysis || attempt.firoResults?.analysis;

    const staticData = getFIROStaticData(attempt.firoResults);
    const name = attempt.testTakerName || 'the candidate';
    
    const toParas = (text) => (text || '').split(/\n\n+/).map(s => `<p>${s.trim()}</p>`).join('');

    analysis = {
      ...staticData,
      coverSummary: `${name} presents a distinct FIRO-B interpersonal profile that provides essential clues to their preferred social environment. Their assessment maps exactly how they engage with teams across Inclusion, Control, and Affection.`,
      deepProfileHtml: toParas(`${name}'s inclusion dynamics indicate their fundamental approach to group involvement and networking. This dimension highlights whether they prefer to initiate contact and be in the center of activity or maintain a more detached, selective presence.\n\nTheir control dimension describes how they handle hierarchy, influence, and structured environments. It reveals the balance they strike between taking the reins and seeking direction from established leadership.\n\nFinally, their affection scores map their approach to building rapport and close 1-on-1 relationships. This dictates the level of emotional distance they naturally maintain in professional settings.`),
      leadershipHtml: toParas(`${name}'s leadership approach is heavily influenced by the interplay of their expressed behaviors. They lead by enacting their highest behavioral drive—whether that is bringing people together, asserting structure, or fostering interpersonal trust.\n\nUnderstanding the gap between what they express and what they want helps predict how they respond to stress. Coworkers communicating in their preferred dimension will find collaboration significantly more productive.`),
      developmentHtml: toParas(`The primary interpersonal growth opportunity for ${name} involves building awareness around any mismatch between their expressed behaviors and wanted needs. This often leads to misunderstood signals from colleagues.\n\nA deliberate focus on transparently communicating their expectations and recognizing when their internal needs are driving disproportionate reactions will enhance their leadership capacity.`),
      closingInsight: `${name}'s interpersonal profile provides an excellent blueprint for understanding their relational needs and optimizing their placement within team structures.`
    };

    if (report) {
      report.analysis = analysis;
      await report.save();
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
