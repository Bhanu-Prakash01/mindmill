import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { assessmentService } from '../../services';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { attemptService } from '../../services';
import AssessmentAssignmentModal from '../../components/AssessmentAssignmentModal';
import UnlockAssessmentModal from '../../components/UnlockAssessmentModal';
import AddTestTakerModal from '../../components/AddTestTakerModal';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  FileCheck,
  FileX,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Lock,
  UserPlus,
  Share2,
  Link as LinkIcon,
  Volume2,
  VolumeX,
  Unlock,
  Coins,
  RotateCcw,
  Building2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

// Category metadata: image, description, acknowledgement
const CATEGORY_META = {
  // Main categories
  big5: {
    image: '/assessment_big5.png',
    inspiredBy: 'Big 5 Assessments',
    description:
      'Our design of assessment is inspired by The Big 5 (OCEAN model) measures. It maps five core personality dimensions to provide a scientifically validated profile of an individual\'s behavior and thinking. It is best used for hiring, team building, and self-awareness to align personality traits with job roles and improve interpersonal dynamics.',
    acknowledgement: 'Acknowledgement the International Personality Item Pool (IPIP)',
  },
  disc: {
    image: '/assessment_disc.png',
    inspiredBy: 'DISC Assessments',
    description:
      'This assessment is a widely used, non-judgmental behavioral tool that slots personality into four types namely, Dominance, Influence, Steadiness, and Conscientiousness that impacts productivity, teamwork, and communication. Allows individuals understand their natural behavioral tendencies, strengths, and motivations.',
    acknowledgement: 'Model built by Lewis Goldberg, Robert McCrae, & Paul Costa',
  },
  firo: {
    image: '/assessment_firo.png',
    inspiredBy: 'PIRO Assessment',
    description:
      'The PIRO (Professional Interpersonal Relations Orientation) assessment measures interpersonal needs across three dimensions: Inclusion, Control, and Affection. It helps understand how you relate to others and what you need in relationships.',
    acknowledgement: 'Based on Schutz PIRO theory',
  },
  cognitive: {
    image: '/assessment_cognitive.png',
    inspiredBy: 'Cognitive Ability Test',
    description:
      'This tests for professionals measure mental capabilities like problem solving, reasoning, learning speed to predict job performance. These evaluate verbal, numerical, and spatial skills to determine a candidate\'s aptitude for complex tasks and training. Measure general mental ability (GMA).',
    acknowledgement: null,
  },
  psychometric: {
    image: '/assessment_psychometric.png',
    inspiredBy: 'Psychometric Assessment',
    description:
      'Psychometric assessments are standardized tools used to objectively measure an individual\'s mental capabilities, personality traits, and behavioral style. They provide employers with reliable data to support hiring decisions, talent development, and team building—going beyond what interviews alone can reveal.',
    acknowledgement: 'Based on validated psychometric measurement standards',
  },
  personality: {
    image: '/assessment_big5.png',
    inspiredBy: 'Personality Assessment',
    description:
      'Personality assessments measure enduring traits, values, and behavioral tendencies that shape how individuals interact with the world. These tools—including value assessments and trait-based models—help organizations understand cultural fit, motivation drivers, and interpersonal compatibility for better team composition.',
    acknowledgement: null,
  },
  situational: {
    image: '/assessment_situational.png',
    inspiredBy: 'Situational Judgment Test',
    description:
      'Situational Judgment Tests (SJTs) present realistic work-related scenarios to assess how candidates respond to workplace challenges. They measure judgment, decision-making, and alignment with organizational values—making them a powerful predictor of job performance across roles.',
    acknowledgement: null,
  },
  aptitude: {
    image: '/assessment_situational.png',
    inspiredBy: 'Aptitude Assessment',
    description:
      'Aptitude assessments evaluate an individual\'s potential to perform tasks and solve problems in specific domains. These tests measure innate abilities including situational judgment, logical reasoning, and practical decision-making skills that predict job success and training readiness.',
    acknowledgement: null,
  },
  professional: {
    image: '/assessment_professional.png',
    inspiredBy: 'Professional Skills Assessment',
    description:
      'Professional skills assessments evaluate role-specific competencies, technical knowledge, and workplace readiness. They provide a structured way to benchmark candidates against industry standards and identify skill gaps for targeted learning and development.',
    acknowledgement: null,
  },
  // Sub-categories (more specific)
  MBTI: {
    image: '/assessment_mbti.png',
    inspiredBy: 'MBTI Assessment',
    description: 'The Myers-Briggs Type Indicator assessment measures four dimensions of personality to help understand your unique personality type.',
    acknowledgement: null,
  },
  DISC: {
    image: '/assessment_disc.png',
    inspiredBy: 'DISC Assessment',
    description: 'DISC behavioral assessment categorizes personalities into Dominance, Influence, Steadiness, and Conscientiousness types.',
    acknowledgement: null,
  },
  PIRO: {
    image: '/assessment_firo.png',
    inspiredBy: 'PIRO Assessment',
    description: 'Professional Interpersonal Relations Orientation (PIRO) measures inclusion, control, and affection needs in relationships.',
    acknowledgement: null,
  },
  Big5: {
    image: '/assessment_big5.png',
    inspiredBy: 'Big Five Assessment',
    description: 'The Big Five personality model measures openness, conscientiousness, extraversion, agreeableness, and neuroticism.',
    acknowledgement: null,
  },
  Hogan: {
    image: '/assessment_hogan.png',
    inspiredBy: 'TraitMap Index',
    description: 'TraitMap Index assessments measure workplace-relevant traits and derailment risks.',
    acknowledgement: null,
  }
};

const getDifficultyBadge = (difficulty) => {
  const styles = {
    basic: 'bg-green-100 text-green-700',
    moderate: 'bg-yellow-100 text-yellow-800',
    tough: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[difficulty] || styles.basic}`}>
      {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1) || 'Basic'}
    </span>
  );
};

const Assessments = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const orgPrefix = orgSlug ? `/o/${orgSlug}` : '';
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [passcodeModal, setPasscodeModal] = useState({ show: false, assessmentId: null, assessmentCategory: null, passcode: '' });
  const [verifying, setVerifying] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState({ show: false, assessment: null });
  const [shareModal, setShareModal] = useState({ show: false, assessment: null });
  const [unlockModal, setUnlockModal] = useState({ show: false, assessment: null });
  const [testTakerModal, setTestTakerModal] = useState({ show: false, assessment: null });
  const [purchasesModal, setPurchasesModal] = useState({ show: false, assessment: null });
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const isUserAdmin = user?.role === 'admin' || user?.role === 'superadmin';
      const response = isUserAdmin
        ? await assessmentService.getAssessments()
        : await assessmentService.getMyAssignments();
      setAssessments(response.data?.assessments || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await assessmentService.deleteAssessment(id);
      fetchAssessments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete assessment');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await assessmentService.duplicateAssessment(id);
      fetchAssessments();
    } catch (error) {
      console.error('Error duplicating assessment:', error);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await assessmentService.togglePublish(id);
      fetchAssessments();
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const filteredAssessments = assessments
    .filter((assessment) => {
      const matchesSearch =
        assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || assessment.category === filterCategory;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'published' && assessment.isPublished) ||
        (filterStatus === 'draft' && !assessment.isPublished);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      // Unlocked assessments first (isLocked = false), then locked (isLocked = true)
      // If both have same status, sort by createdAt descending
      if (a.isLocked === b.isLocked) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return a.isLocked ? 1 : -1;
    });

  const getTestRoute = (assessmentId, category) => {
    if (category === 'big5') return `${orgPrefix}/assessments/${assessmentId}/big5/terms`;
    if (category === 'disc') return `${orgPrefix}/assessments/${assessmentId}/disc/terms`;
    return `${orgPrefix}/assessments/${assessmentId}/terms`;
  };

  const handleVerifyPasscode = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await attemptService.verifyPasscode(passcodeModal.assessmentId, passcodeModal.passcode);
      const category = passcodeModal.assessmentCategory;
      setPasscodeModal({ show: false, assessmentId: null, assessmentCategory: null, passcode: '' });
      navigate(getTestRoute(passcodeModal.assessmentId, category));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid passcode');
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleMute = async (id) => {
    try {
      await assessmentService.toggleMute(id);
      fetchAssessments();
    } catch (error) {
      console.error('Error toggling mute status:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle mute status');
    }
  };

  const handleRefundUnattempted = async (assessment) => {
    const testsLocked = Math.max(0, (assessment.assignedUsers?.length || 0) - (assessment.orgUnlockInfo?.testsUsed || 0));
    if (testsLocked <= 0) {
      toast.warning('No locked test slots to refund.');
      return;
    }
    if (!confirm(`Refund credits for all assigned users who haven't attempted this test? This will free up ${testsLocked} locked test slot(s).`)) return;
    try {
      const response = await assessmentService.refundUnattempted(assessment._id);
      toast.success(response.message);
      fetchAssessments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refund unattempted tests');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? 'Manage assessments and evaluations' : 'Your assigned assessments'}
          </p>
        </div>
        {user?.role === 'superadmin' && (
          <Link
            to={`${orgPrefix}/assessments/create`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assessment
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredAssessments.map((assessment) => {
          const subCategory = assessment.subCategory?.toUpperCase() || '';
          const category = assessment.category || '';
          let meta = CATEGORY_META[subCategory] || CATEGORY_META[category] || {};
          const heroImage = meta.image || null;

          return (
            <div
              key={assessment._id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col relative"
            >
              {/* Lock Overlay for Admin - Blurred locked assessments */}
              {isAdmin && assessment.isLocked && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl cursor-pointer px-6"
                  onClick={() => setUnlockModal({ show: true, assessment })}>
                  <Lock className="w-7 h-7 text-gray-400 mb-2" />
                  <p className="text-base font-bold text-gray-800 mb-1 text-center">
                    {meta.inspiredBy || assessment.title}
                  </p>
                  <p className="text-xs text-gray-500 mb-1 text-center line-clamp-2">
                    {assessment.description || meta.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-amber-600 font-medium mb-3">
                    <Coins className="w-4 h-4" />
                    {assessment.effectiveCreditCost || 5} credits per test
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUnlockModal({ show: true, assessment }); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Unlock className="w-4 h-4" />
Unlock Assessment
                  </button>
                </div>
              )}

              {isAdmin && !assessment.isLocked && assessment.orgUnlockInfo && (() => {
                const totalAllocated = assessment.orgUnlockInfo.testsAllowed || 0;
                const totalUsed = assessment.orgUnlockInfo.testsUsed || 0;
                const slotsRemaining = Math.max(0, totalAllocated - totalUsed);
                return slotsRemaining <= 0 ? (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl cursor-pointer px-6"
                    onClick={() => setUnlockModal({ show: true, assessment })}>
                    <AlertTriangle className="w-7 h-7 text-red-400 mb-2" />
                    <p className="text-base font-bold text-gray-800 mb-1 text-center">
                      No Slots Available
                    </p>
                    <p className="text-xs text-gray-500 mb-3 text-center">
                      Purchase more slots to add test takers
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUnlockModal({ show: true, assessment }); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <Coins className="w-4 h-4" />
                      Buy More Slots
                    </button>
                  </div>
                ) : null;
      })()}
              
              {/* Hero Image */}
              <div className="relative w-full h-36 overflow-hidden bg-gray-100">
                {assessment.bannerImage ? (
                  <img
                    src={`/${assessment.bannerImage}`}
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
                {/* Published badge (top-right) */}
                <div className="absolute top-3 right-3">
                  {assessment.isPublished ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold shadow">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold shadow">
                      Draft
                    </span>
                  )}
                </div>
                {/* Passcode badge */}
                {assessment.requirePasscode && (
                  <div className="absolute top-3 left-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold shadow">
                      <Lock className="w-3 h-3" />
                      Passcode
                    </span>
                  </div>
                )}
                {/* Muted badge */}
                {assessment.isMuted && (
                  <div className="absolute bottom-3 left-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold shadow">
                      <VolumeX className="w-3 h-3" />
                      Muted
                    </span>
                  </div>
                )}
                {/* Public link badge */}
                {assessment.publicAccessToken && (
                  <div className="absolute bottom-3 right-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold shadow">
                      <LinkIcon className="w-3 h-3" />
                      Public
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">
                  {assessment.title}
                </h3>

                {assessment.subcategory ? (
                  <p className="text-sm italic text-gray-500 mb-2">{assessment.subcategory}</p>
                ) : (
                  <p className="text-sm italic text-gray-500 mb-2">Inspired by {meta.inspiredBy}</p>
                )}

                {/* Description with Expandable See More */}
                <div className="mb-3 flex-1 flex flex-col">
                  <div className="cursor-pointer group">
                    <p className={`text-xs text-gray-600 text-justify leading-relaxed flex-1 transition-all duration-300 ${expandedDescriptions.has(assessment._id) ? '' : 'line-clamp-2'}`}>
                      {assessment.description || meta.description || 'No description provided.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleDescription(assessment._id)}
                      className="text-xs font-semibold text-indigo-600 mt-1 hover:underline"
                    >
                      {expandedDescriptions.has(assessment._id) ? 'See less' : 'See more'}
                    </button>
                  </div>
                </div>

                {/* Acknowledgement */}
                {meta.acknowledgement && (
                  <p className="text-xs text-gray-400 mb-3 italic">{meta.acknowledgement}</p>
                )}

                {/* Meta row */}
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

                {/* Unlock status for admin (unlocked assessments) */}
                {/* {isAdmin && !assessment.isLocked && assessment.orgUnlockInfo && (
 <div className="flex items-center gap-2 mb-3">
   <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
     <Unlock className="w-3 h-3" />
     {Math.max(0, assessment.orgUnlockInfo.testsAllowed - (assessment.assignedUsers?.length || 0))} remaining
   </span>
   <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
     <Lock className="w-3 h-3" />
     {Math.max(0, (assessment.assignedUsers?.length || 0) - (assessment.orgUnlockInfo.testsUsed || 0))} locked
   </span>
 </div>
 )} */}

                {/* Member allocation info for users */}
                {!isAdmin && assessment.memberAllocation && (
                  <div className="flex items-center gap-2 mb-3">
                    {assessment.memberAllocation.testsRemaining <= 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                        <Unlock className="w-3 h-3" />
                        No slots left
                      </span>
                    ) : assessment.memberAllocation.testsRemaining <= 2 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        <Unlock className="w-3 h-3" />
                        {assessment.memberAllocation.testsRemaining} slots left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        <Unlock className="w-3 h-3" />
                        {assessment.memberAllocation.testsRemaining} slots remaining
                      </span>
                    )}
                    {assessment.memberAllocation.testsRemaining > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                        {assessment.memberAllocation.testsDistributed} used
                      </span>
                    )}
                  </div>
                )}

                {/* Admin slot info for unlocked assessments */}
                {isAdmin && !assessment.isLocked && assessment.orgUnlockInfo && (() => {
                  const totalAllocated = assessment.orgUnlockInfo.testsAllowed || 0;
                  const totalUsed = assessment.orgUnlockInfo.testsUsed || 0;
                  const slotsRemaining = Math.max(0, totalAllocated - totalUsed);
                  return (
                    <div className="flex items-center gap-2 mb-3">
                      {slotsRemaining <= 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                          <Coins className="w-3 h-3" />
                          No slots left
                        </span>
                      ) : slotsRemaining <= 2 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                          <Coins className="w-3 h-3" />
                          {slotsRemaining} slots left
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                          <Coins className="w-3 h-3" />
                          {slotsRemaining} slots remaining
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                        {totalUsed} used
                      </span>
                    </div>
                  );
                })()}

                {/* Action row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {isAdmin ? (
                    user?.role === 'superadmin' ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link
                          to={`${orgPrefix}/assessments/${assessment._id}`}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(assessment._id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(assessment._id)}
                          className={`p-2 rounded-lg transition-colors ${assessment.isPublished ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={assessment.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {assessment.isPublished ? <FileX className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setAssignmentModal({ show: true, assessment })}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Assign to Users/Groups"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        {assessment.requirePasscode && assessment.passcode && (
                          <button
                            onClick={() => setShareModal({ show: true, assessment })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Share Passcode"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleMute(assessment._id)}
                          className={`p-2 rounded-lg transition-colors ${assessment.isMuted ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:bg-gray-100'}`}
                          title={assessment.isMuted ? 'Unmute' : 'Mute'}
                        >
                          {assessment.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setPurchasesModal({ show: true, assessment })}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Purchases"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(assessment._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => setAssignmentModal({ show: true, assessment })}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Add Members"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setUnlockModal({ show: true, assessment })}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Buy More Slots"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                        {assessment.isLocked === false && (
                          <>
                            <button
                              onClick={() => setTestTakerModal({ show: true, assessment })}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Add Test Taker"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {assessment.orgUnlockInfo && Math.max(0, (assessment.assignedUsers?.length || 0) - (assessment.orgUnlockInfo.testsUsed || 0)) > 0 && (
                          <button
                            onClick={() => handleRefundUnattempted(assessment)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                      assessment.memberAllocation && (
                      <div className={`${assessment.memberAllocation.testsRemaining <= 0 ? 'opacity-50 pointer-events-none blur-[1px] select-none relative' : ''}`}>
                        {assessment.memberAllocation.testsRemaining <= 0 && (
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium text-sm shadow">
                              No slots left
                            </div>
                          </div>
                        )}
                        {assessment.memberAllocation.testsRemaining > 0 && (
                          <button
                            onClick={() => setTestTakerModal({ show: true, assessment })}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <Share2 className="w-4 h-4 mr-1.5" />
                            Add Test Taker
                          </button>
                        )}
                      </div>
                    )
                  )}
                  {isAdmin && assessment.averageScore > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <BarChart3 className="w-4 h-4" />
                      {assessment.averageScore.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssessments.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {isAdmin ? 'No assessments found' : 'No assessments assigned to you yet'}
          </p>
          {user?.role === 'superadmin' && (
            <Link
              to={`${orgPrefix}/assessments/create`}
              className="inline-flex items-center mt-4 text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create your first assessment
            </Link>
          )}
        </div>
      )}

      {/* Passcode Modal */}
      {passcodeModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Enter Passcode</h2>
            </div>
            <p className="text-gray-600 mb-4">
              This assessment requires a passcode to start. Please enter the passcode provided by your administrator.
            </p>
            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passcode</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={passcodeModal.passcode}
                  onChange={(e) => setPasscodeModal({ ...passcodeModal, passcode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 text-lg tracking-widest text-center uppercase focus:ring-2 focus:ring-indigo-500"
                  placeholder="ENTER CODE"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPasscodeModal({ show: false, assessmentId: null, assessmentCategory: null, passcode: '' })}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || !passcodeModal.passcode.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Start Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assignmentModal.show && assignmentModal.assessment && (
        <AssessmentAssignmentModal
          assessment={assessments.find(a => a._id === assignmentModal.assessment._id) || assignmentModal.assessment}
          onClose={() => setAssignmentModal({ show: false, assessment: null })}
          onSuccess={fetchAssessments}
        />
      )}

      {/* Share Passcode Modal */}
      {shareModal.show && shareModal.assessment && (
        <SharePasscodeModal
          assessment={shareModal.assessment}
          onClose={() => setShareModal({ show: false, assessment: null })}
        />
      )}

      {/* Unlock Assessment Modal */}
      {unlockModal.show && unlockModal.assessment && (
        <UnlockAssessmentModal
          assessment={unlockModal.assessment}
          onClose={() => setUnlockModal({ show: false, assessment: null })}
          onSuccess={() => { setUnlockModal({ show: false, assessment: null }); fetchAssessments(); }}
        />
      )}

      {/* Add Test Taker Modal */}
      {testTakerModal.show && testTakerModal.assessment && (
        <AddTestTakerModal
          assessment={testTakerModal.assessment}
          onClose={() => setTestTakerModal({ show: false, assessment: null })}
          onSuccess={() => { setTestTakerModal({ show: false, assessment: null }); fetchAssessments(); }}
        />
      )}

      {/* Purchases Modal */}
      {purchasesModal.show && purchasesModal.assessment && (
        <PurchasesModal
          assessment={purchasesModal.assessment}
          onClose={() => setPurchasesModal({ show: false, assessment: null })}
        />
      )}
    </div>
  );
};

// Share Passcode Modal Component
const SharePasscodeModal = ({ assessment, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const textToCopy = `Assessment: ${assessment.title}\nPasscode: ${assessment.passcode}\n\nClick here to start: ${window.location.origin}/assessments/${assessment._id}/take`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPasscodeOnly = () => {
    navigator.clipboard.writeText(assessment.passcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Share2 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Share Passcode</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
            <p className="text-gray-900 font-medium">{assessment.title}</p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
            <label className="block text-sm font-medium text-amber-800 mb-2">Passcode</label>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-2xl font-bold text-amber-700 tracking-widest text-center bg-white px-4 py-2 rounded border border-amber-200">
                {assessment.passcode}
              </code>
              <button
                onClick={handleCopyPasscodeOnly}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p className="mb-2">Share this passcode with users who need to take this assessment.</p>
            <p>Users will need to enter this code before starting the test.</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Full Invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Purchases Modal Component
const PurchasesModal = ({ assessment, onClose }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrg, setExpandedOrg] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await assessmentService.getAssessmentPurchases(assessment._id);
      setPurchases(response.data?.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assessment Purchases</h2>
              <p className="text-sm text-gray-500">{assessment.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No organizations have purchased this assessment yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.organization.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  {/* Organization Header */}
                  <button
                    onClick={() => setExpandedOrg(expandedOrg === purchase.organization.id ? null : purchase.organization.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    {purchase.organization.logo ? (
                      <img
                        src={purchase.organization.logo.startsWith('http') ? purchase.organization.logo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${purchase.organization.logo}`}
                        alt={purchase.organization.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${purchase.organization.primaryColor || '#6366f1'}15` }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: purchase.organization.primaryColor || '#6366f1' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{purchase.organization.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" />
                          {purchase.testsAllowed} tests
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          {purchase.testsUsed} used
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          {purchase.creditsLocked} credits
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(purchase.unlockedAt).toLocaleDateString()}
                      </span>
                      {expandedOrg === purchase.organization.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedOrg === purchase.organization.id && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Assigned Users</p>
                          <p className="text-lg font-bold text-gray-900">{purchase.assignedUsers.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Completed</p>
                          <p className="text-lg font-bold text-green-600">{purchase.attempts.completed}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">In Progress</p>
                          <p className="text-lg font-bold text-amber-600">{purchase.attempts.inProgress}</p>
                        </div>
                      </div>

                      {/* Assigned Users List */}
                      {purchase.assignedUsers.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Assigned Users</p>
                          <div className="space-y-2">
                            {purchase.assignedUsers.map((user) => (
                              <div key={user.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-gray-100">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                  style={{ backgroundColor: purchase.organization.primaryColor || '#6366f1' }}
                                >
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {user.fullName || `${user.firstName} ${user.lastName}`}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                  {user.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {purchase.assignedUsers.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">No users assigned yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assessments;
