import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  Brain,
  FileBarChart,
  Activity,
  Target,
  Sparkles,
  Layers,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const BAND_COLORS = {
  'Crisis-ready Executive': { bg: 'bg-emerald-50', text: 'text-emerald-800', badge: 'bg-emerald-500', label: 'text-emerald-700', border: 'border-emerald-200' },
  'Strong Situational Leader': { bg: 'bg-green-50', text: 'text-green-800', badge: 'bg-green-500', label: 'text-green-700', border: 'border-green-200' },
  'Reliable Manager': { bg: 'bg-amber-50', text: 'text-amber-800', badge: 'bg-amber-500', label: 'text-amber-700', border: 'border-amber-200' },
  'Moderately Prepared': { bg: 'bg-yellow-50', text: 'text-yellow-800', badge: 'bg-yellow-500', label: 'text-yellow-700', border: 'border-yellow-200' },
  'Stress Vulnerable': { bg: 'bg-red-50', text: 'text-red-800', badge: 'bg-red-500', label: 'text-red-700', border: 'border-red-200' },
};

const RADAR_ICONS = {
  'Composure': Activity,
  'Decision Quality': Brain,
  'Crisis Communication': Zap,
  'Stakeholder Handling': Target,
  'Business Continuity': Layers,
  'Resourcefulness': Sparkles,
  'Escalation Judgement': FileBarChart,
};

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-xl shadow-gray-200">
        <p className="font-bold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-bold text-gray-900">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SjtReport = () => {
  const { attemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiresIn, setShareExpiresIn] = useState(30);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/attempts/${attemptId}/simple-results`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(response.data?.data);
    } catch (err) {
      console.error('Error fetching SJT results:', err);
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');
      const reportId = data?.reportId || attemptId;
      const response = await axios.get(`/api/reports/${reportId}/download?type=comprehensive`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `ESJI_Report_${Date.now()}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error(err.response?.data?.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setSharing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/reports/${data?.reportId || attemptId}/share`, {
        email: shareEmail,
        expiresInDays: parseInt(shareExpiresIn),
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setShareLink(response.data?.shareLink || window.location.href);
      setCopied(true);
      toast.success('Report shared successfully!');
    } catch (err) {
      console.error('Error sharing report:', err);
      toast.error('Failed to share report');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/reports` : '/reports')}
            className="ml-auto text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const breakdown = data.breakdown || {};
  const bandInfo = breakdown.band || '';
  const grade = breakdown.grade || '';
  const bandColors = BAND_COLORS[bandInfo] || BAND_COLORS['Moderately Prepared'];
  const dimensionScores = breakdown.dimensionScores || {};
  const radar = breakdown.radar || {};
  const orgPrefix = orgSlug ? `/o/${orgSlug}` : '';

  const radarChartData = Object.entries(radar).map(([axis, score]) => ({
    axis,
    score,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 group px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all font-medium"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Reports
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowShareModal(true); setShareEmail(data?.testTaker?.email || ''); setCopied(false); }}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative mt-8 mb-16 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-orange-100 via-amber-50 to-transparent rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-gradient-to-tr from-red-100 via-orange-50 to-transparent rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative p-10 sm:p-14 lg:flex justify-between items-center z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm tracking-wide ${bandColors.bg} ${bandColors.label} border ${bandColors.border}`}>
                  <Sparkles className="w-4 h-4" />
                  {bandInfo} {grade ? `(${grade})` : ''}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                Executive Situational<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                  Judgement Index
                </span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed font-normal">
                Measures executive composure, decision quality, crisis leadership, stakeholder management, and business continuity under pressure.
              </p>
            </div>

            {/* Score Card */}
            <div className="mt-8 lg:mt-0 lg:ml-8 flex-shrink-0">
              <div className="bg-white/60 backdrop-blur-md border border-white p-6 rounded-2xl shadow-xl shadow-gray-100/50 text-center min-w-[200px]">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Situational Index</p>
                <p className="text-5xl font-black text-gray-900">{breakdown.situationalIndex ?? data.percentage ?? 0}<span className="text-2xl text-gray-400 font-medium">%</span></p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${bandColors.bg} ${bandColors.label}`}>
                    Grade {grade || '—'}
                  </span>
                </div>
                {data?.testTaker?.name && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">{data.testTaker.name}</p>
                    {data.testTaker.email && (
                      <p className="text-xs text-gray-400">{data.testTaker.email}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Radar + Dimension Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Radar Chart */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Leadership Radar</h2>
            </div>
            {radarChartData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#4b5563', fontWeight: 600, fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={5} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Radar name="Score" dataKey="score" stroke="#ea580c" strokeWidth={3} fill="#ea580c" fillOpacity={0.15} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12">No radar data available</p>
            )}
          </div>

        </div>

        {/* Key Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strongest</p>
                <p className="font-bold text-gray-900">{breakdown.strongestDimension || '—'}</p>
              </div>
            </div>
            {breakdown.strongestDimension && dimensionScores[breakdown.strongestDimension] !== undefined && (
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${dimensionScores[breakdown.strongestDimension]}%` }}></div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weakest</p>
                <p className="font-bold text-gray-900">{breakdown.weakestDimension || '—'}</p>
              </div>
            </div>
            {breakdown.weakestDimension && dimensionScores[breakdown.weakestDimension] !== undefined && (
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-red-400 h-2 rounded-full" style={{ width: `${dimensionScores[breakdown.weakestDimension]}%` }}></div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Promotion Readiness</p>
                <p className="font-bold text-gray-900">{breakdown.promotionReadiness || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">Percentile:</span>
              <span className="text-sm font-bold text-indigo-600">{data.breakdown?.situationalIndex != null ? `${data.breakdown.situationalIndex}th` : (data.percentage != null ? `${data.percentage}th` : '—')}</span>
            </div>
          </div>
        </div>

        {/* Band Description & Summary */}
        <div className="space-y-6 mb-10">
          {breakdown.bandDescription && (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Band Interpretation</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">{breakdown.bandDescription}</p>
            </div>
          )}

          {breakdown.summary && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 text-white/80 rounded-lg">
                  <Brain className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Executive Summary</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">{breakdown.summary}</p>
            </div>
          )}
        </div>

        {/* Candidate Info Footer */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-50 rounded-full">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{data.testTaker?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{data.testTaker?.email || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {data.timeSpent || '—'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        </div>
      </main>

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
                  <p className="text-sm text-green-800 mb-2">Share link ready!</p>
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
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : copied ? (
                    <><Check className="w-4 h-4" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Generate Link</>
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

export default SjtReport;
