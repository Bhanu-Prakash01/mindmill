import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Building2,
  CheckCircle,
  XCircle,
  BadgeCheck,
  Upload,
  FileText,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

const EMPTY_FORM = {
  salutation: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user',
  jobTitle: '',
  phoneCountryCode: '',
  phone: '',
  city: '',
  company: '',
  status: 'active',
  deactivationDate: '',
  deactivationReason: '',
};

const SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

const UserManagement = () => {
 const { user: currentUser } = useAuth();
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [filterRole, setFilterRole] = useState('all');
 const [showAddModal, setShowAddModal] = useState(false);
 const [editingUser, setEditingUser] = useState(null);
 const [formData, setFormData] = useState(EMPTY_FORM);
  const [bulkUploadModal, setBulkUploadModal] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

 useEffect(() => {
  fetchUsers();
  }, []);

 const fetchUsers = async () => {
 try {
 setLoading(true);
 const response = await userService.getUsers();
 setUsers(response.data?.users || []);
 } catch (error) {
 console.error('Error fetching users:', error);
 } finally {
 setLoading(false);
 }
 };

 const handleCreateUser = async (e) => {
 e.preventDefault();
 try {
 const isInactive = formData.status === 'inactive';
      await userService.createUser({
        ...formData,
        isActive: !isInactive,
        deactivationDate: isInactive ? formData.deactivationDate || null : null,
        deactivationReason: isInactive ? formData.deactivationReason || null : null,
      });
 setShowAddModal(false);
 setFormData(EMPTY_FORM);
 fetchUsers();
 } catch (error) {
 console.error('Error creating user:', error);
 alert(error.response?.data?.message || 'Failed to create user');
 }
 };

 const handleUpdateUser = async (e) => {
 e.preventDefault();
 try {
 const isInactive = formData.status === 'inactive';
 await userService.updateUser(editingUser._id, {
 ...formData,
 isActive: !isInactive,
 deactivationDate: isInactive ? formData.deactivationDate || null : null,
 deactivationReason: isInactive ? formData.deactivationReason || null : null,
 });
 setEditingUser(null);
 setFormData(EMPTY_FORM);
 fetchUsers();
 } catch (error) {
 console.error('Error updating user:', error);
 alert(error.response?.data?.message || 'Failed to update user');
 }
 };

 const handleDeleteUser = async (id) => {
 if (!confirm('Are you sure you want to delete this user?')) return;
 try {
 await userService.deleteUser(id);
 fetchUsers();
 } catch (error) {
 console.error('Error deleting user:', error);
 alert(error.response?.data?.message || 'Failed to delete user');
 }
 };

   const handleToggleStatus = async (id) => {
   try {
   await userService.toggleUserStatus(id);
   fetchUsers();
   } catch (error) {
   console.error('Error toggling user status:', error);
   }
   };

   const handleResetPassword = async (e) => {
     e.preventDefault();
     if (!newPassword || newPassword.length < 6) {
       alert('Password must be at least 6 characters');
       return;
     }
     try {
       setResettingPassword(true);
       await userService.resetPassword(editingUser._id, newPassword);
       alert('Password reset successfully');
       setShowPasswordReset(false);
       setNewPassword('');
     } catch (error) {
       console.error('Error resetting password:', error);
       alert(error.response?.data?.message || 'Failed to reset password');
     } finally {
       setResettingPassword(false);
     }
   };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['email', 'firstname', 'password'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    const users = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const user = {};
      headers.forEach((header, index) => {
        user[header] = values[index] || '';
      });
      
      if (!user.email || !user.firstname || !user.password) {
        throw new Error(`Row ${i + 1}: Email, First Name, and Password are required`);
      }
      
      if (user.password.length < 6) {
        throw new Error(`Row ${i + 1}: Password must be at least 6 characters`);
      }
      
      users.push({
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname || '',
        password: user.password,
        phone: user.phone || '',
        phoneCountryCode: user.phonecountrycode || '+91',
        jobTitle: user.jobtitle || '',
      });
    }
    
    return users;
  };

  const handleBulkUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const users = parseCSV(text);
        
        setBulkUploading(true);
        const response = await userService.bulkUpload({ users });
        setBulkUploadResult(response.data);
        setBulkUploading(false);
        fetchUsers();
      } catch (error) {
        setBulkUploading(false);
        alert(error.message || 'Failed to process CSV file');
      }
    };
    reader.onerror = () => {
      setBulkUploading(false);
      alert('Failed to read file');
    };
    reader.readAsText(file);
  };

   const openEditModal = (user) => {
   setEditingUser(user);
   setFormData({
     salutation: user.salutation || '',
     firstName: user.firstName,
     lastName: user.lastName,
     email: user.email,
     role: user.role,
     jobTitle: user.jobTitle || '',
     phoneCountryCode: user.phoneCountryCode || '',
     phone: user.phone || '',
     city: user.city || '',
     company: user.company || '',
     status: user.isActive ? 'active' : 'inactive',
     deactivationDate: user.deactivationDate
       ? new Date(user.deactivationDate).toISOString().split('T')[0]
       : '',
     deactivationReason: user.deactivationReason || '',
   });
   setShowPasswordReset(false);
   setNewPassword('');
   setShowAddModal(true);
};

 const filteredUsers = users.filter((user) => {
 const matchesSearch =
 user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
 user.email.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesRole = filterRole === 'all' || user.role === filterRole;
 return matchesSearch && matchesRole;
 });

 const getRoleBadge = (role) => {
 const styles = {
 superadmin: 'bg-purple-100 text-purple-700 ',
 admin: 'bg-blue-100 text-blue-700 ',
 user: 'bg-gray-100 text-gray-700 ',
 };
 const labels = {
 superadmin: 'Super Admin',
 admin: 'Admin',
 user: 'User',
 };
 return (
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role]}`}>
 {labels[role]}
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
 <h1 className="text-2xl font-bold text-gray-900 ">Users</h1>
 <p className="text-gray-500 mt-1">Manage users and their permissions</p>
 </div>
  <button
  onClick={() => {
  setEditingUser(null);
  setFormData(EMPTY_FORM);
  setShowAddModal(true);
  }}
  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
  >
  <Plus className="w-4 h-4 mr-2" />
  Add User
  </button>
  <button
  onClick={() => {
  setBulkUploadResult(null);
  setBulkUploadModal(true);
  }}
  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
  >
  <Upload className="w-4 h-4 mr-2" />
  Bulk Upload
  </button>
  </div>

 {/* Filters */}
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 <input
 type="text"
 placeholder="Search users..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 />
 </div>
 <select
 value={filterRole}
 onChange={(e) => setFilterRole(e.target.value)}
 className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="all">All Roles</option>
 <option value="superadmin">Super Admin</option>
 <option value="admin">Admin</option>
 <option value="user">User</option>
 </select>
 </div>

 {/* Users Table */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
<table className="w-full">
  <thead className="bg-gray-50 ">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
    </tr>
  </thead>
 <tbody className="divide-y divide-gray-200 ">
 {filteredUsers.map((user) => (
 <tr key={user._id} className="hover:bg-gray-50 ">
 <td className="px-6 py-4">
 <div className="flex items-center">
 <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
 <span className="text-indigo-600 font-medium">
 {user.firstName[0]}{user.lastName[0]}
 </span>
 </div>
  <div className="ml-4">
    <div className="text-sm font-medium text-gray-900 ">
      {user.salutation && `${user.salutation} `}{user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
    </div>
    <div className="text-sm text-gray-500 flex items-center gap-1">
      {user.email}
      {user.isEmailVerified && (
        <BadgeCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" title="Email verified" />
      )}
    </div>
  </div>
</div>
</td>
<td className="px-6 py-4">
  <div className="text-sm text-gray-900 font-medium">{user.company || user.organization?.name || 'N/A'}</div>
</td>
<td className="px-6 py-4">{getRoleBadge(user.role)}</td>
 <td className="px-6 py-4">
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
 user.isActive
 ? 'bg-green-100 text-green-700 '
 : 'bg-red-100 text-red-700 '
 }`}>
 {user.isActive ? 'Active' : 'Inactive'}
 </span>
 </td>
 <td className="px-6 py-4 text-sm text-gray-500 ">
 {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => handleToggleStatus(user._id)}
 className={`p-2 rounded-lg transition-colors ${
 user.isActive
 ? 'text-red-600 hover:bg-red-50 '
 : 'text-green-600 hover:bg-green-50 '
 }`}
 title={user.isActive ? 'Deactivate' : 'Activate'}
 >
 {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
 </button>
 <button
 onClick={() => openEditModal(user)}
 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
 title="Edit"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 {currentUser?.role === 'superadmin' && user._id !== currentUser?._id && (
 <button
 onClick={() => handleDeleteUser(user._id)}
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
 title="Delete"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {filteredUsers.length === 0 && (
 <div className="text-center py-12">
 <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 ">No users found</p>
 </div>
 )}
 </div>

 {/* Add/Edit Modal */}
 {showAddModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
 <h2 className="text-xl font-bold text-gray-900 mb-4">
 {editingUser ? 'Edit User' : 'Add New User'}
 </h2>
 <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">

  {/* Salutation / First Name / Last Name */}
  <div className="grid grid-cols-12 gap-4">
    <div className="col-span-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Salut.
      </label>
      <select
        value={formData.salutation}
        onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">Select</option>
        {SALUTATIONS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
    <div className="col-span-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        First Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        required
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
    <div className="col-span-5">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Last Name
      </label>
      <input
        type="text"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  </div>

  {/* Email */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Email <span className="text-red-500">*</span>
  </label>
  <div className="relative">
  <input
  type="email"
  required
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
  />
  {editingUser?.isEmailVerified && (
  <div className="absolute right-3 top-1/2 -translate-y-1/2" title="Email verified">
  <BadgeCheck className="w-5 h-5 text-green-500" />
  </div>
  )}
  </div>
  </div>

  {/* Password - Only for new users */}
  {!editingUser && (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Password <span className="text-red-500">*</span>
      </label>
      <input
        type="password"
        required
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Enter initial password"
        minLength={6}
      />
    </div>
  )}

 {/* Role */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Role <span className="text-red-500">*</span>
 </label>
 <select
 value={formData.role}
 onChange={(e) => setFormData({ ...formData, role: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 >
 <option value="user">User</option>
 <option value="admin">Admin</option>
 {currentUser?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
 </select>
 </div>

  {/* Phone */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
    <div className="flex gap-2">
      <input
        type="text"
        value={formData.phoneCountryCode}
        onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
        className="w-20 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="+1"
      />
      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="Phone number"
      />
    </div>
  </div>

 {/* City / Company */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
 <input
 type="text"
 value={formData.city}
 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 placeholder="Optional"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
 <input
 type="text"
 value={formData.company}
 onChange={(e) => setFormData({ ...formData, company: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 placeholder="Optional"
 />
 </div>
 </div>

 {/* Job Title */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
 <input
 type="text"
 value={formData.jobTitle}
 onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 placeholder="Optional"
 />
 </div>

  {/* Status */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
  <select
  value={formData.status}
  onChange={(e) => setFormData({ ...formData, status: e.target.value, deactivationDate: '', deactivationReason: '' })}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  >
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
  </select>
  </div>

  {/* Password Reset - Only for existing users */}
  {editingUser && (
    <div className="border-t border-gray-200 pt-4 mt-4">
      {!showPasswordReset ? (
        <button
          type="button"
          onClick={() => setShowPasswordReset(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <KeyRound className="w-4 h-4" />
          Reset Password
        </button>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <button
              type="button"
              onClick={() => setShowPasswordReset(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter new password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={resettingPassword || newPassword.length < 6}
            className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
          >
            {resettingPassword ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Resetting...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Reset Password
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )}

  {/* Deactivation fields — conditional */}
 {formData.status === 'inactive' && (
 <div className="space-y-4 p-4 bg-red-50 border border-red-100 rounded-lg">
 <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Deactivation Details</p>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Date Deactivated</label>
 <input
 type="date"
 value={formData.deactivationDate}
 onChange={(e) => setFormData({ ...formData, deactivationDate: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Deactivation</label>
 <select
 value={formData.deactivationReason}
 onChange={(e) => setFormData({ ...formData, deactivationReason: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 >
 <option value="">Select a reason</option>
 <option value="Separated">Separated</option>
 <option value="Disassociated">Disassociated</option>
 <option value="Sabbatical">Sabbatical</option>
 </select>
 </div>
 </div>
 )}

   {/* Actions */}
   <div className="flex gap-3 pt-2">
   <button
   type="button"
   onClick={() => { setShowAddModal(false); setFormData(EMPTY_FORM); setEditingUser(null); setShowPasswordReset(false); setNewPassword(''); }}
   className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 "
   >
  Cancel
  </button>
  <button
  type="submit"
  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
  >
  {editingUser ? 'Update' : 'Create'}
  </button>
  </div>
  </form>
  </div>
  </div>
  )}

  {/* Bulk Upload Modal */}
  {bulkUploadModal && (
  <BulkUploadModal
  onClose={() => { setBulkUploadModal(false); setBulkUploadResult(null); }}
  onUpload={handleBulkUpload}
  result={bulkUploadResult}
  uploading={bulkUploading}
  />
  )}
  </div>
  );
};

// Bulk Upload Modal Component
const BulkUploadModal = ({ onClose, onUpload, result, uploading }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a CSV file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Upload Users</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop your CSV file here, or
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{selectedFile.name}</span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements</h4>
              <p className="text-sm text-blue-700 mb-2">
                Required columns: <code className="bg-blue-100 px-1 rounded">email</code>, <code className="bg-blue-100 px-1 rounded">firstname</code>, <code className="bg-blue-100 px-1 rounded">password</code>
              </p>
              <p className="text-sm text-blue-700">
                Optional columns: <code className="bg-blue-100 px-1 rounded">lastname</code>, <code className="bg-blue-100 px-1 rounded">phone</code>, <code className="bg-blue-100 px-1 rounded">phonecountrycode</code>, <code className="bg-blue-100 px-1 rounded">jobtitle</code>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Upload Complete</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.summary?.created || 0}</p>
                <p className="text-sm text-gray-500">Created</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{result.summary?.skipped || 0}</p>
                <p className="text-sm text-gray-500">Skipped</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.summary?.errors || 0}</p>
                <p className="text-sm text-gray-500">Errors</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Errors
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="font-medium">...and {result.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
