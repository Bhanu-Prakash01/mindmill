import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assessmentService } from '../../services';
import { Link, useNavigate } from 'react-router-dom';
import { attemptService } from '../../services';
import AssessmentAssignmentModal from '../../components/AssessmentAssignmentModal';
import {
 FileText,
 Plus,
 Search,
 Edit2,
 Trash2,
 Copy,
 Eye,
 EyeOff,
 Clock,
 Users,
 BarChart3,
 CheckCircle,
 XCircle,
 Play,
 Lock,
 UserPlus,
 Share2,
 Link as LinkIcon,
 Volume2,
 VolumeX
} from 'lucide-react';

// Category metadata: image, description, acknowledgement
const CATEGORY_META = {
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
 situational: {
 image: '/assessment_situational.png',
 inspiredBy: 'Situational Judgment Test',
 description:
 'Situational Judgment Tests (SJTs) present realistic work-related scenarios to assess how candidates respond to workplace challenges. They measure judgment, decision-making, and alignment with organizational values—making them a powerful predictor of job performance across roles.',
 acknowledgement: null,
 },
 professional: {
 image: '/assessment_professional.png',
 inspiredBy: 'Professional Skills Assessment',
 description:
 'Professional skills assessments evaluate role-specific competencies, technical knowledge, and workplace readiness. They provide a structured way to benchmark candidates against industry standards and identify skill gaps for targeted learning and development.',
 acknowledgement: null,
 },
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
 const navigate = useNavigate();
 const [assessments, setAssessments] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [filterCategory, setFilterCategory] = useState('all');
 const [filterStatus, setFilterStatus] = useState('all');
 const [passcodeModal, setPasscodeModal] = useState({ show: false, assessmentId: null, assessmentCategory: null, passcode: '' });
 const [verifying, setVerifying] = useState(false);
 const [assignmentModal, setAssignmentModal] = useState({ show: false, assessment: null });
 const [shareModal, setShareModal] = useState({ show: false, assessment: null });
 const [publicLinkModal, setPublicLinkModal] = useState({ show: false, assessment: null, loading: false, link: null });

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
 alert(error.response?.data?.message || 'Failed to delete assessment');
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

 const filteredAssessments = assessments.filter((assessment) => {
 const matchesSearch =
 assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 assessment.description?.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesCategory = filterCategory === 'all' || assessment.category === filterCategory;
 const matchesStatus =
 filterStatus === 'all' ||
 (filterStatus === 'published' && assessment.isPublished) ||
 (filterStatus === 'draft' && !assessment.isPublished);
 return matchesSearch && matchesCategory && matchesStatus;
 });

 const getTestRoute = (assessmentId, category) => {
 if (category === 'big5') return `/assessments/${assessmentId}/big5`;
 if (category === 'disc') return `/assessments/${assessmentId}/disc`;
 return `/assessments/${assessmentId}/take`;
 };

 const handleStartTest = (assessment) => {
 if (assessment.requirePasscode) {
 setPasscodeModal({ show: true, assessmentId: assessment._id, assessmentCategory: assessment.category, passcode: '' });
 } else {
 navigate(getTestRoute(assessment._id, assessment.category));
 }
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
  alert(error.response?.data?.message || 'Invalid passcode');
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
  alert(error.response?.data?.message || 'Failed to toggle mute status');
  }
  };

  const handleGeneratePublicLink = async (assessment) => {
  setPublicLinkModal({ show: true, assessment, loading: true, link: null });
  try {
  const response = await assessmentService.generatePublicLink(assessment._id);
  setPublicLinkModal({ show: true, assessment, loading: false, link: response.data });
  } catch (error) {
  setPublicLinkModal({ show: false, assessment: null, loading: false, link: null });
  alert(error.response?.data?.message || 'Failed to generate public link');
  }
  };

  const handleRevokePublicLink = async () => {
  try {
  await assessmentService.revokePublicLink(publicLinkModal.assessment._id);
  setPublicLinkModal({ show: false, assessment: null, loading: false, link: null });
  fetchAssessments();
  } catch (error) {
  alert(error.response?.data?.message || 'Failed to revoke link');
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
 <option value="cognitive">Cognitive</option>
 <option value="situational">Situational</option>
 <option value="professional">Professional</option>
 <option value="big5">Big Five Personality</option>
 <option value="disc">DISC Personality</option>
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
 const meta = CATEGORY_META[assessment.category] || {};
 const heroImage = meta.image || null;

 return (
 <div
 key={assessment._id}
 className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
 >
 {/* Hero Image */}
 <div className="relative w-full h-36 overflow-hidden bg-gray-100">
 {heroImage ? (
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
 <span className="bg-white rounded-full p-0.5 shadow" title="Published">
 <CheckCircle className="w-6 h-6 text-green-500" />
 </span>
 ) : (
 <span className="bg-white rounded-full p-0.5 shadow" title="Draft">
 <XCircle className="w-6 h-6 text-gray-400" />
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
 {/* Inspired by */}
 {meta.inspiredBy && (
 <p className="text-sm italic text-gray-500 mb-0.5">Inspired by</p>
 )}
 <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight">
 {meta.inspiredBy || assessment.title}
 </h3>

 {/* Description with Expandable See More */}
 <div className="mb-3 flex-1 flex flex-col">
   <label className="cursor-pointer group">
     <input type="checkbox" className="peer hidden" />
     <p className="text-xs text-gray-600 text-justify leading-relaxed flex-1 line-clamp-2 peer-checked:line-clamp-none transition-all duration-300">
       {meta.description || assessment.description || 'No description provided.'}
     </p>
     <span className="text-xs font-semibold text-indigo-600 mt-1 inline-block peer-checked:hidden group-hover:underline">
       See more
     </span>
     <span className="text-xs font-semibold text-indigo-600 mt-1 hidden peer-checked:inline-block group-hover:underline">
       See less
     </span>
   </label>
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

 {/* Action row */}
 <div className="flex items-center justify-between pt-3 border-t border-gray-100">
 {isAdmin ? (
 <div className="flex items-center gap-1">
 <Link
 to={`/assessments/${assessment._id}`}
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
 className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
 title={assessment.isPublished ? 'Unpublish' : 'Publish'}
 >
 {assessment.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
  onClick={() => handleGeneratePublicLink(assessment)}
  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  title="Generate Public Link"
  >
  <LinkIcon className="w-4 h-4" />
  </button>
  <button
  onClick={() => handleToggleMute(assessment._id)}
  className={`p-2 rounded-lg transition-colors ${assessment.isMuted ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:bg-gray-100'}`}
  title={assessment.isMuted ? 'Unmute' : 'Mute'}
  >
  {assessment.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
 <button
 onClick={() => handleStartTest(assessment)}
 className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
 >
 <Play className="w-4 h-4 mr-1.5" />
 Start Assessment
 </button>
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
 {isAdmin && (
 <Link
 to="/assessments/create"
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

  {/* Public Link Modal */}
  {publicLinkModal.show && publicLinkModal.assessment && (
  <PublicLinkModal
  assessment={publicLinkModal.assessment}
  link={publicLinkModal.link}
  loading={publicLinkModal.loading}
  onClose={() => setPublicLinkModal({ show: false, assessment: null, loading: false, link: null })}
  onRevoke={handleRevokePublicLink}
  />
  )}

  {/* Share Passcode Modal */}
 {shareModal.show && shareModal.assessment && (
 <SharePasscodeModal
 assessment={shareModal.assessment}
 onClose={() => setShareModal({ show: false, assessment: null })}
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

// Public Link Modal Component
const PublicLinkModal = ({ assessment, link, loading, onClose, onRevoke }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (link?.publicUrl) {
      navigator.clipboard.writeText(link.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Public Test Link</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Generating link...</p>
          </div>
        ) : link ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
              <p className="text-gray-900 font-medium">{assessment.title}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <label className="block text-sm font-medium text-green-800 mb-2">Public Link</label>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm text-green-700 bg-white px-3 py-2 rounded border border-green-200 break-all">
                  {link.publicUrl}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Expires: {new Date(link.expiresAt).toLocaleDateString()}
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <p className="mb-2">Share this link with test takers. They can access the assessment without logging in.</p>
              <p>The test taker will need to enter their name before starting.</p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={onRevoke}
                className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Revoke Link
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Copy & Close
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Failed to generate link. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessments;
