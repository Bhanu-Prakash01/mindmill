import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { reportService } from '../../services/reportService';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { Brain, Clock, ShieldCheck, Zap, ArrowLeft, Target, Award, Download, Printer, FileText } from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

const CognitiveAbilityReport = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [reportId, setReportId] = useState(null);

  // ── Print handler ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ── PDF download handler ──────────────────────────────────────────────────
  const handleDownload = async (type) => {
    if (downloading) return;
    setDownloading(true);
    try {
      await reportService.downloadReport(reportId, type);
      setShowDownloadModal(false);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/attempts/${attemptId}/simple-results`);
        const result = response.data?.data;
        if (!result) {
          setError('Report data not found');
          return;
        }
        setReportData({
          report: {
            breakdown: result.breakdown,
            generatedAt: result.completedAt,
          },
          testTaker: result.testTaker,
          attempt: {
            timeSpent: result.timeSpentSeconds || 0,
          },
        });
        setReportId(result.reportId);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Brain className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Report</h2>
          <p className="text-gray-500 mb-6">{error || 'Report data not found'}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { report, testTaker, attempt } = reportData;
  const bd = report.breakdown;
  const cacs = bd.cacs || 0;
  const accuracy = bd.accuracy || 0;

  const radarData = [
    { subject: 'Verbal', A: bd.vr || 0, fullMark: 100 },
    { subject: 'Numerical', A: bd.nr || 0, fullMark: 100 },
    { subject: 'Logical', A: bd.lr || 0, fullMark: 100 },
    { subject: 'Critical Thinking', A: bd.ct || 0, fullMark: 100 },
    { subject: 'Working Memory', A: bd.wm || 0, fullMark: 100 },
  ];

  const getStanine = (score) => {
    if (score >= 96) return { value: 9, label: 'Exceptional', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (score >= 89) return { value: 8, label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (score >= 77) return { value: 7, label: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { value: 6, label: 'Above Avg', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 40) return { value: 5, label: 'Average', color: 'text-gray-600', bg: 'bg-gray-100' };
    if (score >= 23) return { value: 4, label: 'Below Avg', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (score >= 11) return { value: 3, label: 'Marginal', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (score >= 4) return { value: 2, label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
    return { value: 1, label: 'Very Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const stanine = getStanine(cacs);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Cognitive Ability Report</h1>
              <p className="text-xs text-gray-500">{testTaker.name} • {new Date(report.generatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => setShowDownloadModal(true)}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <><Download className="w-4 h-4" /> Download PDF</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Header Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl overflow-hidden shadow-xl border border-indigo-900/50">
          <div className="px-8 py-12 sm:px-12 sm:py-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-6">
                  <Brain className="w-3.5 h-3.5" /> Premium Assessment
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                  Cognitive Ability <br className="hidden sm:block"/>Composite Score
                </h2>
                <p className="text-indigo-200 text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
                  This report measures {testTaker.name}'s overarching general cognitive ability (g-factor), assessing reasoning, critical thinking, and working memory.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl flex flex-col items-center min-w-[280px]">
                <div className="text-indigo-200 font-semibold mb-2 uppercase tracking-widest text-sm">CACS™ Score</div>
                <div className="text-7xl font-black text-white tracking-tighter drop-shadow-md">
                  {cacs}
                  <span className="text-3xl text-indigo-300 font-bold">/100</span>
                </div>
                <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${stanine.bg} ${stanine.color}`}>
                  Stanine {stanine.value}: {stanine.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Accuracy Score</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{accuracy}%</div>
              <p className="text-xs text-gray-400 mt-1">Measures precision across domains.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Time Taken</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {Math.floor((attempt?.timeSpent || 0) / 60)}m {(attempt?.timeSpent || 0) % 60}s
              </div>
              <p className="text-xs text-gray-400 mt-1">Speed and cognitive efficiency.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-start gap-4">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Reliability Index</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">High</div>
              <p className="text-xs text-gray-400 mt-1">Based on consistency of responses.</p>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Radar Chart */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              Cognitive Profile Map
            </h3>
            <div className="h-80 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Radar name="Candidate" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#818cf8" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Domain Breakdown */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Domain Mastery
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Verbal Reasoning', score: bd.vr, color: 'bg-violet-500', max: 100 },
                { label: 'Numerical Reasoning', score: bd.nr, color: 'bg-blue-500', max: 100 },
                { label: 'Logical Reasoning', score: bd.lr, color: 'bg-emerald-500', max: 100 },
                { label: 'Critical Thinking', score: bd.ct, color: 'bg-amber-500', max: 100 },
                { label: 'Working Memory', score: bd.wm, color: 'bg-pink-500', max: 100 }
              ].map((domain, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-gray-700">{domain.label}</span>
                    <span className="text-gray-900">{domain.score}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                    <div 
                      className={`h-full ${domain.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: (domain.score || 0) + '%' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Descriptive Insights */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Executive Summary & Implications
          </h3>
          <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed">
            <p>
              Based on the Cognitive Ability Composite Score (CACS™) of <strong>{cacs}/100</strong>, {testTaker.name} demonstrates a <strong>{stanine.label.toLowerCase()}</strong> level of general cognitive aptitude compared to standard benchmarks.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">Strengths</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Rapid assimilation of new information and complex data sets.</li>
                  <li>High proficiency in identifying logical patterns and solving structured problems.</li>
                  <li>Exceptional accuracy ({accuracy}%) showcasing meticulous attention to detail.</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">Development Areas</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Working memory utilization under severe time constraints.</li>
                  <li>Translating abstract numerical concepts into immediate actionable strategy.</li>
                </ul>
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default CognitiveAbilityReport;
