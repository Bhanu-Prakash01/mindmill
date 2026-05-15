import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService, attemptService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
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

const HoganTest = () => {
  const { id, token, attemptId: urlAttemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUser } = useAuth();
  
  const isPublicAccess = !!token;

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentAttemptId, setCurrentAttemptId] = useState(urlAttemptId || null);
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

  const QUESTIONS_PER_PAGE = 5;
  const TOTAL_QUESTIONS = 50;
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
        toast.warning("WARNING: Navigating away from the assessment tab is not allowed! This action has been recorded.");
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        logProctoringEvent('tab_switch', { count: tabSwitchCountRef.current });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.warning("WARNING: Exiting full screen during the assessment is not allowed! Please return to full screen.");
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
      setLoading(true);
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
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeRemaining(remaining);
        setStartTime(Date.now());
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
      setLoading(true);
      const attemptRes = await attemptService.getPublicAttempt(urlAttemptId);
      const attemptData = attemptRes.data?.attempt;
      setCurrentAttemptId(attemptData?._id);
      setAssessment(attemptData?.assessment);

      const sortedQuestions = (attemptData?.assessment?.questions || []).sort((a, b) => a.order - b.order);
      setQuestions(sortedQuestions);

      if (attemptData?.expiresAt) {
        const expiresAt = new Date(attemptData.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeRemaining(remaining);
        setStartTime(Date.now());
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

  const handleResponse = (questionNumber, value) => {
    setResponses(prev => ({
      ...prev,
      [questionNumber]: value
    }));

    if (currentAttemptIdRef.current) {
      attemptService.saveAnswer(currentAttemptIdRef.current, {
        questionId: questionNumber.toString(),
        ratingAnswer: value
      }).catch(err => console.error('Auto-save failed:', err));
    }
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
      toast.warning(`Please answer all questions. Missing: ${unanswered.join(', ')}`);
      const firstUnanswered = unanswered[0];
      setCurrentPage(Math.floor((firstUnanswered - 1) / QUESTIONS_PER_PAGE));
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (isPublicAccess) {
        res = await fetch(`/api/attempts/${currentAttemptIdRef.current}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ responses })
        });
      } else {
        res = await fetch(`/api/assessments/${id}/hogan/submit`, {
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
        document.exitFullscreen?.();
        if (isPublicAccess) {
          const answeredCount = Object.keys(responses).length;
          const percentAttempted = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
          
          let timeTaken = null;
          let totalTime = null;
          if (totalTimeSeconds > 0 && startTime) {
            totalTime = totalTimeSeconds;
            timeTaken = Math.floor((Date.now() - startTime) / 1000);
          }
          
          const params = new URLSearchParams({
            assessment: assessment?.title || 'TraitMap Index',
            type: 'hogan',
            attempted: percentAttempted.toString(),
            answered: answeredCount.toString(),
            total: TOTAL_QUESTIONS.toString(),
            timeTaken: timeTaken !== null ? timeTaken.toString() : '',
            totalTime: totalTime !== null ? totalTime.toString() : ''
          });
          navigate(`/thank-you?${params.toString()}`);
        } else {
          await refreshUser();
          if (orgSlug) {
            navigate(`/o/${orgSlug}/reports/hogan/${data.data.attempt._id}`);
          } else {
            navigate('/individual/reports');
          }
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const handleQuit = async () => {
    if (isPublicAccess) return;
    setSubmitting(true);
    try {
      await attemptService.abandonAttempt(currentAttemptIdRef.current);
      toast.success('Test abandoned');
      if (orgSlug) {
        navigate(`/o/${orgSlug}/dashboard/user`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to quit test');
    } finally {
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

  const fillAllAnswersHogan = () => {
    const newResponses = {};
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      newResponses[i] = Math.floor(Math.random() * 5) + 1;
    }
    setResponses(prev => ({ ...prev, ...newResponses }));
    console.log('Dev Mode: TraitMap Index answers filled!');
  };

  const toggleDevMode = () => {
    if (!devMode) {
      fillAllAnswersHogan();
    }
    setDevMode(!devMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const startQuestion = currentPage * QUESTIONS_PER_PAGE + 1;
  const endQuestion = Math.min(startQuestion + QUESTIONS_PER_PAGE - 1, TOTAL_QUESTIONS);
  const currentQuestions = questions.slice(startQuestion - 1, endQuestion);

  const scaleLabels = [
    { value: 1, label: 'Strongly Disagree', size: 'w-8 h-8' },
    { value: 2, label: 'Disagree', size: 'w-10 h-10' },
    { value: 3, label: 'Neutral', size: 'w-12 h-12' },
    { value: 4, label: 'Agree', size: 'w-10 h-10' },
    { value: 5, label: 'Strongly Agree', size: 'w-8 h-8' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {assessment?.title || 'TraitMap Index'}
              </h1>
              <p className="text-sm text-gray-500">
                Question {startQuestion}-{endQuestion} of {TOTAL_QUESTIONS}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {assessment?.timeBound?.enabled && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
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
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>

              <button
                onClick={requestFullscreen}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleDevMode}
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  devMode 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-100 text-blue-700'
                }`}
              >
                {devMode ? <Zap className="w-4 h-4" /> : <Bug className="w-4 h-4" />}
                {devMode ? 'Dev ON' : 'Dev'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {devMode && (
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">DEV MODE ACTIVE - All TraitMap Index answers auto-filled</span>
            <button onClick={() => setDevMode(false)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full">Turn OFF</button>
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
                <span className="text-red-600">Quitting will count as 1 test credit used.</span>
              ) : (
                <span className="text-green-600">No credit will be deducted.</span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowQuitConfirm(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Continue</button>
              <button onClick={handleQuit} disabled={submitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Quit</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 0 && (
          <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">TraitMap Index Instructions</h2>
            <p className="text-blue-700 text-sm leading-relaxed">
              Please rate how much you agree or disagree with each statement.
              Be honest — there are no right or wrong answers.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {currentQuestions.map((question, idx) => {
            const questionNumber = startQuestion + idx;
            const isAnswered = responses[questionNumber] !== undefined;

            return (
              <div
                key={question._id}
                className={`bg-white rounded-xl p-6 border-2 transition-colors ${
                  isAnswered ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    {questionNumber}
                  </span>
                  <h3 className="flex-1 text-lg text-gray-900 leading-relaxed">
                    {question.questionText || question.text}
                  </h3>
                  {isAnswered && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    {scaleLabels.map((scale) => (
                      <button
                        key={scale.value}
                        onClick={() => handleResponse(questionNumber, scale.value)}
                        className={`flex flex-col items-center gap-2 transition-all ${
                          responses[questionNumber] === scale.value ? 'scale-110' : 'hover:scale-105'
                        }`}
                      >
                        <div
                          className={`${scale.size} rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            responses[questionNumber] === scale.value
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {scale.value}
                        </div>
                        <span className="text-xs text-gray-500 hidden sm:block max-w-[80px] text-center">
                          {scale.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
                    <span>Disagree</span>
                    <span>Agree</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {!isPublicAccess && (
              <button
                onClick={() => setShowQuitConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                <XCircle className="w-4 h-4" />
                Quit
              </button>
            )}
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
          </div>

          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentPage ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {currentPage < TOTAL_PAGES - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> Submit</>
              )}
            </button>
          )}
        </div>

        {currentPage === TOTAL_PAGES - 1 && Object.keys(responses).length < TOTAL_QUESTIONS && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm text-center">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              You have answered {Object.keys(responses).length} of {TOTAL_QUESTIONS} questions.
              Please answer all questions before submitting.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HoganTest;