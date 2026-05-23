import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Download,
  Loader2,
  TrendingUp,
  Brain,
  Zap,
  RefreshCw,
  Target,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const BAND_COLORS = {
  'Highly Coachable Growth Leader':      { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', accent: '#059669' },
  'Strong Learning Agile Professional':  { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    accent: '#2563EB' },
  'Trainable / Moderately Adaptive':     { bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-300',  accent: '#6366F1' },
  'Conditionally Coachable':             { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   accent: '#D97706' },
  'Fixed-pattern / Learning Resistance Risk': { bg: 'bg-red-100', text: 'text-red-800',   border: 'border-red-300',     accent: '#DC2626' },
};

const DimensionBar = ({ name, score }) => {
  const color = score >= 75 ? '#059669' : score >= 50 ? '#2563EB' : score >= 35 ? '#D97706' : '#DC2626';
  const zone  = score >= 75 ? '🟢 Strong' : score >= 50 ? '🟡 Moderate' : '🔴 Developing';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="w-44 text-sm text-gray-700 flex-shrink-0 font-medium">{name}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <div className="w-10 text-right text-sm font-bold" style={{ color }}>{score}%</div>
      <div className="w-28 text-xs text-gray-500">{zone}</div>
    </div>
  );
};

const PclaReport = () => {
  const { attemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { fetchResults(); }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/attempts/${attemptId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const attempt = res.data?.data?.attempt;
      setData(attempt);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!data?.report) {
      toast.error('No report available to download');
      return;
    }
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/reports/${data.report}/download?type=comprehensive`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const cd = res.headers['content-disposition'];
      let filename = `PCLA_Report_${Date.now()}.pdf`;
      if (cd) { const m = cd.match(/filename="?([^"]+)"?/); if (m) filename = m[1]; }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">{error}</div>
    </div>
  );

  if (!data) return null;

  const pcla = data.sjtResults || {};  // stored in sjtResults field
  const ci = pcla.coachabilityIndex ?? data.percentage ?? 0;
  const band = pcla.band || 'N/A';
  const grade = pcla.grade || 'N/A';
  const percentile = pcla.percentile || 0;
  const archetype = pcla.archetype || 'Learning Professional';
  const promotionReadiness = pcla.promotionReadiness || 'N/A';
  const trainingROI = pcla.trainingROI || ci;
  const promotionReadinessScore = pcla.promotionReadinessScore || ci;
  const greenFlags = pcla.greenFlags || [];
  const amberFlags = pcla.amberFlags || [];
  const dimensionScores = pcla.dimensionScores || {};
  const radarScores = pcla.radarScores || {};
  const strongestDimension = pcla.strongestDimension || '—';
  const weakestDimension   = pcla.weakestDimension || '—';
  const summary = pcla.summary || '';

  const bandStyle = BAND_COLORS[band] || BAND_COLORS['Trainable / Moderately Adaptive'];
  const orgPrefix = orgSlug ? `/o/${orgSlug}` : '';

  const RadarCard = ({ label, score, color }) => (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#E2E8F0" strokeWidth="5"/>
          <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray="138"
            strokeDashoffset={Math.round(138 - (138 * Math.min(score, 100)) / 100)}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>{score}</div>
      </div>
      <div>
        <div className="text-sm font-600 text-gray-800 font-semibold">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{score}% score</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 gap-1">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PDF Report
        </button>
      </div>

      {/* Cover / Score Hero */}
      <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #064E3B, #065F46)' }}>
        <div className="p-8">
          <div className="text-xs font-semibold text-emerald-300 tracking-widest uppercase mb-2">MindMil · PCLA™</div>
          <h1 className="text-2xl font-bold text-white mb-1">Professional Coachability &amp; Learning Agility Index</h1>
          <p className="text-emerald-200 text-sm mb-8">Learning Mindset · Adaptability · Reinvention Capacity · Coaching ROI</p>

          <div className="flex items-center gap-8">
            {/* Big ring */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
                <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10"/>
                <circle cx="64" cy="64" r="54" fill="none" stroke="white" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray="339"
                  strokeDashoffset={Math.round(339 - (339 * Math.min(ci, 100)) / 100)}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-white">{ci}</div>
                <div className="text-xs text-emerald-300">/100</div>
              </div>
            </div>
            <div>
              <div className="text-white font-bold text-xl mb-1">{band}</div>
              <div className="text-emerald-200 text-sm mb-3">{percentile}th Percentile · Grade {grade} · {promotionReadiness}</div>
              <div className="flex flex-wrap gap-2">
                {[`CI: ${ci}%`, `Percentile: ${percentile}`, `Training ROI: ${trainingROI}%`].map(t => (
                  <span key={t} className="bg-white/15 text-white text-xs px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Band + Archetype */}
      <div className={`rounded-xl border p-5 ${bandStyle.bg} ${bandStyle.border}`}>
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: bandStyle.accent }} />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: bandStyle.accent }}>Learning Personality Archetype</div>
            <div className={`text-lg font-bold ${bandStyle.text}`}>{archetype}</div>
            {summary && <p className={`text-sm mt-2 ${bandStyle.text} opacity-80`}>{summary}</p>}
          </div>
        </div>
      </div>

      {/* Radar Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">7-Dimension Learning Agility Radar</h2>
        <div className="grid grid-cols-2 gap-3">
          <RadarCard label="Coachability"             score={radarScores['Coachability'] || 0}                color="#059669" />
          <RadarCard label="Learning Orientation"     score={radarScores['Learning Orientation'] || 0}        color="#8B5CF6" />
          <RadarCard label="Unlearning Ability"       score={radarScores['Unlearning Ability'] || 0}          color="#F59E0B" />
          <RadarCard label="Technology Adaptability"  score={radarScores['Technology Adaptability'] || 0}     color="#06B6D4" />
          <RadarCard label="Reflection & Self-Awareness" score={radarScores['Reflection & Self-awareness'] || 0} color="#EC4899" />
          <RadarCard label="Growth Drive"             score={radarScores['Growth Drive'] || 0}                color="#EF4444" />
        </div>
      </div>

      {/* Dimension Heat Map */}
      {Object.keys(dimensionScores).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Dimension Heat Map</h2>
          <div>
            {Object.entries(dimensionScores).map(([dim, score]) => (
              <DimensionBar key={dim} name={dim} score={score} />
            ))}
          </div>
        </div>
      )}

      {/* Peak + Development Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Peak Coachability Dimension</div>
          <div className="text-lg font-bold text-emerald-800">{strongestDimension}</div>
          <div className="text-xs text-gray-500 mt-1">Highest coaching signal in this profile</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Priority Development Area</div>
          <div className="text-lg font-bold text-orange-800">{weakestDimension}</div>
          <div className="text-xs text-gray-500 mt-1">Focus coaching investment here for max ROI</div>
        </div>
      </div>

      {/* Flags */}
      <div className="grid grid-cols-2 gap-4">
        {greenFlags.length > 0 && (
          <div className="bg-white border border-emerald-200 rounded-xl p-5">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Green Flags — Strengths
            </h3>
            <ul className="space-y-2">
              {greenFlags.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {amberFlags.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-xl p-5">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Amber Flags — Watch Areas
            </h3>
            <ul className="space-y-2">
              {amberFlags.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Training ROI Meter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Training ROI Meter</h2>
        {[
          { label: 'Leadership Coaching ROI',      score: trainingROI },
          { label: 'Digital Upskilling ROI',       score: radarScores['Technology Adaptability'] || 0 },
          { label: 'Executive Coaching ROI',       score: radarScores['Coachability'] || 0 },
          { label: 'Cross-functional Learning ROI',score: radarScores['Learning Orientation'] || 0 },
          { label: 'Role Expansion Readiness',     score: promotionReadinessScore },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3 mb-3">
            <div className="w-52 text-sm text-gray-700 flex-shrink-0">{label}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${score}%` }} />
            </div>
            <div className="w-10 text-right text-sm font-bold text-emerald-700">{score}%</div>
          </div>
        ))}
      </div>

      {/* Download CTA */}
      <div className="border-t border-gray-200 pt-4 flex flex-col items-center gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-semibold"
        >
          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Download Full PDF Report
        </button>
        <Link to={`${orgPrefix}/reports`} className="text-sm text-gray-500 hover:text-gray-700">
          Back to Reports
        </Link>
      </div>
    </div>
  );
};

export default PclaReport;
