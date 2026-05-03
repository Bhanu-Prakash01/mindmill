import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../../services';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { FileBarChart, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

const DISC_COLORS = { D: '#ef4444', I: '#3b82f6', S: '#22c55e', C: '#f59e0b' };
const BIG5_TRAITS = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];
const BIG5_COLORS = { Openness: '#8b5cf6', Conscientiousness: '#06b6d4', Extraversion: '#f59e0b', Agreeableness: '#22c55e', Neuroticism: '#ef4444' };

const SharedReport = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSharedReport();
  }, [token]);

  const fetchSharedReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getSharedReport(token);
      setReport(response.data?.report);
    } catch (err) {
      if (err.response?.status === 410) {
        setError('This share link has expired. Please request a new link from the sender.');
      } else {
        setError(err.response?.data?.message || 'Report not found or link is invalid.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to View Report</h2>
          <p className="text-gray-600 mb-6">{error || 'The report could not be loaded.'}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const category = (report.assessment?.category || '').toLowerCase();
  const isDisc = category === 'disc';
  const isBig5 = category === 'big5' || category === 'big five' || category === 'bigfive';
  const assessmentName = report.assessment?.title || 'Assessment';

  const barChartData = [];
  if (isDisc && report.dimensions) {
    ['D', 'I', 'S', 'C'].forEach(trait => {
      const dim = report.dimensions[trait];
      barChartData.push({ name: trait, value: dim?.percentage || dim?.score || 0 });
    });
  } else if (isBig5 && report.scores) {
    BIG5_TRAITS.forEach(trait => {
      barChartData.push({ name: trait, value: report.scores[trait] || 0 });
    });
  } else if (report.scores) {
    Object.entries(report.scores).forEach(([key, value]) => {
      barChartData.push({ name: key, value });
    });
  }

  const radarChartData = [];
  if (isDisc && report.dimensions) {
    ['D', 'I', 'S', 'C'].forEach(trait => {
      const dim = report.dimensions[trait];
      radarChartData.push({ trait, value: dim?.percentage || dim?.score || 0 });
    });
  } else if (isBig5 && report.scores) {
    BIG5_TRAITS.forEach(trait => {
      radarChartData.push({ trait, value: report.scores[trait] || 0 });
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileBarChart className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">{assessmentName}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Generated: {new Date(report.generatedAt).toLocaleDateString()}
            </span>
            {report.assessment?.category && (
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium uppercase">
                {report.assessment.category}
              </span>
            )}
          </div>
        </div>

        {barChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Score Overview
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={isDisc ? undefined : (BIG5_COLORS[barChartData[0]?.name] || '#6366f1')}
                  radius={[4, 4, 0, 0]}
                >
                  {isDisc && barChartData.map((entry, index) => (
                    <cell key={`cell-${index}`} fill={DISC_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {radarChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Radar</h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="trait" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {report.analysis && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-4">
            {report.analysis.summary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700 leading-relaxed">{report.analysis.summary}</p>
              </div>
            )}
            {report.analysis.strengths && report.analysis.strengths.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Strengths</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {report.analysis.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.analysis.developmentAreas && report.analysis.developmentAreas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Development Areas</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {report.analysis.developmentAreas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-sm text-gray-400 mt-8 pb-4">
          <p>Powered by Mindmill Assessments</p>
        </div>
      </div>
    </div>
  );
};

export default SharedReport;
