import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService } from '../../services';
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckSquare,
  Monitor,
  Maximize2,
  Ban,
  FileQuestion,
  Loader2,
  AlertCircle,
  ChevronRight,
  Eye
} from 'lucide-react';

const TestTermsAndConditions = () => {
  const { id, token, attemptId, category, orgSlug } = useParams();
  const navigate = useNavigate();

  const isPublicAccess = !!token;
  const [agreed, setAgreed] = useState(false);
  const [fullscreenFailed, setFullscreenFailed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessmentInfo();
  }, []);

  const fetchAssessmentInfo = async () => {
    try {
      setLoading(true);
      if (isPublicAccess) {
        // Public users: attempt already created, fetch it
        const res = await attemptService.getPublicAttempt(attemptId);
        setAssessment(res.data?.attempt?.assessment);
      } else if (id) {
        // Authenticated users: no attempt yet, fetch assessment directly
        const { assessmentService } = await import('../../services');
        const res = await assessmentService.getAssessment(id);
        setAssessment(res.data?.assessment);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        return true;
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
    return false;
  };

  const handleBeginTest = async () => {
    if (!agreed) return;

    setStarting(true);
    const fsSuccess = await requestFullscreen();

    if (!fsSuccess) {
      setFullscreenFailed(true);
      setStarting(false);
      return;
    }

    // Small delay for fullscreen to stabilize
    setTimeout(() => {
      navigateToTest();
    }, 300);
  };

  const navigateToTest = () => {
    const urlCategoryPrefix = category ? category + '/' : '';
    const assessmentCategoryLower = (assessment?.category || assessment?.subCategory || category || '').toLowerCase();
    const assessmentCategory = assessment?.subCategory?.toLowerCase() || assessment?.category?.toLowerCase() || category?.toLowerCase() || '';

    console.log('Navigate - assessment:', assessment?.title, 'category:', assessmentCategory, 'subCategory:', assessment?.subCategory);

    if (isPublicAccess) {
      if (assessmentCategory === 'big5' || assessment?.subCategory === 'BIG5') {
        navigate(`/take/${urlCategoryPrefix}${token}/big5/${attemptId}`);
      } else if (assessmentCategory === 'disc' || assessment?.subCategory === 'DISC') {
        navigate(`/take/${urlCategoryPrefix}${token}/disc/${attemptId}`);
      } else if (assessmentCategory === 'hogan' || assessment?.subCategory === 'HOGAN') {
        navigate(`/take/${urlCategoryPrefix}${token}/hogan/${attemptId}`);
      } else if (assessmentCategory === 'mbti' || assessmentCategory === 'mbbti' || assessment?.subCategory === 'MBTI') {
        navigate(`/take/${urlCategoryPrefix}${token}/mbti/${attemptId}`);
      } else if (assessmentCategory === 'firo-b' || assessmentCategory === 'firo' || assessment?.subCategory === 'FIRO-B') {
        navigate(`/take/${urlCategoryPrefix}${token}/firo/${attemptId}`);
      } else {
        navigate(`/take/${urlCategoryPrefix}${token}/test/${attemptId}`);
      }
    } else {
      const prefix = orgSlug ? `/o/${orgSlug}` : '';
      if (assessmentCategory === 'big5' || assessmentCategory === 'bigfive' || assessment?.subCategory?.toLowerCase() === 'big5') {
        navigate(`${prefix}/assessments/${id}/big5`);
      } else if (assessmentCategory === 'disc' || assessment?.subCategory?.toLowerCase() === 'disc') {
        navigate(`${prefix}/assessments/${id}/disc`);
      } else if (assessmentCategory === 'mbti' || assessment?.subCategory?.toLowerCase() === 'mbti') {
        navigate(`${prefix}/assessments/${id}/mbti`);
      } else if (assessmentCategory === 'hogan' || assessment?.subCategory?.toLowerCase() === 'hogan') {
        navigate(`${prefix}/assessments/${id}/hogan`);
      } else if (assessmentCategory === 'firo-b' || assessmentCategory === 'firo' || assessment?.subCategory?.toLowerCase() === 'firo-b') {
        navigate(`${prefix}/assessments/${id}/firo`);
      } else {
        navigate(`${prefix}/assessments/${id}/take`);
      }
    }
  };

  const handleContinueWithoutFullscreen = () => {
    navigateToTest();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {assessment?.bannerImage && (
          <img src={`/${assessment.bannerImage}`} alt="" className="w-full h-36 object-cover" />
        )}
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <Shield className="w-12 h-12 text-white/80 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Terms & Conditions</h1>
          <p className="text-indigo-100 mt-1">
            {assessment?.title || 'Assessment'} &mdash; Please read carefully before starting
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Test Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 pb-4 border-b border-gray-100">
            {assessment?.timeBound?.enabled && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>{assessment.timeBound.durationMinutes} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FileQuestion className="w-4 h-4 text-indigo-500" />
              <span>{assessment?.totalQuestions || 'Multiple'} questions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium uppercase">
                {assessment?.category || 'Assessment'}
              </span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Terms & Conditions
            </h2>
            <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <span>This assessment must be completed in <strong>fullscreen mode</strong>. Exiting fullscreen will be recorded as a violation and may affect your results.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <span><strong>Do not switch tabs</strong> or navigate away from this assessment. All tab switches are monitored and flagged.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <span>Once started, the timer <strong>cannot be paused</strong>. Ensure you have enough time and a stable internet connection.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                <span>You must answer <strong>all questions</strong> before submitting. Incomplete submissions may not be scored.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold mt-0.5">5</span>
                <span>Your responses are <strong>confidential</strong> and will be used solely for assessment purposes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">6</span>
                <span>There are <strong>no right or wrong answers</strong>. Be honest and answer based on your natural tendencies.</span>
              </li>
            </ul>
          </div>

          {/* Question & Answer System Guide */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              How to Answer Questions
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
              {(!assessment?.category || assessment.category === 'big5') && (
                <div className="flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Rating Scale (1–5)</p>
                    <p>Select a number from 1 (Strongly Disagree) to 5 (Strongly Agree) for each statement. Base your answer on how you naturally behave, not how you think you should.</p>
                  </div>
                </div>
              )}
              {(!assessment?.category || assessment.category === 'disc') && (
                <div className="flex items-start gap-3">
                  <CheckSquare className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">MOST / LEAST Selection</p>
                    <p>For each question, select one statement that is <strong>MOST</strong> like you and one that is <strong>LEAST</strong> like you. You must select both to proceed.</p>
                  </div>
                </div>
              )}
              {(assessment?.category === 'psychometric' || assessment?.category === 'personality' || assessment?.category === 'cognitive' || assessment?.category === 'aptitude' || assessment?.category === 'situational' || assessment?.category === 'professional') && (
                <>
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Multiple Choice</p>
                      <p>Select the best answer from the given options. Read all choices before selecting.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Text & Rating Questions</p>
                      <p>Some questions may require a written response or a rating. Follow the on-screen instructions for each question.</p>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-start gap-3">
                <CheckSquare className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Navigation</p>
                  <p>Use the <strong>Next</strong> and <strong>Previous</strong> buttons to move between questions. You can go back and change your answers at any time before submitting.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Reminders */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 space-y-1">
                <p className="font-semibold">Before You Begin:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Ensure you are in a quiet environment with no distractions</li>
                  <li>Close all other browser tabs and applications</li>
                  <li>Use a stable internet connection</li>
                  <li>Do not use mobile devices — a desktop/laptop is recommended</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fullscreen Reminder */}
          <div className="flex items-center gap-3 bg-indigo-50 rounded-lg p-4">
            <Monitor className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <div className="text-sm text-indigo-800">
              <p className="font-semibold">This test will open in fullscreen mode</p>
              <p>Your browser will request fullscreen permission when you click "Begin Test". Please allow it.</p>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the <strong>Terms & Conditions</strong>. I understand that this assessment will be monitored, and I consent to the collection of my responses for evaluation purposes.
            </span>
          </label>

          {/* Fullscreen failure warning */}
          {fullscreenFailed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">Fullscreen permission was denied</p>
                  <p className="mt-1">Fullscreen mode is recommended for the best experience. You can still proceed, but your session may be flagged.</p>
                </div>
              </div>
              <button
                onClick={handleContinueWithoutFullscreen}
                className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
              >
                Continue Without Fullscreen
              </button>
            </div>
          )}

          {/* Begin Test Button */}
          {!fullscreenFailed && (
            <button
              onClick={handleBeginTest}
              disabled={!agreed || starting}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entering Fullscreen...
                </>
              ) : (
                <>
                  <Maximize2 className="w-5 h-5" />
                  Begin Test
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
          Powered by MindMill Assessments
        </div>
      </div>
    </div>
  );
};

export default TestTermsAndConditions;
