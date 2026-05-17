import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { creditService } from '../../services';
import {
  Coins, Plus, History, CheckCircle, XCircle, Trash2,
  ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2, X
} from 'lucide-react';

const statusStyles = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
  revoked:   'bg-amber-100 text-amber-700',
};
const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const IndividualCredits = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [credits, setCredits] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Request modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ creditsRequested: 10, reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [creditsRes, requestsRes] = await Promise.all([
        creditService.getCredits(),
        creditService.getMyCreditRequests(),
      ]);
      setCredits(creditsRes.data?.credits);
      setRequests(requestsRes.data?.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await creditService.requestCredits(form);
      setShowModal(false);
      setForm({ creditsRequested: 10, reason: '' });
      toast.success('Credit request submitted! We\'ll review it shortly.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this credit request?')) return;
    try {
      await creditService.cancelRequest(id);
      toast.success('Request cancelled');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const filtered = requests.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  );

  const remaining = Math.max(0, (credits?.total || 0) - (credits?.used || 0));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credits</h1>
          <p className="text-gray-500 mt-1">Manage your credit balance and purchase requests.</p>

          {/* Payment details */}
          <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-xl">
            <p className="text-sm text-amber-800 font-medium mb-1">Payment Details</p>
            <p className="text-sm text-amber-700">
              UPI — <span className="font-semibold">curate98103937@barodampay</span>
              <span className="mx-2">|</span>
              SBI A/C — <span className="font-semibold">42323602768</span>, IFSC — <span className="font-semibold">SBIN0015281</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Request Credits
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Credits</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{credits?.total || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Coins className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Used Credits</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{credits?.used || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{remaining}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowDownRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Credit cost reference */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Credit Cost per Assessment Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Personality / Big5 / DISC', cost: '5 credits', color: 'bg-indigo-50 text-indigo-700' },
            { label: 'Cognitive', cost: '8 credits', color: 'bg-purple-50 text-purple-700' },
            { label: 'Situational / Professional', cost: '3 credits', color: 'bg-green-50 text-green-700' },
          ].map(({ label, cost, color }) => (
            <div key={label} className={`p-3 rounded-lg text-center ${color}`}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-lg font-bold">{cost}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{filtered.length}</span> of{' '}
            <span className="font-medium text-gray-900">{requests.length}</span> requests
          </p>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Credit Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Granted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{req.creditsRequested} credits</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{req.reason}</td>
                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-4 text-sm">
                      {req.creditsGranted > 0
                        ? <span className="text-green-600 font-medium">{req.creditsGranted}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(req._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel request"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No credit requests yet. Click "Request Credits" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Request Credits</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              <p className="font-medium mb-1">How it works</p>
              <ol className="list-decimal ml-4 space-y-1 text-xs">
                <li>Submit this form with the number of credits you need</li>
                <li>Make payment using the UPI or bank details above</li>
                <li>Our team will approve within 24 hours after payment confirmation</li>
              </ol>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Credits</label>
                <input
                  type="number" required min="1"
                  value={form.creditsRequested}
                  onChange={e => setForm({ ...form, creditsRequested: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Each assessment uses 3–8 credits depending on type</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason / Note to Admin</label>
                <textarea
                  required rows={3}
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. I need credits to take the DISC assessment for my career evaluation"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualCredits;
