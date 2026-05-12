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
  Award,
  TrendingUp,
  Lightbulb,
  Target,
  Loader2,
  Brain,
  FileBarChart,
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

const DiscReport = () => {
 const { attemptId, orgSlug } = useParams();
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

    if (attempt && attempt.discResults) {
    setReport(attempt.discResults);
    setTestTaker({
      name: attempt.testTakerName || null,
      email: attempt.testTakerEmail || null,
      phone: attempt.testTakerPhone || null
    });
    setCompletedAt(attempt.completedAt);
    if (attempt.report) setReportId(attempt.report?._id?.toString() || attempt.report?.toString() || attempt.report);
    } else {
  setError('DISC results not found for this attempt');
  }
  } catch (err) {
  console.error('Error fetching DISC report:', err);
  setError('Failed to load DISC report');
  } finally {
  setLoading(false);
  }
  };

   const handleDownload = async (type) => {
   try {
     setDownloadModalOpen(false);
     setDownloading(true);
     // Generate PDF download using backend endpoint
     const response = await fetch(`/api/attempts/${attemptId}/disc-report/download?type=${type}`, {
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
     link.href = url;
     
     // Extract filename from Content-Disposition header if available
     const contentDisposition = response.headers.get('Content-Disposition');
     let filename = `DISC_Report_${Date.now()}.pdf`;
     if (contentDisposition) {
       const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
       if (filenameMatch) {
         filename = filenameMatch[1];
       }
     }
     
     link.setAttribute('download', filename);
     document.body.appendChild(link);
     link.click();
     link.parentNode.removeChild(link);
     window.URL.revokeObjectURL(url);
} catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF. Please try again.');
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
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="max-w-4xl mx-auto p-6">
 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
 <p className="text-red-600 ">{error}</p>
 <button
 onClick={() => navigate(orgSlug ? `/o/${orgSlug}/` : '/')}
 className="mt-4 text-indigo-600 hover:text-indigo-700"
 >
 Return to Dashboard
 </button>
 </div>
 </div>
 );
 }

 if (!report) return null;

 const { percentages, dominant, secondary, pattern, analysis, dimensions } = report;

 // Prepare chart data
 const barData = [
 { name: 'Dominance (D)', value: percentages.D, fill: '#ef4444' },
 { name: 'Influence (I)', value: percentages.I, fill: '#f59e0b' },
 { name: 'Steadiness (S)', value: percentages.S, fill: '#10b981' },
 { name: 'Conscientiousness (C)', value: percentages.C, fill: '#3b82f6' }
 ];

 const radarData = [
 { subject: 'Dominance', A: percentages.D, fullMark: 100 },
 { subject: 'Influence', A: percentages.I, fullMark: 100 },
 { subject: 'Steadiness', A: percentages.S, fullMark: 100 },
 { subject: 'Conscientiousness', A: percentages.C, fullMark: 100 }
 ];

 const traitColors = {
 D: 'bg-red-500',
 I: 'bg-amber-500',
 S: 'bg-emerald-500',
 C: 'bg-blue-500'
 };

 const traitTextColors = {
 D: 'text-red-600 ',
 I: 'text-amber-600 ',
 S: 'text-emerald-600 ',
 C: 'text-blue-600 '
 };

 const traitBgColors = {
 D: 'bg-red-50 ',
 I: 'bg-amber-50 ',
 S: 'bg-emerald-50 ',
 C: 'bg-blue-50 '
 };

 return (
 <div className="max-w-6xl mx-auto p-6 space-y-8">
 {/* Header */}
 <div className="flex items-center justify-between print:hidden">
 <button
 onClick={() => navigate(-1)}
 className="flex items-center text-gray-600 hover:text-gray-900 "
 >
 <ArrowLeft className="w-5 h-5 mr-2" />
 Back
 </button>
   <div className="flex gap-3">
   <button
   onClick={() => { setShowShareModal(true); setShareLink(''); setShareEmail(testTaker?.email || ''); setCopied(false); }}
   className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 "
   >
   <Share2 className="w-4 h-4 mr-2" />
   Share
   </button>
  <button
  onClick={() => setDownloadModalOpen(true)}
  disabled={downloading}
  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
  {downloading ? (
    <>
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    Generating...
    </>
  ) : (
    <>
    <Download className="w-4 h-4 mr-2" />
    Download PDF
    </>
  )}
  </button>
  </div>
 </div>

 {/* Report Title */}
 <div className="text-center pb-8 border-b border-gray-200 ">
 <h1 className="text-3xl font-bold text-gray-900 mb-2">
  DISC Personality Profile
 </h1>
 <p className="text-xl text-gray-600 ">
  {pattern}
 </p>
 </div>

 {/* Test Taker Details */}
 {testTaker && (testTaker.name || testTaker.email) && (
 <div className="bg-white rounded-xl p-6 border border-gray-200">
  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Candidate Details</h2>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {testTaker.name && (
   <div>
   <p className="text-xs text-gray-400 mb-0.5">Name</p>
   <p className="text-sm font-medium text-gray-900">{testTaker.name}</p>
   </div>
  )}
  {testTaker.email && (
   <div>
   <p className="text-xs text-gray-400 mb-0.5">Email</p>
   <p className="text-sm font-medium text-gray-900">{testTaker.email}</p>
   </div>
  )}
  {testTaker.phone && (
   <div>
   <p className="text-xs text-gray-400 mb-0.5">Phone</p>
   <p className="text-sm font-medium text-gray-900">{testTaker.phone}</p>
   </div>
  )}
  </div>
  {completedAt && (
  <p className="text-xs text-gray-400 mt-3">
   Completed on {new Date(completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </p>
  )}
 </div>
 )}

 {/* Main Pattern Display */}
 <div className={`${traitBgColors[dominant]} rounded-2xl p-8 text-center`}>
 <div className="flex justify-center gap-4 mb-6">
 <div className={`w-24 h-24 ${traitColors[dominant]} rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
 {dominant}
 </div>
 <div className={`w-20 h-20 ${traitColors[secondary]} rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg opacity-80`}>
 {secondary}
 </div>
 </div>
 <h2 className={`text-2xl font-bold ${traitTextColors[dominant]} mb-4`}>
 {dimensions[dominant].name} - {dimensions[secondary].name}
 </h2>
 <p className="text-gray-700 max-w-2xl mx-auto">
 {analysis.summary}
 </p>
 </div>

 {/* Charts Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Bar Chart */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
 <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
 DISC Scores
 </h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={barData} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis type="number" domain={[0, 100]} />
 <YAxis dataKey="name" type="category" width={150} />
 <Tooltip />
 <Bar dataKey="value" radius={[0, 4, 4, 0]}>
 {barData.map((entry, index) => (
 <cell key={`cell-${index}`} fill={entry.fill} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Radar Chart */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
 <Target className="w-5 h-5 mr-2 text-indigo-600" />
 Behavioral Profile
 </h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <RadarChart data={radarData}>
 <PolarGrid />
 <PolarAngleAxis dataKey="subject" />
 <PolarRadiusAxis angle={90} domain={[0, 100]} />
 <Radar
 name="Your Profile"
 dataKey="A"
 stroke="#6366f1"
 fill="#6366f1"
 fillOpacity={0.3}
 />
 <Legend />
 </RadarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 {/* Detailed Scores */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {['D', 'I', 'S', 'C'].map((trait) => (
 <div key={trait} className={`${traitBgColors[trait]} rounded-xl p-4 text-center`}>
 <div className={`w-12 h-12 ${traitColors[trait]} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2`}>
 {trait}
 </div>
 <p className={`font-semibold ${traitTextColors[trait]}`}>
 {dimensions[trait].name}
 </p>
 <p className="text-2xl font-bold text-gray-900 ">
 {percentages[trait]}%
 </p>
 <p className="text-sm text-gray-500 ">
 {dimensions[trait].description.split(',')[0]}
 </p>
 </div>
 ))}
 </div>

 {/* Analysis Sections */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Strengths */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
 <Award className="w-5 h-5 mr-2 text-green-600" />
 Your Strengths
 </h3>
 <ul className="space-y-3">
 {analysis.strengths.map((strength, idx) => (
 <li key={idx} className="flex items-start">
 <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
 <span className="text-gray-700 ">{strength}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Development Areas */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
 <TrendingUp className="w-5 h-5 mr-2 text-amber-600" />
 Development Areas
 </h3>
 <ul className="space-y-3">
 {analysis.developmentAreas.map((area, idx) => (
 <li key={idx} className="flex items-start">
 <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
 <span className="text-gray-700 ">{area}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>

 {/* Work Style */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
 <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
 Work Style
 </h3>
 <p className="text-gray-700 mb-4">
 {analysis.workStyle}
 </p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
 <div className="bg-gray-50 rounded-lg p-4">
 <h4 className="font-medium text-gray-900 mb-2">Communication</h4>
 <p className="text-sm text-gray-600 ">
 {analysis.communicationStyle.style}
 </p>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <h4 className="font-medium text-gray-900 mb-2">Leadership</h4>
 <p className="text-sm text-gray-600 ">
 {analysis.leadershipStyle.style}
 </p>
 </div>
 </div>
 </div>

 {/* Recommendations */}
 <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
 <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
 <Lightbulb className="w-5 h-5 mr-2" />
 Personalized Recommendations
 </h3>
 <ul className="space-y-3">
 {analysis.recommendations.map((rec, idx) => (
 <li key={idx} className="flex items-start">
 <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0">
 {idx + 1}
 </span>
 <span className="text-indigo-800 ">{rec}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Team Dynamics */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
 <Users className="w-5 h-5 mr-2 text-indigo-600" />
 Team Dynamics
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <h4 className="font-medium text-gray-900 mb-2">Your Contribution</h4>
 <p className="text-gray-600 text-sm">
 You contribute to teams by {dimensions[dominant].strengths[0].toLowerCase()} and {dimensions[secondary].strengths[0].toLowerCase()}.
 </p>
 </div>
 <div>
 <h4 className="font-medium text-gray-900 mb-2">Ideal Partners</h4>
 <p className="text-gray-600 text-sm">
 You work best with people who are strong in {secondary === 'D' ? 'I' : secondary === 'I' ? 'C' : secondary === 'S' ? 'D' : 'I'} and {dominant === 'D' ? 'S' : dominant === 'I' ? 'C' : dominant === 'S' ? 'D' : 'I'} traits.
 </p>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200 ">
 <p>This DISC assessment is based on the Marston behavioral model.</p>
 <p className="mt-1">Results should be used for self-awareness and development purposes.</p>
 </div>

 {/* Download Modal */}
 {downloadModalOpen && (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
     <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDownloadModalOpen(false)}></div>
     <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
       <div className="p-6">
         <h3 className="text-lg font-bold text-gray-900 mb-1">Download Report</h3>
         <p className="text-sm text-gray-500 mb-6 font-normal">Select the level of detail you want to include in the PDF report.</p>
         
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
               <div className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">Full 8-page deep dive with psychometric narrative, insights, and tailored development roadmap.</div>
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
               <div className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">Dynamic 1-page overview showing dimension scores and immediate visual stats.</div>
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

export default DiscReport;
