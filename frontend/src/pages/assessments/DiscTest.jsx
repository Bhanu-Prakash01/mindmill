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
  Info,
  Target,
  Maximize2,
  XCircle
} from 'lucide-react';

const DiscTest = () => {
  const { id, token, attemptId: urlAttemptId, orgSlug } = useParams();
  const navigate = useNavigate();
  
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
  const [attemptId, setAttemptId] = useState(urlAttemptId || null);
  const [error, setError] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const attemptIdRef = useRef(attemptId);
  const tabSwitchCountRef = useRef(0);
  const fullscreenExitsRef = useRef(0);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  // Professional DISC standard: 28 questions, but we handle dynamic counts from DB
  const totalQuestions = questions.length || 28;
  const QUESTIONS_PER_PAGE = 4;
  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);

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

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  const logProctoringEvent = async (event, details) => {
    const currentId = attemptIdRef.current;
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
      setAssessment(assessmentRes.data?.assessment);

      const questionsRes = await assessmentService.getQuestions(id);
      const sortedQuestions = (questionsRes.data?.questions || []).sort((a, b) => a.order - b.order);
      
      setQuestions(sortedQuestions);

      const attemptRes = await attemptService.startAttempt(id);
      setAttemptId(attemptRes.data?.attempt?._id);

      if (attemptRes.data?.attempt?.expiresAt) {
        const expiresAt = new Date(attemptRes.data.attempt.expiresAt).getTime();
        const now = Date.now();
        setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      }

      const initialResponses = {};
      sortedQuestions.forEach((q, idx) => {
        initialResponses[idx + 1] = {
          questionId: q._id,
          answers: []
        };
      });
      setResponses(initialResponses);

      // Request fullscreen
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
      setAttemptId(attemptData?._id);
      setAssessment(attemptData?.assessment);

      // Extract and sort questions from the populated assessment
      const sortedQuestions = (attemptData?.assessment?.questions || []).sort((a, b) => a.order - b.order);
      setQuestions(sortedQuestions);

      if (attemptData?.expiresAt) {
        const expiresAt = new Date(attemptData.expiresAt).getTime();
        const now = Date.now();
        setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      }

      // Initialize responses
      const initialResponses = {};
      for (let idx = 0; idx < 28; idx++) {
        initialResponses[idx + 1] = {
          questionId: null,
          answers: []
        };
      }
      setResponses(initialResponses);

      requestFullscreen();
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
      setLoading(false);
    }
  };

  /**
   * Professional DISC Forced-Choice Format:
   * User selects MOST like me and LEAST like me only
   * - MOST selection: +1 to that dimension
   * - LEAST selection: -1 to that dimension
   */
  const handleSelection = (questionOrder, statementIndex, selectionType) => {
    setResponses(prev => {
      const question = questions[questionOrder - 1];
      const statements = question.statements?.length > 0 ? question.statements : (question.options || []);
      const trait = statements[statementIndex]?.trait;
      
      const currentResponse = prev[questionOrder] || { questionId: question._id, most: null, least: null };
      
      // If same statement already has this selection, deselect it
      if (selectionType === 'most' && currentResponse.most?.statementIndex === statementIndex) {
        return {
          ...prev,
          [questionOrder]: {
            ...currentResponse,
            most: null
          }
        };
      }
      if (selectionType === 'least' && currentResponse.least?.statementIndex === statementIndex) {
        return {
          ...prev,
          [questionOrder]: {
            ...currentResponse,
            least: null
          }
        };
      }
      
      // Cannot select same statement for both MOST and LEAST
      if (selectionType === 'most' && currentResponse.least?.statementIndex === statementIndex) {
        return prev;
      }
      if (selectionType === 'least' && currentResponse.most?.statementIndex === statementIndex) {
        return prev;
      }
      
      return {
        ...prev,
        [questionOrder]: {
          ...currentResponse,
          [selectionType]: {
            statementIndex,
            trait,
            score: selectionType === 'most' ? 1 : -1
          }
        }
      };
    });
  };

  const getSelection = (questionOrder, statementIndex, selectionType) => {
    const response = responses[questionOrder];
    if (!response) return false;
    return response[selectionType]?.statementIndex === statementIndex;
  };

  const isQuestionAnswered = (questionOrder) => {
    const response = responses[questionOrder];
    return !!(response && response.most && response.least);
  };

  const getStatementSelection = (questionOrder, statementIndex) => {
    const response = responses[questionOrder];
    if (!response) return null;
    if (response.most?.statementIndex === statementIndex) return 'most';
    if (response.least?.statementIndex === statementIndex) return 'least';
    return null;
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
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
    for (let i = 1; i <= totalQuestions; i++) {
      if (!isQuestionAnswered(i)) {
        unanswered.push(i);
      }
    }

    if (unanswered.length > 0) {
      alert(`Please select MOST and LEAST for questions: ${unanswered.join(', ')}`);
      const firstUnanswered = unanswered[0];
      setCurrentPage(Math.floor((firstUnanswered - 1) / QUESTIONS_PER_PAGE));
      return;
    }

    setSubmitting(true);
    try {
      // Format responses for professional DISC scoring (MOST/LEAST format)
      const formattedResponses = Object.entries(responses)
        .filter(([_, r]) => r.most?.trait && r.least?.trait)
        .map(([order, r]) => ({
          questionId: r.questionId,
          answers: [
            { trait: r.most.trait, score: 1, type: 'most' },
            { trait: r.least.trait, score: -1, type: 'least' }
          ]
        }));

      let res;
      if (isPublicAccess) {
        res = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ responses: formattedResponses })
        });
      } else {
        res = await fetch(`/api/assessments/${id}/disc/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ responses: formattedResponses })
        });
      }

      const data = await res.json();

      if (data.success) {
        if (isPublicAccess) {
          document.exitFullscreen?.();
          alert('Assessment submitted successfully! Thank you for completing the assessment.');
          navigate('/');
        } else {
          const prefix = orgSlug ? `/o/${orgSlug}` : '';
          navigate(`${prefix}/reports/disc/${data.data.attempt._id}`);
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
      const response = await attemptService.abandonAttempt(attemptId);
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
    const answered = Object.keys(responses).filter(key => isQuestionAnswered(parseInt(key))).length;
    return Math.round((answered / totalQuestions) * 100);
  };

  const getTraitColor = (trait) => {
    const colors = {
      D: 'bg-red-500',
      I: 'bg-amber-500',
      S: 'bg-emerald-500',
      C: 'bg-blue-500'
    };
    return colors[trait] || 'bg-gray-500';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{assessment?.title}</h1>
              <p className="text-sm text-gray-500">
                Questions {currentPage * QUESTIONS_PER_PAGE + 1} - {Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, totalQuestions)} of {totalQuestions}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {assessment?.timeBound?.enabled && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(timeRemaining)}</span>
                </div>
              )}

              <div className="hidden sm:block text-right">
                <span className="text-sm text-gray-600">{getProgress()}% Complete</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${getProgress()}%` }} />
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions - Professional DISC Forced-Choice Format */}
        {currentPage === 0 && (
          <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-blue-900 mb-1">Instructions</h2>
                <p className="text-blue-700 text-sm">
                  For each question, select the statement that is <strong>MOST like you</strong> and the statement that is <strong>LEAST like you</strong> in a work environment.
                  You must select exactly one MOST and one LEAST for each question. There are no right or wrong answers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Progress */}
        <div className="sm:hidden mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{getProgress()}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${getProgress()}%` }} />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentQuestions.map((question, index) => {
            const questionNumber = currentPage * QUESTIONS_PER_PAGE + index + 1;
            const answered = isQuestionAnswered(questionNumber);

            return (
              <div key={question._id} className={`bg-white rounded-lg p-5 border-2 transition-colors ${answered ? 'border-green-300' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${answered ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {questionNumber}
                  </span>
                  <h3 className="flex-1 text-gray-900 font-medium pt-1">{question.questionText}</h3>
                  {answered && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                </div>

                {/* Statements - Professional DISC Forced-Choice Format */}
                <div className="space-y-2 ml-11">
                  {(question.statements?.length > 0 ? question.statements : question.options)?.map((statement, stmtIndex) => {
                    const selection = getStatementSelection(questionNumber, stmtIndex);
                    const isMostSelected = selection === 'most';
                    const isLeastSelected = selection === 'least';

                    return (
                      <div key={stmtIndex} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isMostSelected ? 'bg-green-50 border border-green-300' : 
                        isLeastSelected ? 'bg-red-50 border border-red-300' : 
                        'bg-gray-50'
                      }`}>
                        <span className={`flex-shrink-0 w-6 h-6 rounded text-xs font-bold text-white flex items-center justify-center ${getTraitColor(statement.trait)}`}>
                          {statement.trait}
                        </span>
                        <p className="flex-1 text-gray-700 text-sm">{statement.text}</p>

                        {/* MOST / LEAST Selection Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSelection(questionNumber, stmtIndex, 'most')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                              isMostSelected
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-white border border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600'
                            }`}
                          >
                            MOST
                          </button>
                          <button
                            onClick={() => handleSelection(questionNumber, stmtIndex, 'least')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                              isLeastSelected
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-white border border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600'
                            }`}
                          >
                            LEAST
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex justify-end gap-4 mt-3 ml-11 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> MOST = Most like me</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> LEAST = Least like me</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
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
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
          </div>

          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === currentPage ? 'bg-indigo-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          {currentPage < totalPages - 1 ? (
            <button onClick={handleNext} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>

        {/* Warning */}
        {currentPage === totalPages - 1 && getProgress() < 100 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Complete all {totalQuestions - Math.round(getProgress() / 100 * totalQuestions)} remaining questions before submitting
            </p>
          </div>
        )}
      </main>

      {/* Quit Confirmation Modal */}
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

export default DiscTest;
