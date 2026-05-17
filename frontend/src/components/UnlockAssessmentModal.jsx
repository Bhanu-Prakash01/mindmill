import React, { useState, useEffect } from 'react';
import { assessmentService, organizationService } from '../services';
import { X, Lock, Unlock, AlertTriangle, CheckCircle, Coins } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

const UnlockAssessmentModal = ({ assessment, onClose, onSuccess }) => {
  const [testCount, setTestCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creditBalance, setCreditBalance] = useState(null);
  const [fetchingBalance, setFetchingBalance] = useState(true);

  const creditCostPerTest = assessment.effectiveCreditCost || 5;
  const totalCost = creditCostPerTest * testCount;
  const remaining = creditBalance ? creditBalance.total - creditBalance.used - (creditBalance.locked || 0) : 0;
  const canAfford = remaining >= totalCost;

  // If already unlocked, show current status
  const isAlreadyUnlocked = assessment.orgUnlockInfo != null;

  useEscapeKey(onClose);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setFetchingBalance(true);
      const response = await organizationService.getMyOrganization();
      setCreditBalance(response.data?.organization?.credits || null);
    } catch (err) {
      console.error('Error fetching credit balance:', err);
    } finally {
      setFetchingBalance(false);
    }
  };

  const handleUnlock = async () => {
    if (!canAfford) {
      setError('Insufficient credits');
      return;
    }
    if (testCount < 1) {
      setError('Must purchase at least 1 test');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await assessmentService.unlockAssessment(assessment._id, testCount);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlock assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-full">
              {isAlreadyUnlocked ? (
                <Unlock className="w-6 h-6 text-indigo-600" />
              ) : (
                <Lock className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {isAlreadyUnlocked ? 'Purchase More Tests' : 'Unlock Assessment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assessment Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-5">
          <h3 className="font-semibold text-gray-900 mb-1">{assessment.title}</h3>
          <p className="text-sm text-gray-500 capitalize mb-2">
            {assessment.category} &middot; {assessment.totalQuestions || 0} questions
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-gray-700">
              {creditCostPerTest} credits per test
            </span>
          </div>
        </div>

        {/* Current Unlock Status */}
        {isAlreadyUnlocked && (
          <div className="bg-green-50 rounded-lg p-3 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-green-800 font-medium">
                {Math.max(0, assessment.orgUnlockInfo.testsAllowed - (assessment.orgUnlockInfo.testsUsed || 0))} tests remaining
              </p>
            </div>
          </div>
        )}

        {/* Test Count Selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of tests to purchase
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="100"
              value={testCount}
              onChange={(e) => setTestCount(parseInt(e.target.value) || 1)}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <input
              type="number"
              min="1"
              max="999"
              value={testCount}
              onChange={(e) => setTestCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {creditCostPerTest} credits &times; {testCount} tests
            </span>
            <span className="text-lg font-bold text-indigo-700">{totalCost} credits</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Your balance</span>
            <span className={canAfford ? 'text-gray-700' : 'text-red-600 font-medium'}>
              {fetchingBalance ? '...' : `${remaining} remaining`}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 mb-4">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUnlock}
            disabled={loading || !canAfford || fetchingBalance}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Unlocking...' : `Unlock for ${totalCost} credits`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlockAssessmentModal;
