import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle, Loader2, Lock, Unlock } from 'lucide-react';
import { assessmentService, testTakerService, organizationService, groupService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useEscapeKey } from '../hooks/useEscapeKey';

const AddTestTakerModal = ({ assessment: passedAssessment, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(passedAssessment || null);
  const [form, setForm] = useState({
    testTakerName: '',
    testTakerEmail: '',
    testTakerPhone: '',
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(!passedAssessment);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [myAllocation, setMyAllocation] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('single');

  // Group flow state
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEscapeKey(onClose);

  // Calculate available slots
  const getSlotsRemaining = () => {
    if (isSuperAdmin) return Infinity;
    if (myAllocation?.allocated) {
      return Math.max(0, myAllocation.testsRemaining);
    }
    if (selectedAssessment?.orgUnlockInfo) {
      return Math.max(0, selectedAssessment.orgUnlockInfo.testsRemaining);
    }
    return null;
  };

  const slotsRemaining = getSlotsRemaining();
  const hasNoSlots = slotsRemaining !== Infinity && slotsRemaining !== null && slotsRemaining <= 0;

  useEffect(() => {
    if (!passedAssessment) {
      fetchAssessments();
    } else {
      fetchMyAllocation(passedAssessment._id);
    }
  }, [passedAssessment]);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchMyAllocation = async (assessmentId) => {
    try {
      const res = await assessmentService.getMyAllocation(assessmentId);
      if (res.success) {
        setMyAllocation(res.data);
      }
    } catch (err) {
      console.error('Error fetching allocation:', err);
    }
  };

  const fetchAssessments = async () => {
    try {
      setLoadingAssessments(true);
      const response = await assessmentService.getAssessments({ status: 'active', limit: 50 });
      const allAssessments = response.data?.assessments || [];
      
      if (isSuperAdmin) {
        setAssessments(allAssessments);
      } else {
        const unlocked = allAssessments.filter(a => !a.isLocked || a.memberAllocation);
        setAssessments(unlocked);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleSelectAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    if (!isSuperAdmin) {
      fetchMyAllocation(assessment._id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) {
      setError('Please select an assessment');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        assessmentId: selectedAssessment._id,
        testTakerName: form.testTakerName.trim(),
        testTakerEmail: form.testTakerEmail.trim(),
        testTakerPhone: form.testTakerPhone.trim()
      };

      // Add expiresAt if provided
      if (form.expiresAt) {
        payload.expiresAt = form.expiresAt;
      }

      const response = await testTakerService.createInvite(payload);

      if (response.success) {
        if (response.data?.emailSent) {
          setSuccess('Test taker added successfully! Email delivered.');
        } else {
          setError(`Email not sent. Please provide a valid email address. Test taker added with pending status - you can resend later.`);
        }
        setForm({ testTakerName: '', testTakerEmail: '', testTakerPhone: '', expiresAt: '' });
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add test taker');
    } finally {
      setLoading(false);
    }
  };

  // ==================== Group Functions ====================

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await groupService.getGroups();
      const allGroups = response.data?.groups || [];
      setGroups(allGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupChange = async (e) => {
    const groupId = e.target.value;
    if (!groupId) {
      setSelectedGroup(null);
      setGroupDetails(null);
      setSelectedContactIds([]);
      setSelectedMemberIds([]);
      return;
    }

    const group = groups.find(g => g._id === groupId);
    setSelectedGroup(group);
    setLoadingGroupDetails(true);
    setSelectedContactIds([]);
    setSelectedMemberIds([]);

    try {
      const res = await groupService.getGroup(groupId);
      if (res.success) {
        setGroupDetails(res.data?.group || null);
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
    } finally {
      setLoadingGroupDetails(false);
    }
  };

  // Derive people list from selected group
  const people = selectedGroup?.groupType === 'team'
    ? (groupDetails?.members || [])
    : (groupDetails?.contacts || []);

  const getPersonId = (person) => person._id;
  const getPersonName = (person) => {
    if (selectedGroup?.groupType === 'team') {
      return `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
    }
    return person.name || 'Unknown';
  };
  const getPersonEmail = (person) => {
    if (selectedGroup?.groupType === 'team') {
      return person.email || '';
    }
    return person.email || '';
  };

  const selectedCount = selectedContactIds.length + selectedMemberIds.length;
  const totalCount = people.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      if (selectedGroup?.groupType === 'team') {
        setSelectedMemberIds(people.map(p => getPersonId(p)));
      } else {
        setSelectedContactIds(people.map(p => getPersonId(p)));
      }
    } else {
      setSelectedContactIds([]);
      setSelectedMemberIds([]);
    }
  };

  const togglePerson = (person) => {
    const id = getPersonId(person);
    if (selectedGroup?.groupType === 'team') {
      setSelectedMemberIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedContactIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const isPersonSelected = (person) => {
    const id = getPersonId(person);
    if (selectedGroup?.groupType === 'team') {
      return selectedMemberIds.includes(id);
    }
    return selectedContactIds.includes(id);
  };

  const handleBulkSubmit = async () => {
    if (!selectedAssessment || !selectedGroup) return;

    setBulkLoading(true);
    setError(null);
    setBulkResults(null);
    setSuccess(null);

    try {
      const payload = {
        assessmentId: selectedAssessment._id,
        groupId: selectedGroup._id,
        selectedContactIds,
        selectedMemberIds
      };

      if (form.expiresAt) {
        payload.expiresAt = form.expiresAt;
      }

      const response = await testTakerService.bulkInviteFromGroup(payload);

      if (response.success) {
        setBulkResults(response.data);
        if (response.data.failed === 0 && response.data.skipped === 0) {
          setSuccess('All invitations sent successfully!');
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        } else {
          setSuccess(`Invitations processed: ${response.data.successful} created, ${response.data.skipped} skipped, ${response.data.failed} failed`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send bulk invitations');
    } finally {
      setBulkLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const styles = {
      created: 'bg-green-100 text-green-700',
      duplicate: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-700',
      no_slots: 'bg-red-100 text-red-700'
    };
    const labels = {
      created: 'Created',
      duplicate: 'Duplicate',
      failed: 'Failed',
      no_slots: 'No Slots'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ==================== Render ====================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Test Taker</h2>
            <p className="text-sm text-gray-500 mt-1">Send an assessment invitation via email</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'single'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Single Invite
          </button>
          <button
            onClick={() => setActiveTab('fromGroup')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'fromGroup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            From Group
          </button>
        </div>

        {/* Assessment Selector (if no assessment passed) */}
        {!passedAssessment && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Assessment
            </label>
            {loadingAssessments ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading assessments...
              </div>
            ) : assessments.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                No unlocked assessments available. Admin must unlock assessments first.
              </p>
            ) : (
              <select
                value={selectedAssessment?._id || ''}
                onChange={(e) => {
                  const a = assessments.find(a => a._id === e.target.value);
                  handleSelectAssessment(a);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose an assessment...</option>
                {assessments.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.title} ({a.category})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Selected Assessment Info */}
        {selectedAssessment && passedAssessment && (
          <div className="bg-gray-50 rounded-lg p-4 mb-5">
            <h3 className="font-semibold text-gray-900">{selectedAssessment.title}</h3>
            <p className="text-sm text-gray-500 capitalize">
              {selectedAssessment.category} &middot; {selectedAssessment.totalQuestions || 0} questions
            </p>
          </div>
        )}

        {/* Slot Info */}
        {isSuperAdmin ? (
          <div className="bg-indigo-50 rounded-lg p-3 mb-5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <p className="text-sm text-indigo-700">
              Direct Mindmil test - no slot restrictions
            </p>
          </div>
        ) : hasNoSlots ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-semibold">No test slots remaining</p>
              <p className="text-red-600 mt-1">You have used all your allocated slots for this assessment. Contact your admin to request more slots.</p>
            </div>
          </div>
        ) : myAllocation?.allocated ? (
          <div className={`rounded-lg p-3 mb-5 flex items-center gap-2 ${slotsRemaining <= 2 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${slotsRemaining <= 2 ? 'text-amber-600' : 'text-emerald-600'}`} />
            <p className={`text-sm ${slotsRemaining <= 2 ? 'text-amber-700' : 'text-emerald-700'}`}>
              <span className="font-semibold">{slotsRemaining}</span> of {myAllocation.testsAllowed} slots remaining
              {myAllocation.activeInvites > 0 && <span> ({myAllocation.activeInvites} active)</span>}
            </p>
          </div>
        ) : selectedAssessment?.orgUnlockInfo ? (
          <div className={`rounded-lg p-3 mb-5 flex items-center gap-2 ${slotsRemaining !== null && slotsRemaining <= 2 ? 'bg-amber-50' : 'bg-indigo-50'}`}>
            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${slotsRemaining !== null && slotsRemaining <= 2 ? 'text-amber-600' : 'text-indigo-600'}`} />
            <p className={`text-sm ${slotsRemaining !== null && slotsRemaining <= 2 ? 'text-amber-700' : 'text-indigo-700'}`}>
              {slotsRemaining} test slots remaining
            </p>
          </div>
        ) : selectedAssessment ? (
          <div className="bg-amber-50 rounded-lg p-3 mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              No slots allocated to you for this assessment. Contact your admin.
            </p>
          </div>
        ) : null}

        {/* ===== Single Invite Tab ===== */}
        {activeTab === 'single' && (
          <form onSubmit={handleSubmit} className={`space-y-4 ${hasNoSlots ? 'opacity-40 pointer-events-none relative' : ''}`}>
            {hasNoSlots && (
              <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium">
                  No slots available
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Taker Name *
              </label>
              <input
                type="text"
                required
                value={form.testTakerName}
                onChange={(e) => setForm({ ...form, testTakerName: e.target.value })}
                placeholder="Full name of the test taker"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={form.testTakerEmail}
                onChange={(e) => setForm({ ...form, testTakerEmail: e.target.value })}
                placeholder="test.taker@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={form.testTakerPhone}
                onChange={(e) => setForm({ ...form, testTakerPhone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expire Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use default 30 days</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedAssessment || hasNoSlots}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ===== From Group Tab ===== */}
        {activeTab === 'fromGroup' && (
          <div className="space-y-4">
            {/* Group Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Group
              </label>
              {loadingGroups ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No groups available. Create a group first.
                </p>
              ) : (
                <select
                  value={selectedGroup?._id || ''}
                  onChange={handleGroupChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a group...</option>
                  {groups.map(g => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.groupType === 'team' ? 'Team' : 'Contacts'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* People List */}
            {selectedGroup && (
              <div>
                {loadingGroupDetails ? (
                  <div className="flex items-center gap-2 text-gray-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading group members...
                  </div>
                ) : people.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    This group has no {selectedGroup.groupType === 'team' ? 'members' : 'contacts'}.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select {selectedGroup.groupType === 'team' ? 'Members' : 'Contacts'}
                      </label>
                      <span className="text-xs text-gray-500">
                        {selectedCount} of {totalCount} selected
                      </span>
                    </div>

                    {/* Select All */}
                    <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Select All</span>
                    </label>

                    {/* Scrollable People List */}
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {people.map(person => (
                        <label
                          key={getPersonId(person)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isPersonSelected(person)}
                            onChange={() => togglePerson(person)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getPersonName(person)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {getPersonEmail(person)}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Expire Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expire Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use default 30 days</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Results Table */}
            {bulkResults && bulkResults.results && bulkResults.results.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Invitation Results</h4>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bulkResults.results.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-gray-900">{r.name}</td>
                          <td className="px-3 py-2 text-gray-500">{r.email}</td>
                          <td className="px-3 py-2">{renderStatusBadge(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {bulkResults.successful} successful
                  {bulkResults.skipped > 0 && `, ${bulkResults.skipped} skipped`}
                  {bulkResults.failed > 0 && `, ${bulkResults.failed} failed`}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={bulkLoading || !selectedAssessment || !selectedGroup || selectedCount === 0 || hasNoSlots}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Invite Selected ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddTestTakerModal;
