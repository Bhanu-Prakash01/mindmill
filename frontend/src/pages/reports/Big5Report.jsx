import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, reportService } from '../../services';
import {
  Download,
  Share2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  Brain,
  FileBarChart,
  Copy,
  Check
} from 'lucide-react';

const Big5Report = () => {
 const { attemptId, orgSlug } = useParams();
 const navigate = useNavigate();
 const [results, setResults] = useState(null);
 const [traitDetails, setTraitDetails] = useState(null);
 const [narrative, setNarrative] = useState('');
 const [dominantTraits, setDominantTraits] = useState([]);
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

  useEffect(() => {
  fetchResults();
  }, [attemptId]);

 const fetchResults = async () => {
     try {
       setLoading(true);
       const response = await attemptService.getAttempt(attemptId);
       const attempt = response.data?.attempt;

       if (attempt && attempt.big5Results) {
         setResults(attempt.big5Results);
         setTraitDetails(attempt.big5TraitDetails || null);
         setNarrative(attempt.big5Narrative || '');
         setDominantTraits(attempt.big5DominantTraits || []);
         setTestTaker({
           name: attempt.testTakerName || null,
           email: attempt.testTakerEmail || null,
           phone: attempt.testTakerPhone || null
         });
         setCompletedAt(attempt.completedAt);
         if (attempt.report) setReportId(attempt.report._id || attempt.report);
       } else {
         throw new Error('Big5 results not found for this attempt');
       }
     } catch (err) {
       setError(err.message || 'Failed to load results');
     } finally {
       setLoading(false);
     }
   };

   const handleDownload = async (type) => {
   try {
     setDownloadModalOpen(false);
     setDownloading(true);
     // Generate PDF download using backend endpoint
     const response = await fetch(`/api/attempts/${attemptId}/big5-report/download?type=${type}`, {
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
     let filename = `Big5_Report_${Date.now()}.pdf`;
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
     alert(error.message || 'Failed to download PDF. Please try again.');
   } finally {
     setDownloading(false);
   }
   };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!reportId) {
      alert('Share is not available for this report yet.');
      return;
    }
    if (!shareEmail.trim()) {
      alert('Please enter an email address.');
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
      alert(error.response?.data?.message || 'Failed to generate share link');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center">
 <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
 <p className="text-gray-600 ">Loading your results...</p>
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center max-w-md">
 <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
 <p className="text-red-600 ">{error}</p>
 <button
 onClick={() => navigate(orgSlug ? `/o/${orgSlug}/` : '/')}
 className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
 >
 Go to Dashboard
 </button>
 </div>
 </div>
 );
 }

 if (!results) return null;

 // Prepare data for radar chart
 const radarData = [
 { trait: 'Openness', score: results.O.percent, fullMark: 100 },
 { trait: 'Conscientiousness', score: results.C.percent, fullMark: 100 },
 { trait: 'Extraversion', score: results.E.percent, fullMark: 100 },
 { trait: 'Agreeableness', score: results.A.percent, fullMark: 100 },
 { trait: 'Neuroticism', score: results.N.percent, fullMark: 100 },
 ];

 // Prepare data for bar chart
 const barData = [
 { name: 'Openness', value: results.O.percent, trait: 'O' },
 { name: 'Conscientiousness', value: results.C.percent, trait: 'C' },
 { name: 'Extraversion', value: results.E.percent, trait: 'E' },
 { name: 'Agreeableness', value: results.A.percent, trait: 'A' },
 { name: 'Neuroticism', value: results.N.percent, trait: 'N' },
 ];

 const getLevelColor = (level) => {
 switch (level) {
 case 'High': return 'text-green-600 bg-green-100 ';
 case 'Moderate': return 'text-yellow-600 bg-yellow-100 ';
 case 'Low': return 'text-blue-600 bg-blue-100 ';
 default: return 'text-gray-600 bg-gray-100 ';
 }
 };

 const getBarColor = (trait) => {
 const colors = {
 O: '#8b5cf6', // Violet
 C: '#10b981', // Emerald
 E: '#f59e0b', // Amber
 A: '#ec4899', // Pink
 N: '#ef4444', // Red
 };
 return colors[trait];
 };

 return (
 <div className="min-h-screen bg-gray-50 pb-12">
 {/* Header */}
 <header className="bg-white border-b border-gray-200 ">
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 <button
 onClick={() => navigate(orgSlug ? `/o/${orgSlug}/` : '/')}
 className="flex items-center gap-2 text-gray-600 hover:text-gray-900 "
 >
 <ArrowLeft className="w-5 h-5" />
 Back to Dashboard
 </button>

  <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowShareModal(true); setShareLink(''); setShareEmail(testTaker?.email || ''); setCopied(false); }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
  <button
  onClick={() => setDownloadModalOpen(true)}
  disabled={downloading}
  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
  {downloading ? (
    <>
    <Loader2 className="w-4 h-4 animate-spin" />
    Generating...
    </>
  ) : (
    <>
    <Download className="w-4 h-4" />
    Download PDF
    </>
  )}
  </button>
  </div>
 </div>
 </div>
 </header>

 <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Title */}
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold text-gray-900 mb-2">
 Big Five Personality Profile
 </h1>
 <p className="text-gray-600 max-w-2xl mx-auto">
 {narrative}
 </p>
 </div>

 {/* Test Taker Details */}
 {testTaker && (testTaker.name || testTaker.email) && (
 <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
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

 {/* Charts Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
 {/* Radar Chart */}
 <div className="bg-white rounded-xl p-6 border border-gray-200 ">
 <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
 Personality Radar
 </h2>
 <div className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <RadarChart data={radarData}>
 <PolarGrid />
 <PolarAngleAxis
 dataKey="trait"
 tick={{ fill: '#6b7280', fontSize: 12 }}
 />
 <PolarRadiusAxis
 angle={90}
 domain={[0, 100]}
 tick={{ fill: '#9ca3af', fontSize: 10 }}
 />
 <Radar
 name="Your Score"
 dataKey="score"
 stroke="#6366f1"
 strokeWidth={2}
 fill="#6366f1"
 fillOpacity={0.3}
 />
 <Tooltip
 formatter={(value) => [`${value}%`, 'Score']}
 contentStyle={{
 backgroundColor: 'rgba(255, 255, 255, 0.95)',
 border: '1px solid #e5e7eb',
 borderRadius: '8px'
 }}
 />
 </RadarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Bar Chart */}
 <div className="bg-white rounded-xl p-6 border border-gray-200 ">
 <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
 Trait Percentages
 </h2>
 <div className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={barData} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
 <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
 <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
 <Tooltip
 formatter={(value) => [`${value}%`, 'Score']}
 contentStyle={{
 backgroundColor: 'rgba(255, 255, 255, 0.95)',
 border: '1px solid #e5e7eb',
 borderRadius: '8px'
 }}
 />
 <Bar dataKey="value" radius={[0, 4, 4, 0]}>
 {barData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={getBarColor(entry.trait)} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 {/* Trait Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
 {['O', 'C', 'E', 'A', 'N'].map((trait) => {
 const data = results[trait];
 const details = traitDetails?.[trait];
 const isDominant = dominantTraits.includes(trait);

 return (
 <div
 key={trait}
 className={`bg-white rounded-xl p-4 border-2 transition-all ${
 isDominant
 ? 'border-indigo-300 shadow-lg'
 : 'border-gray-200 '
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <span className="text-2xl font-bold" style={{ color: getBarColor(trait) }}>
 {trait}
 </span>
 {isDominant && (
 <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
 Dominant
 </span>
 )}
 </div>
 <h3 className="font-medium text-gray-900 text-sm mb-1">
 {details?.name}
 </h3>
 <div className="flex items-baseline gap-1 mb-2">
 <span className="text-2xl font-bold text-gray-900 ">
 {data.percent}%
 </span>
 </div>
 <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
 <div
 className="h-full rounded-full transition-all"
 style={{
 width: `${data.percent}%`,
 backgroundColor: getBarColor(trait)
 }}
 />
 </div>
 <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelColor(data.level)}`}>
 {data.level}
 </span>
 <p className="text-xs text-gray-500 mt-2 line-clamp-2">
 {data.level === 'High' ? details?.high : data.level === 'Low' ? details?.low : 'Balanced trait'}
 </p>
 </div>
 );
 })}
 </div>

 {/* Detailed Analysis */}
 <div className="bg-white rounded-xl p-6 border border-gray-200 ">
 <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
 <Info className="w-5 h-5 text-indigo-600" />
 Detailed Analysis
 </h2>

 <div className="space-y-6">
 {['O', 'C', 'E', 'A', 'N'].map((trait) => {
 const details = traitDetails?.[trait];
 const data = results[trait];

 return (
 <div key={trait} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
 <div className="flex items-start gap-4">
 <div
 className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
 style={{ backgroundColor: getBarColor(trait) }}
 >
 {trait}
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-semibold text-gray-900 ">
 {details?.name}
 </h3>
 <p className="text-sm text-gray-500 mb-2">
 {details?.fullName}
 </p>
 <p className="text-gray-700 text-sm leading-relaxed mb-3">
 {details?.description}
 </p>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-500">Score:</span>
 <span className="font-medium text-gray-900 ">{data.score}/40</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-sm text-gray-500">Percentile:</span>
 <span className="font-medium text-gray-900 ">{data.percent}%</span>
 </div>
 <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(data.level)}`}>
 {data.level} Level
 </span>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Footer Note */}
 <div className="mt-8 text-center text-sm text-gray-500 ">
 <p>
 This assessment is based on the Big Five Personality Model (OCEAN),
 a scientifically validated framework for understanding personality traits.
 </p>
 </div>
 </main>

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
             className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-left"
           >
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
               <Brain className="w-5 h-5" />
             </div>
             <div>
               <div className="font-semibold text-gray-900">Comprehensive Report (AI)</div>
               <div className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">Full 8-page deep dive with psychometric narrative, insights, and tailored development roadmap.</div>
             </div>
           </button>
           
           <button
             onClick={() => handleDownload('summary')}
             className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-left"
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

export default Big5Report;
