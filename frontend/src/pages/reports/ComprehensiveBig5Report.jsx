import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, reportService } from '../../services';
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
  Brain,
  Heart,
  Shield,
  Eye,
  Activity,
  Compass,
  Zap,
  Copy,
  Check
} from 'lucide-react';

const ComprehensiveBig5Report = () => {
  const { attemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiresIn, setShareExpiresIn] = useState(30);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    fetchAttemptAndAnalysis();
  }, [attemptId]);

  const fetchAttemptAndAnalysis = async () => {
    try {
      setLoading(true);
      const response = await attemptService.getAttempt(attemptId);
      const attemptData = response.data?.attempt;

    if (attemptData && attemptData.big5Results) {
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
            body: JSON.stringify({ reportType: 'big5', format: 'json' })
          });
          
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            if (analysisData.success && analysisData.data?.report?.big5?.analysis) {
              setAnalysis(analysisData.data.report.big5.analysis);
            }
          }
        } catch (e) {
          console.warn('Could not fetch LLM analysis, using fallback');
        }
      } else {
        setError('Big5 results not found');
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
        body: JSON.stringify({ reportType: 'big5', format: 'pdf' })
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Big5_Comprehensive_Report_${Date.now()}.pdf`;
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
      alert('Failed to download PDF');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
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
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const big5 = attempt?.big5Results;
  if (!big5) return null;

  const scores = big5.scores || {};

  const fallbackAnalysis = {
    headline: 'A Unique Personality Profile',
    summary: 'Your personality reflects a distinctive combination of traits across the five major dimensions.',
    workplacePreferences: {
      environment: 'Collaborative',
      pace: 'Moderate',
      feedback: 'Constructive',
      autonomy: 'Flexible',
      structure: 'Moderate'
    },
    traitBreakdown: {
      openness: { interpretation: 'You show a balanced approach to new experiences.' },
      conscientiousness: { interpretation: 'You balance organization with flexibility.' },
      extraversion: { interpretation: 'You enjoy social interaction but also value solitude.' },
      agreeableness: { interpretation: 'You value harmony and cooperation in relationships.' },
      neuroticism: { interpretation: 'You maintain good emotional stability.' }
    }
  };

  const content = analysis || fallbackAnalysis;

  const traitColors = {
    O: { color: 'violet', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', bgSolid: 'bg-violet-500' },
    C: { color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', bgSolid: 'bg-blue-500' },
    E: { color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', bgSolid: 'bg-amber-500' },
    A: { color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', bgSolid: 'bg-emerald-500' },
    N: { color: 'rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', bgSolid: 'bg-rose-500' }
  };

  const traits = [
    { key: 'O', letter: 'O', name: 'Openness', score: scores.Openness || scores.openness || 0 },
    { key: 'C', letter: 'C', name: 'Conscientiousness', score: scores.Conscientiousness || scores.conscientiousness || 0 },
    { key: 'E', letter: 'E', name: 'Extraversion', score: scores.Extraversion || scores.extraversion || 0 },
    { key: 'A', letter: 'A', name: 'Agreeableness', score: scores.Agreeableness || scores.agreeableness || 0 },
    { key: 'N', letter: 'N', name: 'Neuroticism', score: scores.Neuroticism || scores.neuroticism || 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 pb-12">
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
                onClick={() => { setShowShareModal(true); setShareLink(''); setShareEmail(''); setCopied(false); }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 mb-8 text-white">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Comprehensive Report
            </span>
            <h1 className="text-4xl font-bold mb-2">Big Five Personality Profile</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {content.headline || content.summary}
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

        {/* Summary */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-600" />
            Executive Summary
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {content.summary || 'Your personality profile reflects a unique combination of traits across the five major dimensions of personality.'}
          </p>
        </div>

        {/* Trait Scores */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Personality Traits Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {traits.map((trait) => {
              const colors = traitColors[trait.key];
              return (
                <div key={trait.key} className={`${colors.bg} rounded-xl p-4 text-center border ${colors.border}`}>
                  <div className={`w-12 h-12 ${colors.bgSolid} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2`}>
                    {trait.letter}
                  </div>
                  <p className={`font-semibold ${colors.text} text-sm`}>{trait.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{trait.score}%</p>
                  <div className="w-full h-2 bg-white/50 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full ${colors.bgSolid} rounded-full`} 
                      style={{ width: `${trait.score}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trait Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {traits.map((trait) => {
            const breakdown = content.traitBreakdown?.[trait.key.toLowerCase()] || {};
            return (
              <div key={trait.key} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${traitColors[trait.key].bgSolid} rounded-lg flex items-center justify-center text-white font-bold`}>
                    {trait.letter}
                  </div>
                  <h4 className="font-semibold text-gray-900">{trait.name}</h4>
                </div>
                <p className="text-gray-600 text-sm italic mb-3">
                  {breakdown.interpretation || 'A balanced expression of this trait.'}
                </p>
                {breakdown.strengths && breakdown.strengths.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Key Strengths</p>
                    {breakdown.strengths.slice(0, 3).map((s, i) => (
                      <p key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        {s}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Emotional Intelligence */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Emotional Intelligence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Self-Awareness
              </h4>
              <p className="text-sm text-gray-600">
                {content.traitBreakdown?.neuroticism?.selfAwareness || 'You have good insight into your emotions and behavior patterns.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Self-Regulation
              </h4>
              <p className="text-sm text-gray-600">
                {content.traitBreakdown?.neuroticism?.selfRegulation || 'You effectively manage your emotions in various situations.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Empathy
              </h4>
              <p className="text-sm text-gray-600">
                {content.traitBreakdown?.agreeableness?.empathy || 'You understand and share the feelings of others.'}
              </p>
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
              {(content.strengths || ['Self-aware and introspective', 'Emotionally balanced', 'Collaborative team player']).map((strength, idx) => (
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
              Areas for Development
            </h3>
            <ul className="space-y-2">
              {(content.developmentAreas || ['Build confidence', 'Practice decision-making', 'Develop leadership skills']).map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-amber-900">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Workplace Preferences */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Workplace Preferences
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Environment', value: content.workplacePreferences?.environment || 'Collaborative' },
              { label: 'Pace', value: content.workplacePreferences?.pace || 'Moderate' },
              { label: 'Feedback', value: content.workplacePreferences?.feedback || 'Constructive' },
              { label: 'Autonomy', value: content.workplacePreferences?.autonomy || 'Flexible' },
              { label: 'Structure', value: content.workplacePreferences?.structure || 'Moderate' }
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="font-medium text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Career Suggestions */}
        {content.careerSuggestions && content.careerSuggestions.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Recommended Career Paths
            </h3>
            <div className="flex flex-wrap gap-2">
              {content.careerSuggestions.map((career, idx) => (
                <span key={idx} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {career}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mental Wellbeing */}
        {content.mentalWellbeing && (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 mb-8">
            <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Mental Wellbeing & Resilience
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {content.mentalWellbeing.strengths && (
                <div>
                  <h4 className="text-sm font-semibold text-teal-700 mb-2">Psychological Strengths</h4>
                  <ul className="space-y-1">
                    {content.mentalWellbeing.strengths.map((s, i) => (
                      <li key={i} className="text-teal-800 text-sm flex items-center gap-2">
                        <span className="text-teal-500">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {content.mentalWellbeing.strategies && (
                <div>
                  <h4 className="text-sm font-semibold text-teal-700 mb-2">Wellbeing Strategies</h4>
                  <ul className="space-y-1">
                    {content.mentalWellbeing.strategies.map((s, i) => (
                      <li key={i} className="text-teal-800 text-sm flex items-center gap-2">
                        <span className="text-teal-500">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
              {(content.motivators || ['Recognition', 'Growth', 'Purpose', 'Relationships']).map((item, idx) => (
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
              {(content.demotivators || ['Micromanagement', 'Uncertainty', 'Conflict', 'Stagnation']).map((item, idx) => (
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
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Immediate (30 Days)</h4>
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
          <p className="mt-2">The Big Five personality model is based on decades of psychological research.</p>
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

export default ComprehensiveBig5Report;
