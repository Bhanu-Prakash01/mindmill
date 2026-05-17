import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { testTakerService } from '../../services';
import {
  Send,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Plus,
  UserPlus,
  Upload,
  FileText,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AddTestTakerModal from '../../components/AddTestTakerModal';
import BulkImportModal from '../../components/BulkImportModal';
import { useToast } from '../../context/ToastContext';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-gray-100 text-gray-700',
    email_sent: 'bg-blue-100 text-blue-700',
    started: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700'
  };
  const labels = {
    pending: 'Pending',
    email_sent: 'Sent',
    started: 'Started',
    completed: 'Completed',
    expired: 'Expired'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/user');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (testTakerId) => {
    setActionLoading(testTakerId);
    try {
      await testTakerService.resendInvite(testTakerId);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (testTakerId) => {
    if (!confirm('Are you sure you want to remove this test taker?')) return;
    setActionLoading(testTakerId);
    try {
      await testTakerService.cancelInvite(testTakerId);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove test taker');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage test takers and track their progress
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Test Taker
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilization"
          value={`${stats?.stats?.utilization?.rate || 0}%`}
          icon={Target}
          color="bg-teal-500"
         />
         <StatCard
           title="Test Attempt Time"
           value={`${stats?.stats?.avgAttemptTime || 0} min`}
           icon={Clock}
           color="bg-cyan-500"
         />
         <StatCard
           title="Total Sent"
          value={stats?.stats?.totalSent || 0}
          icon={Send}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending"
          value={stats?.stats?.pending || 0}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="Started"
          value={stats?.stats?.started || 0}
          icon={UserPlus}
          color="bg-purple-500"
        />
        <StatCard
          title="Completed"
          value={stats?.stats?.completed || 0}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Assigned Tests */}
          {stats?.myAssignedAssessments?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Assigned Tests</h3>
                <Link
                  to="/assessments"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.myAssignedAssessments.slice(0, 3).map((assessment) => (
                  <div key={assessment._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{assessment.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 capitalize">{assessment.category}</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs flex items-center gap-1 text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {assessment.timeBound?.enabled ? `${assessment.timeBound.durationMinutes} min` : 'No limit'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/assessments`}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium rounded-lg transition-colors whitespace-nowrap text-center"
                    >
                      Go to Test
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Test Takers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Test Takers</h3>
              <Link
                to="/test-takers"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All
              </Link>
            </div>

            {!stats?.recentInvites || stats.recentInvites.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No test takers added yet</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add First Test Taker
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentInvites.map((testTaker) => (
                  <div key={testTaker._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <UserPlus className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {testTaker.testTakerName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {testTaker.testTakerEmail}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {testTaker.assessment?.title || 'Unknown Assessment'}
                            </span>
                            <StatusBadge status={testTaker.status} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">
                          {new Date(testTaker.createdAt).toLocaleDateString()}
                        </span>

                        {['pending', 'email_sent', 'expired'].includes(testTaker.status) && (
                          <button
                            onClick={() => handleResend(testTaker._id)}
                            disabled={actionLoading === testTaker._id}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Resend email"
                          >
                            {actionLoading === testTaker._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {['pending', 'email_sent'].includes(testTaker.status) && (
                          <button
                            onClick={() => handleCancel(testTaker._id)}
                            disabled={actionLoading === testTaker._id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove test taker"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {testTaker.status === 'completed' && (
                          <Link
                            to="/reports"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View report"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Completion Rate</span>
                <span className="font-semibold text-gray-900">
                  {stats?.stats?.completionRate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Expired</span>
                <span className="font-semibold text-gray-900">
                  {stats?.stats?.expired || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add New Test Taker</span>
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Bulk Import</span>
              </button>
              <Link
                to="/test-takers"
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">View All Test Takers</span>
              </Link>
              <Link
                to="/reports"
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">View Reports</span>
              </Link>
            </div>
          </div>

          {/* Available Assessments */}
          {stats?.availableAssessments && stats.availableAssessments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Available Assessments</h3>
                <Link to="/assessments" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.availableAssessments.slice(0, 5).map((assessment) => (
                  <div key={assessment._id} className="p-4">
                    <p className="font-medium text-gray-900 text-sm">
                      {assessment.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 capitalize">
                        {assessment.category}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      {assessment.memberAllocation ? (
                        <span className="text-xs text-emerald-600 font-medium">
                          {assessment.memberAllocation.testsRemaining} slots remaining
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">
                          {assessment.slotsRemaining} slots
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Test Taker Modal */}
      {showAddModal && (
        <AddTestTakerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setShowBulkImport(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
