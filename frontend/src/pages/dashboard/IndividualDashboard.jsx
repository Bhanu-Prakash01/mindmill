import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Sparkles, FileText, Clock, CheckCircle, ArrowRight,
  CreditCard, Loader2, Lock, BarChart3, TrendingUp, AlertCircle
} from 'lucide-react';

const IndividualDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trialAssessment, setTrialAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const promises = [];

      if (user?.freeTrialAssessmentId) {
        promises.push(
          api.get(`/assessments/${user.freeTrialAssessmentId}`)
            .then(r => r.data.success && setTrialAssessment(r.data.data?.assessment))
            .catch(() => {})
        );
      }

      promises.push(
        api.get('/attempts')
          .then(r => r.data.success && setReports(r.data.data?.attempts || []))
          .catch(() => {})
      );

      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = () => {
    if (!trialAssessment) return;
    navigate(`/assessments/${trialAssessment._id}/terms`);
  };

  const trialUsed = user?.freeTrialUsed;
  const credits = user?.personalCredits;
  const remainingCredits = (credits?.total || 0) - (credits?.used || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your account.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Free Trial</p>
            <p className="text-lg font-bold text-gray-900">{trialUsed ? 'Used' : 'Available'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Credits Left</p>
            <p className="text-lg font-bold text-gray-900">{remainingCredits}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Reports</p>
            <p className="text-lg font-bold text-gray-900">{reports.filter(r => r.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Trial Assessment */}
        <div className="lg:col-span-2 space-y-6">

          {/* Free Trial Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Your Free Assessment</h2>
              {!trialUsed && (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                  Ready to take
                </span>
              )}
            </div>
            <div className="p-6">
              {trialAssessment ? (
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg">{trialAssessment.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 capitalize">{trialAssessment.category}</span>
                      {trialAssessment.timeBound?.enabled && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          {trialAssessment.timeBound.durationMinutes} min
                        </span>
                      )}
                      {trialAssessment.totalQuestions > 0 && (
                        <span className="text-xs text-gray-400">{trialAssessment.totalQuestions} questions</span>
                      )}
                    </div>
                    {trialAssessment.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{trialAssessment.description}</p>
                    )}
                    <div className="mt-4">
                      {trialUsed ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Completed — check your reports
                        </div>
                      ) : (
                        <button
                          onClick={handleStartTrial}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all"
                        >
                          Start Assessment <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No assessment assigned. Please contact support.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Reports</h2>
              <Link to="/individual/reports" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View All
              </Link>
            </div>
            {reports.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-25" />
                <p className="text-sm">No reports yet. Complete an assessment to see your results.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {reports.slice(0, 5).map(attempt => (
                  <div key={attempt._id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{attempt.assessment?.title || 'Assessment'}</p>
                        <p className="text-xs text-gray-400">{new Date(attempt.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      attempt.status === 'completed'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {attempt.status === 'completed' ? 'Completed' : attempt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Credits Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">My Credits</h3>
            </div>
            <div className="p-5">
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-indigo-600 mb-1">{remainingCredits}</div>
                <p className="text-sm text-gray-500">credits remaining</p>
              </div>
              {!trialUsed && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-700 text-center font-medium">
                    🎁 1 free assessment included
                  </p>
                </div>
              )}
              <Link
                to="/individual/credits"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Buy Credits
              </Link>
            </div>
          </div>

          {/* Upgrade Prompt */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg shadow-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-200" />
              <h3 className="font-semibold">Unlock More</h3>
            </div>
            <ul className="space-y-2 mb-4">
              {['Access all assessments', 'Unlimited attempts', 'Detailed PDF reports'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-indigo-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/individual/credits"
              className="block text-center w-full py-2 bg-white text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              View Pricing →
            </Link>
          </div>

          {/* Locked Features */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">With Credits</h3>
            </div>
            <div className="p-5 space-y-3">
              {['Access 10+ assessments', 'Team comparisons', 'Downloadable PDF reports', 'Track progress over time'].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-500">
                  <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualDashboard;
