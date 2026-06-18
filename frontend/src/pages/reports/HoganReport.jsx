import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, reportService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Download,
  Share2,
  BarChart3,
  Users,
  Briefcase,
  MessageCircle,
  Award,
  TrendingUp,
  Lightbulb,
  Target,
  Loader2,
  Brain,
  FileBarChart,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

const HoganReport = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [testTaker, setTestTaker] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiresIn, setShareExpiresIn] = useState(30);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportId, setReportId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchReport();
  }, [attemptId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await attemptService.getAttempt(attemptId);
      const attempt = response.data?.attempt;

    if (attempt && attempt.hoganResults) {
      setReport(attempt.hoganResults);
      setTestTaker({
        name: attempt.testTakerName || null,
        email: attempt.testTakerEmail || null,
        phone: attempt.testTakerPhone || null
      });
      setCompletedAt(attempt.completedAt);
      if (attempt.report) setReportId(attempt.report?._id?.toString() || attempt.report?.toString() || attempt.report);
    } else {
        setError('TraitMap Index results not found for this attempt');
      }
    } catch (err) {
      console.error('Error fetching TraitMap Index report:', err);
      setError('Failed to load TraitMap Index report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      setDownloadModalOpen(false);
      setDownloading(true);
      const response = await fetch(`/api/attempts/${attemptId}/hogan-report/download?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TraitMap_Index_Report_${attemptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!reportId) {
      toast.warning('Share is not available for this report yet.');
      return;
    }
    if (!shareEmail.trim()) {
      toast.warning('Please enter an email address.');
      return;
    }
    try {
      setSharing(true);
      const result = await reportService.shareReport(reportId, {
        email: shareEmail,
        expiresInDays: parseInt(shareExpiresIn),
      });
      const shareUrl = result.data?.shareUrl;
      setShareLink(shareUrl);
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate share link');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileBarChart className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { percentiles, scales, dominantScale, secondaryScale, analysis } = report || {};

  const chartData = Object.entries(percentiles || {}).map(([key, value]) => ({
    scale: key.replace('_', ' '),
    percentile: value,
    fullMark: 100
  }));

  const radarData = Object.entries(percentiles || {}).map(([key, value]) => ({
    scale: key.replace('_', ' '),
    value: value,
    fullMark: 100
  }));

  const scaleOrder = ['Adjustment', 'Ambition', 'Sociability', 'Interpersonal_Sensitivity', 'Prudence', 'Inquisitiveness', 'Learning_Approach'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TraitMap Index</h1>
              <p className="text-sm text-gray-500">
                {testTaker?.name || 'Assessment Report'} • {completedAt && new Date(completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowShareModal(true); setShareLink(''); setShareEmail(testTaker?.email || ''); setCopied(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setDownloadModalOpen(true)}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              Primary Scales
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="scale" stroke="#6b7280" fontSize={11} width={120} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="percentile" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Scale Profile
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="scale" stroke="#6b7280" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9ca3af" fontSize={10} />
                  <Radar name="Percentile" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Scale Details</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">High (≥66)</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">Moderate (34-65)</span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">Low (≤33)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scaleOrder.map(scale => {
              const scaleData = scales?.[scale];
              const percentile = percentiles?.[scale] || 0;
              const level = percentile >= 66 ? 'High' : percentile <= 33 ? 'Low' : 'Moderate';
              
              return (
                <div key={scale} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{scale.replace('_', ' ')}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      level === 'High' ? 'bg-green-100 text-green-700' :
                      level === 'Low' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {level}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Percentile</span>
                      <span className="font-semibold">{percentile}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${percentile}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    {scaleData?.interpretation || 'No interpretation available'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {analysis && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Strengths
              </h2>
              <div className="space-y-4">
                {(analysis.strengths || []).map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{strength.scale}</p>
                      <p className="text-sm text-gray-600">{strength.description}</p>
                    </div>
                  </div>
                ))}
                {(analysis.strengths || []).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No significant strengths identified</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-600" />
                Development Areas
              </h2>
              <div className="space-y-4">
                {(analysis.developmentAreas || []).map((area, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <Target className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{area.scale}</p>
                      <p className="text-sm text-gray-600">{area.description}</p>
                    </div>
                  </div>
                ))}
                {(analysis.developmentAreas || []).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No significant development areas identified</p>
                )}
              </div>
            </div>
          </div>
        )}

        {analysis?.workStyle && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Work Style
            </h2>
            <p className="text-gray-700 leading-relaxed">{analysis.workStyle}</p>
          </div>
        )}

        {analysis?.teamFit && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Team Fit
            </h2>
            <p className="text-gray-700 leading-relaxed">{analysis.teamFit}</p>
          </div>
        )}

        {analysis?.leadershipStyle && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
              Leadership Style
            </h2>
            <p className="text-gray-700 leading-relaxed">{analysis.leadershipStyle}</p>
          </div>
        )}

        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Recommendations
            </h2>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
       </main>

      {/* Download Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDownloadModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Download Report</h3>
              <p className="text-sm text-gray-500 mb-6">Select the level of detail for the PDF report.</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleDownload('comprehensive')}
                  className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Comprehensive Report (AI)</div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">Full deep dive with psychometric narrative, insights, and development roadmap.</div>
                  </div>
                </button>

                <button
                  onClick={() => handleDownload('summary')}
                  className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg shrink-0">
                    <FileBarChart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Summary Report</div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">Concise overview with dimension scores and key insights.</div>
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDownloadModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
              <input
                type="email"
                required
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (days)</label>
              <select
                value={shareExpiresIn}
                onChange={(e) => setShareExpiresIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>
            {shareLink && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-2">Share link copied to clipboard!</p>
                <code className="text-xs text-green-700 break-all block">{shareLink}</code>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowShareModal(false); setShareLink(''); setShareEmail(''); setCopied(false); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sharing}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Generate Link
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
     )}
     </div>
   );
};

export default HoganReport;