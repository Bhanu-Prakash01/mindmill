const { TestTakerInvite, Assessment, Organization } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { sendTestInvite } = require('../services/emailService');
const XLSX = require('xlsx');

/**
 * @desc    Bulk upload test takers from CSV/XLSX
 * @route   POST /api/invites/bulk-upload
 * @access  Private (Admin, User)
 */
const bulkUploadInvites = asyncHandler(async (req, res) => {
  const { assessmentId, expiresAt } = req.body;
  const file = req.file;

  // Validate expiresAt if provided
  let expiresAtDate = null;
  if (expiresAt) {
    expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      throw new ApiError(400, 'Invalid expire date format');
    }
    if (expiresAtDate <= new Date()) {
      throw new ApiError(400, 'Expire date must be in the future');
    }
  } else {
    // Default: 30 days from now
    expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + 30);
  }

  if (!file) {
    throw new ApiError(400, 'No file uploaded');
  }

  if (!assessmentId) {
    throw new ApiError(400, 'Assessment ID is required');
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!assessment.isActive || !assessment.isPublished || assessment.isMuted) {
    throw new ApiError(400, 'Assessment is not available');
  }

  const orgId = req.user.organization?._id?.toString();
  if (!orgId) {
    throw new ApiError(403, 'You must belong to an organization');
  }

  const unlockEntry = assessment.unlockedBy?.find(
    u => u.organization.toString() === orgId
  );

  if (!unlockEntry) {
    throw new ApiError(403, 'Assessment is not unlocked for your organization');
  }

  const existingInviteCount = await TestTakerInvite.countDocuments({
    assessment: assessmentId,
    organization: orgId,
    status: { $in: ['pending', 'email_sent', 'started'] }
  });

  const assignedCount = assessment.assignedUsers ? assessment.assignedUsers.length : 0;
  const totalLocked = unlockEntry.testsUsed + assignedCount + existingInviteCount;
  const slotsAvailable = Math.max(0, unlockEntry.testsAllowed - totalLocked);

  let workbook;
  try {
    workbook = XLSX.read(file.buffer, { type: 'buffer' });
  } catch (err) {
    throw new ApiError(400, 'Invalid file format. Please upload a valid CSV or XLSX file.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  if (jsonData.length === 0) {
    throw new ApiError(400, 'File is empty or has no valid data');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const results = {
    success: [],
    failed: [],
    skipped: 0,
    totalSlotsAvailable: slotsAvailable
  };

  for (const row of jsonData) {
    const name = (row.Name || row.name || row.TestTakerName || row.testTakerName || '').trim();
    const email = (row.Email || row.email || row.TestTakerEmail || row.testTakerEmail || '').trim().toLowerCase();
    const phone = (row.Phone || row.phone || row.TestTakerPhone || row.testTakerPhone || '').trim();

    if (!name || !email || !phone) {
      results.failed.push({
        row: jsonData.indexOf(row) + 2,
        name,
        email,
        reason: 'Missing required fields (name, email, or phone)'
      });
      continue;
    }

    if (!emailRegex.test(email)) {
      results.failed.push({
        row: jsonData.indexOf(row) + 2,
        name,
        email,
        reason: 'Invalid email format'
      });
      continue;
    }

    const existingInvite = await TestTakerInvite.findOne({
      assessment: assessmentId,
      organization: orgId,
      testTakerEmail: email,
      status: { $in: ['pending', 'email_sent', 'started'] }
    });

    if (existingInvite) {
      results.skipped++;
      continue;
    }

    if (slotsAvailable <= results.success.length) {
      results.failed.push({
        row: jsonData.indexOf(row) + 2,
        name,
        email,
        reason: 'No test slots available for this invite'
      });
      continue;
    }

    try {
      const invite = await TestTakerInvite.create({
        assessment: assessmentId,
        organization: orgId,
        invitedBy: req.user._id,
        testTakerName: name,
        testTakerEmail: email,
        testTakerPhone: phone,
        expiresAt: expiresAtDate
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const category = assessment.category || 'general';
      const testLink = `${frontendUrl}/take/${category}/${invite.token}`;

      let emailSent = false;
      let emailErrorReason = null;
      try {
        await sendTestInvite({
          to: invite.testTakerEmail,
          testTakerName: invite.testTakerName,
          assessmentTitle: assessment.title,
          assessmentCategory: category,
          organizationName: req.user.organization?.name || 'Organization',
          testLink,
          instructions: assessment.instructions,
          timeLimit: assessment.timeBound?.enabled ? assessment.timeBound.durationMinutes : null,
          totalQuestions: assessment.totalQuestions || assessment.questions?.length || 0
        });
        emailSent = true;
        invite.status = 'email_sent';
        invite.emailSentAt = new Date();
        await invite.save();
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError.message);
        emailErrorReason = emailError.message;
      }

      results.success.push({
        name: invite.testTakerName,
        email: invite.testTakerEmail,
        emailSent,
        emailErrorReason: emailSent ? null : emailErrorReason
      });
    } catch (err) {
      results.failed.push({
        row: jsonData.indexOf(row) + 2,
        name,
        email,
        reason: err.message || 'Failed to create invite'
      });
    }
  }

  const emailFailedCount = results.success.filter(s => !s.emailSent).length;
  const emailSuccessCount = results.success.filter(s => s.emailSent).length;
  
  res.status(200).json({
    success: true,
    message: `Bulk upload completed. ${results.success.length} invites created, ${results.skipped} skipped, ${results.failed.length} failed. ${emailSuccessCount} emails sent successfully, ${emailFailedCount} emails failed (please check email addresses and resend).`,
    data: results
  });
});

/**
 * @desc    Export invites template CSV
 * @route   GET /api/invites/template
 * @access  Private (Admin, User)
 */
const exportTemplate = asyncHandler(async (req, res) => {
  const templateData = [
    {
      Name: 'John Doe',
      Email: 'john.doe@example.com',
      Phone: '+91 9876543210'
    },
    {
      Name: 'Jane Smith',
      Email: 'jane.smith@example.com',
      Phone: '+91 9876543211'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Test Takers');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });

  res.setHeader('Content-Disposition', 'attachment; filename=test_takers_template.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(buffer);
});

/**
 * @desc    Export invites as CSV/XLSX
 * @route   GET /api/invites/export
 * @access  Private (Admin, User)
 */
const exportInvites = asyncHandler(async (req, res) => {
  const { format = 'csv', status, assessmentId } = req.query;

  let query = {};

  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    query.organization = req.user.organization?._id;
  } else {
    query.invitedBy = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  if (assessmentId) {
    query.assessment = assessmentId;
  }

  const invites = await TestTakerInvite.find(query)
    .populate('assessment', 'title category')
    .populate('invitedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  const exportData = invites.map(invite => ({
    Name: invite.testTakerName,
    Email: invite.testTakerEmail,
    Phone: invite.testTakerPhone,
    Assessment: invite.assessment?.title || 'N/A',
    Status: invite.status,
    InvitedBy: invite.invitedBy ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}` : 'N/A',
    InvitedAt: new Date(invite.createdAt).toISOString(),
    ExpiresAt: invite.expiresAt ? new Date(invite.expiresAt).toISOString() : '',
    StartedAt: invite.startedAt ? new Date(invite.startedAt).toISOString() : '',
    CompletedAt: invite.completedAt ? new Date(invite.completedAt).toISOString() : ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invites');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: format === 'xlsx' ? 'xlsx' : 'csv' });

  const filename = `invites_export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-Type', format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');
  res.send(buffer);
});

module.exports = {
  bulkUploadInvites,
  exportTemplate,
  exportInvites
};
