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
  cognitive: ['Reasoning', 'ECTI', 'Cognitive ability'],
  aptitude: ['General Aptitude'],
  professional: ['PCLA'],
};

// Display labels for subcategories (value → display label mapping)
const SUBCATEGORY_LABELS = {
  'FIRO-B': 'Professional Interpersonal Relations Orientation (PIRO)',
  'Hogan': 'TraitMap Index',
  'PCLA': 'Professional Coachability & Learning Agility Index (PCLA™)',
  'ECTI': 'Executive Critical Thinking Index (ECTI™)',
  'Cognitive ability': 'Cognitive Ability Composite Score (CACS™)',
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

const HOGAN_SCALES = [
  { key: 'HVP', name: 'Hogan Validation Profile', short: 'HVP', description: 'Measures straightforwardness, cooperation, and customer orientation', color: 'indigo' },
  { key: 'HDS', name: 'Hogan Development Survey', short: 'HDS', description: 'Measures derailment risks and career impediments', color: 'red' },
  { key: 'MVPI', name: 'Motives, Values, Preferences Inventory', short: 'MVPI', description: 'Measures values, interests, and driving forces', color: 'amber' },
  { key: 'SCI', name: 'Strategic Competencies Inventory', short: 'SCI', description: 'Measures strategic thinking and problem-solving', color: 'emerald' },
  { key: 'CPI', name: 'Clerical Potential Inventory', short: 'CPI', description: 'Measures potential for clerical/administrative roles', color: 'blue' },
  { key: 'PAI', name: 'Potential Appraisal Inventory', short: 'PAI', description: 'Measures leadership potential and influence', color: 'purple' },
  { key: 'SPI', name: 'Sales Potential Inventory', short: 'SPI', description: 'Measures potential for sales roles and customer engagement', color: 'cyan' }
];

const PREDEFINED_HOGAN_QUESTIONS = {
  HVP: [
    'I am honest in my dealings with others', 'I keep my promises and commitments',
    'I treat others with respect and fairness', 'I am straightforward in my communication',
    'I take responsibility for my actions', 'I consider how my behavior affects others',
    'I value integrity in myself and others', 'I am reliable and dependable',
    'I maintain ethical standards', 'I am trustworthy in professional settings'
  ],
  HDS: [
    'I become impatient when things move slowly', 'I sometimes take on more than I can handle',
    'I can be overly critical of myself', 'I occasionally neglect details in my work',
    'I sometimes struggle with work-life balance', 'I can be resistant to feedback',
    'I tend to worry about potential problems', 'I sometimes lack confidence in new situations',
    'I can be stubborn about changing my approach', 'I occasionally lose temper under pressure'
  ],
  MVPI: [
    'I am motivated by achievement and success', 'I value autonomy and independence',
    'I enjoy working in a team environment', 'I am driven by recognition and awards',
    'I value security and stability', 'I prefer variety and change in my work',
    'I am motivated by helping others', 'I value creative expression',
    'I am focused on financial rewards', 'I value personal growth and development'
  ],
  SCI: [
    'I can analyze complex problems effectively', 'I develop strategic solutions to challenges',
    'I think ahead and anticipate outcomes', 'I can integrate information from multiple sources',
    'I identify patterns in complex data', 'I develop innovative approaches to problems',
    'I can evaluate risks and benefits', 'I create solutions that address root causes',
    'I can think through long-term implications', 'I develop comprehensive action plans'
  ],
  CPI: [
    'I am detail-oriented in my work', 'I follow procedures accurately',
    'I maintain accurate records', 'I am organized in my approach',
    'I pay attention to detail in all tasks', 'I follow through on administrative tasks',
    'I maintain consistency in my work', 'I am thorough in checking my work',
    'I follow guidelines and protocols', 'I maintain orderly work processes'
  ],
  PAI: [
    'I naturally take leadership in group situations', 'I am confident in directing others',
    'I can inspire and motivate team members', 'I am comfortable making decisions',
    'I can delegate effectively', 'I take initiative in difficult situations',
    'I am persuasive in my communication', 'I can handle conflict constructively',
    'I am motivated by leadership responsibilities', 'I can guide teams toward goals'
  ],
  SPI: [
    'I enjoy interacting with customers', 'I am persuasive in sales situations',
    'I am confident approaching new people', 'I can handle rejection positively',
    'I am motivated by sales targets', 'I build rapport quickly with others',
    'I can explain products effectively', 'I follow up on leads persistently',
    'I can identify customer needs', 'I maintain positive attitude under pressure'
  ]
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
  const [uploadingImageId, setUploadingImageId] = useState(null);

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
    setBannerPreview(assessment.bannerImage ? (assessment.bannerImage.startsWith('http') ? assessment.bannerImage : `/${assessment.bannerImage}`) : '');
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
          await assessmentService.bulkCreateQuestions(newId, questions.map(({ _id, ...q }) => q));
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
    questionImage: question.questionImage || null,
    type: question.type || 'mcq',
    dimension: question.dimension || '',
    marks: question.marks || 1,
    trait: question.trait || '',
    direction: question.direction || 'positive',
    options: question.options ? question.options.map(o => ({ ...o })) : [],
    statements: question.statements ? question.statements.map(s => ({ ...s })) : [],
  });
};

// Form-based edit: populate the generic add/edit form
const handleFormEdit = (question) => {
  setNewQuestion({
    type: question.type || 'mcq',
    questionText: question.questionText || '',
    questionImage: question.questionImage || null,
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

const handleQuestionImageUpload = async (e, qId) => {
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
  try {
    setUploadingImageId(qId);
    const result = await assessmentService.uploadQuestionImage(file);
    if (result.success) {
      setEditFormData(prev => ({ ...prev, questionImage: result.data.imageUrl }));
      toast.success('Image uploaded successfully');
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to upload image');
  } finally {
    setUploadingImageId(null);
  }
};

const handleOptionImageUploadEdit = async (e, optIndex) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast.warning('Please select an image file');
  if (file.size > 5 * 1024 * 1024) return toast.warning('Image must be less than 5MB');
  try {
    const result = await assessmentService.uploadQuestionImage(file);
    if (result.success) {
      const updated = [...editFormData.options];
      updated[optIndex] = { ...updated[optIndex], image: result.data.imageUrl };
      setEditFormData({ ...editFormData, options: updated });
      toast.success('Option image uploaded successfully');
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to upload option image');
  }
};

const handleOptionImageUploadNew = async (e, index) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast.warning('Please select an image file');
  if (file.size > 5 * 1024 * 1024) return toast.warning('Image must be less than 5MB');
  try {
    const result = await assessmentService.uploadQuestionImage(file);
    if (result.success) {
      updateOption(index, 'image', result.data.imageUrl);
      toast.success('Option image uploaded successfully');
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to upload option image');
  }
};

const handleQuestionImageUploadNew = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast.warning('Please select an image file');
  if (file.size > 5 * 1024 * 1024) return toast.warning('Image must be less than 5MB');
  try {
    const result = await assessmentService.uploadQuestionImage(file);
    if (result.success) {
      setNewQuestion({ ...newQuestion, questionImage: result.data.imageUrl });
      toast.success('Question image uploaded successfully');
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to upload question image');
  }
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

  // ========== Cognitive Ability Question Handlers ==========
  const handleCognitiveAbilityPopulateAll = async () => {
    if (questions.length >= 19) {
      toast.warning('All 19 Cognitive Ability questions are already loaded');
      return;
    }
    if (!confirm('This will load all 19 pre-configured Cognitive Ability (CACS™) questions. Continue?')) return;

    setSaving(true);
    try {
      const { COGNITIVE_ABILITY_QUESTIONS } = await import('../../data/cognitiveAbilityQuestions');
      const questionsToCreate = COGNITIVE_ABILITY_QUESTIONS.slice(questions.length).map(q => ({
        type: 'mcq',
        questionText: q.questionText,
        questionImage: q.questionImage || null,
        order: q.order,
        dimension: q.dimension,
        marks: 1,
        difficulty: q.difficulty === 'easy' ? 'basic' : q.difficulty === 'advanced' ? 'tough' : (q.difficulty || 'moderate'),
        isRequired: true,
        options: q.options.map(o => ({
          text: o.text,
          image: o.image || null,
          isCorrect: o.isCorrect,
          score: o.isCorrect ? 1 : 0
        })),
        tags: ['cognitive', 'cacs', q.dimension.toLowerCase()],
        explanation: q.explanation || `This question measures ${q.dimension.toUpperCase()}.`,
      }));

      if (isEditing) {
        await assessmentService.bulkCreateQuestions(id, questionsToCreate);
        fetchQuestions();
      } else {
        const withIds = questionsToCreate.map((q, i) => ({ ...q, _id: Date.now() + i }));
        setQuestions(prev => [...prev, ...withIds]);
      }
      toast.success(`Loaded ${questionsToCreate.length} Cognitive Ability questions successfully.`);
    } catch (error) {
      console.error('Error loading Cognitive Ability questions:', error);
      toast.error('Failed to load Cognitive Ability questions. Make sure the question bank file exists.');
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

  const handleHoganPopulateAll = () => {
    const total = 70;
    const loaded = questions.length;
    if (loaded >= total) {
      toast.warning(`All ${total} Hogan questions are already loaded`);
      return;
    }
    if (!confirm(`This will add all ${total - loaded} predefined TraitMap Index demo questions. Continue?`)) return;

    let order = loaded + 1;
    const newQuestions = [];
    HOGAN_SCALES.forEach(scale => {
      const templates = PREDEFINED_HOGAN_QUESTIONS[scale.key];
      if (!templates) return;
      templates.forEach((text, idx) => {
        newQuestions.push({
          _id: Date.now() + newQuestions.length,
          type: 'rating',
          questionText: text,
          dimension: scale.key,
          marks: 5,
          order: order++,
          options: [
            { text: 'Disagree', score: 1 }, { text: 'Slightly Disagree', score: 2 },
            { text: 'Neutral', score: 3 }, { text: 'Slightly Agree', score: 4 },
            { text: 'Agree', score: 5 }
          ]
        });
      });
    });

    if (isEditing) {
      setSaving(true);
      assessmentService.bulkCreateQuestions(id, newQuestions.map(q => {
        const { _id, ...rest } = q;
        return rest;
      }))
        .then(() => fetchQuestions())
        .catch(err => {
          console.error('Error loading Hogan questions:', err);
          toast.error('Failed to load Hogan questions');
        })
        .finally(() => setSaving(false));
    } else {
      setQuestions(prev => [...prev, ...newQuestions]);
      toast.success(`Loaded ${newQuestions.length} TraitMap Index demo questions successfully.`);
    }
  };

  const handleAddDiscQuestion = async () => {
  if (!newQuestion.questionText.trim()) {
   toast.warning('Please enter a question');
   return;
  }
  if (!newQuestion.statements || newQuestion.statements.length !== 4) {
   toast.warning('DISC questions require exactly 4 statements');
   return;
  }
  if (!newQuestion._editId && questions.length >= 24) {
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

  if (newQuestion._editId) {
    if (isEditing) {
      try {
        await assessmentService.updateQuestion(id, newQuestion._editId, discQuestion);
        fetchQuestions();
      } catch (error) {
        console.error('Error updating DISC question:', error);
        toast.error('Failed to update question');
        return;
      }
    } else {
      discQuestion._id = newQuestion._editId;
      setQuestions(questions.map(q => q._id === newQuestion._editId ? { ...q, ...discQuestion } : q));
    }
  } else {
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
  }

  setNewQuestion({
    type: 'disc-ranking',
    questionText: '',
    statements: [],
    options: [],
    difficulty: 'basic',
    dimension: 'DISC',
    marks: 10,
  });
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
   <div className="flex items-center gap-2 flex-wrap">
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

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    } else if (sub === 'ECTI') {
      configOverrides = { isLockedStructure: true, isEditable: false, totalQuestions: 36, randomizeQuestions: false, randomizeOptions: false, timeBound: { enabled: true, durationMinutes: 45 } };
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
  Big Five Personality Test — Demo Questions
  </h3>
  <p className="text-blue-800 mb-4">
  Pre-loaded <strong>demo questions</strong> below — customize each question and answer freely.
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
  <span>All 50 demo questions configured correctly!</span>
  </div>
  ) : (
  <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
  <AlertCircle className="w-5 h-5" />
  <span>Add {50 - questions.length} more demo questions to complete the assessment — use Auto-fill to load predefined templates</span>
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
  title="Auto-fill with predefined demo question for this position"
  >
  <Sparkles className="w-4 h-4 mr-1.5" />
  Demo Auto-fill Q{questions.length + 1}
  </button>
                 <button
                   onClick={handlePopulateAll}
                   className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                   title="Automatically add all remaining predefined Big5 demo questions"
                 >
                   <Plus className="w-4 h-4 mr-1.5" />
                   Add All Demo Questions ({50 - questions.length})
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

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
  <div className="space-y-2">
  <h3 className="text-sm font-semibold text-gray-700">Questions ({questions.length}/50) <span className="text-xs font-normal text-gray-400">— click ✏️ to edit</span></h3>
  {questions.map((question, index) => (
  editingId === question._id && editFormData ? (
    <div key={question._id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
      <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{index + 1}</span>
      <div className="flex-1 space-y-2">
        <textarea value={editFormData.questionText} onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" />
        <div className="flex items-center gap-2">
          <select value={editFormData.trait || ''} onChange={(e) => setEditFormData({ ...editFormData, trait: e.target.value })} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm">
            <option value="">Trait</option>
            <option value="E">Extraversion (E)</option>
            <option value="A">Agreeableness (A)</option>
            <option value="C">Conscientiousness (C)</option>
            <option value="N">Neuroticism (N)</option>
            <option value="O">Openness (O)</option>
          </select>
          <select value={editFormData.direction || 'positive'} onChange={(e) => setEditFormData({ ...editFormData, direction: e.target.value })} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm">
            <option value="positive">Positive (+)</option>
            <option value="negative">Negative (-)</option>
          </select>
          <input type="number" value={editFormData.marks} onChange={(e) => setEditFormData({ ...editFormData, marks: parseInt(e.target.value) || 1 })} className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" min="1" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button onClick={handleInlineEditSave} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"><Save className="w-3.5 h-3.5 mr-1 inline" /> Save</button>
          <button onClick={handleInlineEditCancel} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  ) : (
  <div
  key={question._id}
  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
  >
  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{index + 1}</span>
  <div className="flex-1">
  <p className="text-sm text-gray-900 ">{question.questionText}</p>
  <div className="flex items-center gap-2 mt-1">
  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
  {question.trait === 'E' ? 'Extraversion' :
  question.trait === 'A' ? 'Agreeableness' :
  question.trait === 'C' ? 'Conscientiousness' :
  question.trait === 'N' ? 'Neuroticism' : 'Openness'}
  </span>
  <span className={`text-xs px-2 py-0.5 rounded ${question.direction === 'positive' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
  {question.direction === 'positive' ? '+' : '-'}
  </span>
  <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{question.marks || 5} marks</span>
  </div>
  </div>
  <div className="flex items-center gap-1">
    <button onClick={() => handleEditQuestion(question)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg" title="Edit question"><Pencil className="w-4 h-4" /></button>
    <button onClick={() => handleDeleteQuestion(question._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete question"><Trash2 className="w-4 h-4" /></button>
  </div>
  </div>
  )
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
  Pre-loaded <strong>demo questions</strong> below — customize each question and answer freely
  to match your assessment needs.
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
  <span>All 24 DISC demo questions configured correctly!</span>
  </div>
  ) : (
  <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
  <AlertCircle className="w-5 h-5" />
  <span>Add {24 - questions.length} more demo questions to complete the assessment — use Auto-fill to load predefined templates</span>
  </div>
  )}
  </div>
  </div>
  </div>

  {/* Add New DISC Question */}
  {(questions.length < 24 || newQuestion._editId) && (
  <div className="bg-gray-50 rounded-lg p-4">
  <div className="flex items-center justify-between mb-4">
  <h3 className="text-sm font-medium text-gray-900 ">
  {newQuestion._editId ? 'Edit DISC Question' : `Add DISC Question (${questions.length + 1} of 24)`}
  </h3>
  {!newQuestion._editId && (
  <div className="flex gap-2">
  <button
  onClick={handleDiscSelfPopulate}
  className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
  title="Auto-fill with predefined demo question for this position"
  >
  <Sparkles className="w-4 h-4 mr-1.5" />
  Demo Auto-fill Q{questions.length + 1}
  </button>
                  <button
                    onClick={handleDiscPopulateAll}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                    title="Automatically add all remaining predefined DISC demo questions"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add All Demo Questions ({24 - questions.length})
                  </button>
  </div>
  )}
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
  {['D', 'I', 'S', 'C'].map((trait) => {
    const stmt = (newQuestion.statements || []).find(s => s.trait === trait) || { trait, text: '' };
    const colors = {
      D: 'border-red-200 bg-red-50', I: 'border-amber-200 bg-amber-50',
      S: 'border-green-200 bg-green-50', C: 'border-blue-200 bg-blue-50'
    };
    return (
      <div key={trait} className={`flex items-center gap-3 p-3 rounded-lg border ${colors[trait]}`}>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
          trait === 'D' ? 'bg-red-500' : trait === 'I' ? 'bg-amber-500' :
          trait === 'S' ? 'bg-green-500' : 'bg-blue-500'
        }`}>
          {trait}
        </span>
        <input
          type="text"
          value={stmt.text}
          onChange={(e) => {
            const updated = [...(newQuestion.statements || [])];
            const idx = updated.findIndex(s => s.trait === trait);
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], text: e.target.value };
            } else {
              updated.push({ trait, text: e.target.value, score: 4 });
            }
            setNewQuestion({ ...newQuestion, statements: updated });
          }}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
          placeholder={`Enter ${trait} statement...`}
        />
      </div>
    );
  })}
  </div>

  <button
  onClick={handleAddDiscQuestion}
  disabled={!newQuestion.questionText.trim() || !newQuestion.statements || newQuestion.statements.length !== 4 || (questions.length >= 24 && !newQuestion._editId)}
  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
  {newQuestion._editId ? 'Update Question' : `Add Question ${questions.length + 1}`}
  </button>
 </div>
 </div>
 )}

  {/* Questions List */}
  <div className="space-y-2">
  <h3 className="text-sm font-semibold text-gray-700">Questions ({questions.length}/24) <span className="text-xs font-normal text-gray-400">— click ✏️ to edit</span></h3>
  {questions.map((question, index) => (
  editingId === question._id && editFormData ? (
    <div key={question._id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
      <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{index + 1}</span>
      <div className="flex-1 space-y-2">
        <textarea value={editFormData.questionText} onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" />
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">Statements (D, I, S, C)</label>
          {['D', 'I', 'S', 'C'].map((trait) => {
            const stmt = editFormData.statements?.find(s => s.trait === trait) || { trait, text: '' };
            const colors = { D: 'bg-red-100 text-red-700 border-red-200', I: 'bg-amber-100 text-amber-700 border-amber-200', S: 'bg-green-100 text-green-700 border-green-200', C: 'bg-blue-100 text-blue-700 border-blue-200' };
            return (
              <div key={trait} className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${trait === 'D' ? 'bg-red-500' : trait === 'I' ? 'bg-amber-500' : trait === 'S' ? 'bg-green-500' : 'bg-blue-500'}`}>{trait}</span>
                <input type="text" value={stmt.text} onChange={(e) => {
                  const updated = [...(editFormData.statements || [])];
                  const idx = updated.findIndex(s => s.trait === trait);
                  if (idx >= 0) updated[idx] = { ...updated[idx], text: e.target.value };
                  else updated.push({ trait, text: e.target.value });
                  setEditFormData({ ...editFormData, statements: updated });
                }} className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder={`${trait} statement...`} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button onClick={handleInlineEditSave} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"><Save className="w-3.5 h-3.5 mr-1 inline" /> Save</button>
          <button onClick={handleInlineEditCancel} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  ) : (
  <div
  key={question._id}
  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
  >
  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{index + 1}</span>
   <div className="flex-1 min-w-0">
   <p className="text-sm text-gray-900">{question.questionText}</p>
   <div className="flex flex-wrap gap-1.5 mt-1.5">
   {question.statements?.map((s, i) => (
   <span key={i} className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${
   s.trait === 'D' ? 'bg-red-100 text-red-700 ' :
   s.trait === 'I' ? 'bg-amber-100 text-amber-700 ' :
   s.trait === 'S' ? 'bg-green-100 text-green-700 ' :
   'bg-blue-100 text-blue-700 '
   }`}>
   <span className="font-bold">{s.trait}</span>
   <span>{s.text}</span>
   </span>
   ))}
   </div>
   </div>
   <div className="flex items-center gap-1 flex-shrink-0">
   <button onClick={() => handleEditQuestion(question)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg" title="Edit question">
   <Pencil className="w-4 h-4" />
   </button>
   <button onClick={() => handleDeleteQuestion(question._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete question">
   <Trash2 className="w-4 h-4" />
   </button>
   </div>
  </div>
  )
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
              Pre-loaded <strong>demo questions</strong> below — customize each question and answer freely
              to match your assessment needs.
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
                <span>All 35 PCLA™ demo questions loaded — customize as needed!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{35 - questions.length} demo questions remaining — click &ldquo;Load Demo Questions&rdquo; below</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Load button */}
      {questions.length < 35 && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Demo questions loaded: {questions.length} / 35</p>
            <p className="text-xs text-gray-500 mt-0.5">All 35 demo scenarios will be added — edit them freely after loading</p>
          </div>
          <button
            onClick={handlePclaPopulateAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Loading...' : `Load All ${35 - questions.length} Demo Questions`}
          </button>
        </div>
      )}

      {/* Questions list with inline edit */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Demo Questions ({questions.length}/35) <span className="text-xs font-normal text-gray-400">— click ✏️ to customize each</span></h3>
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

  {/* ─── ECTI™ Questions Panel ─────────────────────────────── */}
  {activeTab === 'questions' && formData.subCategory === 'ECTI' && (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0">
            <Info className="w-6 h-6 text-indigo-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-indigo-900 mb-1">
              Executive Critical Thinking Index (ECTI™) — Pre-configured Assessment
            </h3>
            <p className="text-indigo-800 text-sm mb-4">
              The ECTI™ is a <strong>locked 36-question psychometric instrument</strong> with proprietary weighted-judgement scoring.
              Questions are scenario-based and evaluate executive decision quality across 4 clusters and 20+ dimensions.
              <span className="text-indigo-600 font-medium"> Questions cannot be edited to preserve psychometric integrity.</span>
            </p>

            {/* Cluster grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              {[
                { cluster: 'Operational Judgement', q: 8, color: 'blue', icon: '⚙️' },
                { cluster: 'Strategic Decision Quality', q: 8, color: 'violet', icon: '♟️' },
                { cluster: 'Stakeholder / Client Maturity', q: 8, color: 'emerald', icon: '🤝' },
                { cluster: 'Executive Leadership Maturity', q: 12, color: 'amber', icon: '👑' },
              ].map(({ cluster, q, icon }) => (
                <div key={cluster} className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="font-bold text-indigo-700">{q} Q</div>
                  <div className="text-gray-600 text-xs mt-0.5 leading-tight">{cluster}</div>
                </div>
              ))}
            </div>

            {/* Dimension pills */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wider">Dimensions Measured</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Problem Framing', 'Stakeholder Judgement', 'Analytical Evaluation', 'Systems Thinking',
                  'Risk Evaluation', 'Execution Thinking', 'Bias Awareness', 'People Judgement',
                  'Decision Quality', 'Strategic Judgement', 'Ethical Reasoning', 'Leadership Communication',
                  'Executive Influence', 'Organizational Judgement', 'Client Leadership', 'Sustainable Leadership',
                  'Evidence Integration', 'Crisis Management', 'Strategic Balance', 'Leadership Continuity Thinking',
                  'Ethical Leadership', 'Trust-based Decision Quality', 'Strategic Ambiguity Handling',
                  'Accountability Maturity', 'Enterprise Thinking', 'Leadership Judgement', 'Crisis Integrity',
                  'Strategic Foresight', 'Adaptive Leadership', 'Executive Readiness',
                ].map(d => (
                  <span key={d} className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5">{d}</span>
                ))}
              </div>
            </div>

            {/* Scoring bands */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wider">Scoring Bands</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {[
                  { range: '126–144', band: 'Elite Executive Thinker', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                  { range: '108–125', band: 'Strong Strategic Leader', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
                  { range: '90–107',  band: 'Solid Functional Leader', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { range: '72–89',   band: 'Emerging Leader', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                  { range: 'Below 72', band: 'Execution-focused', color: 'bg-red-100 text-red-800 border-red-200' },
                ].map(({ range, band, color }) => (
                  <div key={range} className={`border rounded px-2 py-1.5 ${color}`}>
                    <div className="font-bold">{range}</div>
                    <div>{band}</div>
                  </div>
                ))}
              </div>
            </div>

            {questions.length === 36 ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>All 36 ECTI™ questions are loaded and ready.</span>
              </div>
            ) : questions.length > 0 ? (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{questions.length}/36 questions loaded. Use the seed runner to populate all questions.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-indigo-700 bg-indigo-100 p-3 rounded-lg">
                <Lock className="w-5 h-5" />
                <span>Questions will be loaded automatically when you run the seed command: <code className="bg-indigo-200 px-1 rounded text-xs">npm run seed</code></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Read-only question list */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            ECTI™ Questions ({questions.length}/36)
            <span className="ml-2 text-xs font-normal text-gray-400">— locked psychometric instrument, view-only</span>
          </h3>
          {questions.map((q, idx) => (
            <div key={q._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{q.questionText?.split('\n')[0]}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {q.dimension && (
                    <span className="inline-block text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-0.5">{q.dimension}</span>
                  )}
                  {q.cluster && (
                    <span className="inline-block text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-0.5">{q.cluster}</span>
                  )}
                  <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{q.marks || 4} marks</span>
                </div>
                {q.options?.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-2">
                    {q.options.map((opt, oi) => (
                      <span key={oi} className={`text-xs px-2 py-0.5 rounded ${opt.isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white border border-gray-100 text-gray-500'}`}>
                        {['A', 'B', 'C', 'D'][oi]}. {opt.text}
                        {opt.score !== undefined && <span className="ml-1 text-gray-400">({opt.score})</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <Lock className="w-4 h-4 text-gray-300" title="Locked — ECTI psychometric instrument" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  {/* ─── Cognitive Ability™ Questions Panel ─────────────────────────── */}
  {activeTab === 'questions' && formData.category === 'cognitive' && formData.subCategory === 'Cognitive ability' && (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0">
            <Info className="w-6 h-6 text-indigo-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">
              Cognitive Ability Composite Score (CACS™)
            </h3>
            <p className="text-indigo-800 text-sm mb-4">
              Pre-loaded <strong>CACS™ demo questions</strong> below — evaluate key cognitive domains across 19 items with weighted scoring.
              Customize each question and its answer choices freely.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
              {[
                { dim: 'Verbal Reasoning (VR)', color: 'emerald', count: 4, wt: '20%' },
                { dim: 'Numerical Reasoning (NR)', color: 'blue', count: 4, wt: '20%' },
                { dim: 'Logical Reasoning (LR)', color: 'purple', count: 5, wt: '25%' },
                { dim: 'Critical Thinking (CT)', color: 'pink', count: 4, wt: '20%' },
                { dim: 'Working Memory (WM)', color: 'amber', count: 2, wt: '15%' },
              ].map(({ dim, count, wt }) => (
                <div key={dim} className="bg-white rounded-lg p-2 text-center border border-indigo-100">
                  <div className="font-bold text-indigo-700">{count} Q ({wt})</div>
                  <div className="text-gray-600 text-xs mt-0.5 leading-tight">{dim}</div>
                </div>
              ))}
            </div>
            {questions.length === 19 ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>All 19 CACS™ demo questions loaded — customize as needed!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{19 - questions.length} demo questions remaining — click &ldquo;Load Demo Questions&rdquo; below</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Load button */}
      {questions.length < 19 && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Demo questions loaded: {questions.length} / 19</p>
            <p className="text-xs text-gray-500 mt-0.5">All 19 CACS™ questions will be added — edit them freely after loading</p>
          </div>
          <button
            onClick={handleCognitiveAbilityPopulateAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Loading...' : `Load All ${19 - questions.length} Demo Questions`}
          </button>
        </div>
      )}

      {/* Questions list with inline edit */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">CACS™ Questions ({questions.length}/19) <span className="text-xs font-normal text-gray-400">— click ✏️ to customize each</span></h3>
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
                    </select>
                    <select
                      value={editFormData.dimension}
                      onChange={(e) => setEditFormData({ ...editFormData, dimension: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                    >
                      <option value="vr">Verbal Reasoning (VR)</option>
                      <option value="nr">Numerical Reasoning (NR)</option>
                      <option value="lr">Logical Reasoning (LR)</option>
                      <option value="ct">Critical Thinking (CT)</option>
                      <option value="wm">Working Memory (WM)</option>
                    </select>
                    <input
                      type="number"
                      value={editFormData.marks}
                      onChange={(e) => setEditFormData({ ...editFormData, marks: parseInt(e.target.value) || 1 })}
                      className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                      min="1"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg border border-gray-200 transition-colors">
                      <Image className="w-4 h-4" />
                      <span>{uploadingImageId === q._id ? 'Uploading...' : 'Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleQuestionImageUpload(e, q._id)}
                        disabled={uploadingImageId === q._id}
                      />
                    </label>
                  </div>
                  {editFormData.questionImage && (
                    <div className="relative inline-block mt-2">
                      <img src={editFormData.questionImage.startsWith('http') ? editFormData.questionImage : `/${editFormData.questionImage}`} alt="Question" className="h-32 object-contain rounded-md border border-gray-200 bg-white p-1" />
                      <button
                        onClick={() => setEditFormData({ ...editFormData, questionImage: null })}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm hover:bg-red-200"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {editFormData.type === 'mcq' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600">Options</label>
                      {editFormData.options?.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          {opt.image && (
                            <img 
                              src={opt.image.startsWith('http') ? opt.image : `/${opt.image}`} 
                              alt="" 
                              className="h-8 w-8 object-contain rounded border border-gray-200 bg-white p-0.5" 
                            />
                          )}
                          <label className="cursor-pointer text-gray-500 hover:text-indigo-600" title="Upload Option Image">
                            <Image className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleOptionImageUploadEdit(e, oi)}
                            />
                          </label>
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
                          <label className="inline-flex items-center gap-1.5 ml-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opt.isCorrect}
                              onChange={(e) => {
                                const updated = editFormData.options.map((o, i) => ({
                                  ...o,
                                  isCorrect: i === oi ? e.target.checked : false
                                }));
                                setEditFormData({ ...editFormData, options: updated });
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs text-gray-500">Correct</span>
                          </label>
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
                        onClick={() => setEditFormData({ ...editFormData, options: [...editFormData.options, { text: '', isCorrect: false }] })}
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
                    <button onClick={handleInlineEditCancel} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Display mode for this question */
              <div key={q._id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-100 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{q.questionText}</p>
                    {q.questionImage && (
                      <div className="mt-2 mb-2">
                        <img src={q.questionImage.startsWith('http') ? q.questionImage : `/${q.questionImage}`} alt="Question" className="h-32 object-contain rounded-md border border-gray-200 bg-white p-1" />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider text-[10px]">{q.dimension?.toUpperCase()}</span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded capitalize">{q.difficulty}</span>
                      <span>{q.marks || 1} mark(s)</span>
                    </div>
                    {q.options?.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-2 bg-white p-2.5 rounded-lg border border-gray-100">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-2.5 py-1.5 rounded-md flex items-center justify-between ${opt.isCorrect ? 'bg-green-50 text-green-700 border border-green-200 font-medium' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold">{['A', 'B', 'C', 'D', 'E'][oi]}.</span>
                              {opt.image && (
                                <img 
                                  src={opt.image.startsWith('http') ? opt.image : `/${opt.image}`} 
                                  alt="" 
                                  className="h-10 w-10 object-contain rounded border border-gray-200 bg-white p-0.5" 
                                />
                              )}
                              <span className="truncate">{opt.text}</span>
                            </div>
                            {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditQuestion(q)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 shadow-sm transition-all"
                    title="Edit question"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 shadow-sm transition-all"
                    title="Delete question"
                  >
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

     {activeTab === 'questions' && questionsLoading && !(formData.category === 'personality' && formData.subCategory === 'Big5') && !(formData.category === 'psychometric' && formData.subCategory === 'DISC') && !(formData.category === 'psychometric' && formData.subCategory === 'MBTI') && !(formData.category === 'psychometric' && formData.subCategory === 'Hogan') && !(formData.category === 'professional' && formData.subCategory === 'PCLA') && !(formData.subCategory === 'ECTI') && !(formData.subCategory === 'Cognitive ability') && (
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
                Pre-loaded <strong>demo questions</strong> below — customize each question and answer freely
                to match your assessment needs.
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
                  <span>All 32 MBTI demo questions loaded — customize as needed!</span>
                </div>
              ) : (
                <div className="text-amber-700 bg-amber-100 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Load all 32 predefined MBTI demo questions below — customize freely after loading
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Demo questions loaded: {questions.length} / 32</p>
            <p className="text-xs text-gray-500 mt-0.5">All 32 demo questions will be added with correct dimension mapping — edit them after loading</p>
          </div>
          <button
            onClick={handleMbtiPopulateAll}
            disabled={saving || questions.length >= 32}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Loading...' : `Load All ${32 - questions.length} Demo Questions`}
          </button>
        </div>

      {/* Questions list with inline edit */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Demo Questions ({questions.length}/32) <span className="text-xs font-normal text-gray-400">— click ✏️ to customize each</span></h3>
          {questions.map((q, idx) =>
            editingId === q._id && editFormData ? (
              /* Inline edit mode */
              <div key={q._id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{idx + 1}</span>
                <div className="flex-1 space-y-2">
                  <textarea value={editFormData.questionText} onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" />
                  <div className="flex items-center gap-2">
                    <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm">
                      <option value="mcq">MCQ</option>
                      <option value="text">Text</option>
                      <option value="rating">Rating</option>
                    </select>
                    <input type="text" value={editFormData.dimension} onChange={(e) => setEditFormData({ ...editFormData, dimension: e.target.value })} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder="Dimension" />
                    <input type="number" value={editFormData.marks} onChange={(e) => setEditFormData({ ...editFormData, marks: parseInt(e.target.value) || 1 })} className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" min="1" />
                  </div>
                  {editFormData.type === 'mcq' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600">Options</label>
                      {editFormData.options?.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="text" value={opt.text} onChange={(e) => { const u = [...editFormData.options]; u[oi] = { ...u[oi], text: e.target.value }; setEditFormData({ ...editFormData, options: u }); }} className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder={`Option ${oi + 1}`} />
                          <input type="number" value={opt.score} onChange={(e) => { const u = [...editFormData.options]; u[oi] = { ...u[oi], score: parseInt(e.target.value) || 0 }; setEditFormData({ ...editFormData, options: u }); }} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder="Score" />
                          <button onClick={() => { if (editFormData.options.length <= 2) { toast.warning('Minimum 2 options required'); return; } setEditFormData({ ...editFormData, options: editFormData.options.filter((_, i) => i !== oi) }); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      <button onClick={() => setEditFormData({ ...editFormData, options: [...editFormData.options, { text: '', score: 0, isCorrect: false }] })} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Option</button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={handleInlineEditSave} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"><Save className="w-3.5 h-3.5 mr-1 inline" /> Save</button>
                    <button onClick={handleInlineEditCancel} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal display mode */
              <div key={q._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{q.questionText}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {q.dimension && <span className="inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">{q.dimension}</span>}
                    <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5 capitalize">{q.type}</span>
                    <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                  {q.options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {q.options.map((opt, oi) => (
                        <span key={oi} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">{opt.text}{opt.score !== undefined ? <span className="ml-1 text-gray-400">({opt.score})</span> : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEditQuestion(q)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg" title="Edit question"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteQuestion(q._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete question"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )
          )}
        </div>
      )}
      </div>
    )}

    {activeTab === 'questions' && !questionsLoading && formData.category === 'psychometric' && formData.subCategory === 'Hogan' && (
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Info className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-indigo-900 mb-2">TraitMap Index — Demo Questions</h3>
              <p className="text-indigo-800 text-sm mb-4">
                Pre-loaded <strong>demo questions</strong> below — customize each question and answer freely
                to match your assessment needs.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                {HOGAN_SCALES.map(({ key, name, short, description, color }) => (
                  <div key={key} className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                    <div className={`font-bold text-lg`}>{short}</div>
                    <div className="text-gray-600 text-xs mt-0.5 leading-tight">{name}</div>
                  </div>
                ))}
              </div>
              {questions.length >= 70 ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span>All 70 TraitMap Index demo questions loaded — customize as needed!</span>
                </div>
              ) : (
                <div className="text-amber-700 bg-amber-100 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Load all 70 predefined TraitMap Index demo questions below — customize freely after loading
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Demo questions loaded: {questions.length} / 70</p>
            <p className="text-xs text-gray-500 mt-0.5">All 70 demo questions will be added with correct scale mapping — edit them after loading</p>
          </div>
          <button
            onClick={handleHoganPopulateAll}
            disabled={saving || questions.length >= 70}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Loading...' : `Load All ${70 - questions.length} Demo Questions`}
          </button>
        </div>

        {questions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Demo Questions ({questions.length}/70) <span className="text-xs font-normal text-gray-400">— click ✏️ to customize each</span></h3>
            {questions.map((q, idx) =>
              editingId === q._id && editFormData ? (
                <div key={q._id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{idx + 1}</span>
                  <div className="flex-1 space-y-2">
                    <textarea value={editFormData.questionText} onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" />
                    <div className="flex items-center gap-2">
                      <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm">
                        <option value="mcq">MCQ</option>
                        <option value="text">Text</option>
                        <option value="rating">Rating</option>
                      </select>
                      <input type="text" value={editFormData.dimension} onChange={(e) => setEditFormData({ ...editFormData, dimension: e.target.value })} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder="Scale (e.g. HVP)" />
                      <input type="number" value={editFormData.marks} onChange={(e) => setEditFormData({ ...editFormData, marks: parseInt(e.target.value) || 1 })} className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" min="1" />
                    </div>
                    {editFormData.type === 'mcq' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600">Options</label>
                        {editFormData.options?.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input type="text" value={opt.text} onChange={(e) => { const u = [...editFormData.options]; u[oi] = { ...u[oi], text: e.target.value }; setEditFormData({ ...editFormData, options: u }); }} className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder={`Option ${oi + 1}`} />
                            <input type="number" value={opt.score} onChange={(e) => { const u = [...editFormData.options]; u[oi] = { ...u[oi], score: parseInt(e.target.value) || 0 }; setEditFormData({ ...editFormData, options: u }); }} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder="Score" />
                            <button onClick={() => { if (editFormData.options.length <= 2) { toast.warning('Minimum 2 options required'); return; } setEditFormData({ ...editFormData, options: editFormData.options.filter((_, i) => i !== oi) }); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => setEditFormData({ ...editFormData, options: [...editFormData.options, { text: '', score: 0, isCorrect: false }] })} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Option</button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={handleInlineEditSave} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"><Save className="w-3.5 h-3.5 mr-1 inline" /> Save</button>
                      <button onClick={handleInlineEditCancel} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={q._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{q.questionText}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {q.dimension && <span className="inline-block text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-0.5">{q.dimension}</span>}
                      <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5 capitalize">{q.type}</span>
                      <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    </div>
                    {q.options?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {q.options.map((opt, oi) => (
                          <span key={oi} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">{opt.text}{opt.score !== undefined ? <span className="ml-1 text-gray-400">({opt.score})</span> : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditQuestion(q)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg" title="Edit question"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteQuestion(q._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete question"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    )}

    {activeTab === 'questions' && !questionsLoading && formData.category === 'psychometric' && formData.subCategory === 'FIRO-B' && (
      <div className="space-y-6">
        {!isEditing ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Save the assessment first to add PIRO questions</span>
            </div>
            <p className="text-sm text-gray-600">
              Please save the assessment before adding PIRO questions. Once saved, you'll be able to access the dedicated PIRO question editor.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
                  <Info className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-purple-900 mb-2">
                    {SUBCATEGORY_LABELS['FIRO-B'] || 'Professional Interpersonal Relations Orientation (PIRO)'}
                  </h3>
                  <p className="text-purple-800 text-sm mb-4">
                    The PIRO (Professional Interpersonal Relations Orientation) assessment measures interpersonal needs
                    across three dimensions: <strong>Inclusion</strong>, <strong>Control</strong>, and <strong>Affection</strong>.
                    Each dimension has an Expressed and Wanted component, yielding 6 trait scales with 9 questions each (54 total).
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                    {[
                      { key: 'eI', name: 'Expressed Inclusion', short: 'eI' },
                      { key: 'wI', name: 'Wanted Inclusion', short: 'wI' },
                      { key: 'eC', name: 'Expressed Control', short: 'eC' },
                      { key: 'wC', name: 'Wanted Control', short: 'wC' },
                      { key: 'eA', name: 'Expressed Affection', short: 'eA' },
                      { key: 'wA', name: 'Wanted Affection', short: 'wA' },
                    ].map(({ key, name, short }) => (
                      <div key={key} className="bg-white rounded-lg p-3 text-center border border-purple-100">
                        <div className="font-bold text-purple-600">{short}</div>
                        <div className="text-gray-600 text-xs mt-1">{name}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-purple-700 bg-purple-100 p-3 rounded-lg">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>Manage all 54 PIRO questions using the dedicated question editor — add/edit questions organized by trait.</span>
                  </div>
                </div>
              </div>
            </div>

            {questions.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{questions.length} PIRO questions already added</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Manage all 54 PIRO questions using the dedicated question editor — add/edit questions organized by trait.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">No PIRO questions configured yet</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  No questions added yet. Use the dedicated PIRO question editor to add all 54 questions organized by trait.
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const prefix = orgSlug ? `/o/${orgSlug}` : '';
                  navigate(`${prefix}/assessments/${id}/questions/firo`);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Open PIRO Question Editor
              </button>
            </div>
          </>
        )}
      </div>
    )}

    {activeTab === 'questions' && !questionsLoading && !(formData.category === 'personality' && formData.subCategory === 'Big5') && !(formData.category === 'psychometric' && formData.subCategory === 'DISC') && !(formData.category === 'psychometric' && formData.subCategory === 'MBTI') && !(formData.category === 'psychometric' && formData.subCategory === 'Hogan') && !(formData.category === 'psychometric' && formData.subCategory === 'FIRO-B') && !(formData.category === 'professional' && formData.subCategory === 'PCLA') && !(formData.subCategory === 'ECTI') && !(formData.subCategory === 'Cognitive ability') && (
  <div className="space-y-6">
  {/* Add New Question */}
 <div className="bg-gray-50 rounded-lg p-4">
  <h3 className="text-sm font-medium text-gray-900 mb-4">{newQuestion._editId ? 'Edit Question' : 'Add New Question'}</h3>
 <div className="space-y-4">
  <div>
  <label className="block text-sm text-gray-700 mb-1">Question Text</label>
  <div className="flex gap-2">
    <textarea
    value={newQuestion.questionText}
    onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
    rows={2}
    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
    placeholder="Enter your question"
    />
    <label className="flex-shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors self-start mt-0.5" title="Upload Question Image">
      <Image className="w-4 h-4" />
      <span className="text-xs">Image</span>
      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuestionImageUploadNew(e)} />
    </label>
  </div>
  {newQuestion.questionImage && (
    <div className="mt-2 relative inline-block">
      <img src={newQuestion.questionImage.startsWith('http') ? newQuestion.questionImage : `/${newQuestion.questionImage}`} alt="" className="h-20 object-contain rounded border border-gray-200 bg-white p-1" />
      <button onClick={() => setNewQuestion({ ...newQuestion, questionImage: '' })} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">&times;</button>
    </div>
  )}
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
  {formData.category !== 'aptitude' && (
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
  )}
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
 {option.image && (
   <img 
     src={option.image.startsWith('http') ? option.image : `/${option.image}`} 
     alt="" 
     className="h-8 w-8 object-contain rounded border border-gray-200 bg-white p-0.5" 
   />
 )}
 <label className="cursor-pointer text-gray-500 hover:text-indigo-600" title="Upload Option Image">
   <Image className="w-4 h-4" />
   <input
     type="file"
     accept="image/*"
     className="hidden"
     onChange={(e) => handleOptionImageUploadNew(e, index)}
   />
 </label>
 <input
 type="text"
 value={option.text}
 onChange={(e) => updateOption(index, 'text', e.target.value)}
 className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 "
 placeholder={`Option ${index + 1}`}
 />
  <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:border-indigo-300 transition-colors">
    <input
      type="checkbox"
      checked={option.isCorrect}
      onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
    />
    <span className="text-xs font-medium">Correct</span>
  </label>
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
  <div className="space-y-2">
  <h3 className="text-sm font-semibold text-gray-700">Questions ({questions.length}) <span className="text-xs font-normal text-gray-400">— click ✏️ to edit</span></h3>
  {questions.map((question, index) => (
  editingId === question._id && editFormData ? (
    <div key={question._id} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
      <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{index + 1}</span>
      <div className="flex-1 space-y-2">
        <textarea value={editFormData.questionText} onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" />
        <div className="flex items-center gap-2">
          <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value, options: e.target.value === 'mcq' ? editFormData.options || [{ text: '', score: 0 }] : [] })} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm">
            <option value="mcq">MCQ</option>
            <option value="text">Text</option>
            <option value="rating">Rating</option>
          </select>
          <input type="text" value={editFormData.dimension} onChange={(e) => setEditFormData({ ...editFormData, dimension: e.target.value })} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder="Dimension" />
          <input type="number" value={editFormData.marks} onChange={(e) => setEditFormData({ ...editFormData, marks: parseInt(e.target.value) || 1 })} className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" min="1" />
        </div>
        {editFormData.type === 'mcq' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Options</label>
            {editFormData.options?.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="text" value={opt.text} onChange={(e) => { const u = [...editFormData.options]; u[oi] = { ...u[oi], text: e.target.value }; setEditFormData({ ...editFormData, options: u }); }} className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder={`Option ${oi + 1}`} />
                <input type="number" value={opt.score} onChange={(e) => { const u = [...editFormData.options]; u[oi] = { ...u[oi], score: parseInt(e.target.value) || 0 }; setEditFormData({ ...editFormData, options: u }); }} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm" placeholder="Score" />
                <button onClick={() => { if (editFormData.options.length <= 2) { toast.warning('Minimum 2 options required'); return; } setEditFormData({ ...editFormData, options: editFormData.options.filter((_, i) => i !== oi) }); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => setEditFormData({ ...editFormData, options: [...editFormData.options, { text: '', score: 0 }] })} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Option</button>
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={handleInlineEditSave} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"><Save className="w-3.5 h-3.5 mr-1 inline" /> Save</button>
          <button onClick={handleInlineEditCancel} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  ) : (
  <div
  key={question._id}
  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
  >
  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{index + 1}</span>
   <div className="flex-1">
   <p className="text-sm text-gray-900 ">{question.questionText}</p>
   <div className="flex items-center gap-2 mt-1">
   <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5 capitalize">{question.type}</span>
   {question.dimension && <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{question.dimension}</span>}
   <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
   </div>
   {question.options?.length > 0 && (
     <div className="flex flex-wrap gap-1.5 mt-1.5">
       {question.options.map((opt, oi) => (
         <span key={oi} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">{opt.text}{opt.score !== undefined ? <span className="ml-1 text-gray-400">({opt.score})</span> : ''}</span>
       ))}
     </div>
   )}
   </div>
   <div className="flex items-center gap-1">
   <button
   onClick={() => handleEditQuestion(question)}
   className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg"
   title="Edit question"
   >
   <Pencil className="w-4 h-4" />
   </button>
   <button
   onClick={() => handleDeleteQuestion(question._id)}
   className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
   >
   <Trash2 className="w-4 h-4" />
   </button>
   </div>
   </div>
  )
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
