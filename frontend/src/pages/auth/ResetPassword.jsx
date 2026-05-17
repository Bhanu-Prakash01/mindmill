import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services';
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center bg-indigo-50">
          <Lock className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Reset Password
        </h1>
        <p className="text-gray-500">
          Enter your new password below
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-4 sm:p-6 lg:p-8">
        {success ? (
          /* Success State */
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center bg-green-50">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-gray-500 mb-6">
              Your password has been reset successfully.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-all"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
