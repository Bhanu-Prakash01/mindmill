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

  const totalInvites = await TestTakerInvite.countDocuments();

  const saAvgTimeResult = await Attempt.aggregate([
    { $match: { status: 'completed', timeSpent: { $gt: 0 } } },
    { $group: { _id: null, avgTime: { $avg: '$timeSpent' } } }
  ]);
  const saAvgAttemptTime = saAvgTimeResult.length > 0 ? Math.round((saAvgTimeResult[0].avgTime / 60) * 10) / 10 : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeOrgIds = await Attempt.distinct('organization', {
    status: 'completed',
    createdAt: { $gte: sevenDaysAgo }
  });
  const activeClientsCount = activeOrgIds.length;

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

  const saMonthlyTrend = await Attempt.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        attempts: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const adminEnrollment = await User.aggregate([
    { $match: { role: 'admin', createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get 24-hour time-of-day distribution (IST timezone, offset +5:30)
  const hourlyAttempts = await Attempt.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: { $hour: { date: '$createdAt', timezone: '+05:30' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
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

  const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });

  const expiredTests = await Attempt.countDocuments({ status: 'expired' });

  const totalRevenueResult = await CreditRequest.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
  ]);
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  const approvedOrgCredits = await CreditRequest.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$organization', purchaseCount: { $sum: 1 } } },
    { $match: { purchaseCount: { $gte: 2 } } }
  ]);
  const repeatClientsCount = approvedOrgCredits.length;

  const totalAvailableTests = await Assessment.countDocuments({ isPublished: true, isActive: true });

  res.json({
    success: true,
    data: {
      stats: {
        totalOrganizations,
        totalUsers,
        totalAssessments,
        totalAttempts,
        pendingCreditRequests,
        openTickets,
        avgAttemptTime: saAvgAttemptTime,
        activeClients: activeClientsCount,
        utilization: {
          linksShared: totalInvites,
          attemptsCompleted: totalAttempts,
          rate: totalInvites > 0 ? ((totalAttempts / totalInvites) * 100).toFixed(1) : 0
        }
      },
      ticketStats,
      recentOrganizations,
      recentUsers,
      monthlyStats: monthlyStats.map(s => ({
        date: `${s._id.year}-${String(s._id.month).padStart(2, '0')}-${String(s._id.day).padStart(2, '0')}`,
        count: s.count
      })).reverse(),
      monthlyTrend: saMonthlyTrend.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        attempts: m.attempts,
        completed: m.completed
      })),
      hourlyAttempts: Array.from({ length: 24 }, (_, i) => {
        const found = hourlyAttempts.find(h => h._id === i);
        return { hour: i, count: found ? found.count : 0 };
      }),
      adminEnrollment: Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const found = adminEnrollment.find(e => e._id.year === y && e._id.month === m);
        return {
          month: `${y}-${String(m).padStart(2, '0')}`,
          count: found ? found.count : 0
        };
      }),
      subscriptionStats: subscriptionStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      dataTable: {
        totalAdmins,
        expiredTests,
        totalRevenue,
        repeatClientsCount,
        totalAvailableTests
      }
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

  const totalInvites = await TestTakerInvite.countDocuments({ organization: orgId });

  const adminAvgTimeResult = await Attempt.aggregate([
    { $match: { organization: orgId, status: 'completed', timeSpent: { $gt: 0 } } },
    { $group: { _id: null, avgTime: { $avg: '$timeSpent' } } }
  ]);
  const adminAvgAttemptTime = adminAvgTimeResult.length > 0 ? Math.round((adminAvgTimeResult[0].avgTime / 60) * 10) / 10 : 0;

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

  const orgHourlyAttempts = await Attempt.aggregate([
    { $match: { organization: orgId, status: 'completed' } },
    {
      $group: {
        _id: { $hour: { date: '$createdAt', timezone: '+05:30' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
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
        credits,
        avgAttemptTime: adminAvgAttemptTime,
        utilization: {
          linksShared: totalInvites,
          attemptsCompleted: completedAttempts,
          rate: totalInvites > 0 ? ((completedAttempts / totalInvites) * 100).toFixed(1) : 0
        }
      },
      recentAttempts,
      assessmentUsage: assessmentUsageWithDetails,
      monthlyTrend: monthlyTrend.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        attempts: m.attempts,
        completed: m.completed
      })),
      hourlyAttempts: Array.from({ length: 24 }, (_, i) => {
        const found = orgHourlyAttempts.find(h => h._id === i);
        return { hour: i, count: found ? found.count : 0 };
      }),
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

  const userAvgTimeResult = await Attempt.aggregate([
    { $match: { organization: orgId, status: 'completed', timeSpent: { $gt: 0 } } },
    { $group: { _id: null, avgTime: { $avg: '$timeSpent' } } }
  ]);
  const userAvgAttemptTime = userAvgTimeResult.length > 0 ? Math.round((userAvgTimeResult[0].avgTime / 60) * 10) / 10 : 0;

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
        completionRate: totalSent > 0 ? Math.round((statusCounts.completed / totalSent) * 100) : 0,
        avgAttemptTime: userAvgAttemptTime,
        utilization: {
          linksShared: totalSent,
          attemptsCompleted: statusCounts.completed,
          rate: totalSent > 0 ? Math.round((statusCounts.completed / totalSent) * 100) : 0
        }
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
