import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { testTakerService } from '../../services';
import AddTestTakerModal from '../../components/AddTestTakerModal';
import BulkImportModal from '../../components/BulkImportModal';
import EditTestTakerModal from '../../components/EditTestTakerModal';
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
  Filter,
  Upload,
  Download,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  CheckSquare,
  Square
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Email Not Sent', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  email_sent: { label: 'Email Sent', color: 'bg-blue-100 text-blue-700', icon: Mail },
  started: { label: 'Started', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const TestTakers = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [testTakers, setTestTakers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTestTakers, setSelectedTestTakers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    fetchTestTakers();
    if (isAdmin) fetchStats();
  }, [page, statusFilter, search]);

  const fetchTestTakers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await testTakerService.getInvites(params);
      setTestTakers(response.data?.invites || []);
      setPagination(response.data?.pagination);
    } catch (err) {
      console.error('Error fetching test takers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await testTakerService.getInviteStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedTestTakers.length === testTakers.length) {
      setSelectedTestTakers([]);
    } else {
      setSelectedTestTakers(testTakers.map(tt => tt._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedTestTakers(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    const isSuperAdmin = user?.role === 'superadmin';
    const message = isSuperAdmin 
      ? `Are you sure you want to permanently delete ${selectedTestTakers.length} test taker(s)?` 
      : `Are you sure you want to remove ${selectedTestTakers.length} test taker(s)?`;
    if (!confirm(message)) return;
    try {
      await Promise.all(selectedTestTakers.map(id => testTakerService.cancelInvite(id)));
      setSelectedTestTakers([]);
      fetchTestTakers();
      if (isAdmin) fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove some test takers');
    }
  };

  const handleBulkResend = async () => {
    try {
      await Promise.all(selectedTestTakers.map(id => testTakerService.resendInvite(id)));
      toast.success(`${selectedTestTakers.length} invitation(s) resent successfully`);
      setSelectedTestTakers([]);
      fetchTestTakers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend some emails');
    }
  };

  const handleCancel = async (id) => {
    const isSuperAdmin = user?.role === 'superadmin';
    const message = isSuperAdmin 
      ? 'Are you sure you want to permanently delete this test taker?' 
      : 'Are you sure you want to remove this test taker?';
    if (!confirm(message)) return;
    try {
      await testTakerService.cancelInvite(id);
      fetchTestTakers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove test taker');
    }
  };

  const handleResend = async (id) => {
    try {
      await testTakerService.resendInvite(id);
      toast.success('Email resent successfully');
      fetchTestTakers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend email');
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleExport = () => {
    if (selectedTestTakers.length > 0) {
      // Export only selected test takers
      const selectedData = testTakers
        .filter(tt => selectedTestTakers.includes(tt._id))
        .map(tt => ({
          Name: tt.testTakerName,
          Email: tt.testTakerEmail,
          Phone: tt.testTakerPhone,
          Assessment: tt.assessment?.title || 'N/A',
          Status: tt.status,
          InvitedAt: new Date(tt.createdAt).toISOString(),
          ExpiresAt: tt.expiresAt ? new Date(tt.expiresAt).toISOString() : ''
        }));

      // Create CSV content
      const headers = ['Name', 'Email', 'Phone', 'Assessment', 'Status', 'InvitedAt', 'ExpiresAt'];
      const csvContent = [
        headers.join(','),
        ...selectedData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test_takers_selected_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } else {
      // Export all with current filters
      testTakerService.exportInvites({ format: 'csv', ...(statusFilter ? { status: statusFilter } : {}) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Takers</h1>
          <p className="text-gray-500 mt-1">Manage test taker invitations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkImport(true)}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            {selectedTestTakers.length > 0 ? `Export Selected (${selectedTestTakers.length})` : 'Export'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Test Taker
          </button>
        </div>
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
          onClick={fetchTestTakers}
          className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedTestTakers.length > 0 && (
        <div className="bg-indigo-600 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">
              {selectedTestTakers.length} selected
            </span>
            <button
              onClick={() => setSelectedTestTakers([])}
              className="text-indigo-200 hover:text-white text-sm"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Modify
            </button>
            <button
              onClick={handleBulkResend}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-400 text-white rounded-lg hover:bg-indigo-300 text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Resend
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {user?.role === 'superadmin' ? 'Delete' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Test Takers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="text-indigo-600 hover:text-indigo-800"
                    title={selectedTestTakers.length === testTakers.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedTestTakers.length === testTakers.length && testTakers.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Taker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited By</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : testTakers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center">
                    <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No test takers found</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      Add your first test taker
                    </button>
                  </td>
                </tr>
              ) : (
                testTakers.map((testTaker) => {
                  const StatusIcon = statusConfig[testTaker.status]?.icon || Clock;
                  const isSelected = selectedTestTakers.includes(testTaker._id);
                  return (
                    <tr key={testTaker._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleSelectOne(testTaker._id)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{testTaker.testTakerName}</div>
                        <div className="text-sm text-gray-500">{testTaker.testTakerEmail}</div>
                        <div className="text-xs text-gray-400">{testTaker.testTakerPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{testTaker.assessment?.title}</div>
                        <div className="text-xs text-gray-500 capitalize">{testTaker.assessment?.category}</div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {testTaker.invitedBy?.firstName} {testTaker.invitedBy?.lastName}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[testTaker.status]?.color}`} title={testTaker.status === 'pending' ? 'Email not sent. Please check email address and resend.' : undefined}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[testTaker.status]?.label}
                        </span>
                        {testTaker.status === 'pending' && (
                          <div className="text-xs text-orange-600 mt-1">
                            Email failed - check address
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {testTaker.expiresAt 
                          ? new Date(testTaker.expiresAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(testTaker.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user?.role === 'superadmin' || ['pending', 'email_sent', 'expired'].includes(testTaker.status) ? (
                            <>
                              {['pending', 'email_sent', 'expired'].includes(testTaker.status) && (
                                <button
                                  onClick={() => handleResend(testTaker._id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Resend email"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleCancel(testTaker._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={user?.role === 'superadmin' ? 'Delete test taker' : 'Remove test taker'}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : null}
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

      {/* Add Test Taker Modal */}
      {showAddModal && (
        <AddTestTakerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTestTakers();
            if (isAdmin) fetchStats();
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setShowBulkImport(false);
            fetchTestTakers();
            if (isAdmin) fetchStats();
          }}
        />
      )}

      {/* Edit Test Taker Modal */}
      {showEditModal && (
        <EditTestTakerModal
          testTakers={testTakers.filter(tt => selectedTestTakers.includes(tt._id))}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTestTakers([]);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTestTakers([]);
            fetchTestTakers();
            if (isAdmin) fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default TestTakers;
