import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService, attemptService } from '../../services';
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
 Bug,
 Zap
} from 'lucide-react';

const TakeTest = () => {
 const { id, token, attemptId: urlAttemptId, orgSlug } = useParams();
 const navigate = useNavigate();

 const isPublicAccess = !!token;
 const assessmentId = isPublicAccess ? undefined : id;
 const attemptId = isPublicAccess ? urlAttemptId : null;

 const [assessment, setAssessment] = useState(null);
 const [attempt, setAttempt] = useState(null);
 const [questions, setQuestions] = useState([]);
 const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
 const [answers, setAnswers] = useState({});
 const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
 const [loading, setLoading] = useState(true);
 const [timeRemaining, setTimeRemaining] = useState(0);
 const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
 const [showQuitConfirm, setShowQuitConfirm] = useState(false);
const [submitting, setSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [error, setError] = useState(null);
  const [devMode, setDevMode] = useState(false);
 const attemptRef = useRef(attempt);
 const tabSwitchCountRef = useRef(0);
 const fullscreenExitsRef = useRef(0);

 useEffect(() => {
  if (isPublicAccess) {
    fetchPublicAssessment();
  } else {
    startTest();
  }

  // Proctoring event listeners
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
 setAssessment(assessmentResponse.data?.assessment);

 // Get questions
 const questionsResponse = await assessmentService.getQuestions(assessmentId);
 const questionsData = questionsResponse.data?.questions || [];
 setQuestions(questionsData);

 // Initialize timer
 if (attemptData.expiresAt) {
 const expiresAt = new Date(attemptData.expiresAt).getTime();
 const now = Date.now();
 setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)));
 }

 // Request fullscreen
 requestFullscreen();

 setLoading(false);
 } catch (error) {
 console.error('Error starting test:', error);
 alert(error.response?.data?.message || 'Failed to start test');
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

  // Dev Mode: Fill all answers randomly
  const fillAllAnswers = async () => {
    const newAnswers = {};
    
    for (const question of questions) {
      switch (question.type) {
        case 'mcq':
          if (question.options && question.options.length > 0) {
            const randomIndex = Math.floor(Math.random() * question.options.length);
            newAnswers[question._id] = { selectedOption: randomIndex };
          }
          break;
        
        case 'text':
          const sampleTexts = [
            'This is a sample response for testing purposes.',
            'I believe this answer demonstrates my understanding.',
            'The quick brown fox jumps over the lazy dog.',
            'Development mode test response - sample text answer.',
            'This assessment is proceeding well in dev mode.'
          ];
          newAnswers[question._id] = { 
            textAnswer: sampleTexts[Math.floor(Math.random() * sampleTexts.length)] 
          };
          break;
        
        case 'rating':
          const randomRating = Math.floor(Math.random() * 5) + 1;
          newAnswers[question._id] = { ratingAnswer: randomRating };
          break;
        
        default:
          break;
      }
    }

    // Update local state
    setAnswers(newAnswers);

    // Save all answers to backend
    try {
      for (const [questionId, answerData] of Object.entries(newAnswers)) {
        await attemptService.saveAnswer(attempt._id, questionId, answerData);
      }
      console.log('Dev Mode: All answers filled and saved!');
    } catch (error) {
      console.error('Dev Mode: Error saving answers:', error);
    }
  };

  const toggleDevMode = () => {
    if (!devMode) {
      // Turning ON - fill all answers
      fillAllAnswers();
    }
    setDevMode(!devMode);
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
  await attemptService.submitAttempt(attempt._id);
  const params = new URLSearchParams({
    assessment: assessment?.title || 'Assessment',
    type: assessment?.category || 'standard'
  });
  navigate(`/thank-you?${params.toString()}`);
  } catch (error) {
 console.error('Error submitting test:', error);
 alert(error.response?.data?.message || 'Failed to submit test');
 setSubmitting(false);
 }
 };

 const handleQuit = async () => {
 setSubmitting(true);
 try {
 const response = await attemptService.abandonAttempt(attempt._id);
 alert(response.message || 'Test abandoned');
 navigate(orgSlug ? `/o/${orgSlug}/dashboard/user` : '/');
 } catch (error) {
 console.error('Error quitting test:', error);
 alert(error.response?.data?.message || 'Failed to quit test');
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

 const currentQuestion = questions[currentQuestionIndex];
 const currentAnswer = answers[currentQuestion?._id];
 const answeredCount = Object.keys(answers).length;
 const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

 return (
 <div className="min-h-screen bg-gray-50 ">
 {/* Header */}
 <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 <div>
 <h1 className="text-lg font-semibold text-gray-900 ">
 {assessment?.title}
 </h1>
 <p className="text-sm text-gray-500 ">
 Question {currentQuestionIndex + 1} of {questions.length}
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

  {/* Dev Mode Banner */}
  {devMode && (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bug className="w-4 h-4" />
          <span>DEV MODE ACTIVE - All answers auto-filled randomly</span>
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

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* Question Navigation */}
 <div className="lg:col-span-1 order-2 lg:order-1">
 <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Questions</h3>
 <div className="grid grid-cols-5 gap-2">
 {questions.map((q, index) => {
 const isAnswered = answers[q._id];
 const isFlagged = flaggedQuestions.has(index);
 const isCurrent = index === currentQuestionIndex;

 return (
 <button
 key={q._id}
 onClick={() => setCurrentQuestionIndex(index)}
 className={`aspect-square rounded-lg text-sm font-medium transition-colors relative ${
 isCurrent
 ? 'bg-indigo-600 text-white'
 : isAnswered
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
 <div className="w-4 h-4 bg-indigo-600 rounded" />
 <span className="text-gray-600 ">Current</span>
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
 <div className="lg:col-span-3 order-1 lg:order-2">
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 {currentQuestion && (
 <>
 <div className="flex items-start justify-between mb-6">
 <span className="text-sm text-gray-500 ">
 Question {currentQuestionIndex + 1}
 {currentQuestion.dimension && (
 <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
 {currentQuestion.dimension}
 </span>
 )}
 </span>
 <button
 onClick={() => toggleFlagQuestion(currentQuestionIndex)}
 className={`p-2 rounded-lg transition-colors ${
 flaggedQuestions.has(currentQuestionIndex)
 ? 'bg-orange-100 text-orange-600 '
 : 'text-gray-400 hover:text-orange-500'
 }`}
 >
 <Flag className="w-5 h-5" />
 </button>
 </div>

 <h2 className="text-lg font-medium text-gray-900 mb-6">
 {currentQuestion.questionText}
 </h2>

 {/* MCQ Options */}
 {currentQuestion.type === 'mcq' && (
 <div className="space-y-3">
 {currentQuestion.options?.map((option, index) => (
 <button
 key={index}
 onClick={() => handleOptionSelect(currentQuestion._id, index)}
 className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
 currentAnswer?.selectedOption === index
 ? 'border-indigo-600 bg-indigo-50 '
 : 'border-gray-200 hover:border-gray-300 '
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
 currentAnswer?.selectedOption === index
 ? 'border-indigo-600 bg-indigo-600'
 : 'border-gray-300 '
 }`}>
 {currentAnswer?.selectedOption === index && (
 <CheckCircle className="w-4 h-4 text-white" />
 )}
 </div>
 <span className="text-gray-900 ">{option.text}</span>
 </div>
 </button>
 ))}
 </div>
 )}

 {/* Text Answer */}
 {currentQuestion.type === 'text' && (
 <textarea
 value={currentAnswer?.textAnswer || ''}
 onChange={(e) => handleTextAnswer(currentQuestion._id, e.target.value)}
 rows={6}
 className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Enter your answer here..."
 />
 )}

 {/* Rating Scale */}
 {currentQuestion.type === 'rating' && (
 <div className="flex items-center justify-center gap-4 py-8">
 {[1, 2, 3, 4, 5].map((rating) => (
 <button
 key={rating}
 onClick={() => handleRatingAnswer(currentQuestion._id, rating)}
 className={`w-12 h-12 rounded-lg text-lg font-medium transition-colors ${
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

 {/* Navigation */}
 <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 ">
 <button
 onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
 disabled={currentQuestionIndex === 0}
 className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50 hover:text-gray-900 "
 >
 <ChevronLeft className="w-5 h-5" />
 Previous
 </button>
 <button
 onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
 disabled={currentQuestionIndex === questions.length - 1}
 className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50 hover:text-gray-900 "
 >
 Next
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 </>
 )}
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
