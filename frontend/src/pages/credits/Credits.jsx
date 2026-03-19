import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { creditService, organizationService } from '../../services';
import {
 Coins,
 Plus,
 History,
 CheckCircle,
 XCircle,
 Clock,
 AlertCircle,
 Building2,
 ArrowUpRight,
 ArrowDownRight
} from 'lucide-react';

const Credits = () => {
 const { user } = useAuth();
  const [creditRequests, setCreditRequests] = useState([]);
  const [organization, setOrganization] = useState(null);
 const [loading, setLoading] = useState(true);
 const [showRequestModal, setShowRequestModal] = useState(false);
 const [requestForm, setRequestForm] = useState({
 creditsRequested: 100,
 reason: '',
 });
 const [submitting, setSubmitting] = useState(false);

 const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
 const isSuperAdmin = user?.role === 'superadmin';

 useEffect(() => {
 fetchData();
 }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get credit requests
      const requestsResponse = isSuperAdmin
        ? await creditService.getCreditRequests()
        : await creditService.getMyCreditRequests();
      setCreditRequests(requestsResponse.data?.requests || []);

      // Get organization details for admins
      if (isAdmin && user?.organization) {
        const orgResponse = await organizationService.getMyOrganization();
        setOrganization(orgResponse.data?.organization);
      }
    } catch (error) {
      console.error('Error fetching credit data:', error);
    } finally {
      setLoading(false);
    }
  };

 const handleRequestCredits = async (e) => {
 e.preventDefault();
 setSubmitting(true);
 try {
 await creditService.requestCredits(requestForm);
 setShowRequestModal(false);
 setRequestForm({ creditsRequested: 100, reason: '' });
 fetchData();
 } catch (error) {
 console.error('Error requesting credits:', error);
 alert(error.response?.data?.message || 'Failed to request credits');
 } finally {
 setSubmitting(false);
 }
 };

  const handleApproveRequest = async (id) => {
  const creditsGranted = prompt('Enter number of credits to grant:');
  if (!creditsGranted) return;

  const expiryOptions = 'Select expiry period:\n1. 30 days\n2. 90 days\n3. 180 days\n4. 365 days\n5. No expiry';
  const expiryChoice = prompt(expiryOptions);
  
  let expiryInDays = null;
  switch (expiryChoice) {
    case '1': expiryInDays = 30; break;
    case '2': expiryInDays = 90; break;
    case '3': expiryInDays = 180; break;
    case '4': expiryInDays = 365; break;
    case '5': expiryInDays = null; break;
    default: alert('Invalid selection'); return;
  }

  try {
  await creditService.approveRequest(id, {
  creditsGranted: parseInt(creditsGranted),
  expiryInDays,
  });
  fetchData();
  } catch (error) {
  console.error('Error approving request:', error);
  alert('Failed to approve request');
  }
  };

 const handleRejectRequest = async (id) => {
 const notes = prompt('Enter rejection reason (optional):');
 try {
 await creditService.rejectRequest(id, { adminNotes: notes });
 fetchData();
 } catch (error) {
 console.error('Error rejecting request:', error);
 alert('Failed to reject request');
 }
 };

 const getStatusBadge = (status) => {
 const styles = {
 pending: 'bg-yellow-100 text-yellow-700 ',
 approved: 'bg-green-100 text-green-700 ',
 rejected: 'bg-red-100 text-red-700 ',
 cancelled: 'bg-gray-100 text-gray-700 ',
 };
 return (
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
 {status.charAt(0).toUpperCase() + status.slice(1)}
 </span>
 );
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Credits</h1>
 <p className="text-gray-500 mt-1">Manage credit balance and requests</p>
 </div>
 {!isSuperAdmin && (
 <button
 onClick={() => setShowRequestModal(true)}
 className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
 >
 <Plus className="w-4 h-4 mr-2" />
 Request Credits
 </button>
 )}
 </div>

 {/* Credit Stats */}
  {organization?.credits && (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center justify-between">
  <div>
  <p className="text-sm text-gray-500 ">Total Credits</p>
  <p className="text-3xl font-bold text-gray-900 mt-1">
  {organization.credits.total}
  </p>
  </div>
  <div className="p-3 bg-indigo-100 rounded-lg">
  <Coins className="w-6 h-6 text-indigo-600 " />
  </div>
  </div>
  </div>
  <div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center justify-between">
  <div>
  <p className="text-sm text-gray-500 ">Used Credits</p>
  <p className="text-3xl font-bold text-gray-900 mt-1">
  {organization.credits.used}
  </p>
  </div>
  <div className="p-3 bg-orange-100 rounded-lg">
  <ArrowUpRight className="w-6 h-6 text-orange-600 " />
  </div>
  </div>
  </div>
  <div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center justify-between">
  <div>
  <p className="text-sm text-gray-500 ">Remaining</p>
  <p className="text-3xl font-bold text-gray-900 mt-1">
  {organization.credits.remaining}
  </p>
  </div>
  <div className="p-3 bg-green-100 rounded-lg">
  <ArrowDownRight className="w-6 h-6 text-green-600 " />
  </div>
  </div>
  </div>
  </div>
  )}

  {/* Credit Batches */}
  {organization?.credits?.batches && organization.credits.batches.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200">
  <h2 className="text-lg font-semibold text-gray-900">Credit Batches & Expiry</h2>
  </div>
  <div className="overflow-x-auto">
  <table className="w-full">
  <thead className="bg-gray-50">
  <tr>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased</th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
  {organization.credits.batches.map((batch, index) => {
    const available = batch.amount - batch.used;
    const isExpired = batch.expiresAt && new Date(batch.expiresAt) < new Date();
    const daysUntilExpiry = batch.expiresAt ? Math.ceil((new Date(batch.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    
    return (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm text-gray-900">
          {new Date(batch.purchasedAt).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-gray-900">
          {batch.amount}
        </td>
        <td className="px-6 py-4 text-sm text-orange-600">
          {batch.used}
        </td>
        <td className="px-6 py-4 text-sm font-medium text-green-600">
          {available}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {batch.expiresAt ? new Date(batch.expiresAt).toLocaleDateString() : 'No expiry'}
        </td>
        <td className="px-6 py-4">
          {isExpired ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>
          ) : daysUntilExpiry !== null && daysUntilExpiry <= 30 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              {daysUntilExpiry} days left
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
          )}
        </td>
      </tr>
    );
  })}
  </tbody>
  </table>
  </div>
  </div>
  )}

  {/* Credit Cost Reference */}
  <div className="bg-white rounded-xl border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Cost by Assessment Type</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    <div className="p-3 bg-indigo-50 rounded-lg text-center">
      <p className="text-sm text-gray-600">Psychometric/Big5/DISC</p>
      <p className="text-xl font-bold text-indigo-700">5 credits</p>
    </div>
    <div className="p-3 bg-purple-50 rounded-lg text-center">
      <p className="text-sm text-gray-600">Cognitive</p>
      <p className="text-xl font-bold text-purple-700">8 credits</p>
    </div>
    <div className="p-3 bg-green-50 rounded-lg text-center">
      <p className="text-sm text-gray-600">Situational/Professional</p>
      <p className="text-xl font-bold text-green-700">3 credits</p>
    </div>
  </div>
  </div>

 {/* Credit Requests */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-6 py-4 border-b border-gray-200 ">
 <h2 className="text-lg font-semibold text-gray-900 ">
 {isSuperAdmin ? 'All Credit Requests' : 'My Credit Requests'}
 </h2>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 ">
 <tr>
 {isSuperAdmin && (
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
 )}
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
 {isSuperAdmin && (
 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
 )}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 ">
 {creditRequests.map((request) => (
 <tr key={request._id} className="hover:bg-gray-50 ">
 {isSuperAdmin && (
 <td className="px-6 py-4">
 <div className="text-sm text-gray-900 ">
 {request.organization?.name}
 </div>
 </td>
 )}
 <td className="px-6 py-4">
 <div className="text-sm text-gray-900 ">
 {request.requestedBy?.firstName} {request.requestedBy?.lastName}
 </div>
 <div className="text-sm text-gray-500 ">{request.requestedBy?.email}</div>
 </td>
 <td className="px-6 py-4">
 <div className="text-sm font-medium text-gray-900 ">
 {request.creditsRequested} credits
 </div>
 {request.creditsGranted > 0 && (
 <div className="text-xs text-green-600 ">
 Granted: {request.creditsGranted}
 </div>
 )}
 </td>
 <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
 <td className="px-6 py-4 text-sm text-gray-500 ">
 {new Date(request.createdAt).toLocaleDateString()}
 </td>
 {isSuperAdmin && request.status === 'pending' && (
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => handleApproveRequest(request._id)}
 className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
 title="Approve"
 >
 <CheckCircle className="w-4 h-4" />
 </button>
 <button
 onClick={() => handleRejectRequest(request._id)}
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
 title="Reject"
 >
 <XCircle className="w-4 h-4" />
 </button>
 </div>
 </td>
 )}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {creditRequests.length === 0 && (
 <div className="text-center py-12">
 <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 ">No credit requests found</p>
 </div>
 )}
 </div>

 {/* Request Modal */}
 {showRequestModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl max-w-md w-full p-6">
 <h2 className="text-xl font-bold text-gray-900 mb-4">Request Credits</h2>
 <form onSubmit={handleRequestCredits} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Number of Credits
 </label>
 <input
 type="number"
 required
 min="1"
 value={requestForm.creditsRequested}
 onChange={(e) => setRequestForm({ ...requestForm, creditsRequested: parseInt(e.target.value) || 0 })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Reason
 </label>
 <textarea
 required
 rows={3}
 value={requestForm.reason}
 onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Why do you need these credits?"
 />
 </div>
 <div className="flex gap-3 pt-4">
 <button
 type="button"
 onClick={() => setShowRequestModal(false)}
 className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 "
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
 >
 {submitting ? 'Submitting...' : 'Submit Request'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default Credits;
