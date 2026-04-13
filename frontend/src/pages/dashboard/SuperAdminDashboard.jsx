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
  MessageSquare
} from 'lucide-react';
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell
} from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <div className="flex items-start justify-between">
 <div>
 <p className="text-sm font-medium text-gray-500 ">{title}</p>
 <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
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

 const subscriptionColors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'];

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
 <div className="grid grid-cols-1 gap-6">
 {/* Monthly Activity Chart */}
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <h3 className="text-lg font-semibold text-gray-900 mb-6">
 Daily Activity (Last 30 Days)
 </h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={stats?.monthlyStats || []}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 12 }}
 tickFormatter={(value) => value?.slice(5) || ''}
 />
 <YAxis tick={{ fontSize: 12 }} />
 <Tooltip />
 <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 </div>
 );
};

export default SuperAdminDashboard;
