import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService, attemptService } from '../../services';
import { useToast } from '../../context/ToastContext';
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
  const toast = useToast();
  
  const isPublicAccess = !!token;
  const assessmentId = isPublicAccess ? undefined : id;

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

    if (currentAttemptIdRef.current) {
      attemptService.saveAnswer(currentAttemptIdRef.current, {
        questionId: questionOrder.toString(),
        selectedOption: value
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
      toast.error(err.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const handleQuit = async () => {
    if (isPublicAccess) return;
    setSubmitting(true);
    try {
      const response = await attemptService.abandonAttempt(currentAttemptId);
      toast.success(response.message || 'Test abandoned');
      const prefix = orgSlug ? `/o/${orgSlug}` : '';
      navigate(`${prefix}/dashboard/user`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to quit test');
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
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
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
                {assessment?.title || 'MBTI Assessment'}
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
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>

              <button
                onClick={requestFullscreen}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 0 && (
          <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">MBTI Instructions</h2>
            <p className="text-purple-700 text-sm leading-relaxed">
              For each pair of statements, choose the one that describes you better.
              Be honest — there are no right or wrong answers. Choose based on your natural preferences.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {currentQuestions.map((question, index) => {
            const questionNumber = currentPage * QUESTIONS_PER_PAGE + index + 1;
            const isAnswered = responses[questionNumber] !== undefined;
            
            let leftTrait = question.leftTrait || '';
            let rightTrait = question.rightTrait || '';
            
            if (!leftTrait && !rightTrait && question.questionText) {
              const text = question.questionText;
              if (text.includes('|')) {
                const parts = text.split('|').map(p => p.trim());
                leftTrait = parts[0] || '';
                rightTrait = parts[1] || '';
              } else if (text.includes('\u2014')) {
                const parts = text.split('\u2014').map(p => p.trim());
                leftTrait = parts[0] || '';
                rightTrait = parts[1] || '';
              } else if (text.includes(' - ')) {
                const parts = text.split(' - ').map(p => p.trim());
                leftTrait = parts[0] || '';
                rightTrait = parts[1] || '';
              }
            }

            return (
              <div
                key={question._id}
                className={`bg-white rounded-xl p-6 border-2 transition-colors ${
                  isAnswered ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                    {questionNumber}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-sm text-purple-600 font-medium">{question.dimension} Dimension</p>
                      {isAnswered && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                    </div>
                    {leftTrait && rightTrait ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                          <span className="text-blue-600 font-semibold text-sm">LEFT:</span>
                          <p className="text-gray-700 text-sm flex-1">{leftTrait}</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-pink-400">
                          <span className="text-pink-600 font-semibold text-sm">RIGHT:</span>
                          <p className="text-gray-700 text-sm flex-1">{rightTrait}</p>
                        </div>
                      </div>
                    ) : (
                      <h3 className="text-lg text-gray-900 leading-relaxed">
                        {question.questionText || question.text}
                      </h3>
                    )}
                  </div>
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
                              ? 'bg-purple-600 text-white shadow-lg'
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
                    <span>Strongly Left</span>
                    <span>Strongly Right</span>
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
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                <XCircle className="w-4 h-4" />
                Quit
              </button>
            )}
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50 hover:text-gray-900"
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
                  i === currentPage ? 'bg-purple-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {currentPage < TOTAL_PAGES - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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

export default MbtiTest;