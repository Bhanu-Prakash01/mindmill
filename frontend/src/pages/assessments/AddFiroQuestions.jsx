import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

// FIRO-B trait configuration
const FIRO_TRAITS = [
  { key: 'eI', name: 'Expressed Inclusion', short: 'eI', description: 'How much inclusion you desire from others' },
  { key: 'wI', name: 'Wanted Inclusion', short: 'wI', description: 'How much inclusion you want to give others' },
  { key: 'eC', name: 'Expressed Control', short: 'eC', description: 'How much control you want over others' },
  { key: 'wC', name: 'Wanted Control', short: 'wC', description: 'How much control you want to give others' },
  { key: 'eA', name: 'Expressed Affection', short: 'eA', description: 'How much affection you show to others' },
  { key: 'wA', name: 'Wanted Affection', short: 'wA', description: 'How much affection you want from others' }
];

// 6-point Likert scale
const LIKERT_SCALE = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Occasionally' },
  { value: 4, label: 'Sometimes' },
  { value: 5, label: 'Often' },
  { value: 6, label: 'Usually' }
];

// Sample question templates for each trait (9 per trait = 54 total)
const QUESTION_TEMPLATES = {
  eI: [
    'I enjoy being part of group activities',
    'I like to include others in my plans',
    'I seek out opportunities to meet new people',
    'I prefer working in teams rather than alone',
    'I enjoy social gatherings and events',
    'I like having many acquaintances',
    'I participate actively in group discussions',
    'I enjoy collaborative projects',
    'I seek belonging in social groups'
  ],
  wI: [
    'I want others to include me in their activities',
    'I desire acceptance from my peers',
    'I want to be invited to social events',
    'I want people to think of me when planning',
    'I want others to include me in their plans',
    'I want to feel part of a group',
    'I want regular social interactions',
    'I want to be welcomed by others',
    'I want others to seek my company'
  ],
  eC: [
    'I like to take charge of situations',
    'I enjoy being in leadership roles',
    'I prefer making decisions for the group',
    'I like to direct others\' activities',
    'I enjoy having authority over projects',
    'I take control when something needs doing',
    'I like to organize and coordinate',
    'I prefer being the one in charge',
    'I take charge when others are uncertain'
  ],
  wC: [
    'I want others to follow my lead',
    'I desire authority in my role',
    'I want to be responsible for outcomes',
    'I want control over decisions',
    'I want to direct how things are done',
    'I want to have seniority at work',
    'I want to be the decision maker',
    'I want to manage others',
    'I want influence over outcomes'
  ],
  eA: [
    'I openly show my feelings to others',
    'I like to express affection openly',
    'I am comfortable with physical affection',
    'I enjoy hugging people I like',
    'I like to tell people I care about them',
    'I express emotions freely',
    'I am warm and affectionate by nature',
    'I enjoy close personal relationships',
    'I like showing people I appreciate them'
  ],
  wA: [
    'I want others to show they care about me',
    'I desire verbal affirmations of care',
    'I want to feel loved by others',
    'I want close personal relationships',
    'I want people to express their feelings',
    'I want physical affection from others',
    'I want to hear that I am appreciated',
    'I want emotional closeness',
    'I want others to share their feelings'
  ]
};

const AddFiroQuestions = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);

  // Initialize form state with all 54 questions (9 per trait × 6 traits)
  const [questions, setQuestions] = useState(() => {
    const initial = {};
    FIRO_TRAITS.forEach(trait => {
      initial[trait.key] = Array(9).fill(null).map((_, idx) => ({
        questionText: QUESTION_TEMPLATES[trait.key][idx] || '',
        rating: null
      }));
    });
    return initial;
  });

  // Track expanded/collapsed trait sections
  const [expandedTraits, setExpandedTraits] = useState(
    FIRO_TRAITS.reduce((acc, t) => ({ ...acc, [t.key]: true }), {})
  );

  useEffect(() => {
    fetchExistingQuestions();
  }, [id]);

  const fetchExistingQuestions = async () => {
    try {
      const response = await assessmentService.getQuestions(id);
      const existing = response.data?.questions || [];
      setExistingQuestions(existing);

      // If there are existing questions, populate the form
      if (existing.length > 0) {
        populateFromExisting(existing);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      // Continue with empty form on error
    } finally {
      setLoading(false);
    }
  };

  // Populate form from existing questions
  const populateFromExisting = (existing) => {
    const newQuestions = {};

    // Initialize empty
    FIRO_TRAITS.forEach(trait => {
      newQuestions[trait.key] = Array(9).fill(null).map((_, idx) => ({
        questionText: QUESTION_TEMPLATES[trait.key][idx] || '',
        rating: null
      }));
    });

    // Map existing questions to form
    existing.forEach(q => {
      const trait = q.trait || q.dimension;
      if (trait && newQuestions[trait]) {
        const order = q.order || 1;
        const idx = order - 1;
        if (idx >= 0 && idx < 9) {
          newQuestions[trait][idx] = {
            questionText: q.questionText || q.text || QUESTION_TEMPLATES[trait.key]?.[idx] || '',
            rating: q.rating || null
          };
        }
      }
    });

    setQuestions(newQuestions);
  };

  // Update a specific question
  const updateQuestion = (traitKey, questionIndex, field, value) => {
    setQuestions(prev => ({
      ...prev,
      [traitKey]: prev[traitKey].map((q, idx) =>
        idx === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const validateForm = () => {
    const missing = [];
    
    FIRO_TRAITS.forEach(trait => {
      questions[trait.key].forEach((q, idx) => {
        if (!q.questionText?.trim()) {
          missing.push(`${trait.key} Q${idx + 1}: Missing text`);
        }
      });
    });

    return missing;
  };

  // Get completion status
  const getCompletionStatus = () => {
    let total = 0;
    let completed = 0;
    
    FIRO_TRAITS.forEach(trait => {
      questions[trait.key].forEach(q => {
        total++;
        if (q.questionText?.trim()) {
          completed++;
        }
      });
    });

    return { total, completed };
  };

  // Handle save - POST to API
  const handleSave = async () => {
    const missing = validateForm();
    if (missing.length > 0) {
      setError(`Please complete all questions. Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Build questions array
      const questionsToCreate = [];
      let orderCounter = 1;

      FIRO_TRAITS.forEach(trait => {
        questions[trait.key].forEach((q) => {
          questionsToCreate.push({
            type: 'rating',
            questionText: q.questionText,
            trait: trait.key,
            dimension: trait.key,
            order: orderCounter++,
            rating: q.rating,
            marks: 1,
            difficulty: 'moderate',
            options: LIKERT_SCALE.map(opt => ({
              text: opt.label,
              score: opt.value
            })),
            isRequired: true,
            explanation: `This question measures ${trait.name} (${trait.short})`,
            tags: ['firo-b', trait.key.toLowerCase(), 'psychometric', 'personality']
          });
        });
      });

      // Use bulk create
      await assessmentService.bulkCreateQuestions(id, questionsToCreate);
      
      setSuccess(`Successfully added ${questionsToCreate.length} FIRO-B questions!`);
      
      // Navigate back after short delay
      setTimeout(() => {
        const prefix = orgSlug ? `/o/${orgSlug}` : '';
        navigate(`${prefix}/assessments/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving questions:', err);
      setError(err.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    const prefix = orgSlug ? `/o/${orgSlug}` : '';
    navigate(`${prefix}/assessments/${id}`);
  };

  // Toggle trait section
  const toggleTrait = (traitKey) => {
    setExpandedTraits(prev => ({ ...prev, [traitKey]: !prev[traitKey] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const status = getCompletionStatus();
  const hasExisting = existingQuestions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Add FIRO-B Questions
            </h1>
            <p className="text-gray-500">
              {hasExisting ? 'Update existing questions' : 'Add 54 questions for FIRO-B assessment'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Questions'}
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Completion Status
          </span>
          <span className="text-sm text-gray-500">
            {status.completed}/{status.total} questions answered
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(status.completed / status.total) * 100}%` }}
          />
        </div>
      </div>

      {/* FIRO Traits */}
      <div className="space-y-4">
        {FIRO_TRAITS.map((trait, traitIdx) => (
          <div key={trait.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Trait Header */}
            <button
              onClick={() => toggleTrait(trait.key)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  traitIdx < 2 ? 'bg-indigo-500' : 
                  traitIdx < 4 ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {trait.short.toUpperCase()}
                </span>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {trait.name} ({trait.key})
                  </h3>
                  <p className="text-xs text-gray-500">
                    {trait.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {questions[trait.key].filter(q => q.rating !== null).length}/9 answered
                </span>
                {expandedTraits[trait.key] ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Trait Questions */}
            {expandedTraits[trait.key] && (
              <div className="p-4 space-y-4">
                {questions[trait.key].map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                        {qIdx + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => updateQuestion(trait.key, qIdx, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter question text"
                        />
                      </div>
                    </div>
                    
                    {/* Likert Scale Selector */}
                    <div className="ml-9">
                      <label className="block text-xs text-gray-600 mb-2">
                        Select your response:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LIKERT_SCALE.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateQuestion(trait.key, qIdx, 'rating', opt.value)}
                            className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border transition-colors min-w-[60px] ${
                              q.rating === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                            }`}
                          >
                            <span className="text-sm font-semibold">{opt.value}</span>
                            <span className="text-xs mt-0.5">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handleCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Questions'}
        </button>
      </div>
    </div>
  );
};

export default AddFiroQuestions;