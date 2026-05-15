import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { assessmentService, organizationService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Lock,
  Info,
  Sparkles,
  Image,
  Upload,
  X,
  Send,
  Pencil
} from 'lucide-react';

// Category → Subcategory mapping
const SUBCATEGORY_MAP = {
  psychometric: ['FIRO-B', 'DISC', 'MBTI', 'Hogan'],
  personality: ['Big5'],
  cognitive: ['Reasoning'],
  aptitude: ['General Aptitude'],
  professional: ['PCLA'],
};

// Display labels for subcategories (value → display label mapping)
const SUBCATEGORY_LABELS = {
  'FIRO-B': 'Professional Interpersonal Relations Orientation (PIRO)',
  'Hogan': 'TraitMap Index',
  'PCLA': 'Professional Coachability & Learning Agility Index (PCLA™)',
};

// Big5 trait configuration for question positions
const BIG5_CONFIG = {
 E: { name: 'Extraversion', pos: [1,11,21,31,41], neg: [6,16,26,36,46] },
 A: { name: 'Agreeableness', pos: [7,17,27,37,42,47], neg: [2,12,22,32] },
 C: { name: 'Conscientiousness', pos: [3,13,23,33,43,48], neg: [8,18,28,38] },
 N: { name: 'Neuroticism', pos: [9,19], neg: [4,14,24,29,34,39,44,49] },
 O: { name: 'Openness', pos: [5,15,25,35,40,45,50], neg: [10,20,30] }
};

// DISC predefined questions for auto-populate
const PREDEFINED_DISC_QUESTIONS = {
 1: { questionText: "Choose the statement that is MOST like you and the statement that is LEAST like you in a work environment.", statements: [{ text: "I enjoy competitive challenges and winning", trait: "D" }, { text: "I like to influence and persuade others", trait: "I" }, { text: "I prefer steady, predictable work environments", trait: "S" }, { text: "I focus on accuracy and quality in my work", trait: "C" }] },
 2: { questionText: "Select what describes you best and least in team situations.", statements: [{ text: "I take charge and make decisions quickly", trait: "D" }, { text: "I create enthusiasm and motivate others", trait: "I" }, { text: "I listen carefully and support team harmony", trait: "S" }, { text: "I analyze data and ensure correctness", trait: "C" }] },
 3: { questionText: "Choose your typical approach to problems.", statements: [{ text: "I tackle problems head-on and act fast", trait: "D" }, { text: "I brainstorm creative solutions with others", trait: "I" }, { text: "I consider how decisions affect people", trait: "S" }, { text: "I research thoroughly before acting", trait: "C" }] },
 4: { questionText: "Select what best describes your communication style.", statements: [{ text: "I'm direct, brief, and to the point", trait: "D" }, { text: "I'm animated, expressive, and engaging", trait: "I" }, { text: "I'm calm, patient, and a good listener", trait: "S" }, { text: "I'm precise, detailed, and logical", trait: "C" }] },
 5: { questionText: "Choose your preferred work pace and style.", statements: [{ text: "Fast-paced with quick results", trait: "D" }, { text: "Energetic with variety and interaction", trait: "I" }, { text: "Steady with established routines", trait: "S" }, { text: "Methodical with careful planning", trait: "C" }] },
 6: { questionText: "Select how you typically handle change.", statements: [{ text: "I initiate change and drive new directions", trait: "D" }, { text: "I embrace change as exciting opportunities", trait: "I" }, { text: "I adapt gradually with support from others", trait: "S" }, { text: "I evaluate change carefully before accepting", trait: "C" }] },
 7: { questionText: "Choose your approach to rules and procedures.", statements: [{ text: "I bend rules to achieve results faster", trait: "D" }, { text: "I interpret rules flexibly based on people", trait: "I" }, { text: "I follow established procedures consistently", trait: "S" }, { text: "I ensure all rules are followed precisely", trait: "C" }] },
 8: { questionText: "Select how you make important decisions.", statements: [{ text: "Quickly, based on gut instinct", trait: "D" }, { text: "Based on input and consensus from others", trait: "I" }, { text: "Carefully, considering everyone's feelings", trait: "S" }, { text: "After thorough analysis of all facts", trait: "C" }] },
 9: { questionText: "Choose your typical response to conflict.", statements: [{ text: "I confront it directly and resolve it quickly", trait: "D" }, { text: "I use humor and diplomacy to ease tension", trait: "I" }, { text: "I seek compromise and maintain relationships", trait: "S" }, { text: "I analyze the root cause objectively", trait: "C" }] },
 10: { questionText: "Select what motivates you most at work.", statements: [{ text: "Achieving results and winning", trait: "D" }, { text: "Recognition and social approval", trait: "I" }, { text: "Stability and helping others succeed", trait: "S" }, { text: "Quality and expertise in my field", trait: "C" }] },
 11: { questionText: "Choose how you prefer to lead others.", statements: [{ text: "By setting ambitious goals and pushing for results", trait: "D" }, { text: "By inspiring and energizing the team", trait: "I" }, { text: "By supporting and developing team members", trait: "S" }, { text: "By ensuring accuracy and following best practices", trait: "C" }] },
 12: { questionText: "Select your approach to meeting deadlines.", statements: [{ text: "I push hard to finish early", trait: "D" }, { text: "I motivate the team to work together", trait: "I" }, { text: "I work steadily and reliably", trait: "S" }, { text: "I plan carefully to ensure quality", trait: "C" }] },
 13: { questionText: "Choose how you typically handle criticism.", statements: [{ text: "I dismiss it and focus on my goals", trait: "D" }, { text: "I try to charm my way out of it", trait: "I" }, { text: "I take it personally and feel hurt", trait: "S" }, { text: "I analyze whether it's valid and accurate", trait: "C" }] },
 14: { questionText: "Select your preferred role in group projects.", statements: [{ text: "The leader who directs the effort", trait: "D" }, { text: "The promoter who generates excitement", trait: "I" }, { text: "The supporter who ensures cooperation", trait: "S" }, { text: "The analyst who checks the details", trait: "C" }] },
 15: { questionText: "Choose how you set personal goals.", statements: [{ text: "Aggressive, challenging targets", trait: "D" }, { text: "Goals that involve people and recognition", trait: "I" }, { text: "Realistic, achievable objectives", trait: "S" }, { text: "Specific, measurable outcomes", trait: "C" }] },
 16: { questionText: "Select your attitude toward risk.", statements: [{ text: "I take bold risks for big rewards", trait: "D" }, { text: "I take social risks to meet people", trait: "I" }, { text: "I prefer low-risk, stable situations", trait: "S" }, { text: "I calculate risks carefully before acting", trait: "C" }] },
 17: { questionText: "Choose how you prefer to receive information.", statements: [{ text: "Brief summaries with key points only", trait: "D" }, { text: "Interactive discussions with others", trait: "I" }, { text: "Personal explanations with time to process", trait: "S" }, { text: "Detailed data and comprehensive reports", trait: "C" }] },
 18: { questionText: "Select how you build relationships at work.", statements: [{ text: "Through achieving shared goals", trait: "D" }, { text: "Through socializing and networking", trait: "I" }, { text: "Through trust and long-term loyalty", trait: "S" }, { text: "Through competence and reliability", trait: "C" }] },
 19: { questionText: "Choose your typical response to stress.", statements: [{ text: "I become more demanding and controlling", trait: "D" }, { text: "I become more talkative and seek attention", trait: "I" }, { text: "I become withdrawn and seek stability", trait: "S" }, { text: "I become overly critical and perfectionist", trait: "C" }] },
 20: { questionText: "Select what you value most in a workplace.", statements: [{ text: "Autonomy and authority to make decisions", trait: "D" }, { text: "A fun, social atmosphere", trait: "I" }, { text: "Security and a sense of belonging", trait: "S" }, { text: "Clear standards and quality focus", trait: "C" }] },
 21: { questionText: "Choose how you handle multiple priorities.", statements: [{ text: "I prioritize by urgency and impact", trait: "D" }, { text: "I delegate and involve others", trait: "I" }, { text: "I work through them methodically", trait: "S" }, { text: "I organize them systematically by importance", trait: "C" }] },
 22: { questionText: "Select your approach to learning new skills.", statements: [{ text: "I learn by doing and taking charge", trait: "D" }, { text: "I learn through interaction and discussion", trait: "I" }, { text: "I learn with guidance and practice", trait: "S" }, { text: "I learn through study and research", trait: "C" }] },
 23: { questionText: "Choose how you express disagreement.", statements: [{ text: "I state my position firmly and directly", trait: "D" }, { text: "I try to persuade others to my view", trait: "I" }, { text: "I avoid confrontation if possible", trait: "S" }, { text: "I present logical arguments and facts", trait: "C" }] },
 24: { questionText: "Select what best describes your overall work approach.", statements: [{ text: "Results-driven and competitive", trait: "D" }, { text: "People-focused and enthusiastic", trait: "I" }, { text: "Team-oriented and dependable", trait: "S" }, { text: "Quality-focused and analytical", trait: "C" }] }
};

// Predefined IPIP-NEO Big5 questions mapped by position
const PREDEFINED_BIG5_QUESTIONS = {
 1: { text: "Make friends easily", trait: "E", direction: "positive", facet: 1 },
 2: { text: "Use others for my own ends", trait: "A", direction: "negative", facet: 2 },
 3: { text: "Complete tasks successfully", trait: "C", direction: "positive", facet: 1 },
 4: { text: "Get angry easily", trait: "N", direction: "negative", facet: 2 },
 5: { text: "Have a vivid imagination", trait: "O", direction: "positive", facet: 1 },
 6: { text: "Love large parties", trait: "E", direction: "negative", facet: 2 },
 7: { text: "Trust others", trait: "A", direction: "positive", facet: 1 },
 8: { text: "Like to tidy up", trait: "C", direction: "negative", facet: 2 },
 9: { text: "Often feel blue", trait: "N", direction: "positive", facet: 3 },
 10: { text: "Believe in the importance of art", trait: "O", direction: "negative", facet: 2 },
 11: { text: "Take charge", trait: "E", direction: "positive", facet: 3 },
 12: { text: "Cheat to get ahead", trait: "A", direction: "negative", facet: 2 },
 13: { text: "Keep my promises", trait: "C", direction: "positive", facet: 3 },
 14: { text: "Find it difficult to approach others", trait: "N", direction: "negative", facet: 4 },
 15: { text: "Experience my emotions intensely", trait: "O", direction: "positive", facet: 3 },
 16: { text: "Am always on the go", trait: "E", direction: "negative", facet: 4 },
 17: { text: "Love to help others", trait: "A", direction: "positive", facet: 3 },
 18: { text: "Do more than what's expected of me", trait: "C", direction: "negative", facet: 4 },
 19: { text: "Panic easily", trait: "N", direction: "positive", facet: 6 },
 20: { text: "Love to read challenging material", trait: "O", direction: "negative", facet: 5 },
 21: { text: "Radiate joy", trait: "E", direction: "positive", facet: 6 },
 22: { text: "Believe that I am better than others", trait: "A", direction: "negative", facet: 5 },
 23: { text: "Am always prepared", trait: "C", direction: "positive", facet: 5 },
 24: { text: "Fear for the worst", trait: "N", direction: "negative", facet: 1 },
 25: { text: "Tend to vote for liberal political candidates", trait: "O", direction: "positive", facet: 6 },
 26: { text: "Sympathize with the homeless", trait: "A", direction: "negative", facet: 6 },
 27: { text: "Jump into things without thinking", trait: "C", direction: "positive", facet: 6 },
 28: { text: "Feel comfortable around people", trait: "E", direction: "negative", facet: 1 },
 29: { text: "Insult people", trait: "A", direction: "negative", facet: 4 },
 30: { text: "See beauty in things that others might not notice", trait: "O", direction: "negative", facet: 2 },
 31: { text: "Talk to a lot of different people at parties", trait: "E", direction: "positive", facet: 2 },
 32: { text: "Often forget to put things back in their proper place", trait: "C", direction: "negative", facet: 2 },
 33: { text: "Dislike myself", trait: "N", direction: "positive", facet: 3 },
 34: { text: "Try to lead others", trait: "E", direction: "negative", facet: 3 },
 35: { text: "Feel others' emotions", trait: "O", direction: "positive", facet: 3 },
 36: { text: "Am concerned about others", trait: "A", direction: "negative", facet: 3 },
 37: { text: "Tell the truth", trait: "C", direction: "positive", facet: 3 },
 38: { text: "Am afraid to draw attention to myself", trait: "N", direction: "negative", facet: 4 },
 39: { text: "Prefer variety to routine", trait: "E", direction: "negative", facet: 4 },
 40: { text: "Love a good fight", trait: "A", direction: "positive", facet: 4 },
 41: { text: "Work hard", trait: "C", direction: "positive", facet: 4 },
 42: { text: "Go on binges", trait: "N", direction: "negative", facet: 5 },
 43: { text: "Love excitement", trait: "E", direction: "positive", facet: 5 },
 44: { text: "Avoid philosophical discussions", trait: "O", direction: "negative", facet: 5 },
 45: { text: "Think highly of myself", trait: "A", direction: "negative", facet: 5 },
 46: { text: "Carry out my plans", trait: "C", direction: "negative", facet: 5 },
 47: { text: "Become overwhelmed by events", trait: "N", direction: "positive", facet: 6 },
 48: { text: "Have a lot of fun", trait: "E", direction: "positive", facet: 6 },
 49: { text: "Believe that there is no absolute right and wrong", trait: "O", direction: "negative", facet: 6 },
 50: { text: "Feel sympathy for those who are worse off than myself", trait: "A", direction: "positive", facet: 6 }
};

// Helper function to determine Big5 question direction based on position
const getBig5Direction = (questionNum, trait) => {
 if (!trait || !BIG5_CONFIG[trait]) return 'positive';
 const config = BIG5_CONFIG[trait];
 if (config.pos.includes(questionNum)) return 'positive';
 if (config.neg.includes(questionNum)) return 'negative';
 // Default based on counts
 const currentPos = config.pos.filter(n => n <= questionNum).length;
 const currentNeg = config.neg.filter(n => n <= questionNum).length;
 return currentPos > currentNeg ? 'negative' : 'positive';
};

const AssessmentForm = () => {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'details');
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  const [formData, setFormData] = useState({
  title: '',
  description: '',
  category: 'psychometric',
  subCategory: '',
  difficulty: 'moderate',
  purpose: '',
  audience: '',
  instructions: '',
  timeBound: {
  enabled: true,
  durationMinutes: 30,
  },
  passingScore: 60,
  allowMultipleAttempts: false,
  maxAttempts: 1,
  showResultsImmediately: true,
  randomizeQuestions: false,
  randomizeOptions: false,
  isPublished: false,
  requirePasscode: false,
  passcode: '',
  reportConfig: {
  type: 'standard',
  showScores: true,
  showFullReport: true,
  showPercentile: false,
  showCorrectAnswers: false,
  includeRecommendations: true,
  },
  tags: [],
  creditCostPerTest: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  const [newQuestion, setNewQuestion] = useState({
 type: 'mcq',
 questionText: '',
 trait: '',
 direction: 'positive',
 options: [
 { text: '', score: 0, isCorrect: false },
 { text: '', score: 0, isCorrect: false },
 { text: '', score: 0, isCorrect: false },
 { text: '', score: 0, isCorrect: false },
 ],
 difficulty: 'moderate',
 dimension: '',
 marks: 1,
 explanation: '',
 });

useEffect(() => {
    if (isEditing) {
      fetchAssessment();
    }
    if (user?.role === 'superadmin') {
      fetchOrganizations();
    }
  }, [id, user]);

  useEffect(() => {
    if (isEditing && id && activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab, id]);

  const fetchOrganizations = async () => {
  try {
  const response = await organizationService.getOrganizations({ limit: 100 });
  setOrganizations(response.data?.organizations || response.data || []);
  } catch (error) {
  console.error('Error fetching organizations:', error);
  }
  };

 const fetchAssessment = async () => {
 try {
 const response = await assessmentService.getAssessment(id);
 const assessment = response.data?.assessment;
  if (assessment) {
   setBannerPreview(assessment.bannerImage ? `/${assessment.bannerImage}` : '');
   setFormData({
  title: assessment.title || '',
  description: assessment.description || '',
  category: assessment.category || 'psychometric',
  subCategory: assessment.subCategory || '',
  difficulty: assessment.difficulty || 'moderate',
  purpose: assessment.purpose || '',
  audience: assessment.audience || '',
  instructions: assessment.instructions || '',
  timeBound: assessment.timeBound || { enabled: true, durationMinutes: 30 },
  passingScore: assessment.passingScore || 60,
  allowMultipleAttempts: assessment.allowMultipleAttempts || false,
  maxAttempts: assessment.maxAttempts || 1,
  showResultsImmediately: assessment.showResultsImmediately !== false,
  randomizeQuestions: assessment.randomizeQuestions || false,
  randomizeOptions: assessment.randomizeOptions || false,
  isPublished: assessment.isPublished || false,
  requirePasscode: assessment.requirePasscode || false,
  passcode: assessment.passcode || '',
  reportConfig: assessment.reportConfig || {
  type: 'standard',
  showScores: true,
  showFullReport: true,
  showPercentile: false,
  showCorrectAnswers: false,
  includeRecommendations: true,
  },
  tags: assessment.tags || [],
  creditCostPerTest: assessment.creditCostPerTest != null ? String(assessment.creditCostPerTest) : '',
  });
 fetchQuestions();
 }
} catch (error) {
  console.error('Error fetching assessment:', error);
  toast.error('Failed to load assessment');
  } finally {
 setLoading(false);
 }
 };

const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const response = await assessmentService.getQuestions(id);
      setQuestions(response.data?.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

   const handleSubmit = async (e) => {
   e.preventDefault();
   setSaving(true);
   try {
    const submitData = { ...formData };
    // Convert creditCostPerTest: empty string → null (use default), otherwise number
    submitData.creditCostPerTest = submitData.creditCostPerTest !== '' ? Number(submitData.creditCostPerTest) : null;
    if (isEditing) {
    await assessmentService.updateAssessment(id, submitData);
   } else {
      const response = await assessmentService.createAssessment(submitData);
       const newId = response.data?.assessment?._id || response.assessment?._id;
       if (newId) {
         const prefix = orgSlug ? `/o/${orgSlug}` : '';
         navigate(`${prefix}/assessments/${newId}`, { replace: true, state: { activeTab: 'questions' } });
         return;
       }
     }
     const prefix = orgSlug ? `/o/${orgSlug}` : '';
     navigate(`${prefix}/assessments`);
   } catch (error) {
  console.error('Error saving assessment:', error);
  toast.error(error.response?.data?.message || 'Failed to save assessment');
  } finally {
   setSaving(false);
   }
   };

  const handleNext = () => {
    if (activeTab === 'details') {
      if (!formData.title.trim()) {
        toast.warning('Please enter a title');
        return;
      }
      if (isEditing) {
        setQuestionsLoading(true);
      }
      setActiveTab('questions');
    } else if (activeTab === 'questions') {
      setActiveTab('settings');
    }
  };

  const handlePublish = async () => {
    if (!isEditing && !formData.title.trim()) {
      toast.warning('Please enter a title');
      return;
    }
    setSaving(true);
    try {
      const submitData = { ...formData, isPublished: true };
      submitData.creditCostPerTest = submitData.creditCostPerTest !== '' ? Number(submitData.creditCostPerTest) : null;

      if (isEditing) {
        await assessmentService.updateAssessment(id, submitData);
      } else {
        // Create assessment with all data + bulk create questions in one publish
        const response = await assessmentService.createAssessment(submitData);
        const newId = response.data?.assessment?._id || response.assessment?._id;
        if (!newId) throw new Error('Failed to create assessment');
        if (questions.length > 0) {
          await assessmentService.bulkCreateQuestions(newId, questions);
        }
      }

      toast.success('Assessment published successfully');
      const prefix = orgSlug ? `/o/${orgSlug}` : '';
      navigate(`${prefix}/assessments`);
    } catch (error) {
      console.error('Error publishing assessment:', error);
      toast.error(error.response?.data?.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image must be less than 5MB');
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleBannerUpload = async () => {
    if (!bannerFile || !id) return;
    try {
      setBannerUploading(true);
      const res = await assessmentService.uploadBanner(id, bannerFile);
      setBannerPreview(res.data?.bannerUrl || bannerPreview);
      setBannerFile(null);
      fetchAssessment();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload banner');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleBannerRemove = async () => {
    if (!id || !confirm('Remove this banner image?')) return;
    try {
      await assessmentService.deleteBanner(id);
      setBannerPreview('');
      setBannerFile(null);
      fetchAssessment();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove banner');
    }
  };

const handleAddQuestion = async () => {
 if (!newQuestion.questionText.trim()) {
  toast.warning('Please enter a question');
  return;
 }

 const question = {
   type: newQuestion.type,
   questionText: newQuestion.questionText,
   options: newQuestion.options,
   difficulty: newQuestion.difficulty,
   dimension: newQuestion.dimension,
   marks: newQuestion.marks,
   explanation: newQuestion.explanation,
   order: questions.length + 1,
 };

  if (newQuestion._editId) {
    // Editing existing question
    if (isEditing) {
      try {
        await assessmentService.updateQuestion(id, newQuestion._editId, question);
        fetchQuestions();
      } catch (error) {
        console.error('Error updating question:', error);
        toast.error('Failed to update question');
        return;
      }
    } else {
      setQuestions(questions.map(q => q._id === newQuestion._editId ? { ...q, ...question } : q));
    }
  } else {
    // Adding new question
    if (isEditing) {
      try {
        await assessmentService.createQuestion(id, question);
        fetchQuestions();
      } catch (error) {
        console.error('Error adding question:', error);
        toast.error('Failed to add question');
        return;
      }
    } else {
      question._id = Date.now().toString();
      setQuestions([...questions, question]);
    }
  }

  setNewQuestion({
  type: 'mcq',
  questionText: '',
  options: [
  { text: '', score: 0, isCorrect: false },
  { text: '', score: 0, isCorrect: false },
  { text: '', score: 0, isCorrect: false },
  { text: '', score: 0, isCorrect: false },
  ],
  difficulty: 'moderate',
  dimension: '',
  marks: 1,
  explanation: '',
  });
};

const handleDeleteQuestion = async (questionId) => {
 if (!confirm('Are you sure you want to delete this question?')) return;
 if (isEditing) {
   try {
     await assessmentService.deleteQuestion(id, questionId);
     fetchQuestions();
   } catch (error) {
     console.error('Error deleting question:', error);
     toast.error('Failed to delete question');
   }
  } else {
    setQuestions(questions.filter(q => q._id !== questionId));
  }
  };

// Inline edit: question row becomes editable (PCLA, MBTI, etc.)
const handleEditQuestion = (question) => {
  setEditingId(question._id);
  setEditFormData({
    questionText: question.questionText || '',
    type: question.type || 'mcq',
    dimension: question.dimension || '',
    marks: question.marks || 1,
    options: question.options ? question.options.map(o => ({ ...o })) : [],
  });
};

// Form-based edit: populate the generic add/edit form
const handleFormEdit = (question) => {
  setNewQuestion({
    type: question.type || 'mcq',
    questionText: question.questionText || '',
    trait: question.trait || '',
    direction: question.direction || 'positive',
    options: question.options || [
      { text: '', score: 0, isCorrect: false },
      { text: '', score: 0, isCorrect: false },
      { text: '', score: 0, isCorrect: false },
      { text: '', score: 0, isCorrect: false },
    ],
    difficulty: question.difficulty || 'moderate',
    dimension: question.dimension || '',
    marks: question.marks || 1,
    explanation: question.explanation || '',
    statements: question.statements || [],
    _editId: question._id,
  });
};

const handleInlineEditCancel = () => {
  setEditingId(null);
  setEditFormData(null);
};

const handleInlineEditSave = async () => {
  if (!editFormData || !editingId) return;
  if (isEditing) {
    try {
      await assessmentService.updateQuestion(id, editingId, editFormData);
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
      return;
    }
  } else {
    setQuestions(questions.map(q => q._id === editingId ? { ...q, ...editFormData } : q));
  }
  setEditingId(null);
  setEditFormData(null);
};

const handleAddBig5Question = async () => {
 if (!newQuestion.questionText.trim()) {
  toast.warning('Please enter a question');
  return;
 }
 if (!newQuestion.trait) {
  toast.warning('Please select a trait');
  return;
 }
 if (questions.length >= 50) {
  toast.warning('Maximum 50 questions allowed for Big5');
  return;
 }

 // Validate trait question count
 const traitQuestions = questions.filter(q => q.trait === newQuestion.trait);
 if (traitQuestions.length >= 10) {
  toast.warning(`${BIG5_CONFIG[newQuestion.trait].name} already has 10 questions`);
  return;
 }

 const questionNum = questions.length + 1;
 const big5Question = {
 type: 'rating',
 questionText: newQuestion.questionText,
 trait: newQuestion.trait,
 direction: newQuestion.direction,
 order: questionNum,
 marks: 5,
 options: [
 { text: 'Disagree', score: 1, isCorrect: false },
 { text: 'Slightly Disagree', score: 2, isCorrect: false },
 { text: 'Neutral', score: 3, isCorrect: false },
 { text: 'Slightly Agree', score: 4, isCorrect: false },
 { text: 'Agree', score: 5, isCorrect: false }
 ],
 difficulty: 'moderate',
 dimension: newQuestion.trait,
 isRequired: true,
 explanation: `This question measures ${BIG5_CONFIG[newQuestion.trait].name}.`,
 tags: [newQuestion.trait.toLowerCase(), 'big5', 'personality']
 };

  if (isEditing) {
    try {
      await assessmentService.createQuestion(id, big5Question);
      fetchQuestions();
    } catch (error) {
      console.error('Error adding Big5 question:', error);
      toast.error(error.response?.data?.message || 'Failed to add question');
      return;
    }
  } else {
    big5Question._id = Date.now().toString();
    setQuestions([...questions, big5Question]);
  }
  };

  // Self-populate question based on current position and selected trait
const handleSelfPopulate = () => {
 const questionNum = questions.length + 1;
 if (questionNum > 50) {
  toast.warning('All 50 questions have been added');
  return;
 }

 const predefined = PREDEFINED_BIG5_QUESTIONS[questionNum];
 if (!predefined) {
  toast.warning('No predefined question available for this position');
  return;
 }

 // Auto-select the trait and populate the question
 setNewQuestion({
 ...newQuestion,
 type: 'rating',
 questionText: predefined.text,
 trait: predefined.trait,
 direction: predefined.direction,
 });
 };

 // Queue all remaining predefined questions for batch submission
  // Queue all remaining predefined questions for batch submission
  const handlePopulateAll = async () => {
    const startNum = questions.length + 1;
    if (startNum > 50) {
      toast.warning('All questions already added');
      return;
    }

    if (!confirm(`This will automatically add all remaining ${50 - questions.length} predefined questions. Continue?`)) {
      return;
    }

    setSaving(true);
    try {
      const questionsToCreate = [];
      for (let i = startNum; i <= 50; i++) {
        const predefined = PREDEFINED_BIG5_QUESTIONS[i];
        if (predefined) {
          questionsToCreate.push({
            type: 'rating',
            questionText: predefined.text,
            trait: predefined.trait,
            direction: predefined.direction,
            order: i,
            marks: 5,
            options: [
              { text: 'Disagree', score: 1, isCorrect: false },
              { text: 'Slightly Disagree', score: 2, isCorrect: false },
              { text: 'Neutral', score: 3, isCorrect: false },
              { text: 'Slightly Agree', score: 4, isCorrect: false },
              { text: 'Agree', score: 5, isCorrect: false }
            ],
            difficulty: 'moderate',
            dimension: predefined.trait,
            isRequired: true,
            explanation: `This question measures ${BIG5_CONFIG[predefined.trait].name}.`,
            tags: [predefined.trait.toLowerCase(), 'big5', 'personality']
          });
        }
      }

      if (questionsToCreate.length > 0) {
        if (isEditing) {
          await assessmentService.bulkCreateQuestions(id, questionsToCreate);
          fetchQuestions();
        } else {
          const withIds = questionsToCreate.map((q, i) => ({ ...q, _id: Date.now() + i }));
          setQuestions([...questions, ...withIds]);
        }
        toast.success(`Successfully added ${questionsToCreate.length} questions.`);
      }
    } catch (error) {
      console.error('Error in bulk create Big5:', error);
      toast.error(error.response?.data?.message || 'Failed to add questions');
    } finally {
      setSaving(false);
    }
  };


 // ========== DISC Question Handlers ==========

 // Self-populate DISC question based on current position
const handleDiscSelfPopulate = () => {
 const questionNum = questions.length + 1;
 if (questionNum > 24) {
  toast.warning('All 24 DISC questions have been added');
  return;
 }

 const predefined = PREDEFINED_DISC_QUESTIONS[questionNum];
 if (!predefined) {
  toast.warning('No predefined question available for this position');
  return;
 }

 // Auto-populate the question with predefined data
 setNewQuestion({
 ...newQuestion,
 type: 'disc-ranking',
 questionText: predefined.questionText,
 statements: predefined.statements,
 });
 };

 // Queue all remaining DISC questions for batch submission
  // Queue all remaining DISC questions for batch submission
  const handleDiscPopulateAll = async () => {
    const startNum = questions.length + 1;
    if (startNum > 24) {
      toast.warning('All questions already added');
      return;
    }

    if (!confirm(`This will automatically add all remaining ${24 - questions.length} predefined DISC questions. Continue?`)) {
      return;
    }

    setSaving(true);
    try {
      const questionsToCreate = [];
      for (let i = startNum; i <= 24; i++) {
        const predefined = PREDEFINED_DISC_QUESTIONS[i];
        if (predefined) {
          questionsToCreate.push({
            type: 'disc-ranking',
            questionText: predefined.questionText,
            statements: predefined.statements.map(s => ({
              text: s.text,
              trait: s.trait,
              score: 4
            })),
            options: predefined.statements.map((s, idx) => ({
              text: s.text,
              trait: s.trait,
              order: idx,
              score: 0
            })),
            order: i,
            marks: 10,
            difficulty: 'basic',
            category: 'personality',
            dimension: 'DISC',
            isRequired: true,
            explanation: `This question measures ${predefined.statements.map(s => s.trait).join(', ')} tendencies.`,
            tags: ['disc', 'personality', 'behavioral']
          });
        }
      }

      if (questionsToCreate.length > 0) {
        if (isEditing) {
          await assessmentService.bulkCreateQuestions(id, questionsToCreate);
          fetchQuestions();
        } else {
          const withIds = questionsToCreate.map((q, i) => ({ ...q, _id: Date.now() + i }));
          setQuestions([...questions, ...withIds]);
        }
        toast.success(`Successfully added ${questionsToCreate.length} questions.`);
      }
    } catch (error) {
      console.error('Error in bulk create DISC:', error);
      toast.error(error.response?.data?.message || 'Failed to add questions');
    } finally {
      setSaving(false);
    }
  };

  // ========== PCLA Question Handlers ==========
  const handlePclaPopulateAll = async () => {
    if (questions.length >= 35) {
      toast.warning('All 35 PCLA questions are already loaded');
      return;
    }
    if (!confirm('This will load all 35 pre-configured PCLA™ questions from the question bank. Continue?')) return;

    setSaving(true);
    try {
      const { PCLA_QUESTIONS } = await import('../../data/pclaQuestions');
      const questionsToCreate = PCLA_QUESTIONS.slice(questions.length).map(q => ({
        type: 'mcq',
        questionText: q.scenario,
        order: q.order,
        dimension: q.dimension,
        marks: q.options.reduce((m, o) => Math.max(m, o.weight), 0),
        difficulty: 'moderate',
        isRequired: true,
        options: q.options.map(o => ({
          text: o.text,
          score: o.weight,
          isCorrect: o.weight === q.options.reduce((m, op) => Math.max(m, op.weight), 0),
        })),
        tags: ['pcla', 'coachability', q.dimension.toLowerCase().replace(/[^a-z0-9]/g, '-')],
        explanation: `This question measures ${q.dimension}.`,
      }));

      if (isEditing) {
        await assessmentService.bulkCreateQuestions(id, questionsToCreate);
        fetchQuestions();
      } else {
        const withIds = questionsToCreate.map((q, i) => ({ ...q, _id: Date.now() + i }));
        setQuestions(prev => [...prev, ...withIds]);
      }
      toast.success(`Loaded ${questionsToCreate.length} PCLA™ questions successfully.`);
    } catch (error) {
      console.error('Error loading PCLA questions:', error);
      toast.error('Failed to load PCLA questions. Make sure the question bank file exists.');
    } finally {
      setSaving(false);
    }
  };

  const handleMbtiPopulateAll = async () => {
    if (questions.length >= 32) {
      toast.warning('All 32 MBTI questions are already loaded');
      return;
    }
    if (!confirm('This will add all 32 predefined MBTI questions. Continue?')) return;

    setSaving(true);
    try {
      const MBTI_DIMENSIONS = [
        { key: 'EI', templates: [
          { left: 'I enjoy being the center of attention', right: 'I prefer to stay in the background' },
          { left: 'I talk more than I listen', right: 'I listen more than I talk' },
          { left: 'I feel energized by social interactions', right: 'I feel drained by social interactions' },
          { left: 'I prefer working in groups', right: 'I prefer working alone' },
          { left: 'I am outgoing and sociable', right: 'I am reserved and private' },
          { left: 'I express myself easily', right: 'I keep my thoughts to myself' },
          { left: 'I enjoy meeting new people', right: 'I prefer familiar people' },
          { left: 'I am comfortable in large groups', right: 'I am comfortable in small groups' },
        ]},
        { key: 'SN', templates: [
          { left: 'I focus on concrete facts', right: 'I focus on possibilities' },
          { left: 'I trust experience', right: 'I trust instincts' },
          { left: 'I am practical and realistic', right: 'I am imaginative and theoretical' },
          { left: 'I notice details', right: 'I see the big picture' },
          { left: 'I learn by doing', right: 'I learn by thinking' },
          { left: 'I remember what I see', right: 'I remember what I imagine' },
          { left: 'I prefer concrete information', right: 'I prefer abstract concepts' },
          { left: 'I am conventional', right: 'I am innovative' },
        ]},
        { key: 'TF', templates: [
          { left: 'I make decisions with my head', right: 'I make decisions with my heart' },
          { left: 'I value truth', right: 'I value harmony' },
          { left: 'I am analytical', right: 'I am emotional' },
          { left: 'I am objective', right: 'I am subjective' },
          { left: 'I prefer fairness', right: 'I prefer compassion' },
          { left: 'I use logic', right: 'I use values' },
          { left: 'I am tough-minded', right: 'I am sensitive' },
          { left: 'I question others emotions', right: 'I understand others emotions' },
        ]},
        { key: 'JP', templates: [
          { left: 'I like planned activities', right: 'I like flexible activities' },
          { left: 'I prefer structure', right: 'I prefer spontaneity' },
          { left: 'I am organized', right: 'I am flexible' },
          { left: 'I follow schedules', right: 'I go with the flow' },
          { left: 'I am punctual', right: 'I am relaxed about time' },
          { left: 'I make lists', right: 'I go with the moment' },
          { left: 'I expect closure', right: 'I keep options open' },
          { left: 'I follow rules', right: 'I make my own rules' },
        ]},
      ];

      const questionsToCreate = [];
      let order = 1;
      MBTI_DIMENSIONS.forEach(dim => {
        dim.templates.forEach(t => {
          questionsToCreate.push({
            type: 'mcq',
            questionText: `Which statement describes you better?\nA) ${t.left}\nB) ${t.right}`,
            options: [
              { text: t.left, score: 1, isCorrect: false },
              { text: t.right, score: 1, isCorrect: false },
            ],
            difficulty: 'basic',
            dimension: `MBTI-${dim.key}`,
            marks: 1,
            order: order++,
            tags: ['mbti', 'personality', dim.key.toLowerCase()],
            isRequired: true,
          });
        });
      });

      if (isEditing) {
        await assessmentService.bulkCreateQuestions(id, questionsToCreate);
        fetchQuestions();
      } else {
        const withIds = questionsToCreate.map((q, i) => ({ ...q, _id: Date.now() + i }));
        setQuestions(prev => [...prev, ...withIds]);
      }
      toast.success(`Loaded all 32 MBTI questions successfully.`);
    } catch (error) {
      console.error('Error loading MBTI questions:', error);
      toast.error('Failed to load MBTI questions');
    } finally {
      setSaving(false);
    }
  };

  // Add DISC question
const handleAddDiscQuestion = async () => {
 if (!newQuestion.questionText.trim()) {
  toast.warning('Please enter a question');
  return;
 }
 if (!newQuestion.statements || newQuestion.statements.length !== 4) {
  toast.warning('DISC questions require exactly 4 statements');
  return;
 }
 if (questions.length >= 24) {
  toast.warning('Maximum 24 questions allowed for DISC');
  return;
 }

 const questionNum = questions.length + 1;
 const discQuestion = {
 type: 'disc-ranking',
 questionText: newQuestion.questionText,
 statements: newQuestion.statements.map(s => ({
 text: s.text,
 trait: s.trait,
 score: 4
 })),
 options: newQuestion.statements.map((s, idx) => ({
 text: s.text,
 trait: s.trait,
 order: idx,
 score: 0
 })),
 order: questionNum,
 marks: 10,
 difficulty: 'basic',
 category: 'personality',
 dimension: 'DISC',
 isRequired: true,
 explanation: `This question measures ${newQuestion.statements.map(s => s.trait).join(', ')} tendencies.`,
 tags: ['disc', 'personality', 'behavioral']
 };

  if (isEditing) {
    try {
      await assessmentService.createQuestion(id, discQuestion);
      fetchQuestions();
    } catch (error) {
      console.error('Error adding DISC question:', error);
      toast.error(error.response?.data?.message || 'Failed to add question');
      return;
    }
  } else {
    discQuestion._id = Date.now().toString();
    setQuestions([...questions, discQuestion]);
  }
  };


 const updateOption = (index, field, value) => {
 const updatedOptions = [...newQuestion.options];
 updatedOptions[index] = { ...updatedOptions[index], [field]: value };
 setNewQuestion({ ...newQuestion, options: updatedOptions });
 };

 const addOption = () => {
 setNewQuestion({
 ...newQuestion,
 options: [...newQuestion.options, { text: '', score: 0, isCorrect: false }],
 });
 };

const removeOption = (index) => {
  if (newQuestion.options.length <= 2) {
  toast.warning('Minimum 2 options required');
  return;
  }
 const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
 setNewQuestion({ ...newQuestion, options: updatedOptions });
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
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <button
 onClick={() => {
   const prefix = orgSlug ? `/o/${orgSlug}` : '';
   navigate(`${prefix}/assessments`);
 }}
 className="p-2 text-gray-500 hover:text-gray-700 "
 >
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">
 {isEditing ? 'Edit Assessment' : 'Create Assessment'}
 </h1>
 <p className="text-gray-500 ">
 {isEditing ? 'Update assessment details and questions' : 'Create a new assessment'}
 </p>
 </div>
 </div>
  <div className="flex items-center gap-2">
        {/* Save button — always visible */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>

        {/* Next / Publish button — context-aware */}
        {activeTab === 'settings' ? (
          <button
            onClick={handlePublish}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4 mr-2" />
            {saving ? 'Publishing...' : 'Publish Assessment'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={saving || (!formData.title.trim() && activeTab === 'details')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : activeTab === 'details' ? 'Next' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
      </div>

 {/* Tabs */}
 <div className="border-b border-gray-200 ">
 <nav className="flex gap-8">
 <button
 onClick={() => setActiveTab('details')}
 className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
 activeTab === 'details'
 ? 'border-indigo-600 text-indigo-600 '
 : 'border-transparent text-gray-500 hover:text-gray-700 '
 }`}
 >
<span className="flex items-center gap-2">
  <FileText className="w-4 h-4" />
  Details
  </span>
  </button>
  {/* Questions tab — works inline for all types; content adapts to category */}
   <button
   onClick={() => setActiveTab('questions')}
   className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
     activeTab === 'questions'
     ? 'border-indigo-600 text-indigo-600 '
     : 'border-transparent text-gray-500 hover:text-gray-700 '
   }`}
   >
   <span className="flex items-center gap-2">
   <AlertCircle className="w-4 h-4" />
   Questions ({questions.length})
   </span>
   </button>
   <button
 onClick={() => setActiveTab('settings')}
 className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
 activeTab === 'settings'
 ? 'border-indigo-600 text-indigo-600 '
 : 'border-transparent text-gray-500 hover:text-gray-700 '
 }`}
 >
 <span className="flex items-center gap-2">
 <Settings className="w-4 h-4" />
 Settings
 </span>
 </button>
 </nav>
 </div>

 {/* Content */}
 <div className="bg-white rounded-xl border border-gray-200 p-6">
  {activeTab === 'details' && (
 <div className="space-y-6 max-w-2xl">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Title <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={formData.title}
 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Enter assessment title"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Description
 </label>
 <textarea
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 rows={3}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
  placeholder="Describe the assessment purpose"
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
   Banner Image <span className="text-gray-400 font-normal">(optional)</span>
  </label>
  {bannerPreview ? (
   <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
    <img src={bannerPreview} alt="Banner preview" className="w-full h-40 object-cover" />
    <div className="absolute top-2 right-2 flex gap-2">
     <button
      type="button"
      onClick={() => document.getElementById('banner-upload').click()}
      className="p-2 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
      title="Change banner"
     >
      <Upload className="w-4 h-4 text-gray-600" />
     </button>
     <button
      type="button"
      onClick={handleBannerRemove}
      className="p-2 bg-white rounded-lg shadow hover:bg-red-50 transition-colors"
      title="Remove banner"
     >
      <X className="w-4 h-4 text-red-600" />
     </button>
    </div>
    {bannerFile && (
     <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
      <span className="text-sm text-indigo-700">New image selected: {bannerFile.name}</span>
      <button
       type="button"
       onClick={handleBannerUpload}
       disabled={bannerUploading}
       className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
       {bannerUploading ? 'Uploading...' : 'Upload'}
      </button>
     </div>
    )}
   </div>
  ) : (
   <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
    <Image className="w-8 h-8 text-gray-400 mb-2" />
    <span className="text-sm text-gray-500">Click to upload banner image</span>
    <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB</span>
    <input
     id="banner-upload"
     type="file"
     accept="image/*"
     onChange={handleBannerChange}
     className="hidden"
    />
   </label>
  )}
  </div>

  <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Category <span className="text-red-500">*</span>
 </label>
 <select
 value={formData.category}
 onChange={(e) => {
   const category = e.target.value;
   setFormData({
     ...formData,
     category,
     subCategory: '' // Reset subcategory when category changes
   });
 }}
className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
  >
  <option value="psychometric">Psychometric</option>
  <option value="personality">Personality</option>
  <option value="cognitive">Cognitive</option>
  <option value="aptitude">Aptitude</option>
  <option value="situational">Situational</option>
  <option value="professional">Professional</option>
  </select>
 {formData.category === 'big5' && (
 <p className="mt-1 text-xs text-amber-600 ">
 <AlertCircle className="w-3 h-3 inline mr-1" />
 Big5 uses a locked 50-question structure with official scoring formulas. Questions and scoring cannot be modified.
 </p>
 )}
 {formData.category === 'disc' && (
 <p className="mt-1 text-xs text-amber-600 ">
 <AlertCircle className="w-3 h-3 inline mr-1" />
 DISC uses a locked 28-question structure with official scoring formulas. Questions and scoring cannot be modified.
 </p>
 )}
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Difficulty
 </label>
 <select
 value={formData.difficulty}
 onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="basic">Basic</option>
 <option value="moderate">Moderate</option>
 <option value="tough">Tough</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Sub Category
 </label>
 {SUBCATEGORY_MAP[formData.category] ? (
 <select
 value={formData.subCategory}
  onChange={(e) => {
    const sub = e.target.value;
    let configOverrides = {};
    if (sub === 'PCLA') {
      configOverrides = { isLockedStructure: true, isEditable: false, totalQuestions: 35, duration: 25, randomizeQuestions: false, randomizeOptions: false };
    } else if (sub === 'Big5') {
      configOverrides = { isLockedStructure: true, isEditable: false, totalQuestions: 50, randomizeQuestions: false, randomizeOptions: false };
    } else if (sub === 'DISC') {
      configOverrides = { isLockedStructure: true, isEditable: false, totalQuestions: 24, randomizeQuestions: false, randomizeOptions: false };
    }
    setFormData({ ...formData, subCategory: sub, ...configOverrides });
  }}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 >
 <option value="">Select Sub Category</option>
  {SUBCATEGORY_MAP[formData.category].map((sub) => (
              <option key={sub} value={sub}>{SUBCATEGORY_LABELS[sub] || sub}</option>
              ))}
 </select>
 ) : (
 <input
 type="text"
 value={formData.subCategory}
 onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="e.g., DISC, MBTI, Numerical Reasoning"
 />
 )}
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Purpose
 </label>
 <input
 type="text"
 value={formData.purpose}
 onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="What is this assessment for?"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Target Audience
 </label>
 <input
 type="text"
 value={formData.audience}
 onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Who should take this assessment?"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Instructions
 </label>
 <textarea
 value={formData.instructions}
 onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
 rows={4}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Instructions for test takers"
 />
 </div>
 </div>
 )}

  {activeTab === 'questions' && formData.category === 'personality' && formData.subCategory === 'Big5' && (
  <div className="space-y-6">
  {/* Big5 Structure Info */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-blue-100 rounded-lg">
 <Info className="w-6 h-6 text-blue-600 " />
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-medium text-blue-900 mb-2">
 Big Five Personality Test Structure
 </h3>
 <p className="text-blue-800 mb-4">
 You can customize the 50 questions while maintaining the official scoring formula.
 Each trait requires exactly 10 questions with specific positions.
 </p>

 {/* Trait Question Counts */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
 {[
 { trait: 'E', name: 'Extraversion', color: 'indigo', pos: [1,11,21,31,41], neg: [6,16,26,36,46] },
 { trait: 'A', name: 'Agreeableness', color: 'green', pos: [7,17,27,37,42,47], neg: [2,12,22,32] },
 { trait: 'C', name: 'Conscientiousness', color: 'blue', pos: [3,13,23,33,43,48], neg: [8,18,28,38] },
 { trait: 'N', name: 'Neuroticism', color: 'red', pos: [9,19], neg: [4,14,24,29,34,39,44,49] },
 { trait: 'O', name: 'Openness', color: 'purple', pos: [5,15,25,35,40,45,50], neg: [10,20,30] }
 ].map(({ trait, name, color, pos, neg }) => {
 const traitQuestions = questions.filter(q => q.trait === trait);
 const posCount = traitQuestions.filter(q => q.direction === 'positive').length;
 const negCount = traitQuestions.filter(q => q.direction === 'negative').length;
 const isComplete = traitQuestions.length === 10 && pos.length === posCount && neg.length === negCount;
 return (
 <div key={trait} className={`bg-white rounded-lg p-3 text-center border-2 ${isComplete ? 'border-green-500' : 'border-gray-200 '}`}>
 <div className={`font-semibold text-${color}-600`}>{traitQuestions.length}/10</div>
 <div className="text-gray-600 text-xs">{name}</div>
 <div className="text-xs text-gray-500 mt-1">
 +{posCount}/-{negCount}
 </div>
 </div>
 );
 })}
 </div>

 {/* Validation Message */}
 {(() => {
 const traitCounts = { E: 0, A: 0, C: 0, N: 0, O: 0 };
 questions.forEach(q => { if (traitCounts[q.trait] !== undefined) traitCounts[q.trait]++; });
 const allComplete = Object.values(traitCounts).every(c => c === 10);
 return allComplete ? (
 <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
 <CheckCircle className="w-5 h-5" />
 <span>All 50 questions configured correctly!</span>
 </div>
 ) : (
 <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
 <AlertCircle className="w-5 h-5" />
 <span>Add {50 - questions.length} more questions to complete the assessment</span>
 </div>
 );
 })()}
 </div>
 </div>
 </div>

 {/* Add New Big5 Question */}
 {questions.length < 50 && (
 <div className="bg-gray-50 rounded-lg p-4">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-medium text-gray-900 ">
 Add Big5 Question ({questions.length + 1} of 50)
 </h3>
 <div className="flex gap-2">
 <button
 onClick={handleSelfPopulate}
 className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
 title="Auto-fill with predefined question for this position"
 >
 <Sparkles className="w-4 h-4 mr-1.5" />
 Auto-fill Q{questions.length + 1}
 </button>
                <button
                  onClick={handlePopulateAll}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                  title="Automatically add all remaining predefined Big5 questions"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add All Questions ({50 - questions.length})
                </button>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm text-gray-700 mb-1">Question Text</label>
 <textarea
 value={newQuestion.questionText}
 onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
 rows={2}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 placeholder="Enter your question"
 />
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-sm text-gray-700 mb-1">
 Trait (Question {questions.length + 1})
 </label>
 <select
 value={newQuestion.trait || ''}
 onChange={(e) => {
 const trait = e.target.value;
 const questionNum = questions.length + 1;
 // Auto-determine direction based on question number and trait
 const direction = getBig5Direction(questionNum, trait);
 setNewQuestion({
 ...newQuestion,
 trait,
 direction,
 type: 'rating'
 });
 }}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 >
 <option value="">Select Trait</option>
 <option value="E">Extraversion (E)</option>
 <option value="A">Agreeableness (A)</option>
 <option value="C">Conscientiousness (C)</option>
 <option value="N">Neuroticism (N)</option>
 <option value="O">Openness (O)</option>
 </select>
 </div>
 <div>
 <label className="block text-sm text-gray-700 mb-1">Direction</label>
 <select
 value={newQuestion.direction || 'positive'}
 onChange={(e) => setNewQuestion({ ...newQuestion, direction: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 >
 <option value="positive">Positive (Add to score)</option>
 <option value="negative">Negative (Subtract from score)</option>
 </select>
 </div>
 <div>
 <label className="block text-sm text-gray-700 mb-1">Question #</label>
 <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900 ">
 {questions.length + 1}
 </div>
 </div>
 </div>

 {/* Required Positions Info */}
 {newQuestion.trait && (
 <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
 {(() => {
 const traitConfig = {
 E: { pos: [1,11,21,31,41], neg: [6,16,26,36,46] },
 A: { pos: [7,17,27,37,42,47], neg: [2,12,22,32] },
 C: { pos: [3,13,23,33,43,48], neg: [8,18,28,38] },
 N: { pos: [9,19], neg: [4,14,24,29,34,39,44,49] },
 O: { pos: [5,15,25,35,40,45,50], neg: [10,20,30] }
 };
 const config = traitConfig[newQuestion.trait];
 const currentPos = questions.filter(q => q.trait === newQuestion.trait && q.direction === 'positive').length;
 const currentNeg = questions.filter(q => q.trait === newQuestion.trait && q.direction === 'negative').length;
 return (
 <div>
 <strong>Required for {newQuestion.trait}:</strong>
 <br/>Positive questions at positions: {config.pos.join(', ')} ({currentPos}/{config.pos.length} added)
 <br/>Negative questions at positions: {config.neg.join(', ')} ({currentNeg}/{config.neg.length} added)
 </div>
 );
 })()}
 </div>
 )}

 <button
 onClick={handleAddBig5Question}
 disabled={!newQuestion.questionText.trim() || !newQuestion.trait || questions.length >= 50}
 className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Add Question {questions.length + 1}
 </button>
 </div>
 </div>
 )}

 {/* Questions List */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-gray-900 ">
 Questions ({questions.length}/50)
 </h3>
 {questions.map((question, index) => (
 <div
 key={question._id}
 className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
 >
 <div className="flex items-center gap-2 text-gray-400">
 <span className="text-sm font-medium w-6">{index + 1}</span>
 </div>
 <div className="flex-1">
 <p className="text-sm text-gray-900 ">{question.questionText}</p>
 <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
 <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
 {question.trait === 'E' ? 'Extraversion' :
 question.trait === 'A' ? 'Agreeableness' :
 question.trait === 'C' ? 'Conscientiousness' :
 question.trait === 'N' ? 'Neuroticism' : 'Openness'}
 </span>
 <span className={question.direction === 'positive' ? 'text-green-600' : 'text-red-600'}>
 {question.direction === 'positive' ? '+' : '-'}
 </span>
 </div>
 </div>
 <button
 onClick={() => handleDeleteQuestion(question._id)}
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

  {activeTab === 'questions' && formData.category === 'psychometric' && formData.subCategory === 'DISC' && (
  <div className="space-y-6">
  {/* DISC Structure Info */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-blue-100 rounded-lg">
 <Info className="w-6 h-6 text-blue-600 " />
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-medium text-blue-900 mb-2">
 DISC Personality Assessment Structure
 </h3>
 <p className="text-blue-800 mb-4">
 You can customize the 24 questions while maintaining the official DISC scoring formula.
 Each question has 4 statements representing D, I, S, and C traits.
 </p>

 {/* Trait Info */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
 {[
 { trait: 'D', name: 'Dominance', color: 'red', desc: 'Direct, Results-oriented' },
 { trait: 'I', name: 'Influence', color: 'amber', desc: 'Outgoing, Enthusiastic' },
 { trait: 'S', name: 'Steadiness', color: 'green', desc: 'Patient, Humble' },
 { trait: 'C', name: 'Conscientiousness', color: 'blue', desc: 'Analytical, Precise' }
 ].map(({ trait, name, color, desc }) => (
 <div key={trait} className="bg-white rounded-lg p-3 text-center border-2 border-gray-200 ">
 <div className={`font-bold text-${color}-600 text-lg`}>{trait}</div>
 <div className="text-gray-600 text-xs">{name}</div>
 <div className="text-xs text-gray-500 mt-1">{desc}</div>
 </div>
 ))}
 </div>

 {/* Validation Message */}
 {questions.length === 24 ? (
 <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
 <CheckCircle className="w-5 h-5" />
 <span>All 24 DISC questions configured correctly!</span>
 </div>
 ) : (
 <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
 <AlertCircle className="w-5 h-5" />
 <span>Add {24 - questions.length} more questions to complete the assessment</span>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Add New DISC Question */}
 {questions.length < 24 && (
 <div className="bg-gray-50 rounded-lg p-4">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-medium text-gray-900 ">
 Add DISC Question ({questions.length + 1} of 24)
 </h3>
 <div className="flex gap-2">
 <button
 onClick={handleDiscSelfPopulate}
 className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
 title="Auto-fill with predefined question for this position"
 >
 <Sparkles className="w-4 h-4 mr-1.5" />
 Auto-fill Q{questions.length + 1}
 </button>
                <button
                  onClick={handleDiscPopulateAll}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                  title="Automatically add all remaining predefined DISC questions"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add All Questions ({24 - questions.length})
                </button>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm text-gray-700 mb-1">Question Text</label>
 <textarea
 value={newQuestion.questionText}
 onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
 rows={2}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 placeholder="Enter your question"
 />
 </div>

 {/* Statements */}
 <div className="space-y-3">
 <label className="block text-sm text-gray-700 ">Statements (4 required - D, I, S, C)</label>
 {(newQuestion.statements || []).map((statement, idx) => (
 <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 ">
 <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
 statement.trait === 'D' ? 'bg-red-500' :
 statement.trait === 'I' ? 'bg-amber-500' :
 statement.trait === 'S' ? 'bg-green-500' : 'bg-blue-500'
 }`}>
 {statement.trait}
 </span>
 <span className="flex-1 text-gray-700 text-sm">{statement.text}</span>
 </div>
 ))}
 {(!newQuestion.statements || newQuestion.statements.length === 0) && (
 <p className="text-sm text-gray-500 italic">Click "Auto-fill Q{questions.length + 1}" to populate statements</p>
 )}
 </div>

 <button
 onClick={handleAddDiscQuestion}
 disabled={!newQuestion.questionText.trim() || !newQuestion.statements || newQuestion.statements.length !== 4 || questions.length >= 24}
 className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Add Question {questions.length + 1}
 </button>
 </div>
 </div>
 )}

 {/* Questions List */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-gray-900 ">
 Questions ({questions.length}/24)
 </h3>
 {questions.map((question, index) => (
 <div
 key={question._id}
 className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
 >
 <div className="flex items-center gap-2 text-gray-400">
 <span className="text-sm font-medium w-6">{index + 1}</span>
 </div>
 <div className="flex-1">
 <p className="text-sm text-gray-900 ">{question.questionText}</p>
 <div className="flex items-center gap-2 mt-2">
 {question.statements?.map((s, i) => (
 <span key={i} className={`px-2 py-1 text-xs rounded ${
 s.trait === 'D' ? 'bg-red-100 text-red-700 ' :
 s.trait === 'I' ? 'bg-amber-100 text-amber-700 ' :
 s.trait === 'S' ? 'bg-green-100 text-green-700 ' :
 'bg-blue-100 text-blue-700 '
 }`}>
 {s.trait}
 </span>
 ))}
 </div>
 </div>
 <button
 onClick={() => handleDeleteQuestion(question._id)}
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

  {/* ── PCLA Questions Panel ── */}
  {activeTab === 'questions' && formData.category === 'professional' && formData.subCategory === 'PCLA' && (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg flex-shrink-0">
            <Info className="w-6 h-6 text-emerald-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">
              Professional Coachability &amp; Learning Agility Index (PCLA™)
            </h3>
            <p className="text-emerald-800 text-sm mb-4">
              PCLA™ uses a fixed 35-scenario question bank measuring 8 coachability dimensions.
              The questions are pre-validated and locked — use the button below to load them all at once.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              {[
                { dim: 'Coachability', color: 'emerald', count: 5 },
                { dim: 'Learning Orientation', color: 'purple', count: 5 },
                { dim: 'Unlearning Ability', color: 'amber', count: 4 },
                { dim: 'Technology Adaptability', color: 'cyan', count: 4 },
                { dim: 'Reflection & Self-awareness', color: 'pink', count: 5 },
                { dim: 'Growth Drive', color: 'red', count: 4 },
                { dim: 'Adaptability to Coaching', color: 'indigo', count: 4 },
                { dim: 'Emotional Coachability', color: 'orange', count: 4 },
              ].map(({ dim, count }) => (
                <div key={dim} className="bg-white rounded-lg p-2 text-center border border-emerald-100">
                  <div className="font-bold text-emerald-700">{count}Q</div>
                  <div className="text-gray-600 text-xs mt-0.5 leading-tight">{dim}</div>
                </div>
              ))}
            </div>
            {questions.length === 35 ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>All 35 PCLA™ questions loaded and ready!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{35 - questions.length} questions remaining — click &ldquo;Load All Questions&rdquo; below</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Load button */}
      {questions.length < 35 && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Questions loaded: {questions.length} / 35</p>
            <p className="text-xs text-gray-500 mt-0.5">All 35 scenarios will be added in the correct order</p>
          </div>
          <button
            onClick={handlePclaPopulateAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Loading...' : `Load All ${35 - questions.length} Questions`}
          </button>
        </div>
      )}

      {/* Load button */}
      {questions.length < 35 && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Questions loaded: {questions.length} / 35</p>
            <p className="text-xs text-gray-500 mt-0.5">All 35 scenarios will be added in the correct order</p>
          </div>
          <button
            onClick={handlePclaPopulateAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Loading...' : `Load All ${35 - questions.length} Questions`}
          </button>
        </div>
      )}

      {/* Questions list with inline edit */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Loaded Questions ({questions.length}/35)</h3>
          {questions.map((q, idx) => (
            editingId === q._id && editFormData ? (
              /* Inline edit mode for this question */
              <div key={q._id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{idx + 1}</span>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={editFormData.questionText}
                    onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="text">Text</option>
                      <option value="rating">Rating</option>
                    </select>
                    <input
                      type="text"
                      value={editFormData.dimension}
                      onChange={(e) => setEditFormData({ ...editFormData, dimension: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                      placeholder="Dimension"
                    />
                    <input
                      type="number"
                      value={editFormData.marks}
                      onChange={(e) => setEditFormData({ ...editFormData, marks: parseInt(e.target.value) || 1 })}
                      className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                      min="1"
                    />
                  </div>
                  {editFormData.type === 'mcq' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600">Options</label>
                      {editFormData.options?.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...editFormData.options];
                              updated[oi] = { ...updated[oi], text: e.target.value };
                              setEditFormData({ ...editFormData, options: updated });
                            }}
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                            placeholder={`Option ${oi + 1}`}
                          />
                          <input
                            type="number"
                            value={opt.score}
                            onChange={(e) => {
                              const updated = [...editFormData.options];
                              updated[oi] = { ...updated[oi], score: parseInt(e.target.value) || 0 };
                              setEditFormData({ ...editFormData, options: updated });
                            }}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                            placeholder="Score"
                          />
                          <button
                            onClick={() => {
                              if (editFormData.options.length <= 2) { toast.warning('Minimum 2 options required'); return; }
                              setEditFormData({ ...editFormData, options: editFormData.options.filter((_, i) => i !== oi) });
                            }}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditFormData({ ...editFormData, options: [...editFormData.options, { text: '', score: 0, isCorrect: false }] })}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Option
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={handleInlineEditSave} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                      <Save className="w-3.5 h-3.5 mr-1 inline" />
                      Save
                    </button>
                    <button onClick={handleInlineEditCancel} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal display mode */
              <div key={q._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{q.questionText}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {q.dimension && (
                      <span className="inline-block text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-0.5">{q.dimension}</span>
                    )}
                    <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5 capitalize">{q.type}</span>
                    <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                  {q.options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {q.options.map((opt, oi) => (
                        <span key={oi} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                          {opt.text}
                          {opt.score !== undefined && <span className="ml-1 text-gray-400">({opt.score})</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEditQuestion(q)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg flex-shrink-0" title="Edit question">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteQuestion(q._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0" title="Delete question">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
     </div>
   )}

     {activeTab === 'questions' && questionsLoading && !(formData.category === 'personality' && formData.subCategory === 'Big5') && !(formData.category === 'psychometric' && formData.subCategory === 'DISC') && !(formData.category === 'professional' && formData.subCategory === 'PCLA') && (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )}

    {activeTab === 'questions' && !questionsLoading && formData.category === 'psychometric' && formData.subCategory === 'MBTI' && (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-blue-900 mb-2">MBTI Assessment Structure</h3>
              <p className="text-blue-800 text-sm mb-4">
                MBTI uses 32 bipolar questions measuring 4 dimensions (8 questions per dimension).
                Each question presents a pair of opposing statements — test takers rate which side resonates more.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                {[
                  { key: 'EI', name: 'Extraversion vs Introversion', color: 'blue' },
                  { key: 'SN', name: 'Sensing vs Intuition', color: 'purple' },
                  { key: 'TF', name: 'Thinking vs Feeling', color: 'green' },
                  { key: 'JP', name: 'Judging vs Perceiving', color: 'amber' },
                ].map(({ key, name }) => (
                  <div key={key} className="bg-white rounded-lg p-3 text-center border border-blue-100">
                    <div className="font-bold text-blue-600">{key}</div>
                    <div className="text-gray-600 text-xs mt-1">{name}</div>
                  </div>
                ))}
              </div>
              {questions.length === 32 ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span>All 32 MBTI questions loaded!</span>
                </div>
              ) : (
                <div className="text-amber-700 bg-amber-100 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Use the button below to load all 32 predefined MBTI questions at once
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Questions loaded: {questions.length} / 32</p>
            <p className="text-xs text-gray-500 mt-0.5">All 32 questions will be added with correct dimension mapping</p>
          </div>
          <button
            onClick={handleMbtiPopulateAll}
            disabled={saving || questions.length >= 32}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Loading...' : `Load All ${32 - questions.length} Questions`}
          </button>
        </div>

      </div>
    )}

    {activeTab === 'questions' && !questionsLoading && !(formData.category === 'personality' && formData.subCategory === 'Big5') && !(formData.category === 'psychometric' && formData.subCategory === 'DISC') && !(formData.category === 'professional' && formData.subCategory === 'PCLA') && (
 <div className="space-y-6">
 {/* Add New Question */}
 <div className="bg-gray-50 rounded-lg p-4">
  <h3 className="text-sm font-medium text-gray-900 mb-4">{newQuestion._editId ? 'Edit Question' : 'Add New Question'}</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-sm text-gray-700 mb-1">Question Text</label>
 <textarea
 value={newQuestion.questionText}
 onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
 rows={2}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 placeholder="Enter your question"
 />
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-sm text-gray-700 mb-1">Type</label>
 <select
 value={newQuestion.type}
 onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 >
 <option value="mcq">Multiple Choice</option>
 <option value="text">Text Answer</option>
 <option value="rating">Rating Scale</option>
 </select>
 </div>
 <div>
 <label className="block text-sm text-gray-700 mb-1">Dimension</label>
 <input
 type="text"
 value={newQuestion.dimension}
 onChange={(e) => setNewQuestion({ ...newQuestion, dimension: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 placeholder="e.g., Dominance"
 />
 </div>
 <div>
 <label className="block text-sm text-gray-700 mb-1">Marks</label>
 <input
 type="number"
 value={newQuestion.marks}
 onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) || 1 })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 min="1"
 />
 </div>
 </div>

 {newQuestion.type === 'mcq' && (
 <div className="space-y-2">
 <label className="block text-sm text-gray-700 ">Options</label>
 {newQuestion.options.map((option, index) => (
 <div key={index} className="flex items-center gap-2">
 <input
 type="text"
 value={option.text}
 onChange={(e) => updateOption(index, 'text', e.target.value)}
 className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 placeholder={`Option ${index + 1}`}
 />
 <input
 type="number"
 value={option.score}
 onChange={(e) => updateOption(index, 'score', parseInt(e.target.value) || 0)}
 className="w-20 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 placeholder="Score"
 />
 <button
 onClick={() => removeOption(index)}
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 <button
 onClick={addOption}
 className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
 >
 <Plus className="w-4 h-4" />
 Add Option
 </button>
 </div>
 )}

  <button
  onClick={handleAddQuestion}
  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
  >
  {newQuestion._editId ? 'Update Question' : 'Add Question'}
  </button>
 </div>
 </div>

 {/* Questions List */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-gray-900 ">
 Questions ({questions.length})
 </h3>
 {questions.map((question, index) => (
 <div
 key={question._id}
 className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
 >
 <div className="flex items-center gap-2 text-gray-400">
 <GripVertical className="w-4 h-4" />
 <span className="text-sm font-medium">{index + 1}</span>
 </div>
  <div className="flex-1">
  <p className="text-sm text-gray-900 ">{question.questionText}</p>
  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
  <span className="capitalize">{question.type}</span>
  {question.dimension && <span>Dimension: {question.dimension}</span>}
  <span>{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
  </div>
  </div>
  <div className="flex items-center gap-1">
  <button
  onClick={() => handleFormEdit(question)}
  className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg"
  title="Edit question"
  >
  <Pencil className="w-4 h-4" />
  </button>
  <button
  onClick={() => handleDeleteQuestion(question._id)}
  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
  >
  <Trash2 className="w-4 h-4" />
  </button>
  </div>
  </div>
  ))}
  </div>
  </div>
  )}

 {activeTab === 'settings' && (
 <div className="space-y-6 max-w-2xl">
 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Time Limit</h3>
 <p className="text-sm text-gray-500 ">Set a time limit for this assessment</p>
 </div>
 <div className="flex items-center gap-4">
 <input
 type="checkbox"
 checked={formData.timeBound.enabled}
 onChange={(e) => setFormData({
 ...formData,
 timeBound: { ...formData.timeBound, enabled: e.target.checked }
 })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 {formData.timeBound.enabled && (
 <input
 type="number"
 value={formData.timeBound.durationMinutes}
 onChange={(e) => setFormData({
 ...formData,
 timeBound: { ...formData.timeBound, durationMinutes: parseInt(e.target.value) || 30 }
 })}
 className="w-24 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 min="1"
 />
 )}
 {formData.timeBound.enabled && <span className="text-sm text-gray-500">minutes</span>}
 </div>
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Passing Score</h3>
 <p className="text-sm text-gray-500 ">Minimum score required to pass</p>
 </div>
 <div className="flex items-center gap-2">
 <input
 type="number"
 value={formData.passingScore}
 onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 0 })}
 className="w-24 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 min="0"
 max="100"
 />
 <span className="text-sm text-gray-500">%</span>
 </div>
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Credit Consumption Per Test</h3>
 <p className="text-sm text-gray-500 ">Override category default cost (leave blank for default)</p>
 </div>
 <div className="flex items-center gap-2">
 <input
 type="number"
 value={formData.creditCostPerTest}
 onChange={(e) => setFormData({ ...formData, creditCostPerTest: e.target.value })}
 className="w-24 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 min="1"
 placeholder="Default"
 />
 <span className="text-sm text-gray-500">credits</span>
 </div>
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Multiple Attempts</h3>
 <p className="text-sm text-gray-500 ">Allow users to retake the assessment</p>
 </div>
 <input
 type="checkbox"
 checked={formData.allowMultipleAttempts}
 onChange={(e) => setFormData({ ...formData, allowMultipleAttempts: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 {formData.allowMultipleAttempts && (
 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Max Attempts</h3>
 <p className="text-sm text-gray-500 ">Maximum number of attempts allowed</p>
 </div>
 <input
 type="number"
 value={formData.maxAttempts}
 onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
 className="w-24 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 min="1"
 />
 </div>
 )}

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Show Results Immediately</h3>
 <p className="text-sm text-gray-500 ">Show results to user right after submission</p>
 </div>
 <input
 type="checkbox"
 checked={formData.showResultsImmediately}
 onChange={(e) => setFormData({ ...formData, showResultsImmediately: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Randomize Questions</h3>
 <p className="text-sm text-gray-500 ">Shuffle question order for each attempt</p>
 </div>
 <input
 type="checkbox"
 checked={formData.randomizeQuestions}
 onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Randomize Options</h3>
 <p className="text-sm text-gray-500 ">Shuffle answer options for each attempt</p>
 </div>
 <input
 type="checkbox"
 checked={formData.randomizeOptions}
 onChange={(e) => setFormData({ ...formData, randomizeOptions: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Publish Assessment</h3>
 <p className="text-sm text-gray-500 ">Make this assessment available to users</p>
 </div>
 <input
 type="checkbox"
 checked={formData.isPublished}
 onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 <div className="border-t border-gray-200 pt-6">
 <h3 className="text-sm font-medium text-gray-900 mb-4">Access Control</h3>

 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
 <div>
 <h3 className="text-sm font-medium text-gray-900 ">Require Passcode</h3>
 <p className="text-sm text-gray-500 ">Users need a passcode to start this assessment</p>
 </div>
 <input
 type="checkbox"
 checked={formData.requirePasscode}
 onChange={(e) => setFormData({ ...formData, requirePasscode: e.target.checked })}
 className="w-4 h-4 text-indigo-600 rounded"
 />
 </div>

 {formData.requirePasscode && (
 <div className="p-4 bg-indigo-50 rounded-lg">
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Passcode
 </label>
 <input
 type="text"
 value={formData.passcode}
 onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
 placeholder="Enter a passcode (e.g., TEST123)"
 />
 <p className="text-xs text-gray-500 mt-1">
 Share this passcode with users who need to take the assessment
 </p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 );
};

export default AssessmentForm;
