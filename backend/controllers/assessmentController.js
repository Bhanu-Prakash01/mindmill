const { Assessment, Question, User, Organization, Group, Attempt, TestTakerInvite } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * @desc    Get all assessments
 * @route   GET /api/assessments
 * @access  Private
 */
const getAssessments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category, difficulty, status } = req.query;

  let query = {};

  // SuperAdmin sees all assessments
  // Admins see ALL published assessments from SuperAdmin (blurred if not unlocked)
  // No org filter — assessments are visible across all orgs
  if (req.user.role === 'user') {
    // Regular users shouldn't use this endpoint (they use my-assignments)
    if (!req.user.organization) {
      return res.json({ success: true, data: { assessments: [], totalPages: 0, currentPage: 1, total: 0 } });
    }
    query.organization = req.user.organization._id;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (status === 'active') {
    query.isActive = true;
    query.isPublished = true;
  } else if (status === 'draft') {
    query.isPublished = false;
  }

  const assessments = await Assessment.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('organization', 'name slug')
    .populate('assignedUsers', 'firstName lastName email')
    .populate('assignedGroups', 'name description')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Assessment.countDocuments(query);

  // Enrich assessments with lock/unlock status for admin users
  let enrichedAssessments = assessments;
  if (req.user.role === 'admin' && req.user.organization) {
    const orgId = req.user.organization._id.toString();
    enrichedAssessments = assessments.map(assessment => {
      const obj = assessment.toObject();
      const unlockEntry = assessment.unlockedBy?.find(
        u => u.organization.toString() === orgId
      );

      // Resolve effective credit cost per test
      let effectiveCreditCost = assessment.creditCostPerTest;
      if (effectiveCreditCost == null) {
        const org = req.user.organization;
        effectiveCreditCost = org.credits?.creditCost?.[assessment.category] ?? 5;
      }

      if (unlockEntry) {
        obj.isLocked = false;
        obj.orgUnlockInfo = {
          testsAllowed: unlockEntry.testsAllowed,
          testsUsed: unlockEntry.testsUsed,
          testsRemaining: Math.max(0, unlockEntry.testsAllowed - (obj.assignedUsers?.length || 0)),
          unlockedAt: unlockEntry.unlockedAt
        };
      } else {
        // No unlock entry for this org → locked (admin must unlock)
        obj.isLocked = true;
        obj.orgUnlockInfo = null;
      }
      obj.effectiveCreditCost = effectiveCreditCost;
      return obj;
    });
  }

  res.json({
    success: true,
    data: {
      assessments: enrichedAssessments,
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
 * @desc    Get single assessment
 * @route   GET /api/assessments/:id
 * @access  Private
 */
const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('organization', 'name slug')
    .populate({
      path: 'questions',
      options: { sort: { order: 1 } }
    })
    .populate('assignedUsers', 'firstName lastName email');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are now global — any authenticated user can view

  res.json({
    success: true,
    data: { assessment }
  });
});

/**
 * @desc    Create new assessment
 * @route   POST /api/assessments
 * @access  Private (Admin, SuperAdmin)
 */
const createAssessment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subCategory,
    difficulty,
    timeBound,
    purpose,
    audience,
    instructions,
    passingScore,
    reportConfig,
    tags,
    creditCostPerTest
  } = req.body;

  const organizationId = req.body.organizationId || req.user.organization?._id || null;

  const assessment = await Assessment.create({
    title,
    description,
    category,
    subCategory,
    organization: organizationId,
    createdBy: req.user._id,
    difficulty,
    timeBound,
    purpose,
    audience,
    instructions,
    passingScore,
    passingPercentage: passingScore,
    reportConfig,
    tags,
    creditCostPerTest: creditCostPerTest != null ? Number(creditCostPerTest) : undefined
  });

  await assessment.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Assessment created successfully',
    data: { assessment }
  });
});

/**
 * @desc    Update assessment
 * @route   PUT /api/assessments/:id
 * @access  Private (Admin, SuperAdmin)
 */
const updateAssessment = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are global — accessible to all authenticated users

  const updateFields = [
    'title', 'description', 'category', 'subCategory', 'difficulty',
    'timeBound', 'purpose', 'audience', 'instructions', 'passingScore',
    'reportConfig', 'tags', 'isActive', 'isPublished', 'allowMultipleAttempts',
    'maxAttempts', 'showResultsImmediately', 'randomizeQuestions', 'randomizeOptions',
    'creditCostPerTest'
  ];

  const updateData = {};
  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  if (updateData.passingScore) {
    updateData.passingPercentage = updateData.passingScore;
  }

  assessment = await Assessment.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Assessment updated successfully',
    data: { assessment }
  });
});

/**
 * @desc    Delete assessment
 * @route   DELETE /api/assessments/:id
 * @access  Private (Admin, SuperAdmin)
 */
const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are global — accessible to all authenticated users

  // Delete all associated questions
  await Question.deleteMany({ assessment: assessment._id });

  // Remove assessment from users' assigned assessments
  await User.updateMany(
    { assignedAssessments: assessment._id },
    { $pull: { assignedAssessments: assessment._id } }
  );

  await assessment.deleteOne();

  res.json({
    success: true,
    message: 'Assessment deleted successfully'
  });
});

/**
 * @desc    Duplicate assessment
 * @route   POST /api/assessments/:id/duplicate
 * @access  Private (Admin, SuperAdmin)
 */
const duplicateAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('questions');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are global — accessible to all authenticated users

  // Create new assessment with copied data
  const newAssessment = await Assessment.create({
    title: `${assessment.title} (Copy)`,
    description: assessment.description,
    category: assessment.category,
    subCategory: assessment.subCategory,
    organization: assessment.organization,
    createdBy: req.user._id,
    difficulty: assessment.difficulty,
    timeBound: assessment.timeBound,
    purpose: assessment.purpose,
    audience: assessment.audience,
    instructions: assessment.instructions,
    passingScore: assessment.passingScore,
    passingPercentage: assessment.passingPercentage,
    reportConfig: assessment.reportConfig,
    tags: assessment.tags,
    isPublished: false,
    questions: []
  });

  // Duplicate questions
  if (assessment.questions && assessment.questions.length > 0) {
    const newQuestions = await Promise.all(
      assessment.questions.map(async (q, index) => {
        const newQuestion = await Question.create({
          assessment: newAssessment._id,
          type: q.type,
          questionText: q.questionText,
          questionImage: q.questionImage,
          options: q.options,
          difficulty: q.difficulty,
          category: q.category,
          subCategory: q.subCategory,
          dimension: q.dimension,
          trait: q.trait,
          order: index + 1,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          timeLimit: q.timeLimit,
          isRequired: q.isRequired,
          explanation: q.explanation,
          tags: q.tags
        });
        return newQuestion._id;
      })
    );

    newAssessment.questions = newQuestions;
    newAssessment.totalQuestions = newQuestions.length;
    await newAssessment.save();
  }

  await newAssessment.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Assessment duplicated successfully',
    data: { assessment: newAssessment }
  });
});

/**
 * @desc    Get assessment statistics
 * @route   GET /api/assessments/:id/stats
 * @access  Private (Admin, SuperAdmin)
 */
const getAssessmentStats = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are global — accessible to all authenticated users

  const Attempt = require('../models/Attempt');

  const stats = await Attempt.aggregate([
    { $match: { assessment: assessment._id } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        completedAttempts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageScore: { $avg: '$percentage' },
        highestScore: { $max: '$percentage' },
        lowestScore: { $min: '$percentage' },
        averageTimeSpent: { $avg: '$timeSpent' }
      }
    }
  ]);

  const assignedUsersCount = assessment.assignedUsers.length;

  res.json({
    success: true,
    data: {
      stats: stats[0] || {
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averageTimeSpent: 0
      },
      assignedUsersCount,
      totalQuestions: assessment.totalQuestions
    }
  });
});

/**
 * @desc    Toggle assessment publish status
 * @route   PATCH /api/assessments/:id/toggle-publish
 * @access  Private (Admin, SuperAdmin)
 */
const togglePublish = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are global — accessible to all authenticated users

  assessment.isPublished = !assessment.isPublished;
  await assessment.save();

  res.json({
    success: true,
    message: `Assessment ${assessment.isPublished ? 'published' : 'unpublished'} successfully`,
    data: { assessment }
  });
});

/**
 * @desc    Assign assessment to users or groups
 * @route   POST /api/assessments/:id/assign
 * @access  Private (Admin, SuperAdmin)
 */
const assignAssessment = asyncHandler(async (req, res) => {
  const { userIds = [], groupIds = [] } = req.body;

  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are global — admins can assign any assessment

  // Track currently assigned user IDs
  const existingUserIds = assessment.assignedUsers.map(u => u.toString());

  // Collect all new user IDs from direct assignment and group members
  let allNewUserIds = [];

  // Add users to assignment
  if (userIds.length > 0) {
    const newUsers = userIds.filter(id => !existingUserIds.includes(id));
    allNewUserIds.push(...newUsers);

    const uniqueUsers = [...new Set([...existingUserIds, ...userIds])];
    assessment.assignedUsers = uniqueUsers;

    // Also update users' assignedAssessments
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { assignedAssessments: assessment._id } }
    );
  }

  // Add groups to assignment
  if (groupIds.length > 0) {
    const uniqueGroups = [...new Set([...assessment.assignedGroups.map(g => g.toString()), ...groupIds])];
    assessment.assignedGroups = uniqueGroups;

    // Get all members from these groups and assign to them too
    const groups = await Group.find({ _id: { $in: groupIds } });
    const memberIds = groups.flatMap(g => g.members.map(m => m.toString()));

    if (memberIds.length > 0) {
      const currentAssigned = assessment.assignedUsers.map(u => u.toString());
      const newMembers = memberIds.filter(id => !currentAssigned.includes(id) && !allNewUserIds.includes(id));
      allNewUserIds.push(...newMembers);

      const uniqueMembers = [...new Set([...assessment.assignedUsers.map(u => u.toString()), ...memberIds])];
      assessment.assignedUsers = uniqueMembers;

      await User.updateMany(
        { _id: { $in: memberIds } },
        { $addToSet: { assignedAssessments: assessment._id } }
      );
    }
  }

  // Check unlocked test slot availability for newly assigned users (skip for superadmin)
  if (allNewUserIds.length > 0 && req.user.role !== 'superadmin' && req.user.organization) {
    const orgId = req.user.organization._id;

    const unlockEntry = assessment.unlockedBy?.find(
      u => u.organization.toString() === orgId.toString()
    );

    if (!unlockEntry) {
      throw new ApiError(403, 'Assessment not unlocked for your organization. Please unlock it first.');
    }

    const slotsAvailable = unlockEntry.testsAllowed - unlockEntry.testsUsed;
    const currentlyAssignedCount = assessment.assignedUsers.length - allNewUserIds.length;
    const freeSlots = slotsAvailable - currentlyAssignedCount;

    if (freeSlots < allNewUserIds.length) {
      throw new ApiError(403, `Not enough test slots. ${freeSlots} free slot(s) available but trying to assign ${allNewUserIds.length} more user(s). Unlock more tests or unassign unused slots first.`);
    }
  }

  await assessment.save();

  // Calculate unlock stats for the response
  let unlockStats = null;
  if (req.user.role !== 'superadmin' && req.user.organization) {
    const orgId = req.user.organization._id;
    const unlockEntry = assessment.unlockedBy?.find(
      u => u.organization.toString() === orgId.toString()
    );
    if (unlockEntry) {
      const testsLocked = Math.max(0, assessment.assignedUsers.length - unlockEntry.testsUsed);
      const testsRemaining = Math.max(0, unlockEntry.testsAllowed - assessment.assignedUsers.length);
      unlockStats = {
        testsAllowed: unlockEntry.testsAllowed,
        testsUsed: unlockEntry.testsUsed,
        testsRemaining,
        testsLocked
      };
    }
  }

  res.json({
    success: true,
    message: 'Assessment assigned successfully',
    data: { assessment, unlockStats }
  });
});

/**
 * @desc    Remove assignment from users or groups
 * @route   POST /api/assessments/:id/unassign
 * @access  Private (Admin, SuperAdmin)
 */
const unassignAssessment = asyncHandler(async (req, res) => {
  const { userIds = [], groupIds = [] } = req.body;

  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Assessments are global — accessible to all authenticated users

  // Track users who will actually be unassigned (for credit release)
  const usersBeingRemoved = new Set();

  // Remove users from assignment
  if (userIds.length > 0) {
    userIds.forEach(id => usersBeingRemoved.add(id));

    assessment.assignedUsers = assessment.assignedUsers.filter(
      u => !userIds.includes(u.toString())
    );

    await User.updateMany(
      { _id: { $in: userIds } },
      { $pull: { assignedAssessments: assessment._id } }
    );
  }

  // Remove groups from assignment
  if (groupIds.length > 0) {
    // Find members of removed groups who are ONLY assigned via those groups
    const removedGroups = await Group.find({ _id: { $in: groupIds } });
    const removedGroupMemberIds = removedGroups.flatMap(g => g.members.map(m => m.toString()));

    // Remaining groups after removal
    const remainingGroupIds = assessment.assignedGroups
      .filter(g => !groupIds.includes(g.toString()))
      .map(g => g.toString());

    let remainingGroupMemberIds = [];
    if (remainingGroupIds.length > 0) {
      const remainingGroups = await Group.find({ _id: { $in: remainingGroupIds } });
      remainingGroupMemberIds = remainingGroups.flatMap(g => g.members.map(m => m.toString()));
    }

    // Users to remove: in removed groups but NOT in remaining groups and NOT directly assigned
    const directlyAssigned = assessment.assignedUsers.map(u => u.toString());
    for (const memberId of removedGroupMemberIds) {
      if (!remainingGroupMemberIds.includes(memberId) && !directlyAssigned.includes(memberId)) {
        usersBeingRemoved.add(memberId);
      }
    }

    assessment.assignedGroups = assessment.assignedGroups.filter(
      g => !groupIds.includes(g.toString())
    );

    // Update removed users' assignedAssessments
    if (usersBeingRemoved.size > 0) {
      const removedList = [...usersBeingRemoved].filter(id => !directlyAssigned.includes(id));
      if (removedList.length > 0) {
        await User.updateMany(
          { _id: { $in: removedList } },
          { $pull: { assignedAssessments: assessment._id } }
        );
      }
    }
  }

  // Refund credits for unassigned users who never attempted (skip for superadmin)
  if (usersBeingRemoved.size > 0 && req.user.role !== 'superadmin' && req.user.organization) {
    const orgId = req.user.organization._id;
    const { Attempt } = require('../models');

    // Find which removed users never attempted this assessment
    const removedUserIds = [...usersBeingRemoved];
    const attemptedUsers = await Attempt.distinct('user', {
      user: { $in: removedUserIds },
      assessment: assessment._id
    });
    const attemptedSet = new Set(attemptedUsers.map(id => id.toString()));
    const neverAttemptedCount = removedUserIds.filter(id => !attemptedSet.has(id)).length;

    if (neverAttemptedCount > 0) {
      // Resolve credit cost per test
      const organization = await Organization.findById(orgId);
      let creditCostPerTest = assessment.creditCostPerTest;
      if (creditCostPerTest == null) {
        creditCostPerTest = organization.credits?.creditCost?.[assessment.category] ?? 5;
      }

      const creditsToRefund = creditCostPerTest * neverAttemptedCount;

      // Return credits to organization (move from used back to available)
      organization.credits.used = Math.max(0, organization.credits.used - creditsToRefund);
      await organization.save();

      // Decrement testsUsed on unlock entry
      const unlockEntry = assessment.unlockedBy?.find(
        u => u.organization.toString() === orgId.toString()
      );
      if (unlockEntry) {
        unlockEntry.testsUsed = Math.max(0, unlockEntry.testsUsed - neverAttemptedCount);
      }
    }
  }

  await assessment.save();

  // Calculate unlock stats for the response
  let unlockStats = null;
  if (req.user.role !== 'superadmin' && req.user.organization) {
    const orgId = req.user.organization._id;
    const unlockEntry = assessment.unlockedBy?.find(
      u => u.organization.toString() === orgId.toString()
    );
    if (unlockEntry) {
      const testsLocked = Math.max(0, assessment.assignedUsers.length - unlockEntry.testsUsed);
      const testsRemaining = Math.max(0, unlockEntry.testsAllowed - assessment.assignedUsers.length);
      unlockStats = {
        testsAllowed: unlockEntry.testsAllowed,
        testsUsed: unlockEntry.testsUsed,
        testsRemaining,
        testsLocked
      };
    }
  }

  res.json({
    success: true,
    message: 'Assignment removed successfully',
    data: { assessment, unlockStats }
  });
});

/**
 * @desc    Get my assigned assessments (for regular users)
 * @route   GET /api/assessments/my-assignments
 * @access  Private
 */
const getMyAssignments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  let query = {
    _id: { $in: req.user.assignedAssessments || [] },
    isPublished: true,
    isActive: true
  };

  if (status === 'completed') {
    const Attempt = require('../models/Attempt');
    const completedAttempts = await Attempt.find({
      user: req.user._id,
      status: 'completed'
    }).distinct('assessment');
    query._id = { $in: completedAttempts };
  } else if (status === 'pending') {
    const Attempt = require('../models/Attempt');
    const completedAttempts = await Attempt.find({
      user: req.user._id,
      status: 'completed'
    }).distinct('assessment');
    query._id = {
      $in: req.user.assignedAssessments || [],
      $nin: completedAttempts
    };
  }

  const assessments = await Assessment.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('organization', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Assessment.countDocuments(query);

  // Get attempt status for each assessment
  const Attempt = require('../models/Attempt');
  const attempts = await Attempt.find({
    user: req.user._id,
    assessment: { $in: assessments.map(a => a._id) }
  });

  const assessmentsWithStatus = assessments.map(assessment => {
    const attempt = attempts.find(a => a.assessment.toString() === assessment._id.toString());
    const obj = {
      ...assessment.toObject(),
      attemptStatus: attempt ? attempt.status : null,
      attemptId: attempt ? attempt._id : null
    };

    // Add unlock info for user's organization
    if (req.user.organization) {
      const orgId = req.user.organization._id?.toString() || req.user.organization.toString();
      const unlockEntry = assessment.unlockedBy?.find(
        u => u.organization.toString() === orgId
      );
      if (unlockEntry) {
        obj.orgUnlockInfo = {
          testsAllowed: unlockEntry.testsAllowed,
          testsUsed: unlockEntry.testsUsed,
          testsRemaining: Math.max(0, unlockEntry.testsAllowed - (obj.assignedUsers?.length || 0))
        };
      }
    }

    return obj;
  }).filter(a => a.orgUnlockInfo); // Only show unlocked assessments to users

  res.json({
    success: true,
    data: {
      assessments: assessmentsWithStatus,
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
 * @desc    Toggle assessment mute status (pause availability)
 * @route   PATCH /api/assessments/:id/toggle-mute
 * @access  Private (Admin, SuperAdmin)
 */
const toggleMute = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (req.user.role !== 'superadmin') {
    if ((!req.user.organization || assessment.organization.toString() !== req.user.organization._id.toString())) {
      throw new ApiError(403, 'Access denied');
    }
  }

  assessment.isMuted = !assessment.isMuted;
  await assessment.save();

  res.json({
    success: true,
    message: `Assessment ${assessment.isMuted ? 'muted' : 'unmuted'} successfully`,
    data: { assessment }
  });
});

/**
 * @desc    Get public assessment via token (for test takers)
 * @route   GET /api/assessments/public/:token
 * @access  Public
 */
const getPublicAssessment = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const assessment = await Assessment.findOne({
    publicAccessToken: token,
    isPublished: true,
    isActive: true,
    isMuted: false
  }).populate('organization', 'name logo primaryColor secondaryColor');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found or not available');
  }

  // Check if token has expired
  if (assessment.publicExpiresAt && new Date() > assessment.publicExpiresAt) {
    throw new ApiError(410, 'Assessment link has expired');
  }

  res.json({
    success: true,
    data: {
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        category: assessment.category,
        organization: assessment.organization,
        requirePasscode: assessment.requirePasscode,
        timeBound: assessment.timeBound,
        instructions: assessment.instructions,
        creditsRequired: assessment.creditsRequired
      }
    }
  });
});

/**
 * @desc    Generate public access link for assessment
 * @route   POST /api/assessments/:id/generate-link
 * @access  Private (Admin, SuperAdmin)
 */
const generatePublicLink = asyncHandler(async (req, res) => {
  const { expiresInDays = 30 } = req.body;

  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (req.user.role !== 'superadmin') {
    if ((!req.user.organization || assessment.organization.toString() !== req.user.organization._id.toString())) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  assessment.publicAccessToken = token;
  assessment.publicExpiresAt = expiresAt;
  await assessment.save();

  const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/take/${token}`;

  res.json({
    success: true,
    message: 'Public link generated successfully',
    data: {
      publicUrl,
      token,
      expiresAt
    }
  });
});

/**
 * @desc    Revoke public access link
 * @route   DELETE /api/assessments/:id/revoke-link
 * @access  Private (Admin, SuperAdmin)
 */
const revokePublicLink = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (req.user.role !== 'superadmin') {
    if ((!req.user.organization || assessment.organization.toString() !== req.user.organization._id.toString())) {
      throw new ApiError(403, 'Access denied');
    }
  }

  assessment.publicAccessToken = null;
  assessment.publicExpiresAt = null;
  await assessment.save();

  res.json({
    success: true,
    message: 'Public link revoked successfully'
  });
});

/**
 * @desc    Unlock assessment for admin's organization (purchase test slots)
 * @route   POST /api/assessments/:id/unlock
 * @access  Private (Admin)
 */
const unlockAssessment = asyncHandler(async (req, res) => {
  const { testCount } = req.body;

  if (!testCount || testCount < 1) {
    throw new ApiError(400, 'testCount must be at least 1');
  }

  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!req.user.organization) {
    throw new ApiError(400, 'You must belong to an organization to unlock assessments');
  }

  // Any admin can unlock any assessment for their own organization
  // Resolve credit cost per test
  const organization = await Organization.findById(req.user.organization._id);
  let creditCostPerTest = assessment.creditCostPerTest;
  if (creditCostPerTest == null) {
    creditCostPerTest = organization.credits?.creditCost?.[assessment.category] ?? 5;
  }

  const totalCost = creditCostPerTest * testCount;
  const availableCredits = organization.credits.total - organization.credits.used - (organization.credits.locked || 0);

  if (availableCredits < totalCost) {
    throw new ApiError(403, `Insufficient credits. Need ${totalCost} credits (${creditCostPerTest} × ${testCount} tests), but only ${availableCredits} available.`);
  }

  // Check if already unlocked for this org
  const orgId = req.user.organization._id;
  const existingEntry = assessment.unlockedBy.find(
    u => u.organization.toString() === orgId.toString()
  );

  if (existingEntry) {
    existingEntry.testsAllowed += testCount;
    existingEntry.creditsLocked += totalCost;
  } else {
    assessment.unlockedBy.push({
      organization: orgId,
      testsAllowed: testCount,
      testsUsed: 0,
      unlockedAt: new Date(),
      creditsLocked: totalCost
    });
  }

  // Lock credits (not deduct yet - they will be deducted when test is completed)
  organization.credits.locked = (organization.credits.locked || 0) + totalCost;

  await Promise.all([assessment.save(), organization.save()]);

  // Return updated unlock info
  const updatedEntry = assessment.unlockedBy.find(
    u => u.organization.toString() === orgId.toString()
  );

  res.json({
    success: true,
    message: `Successfully unlocked ${testCount} test${testCount > 1 ? 's' : ''} for ${totalCost} credits`,
    data: {
      unlockInfo: {
        testsAllowed: updatedEntry.testsAllowed,
        testsUsed: updatedEntry.testsUsed,
        testsRemaining: Math.max(0, updatedEntry.testsAllowed - (assessment.assignedUsers?.length || 0)),
        unlockedAt: updatedEntry.unlockedAt,
        creditsLocked: updatedEntry.creditsLocked
      },
      creditsLocked: totalCost,
      creditsRemaining: organization.credits.total - organization.credits.used - (organization.credits.locked || 0)
    }
  });
});

/**
 * @desc    Get assessment by invite token (for test takers)
 * @route   GET /api/assessments/invite/:token
 * @access  Public
 */
const getAssessmentByInviteToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const invite = await TestTakerInvite.findOne({ token })
    .populate({
      path: 'assessment',
      populate: { path: 'organization', select: 'name logo primaryColor secondaryColor' }
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

  res.json({
    success: true,
    data: {
      invite: {
        _id: invite._id,
        testTakerName: invite.testTakerName,
        testTakerEmail: invite.testTakerEmail,
        status: invite.status,
        expiresAt: invite.expiresAt
      },
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        category: assessment.category,
        organization: assessment.organization,
        requirePasscode: assessment.requirePasscode,
        timeBound: assessment.timeBound,
        instructions: assessment.instructions,
        totalQuestions: assessment.totalQuestions
      }
    }
  });
});

/**
 * @desc    Refund credits for assigned users who never attempted the assessment
 * @route   POST /api/assessments/:id/refund-unattempted
 * @access  Private (Admin)
 */
const refundUnattempted = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!req.user.organization) {
    throw new ApiError(400, 'You must belong to an organization to refund credits');
  }

  const orgId = req.user.organization._id;
  const unlockEntry = assessment.unlockedBy?.find(
    u => u.organization.toString() === orgId.toString()
  );

  if (!unlockEntry) {
    throw new ApiError(400, 'Assessment is not unlocked for your organization');
  }

  // Find assigned users from this organization
  const orgUserIds = assessment.assignedUsers.map(u => u.toString());

  if (orgUserIds.length === 0) {
    throw new ApiError(400, 'No users are assigned to this assessment');
  }

  // Find which assigned users have attempted this assessment
  const Attempt = require('../models/Attempt');
  const attemptedUserIds = await Attempt.distinct('user', {
    user: { $in: orgUserIds },
    assessment: assessment._id
  });
  const attemptedSet = new Set(attemptedUserIds.map(id => id.toString()));

  // Separate unattempted users
  const unattemptedUserIds = orgUserIds.filter(id => !attemptedSet.has(id));

  if (unattemptedUserIds.length === 0) {
    throw new ApiError(400, 'All assigned users have attempted the assessment. Nothing to refund.');
  }

  // Resolve credit cost per test
  const organization = await Organization.findById(orgId);
  let creditCostPerTest = assessment.creditCostPerTest;
  if (creditCostPerTest == null) {
    creditCostPerTest = organization.credits?.creditCost?.[assessment.category] ?? 5;
  }

  const creditsToRefund = creditCostPerTest * unattemptedUserIds.length;

  // Remove unattempted users from assignedUsers
  assessment.assignedUsers = assessment.assignedUsers.filter(
    u => !unattemptedUserIds.includes(u.toString())
  );

  // Decrement testsUsed on unlock entry
  unlockEntry.testsUsed = Math.max(0, unlockEntry.testsUsed - unattemptedUserIds.length);

  await assessment.save();

  // Refund credits to organization
  organization.credits.used = Math.max(0, organization.credits.used - creditsToRefund);
  await organization.save();

  // Update users' assignedAssessments
  await User.updateMany(
    { _id: { $in: unattemptedUserIds } },
    { $pull: { assignedAssessments: assessment._id } }
  );

  res.json({
    success: true,
    message: `Refunded ${creditsToRefund} credits for ${unattemptedUserIds.length} unattempted test(s)`,
    data: {
      refundedUsers: unattemptedUserIds.length,
      creditsRefunded: creditsToRefund,
      testsRemaining: Math.max(0, unlockEntry.testsAllowed - (assessment.assignedUsers?.length || 0)),
      creditsRemaining: organization.credits.total - organization.credits.used
    }
  });
});

/**
 * @desc    Get organizations and users who purchased/unlocked an assessment
 * @route   GET /api/assessments/:id/purchases
 * @access  SuperAdmin only
 */
const getAssessmentPurchases = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate({
      path: 'unlockedBy.organization',
      select: 'name slug logo primaryColor'
    });

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  const purchases = await Promise.all(
    (assessment.unlockedBy || []).map(async (entry) => {
      const org = entry.organization;
      if (!org) return null;

      // Get assigned users for this organization
      const assignedUsers = await User.find({
        _id: { $in: assessment.assignedUsers },
        organization: org._id,
        isActive: true
      }).select('firstName lastName email role jobTitle');

      // Get attempts for this organization
      const attempts = await Attempt.find({
        assessment: assessment._id,
        organization: org._id
      }).populate('user', 'firstName lastName email');

      const completedAttempts = attempts.filter(a => a.status === 'completed').length;
      const inProgressAttempts = attempts.filter(a => a.status === 'in-progress').length;

      return {
        organization: {
          id: org._id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
          primaryColor: org.primaryColor
        },
        testsAllowed: entry.testsAllowed,
        testsUsed: entry.testsUsed,
        testsRemaining: Math.max(0, entry.testsAllowed - entry.testsUsed),
        creditsLocked: entry.creditsLocked,
        unlockedAt: entry.unlockedAt,
        assignedUsers: assignedUsers.map(u => ({
          id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          jobTitle: u.jobTitle
        })),
        attempts: {
          total: attempts.length,
          completed: completedAttempts,
          inProgress: inProgressAttempts
        }
      };
    })
  );

  res.json({
    success: true,
    data: {
      assessment: {
        id: assessment._id,
        title: assessment.title,
        category: assessment.category
      },
      purchases: purchases.filter(p => p !== null)
    }
  });
});

module.exports = {
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  duplicateAssessment,
  getAssessmentStats,
  togglePublish,
  assignAssessment,
  unassignAssessment,
  getMyAssignments,
  toggleMute,
  getPublicAssessment,
  getAssessmentByInviteToken,
  generatePublicLink,
  revokePublicLink,
  unlockAssessment,
  refundUnattempted,
  getAssessmentPurchases
};