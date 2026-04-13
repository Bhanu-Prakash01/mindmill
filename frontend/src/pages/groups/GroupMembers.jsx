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
  UserMinus,
  Mail,
  Phone,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';

const GroupMembers = () => {
  const { id: groupId, orgSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const isContactGroup = group?.groupType === 'contacts';

  useEffect(() => {
    fetchInitialData();
  }, [groupId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const groupRes = await groupService.getGroup(groupId);
      const groupData = groupRes.data?.group;
      setGroup(groupData);
      setContacts(groupData?.contacts || []);

      // Only fetch org users for team groups
      if (groupData?.groupType !== 'contacts') {
        const usersRes = await userService.getUsers();
        setMembers(groupData?.members || []);
        setUsers(usersRes.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Team member handlers
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
    if (!window.confirm('Remove this member from the group?')) return;
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

  // Contact handlers
  const handleAddContacts = async (contactsToAdd) => {
    setActionLoading(true);
    try {
      const res = await groupService.addContacts(groupId, contactsToAdd);
      setContacts(res.data?.contacts || []);
    } catch (error) {
      console.error('Error adding contacts:', error);
      alert(error.response?.data?.message || 'Failed to add contacts');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveContact = async (contactId) => {
    if (!window.confirm('Remove this contact?')) return;
    setActionLoading(true);
    try {
      const res = await groupService.removeContact(groupId, contactId);
      setContacts(res.data?.contacts || []);
    } catch (error) {
      console.error('Error removing contact:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = isContactGroup
    ? contacts.filter(c =>
        (c.name + ' ' + c.email + ' ' + (c.phone || '')).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members.filter(m =>
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
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Group not found</h2>
          <button
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/groups` : '/groups')}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >Back to Groups</button>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {group.name} {isContactGroup ? 'Contacts' : 'Members'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isContactGroup
                ? `${contacts.length} contacts in this group`
                : `${members.length} participants in this group`
              }
            </p>
          </div>
        </div>

        <button
          onClick={() => isContactGroup ? setShowAddContact(true) : setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {isContactGroup ? 'Add Contacts' : 'Add Members'}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={isContactGroup ? 'Search contacts...' : 'Search members...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isContactGroup ? 'Contact' : 'Member'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isContactGroup ? 'Phone' : 'Company'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isContactGroup ? (
                filteredItems.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserAvatar
                          name={contact.name?.split(' ')[0] || ''}
                          lastName={contact.name?.split(' ').slice(1).join(' ') || ''}
                          email={contact.email}
                          size={40}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {contact.phone}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleRemoveContact(contact._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredItems.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserAvatar
                          name={member.firstName}
                          lastName={member.lastName}
                          email={member.email}
                          size={40}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-900">
                        {member.email}
                        {member.isEmailVerified && <BadgeCheck className="w-4 h-4 text-green-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.company || member.organization?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {isContactGroup ? 'No contacts in this group yet.' : 'No members in this group yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Members Modal (team groups) */}
      {showAddModal && !isContactGroup && (
        <AddMembersModal
          groupId={groupId}
          currentMembers={members}
          allUsers={users}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMember}
          loading={actionLoading}
        />
      )}

      {/* Add Contacts Modal (contact groups) */}
      {showAddContact && isContactGroup && (
        <AddContactsModal
          onClose={() => setShowAddContact(false)}
          onAdd={(contacts) => { handleAddContacts(contacts); setShowAddContact(false); }}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

// ============================================================
// Add Members Modal (org users — team groups)
// ============================================================
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Members</h2>
            <p className="text-sm text-gray-500 mt-1">Search and select users from your organization</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search organization directory..." value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="space-y-3">
            {availableUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={u.firstName}
                    lastName={u.lastName}
                    email={u.email}
                    size={40}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName || ''}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                </div>
                <button disabled={loading} onClick={() => onAdd(u._id)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  Add
                </button>
              </div>
            ))}
            {availableUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No available users found.</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-white">
          <button onClick={onClose}
            className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Add Contacts Modal (test takers — contact groups)
// ============================================================
const AddContactsModal = ({ onClose, onAdd, loading }) => {
  const [rows, setRows] = useState([{ name: '', email: '', phone: '' }]);

  const addRow = () => setRows(prev => [...prev, { name: '', email: '', phone: '' }]);
  const removeRow = (index) => setRows(prev => prev.filter((_, i) => i !== index));
  const updateRow = (index, field, value) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleSubmit = () => {
    const valid = rows.filter(r => r.name.trim() && r.email.trim());
    if (valid.length === 0) {
      alert('Please add at least one contact with name and email');
      return;
    }
    onAdd(valid.map(r => ({
      name: r.name.trim(),
      email: r.email.trim().toLowerCase(),
      phone: r.phone.trim()
    })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Contacts</h2>
            <p className="text-sm text-gray-500 mt-1">Add test takers you want to invite</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-3">
                <input type="text" placeholder="Name *" value={row.name}
                  onChange={(e) => updateRow(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                <input type="email" placeholder="Email *" value={row.email}
                  onChange={(e) => updateRow(index, 'email', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                <input type="tel" placeholder="Phone" value={row.phone}
                  onChange={(e) => updateRow(index, 'phone', e.target.value)}
                  className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                {rows.length > 1 && (
                  <button onClick={() => removeRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addRow}
            className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            <Plus className="w-4 h-4" /> Add another
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Contacts'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMembers;
