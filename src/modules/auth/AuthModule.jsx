import React, { useState } from 'react';
import { api } from '../../services/api';
import readsLogo from '../../../assets/reads-logo.png';

const AuthModule = ({ view, onLoginSuccess, onNavigate }) => {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'login') {
        const response = await api.auth.login(formData.email, formData.password);
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          onLoginSuccess();
        }
      } else if (view === 'signup') {
        await api.auth.signup(formData.name, formData.email, formData.password);
        setError('Account created! Please log in.');
        onNavigate('login');
      } else if (view === 'forgot-password') {
        await api.auth.forgotPassword(formData.email);
        setError('✅ Password reset link sent to your email! If you did not see an email, check your spam or junk folder.');
        setTimeout(() => onNavigate('login'), 3000);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isSuccess = error.startsWith('✅') || error.startsWith('Account created');

  return (
    /* ── Page wrapper ── */
    <div className="min-h-screen bg-reads-cream flex items-center justify-center px-4 py-8">

      {/* ── Phone shell / outer card ── */}
      <div className="w-full max-w-sm">

        {/* ── Brand header ── */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <img
            src={readsLogo}
            alt="$READS Logo"
            className="w-16 h-16 rounded-full object-contain shadow-reads-gold"
          />
          <div>
            <h1 className="font-display text-4xl font-black text-reads-navy leading-none tracking-tight">
              $READS
            </h1>
            <p className="text-reads-navy-soft text-sm font-medium mt-0.5 tracking-wide">
              Learn. Earn. Excel.
            </p>
          </div>
        </div>

        {/* ── Form card ── */}
        <div className="bg-white rounded-3xl shadow-reads-card px-7 pt-8 pb-7">

          {/* Card title */}
          <h2 className="font-display text-2xl font-bold text-reads-navy text-center mb-6">
            {view === 'login'
              ? 'Login'
              : view === 'signup'
              ? 'Create Account'
              : 'Reset Password'}
          </h2>

          {/* ── Error / success message ── */}
          {error && (
            <div
              className={`mb-5 p-3 rounded-xl text-sm font-medium ${
                isSuccess
                  ? 'bg-reads-green-bg text-reads-green border border-reads-green/30'
                  : 'bg-reads-red-bg text-reads-red border border-reads-red/30'
              }`}
            >
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full name — signup only */}
            {view === 'signup' && (
              <div>
                <label className="block text-reads-navy text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full h-13 px-4 py-3 rounded-xl bg-white border border-reads-gold-mid
                             text-reads-navy placeholder-reads-muted-light text-sm
                             focus:outline-none focus:border-reads-gold focus:ring-2 focus:ring-reads-gold/20
                             transition-colors"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-reads-navy text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full h-13 px-4 py-3 rounded-xl bg-white border border-reads-gold-mid
                           text-reads-navy placeholder-reads-muted-light text-sm
                           focus:outline-none focus:border-reads-gold focus:ring-2 focus:ring-reads-gold/20
                           transition-colors"
              />
            </div>

            {/* Password — login & signup only */}
            {view !== 'forgot-password' && (
              <div>
                <label className="block text-reads-navy text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full h-13 px-4 py-3 rounded-xl bg-white border border-reads-gold-mid
                             text-reads-navy placeholder-reads-muted-light text-sm
                             focus:outline-none focus:border-reads-gold focus:ring-2 focus:ring-reads-gold/20
                             transition-colors"
                />
              </div>
            )}

            {/* Forgot password link */}
            {view === 'login' && (
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-reads-teal hover:text-reads-teal-light text-sm font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-reads-navy text-base
                         bg-gradient-to-r from-reads-gold-light via-reads-gold to-reads-gold-dark
                         shadow-reads-gold hover:brightness-105 hover:-translate-y-0.5
                         active:translate-y-0 active:brightness-95
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                         transition-all duration-150"
            >
              {loading
                ? 'Please wait...'
                : view === 'login'
                ? 'Login'
                : view === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>

          {/* ── Sign up / sign in toggle ── */}
          <p className="mt-5 text-center text-sm text-reads-muted">
            {view === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-reads-teal hover:text-reads-teal-light font-semibold transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : view === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => onNavigate('login')}
                  className="text-reads-teal hover:text-reads-teal-light font-semibold transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="text-reads-teal hover:text-reads-teal-light font-semibold transition-colors"
              >
                Back to Sign in
              </button>
            )}
          </p>
        </div>

        {/* ── Footer links ── */}
        <div className="mt-5 text-center text-sm text-reads-muted">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-reads-navy transition-colors"
          >
            Back to Home
          </button>
          <span className="mx-2 text-reads-muted-light">|</span>
          <button
            onClick={() => onNavigate('privacy')}
            className="hover:text-reads-navy transition-colors"
          >
            Privacy Policy
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthModule;
