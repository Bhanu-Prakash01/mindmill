import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupService, userService } from '../../services';
import { 
  Users, 
  Search, 
  UserPlus, 
  ArrowLeft,
  X,
  BadgeCheck,
  UserMinus
} from 'lucide-react';

const GroupMembers = () => {
  const { id: groupId, orgSlug } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [groupId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [groupRes, usersRes] = await Promise.all([
        groupService.getGroup(groupId),
        userService.getUsers()
      ]);
      
      const groupData = groupRes.data?.group;
      setGroup(groupData);
      setMembers(groupData?.members || []);
      setUsers(usersRes.data?.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    setActionLoading(true);
    try {
      await groupService.addMembers(groupId, [userId]);
      const addedUser = users.find(u => u._id === userId);
      setMembers(prev => [...prev, addedUser]);
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    setActionLoading(true);
    try {
      await groupService.removeMembers(groupId, [userId]);
      setMembers(prev => prev.filter(m => m._id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = members.filter(m =>
    (m.firstName + ' ' + (m.lastName || '') + ' ' + m.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Group not found</h2>
          <p className="text-gray-500 mt-2">The group you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/groups` : '/groups')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/groups` : '/groups')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name} Members</h1>
            <p className="text-gray-500 mt-1">
              Manage participants in this group ({members.length} total)
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Members
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search current members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-medium">
                          {member.firstName[0]}{member.lastName ? member.lastName[0] : ''}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.salutation ? `${member.salutation} ` : ''}{member.firstName} {member.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center gap-1.5 text-sm text-gray-900">
                       {member.email}
                       {member.isEmailVerified && (
                        <BadgeCheck className="w-4 h-4 text-green-500" title="Email verified" />
                      )}
                     </div>
                     <div className="text-sm text-gray-500">{member.phone ? `+${member.phoneCountryCode} ${member.phone}` : '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 border border-gray-100 bg-gray-50 rounded-md px-2 py-1 inline-block">
                      {member.company || member.organization?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleRemoveMember(member._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from group"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No members found in this group.</p>
            {searchQuery && <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>}
          </div>
        )}
      </div>

      {/* Add Members Modal */}
      {showAddModal && (
        <AddMembersModal 
          groupId={groupId}
          currentMembers={members}
          allUsers={users}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMember}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

const AddMembersModal = ({ onClose, allUsers, currentMembers, onAdd, loading }) => {
  const [modalSearch, setModalSearch] = useState('');
  
  const memberIds = currentMembers.map(m => m._id);
  
  const availableUsers = allUsers.filter(u => 
    !memberIds.includes(u._id) && 
    (u.firstName + ' ' + (u.lastName || '') + ' ' + u.email).toLowerCase().includes(modalSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
         {/* Modal Header */}
         <div className="flex items-center justify-between p-6 border-b border-gray-100">
           <div>
             <h2 className="text-xl font-bold text-gray-900">Add Members</h2>
             <p className="text-sm text-gray-500 mt-1">Search and select users to add to this group</p>
           </div>
           <button 
             onClick={onClose}
             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
         </div>
         
         {/* Modal Body */}
         <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
           <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
             <input 
                type="text"
                placeholder="Search organization directory..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
              />
           </div>

           <div className="space-y-3">
             {availableUsers.map((user) => (
               <div key={user._id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-medium">
                      {user.firstName[0]}{user.lastName ? user.lastName[0] : ''}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName || ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>
                    </div>
                 </div>
                 <button
                   disabled={loading}
                   onClick={() => onAdd(user._id)}
                   className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                 >
                   Add
                 </button>
               </div>
             ))}

             {availableUsers.length === 0 && (
               <div className="text-center py-8">
                 <p className="text-gray-500 text-sm">No available users found matching "{modalSearch}"</p>
               </div>
             )}
           </div>
         </div>
         
         {/* Modal Footer */}
         <div className="p-4 border-t border-gray-100 bg-white">
           <button
             onClick={onClose}
             className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
           >
             Close
           </button>
         </div>
       </div>
    </div>
  );
};

export default GroupMembers;
