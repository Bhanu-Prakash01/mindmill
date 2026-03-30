const { User, Organization, Assessment, Attempt, SupportTicket, CreditRequest, TestTakerInvite } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get SuperAdmin dashboard metrics
 * @route   GET /api/dashboard/superadmin
 * @access  Private (SuperAdmin)
 */
const getSuperAdminDashboard = asyncHandler(async (req, res) => {
  // Get counts
  const totalOrganizations = await Organization.countDocuments({ isActive: true });
  const totalUsers = await User.countDocuments({ isActive: true });
  const totalAssessments = await Assessment.countDocuments();
  const totalAttempts = await Attempt.countDocuments({ status: 'completed' });

  // Get recent data
  const recentOrganizations = await Organization.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name slug createdAt');

  const recentUsers = await User.find({ isActive: true })
    .populate('organization', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName email role organization createdAt');

  // Get pending credit requests
  const pendingCreditRequests = await CreditRequest.countDocuments({ status: 'pending' });

  // Get open support tickets
  const openTickets = await SupportTicket.countDocuments({ 
    status: { $in: ['open', 'in-progress'] } 
  });

  // Get ticket status breakdown
  const ticketStatusBreakdown = await SupportTicket.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const ticketStats = {
    open: 0,
    'in-progress': 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
    total: 0
  };

  ticketStatusBreakdown.forEach(item => {
    ticketStats[item._id] = item.count;
    ticketStats.total += item.count;
  });

  // Get monthly stats
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const monthlyStats = await Attempt.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    { $limit: 30 }
  ]);

  // Get subscription stats
  const subscriptionStats = await Organization.aggregate([
    {
      $group: {
        _id: '$subscription.plan',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalOrganizations,
        totalUsers,
        totalAssessments,
        totalAttempts,
        pendingCreditRequests,
        openTickets
      },
      ticketStats,
      recentOrganizations,
      recentUsers,
      monthlyStats: monthlyStats.map(s => ({
        date: `${s._id.year}-${String(s._id.month).padStart(2, '0')}-${String(s._id.day).padStart(2, '0')}`,
        count: s.count
      })).reverse(),
      subscriptionStats: subscriptionStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    }
  });
});

/**
 * @desc    Get Admin dashboard metrics
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const orgId = req.user.organization._id;
  const { months } = req.query; // Add support for months parameter
  
  const monthsToFetch = months ? parseInt(months) : 6;

  // Get organization users
  const totalUsers = await User.countDocuments({ 
    organization: orgId,
    isActive: true 
  });

  const newUsersThisMonth = await User.countDocuments({
    organization: orgId,
    isActive: true,
    createdAt: { $gte: new Date(new Date().setDate(1)) }
  });

  // Get assessments
  const totalAssessments = await Assessment.countDocuments({ organization: orgId });
  const publishedAssessments = await Assessment.countDocuments({ 
    organization: orgId,
    isPublished: true 
  });

  // Get attempts/completions
  const totalAttempts = await Attempt.countDocuments({ organization: orgId });
  const completedAttempts = await Attempt.countDocuments({ 
    organization: orgId,
    status: 'completed' 
  });

  // Get completion rate
  const completionRate = totalAttempts > 0 
    ? ((completedAttempts / totalAttempts) * 100).toFixed(1)
    : 0;

  // Get average score
  const scoreStats = await Attempt.aggregate([
    { $match: { organization: orgId, status: 'completed' } },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$percentage' }
      }
    }
  ]);

  const averageScore = scoreStats[0]?.averageScore?.toFixed(1) || 0;

  // Get credits
  const organization = await Organization.findById(orgId);
  const credits = organization.credits;

  // Get recent activity
  const recentAttempts = await Attempt.find({ organization: orgId })
    .populate('user', 'firstName lastName')
    .populate('assessment', 'title')
    .sort({ createdAt: -1 })
    .limit(10);

  // Get assessment usage stats
  const assessmentUsage = await Attempt.aggregate([
    { $match: { organization: orgId } },
    {
      $group: {
        _id: '$assessment',
        attempts: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageScore: { $avg: '$percentage' }
      }
    },
    { $sort: { attempts: -1 } },
    { $limit: 5 }
  ]);

  // Populate assessment details
  const assessmentIds = assessmentUsage.map(a => a._id);
  const assessments = await Assessment.find({ _id: { $in: assessmentIds } })
    .select('title category');

  const assessmentUsageWithDetails = assessmentUsage.map(usage => ({
    ...usage,
    assessment: assessments.find(a => a._id.toString() === usage._id.toString())
  }));

  // Get monthly trend based on query parameter
  const monthsAgo = new Date();
  monthsAgo.setMonth(monthsAgo.getMonth() - monthsToFetch);

  const monthlyTrend = await Attempt.aggregate([
    {
      $match: {
        organization: orgId,
        createdAt: { $gte: monthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        attempts: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        newUsersThisMonth,
        totalAssessments,
        publishedAssessments,
        totalAttempts,
        completedAttempts,
        completionRate,
        averageScore,
        credits
      },
      recentAttempts,
      assessmentUsage: assessmentUsageWithDetails,
      monthlyTrend: monthlyTrend.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        attempts: m.attempts,
        completed: m.completed
      })),
      summary: {
        expiredTests: 0, // Mocked for now, needs logic based on actual expiry field in attempt/assessment
        totalTestTaker: totalUsers,
        countOfReports: completedAttempts,
        bestTimeOfTests: "Afternoon", // Mocked for now
        linksSharedButUnattended: totalAttempts - completedAttempts // Approximation
      }
    }
  });
});

/**
 * @desc    Get User dashboard metrics
 * @route   GET /api/dashboard/user
 * @access  Private (User)
 */
const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orgId = req.user.organization?._id;

  // Get invite stats for this user
  const inviteStats = await TestTakerInvite.aggregate([
    { $match: { invitedBy: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusCounts = {
    pending: 0,
    email_sent: 0,
    started: 0,
    completed: 0,
    expired: 0
  };

  inviteStats.forEach(s => {
    statusCounts[s._id] = s.count;
  });

  const totalSent = Object.values(statusCounts).reduce((sum, c) => sum + c, 0);

  // Get recent invites sent by this user
  const recentInvites = await TestTakerInvite.find({ invitedBy: userId })
    .populate('assessment', 'title category')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get assessments available for sending invites (unlocked for org or allocated to member)
  let unlockedAssessments = [];
  if (orgId) {
    // Find assessments where the org has an unlock entry OR this member has an allocation
    const allAssessments = await Assessment.find({
      isActive: true,
      isPublished: true,
      $or: [
        { 'unlockedBy.organization': orgId },
        { 'memberAllocations': { $elemMatch: { organization: orgId, member: userId } } }
      ]
    });

    unlockedAssessments = await Promise.all(allAssessments.map(async (a) => {
      const unlockEntry = a.unlockedBy?.find(
        u => u.organization?.toString() === orgId.toString()
      );

      // Check member allocation
      const memberAlloc = (a.memberAllocations || []).find(
        ma => ma.organization?.toString() === orgId.toString() && ma.member?.toString() === userId.toString()
      );

      const memberAllocation = memberAlloc ? {
        testsAllowed: Number(memberAlloc.testsAllowed) || 0,
        testsDistributed: Number(memberAlloc.testsDistributed) || 0,
        testsRemaining: Math.max(0, (Number(memberAlloc.testsAllowed) || 0) - (Number(memberAlloc.testsDistributed) || 0))
      } : null;

      let slotsRemaining = 0;
      if (unlockEntry) {
        const activeInvitesCount = await TestTakerInvite.countDocuments({
          assessment: a._id,
          organization: orgId,
          status: { $in: ['pending', 'email_sent', 'started'] }
        });
        const assignedCount = a.assignedUsers ? a.assignedUsers.length : 0;
        const totalLocked = unlockEntry.testsUsed + activeInvitesCount + assignedCount;
        slotsRemaining = Math.max(0, unlockEntry.testsAllowed - totalLocked);
      }

      return {
        _id: a._id,
        title: a.title,
        category: a.category,
        testsAllowed: unlockEntry?.testsAllowed || 0,
        testsUsed: unlockEntry?.testsUsed || 0,
        slotsRemaining,
        memberAllocation
      };
    }));
    unlockedAssessments = unlockedAssessments.filter(a => {
      // Always show if member has an allocation entry (even if slots exhausted — they need to see usage)
      if (a.memberAllocation) return true;
      // Show if org has remaining general slots
      return a.slotsRemaining > 0;
    });
  }

  // Get my assigned assessments (from assignedAssessments AND memberAllocations)
  const allocatedAssessmentIds = orgId ? await Assessment.distinct('_id', {
    'memberAllocations': {
      $elemMatch: {
        organization: orgId,
        member: userId
      }
    },
    isPublished: true,
    isActive: true
  }) : [];

  const assignedIds = (req.user.assignedAssessments || []).map(id => id.toString());
  const allocIds = allocatedAssessmentIds.map(id => id.toString());
  const allMyAssessmentIds = [...new Set([...assignedIds, ...allocIds])];

  const myAssignedAssessments = await Assessment.find({
    _id: { $in: allMyAssessmentIds },
    isActive: true,
    isPublished: true
  }).select('title category timeBound totalQuestions');

  res.json({
    success: true,
    data: {
      stats: {
        totalSent,
        pending: statusCounts.pending + statusCounts.email_sent,
        started: statusCounts.started,
        completed: statusCounts.completed,
        expired: statusCounts.expired,
        completionRate: totalSent > 0 ? Math.round((statusCounts.completed / totalSent) * 100) : 0
      },
      recentInvites,
      availableAssessments: unlockedAssessments,
      myAssignedAssessments
    }
  });
});

module.exports = {
  getSuperAdminDashboard,
  getAdminDashboard,
  getUserDashboard
};
