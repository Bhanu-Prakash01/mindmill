import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  Sparkles,
  Search,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Category hero images and metadata (matches Assessments.jsx CATEGORY_META)
const CATEGORY_META = {
  big5:        { image: '/assessment_big5.png',         inspiredBy: 'Big 5 Assessment' },
  disc:        { image: '/assessment_disc.png',         inspiredBy: 'DISC Assessment' },
  firo:        { image: '/assessment_firo.png',         inspiredBy: 'PIRO Assessment' },
  'firo-b':    { image: '/assessment_firo.png',         inspiredBy: 'PIRO Assessment' },
  cognitive:   { image: '/assessment_cognitive.png',    inspiredBy: 'Cognitive Ability Test' },
  psychometric:{ image: '/assessment_psychometric.png', inspiredBy: 'Psychometric Assessment' },
  personality: { image: '/assessment_big5.png',         inspiredBy: 'Personality Assessment' },
  situational: { image: '/assessment_situational.png',  inspiredBy: 'Situational Judgment Test' },
  aptitude:    { image: '/assessment_situational.png',  inspiredBy: 'Aptitude Assessment' },
  professional:{ image: '/assessment_professional.png', inspiredBy: 'Professional Skills Assessment' },
  MBTI:        { image: '/assessment_mbti.png',         inspiredBy: 'MBTI Assessment' },
  DISC:        { image: '/assessment_disc.png',         inspiredBy: 'DISC Assessment' },
  Hogan:       { image: '/assessment_hogan.png',        inspiredBy: 'TraitMap Index' },
  Big5:        { image: '/assessment_big5.png',         inspiredBy: 'Big Five Assessment' },
};

const getDifficultyBadge = (difficulty) => {
  const styles = {
    basic:    'bg-green-100 text-green-700',
    moderate: 'bg-yellow-100 text-yellow-800',
    tough:    'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[difficulty] || styles.basic}`}>
      {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1) || 'Basic'}
    </span>
  );
};

const IndividualAssessments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());

  const freeTrialUsed = user?.freeTrialUsed;
  const credits = user?.personalCredits;
  const remainingCredits = (credits?.total || 0) - (credits?.used || 0);

  useEffect(() => {
    api.get('/auth/free-trial/assessments')
      .then(r => {
        const list = r.data.data?.assessments || [];
        // Filter out muted assessments on the client side
        setAssessments(list.filter(a => !a.isMuted));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getMeta = (assessment) => {
    const sub = assessment.subCategory?.toUpperCase() || '';
    const cat = assessment.category || '';
    return CATEGORY_META[sub] || CATEGORY_META[cat] || {};
  };

  const handleStart = (assessment) => {
    navigate(`/assessments/${assessment._id}/terms`);
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
        <p className="text-gray-500 mt-1">
          {freeTrialUsed
            ? `Browse all available assessments.${remainingCredits > 0 ? ` You have ${remainingCredits} credit${remainingCredits > 1 ? 's' : ''} — start any assessment to use one.` : ' Purchase credits to unlock any assessment.'}`
            : 'Pick any assessment to try for free with your free trial.'}
        </p>
      </div>

      {/* Free Trial Banner */}
      {!freeTrialUsed && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl">
          <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-800">Free Trial Active</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Select any assessment below to start your free trial. You get <strong>1 free assessment</strong> to explore the platform.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
        >
          <option value="all">All Categories</option>
          <option value="psychometric">Psychometric</option>
          <option value="personality">Personality</option>
          <option value="cognitive">Cognitive</option>
          <option value="aptitude">Aptitude</option>
          <option value="situational">Situational</option>
          <option value="professional">Professional</option>
          <option value="big5">Big Five Personality</option>
          <option value="disc">DISC Personality</option>
          <option value="firo">PIRO Assessment</option>
        </select>
      </div>

      {/* Assessment Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredAssessments.map((assessment) => {
          const meta = getMeta(assessment);
          const heroImage = meta.image || null;

          return (
            <div
              key={assessment._id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
            >
              {/* Hero Image */}
              <div className="relative w-full h-36 overflow-hidden bg-gray-100">
                {assessment.bannerImage ? (
                  <img
                    src={assessment.bannerImage.startsWith('http') ? assessment.bannerImage : `/${assessment.bannerImage}`}
                    alt={assessment.title}
                    className="w-full h-full object-cover"
                  />
                ) : heroImage ? (
                  <img
                    src={heroImage}
                    alt={meta.inspiredBy || assessment.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <FileText className="w-12 h-12 text-indigo-300" />
                  </div>
                )}
                {/* Category Badge (top-left) */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-xs font-semibold shadow-sm capitalize">
                    {assessment.category}
                  </span>
                </div>
                {/* Free Trial Badge (top-right) */}
                {!freeTrialUsed && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 rounded-full text-xs font-semibold shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Free
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">
                  {assessment.title}
                </h3>

                {/* Description with See More/Less */}
                <div className="mb-3 flex-1 flex flex-col">
                  <div className="cursor-pointer group">
                    <p className={`text-xs text-gray-600 text-justify leading-relaxed flex-1 transition-all duration-300 ${expandedDescriptions.has(assessment._id) ? '' : 'line-clamp-2'}`}>
                      {assessment.description || 'No description provided.'}
                    </p>
                    {assessment.description && assessment.description.length > 100 && (
                      <button
                        type="button"
                        onClick={() => toggleDescription(assessment._id)}
                        className="text-xs font-semibold text-indigo-600 mt-1 hover:underline"
                      >
                        {expandedDescriptions.has(assessment._id) ? 'See less' : 'See more'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Purpose & Audience */}
                <div className="space-y-1 mb-3">
                  {assessment.purpose && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      <span className="font-semibold text-gray-700">Purpose:</span> {assessment.purpose}
                    </p>
                  )}
                  {assessment.audience && (
                    <p className="text-xs text-gray-500 leading-relaxed truncate">
                      <span className="font-semibold text-gray-700">Audience:</span> {assessment.audience}
                    </p>
                  )}
                </div>

                {/* Meta Row: Difficulty, Time, Questions */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1 font-medium text-gray-600">
                    Level
                  </span>
                  {getDifficultyBadge(assessment.difficulty)}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {assessment.timeBound?.enabled ? `${assessment.timeBound.durationMinutes} min` : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {assessment.totalQuestions || 0} questions
                  </span>
                </div>

                {/* CTA Button */}
                <div className="pt-3 border-t border-gray-100 mt-auto">
                  {!freeTrialUsed ? (
                    <button
                      onClick={() => handleStart(assessment)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Start Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : remainingCredits > 0 ? (
                    <button
                      onClick={() => handleStart(assessment)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Start Assessment
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/individual/credits')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      Buy Credits to Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssessments.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery || filterCategory !== 'all'
              ? 'No assessments match your search criteria.'
              : 'No assessments available yet.'}
          </p>
          {!freeTrialUsed && (
            <p className="text-sm text-gray-400 mt-1">
              Check back later — new assessments are added regularly.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default IndividualAssessments;
