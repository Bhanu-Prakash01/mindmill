import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const DISC_TRAITS = [
  { key: 'D', name: 'Dominance', short: 'D', description: 'Direct, decisive, and results-oriented', color: 'bg-red-500' },
  { key: 'I', name: 'Influence', short: 'I', description: 'Social, optimistic, and沟通', color: 'bg-yellow-500' },
  { key: 'S', name: 'Steadiness', short: 'S', description: 'Supportive, patient, and team-oriented', color: 'bg-green-500' },
  { key: 'C', name: 'Conscientiousness', short: 'C', description: 'Precise, analytical, and systematic', color: 'bg-blue-500' }
];

const STATEMENT_TEMPLATES = [
  { positions: ['D', 'I', 'S', 'C'], texts: ['I take charge of situations', 'I inspire others with my vision', 'I support my team members', 'I analyze details carefully'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I make decisions quickly', 'I communicate ideas clearly', 'I listen to understand others', 'I follow established procedures'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I challenge the status quo', 'I build relationships easily', 'I maintain harmony in groups', 'I ensure accuracy in work'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I drive projects to completion', 'I am enthusiastic and positive', 'I am patient and dependable', 'I focus on quality'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I confront problems head-on', 'I influence people effectively', 'I prefer gradual change', 'I adhere to standards'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I want immediate results', 'I seek social recognition', 'I value loyalty and trust', 'I value precision and logic'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I am assertive in discussions', 'I bring energy to groups', 'I avoid rushing decisions', 'I verify information'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I accept challenges readily', 'I motivate others well', 'I maintain stability', 'I systematize processes'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I control outcomes', 'I network professionally', 'I nurture relationships', 'I examine data thoroughly'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I set ambitious goals', 'I express ideas verbally', 'I adapt to circumstances', 'I consider all factors'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I am competitive by nature', 'I persuade others easily', 'I show empathy', 'I check for errors'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I initiate action', 'I enjoy collaboration', 'I provide support', 'I plan methodically'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I handle confrontation well', 'I am outgoing', 'I am loyal', 'I am detail-oriented'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I want to lead', 'I want to be appreciated', 'I want security', 'I want competence'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I delegate appropriately', 'I brainstorm creatively', 'I follow through', 'I organize information'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I accept responsibility', 'I inspire confidence', 'I accommodate others', 'I verify facts'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I am results-focused', 'I am people-oriented', 'I am consistent', 'I am analytical'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I pace myself appropriately', 'I share information freely', 'I complete what I start', 'I question assumptions'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I tackle difficult tasks', 'I create enthusiasm', 'I value cooperation', 'I establish rules'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I prefer action over talk', 'I enjoy being social', 'I prefer stability', 'I prefer data over opinions'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I am decisive', 'I am persuasive', 'I am trustworthy', 'I am thorough'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I push for progress', 'I generate new ideas', 'I maintain patience', 'I prioritize tasks'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I handle pressure well', 'I build rapport quickly', 'I work at a steady pace', 'I verify accuracy'] },
  { positions: ['D', 'I', 'S', 'C'], texts: ['I achieve objectives', 'I influence opinions', 'I support colleagues', 'I maintain quality standards'] }
];

const AddDiscQuestions = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);

  const [questions, setQuestions] = useState(() => {
    return Array(24).fill(null).map((_, idx) => ({
      statements: STATEMENT_TEMPLATES[idx].texts.map((text, posIdx) => ({
        text: text,
        trait: STATEMENT_TEMPLATES[idx].positions[posIdx],
        rank: posIdx + 1
      })),
      order: idx + 1
    }));
  });

  const [expandedQuestions, setExpandedQuestions] = useState(
    Array(24).fill(null).reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
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
    const newQuestions = Array(24).fill(null).map((_, idx) => ({
      statements: STATEMENT_TEMPLATES[idx].texts.map((text, posIdx) => ({
        text: text,
        trait: STATEMENT_TEMPLATES[idx].positions[posIdx],
        rank: posIdx + 1
      })),
      order: idx + 1
    }));

    existing.forEach(q => {
      if (q.type === 'disc-ranking' || q.type === 'ranking') {
        const order = q.order || 1;
        if (order >= 1 && order <= 24) {
          const idx = order - 1;
          if (q.statements && q.statements.length > 0) {
            newQuestions[idx] = {
              statements: q.statements,
              order: order
            };
          }
        }
      }
    });

    setQuestions(newQuestions);
  };

  const updateStatement = (questionIndex, statementIndex, field, value) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== questionIndex) return q;
      return {
        ...q,
        statements: q.statements.map((s, sIdx) =>
          sIdx === statementIndex ? { ...s, [field]: value } : s
        )
      };
    }));
  };

  const validateForm = () => {
    const missing = [];

    questions.forEach((q, idx) => {
      q.statements.forEach((s, sIdx) => {
        if (!s.text?.trim()) {
          missing.push(`Q${idx + 1} Position ${sIdx + 1}: Missing text`);
        }
      });
    });

    return missing;
  };

  const getCompletionStatus = () => {
    let total = 0;
    let completed = 0;

    questions.forEach(q => {
      q.statements.forEach(s => {
        total++;
        if (s.text?.trim()) {
          completed++;
        }
      });
    });

    return { total, completed };
  };

  const handleSave = async () => {
    const missing = validateForm();
    if (missing.length > 0) {
      setError(`Please complete all statements. Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const questionsToCreate = [];
      let orderCounter = 1;

      questions.forEach((q) => {
        const questionPrompt = q.order === 1 
          ? "Select the statement that is MOST like you and the statement that is LEAST like you in a work environment."
          : q.order === 2
          ? "Select what describes you best and least in team situations."
          : "Choose the statements that best and least describe your work style.";
        
        questionsToCreate.push({
          type: 'disc-ranking',
          questionText: questionPrompt,
          statements: q.statements.map((s, idx) => ({
            text: s.text,
            trait: s.trait,
            rank: idx + 1
          })),
          trait: q.statements[0].trait + q.statements[1].trait + q.statements[2].trait + q.statements[3].trait,
          dimension: 'DISC',
          order: orderCounter++,
          marks: 4,
          difficulty: 'moderate',
          isRequired: true,
          explanation: 'Rank these statements from most like you (4) to least like you (1)',
          tags: ['disc', 'ranking', 'psychometric', 'personality']
        });
      });

      await assessmentService.bulkCreateQuestions(id, questionsToCreate);

      setSuccess(`Successfully added ${questionsToCreate.length} DISC ranking questions!`);

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

  const toggleQuestion = (idx) => {
    setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
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
              Add DISC Questions
            </h1>
            <p className="text-gray-500">
              {hasExisting ? 'Update existing questions' : 'Add 24 ranking questions for DISC assessment'}
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
            {status.completed}/{status.total} statements completed
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(status.completed / status.total) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Each question has 4 statements. Rank them from 4 (most like you) to 1 (least like you). The trait selector indicates which DISC trait best represents each statement.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleQuestion(qIdx)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                  {qIdx + 1}
                </span>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Ranking Question {qIdx + 1}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Rank statements from 4 (most like you) to 1 (least like you)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {q.statements.filter(s => s.text?.trim()).length}/4 statements
                </span>
                {expandedQuestions[qIdx] ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {expandedQuestions[qIdx] && (
              <div className="p-4 space-y-3">
                {q.statements.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                      {sIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={s.text}
                      onChange={(e) => updateStatement(qIdx, sIdx, 'text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Statement ${sIdx + 1}`}
                    />
                    <select
                      value={s.trait}
                      onChange={(e) => updateStatement(qIdx, sIdx, 'trait', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                    >
                      {DISC_TRAITS.map(t => (
                        <option key={t.key} value={t.key}>{t.key}: {t.name}</option>
                      ))}
                    </select>
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

export default AddDiscQuestions;