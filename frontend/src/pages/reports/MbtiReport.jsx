import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share2,
  BarChart3,
  Users,
  Briefcase,
  Award,
  TrendingUp,
  Loader2,
  Sparkles,
  Brain,
  Target,
  FileBarChart,
  MessageCircle,
  Crown,
  Lightbulb
} from 'lucide-react';
import { getTypeInsights } from './mbtiTypeInsights';
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

const MbtiReport = () => {
  const { attemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [testTaker, setTestTaker] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [attemptId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attempts/${attemptId}/mbti/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success && data.data && data.data.results) {
        setReport(data.data.results);
        setTestTaker(data.data.testTaker);
        setCompletedAt(data.data.completedAt);
      } else {
        setError('MBTI results not found for this attempt');
      }
    } catch (err) {
      console.error('Error fetching MBTI report:', err);
      setError('Failed to load MBTI report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      setDownloadModalOpen(false);
      setDownloading(true);
      const response = await fetch(`/api/attempts/${attemptId}/mbti-report/download?type=${type}`, {
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
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `MBTI_Report_${Date.now()}.pdf`;
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My MBTI Profile',
        text: `Check out my MBTI profile: ${report?.type || ''}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
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
          <p className="text-red-600">{error}</p>
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

  const { type, name, description, percentages, dimensions, hasCrossPressure, crossPressure, cognitiveFunctions } = report;

  const dimensionColors = {
    EI: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
    SN: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
    TF: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50' },
    JP: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' }
  };

  const dimensionLabels = {
    EI: { left: 'Introversion', right: 'Extraversion' },
    SN: { left: 'Sensing', right: 'Intuition' },
    TF: { left: 'Thinking', right: 'Feeling' },
    JP: { left: 'Judging', right: 'Perceiving' }
  };

  const barData = [
    { name: 'EI (E ← → I)', value: percentages.EI, fill: '#a855f7' },
    { name: 'SN (S ← → N)', value: percentages.SN, fill: '#3b82f6' },
    { name: 'TF (T ← → F)', value: percentages.TF, fill: '#ec4899' },
    { name: 'JP (J ← → P)', value: percentages.JP, fill: '#f59e0b' }
  ];

  const radarData = [
    { subject: 'EI', A: percentages.EI, fullMark: 100 },
    { subject: 'SN', A: percentages.SN, fullMark: 100 },
    { subject: 'TF', A: percentages.TF, fullMark: 100 },
    { subject: 'JP', A: percentages.JP, fullMark: 100 }
  ];

  const getCrossPressureDimensions = () => {
    if (!hasCrossPressure) return [];
    return Object.entries(crossPressure)
      .filter(([_, isCp]) => isCp)
      .map(([dim]) => dim);
  };

  const crossPressureDims = getCrossPressureDimensions();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
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

      <div className="text-center pb-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          MBTI Personality Profile
        </h1>
        <p className="text-xl text-gray-600">
          {type} — {name}
        </p>
      </div>

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

      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 text-center">
        <div className="flex justify-center gap-4 mb-6">
          {type.split('').map((letter, idx) => (
            <div 
              key={idx}
              className={`w-24 h-24 ${dimensionColors[['EI', 'SN', 'TF', 'JP'][idx]].bg} rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg`}
            >
              {letter}
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {name}
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      {crossPressureDims.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Cross-Pressure Indicators
          </h3>
          <p className="text-amber-700 mb-3">
            Your responses indicate tension in the following dimension{crossPressureDims.length > 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-2">
            {crossPressureDims.map(dim => (
              <span 
                key={dim}
                className={`px-4 py-2 ${dimensionColors[dim].bg} text-white rounded-full font-medium`}
              >
                {dim}: {dimensionLabels[dim].left} ↔ {dimensionLabels[dim].right}
              </span>
            ))}
          </div>
          <p className="text-sm text-amber-600 mt-3">
            This suggests you have tendencies in both directions for these dimensions, which is completely normal.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
            Dimension Scores
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={120} />
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

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-600" />
            Type Profile
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['EI', 'SN', 'TF', 'JP'].map(dim => {
          const dimData = dimensions[dim];
          const isLeft = dimData.letter === dimensionLabels[dim].left.charAt(0);
          
          return (
            <div key={dim} className={`${dimensionColors[dim].light} rounded-xl p-4 text-center`}>
              <div className={`w-12 h-12 ${dimensionColors[dim].bg} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2`}>
                {dimData.letter}
              </div>
              <p className={`font-semibold ${dimensionColors[dim].text}`}>
                {dim === 'EI' ? (isLeft ? 'Introversion' : 'Extraversion') :
                 dim === 'SN' ? (isLeft ? 'Sensing' : 'Intuition') :
                 dim === 'TF' ? (isLeft ? 'Thinking' : 'Feeling') :
                 (isLeft ? 'Judging' : 'Perceiving')}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dimData.percentage}%
              </p>
              <p className="text-sm text-gray-500">
                {dim}: {dimData.rawScore}
              </p>
              {crossPressure[dim] && (
                <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  Balanced
                </span>
              )}
            </div>
          );
        })}
      </div>

      {cognitiveFunctions && cognitiveFunctions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-indigo-600" />
            Cognitive Functions
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your mental processes in order of development:
          </p>
          <div className="flex flex-wrap gap-2">
            {cognitiveFunctions.map((func, idx) => (
              <div 
                key={func}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  idx < 4 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="font-medium">{func}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const insights = getTypeInsights(type);
        const strengths = [];
        const devAreas = [];
        
        Object.entries(dimensions).forEach(([dim, data]) => {
          if (data.percentage >= 60) {
            strengths.push({
              dim,
              label: data.label,
              percentage: data.percentage,
              desc: `${data.label}s tend to be ${data.percentage >= 75 ? 'highly' : 'particularly'} drawn to environments where they can apply their strengths.`
            });
          } else if (data.percentage <= 40) {
            devAreas.push({
              dim,
              label: data.label,
              percentage: data.percentage,
              desc: `Developing greater flexibility toward ${dim === 'EI' ? (data.letter === 'I' ? 'extraversion' : 'introversion') :
                dim === 'SN' ? (data.letter === 'N' ? 'intuition' : 'sensing') :
                dim === 'TF' ? (data.letter === 'F' ? 'feeling' : 'thinking') :
                (data.letter === 'P' ? 'perceiving' : 'judging')} can expand your effectiveness.`
            });
          }
        });
        
        if (strengths.length === 0) {
          strengths.push({ dim: 'All', label: '', percentage: 0, desc: insights.strength });
        }
        
        return (
          <>
            {strengths.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-green-600" />
                  Your Strengths
                </h3>
                <ul className="space-y-3">
                  {insights.strength.split(', ').map((strength, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{strength.trim()}</span>
                    </li>
                  ))}
                  {Object.entries(dimensions).slice(0, 2).map(([dim, data]) => (
                    <li key={dim} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">
                        Strong {data.label} ({data.percentage}%) - brings {data.percentage >= 70 ? 'decisive' : 'clear'} {data.label.toLowerCase()} approach to situations
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {devAreas.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-amber-600" />
                  Development Areas
                </h3>
                <ul className="space-y-3">
                  {devAreas.slice(0, 3).map((area, idx) => (
                    <li key={area.dim} className="flex items-start">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{area.desc}</span>
                    </li>
                  ))}
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">
                      Embrace flexibility in your less-preferred dimensions to adapt to varied situations
                    </span>
                  </li>
                </ul>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                Work Style
              </h3>
              <p className="text-gray-700 mb-4">
                {insights.communication.style} individuals who bring {insights.strength.split(', ')[0] || 'versatility'} to their work.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Problem Solving</h4>
                  <p className="text-sm text-gray-600">
                    Approaches challenges by {insights.leadership.style.toLowerCase()}, prioritizing thorough analysis
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Work Environment</h4>
                  <p className="text-sm text-gray-600">
                    Thrives when {type.includes('I') ? 'given autonomy and focused work time' : 'able to collaborate and communicate openly'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-indigo-600" />
                Communication Style
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Your Approach</h4>
                  <p className="text-sm text-gray-600">{insights.communication.style.toLowerCase()} communication</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Listening Style</h4>
                  <p className="text-sm text-gray-600">{insights.communication.listening.toLowerCase()}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                {insights.communication.approach}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-indigo-600" />
                Leadership Style
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Your Approach</h4>
                  <p className="text-sm text-gray-600">{insights.leadership.style.toLowerCase()} leadership</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">What Motivates You</h4>
                  <p className="text-sm text-gray-600">{insights.leadership.motivation.toLowerCase()}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Decision Making</h4>
                <p className="text-sm text-gray-600">{insights.leadership.decisions.toLowerCase()}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Team Dynamics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Your Contribution</h4>
                  <p className="text-sm text-gray-600">{insights.team.contribution.toLowerCase()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ideal Partners</h4>
                  <p className="text-sm text-gray-600">Works well with {insights.team.idealPartners.join(' and ')} types</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Handling Conflict</h4>
                <p className="text-sm text-gray-600">{insights.team.conflict.toLowerCase()}</p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Personalized Recommendations
              </h3>
              <ul className="space-y-3">
                {insights.recommendations.slice(0, 5).map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-indigo-800">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        );
      })()}

      <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
        <p>This MBTI assessment is based on the Open Extended Jungian Type Scales (OEJTS) methodology.</p>
        <p className="mt-1">Results should be used for self-awareness and development purposes.</p>
      </div>

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
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">
                      Full deep dive with in-depth analysis, career insights, and relationships guide.
                    </div>
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
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">
                      Quick overview showing your 4-letter type and dimension scores.
                    </div>
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
    </div>
  );
};

export default MbtiReport;