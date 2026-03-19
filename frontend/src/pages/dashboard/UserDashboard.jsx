import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
 FileText,
 CheckCircle,
 Clock,
 TrendingUp,
 Award,
 Calendar,
 ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color }) => (
 <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
 <div className="flex items-center gap-4">
 <div className={`p-3 rounded-lg ${color}`}>
 <Icon className="w-6 h-6 text-white" />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-500 ">{title}</p>
 <h3 className="text-2xl font-bold text-gray-900 ">{value}</h3>
 </div>
 </div>
 </div>
);

const UserDashboard = () => {
 const [stats, setStats] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
 fetchDashboardData();
 }, []);

 const fetchDashboardData = async () => {
 try {
 const response = await api.get('/dashboard/user');
 if (response.data.success) {
 setStats(response.data.data);
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

 const formatTime = (seconds) => {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins}m ${secs}s`;
 };

 return (
 <div className="space-y-8">
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">My Dashboard</h1>
 <p className="text-gray-500 mt-1">
 Track your assessments and view your results
 </p>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <StatCard
 title="Assigned"
 value={stats?.stats?.totalAssigned || 0}
 icon={FileText}
 color="bg-blue-500"
 />
 <StatCard
 title="Completed"
 value={stats?.stats?.totalCompleted || 0}
 icon={CheckCircle}
 color="bg-green-500"
 />
 <StatCard
 title="In Progress"
 value={stats?.stats?.totalInProgress || 0}
 icon={Clock}
 color="bg-amber-500"
 />
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Pending Assessments */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
 <div className="p-6 border-b border-gray-100 flex items-center justify-between">
 <h3 className="text-lg font-semibold text-gray-900 ">
 Pending Assessments
 </h3>
 <span className="text-sm text-gray-500 ">
 {stats?.pendingAssessments?.length || 0} pending
 </span>
 </div>
 <div className="divide-y divide-gray-100 ">
 {stats?.pendingAssessments?.map((assessment) => {
   const isDraft = !assessment.isPublished;
   const hasAttempted = assessment.attemptCount > 0;
   const canStart = !isDraft && (!hasAttempted || (assessment.allowMultipleAttempts && assessment.attemptCount < (assessment.maxAttempts || 1)));
   
   return (
     <div key={assessment._id} className="p-4 hover:bg-gray-50 ">
       <div className="flex items-center justify-between">
         <div className="flex-1">
           <div className="flex items-center gap-2">
             <p className="font-medium text-gray-900 ">
               {assessment.title}
             </p>
             {isDraft && (
               <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase tracking-wider">
                 Draft
               </span>
             )}
             {hasAttempted && !isDraft && (
               <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full uppercase tracking-wider">
                 Attempted {assessment.attemptCount}x
               </span>
             )}
           </div>
           <div className="flex items-center gap-4 mt-1">
             <span className="text-sm text-gray-500 capitalize">
               {assessment.category}
             </span>
             <span className="text-sm text-gray-500 ">
               {assessment.difficulty}
             </span>
             {assessment.timeBound?.enabled && (
               <span className="text-sm text-gray-500 flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 {assessment.timeBound.durationMinutes} min
               </span>
             )}
           </div>
         </div>
         {canStart ? (
           <Link
             to={`/assessments/${assessment._id}/start`}
             className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 shrink-0"
           >
             {hasAttempted ? 'Re-attempt' : 'Start'}
             <ArrowRight className="w-4 h-4" />
           </Link>
         ) : (
           <div className="flex items-center gap-2 shrink-0">
             {isDraft ? (
               <button
                 disabled
                 className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg flex items-center gap-2 transition-colors cursor-not-allowed"
               >
                 <Clock className="w-4 h-4" />
                 Draft
               </button>
             ) : (
               <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2">
                 <CheckCircle className="w-4 h-4" />
                 Completed
               </span>
             )}
           </div>
         )}
       </div>
     </div>
   );
 })}
 {(!stats?.pendingAssessments || stats.pendingAssessments.length === 0) && (
 <div className="p-8 text-center">
 <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
 <p className="text-gray-900 font-medium">All caught up!</p>
 <p className="text-gray-500 text-sm mt-1">
 You have no pending assessments
 </p>
 </div>
 )}
 </div>
 </div>

 {/* In Progress */}
 {stats?.inProgressAttempts && stats.inProgressAttempts.length > 0 && (
 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
 <div className="p-6 border-b border-gray-100 ">
 <h3 className="text-lg font-semibold text-gray-900 ">
 Continue Where You Left Off
 </h3>
 </div>
 <div className="divide-y divide-gray-100 ">
 {stats.inProgressAttempts.map((attempt) => (
 <div key={attempt._id} className="p-4 hover:bg-gray-50 ">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
 <Clock className="w-5 h-5 text-blue-600 " />
 </div>
 <div>
 <p className="font-medium text-gray-900 ">
 {attempt.assessment?.title}
 </p>
 <p className="text-sm text-gray-500 ">
 Started {new Date(attempt.startedAt).toLocaleDateString()}
 </p>
 </div>
 </div>
 <Link
 to={`/attempts/${attempt._id}`}
 className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
 >
 Resume
 </Link>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Sidebar */}
 <div className="space-y-6">

 {/* Performance by Category */}
 {stats?.performanceByCategory && stats.performanceByCategory.length > 0 && (
 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 ">
 <h3 className="font-semibold text-gray-900 ">By Category</h3>
 </div>
 <div className="divide-y divide-gray-100 ">
 {stats.performanceByCategory.map((cat, index) => (
 <div key={index} className="p-4">
 <div className="flex items-center justify-between">
 <span className="text-sm text-gray-700 capitalize">
 {cat.category}
 </span>
 <span className="font-semibold text-gray-900 ">
 {cat.averageScore}%
 </span>
 </div>
 <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-primary-500 rounded-full"
 style={{ width: `${cat.averageScore}%` }}
 />
 </div>
 <p className="text-xs text-gray-400 mt-1">
 {cat.attempts} attempt{cat.attempts !== 1 ? 's' : ''}
 </p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default UserDashboard;
