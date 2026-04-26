import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

// MBTI dimension configuration
const MBTI_DIMENSIONS = [
  { key: 'EI', name: 'Extraversion vs Introversion', left: 'Extraversion', right: 'Introversion', description: 'How you direct energy: outward to people and activities, or inward to ideas and reflection' },
  { key: 'SN', name: 'Sensing vs Intuition', left: 'Sensing', right: 'Intuition', description: 'How you take in information: through concrete facts and practical experience, or through patterns and possibilities' },
  { key: 'TF', name: 'Thinking vs Feeling', left: 'Thinking', right: 'Feeling', description: 'How you make decisions: through logical analysis and objective criteria, or through personal values and interpersonal considerations' },
  { key: 'JP', name: 'Judging vs Perceiving', left: 'Judging', right: 'Perceiving', description: 'How you approach structure and flexibility: preferring planned/organized approaches, or preferring spontaneous/adaptable approaches' }
];

// Sample bipolar question templates for each dimension (8 per dimension = 32 total)
// Left trait positive (e.g., Extraversion), Right trait positive (e.g., Introversion)
const QUESTION_TEMPLATES = {
  EI: [
    { left: 'I enjoy being the center of attention', right: 'I prefer to stay in the background' },
    { left: 'I talk more than I listen', right: 'I listen more than I talk' },
    { left: 'I feel energized by social interactions', right: 'I feel drained by social interactions' },
    { left: 'I prefer working in groups', right: 'I prefer working alone' },
    { left: 'I am outgoing and sociable', right: 'I am reserved and private' },
    { left: 'I express myself easily', right: 'I keep my thoughts to myself' },
    { left: 'I enjoy meeting new people', right: 'I prefer familiar people' },
    { left: 'I am comfortable in large groups', right: 'I am comfortable in small groups' }
  ],
  SN: [
    { left: 'I focus on concrete facts', right: 'I focus on possibilities' },
    { left: 'I trust experience', right: 'I trust instincts' },
    { left: 'I am practical and realistic', right: 'I am imaginative and theoretical' },
    { left: 'I notice details', right: 'I see the big picture' },
    { left: 'I learn by doing', right: 'I learn by thinking' },
    { left: 'I remember what I see', right: 'I remember what I imagine' },
    { left: 'I prefer concrete information', right: 'I prefer abstract concepts' },
    { left: 'I am conventional', right: 'I am innovative' }
  ],
  TF: [
    { left: 'I make decisions with my head', right: 'I make decisions with my heart' },
    { left: 'I value truth', right: 'I value harmony' },
    { left: 'I am analytical', right: 'I am emotional' },
    { left: 'I am objective', right: 'I am subjective' },
    { left: 'I prefer fairness', right: 'I prefer compassion' },
    { left: 'I use logic', right: 'I use values' },
    { left: 'I am tough-minded', right: 'I am sensitive' },
    { left: 'I question others emotions', right: 'I understand others emotions' }
  ],
  JP: [
    { left: 'I like planned activities', right: 'I like flexible activities' },
    { left: 'I prefer structure', right: 'I prefer spontaneity' },
    { left: 'I am organized', right: 'I am flexible' },
    { left: 'I follow schedules', right: 'I go with the flow' },
    { left: 'I am punctual', right: 'I am relaxed about time' },
    { left: 'I make lists', right: 'I go with the moment' },
    { left: 'I expect closure', right: 'I keep options open' },
    { left: 'I follow rules', right: 'I make my own rules' }
  ]
};

const AddMbtiQuestions = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);

  // Initialize form state with all 32 questions (8 per dimension × 4 dimensions)
  const [questions, setQuestions] = useState(() => {
    const initial = {};
    MBTI_DIMENSIONS.forEach(dim => {
      initial[dim.key] = Array(8).fill(null).map((_, idx) => ({
        leftText: QUESTION_TEMPLATES[dim.key][idx]?.left || '',
        rightText: QUESTION_TEMPLATES[dim.key][idx]?.right || '',
        leftRating: null,
        rightRating: null
      }));
    });
    return initial;
  });

  // Track expanded/collapsed dimension sections
  const [expandedDimensions, setExpandedDimensions] = useState(
    MBTI_DIMENSIONS.reduce((acc, d) => ({ ...acc, [d.key]: true }), {})
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
    MBTI_DIMENSIONS.forEach(dim => {
      newQuestions[dim.key] = Array(8).fill(null).map((_, idx) => ({
        leftText: QUESTION_TEMPLATES[dim.key][idx]?.left || '',
        rightText: QUESTION_TEMPLATES[dim.key][idx]?.right || '',
        leftRating: null,
        rightRating: null
      }));
    });

    // Map existing questions to form
    existing.forEach(q => {
      const dim = q.dimension || q.trait;
      if (dim && newQuestions[dim]) {
        const order = q.order || 1;
        const idx = order - 1;
        if (idx >= 0 && idx < 8) {
          newQuestions[dim][idx] = {
            leftText: q.leftText || q.questionText?.split('|')[0]?.trim() || QUESTION_TEMPLATES[dim]?.[idx]?.left || '',
            rightText: q.rightText || q.questionText?.split('|')[1]?.trim() || QUESTION_TEMPLATES[dim]?.[idx]?.right || '',
            leftRating: q.leftRating || null,
            rightRating: q.rightRating || null
          };
        }
      }
    });

    setQuestions(newQuestions);
  };

  // Update a specific question
  const updateQuestion = (dimKey, questionIndex, field, value) => {
    setQuestions(prev => ({
      ...prev,
      [dimKey]: prev[dimKey].map((q, idx) =>
        idx === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  // Validate form - all questions must have text for both sides (bipolar)
  const validateForm = () => {
    const missing = [];
    
    MBTI_DIMENSIONS.forEach(dim => {
      questions[dim.key].forEach((q, idx) => {
        if (!q.leftText?.trim()) {
          missing.push(`${dim.key} Q${idx + 1}: Missing left trait text`);
        }
        if (!q.rightText?.trim()) {
          missing.push(`${dim.key} Q${idx + 1}: Missing right trait text`);
        }
      });
    });

    return missing;
  };

  // Get completion status
  const getCompletionStatus = () => {
    let total = 0;
    let completed = 0;
    
    MBTI_DIMENSIONS.forEach(dim => {
      questions[dim.key].forEach(q => {
        total += 2; // Each question has left and right traits
        if (q.leftText?.trim()) {
          completed++;
        }
        if (q.rightText?.trim()) {
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
      // Build questions array - bipolar questions stored as combined text with |
      const questionsToCreate = [];
      let orderCounter = 1;

      MBTI_DIMENSIONS.forEach(dim => {
        questions[dim.key].forEach((q, idx) => {
          // Combine left and right trait text with | separator for bipolar question
          const combinedText = `${q.leftText.trim()} | ${q.rightText.trim()}`;
          
          questionsToCreate.push({
            type: 'mcq',
            questionText: combinedText,
            dimension: dim.key,
            trait: dim.key,
            leftText: q.leftText.trim(),
            rightText: q.rightText.trim(),
            leftTrait: dim.left,
            rightTrait: dim.right,
            order: orderCounter++,
            marks: 1,
            difficulty: 'moderate',
            options: [
              { text: dim.left, score: 1, trait: dim.left },
              { text: dim.left, score: 2, trait: dim.left },
              { text: dim.left, score: 3, trait: dim.left },
              { text: 'Neutral', score: 4, trait: 'neutral' },
              { text: dim.right, score: 5, trait: dim.right },
              { text: dim.right, score: 6, trait: dim.right },
              { text: dim.right, score: 7, trait: dim.right }
            ],
            isRequired: true,
            explanation: `This question measures ${dim.name} dimension - Choose between ${dim.left} and ${dim.right}`,
            tags: ['mbti', dim.key.toLowerCase(), 'psychometric', 'personality', 'bipolar']
          });
        });
      });

      // Use bulk create
      await assessmentService.bulkCreateQuestions(id, questionsToCreate);
      
      setSuccess(`Successfully added ${questionsToCreate.length} MBTI questions!`);
      
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

  // Toggle dimension section
  const toggleDimension = (dimKey) => {
    setExpandedDimensions(prev => ({ ...prev, [dimKey]: !prev[dimKey] }));
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
              Add MBTI Questions
            </h1>
            <p className="text-gray-500">
              {hasExisting ? 'Update existing questions' : 'Add 32 bipolar questions for MBTI assessment'}
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
            {status.completed}/{status.total} trait texts completed
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(status.completed / status.total) * 100}%` }}
          />
        </div>
      </div>

      {/* MBTI Dimensions */}
      <div className="space-y-4">
        {MBTI_DIMENSIONS.map((dim, dimIdx) => (
          <div key={dim.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Dimension Header */}
            <button
              onClick={() => toggleDimension(dim.key)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  dimIdx === 0 ? 'bg-indigo-500' : 
                  dimIdx === 1 ? 'bg-blue-500' : 
                  dimIdx === 2 ? 'bg-purple-500' : 'bg-teal-500'
                }`}>
                  {dim.key}
                </span>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {dim.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {dim.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {questions[dim.key].filter(q => q.leftText?.trim() && q.rightText?.trim()).length}/8 completed
                </span>
                {expandedDimensions[dim.key] ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Dimension Questions */}
            {expandedDimensions[dim.key] && (
              <div className="p-4 space-y-4">
                {questions[dim.key].map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                        {qIdx + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        Question {qIdx + 1} of {dim.key} dimension
                      </span>
                    </div>
                    
                    {/* Bipolar Question Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Trait */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            dimIdx === 0 ? 'bg-indigo-100 text-indigo-700' : 
                            dimIdx === 1 ? 'bg-blue-100 text-blue-700' : 
                            dimIdx === 2 ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                          }`}>
                            {dim.left}
                          </span>
                        </label>
                        <textarea
                          value={q.leftText}
                          onChange={(e) => updateQuestion(dim.key, qIdx, 'leftText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                          placeholder={`Enter ${dim.left.toLowerCase()} trait (left side)...`}
                        />
                      </div>
                      
                      {/* Right Trait */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            {dim.right}
                          </span>
                        </label>
                        <textarea
                          value={q.rightText}
                          onChange={(e) => updateQuestion(dim.key, qIdx, 'rightText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                          placeholder={`Enter ${dim.right.toLowerCase()} trait (right side)...`}
                        />
                      </div>
                    </div>
                    
                    {/* Preview of combined question */}
                    {(q.leftText?.trim() || q.rightText?.trim()) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <p className="text-sm text-gray-700">
                          "{q.leftText || '...'}" → "{q.rightText || '...'}"
                        </p>
                      </div>
                    )}
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

export default AddMbtiQuestions;