import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService, attemptService } from '../../services';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Maximize2,
  XCircle,
  Bug,
  Zap
} from 'lucide-react';

const MbtiTest = () => {
  const { id, token, attemptId: urlAttemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  
  const isPublicAccess = !!token;
  const assessmentId = isPublicAccess ? undefined : id;
  const attemptId = isPublicAccess ? urlAttemptId : null;

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentAttemptId, setCurrentAttemptId] = useState(attemptId);
  const [error, setError] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const currentAttemptIdRef = useRef(currentAttemptId);
  const tabSwitchCountRef = useRef(0);
  const fullscreenExitsRef = useRef(0);

  useEffect(() => {
    currentAttemptIdRef.current = currentAttemptId;
  }, [currentAttemptId]);

  const TOTAL_QUESTIONS = 32;
  const QUESTIONS_PER_PAGE = 8;
  const TOTAL_PAGES = Math.ceil(TOTAL_QUESTIONS / QUESTIONS_PER_PAGE);

  useEffect(() => {
    if (isPublicAccess) {
      fetchPublicAssessment();
    } else {
      fetchAssessment();
    }
  }, [id, token]);

  useEffect(() => {
    if (currentAttemptId) {
      logProctoringEvent('test_started', {});
    }
  }, [currentAttemptId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  const logProctoringEvent = async (event, details) => {
    const currentId = currentAttemptIdRef.current;
    if (!currentId) return;
    try {
      await attemptService.logProctoringEvent(currentId, { event, details });
    } catch (error) {
      console.error('Error logging proctoring event:', error);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("WARNING: Navigating away from the assessment tab is not allowed! This action has been recorded.");
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        logProctoringEvent('tab_switch', { count: tabSwitchCountRef.current });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        alert("WARNING: Exiting full screen during the assessment is not allowed! Please return to full screen.");
        fullscreenExitsRef.current += 1;
        setFullscreenExits(fullscreenExitsRef.current);
        logProctoringEvent('fullscreen_exit', { count: fullscreenExitsRef.current });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const fetchAssessment = async () => {
    try {
      const assessmentRes = await assessmentService.getAssessment(id);
      const assessmentData = assessmentRes.data?.assessment;
      setAssessment(assessmentData);

      const questionsRes = await assessmentService.getQuestions(id);
      const sortedQuestions = (questionsRes.data?.questions || []).sort((a, b) => a.order - b.order);
      setQuestions(sortedQuestions);

      const attemptRes = await attemptService.startAttempt(id);
      setCurrentAttemptId(attemptRes.data?.attempt?._id);

      if (attemptRes.data?.attempt?.expiresAt) {
        const expiresAt = new Date(attemptRes.data.attempt.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeRemaining(remaining);
        setStartTime(now);
        if (assessmentData?.timeBound?.enabled && assessmentData.timeBound.durationMinutes) {
          setTotalTimeSeconds(assessmentData.timeBound.durationMinutes * 60);
        } else {
          setTotalTimeSeconds(remaining);
        }
      }

      requestFullscreen();
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
      setLoading(false);
    }
  };

  const fetchPublicAssessment = async () => {
    try {
      const attemptRes = await attemptService.getPublicAttempt(urlAttemptId);
      const attemptData = attemptRes.data?.attempt;
      setCurrentAttemptId(attemptData?._id);
      setAssessment(attemptData?.assessment);

      const sortedQuestions = (attemptData?.assessment?.questions || []).sort((a, b) => a.order - b.order);
      setQuestions(sortedQuestions);

      if (attemptData?.expiresAt) {
        const expiresAt = new Date(attemptData.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeRemaining(remaining);
        setStartTime(now);
        if (attemptData?.assessment?.timeBound?.enabled && attemptData.assessment.timeBound.durationMinutes) {
          setTotalTimeSeconds(attemptData.assessment.timeBound.durationMinutes * 60);
        } else {
          setTotalTimeSeconds(remaining);
        }
      }

      requestFullscreen();
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
      setLoading(false);
    }
  };

  const handleResponse = (questionOrder, value) => {
    setResponses(prev => ({
      ...prev,
      [questionOrder]: value
    }));
  };

  const handleNext = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const unanswered = [];
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      if (!responses[i]) {
        unanswered.push(i);
      }
    }

    if (unanswered.length > 0) {
      alert(`Please answer all questions. Missing: ${unanswered.join(', ')}`);
      const firstUnanswered = unanswered[0];
      setCurrentPage(Math.floor((firstUnanswered - 1) / QUESTIONS_PER_PAGE));
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (isPublicAccess) {
        res = await fetch(`/api/attempts/${currentAttemptId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ responses })
        });
      } else {
        res = await fetch(`/api/assessments/${id}/mbti/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ responses })
        });
      }

      const data = await res.json();

      if (data.success) {
        if (isPublicAccess) {
          document.exitFullscreen?.();
          const answeredCount = Object.keys(responses).length;
          const totalQuestions = TOTAL_QUESTIONS;
          const percentAttempted = Math.round((answeredCount / totalQuestions) * 100);
          
          let timeTaken = null;
          let totalTime = null;
          if (totalTimeSeconds > 0 && startTime) {
            totalTime = totalTimeSeconds;
            timeTaken = Math.floor((Date.now() - startTime) / 1000);
          }
          
          const params = new URLSearchParams({
            assessment: assessment?.title || 'MBTI Personality',
            type: 'mbti',
            attempted: percentAttempted.toString(),
            answered: answeredCount.toString(),
            total: totalQuestions.toString(),
            timeTaken: timeTaken !== null ? timeTaken.toString() : '',
            totalTime: totalTime !== null ? totalTime.toString() : ''
          });
          navigate(`/thank-you?${params.toString()}`);
        } else {
          const prefix = orgSlug ? `/o/${orgSlug}` : '';
          navigate(`${prefix}/reports/mbti/${data.data.attempt._id}`);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const handleQuit = async () => {
    if (isPublicAccess) return;
    setSubmitting(true);
    try {
      const response = await attemptService.abandonAttempt(currentAttemptId);
      alert(response.message || 'Test abandoned');
      const prefix = orgSlug ? `/o/${orgSlug}` : '';
      navigate(`${prefix}/dashboard/user`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to quit test');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const answered = Object.keys(responses).length;
    return Math.round((answered / TOTAL_QUESTIONS) * 100);
  };

  const fillAllAnswersMbti = () => {
    const newResponses = {};
    
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const randomRating = Math.floor(Math.random() * 5) + 1;
      newResponses[i] = randomRating;
    }
    
    setResponses(prev => ({ ...prev, ...newResponses }));
    console.log('Dev Mode: MBTI answers filled!');
  };

  const toggleDevMode = () => {
    if (!devMode) {
      fillAllAnswersMbti();
    }
    setDevMode(!devMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const currentQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  const scaleLabels = [
    { value: 1, label: 'Strongly Left', size: 'w-8 h-8' },
    { value: 2, label: 'Left', size: 'w-10 h-10' },
    { value: 3, label: 'Neutral', size: 'w-12 h-12' },
    { value: 4, label: 'Right', size: 'w-10 h-10' },
    { value: 5, label: 'Strongly Right', size: 'w-8 h-8' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {assessment?.title}
              </h1>
              <p className="text-sm text-gray-500">
                Question {currentPage * QUESTIONS_PER_PAGE + 1} - {Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {assessment?.timeBound?.enabled && (
<div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeRemaining < 300
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
                }`}>
                  <Clock className="w-5 h-5" />
                  <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                </div>
              )}

              <div className="hidden sm:block">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{getProgress()}% Complete</span>
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>

              <button
                onClick={requestFullscreen}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                title="Return to Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </button>

              <button
                onClick={toggleDevMode}
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  devMode 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                title="Dev Mode: Auto-fill all answers"
              >
                {devMode ? <Zap className="w-4 h-4" /> : <Bug className="w-4 h-4" />}
                {devMode ? 'Dev Mode ON' : 'Dev Mode'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {devMode && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bug className="w-4 h-4" />
              <span>DEV MODE ACTIVE - All MBTI answers auto-filled</span>
            </div>
            <button
              onClick={() => setDevMode(false)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
            >
              Turn OFF
            </button>
          </div>
        </div>
      )}

      {showQuitConfirm && !isPublicAccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quit Test?</h2>
            </div>

            <p className="text-gray-600 mb-4">
              {Object.keys(responses).length >= 3 ? (
                <span className="text-red-600">
                  You have answered {Object.keys(responses.length)} questions. Quitting will count as 1 test credit used.
                </span>
              ) : (
                <span className="text-green-600">
                  You have answered {Object.keys(responses).length} question(s). Since you answered fewer than 3 questions, no test credit will be deducted.
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Continue Assessment
              </button>
              <button
                onClick={handleQuit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Quitting...' : 'Quit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MbtiTest;