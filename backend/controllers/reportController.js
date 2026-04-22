const { Report, Attempt, Assessment } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { generateDiscReportPdf, generateBig5ReportPdf, generateFiroReportPdf, generateMbtiReportPdf, generateGenericReportPdf, generateQuickSummaryPdf, savePdfToDisk, getCachedPdf, deleteCachedPdfs } = require('../services/pdfService');
const crypto = require('crypto');

const getAssessmentTitle = (report) => {
  if (report.assessment?.title) {
    return report.assessment.title.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  }
  const category = report.assessment?.category || report.type || '';
  const categoryMap = {
    'disc': 'DISC',
    'big5': 'BigFive',
    'mbti': 'MBTI',
    'firo': 'FIRO',
    'firo-b': 'FIRO'
  };
  return (categoryMap[category] || category || 'Assessment').toUpperCase();
};

const sanitizeName = (name) => {
  if (!name) return 'Candidate';
  return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').substring(0, 50);
};

const formatDate = () => new Date().toISOString().split('T')[0];

const generateFilename = (report, testTaker, type, category) => {
  const candidateName = sanitizeName(testTaker?.name);
  const assessmentName = getAssessmentTitle(report);
  const typeLabel = type === 'summary' ? 'Summary' : 'Comprehensive';
  const dateStr = formatDate();
  return `${assessmentName}_${typeLabel}_${candidateName}_${dateStr}.pdf`;
};

/**
 * @desc    Get all reports
 * @route   GET /api/reports
 * @access  Private
 */
const getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, userId, assessmentId } = req.query;

  let query = {};

  // Filter based on role
  if (req.user.role === 'user') {
    query.user = req.user._id;
    query.visibleToUser = true;
  } else if (req.user.role === 'admin') {
    query.organization = req.user.organization._id;
    if (userId) {
      query.user = userId;
    }
  }
  // SuperAdmin can see all

  if (assessmentId) {
    query.assessment = assessmentId;
  }

  // First, get all report IDs that have valid assessments
  const allReports = await Report.find(query)
    .populate('assessment', '_id')
    .select('_id');
  
  const validReportIds = allReports
    .filter(report => report.assessment !== null)
    .map(report => report._id);

  // Fetch full data only for valid reports with pagination
  let reports = await Report.find({ ...query, _id: { $in: validReportIds } })
    .populate('user', 'firstName lastName email')
    .populate('conductedBy', 'firstName lastName email')
    .populate('assessment', 'title category')
    .populate('attempt', 'status percentage completedAt timeSpent testTakerName testTakerEmail testTakerPhone')
    .sort({ generatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = validReportIds.length;

  res.json({
    success: true,
    data: {
      reports,
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
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('assessment', 'title category description')
    .populate('attempt')
    .populate({
      path: 'questionAnalysis.question',
      model: 'Question',
      select: 'questionText options correctAnswer explanation'
    });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    if (report.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    if (!report.visibleToUser) {
      throw new ApiError(403, 'Report is not visible to you');
    }
  } else if (req.user.role === 'admin') {
    if (report.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({
    success: true,
    data: { report }
  });
});

/**
 * @desc    Share report via email
 * @route   POST /api/reports/:id/share
 * @access  Private
 */
const shareReport = asyncHandler(async (req, res) => {
  const { email: recipientEmail, expiresInDays = 30 } = req.body;

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role === 'user' && report.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (req.user.role === 'admin' && 
      report.organization.toString() !== req.user.organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Generate access token
  const accessToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

  report.sharedWith.push({
    email: recipientEmail,
    accessToken,
    expiresAt
  });

  await report.save();

  // TODO: Send email with share link
  // For now, just return the share URL
  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/shared/${accessToken}`;

  res.json({
    success: true,
    message: 'Report shared successfully',
    data: {
      shareUrl,
      expiresAt
    }
  });
});

/**
 * @desc    Get shared report
 * @route   GET /api/reports/shared/:token
 * @access  Public
 */
const getSharedReport = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const report = await Report.findOne({
    'sharedWith.accessToken': token
  })
    .populate('user', 'firstName lastName')
    .populate('assessment', 'title category')
    .populate('attempt', 'percentage completedAt');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check if share has expired
  const shareRecord = report.sharedWith.find(s => s.accessToken === token);
  if (shareRecord.expiresAt && new Date() > shareRecord.expiresAt) {
    throw new ApiError(410, 'Share link has expired');
  }

  // Update view timestamp
  shareRecord.viewedAt = new Date();
  await report.save();

  // Return limited data for shared reports
  res.json({
    success: true,
    data: {
      report: {
        assessment: report.assessment,
        scores: report.scores,
        dimensions: report.dimensions,
        analysis: report.analysis,
        generatedAt: report.generatedAt
      }
    }
  });
});

/**
 * @desc    Toggle report visibility
 * @route   PUT /api/reports/:id/visibility
 * @access  Private (Admin, SuperAdmin)
 */
const toggleVisibility = asyncHandler(async (req, res) => {
  const { visibleToUser } = req.body;

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (report.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  report.visibleToUser = visibleToUser;
  await report.save();

  res.json({
    success: true,
    message: `Report is now ${visibleToUser ? 'visible' : 'hidden'} to user`,
    data: { report }
  });
});

/**
 * @desc    Add admin notes to report
 * @route   PUT /api/reports/:id/notes
 * @access  Private (Admin, SuperAdmin)
 */
const addAdminNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (report.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  report.adminNotes = notes;
  await report.save();

  res.json({
    success: true,
    message: 'Admin notes added successfully',
    data: { report }
  });
});

/**
 * @desc    Download report as PDF
 * @route   GET /api/reports/:id/download
 * @access  Private
 */
const generateReportPdf = async (report, testTaker, type) => {
  const category = report.assessment?.category || report.type;
  let pdfBuffer;
  let filename;

  if (type === 'summary') {
    let summaryData;
    if (report.subCategory === 'DISC') {
      const disc = report.dimensions?.DISC || {};
      const dominant = report.dimensions?.dominantTraits?.[0] || 'D';
      const secondary = report.dimensions?.dominantTraits?.[1] || 'I';
      summaryData = {
        percentages: { D: disc.D?.percentage||0, I: disc.I?.percentage||0, S: disc.S?.percentage||0, C: disc.C?.percentage||0 },
        dominant, secondary, pattern: report.dimensions?.pattern || `${dominant}${secondary}`
      };
      pdfBuffer = await generateQuickSummaryPdf(category, summaryData, testTaker);
    } else if (category === 'firo' || category === 'firo-b') {
      const firoRaw = (report.dimensions?.FIRO || report.FIRO) || {};
      summaryData = {
        dimensions: firoRaw.dimensions || {},
        totals: firoRaw.totals || { totalExpressed: 0, totalWanted: 0, overallTotal: 0 }
      };
      pdfBuffer = await generateQuickSummaryPdf(category, summaryData, testTaker);
    } else {
      const bigFive = report.dimensions?.BigFive || {};
      const byTrait = report.scores?.byTrait || {};
      summaryData = {
        scores: {
          Openness: (bigFive.openness ?? bigFive.Openness) ?? byTrait?.O?.score ?? 0,
          Conscientiousness: (bigFive.conscientiousness ?? bigFive.Conscientiousness) ?? byTrait?.C?.score ?? 0,
          Extraversion: (bigFive.extraversion ?? bigFive.Extraversion) ?? byTrait?.E?.score ?? 0,
          Agreeableness: (bigFive.agreeableness ?? bigFive.Agreeableness) ?? byTrait?.A?.score ?? 0,
          Neuroticism: (bigFive.neuroticism ?? bigFive.Neuroticism) ?? byTrait?.N?.score ?? 0,
        }
      };
      pdfBuffer = await generateQuickSummaryPdf(category, summaryData, testTaker);
    }
    filename = generateFilename(report, testTaker, type, category);
  } else if (report.subCategory === 'DISC') {
    const disc = report.dimensions?.DISC || {};
    const dominant = report.dimensions?.dominantTraits?.[0] || 'D';
    const secondary = report.dimensions?.dominantTraits?.[1] || 'I';
    const pattern = report.dimensions?.pattern || `${dominant}${secondary}`;
    const discData = {
      percentages: {
        D: disc.D?.percentage || 0,
        I: disc.I?.percentage || 0,
        S: disc.S?.percentage || 0,
        C: disc.C?.percentage || 0,
      },
      dominant,
      secondary,
      pattern,
      analysis: report.analysis || {},
      dimensions: disc,
    };
    pdfBuffer = await generateDiscReportPdf(discData, testTaker);
    filename = generateFilename(report, testTaker, type, category);
  } else if (report.subCategory === 'Big5') {
    const bigFive = report.dimensions?.BigFive || {};
    const byTrait = report.scores?.byTrait || {};
    const big5Data = {
      scores: {
        Openness: (bigFive.openness ?? bigFive.Openness) ?? byTrait?.O?.score ?? 0,
        Conscientiousness: (bigFive.conscientiousness ?? bigFive.Conscientiousness) ?? byTrait?.C?.score ?? 0,
        Extraversion: (bigFive.extraversion ?? bigFive.Extraversion) ?? byTrait?.E?.score ?? 0,
        Agreeableness: (bigFive.agreeableness ?? bigFive.Agreeableness) ?? byTrait?.A?.score ?? 0,
        Neuroticism: (bigFive.neuroticism ?? bigFive.Neuroticism) ?? byTrait?.N?.score ?? 0,
      },
      traits: bigFive,
      analysis: report.analysis || {}
    };
    pdfBuffer = await generateBig5ReportPdf(big5Data, testTaker);
    filename = generateFilename(report, testTaker, type, category);
  } else if (
    category === 'mbti' || report.type === 'mbti' ||
    report.dimensions?.MBTI?.type
  ) {
    pdfBuffer = await generateMbtiReportPdf(report, testTaker, { type });
    filename = generateFilename(report, testTaker, type, category);
  } else if (
    category === 'firo' || category === 'firo-b' ||
    report.type === 'firo' || report.type === 'firo-b' ||
    (report.dimensions?.FIRO?.dimensions || report.dimensions?.FIRO?.totals)
  ) {
    pdfBuffer = await generateFiroReportPdf(report, testTaker, { type });
    filename = generateFilename(report, testTaker, type, category);
  } else {
    pdfBuffer = await generateGenericReportPdf(report);
    filename = generateFilename(report, testTaker, type, category);
  }

  return { pdfBuffer, filename };
};

const downloadReport = asyncHandler(async (req, res) => {
  const { type = 'comprehensive' } = req.query;
  const report = await Report.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('assessment', 'title category')
    .populate('attempt');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  if (req.user.role === 'user') {
    if (report.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    if (!report.visibleToUser) {
      throw new ApiError(403, 'Report is not available for download');
    }
  }

  try {
    const cached = getCachedPdf(report._id.toString(), type);
    let pdfBuffer, filename;
    const category = report.assessment?.category || report.type;

    if (cached) {
      pdfBuffer = cached;
      const category = report.assessment?.category || report.type;
      const testTakerObj = report.attempt ? {
        name: report.attempt.testTakerName || `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim()
      } : {
        name: `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim()
      };
      filename = generateFilename(report, testTakerObj, type, category);
    } else {
      const testTaker = report.attempt ? {
        name: report.attempt.testTakerName || `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim(),
        email: report.attempt.testTakerEmail || report.user?.email,
        phone: report.attempt.testTakerPhone,
        startedAt: report.attempt.startedAt,
        completedAt: report.attempt.completedAt,
        timeSpent: report.attempt.timeSpent,
        totalQuestions: report.attempt.totalQuestions,
        answeredQuestions: report.attempt.answeredQuestions
      } : {
        name: `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim(),
        email: report.user?.email
      };

      const result = await generateReportPdf(report, testTaker, type);
      pdfBuffer = result.pdfBuffer;
      filename = result.filename;

      await savePdfToDisk(pdfBuffer, report._id.toString(), type);
      
      const pdfField = type === 'summary' ? 'pdfFiles.summary' : 'pdfFiles.comprehensive';
      await Report.findByIdAndUpdate(report._id, {
        [`${pdfField}.path`]: filename,
        [`${pdfField}.generatedAt`]: new Date()
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate PDF');
  }
});

/**
 * @desc    Preview DISC report HTML template
 * @route   GET /api/reports/preview/disc
 * @access  Private (Admin only)
 */
const previewDiscReport = asyncHandler(async (req, res) => {
  const { generateDiscReportPdf } = require('../services/pdfService');

  const sampleData = {
    percentages: { D: 35, I: 25, S: 20, C: 20 },
    dominant: 'D',
    secondary: 'I',
    pattern: 'DI',
    analysis: {
      summary: 'You are a results-oriented leader who combines strategic thinking with excellent communication skills. Your dominant D trait drives you to achieve goals, while your I influence helps you inspire and motivate others.',
      strengths: [
        'Natural leadership abilities with a commanding presence',
        'Excellent at motivating and inspiring teams',
        'Quick decision-maker who thrives under pressure',
        'Strong strategic vision and goal-oriented mindset'
      ],
      developmentAreas: [
        'May benefit from practicing more active listening',
        'Could improve patience when dealing with detailed tasks',
        'Should consider the impact on team morale before making quick decisions'
      ],
      workStyle: 'You prefer fast-paced environments where you can take initiative and drive results. You thrive when given autonomy and clear objectives.',
      recommendations: [
        'Seek leadership opportunities that leverage your natural charisma',
        'Build a team that complements your direct approach with diplomatic skills',
        'Practice delegating tasks to focus on strategic priorities'
      ]
    },
    dimensions: {
      D: { percentage: 35 },
      I: { percentage: 25 },
      S: { percentage: 20 },
      C: { percentage: 20 }
    }
  };

  const testTaker = {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 234 567 8900'
  };

  try {
    const pdfBuffer = await generateDiscReportPdf(sampleData, testTaker);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="DISC_Preview.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Preview PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate preview PDF');
  }
});

/**
 * @desc    Preview Big5 report HTML template
 * @route   GET /api/reports/preview/big5
 * @access  Private (Admin only)
 */
const previewBig5Report = asyncHandler(async (req, res) => {
  const { generateBig5ReportPdf } = require('../services/pdfService');

  const sampleData = {
    scores: {
      Openness: 75,
      Conscientiousness: 68,
      Extraversion: 55,
      Agreeableness: 62,
      Neuroticism: 35
    },
    analysis: {
      summary: 'You score high in Openness and Conscientiousness, suggesting you are both creative and organized. Your moderate Extraversion indicates a balanced approach to social situations.',
      strengths: [
        'Strong creative and analytical thinking abilities',
        'Well-organized with good time management skills',
        'Adaptable to different situations and environments',
        'Maintains emotional stability under pressure'
      ],
      developmentAreas: [
        'Could benefit from being more assertive in group settings',
        'May need to work on being more open to feedback',
        'Could improve collaboration skills in team environments'
      ]
    }
  };

  const testTaker = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com'
  };

  try {
    const pdfBuffer = await generateBig5ReportPdf(sampleData, testTaker);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Big5_Preview.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Preview PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate preview PDF');
  }
});

/**
 * @desc    Preview FIRO-B report HTML template
 * @route   GET /api/reports/preview/firo
 * @access  Private (Admin only)
 */
const previewFiroReport = asyncHandler(async (req, res) => {
  const { generateFiroReportPdf } = require('../services/pdfService');

  // Dummy mock data mimicking the firo scoring service output inside a report
  const sampleReportData = {
    dimensions: {
      Expressed: { Inclusion: 7, Control: 1, Affection: 7 },
      Wanted: { Inclusion: 7, Control: 9, Affection: 7 }
    },
    totals: { totalExpressed: 15, totalWanted: 23, overallTotal: 38 }
  };

  const testTaker = {
    name: 'Jane Sample',
    email: 'jane.sample@example.com'
  };

  try {
    const pdfBuffer = await generateFiroReportPdf(sampleReportData, testTaker);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="FIRO_Preview.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Preview PDF generation error:', error);
    throw new ApiError(500, 'Failed to generate preview PDF');
  }
});

module.exports = {
  getReports,
  getReport,
  shareReport,
  getSharedReport,
  toggleVisibility,
  addAdminNotes,
  downloadReport,
  previewDiscReport,
  previewBig5Report,
  previewFiroReport
};
