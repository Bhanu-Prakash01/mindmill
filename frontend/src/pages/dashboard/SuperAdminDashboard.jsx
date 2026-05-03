import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Users,
  Building2,
  FileText,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  CreditCard,
  HelpCircle,
  Clock,
  XCircle,
  MessageSquare,
  Target,
  Repeat,
  TestTube,
  DollarSign
} from 'lucide-react';
import {
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 AreaChart,
 Area
} from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color, subtitle }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
  <div className="flex items-start justify-between">
  <div>
  <p className="text-sm font-medium text-gray-500 ">{title}</p>
  <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
  {subtitle && (
  <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
  )}
  {trend && (
  <p className={`text-sm mt-2 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
  <TrendingUp className="w-4 h-4" />
  {trend}
  </p>
  )}
  </div>
  <div className={`p-3 rounded-lg ${color}`}>
  <Icon className="w-6 h-6 text-white" />
  </div>
  </div>
  </div>
);

const SuperAdminDashboard = () => {
 const [stats, setStats] = useState(null);
 const [ticketStats, setTicketStats] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
 fetchDashboardData();
 }, []);

 const fetchDashboardData = async () => {
 try {
 const response = await api.get('/dashboard/superadmin');
 if (response.data.success) {
 setStats(response.data.data);
 setTicketStats(response.data.data.ticketStats);
 }
 } catch (err) {
 setError('Failed to load dashboard data');
 } finally {
 setLoading(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
 <p className="text-red-600 ">{error}</p>
 </div>
 );
  }

  return (
 <div className="space-y-8">
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Super Admin Dashboard</h1>
 <p className="text-gray-500 mt-1">
 Overview of the entire platform
 </p>
 </div>

  {/* Stats Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <StatCard
  title="Utilization"
  value={`${stats?.stats?.utilization?.rate || 0}%`}
  subtitle={`${stats?.stats?.utilization?.attemptsCompleted || 0} of ${stats?.stats?.utilization?.linksShared || 0} shared links`}
  icon={Target}
  color="bg-teal-500"
  />
  <StatCard
    title="Test Attempt Time"
    value={`${stats?.stats?.avgAttemptTime || 0} min`}
    subtitle="Avg time per test"
    icon={Clock}
    color="bg-cyan-500"
  />
  <StatCard
    title="Total Organizations"
  value={stats?.stats?.totalOrganizations || 0}
  icon={Building2}
  color="bg-blue-500"
  />
 <StatCard
 title="Total Users"
 value={stats?.stats?.totalUsers || 0}
 icon={Users}
 color="bg-green-500"
 />
 <StatCard
 title="Total Assessments"
 value={stats?.stats?.totalAssessments || 0}
 icon={FileText}
 color="bg-purple-500"
 />
  </div>

  {/* Alerts */}
 {(stats?.stats?.pendingCreditRequests > 0 || stats?.stats?.openTickets > 0) && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{stats?.stats?.pendingCreditRequests > 0 && (
  <Link to="/credits" className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 hover:bg-amber-100 transition-colors">
  <div className="p-3 bg-amber-100 rounded-lg">
  <CreditCard className="w-6 h-6 text-amber-600 " />
  </div>
  <div>
  <p className="font-medium text-amber-900 ">
  {stats.stats.pendingCreditRequests} Pending Credit Requests
  </p>
  <p className="text-sm text-amber-700 ">
  Review and approve credit requests
  </p>
  </div>
  </Link>
  )}
{stats?.stats?.openTickets > 0 && (
  <Link to="/support" className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 hover:bg-red-100 transition-colors">
  <div className="p-3 bg-red-100 rounded-lg">
  <HelpCircle className="w-6 h-6 text-red-600 " />
  </div>
  <div>
  <p className="font-medium text-red-900 ">
  {stats.stats.openTickets} Open Support Tickets
  </p>
  <p className="text-sm text-red-700 ">
  Tickets waiting for response
  </p>
  </div>
  </Link>
  )}
 </div>
  )}

 {/* Ticket Status Breakdown */}
 {ticketStats && (
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
 <Link
 to="/support"
 className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
 >
 View All →
 </Link>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
 <div className="bg-blue-50 rounded-lg p-4 text-center">
 <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
 <p className="text-2xl font-bold text-blue-700">{ticketStats.open || 0}</p>
 <p className="text-xs text-blue-600 mt-1">Open</p>
 </div>
 <div className="bg-yellow-50 rounded-lg p-4 text-center">
 <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
 <p className="text-2xl font-bold text-yellow-700">{ticketStats['in-progress'] || 0}</p>
 <p className="text-xs text-yellow-600 mt-1">In Progress</p>
 </div>
 <div className="bg-orange-50 rounded-lg p-4 text-center">
 <MessageSquare className="w-6 h-6 text-orange-500 mx-auto mb-2" />
 <p className="text-2xl font-bold text-orange-700">{ticketStats.waiting || 0}</p>
 <p className="text-xs text-orange-600 mt-1">Waiting</p>
 </div>
 <div className="bg-green-50 rounded-lg p-4 text-center">
 <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
 <p className="text-2xl font-bold text-green-700">{ticketStats.resolved || 0}</p>
 <p className="text-xs text-green-600 mt-1">Resolved</p>
 </div>
 <div className="bg-gray-50 rounded-lg p-4 text-center">
 <XCircle className="w-6 h-6 text-gray-500 mx-auto mb-2" />
 <p className="text-2xl font-bold text-gray-700">{ticketStats.closed || 0}</p>
 <p className="text-xs text-gray-600 mt-1">Closed</p>
 </div>
 </div>
 </div>
 )}

 {/* Charts */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Time of Tests */}
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <h3 className="text-lg font-semibold text-gray-900 mb-1">
 Time of Tests
 </h3>
 <p className="text-sm text-gray-500 mb-4">When tests are completed (IST, 24h)</p>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={stats?.hourlyAttempts || []}>
 <defs>
 <linearGradient id="timeWave" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis
 dataKey="hour"
 tick={{ fontSize: 11 }}
 tickFormatter={(v) => `${v}:00`}
 />
 <YAxis tick={{ fontSize: 11 }} />
 <Tooltip
 formatter={(value) => [value, 'Tests Completed']}
 labelFormatter={(v) => `${v}:00 - ${v + 1}:00`}
 />
 <Area
 type="monotone"
 dataKey="count"
 stroke="#6366f1"
 strokeWidth={2}
 fill="url(#timeWave)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 <div className="flex justify-between mt-2 px-2">
 <span className="text-xs text-gray-400">Morning {'<'}9am</span>
 <span className="text-xs text-gray-400">Afternoon {'<'}2pm</span>
 <span className="text-xs text-gray-400">Evening {'<'}8pm</span>
 <span className="text-xs text-gray-400">Night {'>'}8pm</span>
 </div>
 </div>
 {/* Admin Enrollment */}
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <h3 className="text-lg font-semibold text-gray-900 mb-1">
 Admin Enrollment
 </h3>
 <p className="text-sm text-gray-500 mb-4">New admins (last 12 months)</p>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={stats?.adminEnrollment || []}>
 <defs>
 <linearGradient id="adminEnrollGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis
 dataKey="month"
 tick={{ fontSize: 11 }}
 tickFormatter={(v) => {
   const [, month] = v?.split('-') || [];
   if (!month) return '';
   const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
   return months[parseInt(month) - 1];
 }}
 />
 <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
 <Tooltip
 formatter={(value) => [value, 'New Admins']}
 labelFormatter={(v) => {
   const [year, month] = v?.split('-') || [];
   if (!month) return '';
   const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
   return `${months[parseInt(month) - 1]} ${year}`;
 }}
 />
 <Area
 type="monotone"
 dataKey="count"
 stroke="#8b5cf6"
 strokeWidth={2}
 fill="url(#adminEnrollGrad)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 {/* Monthly Distribution vs Utilisation */}
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <h3 className="text-lg font-semibold text-gray-900 mb-1">
 Distribution vs Utilisation
 </h3>
 <p className="text-sm text-gray-500 mb-4">Tests per month</p>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={stats?.monthlyTrend || []}>
 <defs>
 <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis
 dataKey="month"
 tick={{ fontSize: 11 }}
 tickFormatter={(v) => {
   const [year, month] = v?.split('-') || [];
   if (!month) return '';
   const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
   return `${months[parseInt(month) - 1]} ${year?.slice(2)}`;
 }}
 />
 <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
 <Tooltip
 formatter={(value, name) => [value, name === 'attempts' ? 'Distribution' : 'Utilisation']}
 labelFormatter={(v) => {
   const [year, month] = v?.split('-') || [];
   if (!month) return '';
   const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
   return `${months[parseInt(month) - 1]} ${year}`;
 }}
 />
 <Area
 type="monotone"
 dataKey="attempts"
 stroke="#6366f1"
 strokeWidth={2}
 fill="url(#distGrad)"
 name="Distribution"
 />
 <Area
 type="monotone"
 dataKey="completed"
 stroke="#10b981"
 strokeWidth={2}
 fill="url(#utilGrad)"
 name="Utilisation"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 <div className="flex justify-center gap-4 mt-3">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
 <span className="text-xs text-gray-500">Distribution</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
 <span className="text-xs text-gray-500">Utilisation</span>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
 <div className="px-6 py-4 border-b border-gray-100">
   <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
 </div>
 <div className="divide-y divide-gray-100">
   <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
     <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-blue-100">
         <Users className="w-5 h-5 text-blue-600" />
       </div>
       <span className="text-sm font-medium text-gray-700">Total Admins</span>
     </div>
     <span className="text-lg font-bold text-gray-900">{stats?.dataTable?.totalAdmins || 0}</span>
   </div>
   <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
     <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-red-100">
         <XCircle className="w-5 h-5 text-red-600" />
       </div>
       <span className="text-sm font-medium text-gray-700">Expired Tests</span>
     </div>
     <span className="text-lg font-bold text-gray-900">{stats?.dataTable?.expiredTests || 0}</span>
   </div>
   <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
     <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-green-100">
         <DollarSign className="w-5 h-5 text-green-600" />
       </div>
       <span className="text-sm font-medium text-gray-700">Total Revenue</span>
     </div>
     <span className="text-lg font-bold text-gray-900">₹{(stats?.dataTable?.totalRevenue || 0).toLocaleString()}</span>
   </div>
   <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
     <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-purple-100">
         <Repeat className="w-5 h-5 text-purple-600" />
       </div>
       <span className="text-sm font-medium text-gray-700">Repeat Clients</span>
     </div>
     <span className="text-lg font-bold text-gray-900">{stats?.dataTable?.repeatClientsCount || 0}</span>
   </div>
   <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
     <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-amber-100">
         <TestTube className="w-5 h-5 text-amber-600" />
       </div>
       <span className="text-sm font-medium text-gray-700">Total Available Tests</span>
     </div>
     <span className="text-lg font-bold text-gray-900">{stats?.dataTable?.totalAvailableTests || 0}</span>
   </div>
 </div>
 </div>

 </div>
 );
};

export default SuperAdminDashboard;
