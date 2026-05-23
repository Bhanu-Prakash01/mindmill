import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService, attemptService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertTriangle,
   Maximize2,
   XCircle,
   Bug
} from 'lucide-react';

const TakeTest = () => {
  const { id, token, attemptId: urlAttemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUser } = useAuth();

  const isPublicAccess = !!token;
 const assessmentId = isPublicAccess ? undefined : id;
 const attemptId = isPublicAccess ? urlAttemptId : null;

 const [assessment, setAssessment] = useState(null);
 const [attempt, setAttempt] = useState(null);
 const [questions, setQuestions] = useState([]);

 const [answers, setAnswers] = useState({});
 const [discAnswers, setDiscAnswers] = useState({}); // { [questionId]: { most: statementIndex, least: statementIndex } }
 const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
 const [loading, setLoading] = useState(true);
 const [timeRemaining, setTimeRemaining] = useState(0);
 const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
 const [showQuitConfirm, setShowQuitConfirm] = useState(false);
const [submitting, setSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [error, setError] = useState(null);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const attemptRef = useRef(attempt);
  const tabSwitchCountRef = useRef(0);
  const fullscreenExitsRef = useRef(0);

  // ── Dev Mode ──────────────────────────────────────────────
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const devAutoFillTimer = useRef(null);

  const autoFillAnswers = useCallback(() => {
    if (!questions.length) return;

    const filled = {};
    const filledDisc = {};

    questions.forEach(q => {
      const qid = q._id;
      if (q.type === 'mcq' && q.options?.length) {
        const idx = Math.floor(Math.random() * q.options.length);
        filled[qid] = { selectedOption: idx };
      } else if (q.type === 'rating') {
        filled[qid] = { ratingAnswer: Math.floor(Math.random() * 5) + 1 };
      } else if (q.type === 'text') {
        filled[qid] = { textAnswer: '(Dev Mode) Auto-filled response.' };
      } else if (q.type === 'disc-ranking') {
        const stmts = q.statements || [];
        if (stmts.length >= 2) {
          const indices = [...Array(stmts.length).keys()].sort(() => Math.random() - 0.5);
          filledDisc[qid] = { most: indices[0], least: indices[indices.length - 1] };
          filled[qid] = { selectedOption: indices[0] };
        }
      }
    });

    setAnswers(filled);
    setDiscAnswers(filledDisc);
  }, [questions]);

  // Auto-fill once questions are loaded in dev mode
  useEffect(() => {
    if (isDevMode && !loading && questions.length > 0) {
      autoFillAnswers();
    }
  }, [isDevMode, loading, questions, autoFillAnswers]);

 useEffect(() => {
  if (isPublicAccess) {
    fetchPublicAssessment();
  } else {
    startTest();
  }

  // Proctoring event listeners
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

 // Timer countdown
 useEffect(() => {
  if (timeRemaining <= 0 || !attempt) return;

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
  }, [timeRemaining, attempt]);

 const startTest = async () => {
 try {
 // Check if passcode is needed from URL or state
 const urlParams = new URLSearchParams(window.location.search);
 const passcode = urlParams.get('passcode');

  // Start attempt
  const attemptResponse = await attemptService.startAttempt(assessmentId, passcode);
  const attemptData = attemptResponse.data?.attempt;
  setAttempt(attemptData);

  // Get assessment details
  const assessmentResponse = await assessmentService.getAssessment(assessmentId);
  const assessmentData = assessmentResponse.data?.assessment;
  setAssessment(assessmentData);

  // Get questions
  const questionsResponse = await assessmentService.getQuestions(assessmentId);
  const questionsData = questionsResponse.data?.questions || [];
  setQuestions(questionsData);

  // Initialize timer
  if (attemptData.expiresAt) {
    const expiresAt = new Date(attemptData.expiresAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    setTimeRemaining(remaining);
    setStartTime(now);
    if (assessmentData?.timeBound?.enabled && assessmentData.timeBound.durationMinutes) {
      setTotalTimeSeconds(assessmentData.timeBound.duration * 60);
    } else {
      setTotalTimeSeconds(remaining);
    }
  }

 // Request fullscreen
 requestFullscreen();

 setLoading(false);
} catch (error) {
  console.error('Error starting test:', error);
  toast.error(error.response?.data?.message || 'Failed to start test');
  navigate(orgSlug ? `/o/${orgSlug}/assessments` : '/');
  }
 };

  const fetchPublicAssessment = async () => {
  try {
  const attemptRes = await attemptService.getPublicAttempt(attemptId);
  const attemptData = attemptRes.data?.attempt;
  setAttempt(attemptData);
  setAssessment(attemptData?.assessment);
  setQuestions(attemptData?.assessment?.questions || []);

  if (attemptData?.expiresAt) {
  const expiresAt = new Date(attemptData.expiresAt).getTime();
  const now = Date.now();
  setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)));
  }

  requestFullscreen();
  setLoading(false);
  } catch (err) {
  setError(err.response?.data?.message || 'Failed to load assessment');
  setLoading(false);
  }
  };

 const requestFullscreen = () => {
 const elem = document.documentElement;
 if (elem.requestFullscreen) {
 elem.requestFullscreen().catch(() => {});
 }
 };

 const logProctoringEvent = async (event, details) => {
 if (!attemptRef.current) return;
 try {
  await attemptService.logProctoringEvent(attemptRef.current._id, { event, details });
 } catch (error) {
  console.error('Error logging proctoring event:', error);
 }
 };

 const handleAnswer = async (questionId, answerData) => {
 setAnswers(prev => ({ ...prev, [questionId]: answerData }));

 try {
 await attemptService.saveAnswer(attempt._id, questionId, answerData);
 } catch (error) {
 console.error('Error saving answer:', error);
 }
 };

 const handleOptionSelect = (questionId, optionIndex) => {
  handleAnswer(questionId, { selectedOption: optionIndex });
 };

 const handleTextAnswer = (questionId, text) => {
  handleAnswer(questionId, { textAnswer: text });
 };

 const handleRatingAnswer = (questionId, rating) => {
  handleAnswer(questionId, { ratingAnswer: rating });
 };

 const handleDiscRanking = (questionId, selectionType, statementIndex) => {
  setDiscAnswers(prev => {
   const current = prev[questionId] || { most: null, least: null };
   // Prevent selecting same statement for both MOST and LEAST
   if (selectionType === 'most' && current.least === statementIndex) return prev;
   if (selectionType === 'least' && current.most === statementIndex) return prev;
   const updated = { ...current, [selectionType]: statementIndex };
   // Mark as answered in generic answers state for progress tracking
   const isAnswered = updated.most !== null && updated.least !== null;
   if (isAnswered) {
    handleAnswer(questionId, { selectedOption: updated.most });
   }
   return { ...prev, [questionId]: updated };
  });
 };




  
  
 const toggleFlagQuestion = (index) => {
 setFlaggedQuestions(prev => {
 const newSet = new Set(prev);
 if (newSet.has(index)) {
 newSet.delete(index);
 } else {
 newSet.add(index);
 }
 return newSet;
 });
 };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answeredCount = Object.keys(answers).length;
      const totalQuestions = questions.length;
      const percentAttempted = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
      
      let timeTaken = null;
      let totalTime = null;
      if (totalTimeSeconds > 0 && startTime) {
        totalTime = totalTimeSeconds;
        timeTaken = Math.floor((Date.now() - startTime) / 1000);
      }

      // Build submit body — include DISC responses if this is a DISC assessment
      const isDisc = (assessment?.category || '').toLowerCase() === 'disc' || (assessment?.subCategory || '').toLowerCase() === 'disc';
      let submitBody = {};
      if (isDisc) {
        const discResponses = questions.map(q => {
          const qId = q._id;
          const discAns = discAnswers[qId];
          const stmts = q.statements || [];
          const answerArr = stmts.map((stmt, idx) => {
            let score = 0;
            if (discAns?.most === idx) score = 1;
            else if (discAns?.least === idx) score = -1;
            return { trait: stmt.trait, score };
          });
          return { questionId: qId, answers: answerArr };
        });
        submitBody = { responses: discResponses };
      }

      await attemptService.submitAttempt(attempt._id, submitBody);
      await refreshUser();

      const params = new URLSearchParams({
        assessment: assessment?.title || 'Assessment',
        type: assessment?.category || 'standard',
        attempted: percentAttempted.toString(),
        answered: answeredCount.toString(),
        total: totalQuestions.toString(),
        timeTaken: timeTaken !== null ? timeTaken.toString() : '',
        totalTime: totalTime !== null ? totalTime.toString() : ''
      });
      navigate(`/thank-you?${params.toString()}`);
} catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.response?.data?.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };

 const handleQuit = async () => {
  setSubmitting(true);
  try {
  const response = await attemptService.abandonAttempt(attempt._id);
  toast.success(response.message || 'Test abandoned');
  navigate(orgSlug ? `/o/${orgSlug}/dashboard/user` : '/');
  } catch (error) {
  console.error('Error quitting test:', error);
  toast.error(error.response?.data?.message || 'Failed to quit test');
 setSubmitting(false);
 }
 };

 const formatTime = (seconds) => {
 const hours = Math.floor(seconds / 3600);
 const mins = Math.floor((seconds % 3600) / 60);
 const secs = seconds % 60;
 if (hours > 0) {
 return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
 }
 return `${mins}:${secs.toString().padStart(2, '0')}`;
 };

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
 <p className="text-gray-600 ">Loading assessment...</p>
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
 <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
 <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment Unavailable</h2>
 <p className="text-gray-600">{error}</p>
 </div>
 </div>
 );
 }

 const answeredCount = Object.keys(answers).length;
 const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

 return (
 <div className="min-h-screen bg-gray-50 ">
 {/* Header */}
 <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
{assessment?.bannerImage && (
    <div className="w-full h-16 overflow-hidden">
     <img src={assessment.bannerImage.startsWith('http') ? assessment.bannerImage : `/${assessment.bannerImage}`} alt="" className="w-full h-16 object-cover" />
    </div>
   )}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 <div>
 <h1 className="text-lg font-semibold text-gray-900 ">
 {assessment?.title}
 </h1>
 <p className="text-sm text-gray-500 ">
 {questions.length} Questions
 </p>
 </div>

 <div className="flex items-center gap-6">
 {/* Timer */}
 {assessment?.timeBound?.enabled && (
 <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
 timeRemaining < 300
 ? 'bg-red-100 text-red-700 '
 : 'bg-gray-100 text-gray-700 '
 }`}>
 <Clock className="w-5 h-5" />
 <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
 </div>
 )}

 {/* Progress */}
 <div className="hidden sm:block">
 <div className="flex items-center gap-2 text-sm text-gray-600 ">
 <span>{answeredCount}/{questions.length} answered</span>
 </div>
 <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
 <div
 className="h-full bg-indigo-600 rounded-full transition-all"
 style={{ width: `${progress}%` }}
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
  onClick={() => setShowQuitConfirm(true)}
 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
 >
 Quit
 </button>

 <button
 onClick={() => setShowSubmitConfirm(true)}
 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
 >
 Submit
 </button>
 </div>
 </div>
 </div>
 </header>

  {/* Dev Mode Banner */}
  {isDevMode && (
    <div className="bg-amber-50 border-b-2 border-amber-400">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <Bug className="w-4 h-4" />
          <span className="font-semibold">DEV MODE</span>
          <span className="text-amber-600">— Answers auto-filled for testing</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={autoFillAnswers}
            className="text-xs px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-medium transition-colors"
          >
            Re-fill All
          </button>
          <button
            onClick={() => {
              autoFillAnswers();
              setTimeout(() => {
                setShowSubmitConfirm(true);
              }, 100);
            }}
            className="text-xs px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium transition-colors"
          >
            Auto-fill &amp; Submit
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Proctoring Warnings */}
  {(tabSwitchCount > 0 || fullscreenExits > 0) && (
  <div className="bg-yellow-50 border-b border-yellow-200 ">
  <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 text-sm text-yellow-800 ">
  <AlertTriangle className="w-4 h-4" />
  <span>
  Warning: {tabSwitchCount > 0 && `${tabSwitchCount} tab switch(es)`}
  {tabSwitchCount > 0 && fullscreenExits > 0 && ' and '}
  {fullscreenExits > 0 && `${fullscreenExits} fullscreen exit(s)`} detected
  </span>
  </div>
  </div>
  )}



      
  {/* Mobile Progress */}
  <div className="sm:hidden px-4 pt-4 pb-0 bg-white border-b border-gray-200">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600">Progress</span>
      <span className="font-medium">{answeredCount}/{questions.length}</span>
    </div>
    <div className="w-full h-2 bg-gray-200 rounded-full">
      <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
    </div>
  </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* Question Navigation */}
 <div className="lg:col-span-1 order-2 lg:order-1">
 <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Questions</h3>
  <div className="grid grid-cols-5 gap-1 sm:gap-2">
 {questions.map((q, index) => {
 const isAnswered = answers[q._id];
 const isFlagged = flaggedQuestions.has(index);

 return (
 <button
 key={q._id}
 onClick={() => {
   const el = document.getElementById(`question-${index}`);
   if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
 }}
 className={`aspect-square rounded-lg text-sm font-medium transition-colors relative ${
 isAnswered
 ? 'bg-green-100 text-green-700 '
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
 }`}
 >
 {index + 1}
 {isFlagged && (
 <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
 )}
 </button>
 );
 })}
 </div>

 <div className="mt-4 space-y-2 text-sm">
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 bg-green-100 rounded" />
 <span className="text-gray-600 ">Answered</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 bg-gray-100 rounded relative">
 <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
 </div>
 <span className="text-gray-600 ">Flagged</span>
 </div>
 </div>
 </div>
 </div>

 {/* Question Content */}
 <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
 {questions.map((question, index) => {
   const currentAnswer = answers[question._id];
   return (
 <div key={question._id} id={`question-${index}`} className="bg-white rounded-xl border border-gray-200 p-6 scroll-mt-24">
 <div className="flex items-start justify-between mb-6">
 <span className="text-sm text-gray-500 ">
 Question {index + 1}
 {question.dimension && (
 <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
 {question.dimension}
 </span>
 )}
 </span>
 <button
 onClick={() => toggleFlagQuestion(index)}
 className={`p-2 rounded-lg transition-colors ${
 flaggedQuestions.has(index)
 ? 'bg-orange-100 text-orange-600 '
 : 'text-gray-400 hover:text-orange-500'
 }`}
 >
 <Flag className="w-5 h-5" />
 </button>
 </div>

 <h2 className="text-lg font-medium text-gray-900 mb-6">
 {question.questionText}
 </h2>

 {/* MCQ Options */}
 {question.type === 'mcq' && (
 <div className="space-y-3">
 {question.options?.map((option, optIndex) => (
 <button
 key={optIndex}
 onClick={() => handleOptionSelect(question._id, optIndex)}
 className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
 currentAnswer?.selectedOption === optIndex
 ? 'border-indigo-600 bg-indigo-50 '
 : 'border-gray-200 hover:border-gray-300 '
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
 currentAnswer?.selectedOption === optIndex
 ? 'border-indigo-600 bg-indigo-600'
 : 'border-gray-300 '
 }`}>
 {currentAnswer?.selectedOption === optIndex && (
 <CheckCircle className="w-4 h-4 text-white" />
 )}
 </div>
 <span className="text-gray-900 ">{option.text}</span>
 </div>
 </button>
 ))}
 </div>
 )}

  {/* DISC Ranking */}
  {question.type === 'disc-ranking' && (() => {
    const discAns = discAnswers[question._id] || { most: null, least: null };
    const stmts = question.statements || [];
    const allSelected = discAns.most !== null && discAns.least !== null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-6 mb-2 text-sm font-medium text-gray-500">
          <span className="ml-auto w-20 text-center text-green-700 bg-green-50 rounded-md py-1">Most Like Me</span>
          <span className="w-20 text-center text-red-700 bg-red-50 rounded-md py-1">Least Like Me</span>
        </div>
        {stmts.map((stmt, idx) => {
          const isMost = discAns.most === idx;
          const isLeast = discAns.least === idx;
          const canSelectMost = discAns.least !== idx;
          const canSelectLeast = discAns.most !== idx;
          return (
            <div
              key={idx}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                isMost
                  ? 'border-green-400 bg-green-50'
                  : isLeast
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="flex-1 text-gray-900 text-sm leading-snug">{stmt.text}</span>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => canSelectMost && handleDiscRanking(question._id, 'most', idx)}
                  title="Most like me"
                  className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-all ${
                    isMost
                      ? 'border-green-600 bg-green-600 text-white shadow-md'
                      : canSelectMost
                      ? 'border-green-300 text-green-600 hover:border-green-500 hover:bg-green-50'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => canSelectLeast && handleDiscRanking(question._id, 'least', idx)}
                  title="Least like me"
                  className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold text-xs transition-all ${
                    isLeast
                      ? 'border-red-600 bg-red-600 text-white shadow-md'
                      : canSelectLeast
                      ? 'border-red-300 text-red-600 hover:border-red-500 hover:bg-red-50'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  L
                </button>
              </div>
            </div>
          );
        })}
        {!allSelected && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            ⚡ Select one statement as <strong>Most Like Me (M)</strong> and one as <strong>Least Like Me (L)</strong> to proceed.
          </p>
        )}
      </div>
    );
  })()}

 {/* Text Answer */}
 {question.type === 'text' && (
 <textarea
 value={currentAnswer?.textAnswer || ''}
 onChange={(e) => handleTextAnswer(question._id, e.target.value)}
 rows={6}
 className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Enter your answer here..."
 />
 )}

 {/* Rating Scale */}
 {question.type === 'rating' && (
 <div className="flex items-center justify-center gap-4 py-8">
 {[1, 2, 3, 4, 5].map((rating) => (
 <button
 key={rating}
 onClick={() => handleRatingAnswer(question._id, rating)}
  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-lg font-medium transition-colors ${
 currentAnswer?.ratingAnswer === rating
 ? 'bg-indigo-600 text-white'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
 }`}
 >
 {rating}
 </button>
 ))}
 </div>
 )}
 </div>
   );
 })}
 
 {/* Bottom Submit Button */}
 <div className="flex justify-end pt-4">
    <button
      onClick={() => setShowSubmitConfirm(true)}
      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
    >
      Review &amp; Submit Assessment
    </button>
 </div>
 </div>
 </div>
 </div>

 {/* Submit Confirmation Modal */}
 {showSubmitConfirm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl max-w-md w-full p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="p-3 bg-yellow-100 rounded-full">
 <AlertCircle className="w-6 h-6 text-yellow-600 " />
 </div>
 <h2 className="text-xl font-bold text-gray-900 ">Submit Assessment?</h2>
 </div>

 <p className="text-gray-600 mb-4">
 You have answered {answeredCount} out of {questions.length} questions.
 {answeredCount < questions.length && (
 <span className="text-orange-600 block mt-1">
 {questions.length - answeredCount} question(s) are unanswered.
 </span>
 )}
 </p>

 {flaggedQuestions.size > 0 && (
 <p className="text-sm text-orange-600 mb-4">
 You have flagged {flaggedQuestions.size} question(s) for review.
 </p>
 )}

 <div className="flex gap-3">
 <button
 onClick={() => setShowSubmitConfirm(false)}
 className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 "
 >
 Continue Assessment
 </button>
 <button
 onClick={handleSubmit}
 disabled={submitting}
 className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
 >
 {submitting ? 'Submitting...' : 'Submit'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Quit Confirmation Modal */}
 {showQuitConfirm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl max-w-md w-full p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="p-3 bg-red-100 rounded-full">
 <XCircle className="w-6 h-6 text-red-600" />
 </div>
 <h2 className="text-xl font-bold text-gray-900">Quit Test?</h2>
 </div>

 <p className="text-gray-600 mb-4">
 {answeredCount >= 3 ? (
   <span className="text-red-600">
     You have answered {answeredCount} questions. Quitting will count as 1 test credit used.
   </span>
 ) : (
   <span className="text-green-600">
     You have answered {answeredCount} question(s). Since you answered fewer than 3 questions, no test credit will be deducted.
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

export default TakeTest;
