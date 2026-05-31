import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Download,
  Share2,
  Mail,
  CheckCircle,
  XCircle,
  BarChart3,
  User,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  Send
} from 'lucide-react';

const ReportDetail = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiresIn, setShareExpiresIn] = useState(30);
  const [sharing, setSharing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const toast = useToast();

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReport(id);
      setReport(response.data?.report);
      setAdminNotes(response.data?.report?.adminNotes || '');
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    setDownloading(true);
    try {
      await reportService.downloadReport(id, type);
      setShowDownloadModal(false);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    setSharing(true);
    try {
      await reportService.shareReport(id, {
        email: shareEmail,
        expiresInDays: parseInt(shareExpiresIn),
      });
      setShowShareModal(false);
      setShareEmail('');
      toast.success('Report shared successfully!');
    } catch (error) {
      console.error('Error sharing report:', error);
      toast.error('Failed to share report');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await reportService.addAdminNotes(id, adminNotes);
      toast.success('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await reportService.toggleVisibility(id, !report.visibleToUser);
      fetchReport();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const getPersonalityProfile = () => {
    if (!report?.dimensions) return null;

    const { DISC, MBTI, BigFive } = report.dimensions;

    return (
      <div className="space-y-6">
        {DISC && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3">DISC Profile</h4>
            <div className="grid grid-cols-4 gap-4">
              {['D', 'I', 'S', 'C'].map((trait) => (
                <div key={trait} className="text-center">
                  <div className="text-2xl font-bold text-purple-700 ">
                    {DISC[trait]?.percentage ?? DISC[trait]?.score ?? 0}
                  </div>
                  <div className="text-xs text-purple-600 uppercase">{trait}</div>
                </div>
              ))}
            </div>
            {DISC.dominant && (
              <div className="mt-3 text-center">
                <span className="inline-flex items-center px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                  Dominant: {DISC.dominant}
                </span>
              </div>
            )}
          </div>
        )}

        {MBTI && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">MBTI Type</h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {MBTI.type || '----'}
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>E/I: {MBTI.EI}%</div>
                <div>S/N: {MBTI.SN}%</div>
                <div>T/F: {MBTI.TF}%</div>
                <div>J/P: {MBTI.JP}%</div>
              </div>
            </div>
          </div>
        )}

        {BigFive && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">Big Five Traits</h4>
            <div className="space-y-2">
              {Object.entries(BigFive).map(([trait, score]) => (
                <div key={trait} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-green-700 capitalize">{trait}</span>
                  <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="w-10 text-sm text-green-700 ">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 ">Report not found</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isOwner = user?._id === report.user?._id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/reports` : '/reports')}
            className="p-2 text-gray-500 hover:text-gray-700 "
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 ">
              Assessment Report
            </h1>
            <p className="text-gray-500 ">
              {report.assessment?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleToggleVisibility}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${report.visibleToUser
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 '
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 '
                }`}
            >
              {report.visibleToUser ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              {report.visibleToUser ? 'Visible' : 'Hidden'}
            </button>
          )}
          <button
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
          <button
            onClick={() => { setShowShareModal(true); setShareEmail(report?.testTakerEmail || report?.user?.email || ''); }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600 ">
                  {report.user?.firstName?.[0]}{report.user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 ">
                  {report.user?.firstName} {report.user?.lastName}
                </h3>
                <p className="text-gray-500 ">{report.user?.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(report.generatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Score Card */}
          {report.scores && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600 ">
                    {report.scores.percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-gray-500 ">Percentage</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600 ">
                    {report.scores.total || 0}
                  </div>
                  <div className="text-sm text-gray-500 ">Score</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600 ">
                    {report.scores.maxScore || 0}
                  </div>
                  <div className="text-sm text-gray-500 ">Max Score</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600 ">
                    {report.scores.percentile || 0}
                  </div>
                  <div className="text-sm text-gray-500 ">Percentile</div>
                </div>
              </div>
            </div>
          )}

          {/* Personality Profile */}
          {(report.type === 'psychometric' || report.type === 'big5') && report.dimensions && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personality Profile</h3>
              {getPersonalityProfile()}
            </div>
          )}

          {/* Analysis */}
          {report.analysis && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis</h3>

              {report.analysis.summary && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-gray-600 ">{report.analysis.summary}</p>
                </div>
              )}

              {report.analysis.strengths?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {report.analysis.strengths.map((strength, i) => (
                      <li key={i} className="text-gray-600 ">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.analysis.developmentAreas?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Development Areas</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {report.analysis.developmentAreas.map((area, i) => (
                      <li key={i} className="text-gray-600 ">{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.analysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {report.analysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-gray-600 ">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Report Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 ">Type</span>
                <span className="text-gray-900 capitalize">{report.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 ">Status</span>
                <span className={`${report.visibleToUser ? 'text-green-600' : 'text-gray-500'}`}>
                  {report.visibleToUser ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 ">Version</span>
                <span className="text-gray-900 ">v{report.version}</span>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Admin Notes</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 mb-3"
                placeholder="Add private notes about this report..."
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          )}

          {/* Shared With */}
          {report.sharedWith?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Shared With</h3>
              <div className="space-y-2">
                {report.sharedWith.map((share, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate">{share.email}</span>
                    <span className="text-xs text-gray-400">
                      {share.viewedAt ? 'Viewed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Download Report</h2>
            <p className="text-sm text-gray-500 mb-6">Choose a format for your PDF download.</p>
            <div className="space-y-3">
              <button
                onClick={() => handleDownload('comprehensive')}
                disabled={downloading}
                className="w-full flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">Comprehensive Report</div>
                  <div className="text-xs text-gray-500">Full analysis with charts and detailed insights</div>
                </div>
              </button>
              <button
                onClick={() => handleDownload('summary')}
                disabled={downloading}
                className="w-full flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                <FileText className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">Summary Report</div>
                  <div className="text-xs text-gray-500">Concise overview with key scores</div>
                </div>
              </button>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Share Report</h2>
            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires In (Days)
                </label>
                <select
                  value={shareExpiresIn}
                  onChange={(e) => setShareExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sharing ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;