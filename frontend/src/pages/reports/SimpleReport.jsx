import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Download,
  Clock,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  FileText
} from 'lucide-react';

const SimpleReport = () => {
  const { attemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/attempts/${attemptId}/simple-results`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(response.data?.data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/attempts/${attemptId}/simple-report/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `Score_Report_${Date.now()}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(err.response?.data?.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
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
            onClick={() => navigate(orgSlug ? `/o/${orgSlug}/reports` : '/reports')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Return to Reports
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totalScore, maxScore, percentage, passed, breakdown, testTaker, assessment, timeSpent, completedAt } = data;
  const orgPrefix = orgSlug ? `/o/${orgSlug}` : '';

  const typeColors = {
    situational: 'bg-orange-100 text-orange-700',
    cognitive: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700'
  };

  const typeLabels = {
    situational: 'Situational Judgement',
    cognitive: 'Cognitive Reasoning',
    professional: 'General Aptitude'
  };

  const category = assessment?.category || 'situational';
  const typeColor = typeColors[category] || typeColors.situational;
  const typeLabel = typeLabels[category] || typeLabels.situational;

  const isAptitude = breakdown?.type === 'General Aptitude';
  const isCognitive = breakdown?.type === 'Cognitive Reasoning';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Score Report</h1>
              <p className="text-gray-600 mt-1">{assessment?.title}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColor}`}>
              {typeLabel}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {totalScore}/{maxScore}
            </div>
            <div className="text-2xl text-gray-500 mb-6">
              {percentage}%
            </div>
            {passed ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-full">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">PASSED</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-full">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">FAILED</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Score Breakdown
            </h3>
            {isCognitive ? (
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">Logical Reasoning</td>
                    <td className="py-3 text-right font-medium">{breakdown?.logical || 0}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">Numerical Reasoning</td>
                    <td className="py-3 text-right font-medium">{breakdown?.numerical || 0}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">Verbal Reasoning</td>
                    <td className="py-3 text-right font-medium">{breakdown?.verbal || 0}</td>
                  </tr>
                  <tr className="pt-3">
                    <td className="py-3 font-semibold text-gray-900">Total</td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {totalScore}/{maxScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : isAptitude ? (
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">Rating Questions</td>
                    <td className="py-3 text-right font-medium">{breakdown?.ratingScore || 0}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">MCQ Questions</td>
                    <td className="py-3 text-right font-medium">{breakdown?.mcqScore || 0}</td>
                  </tr>
                  <tr className="pt-3">
                    <td className="py-3 font-semibold text-gray-900">Total</td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {totalScore}/{maxScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-3 text-gray-700">Correct Answers</td>
                    <td className="py-3 text-right font-medium">
                      {breakdown?.total || 0}/{breakdown?.maxScore || 10}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Time Taken</p>
                <p className="font-medium text-gray-900">{timeSpent}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="font-medium text-gray-900">
                  {completedAt ? new Date(completedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Candidate Information
          </h3>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-full">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{testTaker?.name}</p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                <span>{testTaker?.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PDF
              </>
            )}
          </button>
          <Link
            to={`${orgPrefix}/reports`}
            className="block text-center mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SimpleReport;