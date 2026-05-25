import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService, organizationService } from '../../services';
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
  CreditCard,
} from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

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
  organizationId: '',
  organizationName: '',
  organizationSlug: '',
  organizationDescription: '',
  organizationCredits: 50,
};

const SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrg, setFilterOrg] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [filterOrgAdmin, setFilterOrgAdmin] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [userType, setUserType] = useState('individual');
  const [createNewOrg, setCreateNewOrg] = useState(false);
  const [bulkUploadModal, setBulkUploadModal] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [orgFormData, setOrgFormData] = useState({ name: '', slug: '', credits: 0, adminId: '' });
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
        setFormData(EMPTY_FORM);
        setEditingUser(null);
        setShowPasswordReset(false);
        setNewPassword('');
        setUserType('individual');
        setCreateNewOrg(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAddModal]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const usersRes = await userService.getUsers();
      setUsers(usersRes.data?.users || []);
      if (isSuperAdmin) {
        const orgsRes = await organizationService.getOrganizations();
        setOrganizations(orgsRes.data?.organizations || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
  e.preventDefault();

  if (formData.role === 'admin') {
    if (createNewOrg) {
      if (!formData.organizationName?.trim()) {
        alert('Please enter an organization name for the new admin.');
        return;
      }
    } else if (!formData.organizationId) {
      alert('Please tag the admin to an organization. Select one from the list or choose "New Organization".');
      return;
    }
  }

  try {
  const isInactive = formData.status === 'inactive';
  const payload = {
    ...formData,
    isActive: !isInactive,
    deactivationDate: isInactive ? formData.deactivationDate || null : null,
    deactivationReason: isInactive ? formData.deactivationReason || null : null,
  };
  if (userType === 'individual') {
    delete payload.organizationId;
    delete payload.organizationName;
    delete payload.organizationSlug;
    delete payload.organizationDescription;
    delete payload.organizationCredits;
  }
  await userService.createUser(payload);
  setShowAddModal(false);
  setFormData(EMPTY_FORM);
  setUserType('individual');
  setCreateNewOrg(false);
  fetchData();
  } catch (error) {
  console.error('Error creating user:', error);
  alert(error.response?.data?.message || 'Failed to create user');
  }
  };

  const handleUpdateUser = async (e) => {
  e.preventDefault();
  try {
  const isInactive = formData.status === 'inactive';
  const payload = {
    ...formData,
    isActive: !isInactive,
    deactivationDate: isInactive ? formData.deactivationDate || null : null,
    deactivationReason: isInactive ? formData.deactivationReason || null : null,
  };
  if (userType === 'individual') {
    delete payload.organizationId;
    delete payload.organizationName;
    delete payload.organizationSlug;
    delete payload.organizationDescription;
    delete payload.organizationCredits;
  }
  await userService.updateUser(editingUser._id, payload);
  setEditingUser(null);
  setFormData(EMPTY_FORM);
  setUserType('individual');
  setCreateNewOrg(false);
  fetchData();
  } catch (error) {
  console.error('Error updating user:', error);
  alert(error.response?.data?.message || 'Failed to update user');
  }
  };

 const handleDeleteUser = async (id) => {
 if (!confirm('Are you sure you want to delete this user?')) return;
 try {
 await userService.deleteUser(id);
 fetchData();
 } catch (error) {
 console.error('Error deleting user:', error);
 alert(error.response?.data?.message || 'Failed to delete user');
 }
 };

   const handleToggleStatus = async (id) => {
   try {
   await userService.toggleUserStatus(id);
   fetchData();
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

  const openEditOrg = async (org) => {
    setEditingOrg(org);
    setOrgFormData({
      name: org.name,
      slug: org.slug,
      credits: org.credits?.total || 0,
      adminId: org.admin?._id || '',
    });
    try {
      setLoadingAdmins(true);
      const res = await userService.getUsers({ role: 'admin' });
      setAdminUsers(res.data?.users || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoadingAdmins(false);
    }
    setShowEditOrgModal(true);
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    try {
      await organizationService.updateOrganization(editingOrg._id, {
        name: orgFormData.name,
        slug: orgFormData.slug,
        credits: orgFormData.credits,
      });
      if (orgFormData.adminId && orgFormData.adminId !== editingOrg.admin?._id) {
        await organizationService.reassignAdmin(editingOrg._id, orgFormData.adminId);
      }
      setShowEditOrgModal(false);
      setEditingOrg(null);
      setOrgFormData({ name: '', slug: '', credits: 0, adminId: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating organization:', error);
      alert(error.response?.data?.message || 'Failed to update organization');
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
        fetchData();
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
    const userOrg = user.organization;
    const hasOrg = !!userOrg;
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
      organizationId: hasOrg ? (userOrg._id || '') : '',
      organizationName: userOrg?.name || '',
      organizationSlug: userOrg?.slug || '',
      organizationDescription: userOrg?.description || '',
      organizationCredits: userOrg?.credits?.total || 0,
    });
    setUserType(hasOrg ? 'organization' : 'individual');
    setCreateNewOrg(false);
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
  const matchesStatus = filterStatus === 'all' ||
    (filterStatus === 'active' && user.isActive) ||
    (filterStatus === 'inactive' && !user.isActive);
  const matchesOrg = filterOrg === 'all' || (filterOrg === 'individual' ? !user.organization : user.organization?._id === filterOrg);
  return matchesSearch && matchesRole && matchesStatus && matchesOrg;
});

const activeFilterCount = [
  filterRole !== 'all',
  filterStatus !== 'all',
  filterOrg !== 'all'
].filter(Boolean).length;

const clearAllFilters = () => {
  setFilterRole('all');
  setFilterStatus('all');
  setFilterOrg('all');
  setSearchQuery('');
  setOrgSearchQuery('');
  setFilterOrgAdmin('all');
};

const filteredOrganizations = organizations.filter((org) => {
  const matchesSearch =
    org.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(orgSearchQuery.toLowerCase());
  const matchesAdmin = filterOrgAdmin === 'all' || org.admin?._id === filterOrgAdmin;
  return matchesSearch && matchesAdmin;
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
    {/* Tabs */}
    {isSuperAdmin && (
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </div>
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'organizations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organizations
            </div>
          </button>
        </nav>
      </div>
    )}

  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 ">
        {isSuperAdmin ? (activeTab === 'organizations' ? 'Organizations' : 'Users') : 'Users'}
      </h1>
      <p className="text-gray-500 mt-1">
        {isSuperAdmin ? (activeTab === 'organizations' ? 'Manage organizations and their credits' : 'Manage users and their permissions') : 'Manage users and their permissions'}
      </p>
    </div>
    {activeTab === 'users' && (
      <div className="flex gap-3">
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData(EMPTY_FORM);
            setShowAddModal(true);
            setUserType('individual');
            setCreateNewOrg(false);
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
    )}
  </div>

{(activeTab === 'users' || !isSuperAdmin) && (
    <div className="space-y-3">
      {/* Primary Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
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
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
            showAdvancedFilters || activeFilterCount > 0
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Advanced Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Organization</label>
              <select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Organizations</option>
                <option value="individual">Individual</option>
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

{activeTab === 'users' || !isSuperAdmin ? (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredUsers.length}</span> of <span className="font-medium text-gray-900">{users.length}</span> users
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
 <tr key={user._id} className="hover:bg-gray-50 ">
 <td className="px-6 py-4">
 <div className="flex items-center">
 <UserAvatar
  name={user.firstName}
  lastName={user.lastName}
  email={user.email}
  size={40}
 />
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
  <div className="text-sm text-gray-900 font-medium">{user.company || 'N/A'}</div>
</td>
<td className="px-6 py-4">
  <div className="text-sm text-gray-900 font-medium">{user.organization?.name || (user.accountType === 'individual' ? 'Individual' : 'N/A')}</div>
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
 {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && 
  user._id !== currentUser?._id && 
  !(currentUser?.role === 'admin' && (user.role === 'superadmin' || user.role === 'admin')) && (
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
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={orgSearchQuery}
            onChange={(e) => setOrgSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterOrgAdmin}
          onChange={(e) => setFilterOrgAdmin(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Admins</option>
          {organizations.map(org => org.admin && (
            <option key={org.admin._id} value={org.admin._id}>{org.admin.firstName} {org.admin.lastName}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-900">{filteredOrganizations.length}</span> of <span className="font-medium text-gray-900">{organizations.length}</span> organizations
      </p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrganizations.map((org) => (
              <tr key={org._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{org.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 font-mono">{org.slug}</div>
                </td>
                <td className="px-6 py-4">
                  {org.admin ? (
                    <>
                      <div className="text-sm text-gray-900">{org.admin.firstName} {org.admin.lastName}</div>
                      <div className="text-xs text-gray-500">{org.admin.email}</div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400 italic">No admin assigned</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-indigo-600 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    {org.credits?.total || 0}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-orange-600">{org.credits?.used || 0}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-green-600">{org.credits?.total - org.credits?.used - (org.credits?.locked || 0)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openEditOrg(org)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No organizations found</p>
        </div>
      )}
    </div>
    </>
  )}

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

  {/* Role & Password side-by-side */}
  <div className="grid grid-cols-2 gap-4">
    {/* Role */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Role <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.role}
        onChange={(e) => {
          const newRole = e.target.value;
          setFormData({ ...formData, role: newRole });
          if (newRole === 'admin') {
            setUserType('organization');
          } else {
            setUserType('individual');
            setCreateNewOrg(false);
          }
        }}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
        {currentUser?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
      </select>
    </div>
    {/* Password - Only for new users */}
    {!editingUser ? (
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
          placeholder="Min 6 characters"
          minLength={6}
        />
      </div>
    ) : (
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
    )}
  </div>

  {currentUser?.role === 'superadmin' && formData.role !== 'admin' && formData.role !== 'superadmin' && (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">User Type</label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setUserType('organization'); setFormData(f => ({ ...f, organizationId: '' })); }}
          className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            userType === 'organization'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-1.5" />
          Organization User
        </button>
        <button
          type="button"
          onClick={() => { setUserType('individual'); setCreateNewOrg(false); }}
          className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            userType === 'individual'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-1.5" />
          Individual User
        </button>
      </div>
    </div>
  )}

  {currentUser?.role === 'superadmin' && formData.role === 'admin' && (
    <input type="hidden" name="userType" value="organization" />
  )}

  {currentUser?.role === 'superadmin' && userType === 'organization' && (
    <div className="p-4 bg-indigo-50 rounded-lg space-y-4">
      <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Organization</p>

      {formData.role === 'admin' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCreateNewOrg(false)}
            className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              !createNewOrg
                ? 'border-indigo-600 bg-white text-indigo-700 ring-1 ring-indigo-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            Tag Organization
          </button>
          <button
            type="button"
            onClick={() => { setCreateNewOrg(true); setFormData(f => ({ ...f, organizationId: '' })); }}
            className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              createNewOrg
                ? 'border-indigo-600 bg-white text-indigo-700 ring-1 ring-indigo-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            New Organization
          </button>
        </div>
      )}

      {!createNewOrg ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Organization</label>
          <select
            value={formData.organizationId}
            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Choose an organization...</option>
            {organizations.map(org => (
              <option key={org._id} value={org._id}>{org.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Org Name</label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value, organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.organizationSlug}
                onChange={(e) => setFormData({ ...formData, organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="acme-corp"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input
                type="number" min={0}
                value={formData.organizationCredits}
                onChange={(e) => setFormData({ ...formData, organizationCredits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.organizationDescription}
                onChange={(e) => setFormData({ ...formData, organizationDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={2} placeholder="Description..."
              />
            </div>
          </div>
        </>
      )}
    </div>
  )}

  {/* Phone */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
    <div className="flex gap-2">
      <input
        type="text"
        value={formData.phoneCountryCode}
        onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
        className="w-20 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="+91"
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
        <div className="space-y-3">
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
              onKeyDown={(e) => e.key === 'Enter' && handleResetPassword(e)}
              className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter new password"
              minLength={6}
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
            type="button"
            onClick={handleResetPassword}
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
        </div>
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
    onClick={() => { setShowAddModal(false); setFormData(EMPTY_FORM); setEditingUser(null); setShowPasswordReset(false); setNewPassword(''); setUserType('individual'); setCreateNewOrg(false); }}
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

  {/* Edit Organization Modal */}
  {showEditOrgModal && editingOrg && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Organization</h2>
        <form onSubmit={handleUpdateOrg} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={orgFormData.name}
                onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value, slug: orgFormData.slug === editingOrg.slug ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') : orgFormData.slug })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                required
                value={orgFormData.slug}
                onChange={(e) => setOrgFormData({ ...orgFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="acme-corp"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
            <input
              type="number"
              min={0}
              required
              value={orgFormData.credits}
              onChange={(e) => setOrgFormData({ ...orgFormData, credits: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin</label>
            <select
              value={orgFormData.adminId}
              onChange={(e) => setOrgFormData({ ...orgFormData, adminId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loadingAdmins}
            >
              <option value="">Select Admin</option>
              {adminUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            {loadingAdmins && <p className="text-xs text-gray-500 mt-1">Loading admins...</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowEditOrgModal(false); setEditingOrg(null); }}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
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
