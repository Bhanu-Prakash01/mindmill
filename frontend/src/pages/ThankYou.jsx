import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Building2, ArrowRight, Sparkles, PartyPopper, Clock, Target } from 'lucide-react';

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgName = searchParams.get('org') || 'Organization';
  const orgSlug = searchParams.get('slug') || '';
  const assessmentName = searchParams.get('assessment') || '';
  const assessmentType = searchParams.get('type') || '';
  
  const attemptedPercent = searchParams.get('attempted') || '';
  const answeredCount = searchParams.get('answered') || '';
  const totalQuestions = searchParams.get('total') || '';
  const timeTaken = searchParams.get('timeTaken') || '';
  const totalTime = searchParams.get('totalTime') || '';

  const [show, setShow] = useState(false);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setShow(true), 100);

    // Generate confetti particles
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
    const particles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360
    }));
    setConfetti(particles);
  }, []);

  const getTypeLabel = (type) => {
    const labels = {
      big5: 'Big Five Personality',
      disc: 'DISC Assessment',
      psychometric: 'Psychometric',
      standard: 'Assessment'
    };
    return labels[type] || 'Assessment';
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showStats = attemptedPercent && totalQuestions && answeredCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 animate-bounce"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              animationIterationCount: 1,
              animationFillMode: 'forwards'
            }}
          >
            <div
              className="rounded-sm opacity-70"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`
              }}
            />
          </div>
        ))}
      </div>

      {/* Background decoration */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 right-40 w-48 h-48 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Main card */}
      <div
        className={`relative z-10 max-w-lg w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/50 p-8 sm:p-12 text-center transition-all duration-700 ${
          show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Success icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <Sparkles className="w-4 h-4 text-amber-900" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Thank You!
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 mb-1">
          Your responses have been submitted successfully.
        </p>

        {/* Assessment info */}
        {(assessmentName || assessmentType) && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mt-4 mb-6">
            {assessmentType === 'big5' && <span className="text-sm">🧠</span>}
            {assessmentType === 'disc' && <span className="text-sm">📊</span>}
            {!assessmentType && <span className="text-sm">✅</span>}
            <span className="text-sm font-medium text-indigo-700">
              {assessmentName || getTypeLabel(assessmentType)}
            </span>
          </div>
        )}

        {showStats && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Questions Attempted</p>
                  <p className="text-lg font-bold text-gray-900">
                    {answeredCount}/{totalQuestions} ({attemptedPercent}%)
                  </p>
                </div>
              </div>
              {timeTaken && totalTime && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Time Used</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatTime(timeTaken)} / {formatTime(totalTime)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-8">
          <div className="flex items-start gap-3 text-left">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <PartyPopper className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">What happens next?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your responses have been carefully recorded. Our team at <strong>{orgName}</strong> will review your results and share a detailed report with you. This typically takes 1-2 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {orgSlug && (
            <button
              onClick={() => navigate(`/org/${orgSlug}`)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 font-semibold text-sm"
            >
              <Building2 className="w-4 h-4" />
              Visit {orgName}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm"
          >
            Go to Home
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 mt-6">
          You may close this window safely.
        </p>
      </div>
    </div>
  );
};

export default ThankYou;
