import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService, organizationService } from '../../services';
import {
 Settings as SettingsIcon,
 User,
 Lock,
 Bell,
 Building2,
 Palette,
 Save,
 CheckCircle,
 AlertCircle,
 Eye,
 EyeOff,
  Camera,
  Upload,
  Globe
} from 'lucide-react';

const PRESET_AVATARS = [
 'bg-red-400',
 'bg-orange-400',
 'bg-amber-400',
 'bg-yellow-400',
 'bg-lime-400',
 'bg-green-400',
 'bg-emerald-400',
 'bg-teal-400',
 'bg-cyan-400',
 'bg-sky-400',
 'bg-blue-400',
 'bg-indigo-400',
 'bg-violet-400',
 'bg-purple-400',
 'bg-fuchsia-400',
 'bg-pink-400',
];

const Settings = () => {
 const { user, updateUser } = useAuth();
 const [activeTab, setActiveTab] = useState('profile');
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [message, setMessage] = useState(null);
 const [organization, setOrganization] = useState(null);
 const [showAvatarPicker, setShowAvatarPicker] = useState(false);

 // Profile form
 const [profileForm, setProfileForm] = useState({
 firstName: '',
 lastName: '',
 email: '',
 phone: '',
 jobTitle: '',
 city: '',
 avatar: '',
 });

 // Password form
 const [passwordForm, setPasswordForm] = useState({
 currentPassword: '',
 newPassword: '',
 confirmPassword: '',
 });
 const [showPasswords, setShowPasswords] = useState({
 current: false,
 new: false,
 confirm: false,
 });

 // Organization form
 const [orgForm, setOrgForm] = useState({
 name: '',
 description: '',
 primaryColor: '#6366f1',
 secondaryColor: '#8b5cf6',
 brandingEnabled: false,
 publicProfileEnabled: false,
 });

 const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

 useEffect(() => {
 if (user) {
 setProfileForm({
 firstName: user.firstName || '',
 lastName: user.lastName || '',
 email: user.email || '',
 phone: user.phone || '',
 jobTitle: user.jobTitle || '',
 city: user.city || '',
 avatar: user.avatar || '',
 });
 }
 if (isAdmin) {
 fetchOrganization();
 }
 }, [user]);

 const fetchOrganization = async () => {
 try {
 setLoading(true);
 const response = await organizationService.getMyOrganization();
 const org = response.data?.organization;
 setOrganization(org);
 if (org) {
 setOrgForm({
 name: org.name || '',
 description: org.description || '',
 primaryColor: org.primaryColor || '#6366f1',
 secondaryColor: org.secondaryColor || '#8b5cf6',
 brandingEnabled: org.brandingEnabled || false,
 publicProfileEnabled: org.publicProfileEnabled || false,
 });
 }
 } catch (error) {
 console.error('Error fetching organization:', error);
 } finally {
 setLoading(false);
 }
 };

 const showMessage = (text, type = 'success') => {
 setMessage({ text, type });
 setTimeout(() => setMessage(null), 3000);
 };

 const handleProfileUpdate = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 const dataToUpdate = {
 firstName: profileForm.firstName,
 lastName: profileForm.lastName,
 city: profileForm.city,
 avatar: profileForm.avatar,
 };
 await authService.updateProfile(dataToUpdate);
 updateUser(dataToUpdate);
 showMessage('Profile updated successfully');
 } catch (error) {
 console.error('Error updating profile:', error);
 showMessage(error.response?.data?.message || 'Failed to update profile', 'error');
 } finally {
 setSaving(false);
 }
 };

 const handleAvatarSelect = (colorClass) => {
 setProfileForm({ ...profileForm, avatar: colorClass });
 setShowAvatarPicker(false);
 };

 const handleAvatarUpload = (e) => {
 const file = e.target.files[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 setProfileForm({ ...profileForm, avatar: reader.result });
 setShowAvatarPicker(false);
 };
 reader.readAsDataURL(file);
 }
 };

 const handlePasswordChange = async (e) => {
 e.preventDefault();
 if (passwordForm.newPassword !== passwordForm.confirmPassword) {
 showMessage('New passwords do not match', 'error');
 return;
 }
 if (passwordForm.newPassword.length < 6) {
 showMessage('Password must be at least 6 characters', 'error');
 return;
 }
 setSaving(true);
 try {
 await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
 setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
 showMessage('Password changed successfully');
 } catch (error) {
 console.error('Error changing password:', error);
 showMessage(error.response?.data?.message || 'Failed to change password', 'error');
 } finally {
 setSaving(false);
 }
 };

 const handleOrgUpdate = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 await organizationService.updateOrganization(organization._id, orgForm);
 showMessage('Organization settings updated');
 } catch (error) {
 console.error('Error updating organization:', error);
 showMessage('Failed to update organization settings', 'error');
 } finally {
 setSaving(false);
 }
 };

 const getAvatarDisplay = () => {
 if (profileForm.avatar && profileForm.avatar.startsWith('data:')) {
 return (
 <img
 src={profileForm.avatar}
 alt="Avatar"
 className="w-24 h-24 rounded-full object-cover"
 />
 );
 }
 if (profileForm.avatar && profileForm.avatar.startsWith('bg-')) {
 return (
 <div className={`w-24 h-24 rounded-full ${profileForm.avatar} flex items-center justify-center`}>
 <span className="text-white text-2xl font-bold">
 {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
 </span>
 </div>
 );
 }
 return (
 <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
 <span className="text-indigo-600 text-2xl font-bold">
 {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
 </span>
 </div>
 );
 };

 const tabs = [
 { id: 'profile', label: 'Profile', icon: User },
 { id: 'password', label: 'Password', icon: Lock },
 ...(isAdmin ? [{ id: 'organization', label: 'Organization', icon: Building2 }] : []),
 ];

 return (
 <div className="space-y-6">
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Settings</h1>
 <p className="text-gray-500 mt-1">Manage your account and preferences</p>
 </div>

 {/* Message */}
 {message && (
 <div className={`p-4 rounded-lg flex items-center gap-2 ${
 message.type === 'error'
 ? 'bg-red-50 text-red-700 '
 : 'bg-green-50 text-green-700 '
 }`}>
 {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
 {message.text}
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 {/* Sidebar */}
 <div className="lg:col-span-1">
 <nav className="space-y-1">
 {tabs.map((tab) => {
 const Icon = tab.icon;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
 activeTab === tab.id
 ? 'bg-indigo-50 text-indigo-700 '
 : 'text-gray-700 hover:bg-gray-50 '
 }`}
 >
 <Icon className="w-5 h-5" />
 {tab.label}
 </button>
 );
 })}
 </nav>
 </div>

 {/* Content */}
 <div className="lg:col-span-3">
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 {/* Profile Settings */}
 {activeTab === 'profile' && (
 <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
 <div>
 <h2 className="text-lg font-semibold text-gray-900 ">Profile Information</h2>
 <p className="text-sm text-gray-500 ">Update your personal information</p>
 </div>

 {/* Profile Image */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Profile Image
 </label>
 <div className="flex items-center gap-4">
 {getAvatarDisplay()}
 <button
 type="button"
 onClick={() => setShowAvatarPicker(!showAvatarPicker)}
 className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
 >
 <Camera className="w-4 h-4" />
 Change Avatar
 </button>
 </div>
 {/* Avatar Picker */}
 {showAvatarPicker && (
 <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
 <p className="text-sm font-medium text-gray-700">Choose a preset color:</p>
 <div className="grid grid-cols-8 gap-2">
 {PRESET_AVATARS.map((color) => (
 <button
 key={color}
 type="button"
 onClick={() => handleAvatarSelect(color)}
 className={`w-8 h-8 rounded-full ${color} hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500 transition-all ${
 profileForm.avatar === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
 }`}
 />
 ))}
 </div>
 <div className="border-t border-gray-200 pt-4">
 <p className="text-sm font-medium text-gray-700 mb-2">Or upload an image:</p>
 <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer w-fit">
 <Upload className="w-4 h-4" />
 Upload Image
 <input
 type="file"
 accept="image/*"
 onChange={handleAvatarUpload}
 className="hidden"
 />
 </label>
 </div>
 </div>
 )}
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 First Name
 </label>
 <input
 type="text"
 value={profileForm.firstName}
 onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Last Name
 </label>
 <input
 type="text"
 value={profileForm.lastName}
 onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 </div>
 </div>

 {/* Email - Display Only */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Email
 </label>
 <input
 type="email"
 value={profileForm.email}
 disabled
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
 />
 <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
 </div>

 {/* Phone - Display Only */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Phone
 </label>
 <input
 type="tel"
 value={profileForm.phone || 'Not set'}
 disabled
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
 />
 <p className="text-xs text-gray-500 mt-1">Contact admin to update phone number</p>
 </div>

 {/* Role - Display Only */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Role
 </label>
 <input
 type="text"
 value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
 disabled
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
 />
 </div>

 {/* City - Editable */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 City
 </label>
 <input
 type="text"
 value={profileForm.city}
 onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Enter your city"
 />
 </div>

 {/* Coordinator Toggle - Admin Only */}
 {isAdmin && user?.role === 'admin' && (
 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Coordinator Role</h3>
 <p className="text-sm text-gray-500 ">Can be assigned to handle support tickets</p>
 </div>
 <input
 type="checkbox"
 checked={user?.isCoordinator || false}
 onChange={async (e) => {
 try {
 await authService.updateProfile({ isCoordinator: e.target.checked });
 updateUser({ isCoordinator: e.target.checked });
 showMessage(e.target.checked ? 'Enabled coordinator role' : 'Disabled coordinator role');
 } catch (error) {
 showMessage('Failed to update coordinator status', 'error');
 }
 }}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>
 )}

 <button
 type="submit"
 disabled={saving}
 className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
 >
 <Save className="w-4 h-4 mr-2" />
 {saving ? 'Saving...' : 'Save Changes'}
 </button>
 </form>
 )}

 {/* Password Settings */}
 {activeTab === 'password' && (
 <div className="space-y-6 max-w-lg">
 <div>
 <h2 className="text-lg font-semibold text-gray-900 ">Password</h2>
 <p className="text-sm text-gray-500 ">Your account password</p>
 </div>

 {/* Display masked password indicator */}
 <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
 <label className="block text-sm font-medium text-gray-700 mb-2">
 Current Password
 </label>
 <div className="flex items-center gap-2">
 <Lock className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600 tracking-widest">••••••••</span>
 </div>
 <p className="text-xs text-gray-500 mt-2">Password is set and active</p>
 </div>

 {/* Change Password Form */}
 <form onSubmit={handlePasswordChange} className="space-y-4">
 <div className="border-t border-gray-200 pt-4">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Current Password
 </label>
 <div className="relative">
 <input
 type={showPasswords.current ? 'text' : 'password'}
 value={passwordForm.currentPassword}
 onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
 className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 <button
 type="button"
 onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
 >
 {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 New Password
 </label>
 <div className="relative">
 <input
 type={showPasswords.new ? 'text' : 'password'}
 value={passwordForm.newPassword}
 onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
 className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 <button
 type="button"
 onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
 >
 {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Confirm New Password
 </label>
 <div className="relative">
 <input
 type={showPasswords.confirm ? 'text' : 'password'}
 value={passwordForm.confirmPassword}
 onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
 className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 <button
 type="button"
 onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
 >
 {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <button
 type="submit"
 disabled={saving}
 className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
 >
 <Lock className="w-4 h-4 mr-2" />
 {saving ? 'Changing...' : 'Change Password'}
 </button>
 </form>
 </div>
 )}

  {/* Organization Settings */}
  {activeTab === 'organization' && isAdmin && (
  <form onSubmit={handleOrgUpdate} className="space-y-6 max-w-lg">
  <div className="flex items-start justify-between">
  <div>
  <h2 className="text-lg font-semibold text-gray-900 ">Organization Settings</h2>
  <p className="text-sm text-gray-500 ">Manage your organization profile</p>
  </div>
  {organization?.slug && (
  <Link
  to={`/org/${organization.slug}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
  <Globe className="w-4 h-4 mr-2" />
  View Page
  </Link>
  )}
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Organization Logo
  </label>
  <div className="flex items-center gap-4">
  <div className="w-16 h-16 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
  {organization?.logo ? (
  <img
  src={organization.logo.startsWith('http') ? organization.logo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${organization.logo}`}
  alt="Organization logo"
  className="w-full h-full object-contain"
  />
  ) : (
  <Building2 className="w-8 h-8 text-gray-400" />
  )}
  </div>
  <label className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
  <Upload className="w-4 h-4" />
  Upload Logo
  <input
  type="file"
  accept="image/*"
  onChange={async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
  setSaving(true);
  const response = await organizationService.uploadLogo(organization._id, file);
  setOrganization(response.data.organization);
  showMessage('Logo updated successfully');
  } catch (error) {
  showMessage('Failed to upload logo', 'error');
  } finally {
  setSaving(false);
  }
  }}
  className="hidden"
  />
  </label>
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Cover Banner
  </label>
  <div className="space-y-3">
  {/* Banner Preview */}
  <div className="w-full h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
  {organization?.banner && !organization.banner.startsWith('gradient-') ? (
  <img
  src={organization.banner.startsWith('http') ? organization.banner : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${organization.banner}`}
  alt="Organization banner"
  className="w-full h-full object-cover"
  />
  ) : organization?.banner && organization.banner.startsWith('gradient-') ? (
  <div className={`w-full h-full ${organization.banner}`} />
  ) : (
  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
  No banner selected
  </div>
  )}
  </div>

  {/* Preset Banners */}
  <div>
  <p className="text-xs text-gray-500 mb-2">Select a preset:</p>
  <div className="grid grid-cols-5 gap-2">
  {[
  { id: 'gradient-to-r from-indigo-500 to-purple-500', style: 'linear-gradient(to right, #6366f1, #8b5cf6)' },
  { id: 'gradient-to-r from-blue-500 to-cyan-500', style: 'linear-gradient(to right, #3b82f6, #06b6d4)' },
  { id: 'gradient-to-r from-emerald-500 to-teal-500', style: 'linear-gradient(to right, #10b981, #14b8a6)' },
  { id: 'gradient-to-r from-orange-500 to-amber-500', style: 'linear-gradient(to right, #f97316, #f59e0b)' },
  { id: 'gradient-to-r from-rose-500 to-pink-500', style: 'linear-gradient(to right, #f43f5e, #ec4899)' },
  { id: 'gradient-to-r from-slate-700 to-slate-900', style: 'linear-gradient(to right, #334155, #0f172a)' },
  { id: 'gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500', style: 'linear-gradient(to bottom right, #8b5cf6, #a855f7, #d946ef)' },
  { id: 'gradient-to-r from-sky-400 to-blue-600', style: 'linear-gradient(to right, #38bdf8, #2563eb)' },
  { id: 'gradient-to-r from-lime-400 to-green-500', style: 'linear-gradient(to right, #a3e635, #22c55e)' },
  { id: 'gradient-to-r from-red-500 to-orange-500', style: 'linear-gradient(to right, #ef4444, #f97316)' },
  ].map((preset) => (
  <button
  key={preset.id}
  type="button"
  onClick={async () => {
  try {
  setSaving(true);
  const response = await organizationService.updateBanner(organization._id, preset.id);
  setOrganization(response.data.organization);
  showMessage('Banner updated');
  } catch (error) {
  showMessage('Failed to update banner', 'error');
  } finally {
  setSaving(false);
  }
  }}
  className={`h-10 rounded-lg border-2 transition-all ${
  organization?.banner === preset.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
  }`}
  style={{ background: preset.style }}
  />
  ))}
  </div>
  </div>

  {/* Upload Custom Banner */}
  <div className="flex items-center gap-2">
  <span className="text-xs text-gray-500">or</span>
  <label className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
  <Upload className="w-3.5 h-3.5" />
  Upload Banner
  <input
  type="file"
  accept="image/*"
  onChange={async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
  setSaving(true);
  const response = await organizationService.uploadBanner(organization._id, file);
  setOrganization(response.data.organization);
  showMessage('Banner uploaded successfully');
  } catch (error) {
  showMessage('Failed to upload banner', 'error');
  } finally {
  setSaving(false);
  }
  }}
  className="hidden"
  />
  </label>
  </div>
  </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
  Organization Name
  </label>
 <input
 type="text"
 value={orgForm.name}
 onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Description
 </label>
 <textarea
 value={orgForm.description}
 onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
 rows={3}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Primary Color
 </label>
 <div className="flex items-center gap-2">
 <input
 type="color"
 value={orgForm.primaryColor}
 onChange={(e) => setOrgForm({ ...orgForm, primaryColor: e.target.value })}
 className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
 />
 <input
 type="text"
 value={orgForm.primaryColor}
 onChange={(e) => setOrgForm({ ...orgForm, primaryColor: e.target.value })}
 className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Secondary Color
 </label>
 <div className="flex items-center gap-2">
 <input
 type="color"
 value={orgForm.secondaryColor}
 onChange={(e) => setOrgForm({ ...orgForm, secondaryColor: e.target.value })}
 className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
 />
 <input
 type="text"
 value={orgForm.secondaryColor}
 onChange={(e) => setOrgForm({ ...orgForm, secondaryColor: e.target.value })}
 className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
 />
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Custom Branding</h3>
 <p className="text-sm text-gray-500 ">Enable custom branding for your organization</p>
 </div>
 <input
 type="checkbox"
 checked={orgForm.brandingEnabled}
 onChange={(e) => setOrgForm({ ...orgForm, brandingEnabled: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Public Profile</h3>
 <p className="text-sm text-gray-500 ">Make organization profile publicly visible</p>
 </div>
 <input
 type="checkbox"
 checked={orgForm.publicProfileEnabled}
 onChange={(e) => setOrgForm({ ...orgForm, publicProfileEnabled: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 <button
 type="submit"
 disabled={saving}
 className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
 >
 <Save className="w-4 h-4 mr-2" />
 {saving ? 'Saving...' : 'Save Changes'}
 </button>
 </form>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default Settings;
