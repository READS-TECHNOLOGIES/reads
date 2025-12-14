import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import readsLogo from '../../../assets/reads-logo.png';

const ResetPasswordPage = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (!tokenFromUrl) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenFromUrl);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.auth.resetPassword(token, newPassword);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-general dark:bg-dark-general p-4">
        <div className="w-full max-w-md bg-primary-navy dark:bg-dark-card rounded-2xl shadow-2xl p-8 border border-cyan/30 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-card-light mb-2">Password Reset Successful!</h2>
            <p className="text-card-muted">Redirecting you to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-general dark:bg-dark-general p-4">
      <div className="w-full max-w-md bg-primary-navy dark:bg-dark-card rounded-2xl shadow-2xl p-8 border border-cyan/30">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img 
            src={readsLogo} 
            alt="$READS Logo" 
            className="w-20 h-20 mx-auto mb-4 rounded-xl object-contain"
          />
          <h1 className="text-3xl font-bold text-card-light mb-2">Reset Password</h1>
          <p className="text-card-muted">Enter your new password below</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-orange/20 border border-orange/40 rounded-xl text-orange text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-card-light font-medium mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-dark-card-light border border-cyan/20 text-card-light placeholder-card-muted focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50"
              placeholder="Enter new password"
              required
              minLength={8}
            />
            <p className="text-xs text-card-muted mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <label className="block text-card-light font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-dark-card-light border border-cyan/20 text-card-light placeholder-card-muted focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50"
              placeholder="Confirm new password"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 rounded-xl bg-yellow-500/20 text-yellow-400 font-bold hover:bg-yellow-500/30 transition-colors border border-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-cyan hover:text-cyan-dark transition-colors font-medium"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;