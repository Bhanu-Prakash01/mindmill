import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupService, userService } from '../../services';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Anchor,
  Bell,
  Camera,
  Diamond,
  Eye,
  Flag,
  Ghost,
  Key,
  Leaf,
  Moon,
  Music,
  Paperclip,
  Pen,
  Sun,
  Trophy,
  Rocket,
  Zap,
  Shield,
  Globe,
  Crown,
  Star,
  Coffee,
  Heart,
  Smile,
  Cloud,
  Book,
  Compass,
  Feather,
  Flame,
  Gift,
  Calendar
} from 'lucide-react';
import { SmilePlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COOL_ICONS = [
  { icon: Rocket, color: 'bg-rose-100 text-rose-600', border: 'border-rose-200' },
  { icon: Zap, color: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
  { icon: Shield, color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200' },
  { icon: Globe, color: 'bg-sky-100 text-sky-600', border: 'border-sky-200' },
  { icon: Crown, color: 'bg-violet-100 text-violet-600', border: 'border-violet-200' },
  { icon: Star, color: 'bg-yellow-100 text-yellow-600', border: 'border-yellow-200' },
  { icon: Coffee, color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
  { icon: Heart, color: 'bg-pink-100 text-pink-600', border: 'border-pink-200' },
  { icon: Smile, color: 'bg-lime-100 text-lime-600', border: 'border-lime-200' },
  { icon: Cloud, color: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200' },
  { icon: Book, color: 'bg-teal-100 text-teal-600', border: 'border-teal-200' },
  { icon: Compass, color: 'bg-cyan-100 text-cyan-600', border: 'border-cyan-200' },
  { icon: Feather, color: 'bg-fuchsia-100 text-fuchsia-600', border: 'border-fuchsia-200' },
  { icon: Flame, color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
  { icon: Gift, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' },
  { icon: Anchor, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
  { icon: Bell, color: 'bg-yellow-100 text-yellow-600', border: 'border-yellow-200' },
  { icon: Camera, color: 'bg-gray-100 text-gray-600', border: 'border-gray-200' },
  { icon: Diamond, color: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200' },
  { icon: Eye, color: 'bg-green-100 text-green-600', border: 'border-green-200' },
  { icon: Flag, color: 'bg-red-100 text-red-600', border: 'border-red-200' },
  { icon: Ghost, color: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
  { icon: Key, color: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
  { icon: Leaf, color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200' },
  { icon: Moon, color: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200' },
  { icon: Music, color: 'bg-violet-100 text-violet-600', border: 'border-violet-200' },
  { icon: Paperclip, color: 'bg-gray-100 text-gray-600', border: 'border-gray-200' },
  { icon: Pen, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
  { icon: Sun, color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
  { icon: Trophy, color: 'bg-yellow-100 text-yellow-600', border: 'border-yellow-200' },
];

const EMOJI_OPTIONS = [
  '🔥','🚀','⭐','🎯','💪','🏆','🎨','📚','🌍','💡',
  '🎵','❤️','🌟','💎','🦋','🌈','⚡','🎪','🎭','🧩',
  '🎸','⚽','🔮','🍀','🌸','🌻','🏔️','🌊','🦊','🐝',
  '🐉','🐼','🦁','🎮','🛸','🏠','⚙️','🧪','📌','🎯',
  '🏋️','🎓','🛡️','🗺️','🧭','🔨','💻','📊','🗂️','🪄'
];

const Groups = () => {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const orgPrefix = orgSlug ? `/o/${orgSlug}` : '';
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupService.getGroups();
      setGroups(response.data?.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;

    try {
      await groupService.deleteGroup(id);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  // Helper to get consistent icon for a group
  const getGroupIcon = (groupId, groupName) => {
    // Basic hash to keep it consistent
    const hash = (groupId || groupName || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COOL_ICONS[hash % COOL_ICONS.length];
  };

  const onDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set a ghost image if needed, or just let default handle it
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === index) return;
    
    const newGroups = [...groups];
    const draggedItem = newGroups[draggedItemIndex];
    newGroups.splice(draggedItemIndex, 1);
    newGroups.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setGroups(newGroups);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Groups</h1>
          <p className="text-gray-500 mt-1">
            Manage user groups for assessment assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <p className="text-xl font-semibold text-gray-900">No groups found</p>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Create your first group to organize users and streamline assessment assignments
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredGroups.map((group, index) => {
            const IconData = getGroupIcon(group._id, group.name);
            const Icon = IconData.icon;
            
            return (
              <div
                key={group._id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                className={`group bg-white rounded-xl border ${IconData.border} p-4 transition-all duration-300 hover:shadow-lg hover:border-transparent cursor-move relative overflow-hidden ${
                  draggedItemIndex === index ? 'opacity-50 scale-95 border-dashed border-indigo-400' : ''
                }`}
              >
                {/* Background Accent */}
                <div className={`absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full ${IconData.color} opacity-10 transition-transform group-hover:scale-150 duration-500`} />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${group.icon ? 'bg-gray-100' : IconData.color} flex items-center justify-center shadow-inner transition-transform group-hover:rotate-12`}>
                      {group.icon ? (
                        <span className="text-xl leading-none">{group.icon}</span>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
                        {group.name}
                      </h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`${orgPrefix}/groups/${group._id}/members`); }}
                        className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5 hover:text-indigo-600 transition-colors"
                      >
                        <Users className="w-2.5 h-2.5" />
                        <span>
                          {group.groupType === 'contacts'
                            ? `${group.contacts?.length || 0} contacts`
                            : `${group.members?.length || 0} participants`
                          }
                        </span>
                      </button>
                      {group.moderator && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 mt-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span className="truncate">{group.moderator.firstName} {group.moderator.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                  </div>
                </div>

                {group.description && (
                  <div className="mt-3 min-h-[1rem]">
                    <p className={`text-xs text-gray-600 ${expandedDescriptions[group._id] ? '' : 'line-clamp-2'}`}>
                      {group.description}
                    </p>
                    {group.description.length > 80 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDescriptions(prev => ({ ...prev, [group._id]: !prev[group._id] }));
                        }}
                        className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 mt-0.5 transition-colors"
                      >
                        {expandedDescriptions[group._id] ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-[9px] font-medium text-gray-400 uppercase tracking-widest">
                    <span>{new Date(group.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`${orgPrefix}/groups/${group._id}/members`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm"
                      title={group.groupType === 'contacts' ? 'Manage Contacts' : 'Manage Members'}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{group.groupType === 'contacts' ? 'Contacts' : 'Members'}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); setShowEditModal(true); }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(group._id); }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute bottom-2 right-4 pointer-events-none opacity-5 font-black text-2xl select-none group-hover:opacity-10 transition-opacity">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <GroupFormModal
          group={showEditModal ? selectedGroup : null}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedGroup(null);
          }}
          onSuccess={() => {
            fetchGroups();
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedGroup(null);
          }}
        />
      )}

    </div>
  );
};

// Group Form Modal Component
const GroupFormModal = ({ group, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    icon: group?.icon || '',
    moderator: group?.moderator?._id || ''
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userService.getUsers();
        setUsers(res.data?.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (group) {
        await groupService.updateGroup(group._id, formData);
      } else {
        await groupService.createGroup(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving group:', error);
      alert(error.response?.data?.message || 'Failed to save group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 ">
              {group ? 'Edit Group' : 'New Group'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Organize your assessment participants</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="e.g. Engineering Team"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Group Icon <span className="font-normal text-gray-400">(You may add emojis)</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xl shrink-0">
                {formData.icon || <SmilePlus className="w-5 h-5 text-gray-400" />}
              </div>
              <p className="text-xs text-gray-500">
                {formData.icon ? 'Selected — click again to deselect' : 'Choose an emoji below'}
              </p>
            </div>
            <div className="grid grid-cols-10 gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-36 overflow-y-auto">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: formData.icon === emoji ? '' : emoji })}
                  className={`w-8 h-8 flex items-center justify-center text-lg rounded-lg transition-all hover:scale-110 ${
                    formData.icon === emoji
                      ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Group Moderator
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={formData.moderator}
                onChange={(e) => setFormData({ ...formData, moderator: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none"
              >
                <option value="">No moderator assigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
              placeholder="What is this group for?"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
            >
              {loading ? 'Saving...' : (group ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default Groups;
