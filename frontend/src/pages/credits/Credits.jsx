import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { creditService, organizationService } from '../../services';
import {
  Coins,
  Plus,
  Search,
  History,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  RefreshCcw
} from 'lucide-react';

const Credits = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [creditRequests, setCreditRequests] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [creditSummary, setCreditSummary] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
  creditsRequested: 100,
  reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [approveForm, setApproveForm] = useState({ creditsGranted: 0, expiryInDays: '', expiryMode: 'preset', customExpiryDate: '' });
  const [approving, setApproving] = useState(false);

  const [selectedOrgDetail, setSelectedOrgDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrg, setFilterOrg] = useState('all');

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
  fetchData();
  }, []);

    const fetchData = async () => {
    try {
      setLoading(true);

      if (isSuperAdmin) {
        const [requestsRes, creditsRes] = await Promise.all([
          creditService.getCreditRequests(),
          creditService.getAllOrganizationCredits()
        ]);
        setCreditRequests(requestsRes.data?.requests || []);
        setCreditSummary(creditsRes.data?.summary);
        setAllOrganizations(creditsRes.data?.organizations || []);
      } else {
        const requestsResponse = await creditService.getMyCreditRequests();
        setCreditRequests(requestsResponse.data?.requests || []);
      }

      if (isAdmin && user?.organization) {
        const orgResponse = await organizationService.getMyOrganization();
        setOrganization(orgResponse.data?.organization);
      }

      const bankRes = await organizationService.getBankDetails().catch(() => null);
      setBankDetails(bankRes?.data?.bankDetails || null);
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
  toast.error(error.response?.data?.message || 'Failed to request credits');
  } finally {
 setSubmitting(false);
 }
 };

  const openApproveModal = (request) => {
    setApprovingRequest(request);
    setApproveForm({ creditsGranted: request.creditsRequested, expiryInDays: '', expiryMode: 'preset', customExpiryDate: '' });
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!approveForm.creditsGranted || approveForm.creditsGranted < 1) {
      toast.warning('Please enter a valid number of credits');
      return;
    }
    try {
      setApproving(true);
      await creditService.approveRequest(approvingRequest._id, {
        creditsGranted: parseInt(approveForm.creditsGranted),
        expiryInDays: approveForm.expiryMode === 'preset' && approveForm.expiryInDays ? parseInt(approveForm.expiryInDays) : null,
        expiryDate: approveForm.expiryMode === 'custom' && approveForm.customExpiryDate ? approveForm.customExpiryDate : null,
      });
      setShowApproveModal(false);
      setApprovingRequest(null);
      fetchData();
} catch (error) {
    console.error('Error approving request:', error);
    toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setApproving(false);
    }
  };

const handleRejectRequest = async (id) => {
  const notes = prompt('Enter rejection reason (optional):');
  try {
  await creditService.rejectRequest(id, { adminNotes: notes });
  fetchData();
} catch (error) {
    console.error('Error rejecting request:', error);
    toast.error('Failed to reject request');
  }
  };

  const handleRevokeRequest = async (id) => {
  if (!confirm('Are you sure you want to revoke these credits? This will subtract them from the organization\'s balance.')) return;
  const notes = prompt('Enter revocation reason (optional):');
  try {
  await creditService.revokeRequest(id, { adminNotes: notes });
  fetchData();
} catch (error) {
   console.error('Error revoking request:', error);
   toast.error(error.response?.data?.message || 'Failed to revoke credits');
  }
  };

  const handleDeleteRequest = async (id) => {
  if (!confirm('Are you sure you want to delete this credit request?')) return;
  try {
    await creditService.deleteRequest(id);
    fetchData();
} catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    }
  };

  const getStatusBadge = (status) => {
  const styles = {
  pending: 'bg-yellow-100 text-yellow-700 ',
  approved: 'bg-green-100 text-green-700 ',
  rejected: 'bg-red-100 text-red-700 ',
  cancelled: 'bg-gray-100 text-gray-700 ',
  revoked: 'bg-amber-100 text-amber-700 ',
  };
  return (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
  {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
  );
  };

  const filteredRequests = creditRequests.filter((request) => {
    const matchesSearch =
      request.requestedBy?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedBy?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedBy?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesOrg = filterOrg === 'all' || request.organization?._id === filterOrg;
    return matchesSearch && matchesStatus && matchesOrg;
  });

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
<h1 className="text-2xl font-bold text-gray-900 ">Credit Requests</h1>
<p className="text-gray-500 mt-1">Manage credit balance and requests</p>
{!isSuperAdmin && (
<div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
  <p className="text-sm text-amber-800 font-medium mb-1">Payment Details</p>
  {bankDetails ? (
    <div className="text-sm text-amber-700 space-y-1">
      {bankDetails.upiId && <p>Buy — <span className="font-semibold">{bankDetails.upiId}</span> (UPI)</p>}
      {(bankDetails.accountNumber || bankDetails.ifscCode) && (
        <p>
          {bankDetails.bankName && <span>{bankDetails.bankName} </span>}
          Account — <span className="font-semibold">{bankDetails.accountNumber}</span>
          {bankDetails.ifscCode && <>, IFSC — <span className="font-semibold">{bankDetails.ifscCode}</span></>}
        </p>
      )}
      {bankDetails.accountHolderName && (
        <p className="text-sm text-amber-600 font-medium">Account Holder: {bankDetails.accountHolderName}</p>
      )}
    </div>
  ) : (
    <p className="text-sm text-amber-600">No payment details configured yet.</p>
  )}
</div>
)}
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

  {/* Credit Summary Report (SuperAdmin) */}
  {isSuperAdmin && creditSummary && (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Credit Summary</h2>
        <Coins className="w-6 h-6 opacity-80" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div>
          <p className="text-xs text-indigo-200 uppercase tracking-wide">Organizations</p>
          <p className="text-2xl font-bold mt-1">{creditSummary.organizationCount}</p>
        </div>
        <div>
          <p className="text-xs text-indigo-200 uppercase tracking-wide">Total Credits</p>
          <p className="text-2xl font-bold mt-1">{creditSummary.totalCredits}</p>
        </div>
        <div>
          <p className="text-xs text-indigo-200 uppercase tracking-wide">Used</p>
          <p className="text-2xl font-bold mt-1">{creditSummary.totalUsed}</p>
        </div>
        <div>
          <p className="text-xs text-indigo-200 uppercase tracking-wide">Locked</p>
          <p className="text-2xl font-bold mt-1">{creditSummary.totalLocked}</p>
        </div>
        <div>
          <p className="text-xs text-indigo-200 uppercase tracking-wide">Available</p>
          <p className="text-2xl font-bold mt-1">{creditSummary.totalAvailable}</p>
        </div>
      </div>
    </div>
  )}

  {/* Credit Stats */}
   {organization?.credits && (
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
  <p className="text-sm text-gray-500 ">Locked Credits</p>
  <p className="text-3xl font-bold text-amber-600 mt-1">
  {organization.credits.locked || 0}
  </p>
  </div>
  <div className="p-3 bg-amber-100 rounded-lg">
  <Lock className="w-6 h-6 text-amber-600 " />
  </div>
  </div>
  </div>
  <div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center justify-between">
  <div>
  <p className="text-sm text-gray-500 ">Available</p>
  <p className="text-3xl font-bold text-green-600 mt-1">
  {Math.max(0, organization.credits.total - organization.credits.used - (organization.credits.locked || 0))}
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
 
  {/* All Organizations Credits (SuperAdmin Only) */}
  {isSuperAdmin && allOrganizations.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">All Organizations Credits</h2>
      <div className="text-sm text-gray-500">
        Total: <span className="font-bold text-indigo-600">{creditSummary?.totalCredits || 0}</span> | 
        Available: <span className="font-bold text-green-600">{creditSummary?.totalAvailable || 0}</span>
        {selectedOrgDetail && (
          <button onClick={() => setSelectedOrgDetail(null)} className="ml-3 text-xs text-indigo-600 hover:underline">Clear</button>
        )}
      </div>
    </div>

    {selectedOrgDetail && (
      <div className="mx-6 my-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{selectedOrgDetail.name}</h3>
          <button onClick={() => setSelectedOrgDetail(null)} className="text-xs text-indigo-600 hover:underline">Clear</button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{selectedOrgDetail.total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Used</p>
            <p className="text-xl font-bold text-orange-600 mt-0.5">{selectedOrgDetail.used}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Locked</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{selectedOrgDetail.locked}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">{selectedOrgDetail.available}</p>
          </div>
        </div>
      </div>
    )}

    <div className="overflow-x-auto">
     <table className="w-full">
       <thead className="bg-gray-50">
         <tr>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locked</th>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
         </tr>
       </thead>
       <tbody className="divide-y divide-gray-200">
          {allOrganizations.map((org) => (
            <tr
              key={org._id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedOrgDetail(selectedOrgDetail?._id === org._id ? null : { _id: org._id, name: org.name, total: org.credits.total, used: org.credits.used, locked: org.credits.locked, available: org.credits.available })}
            >
              <td className="px-6 py-4">
                <Link 
                  to={`/o/${org.slug}/dashboard`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {org.name}
                </Link>
                <p className="text-xs text-gray-400">{org.slug}</p>
              </td>
             <td className="px-6 py-4 text-sm font-bold text-gray-900">
               {org.credits.total}
             </td>
             <td className="px-6 py-4 text-sm text-orange-600">
               {org.credits.used}
             </td>
             <td className="px-6 py-4 text-sm text-amber-600">
               {org.credits.locked}
             </td>
             <td className="px-6 py-4 text-sm font-medium text-green-600">
               {org.credits.available}
             </td>
             <td className="px-6 py-4 text-sm text-gray-500">
               {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}
             </td>
           </tr>
         ))}
       </tbody>
     </table>
   </div>
 </div>
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
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Consumption by Assessment Type</h2>
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
 <div className="space-y-3">
  <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search by name, email, org, or reason..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
    {isSuperAdmin && (
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="cancelled">Cancelled</option>
        <option value="revoked">Revoked</option>
      </select>
    )}
    {!isSuperAdmin && (
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="revoked">Revoked</option>
      </select>
    )}
    {isSuperAdmin && allOrganizations.length > 0 && (
      <select
        value={filterOrg}
        onChange={(e) => setFilterOrg(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
      >
        <option value="all">All Organizations</option>
        {allOrganizations.map(org => (
          <option key={org._id} value={org._id}>{org.name}</option>
        ))}
      </select>
    )}
    {(filterStatus !== 'all' || filterOrg !== 'all' || searchQuery) && (
      <button
        onClick={() => { setFilterStatus('all'); setFilterOrg('all'); setSearchQuery(''); }}
        className="px-4 py-2 text-sm text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 font-medium"
      >
        Clear Filters
      </button>
    )}
  </div>
  <p className="text-sm text-gray-500">
    Showing <span className="font-medium text-gray-900">{filteredRequests.length}</span> of <span className="font-medium text-gray-900">{creditRequests.length}</span> requests
  </p>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-6 py-4 border-b border-gray-200 ">
  <h2 className="text-lg font-semibold text-gray-900 ">
  {isSuperAdmin ? 'Credit History' : 'My Requests'}
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
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
 {isSuperAdmin && (
 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
 )}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 ">
 {filteredRequests.map((request) => (
 <tr key={request._id} className="hover:bg-gray-50 ">
  {isSuperAdmin && (
  <td className="px-6 py-4">
  {request.requestType === 'individual' || !request.organization ? (
    <div>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 mb-1">Individual</span>
      <div className="text-sm text-gray-900">
        {request.requestedForUser?.firstName} {request.requestedForUser?.lastName}
      </div>
      <div className="text-xs text-gray-400">{request.requestedForUser?.email}</div>
    </div>
  ) : (
    <div className="text-sm text-gray-900">{request.organization?.name}</div>
  )}
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
 <td className="px-6 py-4">
  {request.expiryDate ? (
    (() => {
      const expiry = new Date(request.expiryDate);
      return (
        <div className="text-sm font-medium text-gray-900">
          {expiry.toLocaleDateString()}
        </div>
      );
    })()
 ) : request.status === 'approved' ? (
   <span className="text-xs text-green-600 font-medium">No Expiry</span>
 ) : (
   <span className="text-sm text-gray-400">—</span>
 )}
 </td>
 <td className="px-6 py-4 text-sm text-gray-500 ">
 {new Date(request.createdAt).toLocaleDateString()}
 </td>
  {isSuperAdmin && (
  <td className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-2">
  {request.status === 'pending' ? (
    <>
      <button
      onClick={() => openApproveModal(request)}
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
      <button
      onClick={() => handleDeleteRequest(request._id)}
      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      title="Delete"
      >
      <Trash2 className="w-4 h-4" />
      </button>
    </>
  ) : (
    <>
      <button
      onClick={() => handleRevokeRequest(request._id)}
      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
      title="Revoke Credits"
      >
      <RefreshCcw className="w-4 h-4" />
      </button>
      <button
      onClick={() => handleDeleteRequest(request._id)}
      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      title="Delete"
      >
      <Trash2 className="w-4 h-4" />
      </button>
    </>
  )}
  </div>
  </td>
  )}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {filteredRequests.length === 0 && (
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
  Reason <span className="text-gray-400 font-normal">(optional)</span>
  </label>
  <textarea
  rows={3}
  value={requestForm.reason}
  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
  placeholder="Why do you need these credits? (optional)"
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

  {/* Approve Modal */}
  {showApproveModal && approvingRequest && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-xl max-w-md w-full p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-1">Approve Credit Request</h2>
  <p className="text-sm text-gray-500 mb-4">
    {approvingRequest.requestedBy?.firstName} {approvingRequest.requestedBy?.lastName}
    &middot; {approvingRequest.creditsRequested} credits requested
  </p>
  <form onSubmit={handleConfirmApprove} className="space-y-4">
  <div>
   <label className="block text-sm font-medium text-gray-700 mb-1">
   Credits to Grant
   </label>
   <input
   type="number"
   required
   min="1"
   max={approvingRequest.creditsRequested}
   value={approveForm.creditsGranted}
   onChange={(e) => setApproveForm({ ...approveForm, creditsGranted: parseInt(e.target.value) || 0 })}
   className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
   />
   {approveForm.creditsGranted < approvingRequest.creditsRequested && (
     <p className="text-xs text-amber-600 mt-1">
       Remainder ({approvingRequest.creditsRequested - approveForm.creditsGranted} credits) will stay as a pending request for later approval.
     </p>
   )}
   </div>
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   Expiry Period
  </label>
  <div className="flex gap-4 mb-3">
   <label className="flex items-center gap-2 cursor-pointer">
    <input
     type="radio"
     name="expiryMode"
     value="preset"
     checked={approveForm.expiryMode === 'preset'}
     onChange={(e) => setApproveForm({ ...approveForm, expiryMode: e.target.value })}
     className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
    />
    <span className="text-sm text-gray-700">Preset Duration</span>
   </label>
   <label className="flex items-center gap-2 cursor-pointer">
    <input
     type="radio"
     name="expiryMode"
     value="custom"
     checked={approveForm.expiryMode === 'custom'}
     onChange={(e) => setApproveForm({ ...approveForm, expiryMode: e.target.value })}
     className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
    />
    <span className="text-sm text-gray-700">Custom Date</span>
   </label>
  </div>
  {approveForm.expiryMode === 'preset' ? (
   <select
   value={approveForm.expiryInDays}
   onChange={(e) => setApproveForm({ ...approveForm, expiryInDays: e.target.value })}
   className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
   >
   <option value="">No Expiry</option>
   <option value="30">30 Days</option>
   <option value="90">90 Days</option>
   <option value="180">180 Days</option>
   <option value="365">365 Days</option>
   </select>
  ) : (
   <div className="relative">
    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
     type="date"
     value={approveForm.customExpiryDate}
     min={new Date().toISOString().split('T')[0]}
     onChange={(e) => setApproveForm({ ...approveForm, customExpiryDate: e.target.value })}
     className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
    />
   </div>
  )}
  </div>
  <div className="flex gap-3 pt-4">
  <button
  type="button"
  onClick={() => { setShowApproveModal(false); setApprovingRequest(null); }}
  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 "
  >
  Cancel
  </button>
  <button
  type="submit"
  disabled={approving}
  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
  >
  {approving ? (
  <>
  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
  Approving...
  </>
  ) : (
  <>
  <CheckCircle className="w-4 h-4" />
  Approve & Grant
  </>
  )}
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
