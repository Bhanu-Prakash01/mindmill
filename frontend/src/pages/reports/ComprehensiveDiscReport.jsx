import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, reportService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Download,
  Share2,
  Sparkles,
  Loader2,
  AlertCircle,
  Award,
  TrendingUp,
  Lightbulb,
  Users,
  Briefcase,
  MessageSquare,
  Target,
  Heart,
  Brain,
  Compass,
  Zap,
  Shield,
  Crown,
  Copy,
  Check
} from 'lucide-react';

const ComprehensiveDiscReport = () => {
  const { attemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiresIn, setShareExpiresIn] = useState(30);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportId, setReportId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchAttemptAndAnalysis();
  }, [attemptId]);

  const fetchAttemptAndAnalysis = async () => {
    try {
      setLoading(true);
      const response = await attemptService.getAttempt(attemptId);
      const attemptData = response.data?.attempt;

    if (attemptData && attemptData.discResults) {
      setAttempt(attemptData);
      if (attemptData.report) setReportId(attemptData.report?._id?.toString() || attemptData.report?.toString() || attemptData.report);
      
      // Try to fetch comprehensive analysis
        try {
          const analysisResponse = await fetch(`/api/attempts/${attemptId}/comprehensive-report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ reportType: 'disc', format: 'json' })
          });
          
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            if (analysisData.success && analysisData.data?.report?.disc?.analysis) {
              setAnalysis(analysisData.data.report.disc.analysis);
            }
          }
        } catch (e) {
          console.warn('Could not fetch LLM analysis, using fallback');
        }
      } else {
        setError('DISC results not found');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/attempts/${attemptId}/comprehensive-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reportType: 'disc', format: 'pdf' })
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `DISC_Comprehensive_Report_${Date.now()}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download PDF');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading comprehensive report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const disc = attempt?.discResults;
  if (!disc) return null;

  const { percentages, dominant, secondary, pattern } = disc;
  const dominantColor = { D: 'red', I: 'amber', S: 'emerald', C: 'blue' }[dominant] || 'indigo';

  const fallbackAnalysis = {
    summary: disc.analysis?.summary || 'Your unique personality profile based on DISC assessment.',
    leadershipStyle: 'You lead with a balanced approach, adapting your style to the situation.',
    communicationStyle: 'You communicate clearly while being mindful of others\' perspectives.',
    teamDynamics: 'You contribute positively to team environments through your natural strengths.',
    decisionMaking: 'You make thoughtful decisions considering both data and people factors.',
    stressResponse: 'You handle pressure by focusing on solutions and maintaining perspective.',
    workplacePreferences: {
      environment: 'Flexible and collaborative',
      pace: 'Moderate with variety',
      feedback: 'Direct and constructive',
      autonomy: 'Moderate to high'
    }
  };

  const content = analysis || fallbackAnalysis;

  const colorClasses = {
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', bgSolid: 'bg-red-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', bgSolid: 'bg-amber-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', bgSolid: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', bgSolid: 'bg-blue-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', bgSolid: 'bg-indigo-500' }
  };

  const colors = colorClasses[dominantColor];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowShareModal(true); setShareLink(''); setShareEmail(attempt?.testTakerEmail || ''); setCopied(false); }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Pattern */}
        <div className={`${colors.bg} rounded-3xl p-8 mb-8 border ${colors.border}`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`w-28 h-28 ${colors.bgSolid} rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl`}>
                {dominant}
              </div>
              <div className={`w-20 h-20 ${colors.bgSolid} opacity-70 rounded-full flex items-center justify-center text-white text-4xl font-bold`}>
                {secondary}
              </div>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-indigo-600 mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Comprehensive Report
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {pattern || `${dominant}${secondary}`} Profile
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {content.summary}
            </p>
          </div>
        </div>

        {/* Candidate Info */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Candidate Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="font-medium">{attempt?.testTakerName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-medium">{attempt?.testTakerEmail || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Completed</p>
              <p className="font-medium">
                {attempt?.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Not completed'}
              </p>
            </div>
          </div>
        </div>

        {/* DISC Scores */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            DISC Scores
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { letter: 'D', name: 'Dominance', value: percentages?.D || 0, color: 'red' },
              { letter: 'I', name: 'Influence', value: percentages?.I || 0, color: 'amber' },
              { letter: 'S', name: 'Steadiness', value: percentages?.S || 0, color: 'emerald' },
              { letter: 'C', name: 'Conscientiousness', value: percentages?.C || 0, color: 'blue' }
            ].map((trait) => (
              <div key={trait.letter} className={`${colorClasses[trait.color].bg} rounded-xl p-4 text-center`}>
                <div className={`w-12 h-12 ${colorClasses[trait.color].bgSolid} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2`}>
                  {trait.letter}
                </div>
                <p className={`font-semibold ${colorClasses[trait.color].text}`}>{trait.name}</p>
                <p className="text-3xl font-bold text-gray-900">{trait.value}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership & Communication */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-indigo-600" />
              Leadership Style
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {content.leadershipStyle}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Communication Style
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {content.communicationStyle}
            </p>
          </div>
        </div>

        {/* Team & Decision Making */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Team Dynamics
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {content.teamDynamics}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              Decision Making
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {content.decisionMaking}
            </p>
          </div>
        </div>

        {/* Stress & Work Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Stress Response
            </h3>
            <p className="text-purple-800 leading-relaxed">
              {content.stressResponse}
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Work-Life Balance
            </h3>
            <p className="text-indigo-800 leading-relaxed">
              {content.workLifeBalance}
            </p>
          </div>
        </div>

        {/* Workplace Preferences */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Workplace Preferences
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Environment</p>
              <p className="font-medium text-gray-900">{content.workplacePreferences?.environment || 'Flexible'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pace</p>
              <p className="font-medium text-gray-900">{content.workplacePreferences?.pace || 'Moderate'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Feedback</p>
              <p className="font-medium text-gray-900">{content.workplacePreferences?.feedback || 'Direct'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Autonomy</p>
              <p className="font-medium text-gray-900">{content.workplacePreferences?.autonomy || 'Moderate'}</p>
            </div>
          </div>
        </div>

        {/* Strengths & Development */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Key Strengths
            </h3>
            <ul className="space-y-2">
              {(content.strengths || disc.analysis?.strengths || ['Strong analytical skills', 'Natural leadership ability', 'Effective communication']).map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-green-900">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Development Areas
            </h3>
            <ul className="space-y-2">
              {(content.developmentAreas || disc.analysis?.developmentAreas || ['Active listening', 'Patience in detail work', 'Work-life boundaries']).map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-amber-900">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Career Suggestions */}
        {content.careerSuggestions && content.careerSuggestions.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Recommended Career Paths
            </h3>
            <div className="flex flex-wrap gap-2">
              {content.careerSuggestions.map((career, idx) => (
                <span key={idx} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  {career}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interview Tips */}
        {content.interviewTips && content.interviewTips.length > 0 && (
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200 mb-8">
            <h3 className="text-lg font-semibold text-violet-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Interview Tips for Managers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {content.interviewTips.map((tip, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 flex items-start gap-3">
                  <span className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-violet-800 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivators & Demotivators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              What Motivates
            </h3>
            <ul className="space-y-2">
              {(content.motivators || ['Achievement', 'Recognition', 'Growth opportunities']).map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-500">+</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              What Demotivates
            </h3>
            <ul className="space-y-2">
              {(content.demotivators || ['Micromanagement', 'Lack of recognition', 'Uncertainty']).map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-500">−</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Development Plan */}
        {(content.developmentPlan?.shortTerm || content.developmentPlan?.longTerm) && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              Personal Development Plan
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {content.developmentPlan?.shortTerm?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Short-Term (30 Days)</h4>
                  <ul className="space-y-2">
                    {content.developmentPlan.shortTerm.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-indigo-500">→</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.developmentPlan?.longTerm?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Long-Term (1 Year)</h4>
                  <ul className="space-y-2">
                    {content.developmentPlan.longTerm.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-indigo-500">→</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generated by MindMil Assessments | Powered by Groq AI
          </p>
          <p className="mt-2">This DISC assessment is based on the Marston behavioral model.</p>
          <p className="mt-1 italic">Results should be used for self-awareness and development purposes.</p>
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

export default ComprehensiveDiscReport;
