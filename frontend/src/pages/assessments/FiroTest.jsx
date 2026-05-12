import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assessmentService, attemptService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  XCircle,
  Bug
} from 'lucide-react';

const FiroTest = () => {
  const { id, token, attemptId: urlAttemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const isPublicAccess = !!token;

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [devMode, setDevMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState(urlAttemptId || null);
  const currentAttemptIdRef = useRef(currentAttemptId);

  useEffect(() => {
    currentAttemptIdRef.current = currentAttemptId;
  }, [currentAttemptId]);

  const QUESTIONS_PER_PAGE = 6;
  const TOTAL_QUESTIONS = 54;
  const TOTAL_PAGES = Math.ceil(TOTAL_QUESTIONS / QUESTIONS_PER_PAGE);

  useEffect(() => {
    if (isPublicAccess) {
      fetchPublicAssessment();
    } else {
      fetchAssessment();
    }
  }, [id, token]);

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning("WARNING: Navigating away from the assessment tab is not allowed!");
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  const fetchAssessment = async () => {
    try {
      const assessmentRes = await assessmentService.getAssessment(id);
      setAssessment(assessmentRes.data?.assessment);

      const attemptRes = await attemptService.startAttempt(id);
      setCurrentAttemptId(attemptRes.data?.attempt?._id);

      const questionsRes = await assessmentService.getQuestions(id);
      const sortedQuestions = (questionsRes.data?.questions || []).sort((a, b) => a.order - b.order);
      setupQuestions(sortedQuestions);

      if (attemptRes.data?.attempt?.expiresAt) {
        const expiresAt = new Date(attemptRes.data.attempt.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeRemaining(remaining);
      }
      setStartTime(Date.now());
      requestFullscreen();
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

      const loadedQuestions = attemptData?.assessment?.questions || [];
      setupQuestions(loadedQuestions);

      if (attemptData?.expiresAt) {
        const expiresAt = new Date(attemptData.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeRemaining(remaining);
      }
      setStartTime(Date.now());
      requestFullscreen();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
      setLoading(false);
    }
  };

  const setupQuestions = (raw) => {
    const normalized = raw.map((q, idx) => ({
      _id: q._id ?? q.id ?? idx,
      questionText: q.questionText ?? q.text ?? `Question ${idx + 1}`
    }));
    
    const deficit = TOTAL_QUESTIONS - normalized.length;
    if (deficit > 0) {
      for (let i = 0; i < deficit; i++) {
        normalized.push({ _id: `pad-${i}`, questionText: `Question ${normalized.length + i + 1}` });
      }
    }
    setQuestions(normalized);
    const initial = {};
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) initial[i] = null;
    setResponses(initial);
    setLoading(false);
  };

  const scale = [
    { value: 1, label: 'Never' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Occasionally' },
    { value: 4, label: 'Sometimes' },
    { value: 5, label: 'Often' },
    { value: 6, label: 'Usually' }
  ];

  const currentQuestionBase = currentPage * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(currentQuestionBase, currentQuestionBase + QUESTIONS_PER_PAGE);
  const firstQuestionIndex = currentQuestionBase + 1;

  const handleResponse = (order, value) => {
    setResponses(prev => ({ ...prev, [order]: value }));

    if (currentAttemptIdRef.current) {
      attemptService.saveAnswer(currentAttemptIdRef.current, {
        questionId: order.toString(),
        selectedOption: value
      }).catch(err => console.error('Auto-save failed:', err));
    }
  };

  const getProgress = () => {
    const answered = Object.values(responses).filter(v => v !== null && v !== undefined).length;
    return Math.round((answered / TOTAL_QUESTIONS) * 100);
  };
  const totalAnswered = Object.values(responses).filter(v => v !== null && v !== undefined).length;

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      setCurrentPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const unanswered = [];
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      if (responses[i] === null || responses[i] === undefined) unanswered.push(i);
    }
    if (unanswered.length > 0) {
      toast.warning(`Please answer all questions. Missing: ${unanswered.join(', ')}`);
      const firstUnanswered = unanswered[0];
      const page = Math.floor((firstUnanswered - 1) / QUESTIONS_PER_PAGE);
      setCurrentPage(page);
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (isPublicAccess) {
        res = await fetch('/api/attempts/' + currentAttemptIdRef.current + '/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses })
        });
      } else {
        res = await fetch(`/api/assessments/${id}/firo/submit`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ responses })
        });
      }

      const data = await res.json();
      if (data?.success) {
        document.exitFullscreen?.();
        if (isPublicAccess) {
          const params = new URLSearchParams({
            assessment: assessment?.title || 'PIRO Assessment',
            type: 'firo',
            attempted: 100,
            answered: TOTAL_QUESTIONS,
            total: TOTAL_QUESTIONS
          });
          navigate(`/thank-you?${params.toString()}`);
        } else {
          const prefix = orgSlug ? `/o/${orgSlug}` : '';
          navigate(`${prefix}/reports/firo/${currentAttemptIdRef.current}`);
        }
      } else {
        throw new Error(data?.message || 'Submit failed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit PIRO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuit = async () => {
    if (isPublicAccess) return;
    setSubmitting(true);
    try {
      await attemptService.abandonAttempt(currentAttemptIdRef.current);
      toast.success('Test abandoned');
      navigate(orgSlug ? `/o/${orgSlug}/dashboard/user` : '/dashboard/user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to quit test');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDevMode = () => {
    if (!devMode) {
      const filled = {};
      for (let i = 1; i <= TOTAL_QUESTIONS; i++) filled[i] = 5;
      setResponses(filled);
    }
    setDevMode(!devMode);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading PIRO questions...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{assessment?.title || 'PIRO Test'}</h1>
              <p className="text-sm text-gray-500">Question {firstQuestionIndex}-{Math.min(firstQuestionIndex + QUESTIONS_PER_PAGE - 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</p>
            </div>
            <div className="flex items-center gap-4">
              {assessment?.timeBound?.enabled && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                </div>
              )}
              <div className="hidden sm:block text-right">
                <span className="text-sm text-gray-600">{getProgress()}% Complete</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                  <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${getProgress()}%` }} />
                </div>
              </div>
              <button
                onClick={requestFullscreen}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={toggleDevMode} className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${devMode ? 'bg-green-500 text-white' : 'bg-teal-100 text-teal-700'}`}>
                {devMode ? 'Dev ON' : 'Dev'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {devMode && (
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">DEV MODE ACTIVE - All PIRO answers auto-filled</span>
            <button onClick={() => setDevMode(false)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full">Turn OFF</button>
          </div>
        </div>
      )}

      {showQuitConfirm && !isPublicAccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quit Test?</h2>
            <p className="text-gray-600 mb-4">{totalAnswered >= 3 ? 'Quitting will count as 1 test credit used.' : 'No credit will be deducted.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowQuitConfirm(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Continue</button>
              <button onClick={handleQuit} disabled={submitting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Quit</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 0 && (
          <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h2 className="text-lg font-semibold text-teal-900 mb-2">PIRO Instructions</h2>
            <p className="text-teal-700 text-sm">For each statement, select the option that best describes you on the given 6-point scale.</p>
          </div>
        )}

        <div className="space-y-8">
          {currentQuestions.map((q, idx) => {
            const order = currentQuestionBase + idx + 1;
            const selected = responses[order];
            return (
              <div key={q._id ?? idx} className={`bg-white rounded-xl p-6 border-2 ${selected ? 'border-green-200' : 'border-gray-200'}`}>
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-semibold">{order}</span>
                  <p className="flex-1 text-gray-800 font-medium">{q.questionText}</p>
                  {selected && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-center">
                  {scale.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleResponse(order, opt.value)}
                      aria-label={opt.label}
                      className={`flex flex-col items-center justify-center w-20 h-20 rounded-lg border transition-all ${selected === opt.value ? 'bg-teal-600 text-white border-teal-600 scale-105' : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-teal-400'}`}
                    >
                      <span className="text-sm font-semibold">{opt.value}</span>
                      <span className="text-xs mt-1">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {!isPublicAccess && (
              <button onClick={() => setShowQuitConfirm(true)} className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">
                <XCircle className="w-4 h-4" /> Quit
              </button>
            )}
            <button onClick={handlePrev} disabled={currentPage === 0} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" /> Prev
            </button>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentPage ? 'bg-teal-600' : 'bg-gray-300'}`} />
            ))}
          </div>
          {currentPage < TOTAL_PAGES - 1 ? (
            <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Next <ChevronRight className="w-5 h-5" /></button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle className="w-4 h-4" /> Submit</>}
            </button>
          )}
        </div>

        {currentPage === TOTAL_PAGES - 1 && totalAnswered < TOTAL_QUESTIONS && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <span className="text-amber-700 text-sm"><AlertCircle className="w-4 h-4 inline mr-1" />You have answered {totalAnswered} of {TOTAL_QUESTIONS} questions. Please complete all before submitting.</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default FiroTest;
