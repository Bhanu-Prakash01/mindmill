import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService, attemptService } from '../../services';
import {
  Lock,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const PublicTest = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testTakerName, setTestTakerName] = useState('');

  useEffect(() => {
    fetchPublicAssessment();
  }, [token]);

  const fetchPublicAssessment = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getPublicAssessment(token);
      if (response.data?.assessment) {
        setAssessment(response.data.assessment);
      } else {
        setError('Assessment not found or not available');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!testTakerName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setVerifying(true);
      const response = await attemptService.startPublicAttempt(assessment._id, {
        testTakerName: testTakerName.trim(),
        passcode: assessment.requirePasscode ? passcode : undefined
      });
      
      if (response.data?.attempt) {
        const { _id, category } = response.data.assessment || assessment;
        if (category === 'big5') {
          navigate(`/take/${token}/big5/${response.data.attempt._id}`);
        } else if (category === 'disc') {
          navigate(`/take/${token}/disc/${response.data.attempt._id}`);
        } else {
          navigate(`/take/${token}/test/${response.data.attempt._id}`);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start assessment');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment Unavailable</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          {assessment?.organization?.logo && (
            <img 
              src={assessment.organization.logo} 
              alt={assessment.organization.name}
              className="h-12 mx-auto mb-3"
            />
          )}
          <h1 className="text-2xl font-bold text-white">{assessment?.title}</h1>
          <p className="text-indigo-200 mt-1">{assessment?.organization?.name}</p>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-600 text-center">{assessment?.description}</p>

          {assessment?.instructions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <p className="text-sm text-gray-600">{assessment.instructions}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            {assessment?.timeBound?.enabled && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{assessment.timeBound.durationMinutes} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                {assessment?.category?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={testTakerName}
                onChange={(e) => setTestTakerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {assessment?.requirePasscode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passcode"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Passcode provided by your administrator
                </p>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Once you start, the timer will begin. 
              Make sure you have a stable internet connection and enough time to complete the assessment.
            </p>
          </div>

          <button
            onClick={handleStartTest}
            disabled={verifying}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting...
              </span>
            ) : (
              'Start Assessment'
            )}
          </button>
        </div>

        <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
          Powered by MindMil Assessments
        </div>
      </div>
    </div>
  );
};

export default PublicTest;
