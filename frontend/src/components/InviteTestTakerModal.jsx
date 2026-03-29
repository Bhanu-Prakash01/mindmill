import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { assessmentService, inviteService, organizationService } from '../services';

const InviteTestTakerModal = ({ assessment: passedAssessment, onClose, onSuccess }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(passedAssessment || null);
  const [form, setForm] = useState({
    testTakerName: '',
    testTakerEmail: '',
    testTakerPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(!passedAssessment);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!passedAssessment) {
      fetchAssessments();
    }
  }, [passedAssessment]);

  const fetchAssessments = async () => {
    try {
      setLoadingAssessments(true);
      const response = await assessmentService.getAssessments({ status: 'active', limit: 50 });
      const allAssessments = response.data?.assessments || [];
      // Filter to only unlocked assessments
      const unlocked = allAssessments.filter(a => !a.isLocked);
      setAssessments(unlocked);
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) {
      setError('Please select an assessment');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await inviteService.createInvite({
        assessmentId: selectedAssessment._id,
        testTakerName: form.testTakerName.trim(),
        testTakerEmail: form.testTakerEmail.trim(),
        testTakerPhone: form.testTakerPhone.trim()
      });

      if (response.success) {
        setSuccess(response.data?.emailSent ? 'Invite sent successfully! Email delivered.' : 'Invite created but email delivery failed. You can resend later.');
        setForm({ testTakerName: '', testTakerEmail: '', testTakerPhone: '' });
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Invite Test Taker</h2>
            <p className="text-sm text-gray-500 mt-1">Send an assessment invitation via email</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assessment Selector (if no assessment passed) */}
        {!passedAssessment && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Assessment
            </label>
            {loadingAssessments ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading assessments...
              </div>
            ) : assessments.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                No unlocked assessments available. Admin must unlock assessments first.
              </p>
            ) : (
              <select
                value={selectedAssessment?._id || ''}
                onChange={(e) => {
                  const a = assessments.find(a => a._id === e.target.value);
                  setSelectedAssessment(a);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose an assessment...</option>
                {assessments.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.title} ({a.category}) - {a.effectiveCreditCost || 5} credits/test
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Selected Assessment Info */}
        {selectedAssessment && passedAssessment && (
          <div className="bg-gray-50 rounded-lg p-4 mb-5">
            <h3 className="font-semibold text-gray-900">{selectedAssessment.title}</h3>
            <p className="text-sm text-gray-500 capitalize">
              {selectedAssessment.category} &middot; {selectedAssessment.totalQuestions || 0} questions
            </p>
          </div>
        )}

        {/* Slot Info */}
        {selectedAssessment?.orgUnlockInfo && (
          <div className="bg-indigo-50 rounded-lg p-3 mb-5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <p className="text-sm text-indigo-700">
              {Math.max(0, selectedAssessment.orgUnlockInfo.testsRemaining)} test slots remaining
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Taker Name *
            </label>
            <input
              type="text"
              required
              value={form.testTakerName}
              onChange={(e) => setForm({ ...form, testTakerName: e.target.value })}
              placeholder="Full name of the test taker"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={form.testTakerEmail}
              onChange={(e) => setForm({ ...form, testTakerEmail: e.target.value })}
              placeholder="test.taker@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={form.testTakerPhone}
              onChange={(e) => setForm({ ...form, testTakerPhone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedAssessment}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteTestTakerModal;
