const { Attempt } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const PDFService = require('../services/pdfService');

/**
 * @desc    Get simple score results for assessment attempt
 * @route   GET /api/attempts/:id/simple-results
 * @access  Private
 */
const getSimpleResults = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id)
    .populate('assessment')
    .populate({
      path: 'answers.question',
      model: 'Question'
    })
    .populate('user', 'firstName lastName email');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Check access permissions
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    if (attempt.user && attempt.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (attempt.status !== 'completed') {
    throw new ApiError(400, 'Assessment must be completed first');
  }

  const assessment = attempt.assessment;
  const { totalScore, maxScore, breakdown, passed } = calculateScore(attempt, assessment);

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Format time spent
  const timeSpentSeconds = attempt.timeSpent || 0;
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeSpentFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Get test taker info
  const testTaker = attempt.user
    ? {
        name: `${attempt.user.firstName} ${attempt.user.lastName}`,
        email: attempt.user.email
      }
    : {
        name: attempt.testTakerName || 'Unknown',
        email: attempt.testTakerEmail || 'N/A'
      };

  res.json({
    success: true,
    data: {
      totalScore,
      maxScore,
      percentage,
      passed,
      breakdown,
      testTaker,
      reportId: attempt.report,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        category: assessment.category,
        subCategory: assessment.subCategory
      },
      timeSpent: timeSpentFormatted,
      timeSpentSeconds: timeSpentSeconds,
      completedAt: attempt.completedAt
    }
  });
});

/**
 * @desc    Download simple PDF report
 * @route   GET /api/attempts/:id/simple-report/download
 * @access  Private
 */
const downloadSimpleReport = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id)
    .populate('assessment')
    .populate({
      path: 'answers.question',
      model: 'Question'
    })
    .populate('user', 'firstName lastName email');

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found');
  }

  // Check access permissions
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    if (attempt.user && attempt.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (attempt.status !== 'completed') {
    throw new ApiError(400, 'Assessment must be completed first');
  }

  const assessment = attempt.assessment;
  const { totalScore, maxScore, breakdown, passed } = calculateScore(attempt, assessment);

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Format time spent
  const timeSpentSeconds = attempt.timeSpent || 0;
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeSpentFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Get test taker info
  const testTaker = attempt.user
    ? {
        name: `${attempt.user.firstName} ${attempt.user.lastName}`,
        email: attempt.user.email
      }
    : {
        name: attempt.testTakerName || 'Unknown',
        email: attempt.testTakerEmail || 'N/A'
      };

  // Generate PDF HTML
  const html = generateSimpleReportHtml({
    testTaker,
    assessment,
    totalScore,
    maxScore,
    percentage,
    passed,
    breakdown,
    timeSpent: timeSpentFormatted,
    completedAt: attempt.completedAt
  });

  // Generate PDF using PDFService
  let pdfBuffer;
  try {
    pdfBuffer = await PDFService.generatePdfFromHtml(html);
  } catch (pdfError) {
    console.error('PDF generation error:', pdfError);
    throw new ApiError(500, 'Failed to generate PDF report');
  }

  // Set response headers for PDF download
  const filename = `score-report-${assessment.title.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
});

/**
 * Calculate score based on assessment type
 */
function calculateScore(attempt, assessment) {
  const answers = attempt.answers || [];
  const category = assessment.category;
  const subCategory = assessment.subCategory;

  let totalScore = 0;
  let maxScore = 0;
  const breakdown = {};

  // Situational Judgement (ESJI): category = 'situational'
  if (category === 'situational' || (subCategory || '').toLowerCase() === 'situational judgement') {
    // Use stored SJT results from the scoring service if available
    if (attempt.sjtResults && attempt.sjtResults.situationalIndex !== undefined) {
      const r = attempt.sjtResults;
      const situationalIndex = r.situationalIndex;
      totalScore = r.rawScore || 0;
      maxScore = r.maxRaw || 160;

      breakdown.type = 'Situational Judgement';
      breakdown.total = situationalIndex;
      breakdown.maxScore = 100;
      breakdown.situationalIndex = situationalIndex;
      breakdown.band = r.band;
      breakdown.grade = r.grade;
      breakdown.promotionReadiness = r.promotionReadiness;
      breakdown.bandDescription = r.bandDescription;
      breakdown.strongestDimension = r.strongestDimension;
      breakdown.weakestDimension = r.weakestDimension;
      breakdown.summary = r.summary;
      breakdown.radar = r.radar;
      breakdown.dimensionScores = r.dimensionScores;
    } else {
      // Fallback: weighted scoring across all options
      let weightedScore = 0;
      let maxPossibleScore = 0;

      answers.forEach(answer => {
        const question = answer.question;
        if (!question || question.type !== 'mcq') return;

        const maxWeight = Math.max(...(question.options || []).map(o => o.weight || 0), 4);
        maxPossibleScore += maxWeight;

        if (answer.selectedOption === null || answer.selectedOption === undefined) return;
        const selected = (question.options || [])[answer.selectedOption];
        if (selected) weightedScore += selected.weight || 1;
      });

      const pct = maxPossibleScore > 0 ? Math.round((weightedScore / maxPossibleScore) * 100) : 0;
      totalScore = weightedScore;
      maxScore = maxPossibleScore;
      breakdown.type = 'Situational Judgement';
      breakdown.total = pct;
      breakdown.maxScore = 100;
      breakdown.situationalIndex = pct;
    }
  }
  // Cognitive Reasoning: category = 'cognitive'
  else if (category === 'cognitive' && (subCategory || '').toLowerCase() === 'cognitive ability') {
    const dimensionScores = {
      vr: { score: 0, max: 0, attempts: 0 },
      nr: { score: 0, max: 0, attempts: 0 },
      lr: { score: 0, max: 0, attempts: 0 },
      ct: { score: 0, max: 0, attempts: 0 },
      wm: { score: 0, max: 0, attempts: 0 }
    };

    let totalCorrect = 0;
    let totalAttempted = 0;

    answers.forEach(answer => {
      const question = answer.question;
      if (!question || question.type !== 'mcq') return;

      const selectedOption = answer.selectedOption;
      const rawDimension = (question.dimension || 'lr').toString().toLowerCase().trim();
      const dimension = dimensionScores[rawDimension] ? rawDimension : 'lr';
      const options = question.options || [];

      dimensionScores[dimension].max += 1;

      if (selectedOption !== null && selectedOption !== undefined) {
        totalAttempted += 1;
        dimensionScores[dimension].attempts += 1;
        const selected = options[selectedOption];
        if (selected && (selected.isCorrect === true || selected.score > 0)) {
          dimensionScores[dimension].score += 1;
          totalCorrect += 1;
        }
      }
    });

    const calcPercentage = (score, max) => max > 0 ? (score / max) * 100 : 0;
    const vrPct = calcPercentage(dimensionScores.vr.score, dimensionScores.vr.max);
    const nrPct = calcPercentage(dimensionScores.nr.score, dimensionScores.nr.max);
    const lrPct = calcPercentage(dimensionScores.lr.score, dimensionScores.lr.max);
    const ctPct = calcPercentage(dimensionScores.ct.score, dimensionScores.ct.max);
    const wmPct = calcPercentage(dimensionScores.wm.score, dimensionScores.wm.max);

    // CACS = (VR × 0.20) + (NR × 0.20) + (LR × 0.25) + (CT × 0.20) + (WM × 0.15)
    const cacs = (vrPct * 0.20) + (nrPct * 0.20) + (lrPct * 0.25) + (ctPct * 0.20) + (wmPct * 0.15);

    const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

    totalScore = cacs;
    maxScore = 100;

    breakdown.vr = vrPct;
    breakdown.nr = nrPct;
    breakdown.lr = lrPct;
    breakdown.ct = ctPct;
    breakdown.wm = wmPct;
    breakdown.cacs = Math.round(cacs);
    breakdown.accuracy = Math.round(accuracy);
    breakdown.maxScore = 100;
    breakdown.type = 'Cognitive ability';
  }
  else if (category === 'cognitive' || (subCategory || '').toLowerCase() === 'reasoning') {
    // Count by type (logical/numerical/verbal), max 15
    const dimensionScores = {
      logical: { score: 0, max: 0 },
      numerical: { score: 0, max: 0 },
      verbal: { score: 0, max: 0 }
    };

    answers.forEach(answer => {
      const question = answer.question;
      if (!question || question.type !== 'mcq') return;

      const selectedOption = answer.selectedOption;
      const dimension = question.dimension?.toLowerCase() || 'logical';
      const options = question.options || [];

      dimensionScores[dimension] = dimensionScores[dimension] || { score: 0, max: 0 };
      dimensionScores[dimension].max += 1;

      if (selectedOption !== null && selectedOption !== undefined) {
        const selected = options[selectedOption];
        if (selected && (selected.isCorrect === true || selected.score > 0)) {
          dimensionScores[dimension].score += 1;
        }
      }
    });

    // Calculate totals
    const logicalScore = dimensionScores.logical.score;
    const numericalScore = dimensionScores.numerical.score;
    const verbalScore = dimensionScores.verbal.score;

    totalScore = logicalScore + numericalScore + verbalScore;
    maxScore = 15;

    breakdown.logical = logicalScore;
    breakdown.numerical = numericalScore;
    breakdown.verbal = verbalScore;
    breakdown.maxScore = 15;
    breakdown.type = 'Cognitive Reasoning';
  }
  // General Aptitude: category = 'professional', subCategory = 'General Aptitude'
  else if (category === 'professional' || subCategory === 'General Aptitude') {
    // Sum rating answers (1-4) + MCQ scores (1-4)
    let ratingScore = 0;
    let mcqScore = 0;

    answers.forEach(answer => {
      const question = answer.question;
      if (!question) return;

      // Rating questions: sum ratingAnswer (1-4 scale)
      if (question.type === 'rating' && answer.ratingAnswer != null) {
        const rating = parseInt(answer.ratingAnswer, 10);
        if (rating >= 1 && rating <= 4) {
          ratingScore += rating;
        }
      }
      // MCQ questions: check isCorrect or score
      else if (question.type === 'mcq') {
        const selectedOption = answer.selectedOption;
        if (selectedOption !== null && selectedOption !== undefined) {
          const options = question.options || [];
          const selected = options[selectedOption];
          if (selected) {
            const score = selected.score || (selected.isCorrect ? 1 : 0);
            mcqScore += score;
          }
        }
      }
    });

    totalScore = ratingScore + mcqScore;
    maxScore = 60; // 8 rating (max 32) + 7 MCQ (max 28) = 60

    breakdown.ratingScore = ratingScore;
    breakdown.mcqScore = mcqScore;
    breakdown.total = totalScore;
    breakdown.maxScore = 60;
    breakdown.type = 'General Aptitude';
  }
  // Default: use existing attempt score if available
  else {
    totalScore = attempt.score || 0;
    maxScore = attempt.totalMarks || answers.length;
    breakdown.total = totalScore;
    breakdown.maxScore = maxScore;
    breakdown.type = 'Standard';
  }

  // Determine pass/fail (using 60% as passing threshold)
  const passingPercentage = 60;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const passed = percentage >= passingPercentage;

  return { totalScore, maxScore, breakdown, passed };
}

/**
 * Generate simple report HTML for PDF
 */
function generateSimpleReportHtml(data) {
  const { testTaker, assessment, totalScore, maxScore, percentage, passed, breakdown, timeSpent, completedAt } = data;

  const passFailBadge = passed
    ? '<span style="background:#10B981;color:#fff;padding:8px 20px;border-radius:20px;font-weight:bold;">PASSED</span>'
    : '<span style="background:#EF4444;color:#fff;padding:8px 20px;border-radius:20px;font-weight:bold;">FAILED</span>';

  // Build breakdown table
  let breakdownHtml = '';
  if (breakdown.type === 'Cognitive Reasoning') {
    breakdownHtml = `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">Logical Reasoning</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${breakdown.logical || 0}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">Numerical Reasoning</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${breakdown.numerical || 0}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">Verbal Reasoning</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${breakdown.verbal || 0}</td>
      </tr>
    `;
  } else if (breakdown.type === 'General Aptitude') {
    breakdownHtml = `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">Rating Questions</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${breakdown.ratingScore || 0}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">MCQ Questions</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${breakdown.mcqScore || 0}</td>
      </tr>
    `;
  } else if (breakdown.type === 'Situational Judgement') {
    breakdownHtml = `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">Correct Answers</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${breakdown.total || 0} / ${breakdown.maxScore || 10}</td>
      </tr>
    `;
  } else {
    breakdownHtml = `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;">Total Score</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${totalScore} / ${maxScore}</td>
      </tr>
    `;
  }

  const completedDate = completedAt ? new Date(completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Score Report - ${assessment.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f9fafb; color: #1f2937; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #111827; margin-bottom: 8px; }
    .header p { color: #6b7280; font-size: 16px; }
    .score-card { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .score-display { text-align: center; padding: 20px 0; }
    .score-large { font-size: 56px; font-weight: bold; color: ${passed ? '#10B981' : '#EF4444'}; }
    .score-percentage { font-size: 24px; color: #6b7280; margin-top: 8px; }
    .pass-fail { text-align: center; margin-top: 20px; }
    .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .breakdown-table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
    .breakdown-table td { background: #fff; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Score Report</h1>
      <p>${assessment.title}</p>
      <p>${completedDate}</p>
    </div>

    <div class="score-card">
      <div class="score-display">
        <div class="score-large">${totalScore}/${maxScore}</div>
        <div class="score-percentage">${percentage}%</div>
      </div>
      <div class="pass-fail">
        ${passFailBadge}
      </div>
    </div>

    <div class="score-card">
      <h3 style="margin-bottom:16px;font-size:18px;">Score Breakdown</h3>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th style="padding:12px;border-bottom:1px solid #e5e7eb;">Category</th>
            <th style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">Score</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownHtml}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p><strong>Time Taken:</strong> ${timeSpent}</p>
      <p><strong>Candidate:</strong> ${testTaker.name}</p>
      <p><strong>Email:</strong> ${testTaker.email}</p>
      <p style="margin-top:16px;color:#9ca3af;font-size:12px;">Generated by Mindmil Assessments</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  getSimpleResults,
  downloadSimpleReport
};