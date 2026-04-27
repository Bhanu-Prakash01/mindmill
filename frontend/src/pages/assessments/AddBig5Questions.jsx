import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Big Five trait configuration
const BIG5_TRAITS = [
  { key: 'O', name: 'Openness', short: 'O', description: 'Openness to experience' },
  { key: 'C', name: 'Conscientiousness', short: 'C', description: 'Conscientiousness and self-discipline' },
  { key: 'E', name: 'Extraversion', short: 'E', description: 'Extraversion and social energy' },
  { key: 'A', name: 'Agreeableness', short: 'A', description: 'Agreeableness and cooperation' },
  { key: 'N', name: 'Neuroticism', short: 'N', description: 'Neuroticism and emotional stability' }
];

// Facet definitions (6 per trait)
const BIG5_FACETS = {
  O: [
    { num: 1, name: 'Fantasy', desc: 'Imaginative, fantasy-oriented' },
    { num: 2, name: 'Aesthetics', desc: 'Aesthetic appreciation, artistic' },
    { num: 3, name: 'Feelings', desc: 'Emotional awareness, openness' },
    { num: 4, name: 'Actions', desc: 'Action-oriented, adventure' },
    { num: 5, name: 'Ideas', desc: 'Intellectual curiosity' },
    { num: 6, name: 'Values', desc: 'Value diversity, tolerant' }
  ],
  C: [
    { num: 1, name: 'Competence', desc: 'Self-efficacy, capable' },
    { num: 2, name: 'Order', desc: 'Organized, methodical' },
    { num: 3, name: 'Dutiful', desc: 'Responsibility, reliable' },
    { num: 4, name: 'Achievement', desc: 'Achievement striving' },
    { num: 5, name: 'Self-Discipline', desc: 'Self-motivation, diligent' },
    { num: 6, name: 'Deliberation', desc: 'Cautious, thoughtful' }
  ],
  E: [
    { num: 1, name: 'Warmth', desc: 'Interpersonal intimacy' },
    { num: 2, name: 'Gregarious', desc: 'Social, outgoing' },
    { num: 3, name: 'Assertiveness', desc: 'Dominant, forceful' },
    { num: 4, name: 'Activity', desc: 'Energetic, active' },
    { num: 5, name: 'Excitement', desc: 'Excitement-seeking' },
    { num: 6, name: 'Positive Emotions', desc: 'Joy, enthusiasm' }
  ],
  A: [
    { num: 1, name: 'Trust', desc: 'Believing in others' },
    { num: 2, name: 'Straightforward', desc: 'Frank, genuine' },
    { num: 3, name: 'Altruism', desc: 'Caring, generous' },
    { num: 4, name: 'Compliance', desc: 'Cooperative, obedient' },
    { num: 5, name: 'Modesty', desc: 'Humble, modest' },
    { num: 6, name: 'Tender-Mindedness', desc: 'Soft-hearted, sympathetic' }
  ],
  N: [
    { num: 1, name: 'Anxiety', desc: 'Tense, worried' },
    { num: 2, name: 'Angry Hostility', desc: 'Angry, easily annoyed' },
    { num: 3, name: 'Depression', desc: 'Mood, blue' },
    { num: 4, name: 'Self-Consciousness', desc: 'Awkward, shy' },
    { num: 5, name: 'Impulsiveness', desc: 'Lacking control' },
    { num: 6, name: 'Vulnerability', desc: 'Stress-sensitive' }
  ]
};

// Sample question templates for each trait (10 per trait = 50 total)
const QUESTION_TEMPLATES = {
  O: [
    'I enjoy exploring new ideas and innovative concepts',
    'I appreciate art and beauty in my surroundings',
    'I am in touch with my emotions and inner feelings',
    'I am always eager to try new activities and experiences',
    'I enjoy intellectual discussions and philosophical debates',
    'I value diverse perspectives and unconventional views',
    'I have a vivid imagination and rich inner world',
    'I am interested in creative arts and creative expression',
    'I enjoy reading thought-provoking literature',
    'I am open to changing my views when presented with new evidence'
  ],
  C: [
    'I always complete my tasks thoroughly and carefully',
    'I keep my belongings organized and in proper order',
    'I follow through on my commitments to others',
    'I set ambitious goals and work hard to achieve them',
    'I am self-disciplined and able to stay focused',
    'I think carefully before making important decisions',
    'I am reliable and can be counted on to do my work',
    'I prefer structure and clear routines in my life',
    'I pay attention to details and strive for excellence',
    'I take responsibility for my actions and obligations'
  ],
  E: [
    'I enjoy being around people and social gatherings',
    'I am comfortable initiating conversations with strangers',
    'I express my opinions confidently in group settings',
    'I have high energy and enjoy staying active',
    'I seek out excitement and thrill-seeking experiences',
    'I often feel enthusiastic and optimistic',
    'I like to be the center of attention in social situations',
    'I enjoy meeting new people and making new friends',
    'I am talkative and expressive in social settings',
    'I gain energy from interacting with others'
  ],
  A: [
    'I generally trust other people and give them the benefit of doubt',
    'I am straightforward and honest in my dealings with others',
    'I am genuinely concerned about the welfare of others',
    'I cooperate with others and prefer to work together',
    'I am modest about my achievements and abilities',
    'I am sympathetic and compassionate towards others',
    'I believe in fairness and treating others equally',
    'I am willing to help others when they need assistance',
    'I try to avoid conflict and maintain harmony',
    'I put the needs of others before my own'
  ],
  N: [
    'I often feel anxious about potential problems',
    'I can become easily frustrated and irritated',
    'I sometimes feel down or depressed about life',
    'I am often self-conscious in social situations',
    'I often act impulsively without thinking things through',
    'I feel vulnerable and sensitive to stress',
    'I worry excessively about things that could go wrong',
    'I get emotional easily and feel things deeply',
    'I experience mood swings and emotional highs and lows',
    'I am sensitive to criticism and take things personally'
  ]
};

const AddBig5Questions = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);

  // Initialize form state with all 50 questions (10 per trait × 5 traits)
  const [questions, setQuestions] = useState(() => {
    const initial = {};
    BIG5_TRAITS.forEach(trait => {
      initial[trait.key] = Array(10).fill(null).map((_, idx) => ({
        questionText: QUESTION_TEMPLATES[trait.key][idx] || '',
        trait: trait.key,
        facet: (idx % 6) + 1,
        direction: 'positive',
        order: idx + 1
      }));
    });
    return initial;
  });

  // Track expanded/collapsed trait sections
  const [expandedTraits, setExpandedTraits] = useState(
    BIG5_TRAITS.reduce((acc, t) => ({ ...acc, [t.key]: true }), {})
  );

  useEffect(() => {
    fetchExistingQuestions();
  }, [id]);

  const fetchExistingQuestions = async () => {
    try {
      const response = await assessmentService.getQuestions(id);
      const existing = response.data?.questions || [];
      setExistingQuestions(existing);

      if (existing.length > 0) {
        populateFromExisting(existing);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Populate form from existing questions
  const populateFromExisting = (existing) => {
    const newQuestions = {};

    BIG5_TRAITS.forEach(trait => {
      newQuestions[trait.key] = Array(10).fill(null).map((_, idx) => ({
        questionText: QUESTION_TEMPLATES[trait.key][idx] || '',
        trait: trait.key,
        facet: (idx % 6) + 1,
        direction: 'positive',
        order: idx + 1
      }));
    });

    existing.forEach(q => {
      const trait = q.trait || q.dimension;
      if (trait && newQuestions[trait]) {
        const order = q.order || 1;
        const idx = order - 1;
        if (idx >= 0 && idx < 10) {
          newQuestions[trait][idx] = {
            questionText: q.questionText || q.text || QUESTION_TEMPLATES[trait]?.[idx] || '',
            trait: q.trait || trait,
            facet: q.facet || ((idx % 6) + 1),
            direction: q.direction || 'positive',
            order: order
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

  // Validate form - all questions must have text
  const validateForm = () => {
    const missing = [];

    BIG5_TRAITS.forEach(trait => {
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

    BIG5_TRAITS.forEach(trait => {
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
      const questionsToCreate = [];
      let orderCounter = 1;

      BIG5_TRAITS.forEach(trait => {
        questions[trait.key].forEach((q, idx) => {
          questionsToCreate.push({
            type: 'rating',
            questionText: q.questionText,
            trait: trait.key,
            dimension: trait.key,
            facet: q.facet,
            direction: q.direction,
            order: orderCounter++,
            rating: Math.ceil(q.facet / 2),
            marks: 1,
            difficulty: 'moderate',
            isRequired: true,
            explanation: `This question measures ${trait.name} - Facet ${q.facet}`,
            tags: ['big5', trait.key.toLowerCase(), 'psychometric', 'personality']
          });
        });
      });

      await assessmentService.bulkCreateQuestions(id, questionsToCreate, true);

      setSuccess(`Successfully added ${questionsToCreate.length} Big Five questions!`);

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

  // Trait colors
  const traitColors = {
    O: 'bg-purple-500',
    C: 'bg-blue-500',
    E: 'bg-green-500',
    A: 'bg-yellow-500',
    N: 'bg-red-500'
  };

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
              Add Big Five Questions
            </h1>
            <p className="text-gray-500">
              {hasExisting ? 'Update existing questions' : 'Add 50 questions for Big Five assessment'}
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
            {status.completed}/{status.total} questions completed
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(status.completed / status.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Big Five Traits */}
      <div className="space-y-4">
        {BIG5_TRAITS.map((trait, traitIdx) => (
          <div key={trait.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Trait Header */}
            <button
              onClick={() => toggleTrait(trait.key)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${traitColors[trait.key]}`}>
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
                  {questions[trait.key].filter(q => q.questionText?.trim()).length}/10 completed
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

                    {/* Question Options */}
                    <div className="ml-9 flex flex-wrap gap-4">
                      {/* Facet Selector */}
                      <div className="flex flex-col">
                        <label className="block text-xs text-gray-600 mb-1">Facet (1-6)</label>
                        <select
                          value={q.facet}
                          onChange={(e) => updateQuestion(trait.key, qIdx, 'facet', parseInt(e.target.value))}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
                        >
                          {BIG5_FACETS[trait.key].map(f => (
                            <option key={f.num} value={f.num}>{f.num}: {f.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Direction Selector */}
                      <div className="flex flex-col">
                        <label className="block text-xs text-gray-600 mb-1">Keying</label>
                        <select
                          value={q.direction}
                          onChange={(e) => updateQuestion(trait.key, qIdx, 'direction', e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
                        >
                          <option value="positive">Positive (+)</option>
                          <option value="negative">Negative (-)</option>
                        </select>
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

export default AddBig5Questions;