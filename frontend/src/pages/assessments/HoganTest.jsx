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
  XCircle
} from 'lucide-react';

const HoganTest = () => {
  const { id, token, attemptId: urlAttemptId } = useParams();
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
        alert("WARNING: Leaving the assessment tab is not allowed!");
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        logProctoringEvent('tab_switch', { count: tabSwitchCountRef.current });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
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
      const response = await assessmentService.getAssessment(id);
      const assessmentData = response.data.assessment;
      setAssessment(assessmentData);
      
      const questionsResponse = await assessmentService.getQuestions(id);
      setQuestions(questionsResponse.data.questions || []);
      
      if (assessmentData.timeBound?.enabled) {
        setTimeRemaining(assessmentData.timeBound.durationMinutes * 60);
      }

      if (!currentAttemptId) {
        const attemptResponse = await attemptService.startAttempt(id);
        if (attemptResponse.data.attempt?._id) {
          setCurrentAttemptId(attemptResponse.data.attempt._id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/public/${id}?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setAssessment(data.data.assessment);
        const questionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/${id}/questions?token=${token}`);
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.data?.questions || []);
        
        if (data.data.assessment.timeBound?.enabled) {
          setTimeRemaining(data.data.assessment.timeBound.durationMinutes * 60);
        }
        
        if (!currentAttemptId && urlAttemptId) {
          setCurrentAttemptId(urlAttemptId);
        }
      } else {
        setError('Failed to load assessment');
      }
    } catch (err) {
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (questionNumber, value) => {
    setResponses(prev => ({
      ...prev,
      [questionNumber]: value
    }));
  };

  const handleNext = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!currentAttemptId) {
      setError('No active attempt found');
      return;
    }

    try {
      setSubmitting(true);
      
      const apiUrl = isPublicAccess 
        ? `${import.meta.env.VITE_API_URL}/api/assessments/invite/${token}/hogan/submit`
        : `/assessments/${id}/hogan/submit`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(!isPublicAccess && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({ responses })
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/hogan/results/${data.data.attemptId}`, {
          state: { fromSubmit: true }
        });
      } else {
        setError(data.message || 'Failed to submit assessment');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scaleLabels = [
    { value: 1, label: 'Strongly Disagree', size: 'w-10 h-10' },
    { value: 2, label: 'Disagree', size: 'w-10 h-10' },
    { value: 3, label: 'Neutral', size: 'w-10 h-10' },
    { value: 4, label: 'Agree', size: 'w-10 h-10' },
    { value: 5, label: 'Strongly Agree', size: 'w-10 h-10' }
  ];

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

  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const startQuestion = currentPage * QUESTIONS_PER_PAGE + 1;
  const endQuestion = Math.min(startQuestion + QUESTIONS_PER_PAGE - 1, TOTAL_QUESTIONS);
  const currentQuestions = questions.slice(startQuestion - 1, endQuestion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {assessment?.organization?.logo && (
              <img src={assessment.organization.logo} alt="Logo" className="h-8 w-auto" />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{assessment?.title || 'Hogan Personality Inventory'}</h1>
              <p className="text-sm text-gray-500">Question {startQuestion}-{endQuestion} of {TOTAL_QUESTIONS}</p>
            </div>
          </div>

          {timeRemaining > 0 && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => {
              const pageStart = i * QUESTIONS_PER_PAGE + 1;
              const pageEnd = Math.min(pageStart + QUESTIONS_PER_PAGE - 1, TOTAL_QUESTIONS);
              const answeredInPage = Array.from({ length: pageEnd - pageStart + 1 }, (_, idx) => 
                responses[pageStart + idx]
              ).filter(Boolean).length;
              const isComplete = answeredInPage === (pageEnd - pageStart + 1);
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    i === currentPage
                      ? 'bg-indigo-600 text-white'
                      : isComplete
                        ? 'bg-green-100 text-green-700'
                        : answeredInPage > 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                  {isComplete && <CheckCircle className="w-3 h-3 inline ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {currentQuestions.map((question, idx) => {
            const questionNumber = startQuestion + idx;
            return (
              <div key={question._id || questionNumber} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {questionNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-lg leading-relaxed">
                      {question.questionText}
                    </p>

                    <div className="mt-6">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        {scaleLabels.map((scale) => (
                          <button
                            key={scale.value}
                            onClick={() => handleResponse(questionNumber, scale.value)}
                            className={`flex flex-col items-center gap-2 transition-all ${
                              responses[questionNumber] === scale.value
                                ? 'scale-110'
                                : 'hover:scale-105'
                            }`}
                          >
                            <div
                              className={`${scale.size} rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                responses[questionNumber] === scale.value
                                  ? 'bg-indigo-600 text-white shadow-lg'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {scale.value}
                            </div>
                            <span className="text-xs text-gray-500 hidden sm:block max-w-[80px] text-center leading-tight">
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
                  i === currentPage
                    ? 'bg-indigo-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {currentPage < TOTAL_PAGES - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit
                </>
              )}
            </button>
          )}
        </div>

        {currentPage === TOTAL_PAGES - 1 && Object.keys(responses).length < TOTAL_QUESTIONS && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm text-center">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              You have answered {Object.keys(responses).length} of {TOTAL_QUESTIONS} questions.
              {Object.keys(responses).length < TOTAL_QUESTIONS * 0.67 && 
                ' Please answer at least 67% of questions to submit.'}
            </p>
          </div>
        )}
      </main>

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
                  You have answered {Object.keys(responses).length} questions. Quitting will count as 1 test credit used.
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
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Quit & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoganTest;