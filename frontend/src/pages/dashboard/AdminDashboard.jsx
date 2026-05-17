import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Brain,
  Timer,
  Link2,
  BarChart2,
  XCircle,
  Target
} from 'lucide-react';
import {
 Radar,
 RadarChart,
 PolarGrid,
 PolarAngleAxis,
 PolarRadiusAxis,
} from 'recharts';
import {
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 BarChart,
 Bar,
 AreaChart,
 Area
} from 'recharts';

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <div className="flex items-start justify-between">
 <div>
 <p className="text-sm font-medium text-gray-500 ">{title}</p>
 <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
 {subtitle && (
 <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
 )}
 </div>
 <div className={`p-3 rounded-lg ${color}`}>
 <Icon className="w-6 h-6 text-white" />
 </div>
 </div>
 </div>
);

const SummaryStatCard = ({ label, value, icon: Icon, colorClass }) => (
 <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
 <div className={`p-3 rounded-lg ${colorClass}`}>
 <Icon className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
 <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
 </div>
 </div>
);

const AdminDashboard = () => {
 const { user } = useAuth();
 const [stats, setStats] = useState(null);
 const [big5Analytics, setBig5Analytics] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [chartMonths, setChartMonths] = useState(6);

 useEffect(() => {
 fetchDashboardData(chartMonths);
 fetchBig5Analytics();
 }, []);

 const fetchDashboardData = async (months) => {
 try {
 setLoading(true);
 const response = await api.get(`/dashboard/admin?months=${months}`);
 if (response.data.success) {
 setStats(response.data.data);
 }
 } catch (err) {
 setError('Failed to load dashboard data');
 } finally {
 setLoading(false);
 }
 };

 const handleMonthsToggle = (months) => {
 setChartMonths(months);
 fetchDashboardData(months);
 };

 const fetchBig5Analytics = async () => {
 try {
 const response = await api.get('/big5/analytics');
 if (response.data.success) {
 setBig5Analytics(response.data.data);
 }
 } catch (err) {
 console.log('Big5 analytics not available');
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

  const creditsRemaining = stats?.stats?.credits?.total - stats?.stats?.credits?.used || 0;
 const creditsLow = creditsRemaining < 100;
 const summary = stats?.summary || {};

 return (
 <div className="space-y-8">
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">
 {user?.organization?.name} Dashboard
 </h1>
 <p className="text-gray-500 mt-1">
 Your company usage pattern and performance insight
 </p>
 </div>

 {/* Credits Alert */}
 {creditsLow && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
 <div className="p-3 bg-amber-100 rounded-lg">
 <AlertCircle className="w-6 h-6 text-amber-600 " />
 </div>
 <div className="flex-1">
 <p className="font-medium text-amber-900 ">
 Low Credits Warning
 </p>
 <p className="text-sm text-amber-700 ">
 You have {creditsRemaining} credits remaining. Request more credits to continue creating assessments.
 </p>
 </div>
<Link
            to={`/o/${user?.organization?.slug}/credits`}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Request Credits
          </Link>
 </div>
 )}

 {/* Stats Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard
  title="Utilization"
  value={`${stats?.stats?.utilization?.rate || 0}%`}
  subtitle={`${stats?.stats?.utilization?.attemptsCompleted || 0} of ${stats?.stats?.utilization?.linksShared || 0} shared`}
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
     title="Total Users"
 value={stats?.stats?.totalUsers || 0}
 subtitle={`+${stats?.stats?.newUsersThisMonth || 0} this month`}
 icon={Users}
 color="bg-blue-500"
  />
  <StatCard
  title="Completed Tests"
 value={stats?.stats?.completedAttempts || 0}
 subtitle={`${stats?.stats?.completionRate || 0}% of Shared Links`}
 icon={CheckCircle}
 color="bg-green-500"
 />
 <StatCard
 title="The Pool"
 value={`${stats?.stats?.credits?.total || 0} / ${stats?.stats?.credits?.used || 0}`}
 subtitle="(allotted / used)"
 icon={CreditCard}
 color={creditsLow ? 'bg-red-500' : 'bg-orange-500'}
 />
 </div>

 {/* Charts */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Time of Tests Wave Chart */}
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <h3 className="text-lg font-semibold text-gray-900 mb-1">
 Time of Tests
 </h3>
 <p className="text-sm text-gray-500 mb-4">When tests are completed (IST, 24h)</p>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={stats?.hourlyAttempts || []}>
 <defs>
 <linearGradient id="timeWaveAdmin" x1="0" y1="0" x2="0" y2="1">
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
 fill="url(#timeWaveAdmin)"
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
 {/* Monthly Distribution vs Utilisation */}
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-gray-900">
 Monthly Distribution vs Utilisation
 </h3>
 <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
 {[6, 12].map((m) => (
 <button
 key={m}
 onClick={() => handleMonthsToggle(m)}
 className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
 chartMonths === m
 ? 'bg-white text-gray-900 shadow-sm'
 : 'text-gray-500 hover:text-gray-700'
 }`}
 >
 {m}M
 </button>
 ))}
 </div>
 </div>
 <p className="text-sm text-gray-500 -mt-4 mb-4">Tests distributed vs completed per month</p>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={stats?.monthlyTrend || []}>
 <defs>
 <linearGradient id="distGradAdmin" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="utilGradAdmin" x1="0" y1="0" x2="0" y2="1">
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
 fill="url(#distGradAdmin)"
 name="Distribution"
 />
 <Area
 type="monotone"
 dataKey="completed"
 stroke="#10b981"
 strokeWidth={2}
 fill="url(#utilGradAdmin)"
 name="Utilisation"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 <div className="flex justify-center gap-6 mt-3">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
 <span className="text-sm text-gray-600">Distribution</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full bg-green-500"></div>
 <span className="text-sm text-gray-600">Utilisation</span>
 </div>
 </div>
 </div>

 {/* Assessment Usage */}
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <h3 className="text-lg font-semibold text-gray-900 mb-6">
 Top Assessments
 </h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={stats?.assessmentUsage || []} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
 <XAxis type="number" tick={{ fontSize: 12 }} />
 <YAxis
 dataKey="assessment.title"
 type="category"
 tick={{ fontSize: 11 }}
 width={120}
 />
 <Tooltip />
 <Bar dataKey="attempts" fill="#6366f1" radius={[0, 4, 4, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 {/* Summary Stats Grid */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Summary</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
 <SummaryStatCard
 label="Expired Tests"
 value={summary.expiredTests ?? 0}
 icon={XCircle}
 colorClass="bg-red-400"
 />
 <SummaryStatCard
 label="Best Time of Tests"
 value={summary.bestTimeOfTests ?? '—'}
 icon={Timer}
 colorClass="bg-indigo-400"
 />
 <SummaryStatCard
 label="Total Test Taker"
 value={summary.totalTestTaker ?? 0}
 icon={Users}
 colorClass="bg-blue-400"
 />
 <SummaryStatCard
 label="Links Shared but Unattended"
 value={summary.linksSharedButUnattended ?? 0}
 icon={Link2}
 colorClass="bg-amber-400"
 />
 <SummaryStatCard
 label="Count of Reports"
 value={summary.countOfReports ?? 0}
 icon={BarChart2}
 colorClass="bg-green-400"
 />
 </div>
 </div>

 {/* Big5 Analytics Section */}
 {big5Analytics && big5Analytics.totalAssessments > 0 && (
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-3 bg-purple-100 rounded-lg">
 <Brain className="w-6 h-6 text-purple-600 " />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-gray-900 ">
 Big Five Personality Analytics
 </h3>
 <p className="text-sm text-gray-500 ">
 Based on {big5Analytics.totalAssessments} completed assessments
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Average OCEAN Radar */}
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <RadarChart data={[
 { trait: 'Openness', score: big5Analytics.averagePercentages.O, fullMark: 100 },
 { trait: 'Conscientiousness', score: big5Analytics.averagePercentages.C, fullMark: 100 },
 { trait: 'Extraversion', score: big5Analytics.averagePercentages.E, fullMark: 100 },
 { trait: 'Agreeableness', score: big5Analytics.averagePercentages.A, fullMark: 100 },
 { trait: 'Neuroticism', score: big5Analytics.averagePercentages.N, fullMark: 100 },
 ]}>
 <PolarGrid />
 <PolarAngleAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
 <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
 <Radar
 name="Organization Average"
 dataKey="score"
 stroke="#8b5cf6"
 strokeWidth={2}
 fill="#8b5cf6"
 fillOpacity={0.3}
 />
 <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
 </RadarChart>
 </ResponsiveContainer>
 </div>

 {/* Trait Level Distribution */}
 <div className="space-y-4">
 <h4 className="text-sm font-medium text-gray-700 ">
 Trait Level Distribution
 </h4>
 {Object.entries(big5Analytics.averageScores).map(([trait, score]) => {
 const traitNames = { O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', N: 'Neuroticism' };
 const colors = { O: 'bg-violet-500', C: 'bg-emerald-500', E: 'bg-amber-500', A: 'bg-pink-500', N: 'bg-red-500' };
 return (
 <div key={trait} className="flex items-center gap-4">
  <span className="w-24 sm:w-32 text-sm text-gray-600 ">{traitNames[trait]}</span>
 <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={`h-full ${colors[trait]} rounded-full`}
 style={{ width: `${(score / 40) * 100}%` }}
 />
 </div>
 <span className="w-12 text-sm font-medium text-gray-900 text-right">
 {score.toFixed(1)}
 </span>
 </div>
 );
 })}
 </div>
 </div>

 {/* Level Distribution Summary */}
 <div className="mt-6 pt-6 border-t border-gray-200 ">
 <h4 className="text-sm font-medium text-gray-700 mb-4">
 Overall Level Distribution
 </h4>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="text-center p-4 bg-blue-50 rounded-lg">
 <p className="text-2xl font-bold text-blue-600 ">
 {big5Analytics.levelDistribution.Low}
 </p>
 <p className="text-sm text-blue-700 ">Low Traits</p>
 </div>
 <div className="text-center p-4 bg-yellow-50 rounded-lg">
 <p className="text-2xl font-bold text-yellow-600 ">
 {big5Analytics.levelDistribution.Moderate}
 </p>
 <p className="text-sm text-yellow-700 ">Moderate Traits</p>
 </div>
 <div className="text-center p-4 bg-green-50 rounded-lg">
 <p className="text-2xl font-bold text-green-600 ">
 {big5Analytics.levelDistribution.High}
 </p>
 <p className="text-sm text-green-700 ">High Traits</p>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default AdminDashboard;
