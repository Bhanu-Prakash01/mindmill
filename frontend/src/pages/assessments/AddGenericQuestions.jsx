import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services';
import api from '../../services/api';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, Plus, Trash2, Image, Type, Grid, Star, List } from 'lucide-react';

const QUESTION_TYPES = [
  { key: 'mcq', name: 'Multiple Choice', icon: List, description: 'Select from multiple options' },
  { key: 'text', name: 'Text Answer', icon: Type, description: 'Free text response' },
  { key: 'image', name: 'Image Based', icon: Image, description: 'Question with image' },
  { key: 'graphic', name: 'Graphic/Chart', icon: Grid, description: 'Visual information question' },
  { key: 'rating', name: 'Rating Scale', icon: Star, description: 'Likert scale response' },
  { key: 'matrix', name: 'Matrix', icon: Grid, description: 'Matrix/tabular question' }
];

const DIFFICULTY_LEVELS = [
  { key: 'basic', name: 'Basic', color: 'bg-green-100 text-green-700' },
  { key: 'moderate', name: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'tough', name: 'Tough', color: 'bg-red-100 text-red-700' }
];

const RATING_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' }
];

const AddGenericQuestions = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingQuestion, setExistingQuestion] = useState(null);

  const [questionType, setQuestionType] = useState('mcq');
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState('');
  const [difficulty, setDifficulty] = useState('moderate');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [order, setOrder] = useState(1);
  const [marks, setMarks] = useState(1);
  const [isRequired, setIsRequired] = useState(true);
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState('');
  
  const [options, setOptions] = useState([
    { text: '', isCorrect: false, score: 0 },
    { text: '', isCorrect: false, score: 0 },
    { text: '', isCorrect: false, score: 0 },
    { text: '', isCorrect: false, score: 0 }
  ]);

  const [ratingConfig, setRatingConfig] = useState(RATING_SCALE);

  useEffect(() => {
    if (id) {
      const questionId = new URLSearchParams(window.location.search).get('questionId');
      if (questionId) {
        fetchQuestion(questionId);
      }
    }
  }, [id]);

  const fetchQuestion = async (questionId) => {
    setLoading(true);
    try {
      const response = await api.get(`/questions/${questionId}`);
      const question = response.data.question;
      setExistingQuestion(question);
      
      setQuestionType(question.type);
      setQuestionText(question.questionText);
      setQuestionImage(question.questionImage || '');
      setDifficulty(question.difficulty);
      setCategory(question.category || '');
      setSubCategory(question.subCategory || '');
      setOrder(question.order);
      setMarks(question.marks || 1);
      setIsRequired(question.isRequired !== false);
      setExplanation(question.explanation || '');
      setTags(question.tags?.join(', ') || '');

      if (question.type === 'mcq' && question.options?.length > 0) {
        setOptions(question.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          score: opt.score
        })));
      }

      if (question.type === 'rating' && question.options?.length > 0) {
        setRatingConfig(question.options.map(opt => ({
          value: opt.score || 1,
          label: opt.text
        })));
      }
    } catch (err) {
      console.error('Error fetching question:', err);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false, score: 0 }]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      setError('At least 2 options required');
      return;
    }
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((opt, idx) => {
        if (idx !== index) opt.isCorrect = false;
      });
    }
    
    setOptions(newOptions);
  };

  const addRatingOption = () => {
    setRatingConfig([...ratingConfig, { value: ratingConfig.length + 1, label: 'Option' }]);
  };

  const removeRatingOption = (index) => {
    if (ratingConfig.length <= 2) {
      setError('At least 2 options required');
      return;
    }
    setRatingConfig(ratingConfig.filter((_, idx) => idx !== index));
  };

  const updateRatingOption = (index, field, value) => {
    const newRating = [...ratingConfig];
    newRating[index] = { ...newRating[index], [field]: field === 'value' ? parseInt(value) || 1 : value };
    setRatingConfig(newRating);
  };

  const validateForm = () => {
    if (!questionText?.trim()) {
      return 'Question text is required';
    }

    if (questionType === 'mcq') {
      const hasText = options.some(o => o.text?.trim());
      if (!hasText) {
        return 'At least one option with text is required';
      }
      const hasCorrect = options.some(o => o.isCorrect);
      if (!hasCorrect) {
        return 'Please select a correct answer';
      }
    }

    if (questionType === 'rating') {
      const hasText = ratingConfig.some(o => o.label?.trim());
      if (!hasText) {
        return 'At least one rating option with label is required';
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const questionData = {
        type: questionType,
        questionText,
        questionImage: questionImage || null,
        difficulty,
        category,
        subCategory,
        order: parseInt(order),
        marks: parseInt(marks),
        isRequired,
        explanation,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (questionType === 'mcq') {
        questionData.options = options
          .filter(o => o.text?.trim())
          .map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            score: opt.isCorrect ? marks : 0,
            order: idx + 1
          }));
      }

      if (questionType === 'rating') {
        questionData.options = ratingConfig
          .filter(o => o.label?.trim())
          .map((opt, idx) => ({
            text: opt.label,
            score: opt.value,
            order: idx + 1
          }));
      }

      if (existingQuestion) {
        await assessmentService.updateQuestion(id, existingQuestion._id, questionData);
        setSuccess('Question updated successfully!');
      } else {
        await assessmentService.createQuestion(id, questionData);
        setSuccess('Question created successfully!');
      }

      setTimeout(() => {
        const prefix = orgSlug ? `/o/${orgSlug}` : '';
        navigate(`${prefix}/assessments/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const prefix = orgSlug ? `/o/${orgSlug}` : '';
    navigate(`${prefix}/assessments/${id}`);
  };

  const getTypeIcon = (type) => {
    const typeInfo = QUESTION_TYPES.find(t => t.key === type);
    const IconComponent = typeInfo?.icon || List;
    return <IconComponent className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
              {existingQuestion ? 'Edit Question' : 'Add Question'}
            </h1>
            <p className="text-gray-500">
              {existingQuestion ? 'Update question details' : 'Add a new question to this assessment'}
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
            {saving ? 'Saving...' : 'Save Question'}
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

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => setQuestionType(type.key)}
                disabled={existingQuestion}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  questionType === type.key
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${existingQuestion ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`p-2 rounded-lg ${
                  questionType === type.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {getTypeIcon(type.key)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{type.name}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text <span className="text-red-500">*</span>
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your question..."
          />
        </div>

        {(questionType === 'image' || questionType === 'graphic') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={questionImage}
              onChange={(e) => setQuestionImage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            {questionImage && (
              <div className="mt-2">
                <img
                  src={questionImage}
                  alt="Question preview"
                  className="max-h-48 rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {questionType === 'mcq' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateOption(idx, 'isCorrect', !option.isCorrect)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      option.isCorrect
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    {option.isCorrect && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(idx, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    disabled={options.length <= 2}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            </div>
          </div>
        )}

        {questionType === 'rating' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Scale <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {ratingConfig.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-8 text-center text-sm font-medium text-gray-500">
                    {opt.value}
                  </span>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => updateRatingOption(idx, 'label', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Label ${idx + 1}`}
                  />
                  <input
                    type="number"
                    value={opt.value}
                    onChange={(e) => updateRatingOption(idx, 'value', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                    min={1}
                    max={10}
                  />
                  <button
                    type="button"
                    onClick={() => removeRatingOption(idx)}
                    disabled={ratingConfig.length <= 2}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRatingOption}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add Scale Point
              </button>
            </div>
          </div>
        )}

        {questionType === 'matrix' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matrix Configuration
            </label>
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p>Matrix questions allow multiple row-column combinations. Configure the options and scoring in the question editor.</p>
            </div>
          </div>
        )}

        {questionType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Answer (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              placeholder="Expected model answer for scoring..."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <div className="flex gap-3">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level.key}
                onClick={() => setDifficulty(level.key)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  difficulty === level.key
                    ? `border-indigo-600 ${level.color}`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Numerical, Verbal, Logical"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Category
            </label>
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Algebra, Reading Comprehension"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marks
            </label>
            <input
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required
            </label>
            <button
              type="button"
              onClick={() => setIsRequired(!isRequired)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                isRequired
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {isRequired ? 'Yes - Required' : 'No - Optional'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
            placeholder="tag1, tag2, tag3 (comma separated)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explanation / Notes
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
            placeholder="Additional explanation for this question..."
          />
        </div>
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
          {saving ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </div>
  );
};

export default AddGenericQuestions;