import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Share2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Brain,
  FileBarChart,
  Users,
  Activity,
  Heart,
  Target,
  Sparkles,
  Layers
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

const FiroReport = () => {
  const { attemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [testTaker, setTestTaker] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/attempts/${attemptId}/firo/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        setAnalysis(data.data.analysis);
        setTestTaker(data.data.testTaker);
        setCompletedAt(data.data.completedAt);
        setReportId(data.data.reportId);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load FIRO-B results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    if (!reportId) {
      alert('Report not ready yet. Please wait a moment and try again.');
      return;
    }
    setDownloadModalOpen(false);
    setDownloading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/download?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `FIRO-B_Report_${Date.now()}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      // Delay revocation so browser can initiate the download first
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 3000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(error.message || 'Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My FIRO-B Personality Profile',
          text: `Check out my interpersonal needs scales!`,
          url: window.location.href
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center relative">
          <div className="absolute inset-0 bg-fuchsia-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
          <Loader2 className="w-16 h-16 animate-spin text-fuchsia-600 mx-auto mb-4 relative z-10" />
          <p className="text-gray-600 font-medium tracking-wide relative z-10">Generating premium report analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-red-600 font-medium text-lg mb-6">{error}</p>
          <button
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/` : '/')}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-red-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { dimensions, totals } = results;

  const chartData = [
    { name: 'Inclusion', Expressed: dimensions?.Expressed?.Inclusion || 0, Wanted: dimensions?.Wanted?.Inclusion || 0, fullMark: 9 },
    { name: 'Control', Expressed: dimensions?.Expressed?.Control || 0, Wanted: dimensions?.Wanted?.Control || 0, fullMark: 9 },
    { name: 'Affection', Expressed: dimensions?.Expressed?.Affection || 0, Wanted: dimensions?.Wanted?.Affection || 0, fullMark: 9 }
  ];

  const dimensionGradients = {
    Inclusion: "from-blue-500 to-indigo-600",
    Control: "from-amber-500 to-orange-600",
    Affection: "from-rose-500 to-pink-600"
  };

  const dimensionIcons = {
    Inclusion: <Users className="w-7 h-7 text-white" />,
    Control: <Target className="w-7 h-7 text-white" />,
    Affection: <Heart className="w-7 h-7 text-white" />
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-xl shadow-xl shadow-indigo-100/50">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 text-sm">{entry.name}:</span>
              <span className="font-bold text-gray-900 ml-auto">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 font-sans selection:bg-fuchsia-200 selection:text-fuchsia-900">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all">
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
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => setDownloadModalOpen(true)}
                disabled={downloading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-fuchsia-200 hover:shadow-fuchsia-300 hover:-translate-y-0.5"
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
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-fuchsia-100 via-indigo-50 to-transparent rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-gradient-to-tr from-rose-100 via-amber-50 to-transparent rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative p-10 sm:p-14 lg:flex justify-between items-center z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-50 to-indigo-50 text-indigo-700 rounded-full font-medium text-sm mb-6 border border-fuchsia-100/50">
                <Sparkles className="w-4 h-4 text-fuchsia-500" /> Premium Psychometric Assessment
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                FIRO-B Profile <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600">
                  Interpersonal Dynamics
                </span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed font-normal">
                Discover your Fundamental Interpersonal Relations Orientation. This precise mapping examines the deep interplay between your expressed behaviors and your core wanted needs.
              </p>
            </div>

            {testTaker && (testTaker.name || testTaker.email) && (
              <div className="mt-8 lg:mt-0 lg:ml-8 flex-shrink-0 bg-white/60 backdrop-blur-md border border-white p-6 rounded-2xl shadow-xl shadow-gray-100/50">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Candidate Identity</h3>
                {testTaker.name && <p className="text-xl font-bold text-gray-900 mb-1">{testTaker.name}</p>}
                {testTaker.email && <p className="text-sm font-medium text-gray-500 mb-3">{testTaker.email}</p>}
                {completedAt && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs font-semibold text-gray-600">
                      Scored {new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* The 3 Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {chartData.map((d) => (
            <div key={d.name} className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm shadow-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${dimensionGradients[d.name]} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${dimensionGradients[d.name]} shadow-lg`}>
                  {dimensionIcons[d.name]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{d.name}</h3>
                  <p className="text-sm text-gray-400 font-medium">Dimension Score</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-gray-600 flex items-center gap-2 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Expressed <span className="lowercase text-gray-400 font-normal">(e)</span>
                    </span>
                    <span className="text-lg font-black text-gray-900">{d.Expressed} <span className="text-sm text-gray-400 font-medium">/ 9</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${((d.Expressed ?? 0) / 9) * 100}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-gray-600 flex items-center gap-2 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span> Wanted <span className="lowercase text-gray-400 font-normal">(w)</span>
                    </span>
                    <span className="text-lg font-black text-gray-900">{d.Wanted} <span className="text-sm text-gray-400 font-medium">/ 9</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 h-full rounded-full transition-all duration-1000 ease-out delay-150" style={{ width: `${((d.Wanted ?? 0) / 9) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Analytics Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileBarChart className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Comparative Scale Matrix</h2>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontWeight: 600 }} dy={10} />
                  <YAxis domain={[0, 9]} tickCount={10} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', opacity: 0.4 }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Expressed" name="Expressed Behavior" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={36} />
                  <Bar dataKey="Wanted" name="Wanted Need" fill="#d946ef" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-fuchsia-50 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2"></div>
            <div className="w-full flex items-center gap-3 mb-4 relative z-10">
               <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Dynamic Orientation Radar</h2>
            </div>
            <div className="h-80 w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#4b5563', fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 9]} tickCount={4} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Radar name="Expressed" dataKey="Expressed" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.2} />
                    <Radar name="Wanted" dataKey="Wanted" stroke="#d946ef" strokeWidth={3} fill="#d946ef" fillOpacity={0.2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Deep Analysis Intelligence Area */}
        {analysis && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-3xl p-1 relative overflow-hidden shadow-xl shadow-gray-900/20">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-indigo-600 opacity-20 blur-2xl"></div>
              <div className="bg-white rounded-[23px] p-8 sm:p-10 relative z-10 h-full">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Brain className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Extensive Interpersonal Intelligence Profile</h2>
                </div>
                
                <div className="grid lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 prose prose-lg prose-indigo max-w-none text-gray-600 leading-relaxed font-medium">
                    <p className="first-letter:text-6xl first-letter:font-black first-letter:text-indigo-600 first-letter:mr-2 first-letter:float-left first-letter:leading-none">{(analysis.deepProfileHtml || '').replace(/<[^>]*>/g, '')}</p>
                    <p className="mt-6">{Array.isArray(analysis.fulfillment?.Control) ? analysis.fulfillment.Control.join(' ') : ''}</p>
                    <p className="mt-6">{Array.isArray(analysis.fulfillment?.Affection) ? analysis.fulfillment.Affection.join(' ') : ''}</p>
                  </div>
                  
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 bg-indigo-200/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-widest relative z-10">Leadership Dynamic</h3>
                        <p className="text-indigo-800 leading-relaxed font-medium relative z-10">{analysis.leadership?.highestExpressed || analysis.leadershipHtml?.replace(/<[^>]*>/g, '') || 'N/A'}</p>
                     </div>
                     <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 border border-fuchsia-100 rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute bottom-0 right-0 p-8 bg-fuchsia-200/50 rounded-full blur-2xl translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="font-bold text-fuchsia-900 mb-3 text-sm uppercase tracking-widest relative z-10">Overall Demand Vector</h3>
                        <p className="text-fuchsia-800 leading-relaxed font-medium relative z-10 mb-4">{analysis.coverSummary || ''}</p>
                        
                        <div className="pt-4 border-t border-fuchsia-200/50 relative z-10">
                           <p className="text-xs font-bold text-fuchsia-700 uppercase tracking-widest mb-1">Global Interaction Score</p>
                           <p className="text-3xl font-black text-fuchsia-600">{totals?.overallTotal ?? 0} <span className="text-lg text-fuchsia-400 font-medium">/ 54</span></p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Download Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDownloadModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left border border-white/20">
            <div className="p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Export Record</h3>
              <p className="text-base text-gray-500 mb-8 font-medium">Select the analytical depth to export locally.</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleDownload('comprehensive')}
                  className="group w-full flex items-start gap-5 p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left relative overflow-hidden"
                >
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shrink-0 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <div className="font-bold text-gray-900 text-base mb-1 group-hover:text-indigo-700 transition-colors">Comprehensive Briefing</div>
                    <div className="text-sm text-gray-500 leading-relaxed font-medium">Complete psychometric breakdown exploring dimension interplay vectors.</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDownload('summary')}
                  className="group w-full flex items-start gap-5 p-5 rounded-2xl border-2 border-gray-100 hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-all text-left relative overflow-hidden"
                >
                  <div className="p-3 bg-gray-100 text-gray-600 group-hover:bg-gradient-to-br group-hover:from-fuchsia-500 group-hover:to-pink-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-fuchsia-200 transition-all rounded-xl shrink-0 group-hover:scale-110">
                    <FileBarChart className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <div className="font-bold text-gray-900 text-base mb-1 group-hover:text-fuchsia-700 transition-colors">Summary Sheet</div>
                    <div className="text-sm text-gray-500 leading-relaxed font-medium">1-page high-level overview visualization.</div>
                  </div>
                </button>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setDownloadModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiroReport;
