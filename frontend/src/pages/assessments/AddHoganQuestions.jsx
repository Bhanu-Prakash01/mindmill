import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const HOGAN_SCALES = [
  { key: 'HVP', name: 'Hogan Validation Profile', short: 'HVP', description: 'Measures straightforwardness, cooperation, and customer orientation' },
  { key: 'HDS', name: 'Hogan Development Survey', short: 'HDS', description: 'Measures derailment risks and career impediments' },
  { key: 'MVPI', name: 'Motives, Values, Preferences Inventory', short: 'MVPI', description: 'Measures values, interests, and driving forces' },
  { key: 'SCI', name: 'Strategic Competencies Inventory', short: 'SCI', description: 'Measures strategic thinking and problem-solving' },
  { key: 'CPI', name: 'Clerical Potential Inventory', short: 'CPI', description: 'Measures potential for clerical/administrative roles' },
  { key: 'PAI', name: 'Potential Appraisal Inventory', short: 'PAI', description: 'Measures leadership potential and influence' },
  { key: 'SPI', name: 'Sales Potential Inventory', short: 'SPI', description: 'Measures potential for sales roles and customer engagement' }
];

const QUESTION_TEMPLATES = {
  HVP: [
    'I am honest in my dealings with others',
    'I keep my promises and commitments',
    'I treat others with respect and fairness',
    'I am straightforward in my communication',
    'I take responsibility for my actions',
    'I consider how my behavior affects others',
    'I value integrity in myself and others',
    'I am reliable and dependable',
    'I maintain ethical standards',
    'I am trustworthy in professional settings'
  ],
  HDS: [
    'I become impatient when things move slowly',
    'I sometimes take on more than I can handle',
    'I can be overly critical of myself',
    'I occasionally neglect details in my work',
    'I sometimes struggle with work-life balance',
    'I can be resistant to feedback',
    'I tend to worry about potential problems',
    'I sometimes lack confidence in new situations',
    'I can be stubborn about changing my approach',
    'I occasionally lose temper under pressure'
  ],
  MVPI: [
    'I am motivated by achievement and success',
    'I value autonomy and independence',
    'I enjoy working in a team environment',
    'I am driven by recognition and awards',
    'I value security and stability',
    'I prefer variety and change in my work',
    'I am motivated by helping others',
    'I value creative expression',
    'I am focused on financial rewards',
    'I value personal growth and development'
  ],
  SCI: [
    'I can analyze complex problems effectively',
    'I develop strategic solutions to challenges',
    'I think ahead and anticipate outcomes',
    'I can integrate information from multiple sources',
    'I Identify patterns in complex data',
    'I develop innovative approaches to problems',
    'I can evaluate risks and benefits',
    'I create solutions that address root causes',
    'I can think through long-term implications',
    'I develop comprehensive action plans'
  ],
  CPI: [
    'I am detail-oriented in my work',
    'I follow procedures accurately',
    'I maintain accurate records',
    'I am organized in my approach',
    'I attention to detail in all tasks',
    'I follow through on administrative tasks',
    'I maintain consistency in my work',
    'I am thorough in checking my work',
    'I follow guidelines and protocols',
    'I maintain orderly work processes'
  ],
  PAI: [
    'I naturally take leadership in group situations',
    'I am confident in directing others',
    'I can inspire and motivate team members',
    'I am comfortable making decisions',
    'I can delegate effectively',
    'I take initiative in difficult situations',
    'I am persuasive in my communication',
    'I can handle conflict constructively',
    'I am motivated by leadership responsibilities',
    'I can guide teams toward goals'
  ],
  SPI: [
    'I enjoy interacting with customers',
    'I am persuasive in sales situations',
    'I am confident approaching new people',
    'I can handle rejection positively',
    'I am motivated by sales targets',
    'I build rapport quickly with others',
    'I can explain products effectively',
    'I follow up on leads persistently',
    'I can identify customer needs',
    'I maintain positive attitude under pressure'
  ]
};

const AddHoganQuestions = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);

  const [questions, setQuestions] = useState(() => {
    const initial = {};
    HOGAN_SCALES.forEach(scale => {
      initial[scale.key] = Array(10).fill(null).map((_, idx) => ({
        questionText: QUESTION_TEMPLATES[scale.key][idx] || '',
        scale: scale.key,
        keyed: 'positive',
        correctAnswer: 'True',
        order: idx + 1
      }));
    });
    return initial;
  });

  const [expandedScales, setExpandedScales] = useState(
    HOGAN_SCALES.reduce((acc, s) => ({ ...acc, [s.key]: true }), {})
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

  const populateFromExisting = (existing) => {
    const newQuestions = {};

    HOGAN_SCALES.forEach(scale => {
      newQuestions[scale.key] = Array(10).fill(null).map((_, idx) => ({
        questionText: QUESTION_TEMPLATES[scale.key][idx] || '',
        scale: scale.key,
        keyed: 'positive',
        correctAnswer: 'True',
        order: idx + 1
      }));
    });

    existing.forEach(q => {
      const scale = q.scale || q.trait || q.dimension;
      if (scale && newQuestions[scale]) {
        const order = q.order || 1;
        const idx = order - 1;
        if (idx >= 0 && idx < 10) {
          newQuestions[scale][idx] = {
            questionText: q.questionText || q.text || QUESTION_TEMPLATES[scale]?.[idx] || '',
            scale: q.scale || scale,
            keyed: q.keyed || 'positive',
            correctAnswer: q.correctAnswer || 'True',
            order: order
          };
        }
      }
    });

    setQuestions(newQuestions);
  };

  const updateQuestion = (scaleKey, questionIndex, field, value) => {
    setQuestions(prev => ({
      ...prev,
      [scaleKey]: prev[scaleKey].map((q, idx) =>
        idx === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const validateForm = () => {
    const missing = [];

    HOGAN_SCALES.forEach(scale => {
      questions[scale.key].forEach((q, idx) => {
        if (!q.questionText?.trim()) {
          missing.push(`${scale.key} Q${idx + 1}: Missing text`);
        }
      });
    });

    return missing;
  };

  const getCompletionStatus = () => {
    let total = 0;
    let completed = 0;

    HOGAN_SCALES.forEach(scale => {
      questions[scale.key].forEach(q => {
        total++;
        if (q.questionText?.trim()) {
          completed++;
        }
      });
    });

    return { total, completed };
  };

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

      HOGAN_SCALES.forEach(scale => {
        questions[scale.key].forEach((q, idx) => {
          questionsToCreate.push({
            type: 'mcq',
            questionText: q.questionText,
            scale: scale.key,
            dimension: scale.key,
            keyed: q.keyed,
            correctAnswer: q.correctAnswer,
            order: orderCounter++,
            marks: 1,
            difficulty: 'moderate',
            options: [
              { text: 'True', score: q.correctAnswer === 'True' ? 1 : 0 },
              { text: 'False', score: q.correctAnswer === 'False' ? 1 : 0 }
            ],
            isRequired: true,
            explanation: `This question measures ${scale.name} (${scale.short})`,
            tags: ['hogan', scale.key.toLowerCase(), 'psychometric', 'personality']
          });
        });
      });

      await assessmentService.bulkCreateQuestions(id, questionsToCreate);

      setSuccess(`Successfully added ${questionsToCreate.length} Hogan questions!`);

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

  const handleCancel = () => {
    const prefix = orgSlug ? `/o/${orgSlug}` : '';
    navigate(`${prefix}/assessments/${id}`);
  };

  const toggleScale = (scaleKey) => {
    setExpandedScales(prev => ({ ...prev, [scaleKey]: !prev[scaleKey] }));
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

  const scaleColors = {
    HVP: 'bg-teal-500',
    HDS: 'bg-orange-500',
    MVPI: 'bg-pink-500',
    SCI: 'bg-cyan-500',
    CPI: 'bg-indigo-500',
    PAI: 'bg-amber-500',
    SPI: 'bg-emerald-500'
  };

  return (
    <div className="space-y-6">
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
              Add Hogan Questions
            </h1>
            <p className="text-gray-500">
              {hasExisting ? 'Update existing questions' : 'Add 70 questions for Hogan assessment'}
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

      <div className="space-y-4">
        {HOGAN_SCALES.map((scale, scaleIdx) => (
          <div key={scale.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleScale(scale.key)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${scaleColors[scale.key]}`}>
                  {scale.short.toUpperCase().slice(0, 2)}
                </span>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {scale.name} ({scale.key})
                  </h3>
                  <p className="text-xs text-gray-500">
                    {scale.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {questions[scale.key].filter(q => q.questionText?.trim()).length}/10 completed
                </span>
                {expandedScales[scale.key] ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {expandedScales[scale.key] && (
              <div className="p-4 space-y-4">
                {questions[scale.key].map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                        {qIdx + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => updateQuestion(scale.key, qIdx, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter True/False question"
                        />
                      </div>
                    </div>

                    <div className="ml-9 flex flex-wrap gap-4">
                      <div className="flex flex-col">
                        <label className="block text-xs text-gray-600 mb-1">Keying</label>
                        <select
                          value={q.keyed}
                          onChange={(e) => updateQuestion(scale.key, qIdx, 'keyed', e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
                        >
                          <option value="positive">Positive (+)</option>
                          <option value="negative">Negative (-)</option>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="block text-xs text-gray-600 mb-1">Correct Answer</label>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(scale.key, qIdx, 'correctAnswer', e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
                        >
                          <option value="True">True</option>
                          <option value="False">False</option>
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

export default AddHoganQuestions;