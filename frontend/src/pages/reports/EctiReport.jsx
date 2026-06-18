import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Download, Loader2, TrendingUp, Brain, Target, Shield,
  CheckCircle, AlertTriangle, Zap, Activity, Flag, Star, Users,
  Award, BarChart2, Compass, BookOpen, AlertCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

/* ── Band config ─────────────────────────────────────────────────────────── */
const BAND_CFG = {
  'Elite Executive Thinker':   { accent: '#6D28D9', bg: 'from-purple-900 to-indigo-900', badge: 'bg-purple-100 text-purple-800' },
  'Strong Strategic Leader':   { accent: '#1D4ED8', bg: 'from-indigo-900 to-blue-900',   badge: 'bg-indigo-100 text-indigo-800' },
  'Solid Functional Leader':   { accent: '#0369A1', bg: 'from-blue-900 to-cyan-900',     badge: 'bg-blue-100 text-blue-800' },
  'Emerging Leader':           { accent: '#D97706', bg: 'from-amber-900 to-orange-900',  badge: 'bg-amber-100 text-amber-800' },
  'Execution-focused':         { accent: '#DC2626', bg: 'from-red-900 to-rose-900',      badge: 'bg-red-100 text-red-800' },
};
const getBandCfg = (band) => BAND_CFG[band] || BAND_CFG['Solid Functional Leader'];

/* ── Sub-components ──────────────────────────────────────────────────────── */
const Section = ({ icon: Icon, title, color = 'indigo', children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
    <div className={`px-6 py-4 bg-${color}-50 border-b border-${color}-100 flex items-center gap-3`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
      <h2 className={`font-black text-${color}-900`}>{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const RiskBadge = ({ level }) => {
  const cfg = {
    'VERY LOW': 'bg-emerald-100 text-emerald-800',
    'LOW':      'bg-green-100 text-green-800',
    'MODERATE': 'bg-amber-100 text-amber-800',
    'HIGH':     'bg-red-100 text-red-800',
  };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg[level] || 'bg-gray-100 text-gray-700'}`}>{level}</span>;
};

const Bar2 = ({ label, value, color = '#4F46E5' }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="text-sm font-black" style={{ color }}>{value}%</span>
    </div>
    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

/* ── Main Component ──────────────────────────────────────────────────────── */
const EctiReport = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  useEffect(() => { fetchResults(); }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/attempts/${attemptId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(res.data?.data?.attempt);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally { setLoading(false); }
  };

  const handleDownload = async (type) => {
    if (!data?.report) return toast.error('No report available');
    try {
      setDownloadModalOpen(false);
      setDownloading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/reports/${data.report}/download?type=${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `ECTI_Report_${Date.now()}.pdf`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download PDF'); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  if (error)   return <div className="max-w-3xl mx-auto p-6"><div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div></div>;
  if (!data)   return null;

  /* ── Extract data ────────────────────────────────────────────────────── */
  const ecti = data.ectiResults || {};
  const score              = ecti.ectiScore ?? ecti.percentage ?? data.percentage ?? 0;
  const rawScore           = ecti.rawScore ?? 0;
  const band               = ecti.band || 'Solid Functional Leader';
  const percentile         = ecti.percentile || 0;
  const ejq                = ecti.ejq || Math.round(80 + score * 0.4);
  const cxoPotential       = ecti.cxoPotential || Math.round(score * 0.85);
  const promotionReadiness = ecti.promotionReadiness || Math.round(score * 0.9);
  const radar              = ecti.radar || { strategic: score, ethical: score, decision: score, stakeholder: score, execution: score, framing: score };
  const greenFlags         = ecti.greenFlags || ['Operational Competence'];
  const amberFlags         = ecti.amberFlags || ['Requires broader strategic exposure'];
  const redFlags           = ecti.redFlags || [];
  const summary            = ecti.boardSummary || ecti.summary || 'Strong executive judgement displayed across assessment dimensions.';
  const archetype          = ecti.archetype || { label: 'The Strategic Integrator', traits: ['Balanced decision-making', 'Enterprise thinking'], risk: 'May over-analyse before acting.', alternates: [] };
  const behaviouralLens    = ecti.behaviouralLens || [];
  const riskMeter          = ecti.riskMeter || {};
  const pm                 = ecti.promotionMatrix || {};
  const roleFit            = ecti.roleFit || { strongFit: [], futureFit: [], lowerFit: [] };
  const development        = ecti.development || [];
  const finalRec           = ecti.finalRecommendation || {};

  const bandCfg = getBandCfg(band);

  const radarData = [
    { subject: 'Strategic Foresight', A: radar.strategic, fullMark: 100 },
    { subject: 'Ethical Courage',     A: radar.ethical,   fullMark: 100 },
    { subject: 'Decision Quality',    A: radar.decision,  fullMark: 100 },
    { subject: 'Stakeholder',         A: radar.stakeholder, fullMark: 100 },
    { subject: 'Execution Logic',     A: radar.execution, fullMark: 100 },
    { subject: 'Problem Framing',     A: radar.framing,   fullMark: 100 },
  ];

  const heatMapData = [
    { label: 'Strategic Thinking',        score: radar.strategic },
    { label: 'Ethical Leadership',         score: radar.ethical },
    { label: 'Decision Quality',           score: radar.decision },
    { label: 'Stakeholder Judgement',      score: radar.stakeholder },
    { label: 'Execution Logic',            score: radar.execution },
    { label: 'Problem Framing',            score: radar.framing },
  ];

  const zoneColor = (s) => s >= 80 ? '#10B981' : s >= 65 ? '#F59E0B' : '#EF4444';
  const zoneLabel = (s) => s >= 80 ? '🟢 Strong' : s >= 65 ? '🟡 Moderate' : '🔴 Needs Work';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 bg-gray-50 min-h-screen font-sans">

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-slate-900 font-semibold">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={() => setDownloadModalOpen(true)} disabled={downloading} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm font-semibold">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export Executive PDF
        </button>
      </div>

      {/* ── 1. Cover Dashboard ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className={`bg-gradient-to-r ${bandCfg.bg} p-8 md:p-10 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 opacity-5 scale-150 translate-x-1/4 -translate-y-1/4">
            <svg width="400" height="400" viewBox="0 0 200 200"><path fill="#FFF" d="M45.7,-76.4C58.9,-69.3,69.1,-56,76.5,-42C83.9,-28,88.5,-14,88.4,-0.1C88.3,13.8,83.4,27.6,76.1,40.6C68.8,53.6,59.1,65.8,46.5,73.5C33.9,81.2,16.9,84.4,1.4,81.9C-14.1,79.4,-28.3,71.2,-41.8,62.8C-55.3,54.4,-68.2,45.8,-76.1,33.4C-84,21,-86.9,4.8,-83.4,-10.1C-79.9,-25,-70.1,-38.5,-58.5,-49.2C-46.9,-59.9,-33.5,-67.8,-20.2,-71.9C-6.9,-76,6.3,-76.3,19.6,-74.6C32.9,-72.9,46.2,-69.2,45.7,-76.4Z" transform="translate(100 100)"/></svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase mb-4 opacity-80">
              <Brain className="w-4 h-4" /> ECTI™ Assessment Report
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">Executive Critical<br />Thinking Index</h1>
            <p className="text-white/70 text-base md:text-lg font-light">Leadership Judgement • Decision Quality • Strategic Maturity • Executive Readiness</p>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {[
            { label: 'ECTI Score', value: `${score}`, sub: '/100' },
            { label: 'Percentile Rank', value: `${percentile}`, sub: 'th' },
            { label: 'Exec. Judgement (EJQ)', value: `${ejq}`, sub: '' },
            { label: 'Leadership Band', value: band, sub: '', isText: true },
          ].map(({ label, value, sub, isText }) => (
            <div key={label} className="p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">{label}</div>
              {isText
                ? <div className={`text-lg font-black leading-tight ${bandCfg.badge.replace('bg-', 'text-').replace('-100', '-800')}`}>{value}</div>
                : <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{value}<span className="text-xl text-gray-400 font-normal">{sub}</span></div>
              }
            </div>
          ))}
        </div>

        {/* Board summary */}
        <div className="px-8 pb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Board-Level Summary</p>
            <p className="text-slate-800 leading-relaxed font-medium">{summary}</p>
          </div>
        </div>
      </div>

      {/* ── 2. Radar + Promotion Matrix ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Section icon={Target} title="Executive Capability Radar" color="indigo">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="A" stroke={bandCfg.accent} fill={bandCfg.accent} fillOpacity={0.25} strokeWidth={2.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section icon={TrendingUp} title="Promotion Readiness Matrix" color="emerald">
          <div className="space-y-1 pt-2">
            <Bar2 label="Current Role Readiness"  value={pm.currentRole || 95}          color="#10B981" />
            <Bar2 label="Next Role Readiness"      value={pm.nextRole || promotionReadiness} color="#4F46E5" />
            <Bar2 label="Large Team Leadership"    value={pm.largeTeam || Math.round(score * 0.76)} color="#6366F1" />
            <Bar2 label="Enterprise Responsibility" value={pm.enterprise || Math.round(score * 0.71)} color="#8B5CF6" />
            <Bar2 label="CXO Pipeline Readiness"   value={pm.cxoPipeline || cxoPotential} color="#A78BFA" />
          </div>
        </Section>
      </div>

      {/* ── 3. Heat Map ─────────────────────────────────────────────────── */}
      <Section icon={Activity} title="Capability Heat Map" color="rose">
        <div className="divide-y divide-gray-100">
          {heatMapData.map(({ label, score: s }) => (
            <div key={label} className="flex items-center gap-4 py-3">
              <div className="w-52 text-sm font-semibold text-gray-700">{label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s}%`, background: zoneColor(s) }} />
              </div>
              <div className="w-12 text-right text-sm font-black text-slate-800">{s}%</div>
              <div className="w-32 text-xs font-semibold text-gray-600">{zoneLabel(s)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 4. Executive Archetype ──────────────────────────────────────── */}
      <Section icon={Compass} title="Executive Archetype Mapping" color="violet">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="inline-block px-3 py-1 bg-violet-100 text-violet-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">Dominant Style</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{archetype.label}</h3>
            <ul className="space-y-2">
              {(archetype.traits || []).map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-semibold">
                  <CheckCircle className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" /> {t}
                </li>
              ))}
            </ul>
            {archetype.risk && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <span className="font-bold">Risk:</span> {archetype.risk}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Alternative Archetypes</div>
            <div className="space-y-2">
              {(archetype.alternates || []).map((a, i) => (
                <div key={i} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-slate-700">★ {a}</div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 5. Behavioural Decision Lens ────────────────────────────────── */}
      {behaviouralLens.length > 0 && (
        <Section icon={BarChart2} title="Behavioural Decision Lens" color="blue">
          <p className="text-sm text-gray-500 mb-4">Under pressure, this candidate tends to:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {behaviouralLens.map(({ behaviour, probability }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 text-sm font-semibold text-slate-700">{behaviour}</div>
                <div className="w-28">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-0.5">
                    <span></span><span>{probability}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${probability}%`, background: probability > 60 ? '#4F46E5' : '#94A3B8' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 6-8. Flags ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Green Flags', items: greenFlags, icon: CheckCircle, color: 'emerald', dot: '✔', dotColor: 'text-emerald-500' },
          { title: 'Amber Flags', items: amberFlags, icon: AlertTriangle, color: 'amber', dot: '⚠', dotColor: 'text-amber-500' },
          { title: 'Red Flags',   items: redFlags,   icon: Flag,          color: 'rose',   dot: '🔴', dotColor: 'text-rose-500' },
        ].map(({ title, items, icon: Icon, color, dot, dotColor }) => (
          <div key={title} className={`bg-white rounded-2xl border border-${color}-200 overflow-hidden shadow-sm`}>
            <div className={`bg-${color}-50 px-5 py-3 border-b border-${color}-100 flex items-center gap-2`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
              <h3 className={`font-black text-${color}-900`}>{title}</h3>
            </div>
            <div className="p-5">
              {items.length > 0
                ? <ul className="space-y-3">{items.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-semibold">
                      <span className={dotColor}>{dot}</span> {f}
                    </li>
                  ))}</ul>
                : <p className="text-sm text-gray-400 italic">None detected.</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── 9-10. Promotion + Risk ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Section icon={Zap} title="Leadership Risk Meter" color="slate">
          <div className="space-y-3">
            {[
              { label: 'Decision Risk',        val: riskMeter.decisionRisk || 'LOW' },
              { label: 'Ethics Risk',           val: riskMeter.ethicsRisk || 'VERY LOW' },
              { label: 'Stakeholder Risk',      val: riskMeter.stakeholderRisk || 'LOW' },
              { label: 'Political Risk',        val: riskMeter.politicalRisk || 'MODERATE' },
              { label: 'Execution Stretch',     val: riskMeter.executionStretch || 'MODERATE' },
              { label: 'Leadership Maturity Risk', val: riskMeter.leadershipMaturity || 'LOW' },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <RiskBadge level={val} />
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Users} title="Role Fit Mapping" color="teal">
          {[
            { label: '★★★★★ Strong Fit', items: roleFit.strongFit || [], color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { label: '★★★★ Future Fit',  items: roleFit.futureFit || [], color: 'text-blue-700 bg-blue-50 border-blue-200' },
            { label: '★★ Lower Fit',     items: roleFit.lowerFit || [],  color: 'text-gray-600 bg-gray-50 border-gray-200' },
          ].map(({ label, items, color }) => items.length > 0 && (
            <div key={label} className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{label}</p>
              <div className="space-y-1">
                {items.map((r, i) => <div key={i} className={`text-sm font-semibold px-3 py-1.5 border rounded-lg ${color}`}>{r}</div>)}
              </div>
            </div>
          ))}
        </Section>
      </div>

      {/* ── 11. Development Recommendations ─────────────────────────────── */}
      {development.length > 0 && (
        <Section icon={BookOpen} title="Development Recommendations" color="indigo">
          <p className="text-sm text-gray-500 mb-4">Priority focus areas for next-level role readiness:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {development.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-indigo-600 text-white text-xs font-black rounded-full">{i + 1}</div>
                <p className="text-sm font-semibold text-indigo-900">{rec}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 12. Final Recommendation ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
          <Award className="w-5 h-5 text-yellow-400" />
          <h2 className="font-black text-white">Final Leadership Recommendation</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Verdict',              value: finalRec.verdict || 'Recommended',   highlight: true },
              { label: 'Succession Timeline',  value: finalRec.succession || '12–24 months' },
              { label: 'Leadership Potential', value: finalRec.potential || 'High' },
              { label: 'Promotion Confidence', value: `${finalRec.confidence || Math.round(score * 0.88)}%` },
            ].map(({ label, value, highlight }) => (
              <div key={label} className={`p-4 rounded-xl border text-center ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{label}</div>
                <div className={`text-base font-black ${highlight ? 'text-indigo-800' : 'text-slate-900'}`}>{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Trust Quotient</div>
              <div className="text-lg font-black text-slate-900">{finalRec.trustQuotient || 'High'}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">CXO Potential Signal</div>
              <div className="text-lg font-black text-slate-900">{cxoPotential >= 70 ? 'Moderate to High' : cxoPotential >= 55 ? 'Moderate' : 'Developing'}</div>
            </div>
          </div>
        </div>
      </div>

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
                    <Activity className="w-5 h-5" />
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
    </div>
  );
};

export default EctiReport;
