import React, { useState, useEffect } from 'react';
import { assessmentService, groupService, userService } from '../services';
import { X, Users, UserCheck, Search, Check, AlertTriangle, Info, FileText, CheckCircle, Lock, Unlock } from 'lucide-react';

const AssessmentAssignmentModal = ({ assessment, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState(assessment.assignedUsers || []);
  const [assignedGroups, setAssignedGroups] = useState(assessment.assignedGroups || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [unlockStats, setUnlockStats] = useState(assessment.orgUnlockInfo ? {
    testsAllowed: assessment.orgUnlockInfo.testsAllowed,
    testsUsed: assessment.orgUnlockInfo.testsUsed,
    testsRemaining: Math.max(0, assessment.orgUnlockInfo.testsAllowed - (assessment.assignedUsers?.length || 0)),
    testsLocked: Math.max(0, (assessment.assignedUsers || []).length - (assessment.orgUnlockInfo.testsUsed || 0))
  } : null);

  useEffect(() => {
    fetchData('');
  }, []);

  // Sync state if assessment prop updates from parent
  useEffect(() => {
    if (assessment) {
      setAssignedUsers(assessment.assignedUsers || []);
      setAssignedGroups(assessment.assignedGroups || []);
    }
  }, [assessment]);

  const fetchData = async (search = '') => {
    setLoading(true);
    try {
      const [usersRes, groupsRes] = await Promise.all([
        userService.getUsers({ search, limit: 100 }),
        groupService.getGroups({ limit: 100 })
      ]);
      setUsers(usersRes.data?.users || []);
      setGroups(groupsRes.data?.groups || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search for server-side search
  const [serverSearchQuery, setServerSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(serverSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [serverSearchQuery]);

  const handleUnassignUsers = async (userIds) => {
    setSaving(true);
    try {
      const res = await assessmentService.unassign(assessment._id, userIds, []);
      setAssignedUsers(assignedUsers.filter(u => !userIds.includes(u._id || u)));
      if (res.data?.unlockStats) setUnlockStats(res.data.unlockStats);
      onSuccess?.();
    } catch (error) {
      console.error('Error unassigning users:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignGroups = async (groupIds) => {
    setSaving(true);
    try {
      const res = await assessmentService.unassign(assessment._id, [], groupIds);
      setAssignedGroups(assignedGroups.filter(g => !groupIds.includes(g._id || g)));
      if (res.data?.unlockStats) setUnlockStats(res.data.unlockStats);
      onSuccess?.();
    } catch (error) {
      console.error('Error unassigning groups:', error);
    } finally {
      setSaving(false);
    }
  };

  const assignedUserIds = assignedUsers.map(u => u._id || u);
  const assignedGroupIds = assignedGroups.map(g => g._id || g);

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === availableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(availableUsers.map(u => u._id));
    }
  };

  const selectAllGroups = () => {
    if (selectedGroupIds.length === availableGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(availableGroups.map(g => g._id));
    }
  };

  const handleAssignSelected = async () => {
    if (selectedUserIds.length === 0 && selectedGroupIds.length === 0) return;
    
    setSaving(true);
    try {
      let res;
      if (selectedUserIds.length > 0) {
        res = await assessmentService.assignToUsers(assessment._id, selectedUserIds);
        const newUsers = users.filter(u => selectedUserIds.includes(u._id));
        setAssignedUsers(prev => [...prev, ...newUsers]);
      }
      if (selectedGroupIds.length > 0) {
        res = await assessmentService.assignToGroups(assessment._id, selectedGroupIds);
        const newGroups = groups.filter(g => selectedGroupIds.includes(g._id));
        setAssignedGroups(prev => [...prev, ...newGroups]);
      }
      if (res?.data?.unlockStats) setUnlockStats(res.data.unlockStats);
      setSelectedUserIds([]);
      setSelectedGroupIds([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error assigning:', error);
      alert(error.response?.data?.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const isUserSelected = (userId) => selectedUserIds.includes(userId);
  const isGroupSelected = (groupId) => selectedGroupIds.includes(groupId);

  // Filter out already assigned users/groups and admin/superadmin roles
  const availableUsers = users.filter(u =>
    !assignedUserIds.includes(u._id) &&
    u.role !== 'admin' &&
    u.role !== 'superadmin'
  );

  const availableGroups = groups.filter(g =>
    !assignedGroupIds.includes(g._id)
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Assign Assessment
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {assessment.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-5 mt-3 space-y-2">
          {assessment.isPublished ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="font-medium">
                This assessment is published. Assigned users will have immediate access to it.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
              <Info className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="font-medium">
                This is a draft. You can assign users now, but they will only see it once it is published.
              </span>
            </div>
          )}

          {/* Unlock stats */}
          {unlockStats && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Unlock className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide">Remaining</p>
                  <p className="text-sm font-bold text-emerald-700">{unlockStats.testsRemaining}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide">Locked</p>
                  <p className="text-sm font-bold text-amber-700">{unlockStats.testsLocked}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide">Used</p>
                  <p className="text-sm font-bold text-gray-700">{unlockStats.testsUsed}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeTab === 'users' ? 'animate-pulse' : ''}`} />
            Individual Users
            {assignedUsers.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {assignedUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-all ${
              activeTab === 'groups'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'groups' ? 'animate-pulse' : ''}`} />
            Groups
            {assignedGroups.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'groups' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {assignedGroups.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-gray-100">
          {/* Available Items */}
          <div className="p-4 overflow-y-auto bg-white">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'users' ? "Search users..." : "Search groups..."}
                  value={serverSearchQuery}
                  onChange={(e) => setServerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Available {activeTab === 'users' ? 'Users' : 'Groups'}
              </h3>
              <button
                onClick={activeTab === 'users' ? selectAllUsers : selectAllGroups}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {activeTab === 'users' 
                  ? (selectedUserIds.length === availableUsers.length ? 'Deselect All' : 'Select All')
                  : (selectedGroupIds.length === availableGroups.length ? 'Deselect All' : 'Select All')
                }
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeTab === 'users' ? (
                  availableUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No available users found</p>
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => toggleUserSelection(user._id)}
                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isUserSelected(user._id)
                            ? 'bg-indigo-100 border-2 border-indigo-400 shadow-sm'
                            : 'bg-gray-50 hover:bg-indigo-50 hover:shadow-sm border-2 border-transparent'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isUserSelected(user._id)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isUserSelected(user._id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-white">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  availableGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No available groups found</p>
                    </div>
                  ) : (
                    availableGroups.map((group) => (
                      <div
                        key={group._id}
                        onClick={() => toggleGroupSelection(group._id)}
                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isGroupSelected(group._id)
                            ? 'bg-purple-100 border-2 border-purple-400 shadow-sm'
                            : 'bg-gray-50 hover:bg-purple-50 hover:shadow-sm border-2 border-transparent'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isGroupSelected(group._id)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isGroupSelected(group._id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-sm">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">
                            {group.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {group.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            )}
          </div>

          {/* Assigned Items */}
          <div className="p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Assigned {activeTab === 'users' ? 'Users' : 'Groups'}
            </h3>

            <div className="space-y-1.5">
              {activeTab === 'users' ? (
                assignedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No users assigned yet</p>
                  </div>
                ) : (
                  assignedUsers.map((user) => (
                    <div
                      key={user._id || user}
                      className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">
                            {user.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
                          </p>
                          {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignUsers([user._id || user])}
                        disabled={saving}
                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )
              ) : (
                assignedGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No groups assigned yet</p>
                  </div>
                ) : (
                  assignedGroups.map((group) => (
                    <div
                      key={group._id || group}
                      className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">
                            {group.name || 'Group'}
                          </p>
                          {group.members && (
                            <p className="text-xs text-gray-500">
                              {group.members.length} members
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignGroups([group._id || group])}
                        disabled={saving}
                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer with selection summary */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50">
          {(selectedUserIds.length > 0 || selectedGroupIds.length > 0) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <span className="font-bold text-indigo-700">
                  {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''}
                </span>
                {selectedUserIds.length > 0 && selectedGroupIds.length > 0 && (
                  <span className="text-gray-400 mx-1">+</span>
                )}
                {selectedGroupIds.length > 0 && (
                  <span className="font-bold text-purple-700">
                    {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedUserIds([]);
                    setSelectedGroupIds([]);
                  }}
                  className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800 font-medium transition-all"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleAssignSelected}
                  disabled={saving}
                  className="px-5 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  ) : (
                    'Assign Selected'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 font-medium transition-all shadow-sm hover:shadow-md"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentAssignmentModal;
