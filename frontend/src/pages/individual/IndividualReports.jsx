import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BarChart3, Loader2, Clock, CheckCircle } from 'lucide-react';

const IndividualReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const getReportLink = (attempt) => {
    const attemptId = attempt._id;
    const category = (attempt.assessment?.category || '').toLowerCase();
    const subCategory = (attempt.assessment?.subCategory || '').toLowerCase();

    // Check subCategory first (personality assessments use this for type)
    if (subCategory === 'big5') return `/reports/big5/${attemptId}`;
    if (subCategory === 'disc') return `/reports/disc/${attemptId}`;
    if (subCategory === 'mbti') return `/reports/mbti/${attemptId}`;
    if (subCategory === 'firo-b') return `/reports/firo/${attemptId}`;
    if (subCategory === 'hogan') return `/reports/hogan/${attemptId}`;
    if (subCategory === 'ecti') return `/reports/ecti/${attemptId}`;
    if (subCategory === 'general aptitude') return `/reports/aptitude/${attemptId}`;
    if (subCategory === 'situational judgement') return `/reports/situational/${attemptId}`;
    if (subCategory === 'reasoning') return `/reports/cognitive/${attemptId}`;

    if (category === 'situational') return `/reports/situational/${attemptId}`;
    if (category === 'cognitive') return `/reports/cognitive/${attemptId}`;
    if (category === 'aptitude') return `/reports/aptitude/${attemptId}`;

    return `/reports/${attemptId}`;
  };

  useEffect(() => {
    api.get('/attempts')
      .then(r => setReports(r.data.data?.attempts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-500 mt-1">View results from your completed assessments.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-25" />
          <p className="font-medium text-gray-600 mb-1">No reports yet</p>
          <p className="text-sm">Complete your free assessment to see your results here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {reports.map(attempt => (
              <div key={attempt._id} className={`px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors ${attempt.status === 'completed' ? 'cursor-pointer' : ''}`} onClick={() => attempt.status === 'completed' && navigate(getReportLink(attempt))}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{attempt.assessment?.title || 'Assessment'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 capitalize">{attempt.assessment?.category || ''}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    attempt.status === 'completed'
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {attempt.status === 'completed' ? 'Completed' : attempt.status}
                  </span>
                  {attempt.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualReports;
