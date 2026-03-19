import React, { useState, useEffect } from 'react';
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
 EyeOff
} from 'lucide-react';

const Settings = () => {
 const { user, updateUser } = useAuth();
 const [activeTab, setActiveTab] = useState('profile');
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [message, setMessage] = useState(null);
 const [organization, setOrganization] = useState(null);

 // Profile form
 const [profileForm, setProfileForm] = useState({
 firstName: '',
 lastName: '',
 email: '',
 phone: '',
 jobTitle: '',
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
 await authService.updateProfile(profileForm);
 updateUser(profileForm);
 showMessage('Profile updated successfully');
 } catch (error) {
 console.error('Error updating profile:', error);
 showMessage(error.response?.data?.message || 'Failed to update profile', 'error');
 } finally {
 setSaving(false);
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

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Phone
 </label>
 <input
 type="tel"
 value={profileForm.phone}
 onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="+1 (555) 123-4567"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Job Title
 </label>
 <input
 type="text"
 value={profileForm.jobTitle}
 onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="e.g., HR Manager"
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

 {/* Password Settings */}
 {activeTab === 'password' && (
 <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
 <div>
 <h2 className="text-lg font-semibold text-gray-900 ">Change Password</h2>
 <p className="text-sm text-gray-500 ">Update your password</p>
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
 )}

 {/* Organization Settings */}
 {activeTab === 'organization' && isAdmin && (
 <form onSubmit={handleOrgUpdate} className="space-y-6 max-w-lg">
 <div>
 <h2 className="text-lg font-semibold text-gray-900 ">Organization Settings</h2>
 <p className="text-sm text-gray-500 ">Manage your organization profile</p>
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
