import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { inviteService } from '../../services';
import InviteTestTakerModal from '../../components/InviteTestTakerModal';
import {
  Send,
  Plus,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Mail,
  Loader2,
  Search,
  Filter
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  email_sent: { label: 'Email Sent', color: 'bg-blue-100 text-blue-700', icon: Mail },
  started: { label: 'Started', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const Invites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    fetchInvites();
    if (isAdmin) fetchStats();
  }, [page, statusFilter, search]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await inviteService.getInvites(params);
      setInvites(response.data?.invites || []);
      setPagination(response.data?.pagination);
    } catch (err) {
      console.error('Error fetching invites:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await inviteService.getInviteStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this invite?')) return;
    try {
      await inviteService.cancelInvite(id);
      fetchInvites();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel invite');
    }
  };

  const handleResend = async (id) => {
    try {
      await inviteService.resendInvite(id);
      alert('Email resent successfully');
      fetchInvites();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend email');
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Invitations</h1>
          <p className="text-gray-500 mt-1">Manage test taker invitations</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Test Taker
        </button>
      </div>

      {/* Stats Cards (Admin only) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalInvites}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Email Sent</p>
            <p className="text-2xl font-bold text-blue-600">{stats.email_sent}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Started</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.started}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.completionRate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="email_sent">Email Sent</option>
          <option value="started">Started</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
        <button
          onClick={fetchInvites}
          className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Invites Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Taker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited By</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : invites.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center">
                    <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No invitations found</p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      Send your first invite
                    </button>
                  </td>
                </tr>
              ) : (
                invites.map((invite) => {
                  const StatusIcon = statusConfig[invite.status]?.icon || Clock;
                  return (
                    <tr key={invite._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{invite.testTakerName}</div>
                        <div className="text-sm text-gray-500">{invite.testTakerEmail}</div>
                        <div className="text-xs text-gray-400">{invite.testTakerPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{invite.assessment?.title}</div>
                        <div className="text-xs text-gray-500 capitalize">{invite.assessment?.category}</div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {invite.invitedBy?.firstName} {invite.invitedBy?.lastName}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[invite.status]?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[invite.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {['pending', 'email_sent', 'expired'].includes(invite.status) && (
                            <>
                              <button
                                onClick={() => handleResend(invite._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Resend email"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(invite._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel invite"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteTestTakerModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchInvites();
            if (isAdmin) fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default Invites;
