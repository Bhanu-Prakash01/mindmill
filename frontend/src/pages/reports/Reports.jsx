import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';
import { Link, useParams } from 'react-router-dom';
import {
 FileBarChart,
 Search,
 Filter,
 Download,
 Share2,
 Eye,
 EyeOff,
 Calendar,
 User,
 CheckCircle,
 XCircle,
 BarChart3
} from 'lucide-react';

const Reports = () => {
 const { user } = useAuth();
 const { orgSlug } = useParams();
 const orgPrefix = orgSlug ? `/o/${orgSlug}` : '';
 const [reports, setReports] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [filterType, setFilterType] = useState('all');

 useEffect(() => {
 fetchReports();
 }, []);

 const fetchReports = async () => {
 try {
 setLoading(true);
 const response = await reportService.getReports();
 setReports(response.data?.reports || []);
 } catch (error) {
 console.error('Error fetching reports:', error);
 } finally {
 setLoading(false);
 }
 };

 const handleToggleVisibility = async (id, currentVisibility) => {
 try {
 await reportService.toggleVisibility(id, !currentVisibility);
 fetchReports();
 } catch (error) {
 console.error('Error toggling visibility:', error);
 }
 };

 const handleDownload = async (id) => {
 try {
 const response = await reportService.downloadReport(id);
 // In production, this would trigger a PDF download
 console.log('Download response:', response);
 alert('PDF download feature coming soon!');
 } catch (error) {
 console.error('Error downloading report:', error);
 }
 };

 const getTypeBadge = (type) => {
 const styles = {
 psychometric: 'bg-purple-100 text-purple-700 ',
 cognitive: 'bg-blue-100 text-blue-700 ',
 situational: 'bg-orange-100 text-orange-700 ',
 standard: 'bg-gray-100 text-gray-700 ',
 };
 const labels = {
 psychometric: 'Psychometric',
 cognitive: 'Cognitive',
 situational: 'Situational',
 standard: 'Standard',
 };
 return (
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || styles.standard}`}>
 {labels[type] || type}
 </span>
 );
 };

 const filteredReports = reports.filter(report => {
 const matchesSearch =
 report.assessment?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 report.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 report.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesType = filterType === 'all' || report.type === filterType;
 return matchesSearch && matchesType;
 });

 const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
 <h1 className="text-2xl font-bold text-gray-900 ">Reports</h1>
 <p className="text-gray-500 mt-1">View and manage assessment reports</p>
 </div>
 </div>

 {/* Filters */}
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 <input
 type="text"
 placeholder="Search reports..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
 />
 </div>
 <select
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="all">All Types</option>
 <option value="psychometric">Psychometric</option>
 <option value="cognitive">Cognitive</option>
 <option value="situational">Situational</option>
 <option value="standard">Standard</option>
 </select>
 </div>

 {/* Reports Table */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 ">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 ">
 {filteredReports.map((report) => (
 <tr key={report._id} className="hover:bg-gray-50 ">
 <td className="px-6 py-4">
 <div>
 <div className="text-sm font-medium text-gray-900 ">
 {report.assessment?.title}
 </div>
 <div className="text-sm text-gray-500 ">
 {report.assessment?.category}
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center">
 <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
 <span className="text-indigo-600 text-sm font-medium">
 {report.user?.firstName?.[0]}{report.user?.lastName?.[0]}
 </span>
 </div>
 <div className="ml-3">
 <div className="text-sm text-gray-900 ">
 {report.user?.firstName} {report.user?.lastName}
 </div>
 <div className="text-sm text-gray-500 ">{report.user?.email}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">{getTypeBadge(report.type)}</td>
 <td className="px-6 py-4">
 {report.scores?.percentage ? (
 <div className="flex items-center gap-2">
 <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full ${
 report.scores.percentage >= 60
 ? 'bg-green-500'
 : report.scores.percentage >= 40
 ? 'bg-yellow-500'
 : 'bg-red-500'
 }`}
 style={{ width: `${report.scores.percentage}%` }}
 />
 </div>
 <span className="text-sm font-medium text-gray-900 ">
 {report.scores.percentage.toFixed(1)}%
 </span>
 </div>
 ) : (
 <span className="text-sm text-gray-500">N/A</span>
 )}
 </td>
 <td className="px-6 py-4 text-sm text-gray-500 ">
 {new Date(report.generatedAt).toLocaleDateString()}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <Link
 to={report.assessment?.category === 'big5'
 ? `${orgPrefix}/reports/big5/${typeof report.attempt === 'object' ? report.attempt?._id : report.attempt || report._id}`
 : report.assessment?.category === 'disc'
 ? `${orgPrefix}/reports/disc/${typeof report.attempt === 'object' ? report.attempt?._id : report.attempt || report._id}`
 : `${orgPrefix}/reports/${report._id}`
 }
 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
 title="View Report"
 >
 <Eye className="w-4 h-4" />
 </Link>
 {isAdmin && (
 <button
 onClick={() => handleToggleVisibility(report._id, report.visibleToUser)}
 className={`p-2 rounded-lg transition-colors ${
 report.visibleToUser
 ? 'text-green-600 hover:bg-green-50 '
 : 'text-gray-400 hover:bg-gray-100 '
 }`}
 title={report.visibleToUser ? 'Visible to user' : 'Hidden from user'}
 >
 {report.visibleToUser ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
 </button>
 )}
 <button
 onClick={() => handleDownload(report._id)}
 className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
 title="Download PDF"
 >
 <Download className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {filteredReports.length === 0 && (
 <div className="text-center py-12">
 <FileBarChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 ">No reports found</p>
 </div>
 )}
 </div>
 </div>
 );
};

export default Reports;
