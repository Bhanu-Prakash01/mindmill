import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';
import { Link, useParams } from 'react-router-dom';
import {
  FileBarChart,
  Search,
  Download,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  Phone,
  Brain,
  Layers,
  ExternalLink,
  ChevronDown,
  Clock
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
      alert('PDF download feature coming soon!');
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getReportLink = (report) => {
    const attemptId = typeof report.attempt === 'object' ? report.attempt?._id : report.attempt || report._id;
    if (report.assessment?.category === 'big5') return `${orgPrefix}/reports/big5/${attemptId}`;
    if (report.assessment?.category === 'disc') return `${orgPrefix}/reports/disc/${attemptId}`;
    return `${orgPrefix}/reports/${report._id}`;
  };

  const getTypeConfig = (type) => {
    const configs = {
      big5: { label: 'Big Five', color: 'bg-violet-100 text-violet-700', icon: Brain },
      disc: { label: 'DISC', color: 'bg-teal-100 text-teal-700', icon: Layers },
      psychometric: { label: 'Psychometric', color: 'bg-purple-100 text-purple-700', icon: Brain },
      cognitive: { label: 'Cognitive', color: 'bg-blue-100 text-blue-700', icon: FileBarChart },
      situational: { label: 'Situational', color: 'bg-orange-100 text-orange-700', icon: FileBarChart },
      standard: { label: 'Standard', color: 'bg-gray-100 text-gray-700', icon: FileBarChart },
    };
    return configs[type] || configs.standard;
  };

  const filteredReports = reports.filter(report => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      report.assessment?.title?.toLowerCase().includes(searchLower) ||
      report.user?.firstName?.toLowerCase().includes(searchLower) ||
      report.user?.lastName?.toLowerCase().includes(searchLower) ||
      report.testTakerName?.toLowerCase().includes(searchLower) ||
      report.testTakerEmail?.toLowerCase().includes(searchLower);
    const matchesType = filterType === 'all' || report.type === filterType || report.assessment?.category === filterType;
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
          <h1 className="text-2xl font-bold text-gray-900">Assessment Reports</h1>
          <p className="text-gray-500 mt-1">
            {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or assessment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="all">All Types</option>
            <option value="big5">Big Five</option>
            <option value="disc">DISC</option>
            <option value="psychometric">Psychometric</option>
            <option value="standard">Standard</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Conducted By</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                {isAdmin && (
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility</th>
                )}
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((report) => {
                const typeConfig = getTypeConfig(report.type || report.assessment?.category);
                const TypeIcon = typeConfig.icon;
                const candidateName = report.testTakerName || (report.user ? `${report.user.firstName} ${report.user.lastName || ''}`.trim() : 'Anonymous');
                const candidateEmail = report.testTakerEmail || report.user?.email || '';
                const candidatePhone = report.testTakerPhone || report.user?.phone || '';

                return (
                  <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Candidate */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 text-sm font-semibold">
                            {candidateName?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{candidateName}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                            {candidateEmail && <Mail className="w-3 h-3 flex-shrink-0" />}
                            <span className="truncate">{candidateEmail}</span>
                          </div>
                          {candidatePhone && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{candidatePhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assessment */}
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg ${typeConfig.color} flex-shrink-0 mt-0.5`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{report.assessment?.title || 'N/A'}</div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${typeConfig.color} mt-1`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Conducted By */}
                    <td className="px-5 py-4">
                      {report.conductedBy ? (
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-600 text-xs font-semibold">
                              {report.conductedBy.firstName?.[0]}{report.conductedBy.lastName?.[0] || ''}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-gray-900 truncate">
                              {report.conductedBy.firstName} {report.conductedBy.lastName || ''}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {report.conductedBy.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Self-assessment</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(report.generatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(report.generatedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Visibility (admin only) */}
                    {isAdmin && (
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleVisibility(report._id, report.visibleToUser)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            report.visibleToUser
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={report.visibleToUser ? 'Click to hide from user' : 'Click to show to user'}
                        >
                          {report.visibleToUser ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {report.visibleToUser ? 'Visible' : 'Hidden'}
                        </button>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={getReportLink(report)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View full report"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={getReportLink(report)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Open in new tab"
                          target="_blank"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDownload(report._id)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-16">
            <FileBarChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No reports found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search term' : 'Reports will appear here after assessments are completed'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
