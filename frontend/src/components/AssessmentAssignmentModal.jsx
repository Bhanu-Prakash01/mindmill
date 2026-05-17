import React, { useState, useEffect } from 'react';
import { assessmentService, groupService, userService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
  X, Users, UserCheck, Search, Check, AlertTriangle,
  CheckCircle, Plus, Minus, Loader2, UserPlus, UserMinus
} from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

const AssessmentAssignmentModal = ({ assessment, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState(assessment.assignedUsers || []);
  const [assignedGroups, setAssignedGroups] = useState(assessment.assignedGroups || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [memberSlots, setMemberSlots] = useState({});
  const [existingAllocs, setExistingAllocs] = useState({});
  const [serverSearchQuery, setServerSearchQuery] = useState('');

  useEscapeKey(onClose);

  useEffect(() => {
    fetchData('');
    fetchAllocations();
  }, []);

  useEffect(() => {
    if (assessment) {
      setAssignedUsers(assessment.assignedUsers || []);
      setAssignedGroups(assessment.assignedGroups || []);
    }
  }, [assessment]);

  const fetchAllocations = async () => {
    try {
      const res = await assessmentService.getAllocations(assessment._id);
      if (res.success) {
        const allocMap = {};
        (res.data.allocations || []).forEach(a => {
          if (a.member?._id) allocMap[a.member._id] = a;
        });
        setExistingAllocs(allocMap);
      }
    } catch (err) {
      console.error('Error fetching allocations:', err);
    }
  };

  const fetchData = async (search = '') => {
    setLoading(true);
    try {
      const orgId = currentUser?.organization?._id || currentUser?.organization;
      const params = { limit: 100 };
      if (orgId) params.organization = orgId;

      const [usersRes, groupsRes] = await Promise.all([
        userService.getUsers({ search, ...params }),
        groupService.getGroups(params)
      ]);
      setUsers(usersRes.data?.users || []);
      setGroups(groupsRes.data?.groups || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(serverSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [serverSearchQuery]);

  const handleUnassignUsers = async (userIds) => {
    setSaving(true);
    setError(null);
    try {
      await assessmentService.unassign(assessment._id, userIds, []);
      setAssignedUsers(assignedUsers.filter(u => !userIds.includes(u._id || u)));
      const newSlots = { ...memberSlots };
      userIds.forEach(id => delete newSlots[id]);
      setMemberSlots(newSlots);
      onSuccess?.();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignGroups = async (groupIds) => {
    setSaving(true);
    setError(null);
    try {
      await assessmentService.unassign(assessment._id, [], groupIds);
      setAssignedGroups(assignedGroups.filter(g => !groupIds.includes(g._id || g)));
      onSuccess?.();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove group');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const setSlotValue = (userId, value) => {
    const alloc = existingAllocs[userId];
    const minVal = alloc?.testsDistributed || 0;
    const clamped = Math.max(minVal, Math.max(0, value));
    setMemberSlots(prev => ({ ...prev, [userId]: clamped }));
  };

  const getSlotValue = (userId) => {
    if (memberSlots[userId] !== undefined) return memberSlots[userId];
    return existingAllocs[userId]?.testsAllowed ?? 0;
  };

  const totalNewSlots = selectedUserIds.reduce((sum, id) => {
    return sum + (memberSlots[id] || 0);
  }, 0);

  const handleAssignSelected = async () => {
    if (selectedUserIds.length === 0 && selectedGroupIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const slotsToSend = {};
      selectedUserIds.forEach(id => {
        if (memberSlots[id] > 0) slotsToSend[id] = memberSlots[id];
      });

      let res;
      if (selectedUserIds.length > 0) {
        res = await assessmentService.assignToUsers(assessment._id, selectedUserIds, slotsToSend);
        const newUsers = users.filter(u => selectedUserIds.includes(u._id));
        setAssignedUsers(prev => [...prev, ...newUsers]);
      }
      if (selectedGroupIds.length > 0) {
        res = await assessmentService.assignToGroups(assessment._id, selectedGroupIds);
        const newGroups = groups.filter(g => selectedGroupIds.includes(g._id));
        setAssignedGroups(prev => [...prev, ...newGroups]);
      }
      if (res?.data?.allocations) {
        const allocMap = {};
        res.data.allocations.forEach(a => {
          if (a.member?._id) allocMap[a.member._id] = a;
        });
        setExistingAllocs(prev => ({ ...prev, ...allocMap }));
      }
      setSelectedUserIds([]);
      setSelectedGroupIds([]);
      setMemberSlots({});
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add members');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlots = async (userId) => {
    const slots = memberSlots[userId];
    if (slots === undefined) return;
    setSaving(true);
    setError(null);
    try {
      const res = await assessmentService.assignToUsers(assessment._id, [], { [userId]: slots });
      if (res?.data?.allocations) {
        const allocMap = {};
        res.data.allocations.forEach(a => {
          if (a.member?._id) allocMap[a.member._id] = a;
        });
        setExistingAllocs(prev => ({ ...prev, ...allocMap }));
      }
      setMemberSlots(prev => { const next = { ...prev }; delete next[userId]; return next; });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update slots');
    } finally {
      setSaving(false);
    }
  };

  const assignedUserIds = assignedUsers.map(u => u._id || u);
  const assignedGroupIds = assignedGroups.map(g => g._id || g);

  const availableUsers = users.filter(u => !assignedUserIds.includes(u._id) && u.role !== 'admin' && u.role !== 'superadmin');
  const availableGroups = groups.filter(g => !assignedGroupIds.includes(g._id));

  const isUserSelected = (userId) => selectedUserIds.includes(userId);
  const isGroupSelected = (groupId) => selectedGroupIds.includes(groupId);

  const stats = {
    totalMembers: assignedUsers.length,
    slotsUsed: Object.values(existingAllocs).reduce((s, a) => s + (a.testsDistributed || 0), 0),
    slotsAllowed: Object.values(existingAllocs).reduce((s, a) => s + (a.testsAllowed || 0), 0)
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Section */}
          <div className="flex items-center justify-between px-6 py-4 bg-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Members</h2>
              <p className="text-xs text-indigo-200">{assessment.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-indigo-50 border-b border-indigo-100">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900">{stats.totalMembers}</span>
              <span className="text-xs text-gray-500">members</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-900">{stats.slotsUsed}</span>
              <span className="text-xs text-gray-500">/ {stats.slotsAllowed} slots used</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${assignedUsers.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {assignedUsers.length > 0 ? 'Active' : 'No members yet'}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'members' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Add Members
            <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">{availableUsers.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'groups' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Add Groups
            <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">{availableGroups.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'assigned' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Assigned
            <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{assignedUsers.length}</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'members' && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members to add..."
                  value={serverSearchQuery}
                  onChange={(e) => setServerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No members available to add</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <div
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isUserSelected(user._id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isUserSelected(user._id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'
                      }`}>
                        {isUserSelected(user._id) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {isUserSelected(user._id) && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Slots:</span>
                            <div className="flex items-center gap-1 flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSlotValue(user._id, (memberSlots[user._id] || 0) - 1); }}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={memberSlots[user._id] ?? 0}
                                onChange={(e) => setSlotValue(user._id, parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-14 text-center font-bold border border-gray-200 rounded-lg py-1"
                              />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSlotValue(user._id, (memberSlots[user._id] || 0) + 1); }}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No groups available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableGroups.map(group => (
                    <div
                      key={group._id}
                      onClick={() => toggleGroupSelection(group._id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isGroupSelected(group._id) ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isGroupSelected(group._id) ? 'bg-purple-500 border-purple-500' : 'border-gray-300 bg-white'
                      }`}>
                        {isGroupSelected(group._id) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{group.name}</p>
                        <p className="text-xs text-gray-500">{group.members?.length || 0} members</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assigned' && (
            <div>
              {assignedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No members assigned yet</p>
                  <button onClick={() => setActiveTab('members')} className="mt-3 text-indigo-600 font-medium text-sm hover:underline">
                    Add members →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedUsers.map(user => {
                    const userId = user._id || user;
                    const alloc = existingAllocs[userId];
                    const slotVal = getSlotValue(userId);
                    const hasPendingChange = memberSlots[userId] !== undefined;

                    return (
                      <div key={userId} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${hasPendingChange ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-white'}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-600">{alloc?.testsDistributed || 0} used</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-indigo-600 font-medium">{slotVal} total</span>
                            {alloc?.testsRemaining > 0 && <span className="text-amber-600">({alloc.testsRemaining} left)</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1 flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSlotValue(userId, slotVal - 1)}
                                disabled={slotVal <= (alloc?.testsDistributed || 0)}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min={alloc?.testsDistributed || 0}
                                value={slotVal}
                                onChange={(e) => setSlotValue(userId, parseInt(e.target.value) || 0)}
                                className="w-14 text-center font-bold border border-gray-200 rounded-lg py-1"
                              />
                              <button
                                type="button"
                                onClick={() => setSlotValue(userId, slotVal + 1)}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                          </div>
                          {hasPendingChange && (
                            <button onClick={() => handleUpdateSlots(userId)} disabled={saving} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg">
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                          )}
                          <button onClick={() => handleUnassignUsers([userId])} disabled={saving} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {selectedUserIds.length > 0 || selectedGroupIds.length > 0 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-indigo-600">{selectedUserIds.length}</span> members selected
                {selectedGroupIds.length > 0 && <span> + <span className="font-semibold text-purple-600">{selectedGroupIds.length}</span> groups</span>}
                {totalNewSlots > 0 && <span className="ml-2 text-emerald-600">({totalNewSlots} slots)</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedUserIds([]); setSelectedGroupIds([]); setMemberSlots({}); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
                <button
                  onClick={handleAssignSelected}
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Members
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentAssignmentModal;