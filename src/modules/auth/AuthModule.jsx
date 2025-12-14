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
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full max-w-md bg-primary-navy dark:bg-dark-card rounded-2xl shadow-2xl p-8 border border-cyan/30">
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <img 
          src={readsLogo} 
          alt="$READS Logo" 
          className="w-20 h-20 mx-auto mb-4 rounded-xl object-contain"
        />
        <h1 className="text-3xl font-bold text-card-light mb-2">
          {view === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-card-muted">
          {view === 'login' ? 'Sign in to continue learning' : 'Join $READS and start earning'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-orange/20 border border-orange/40 rounded-xl text-orange text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {view === 'signup' && (
          <div>
            <label className="block text-card-light font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-dark-card-light border border-cyan/20 text-card-light placeholder-card-muted focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50"
              placeholder="John Doe"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-card-light font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-dark-card-light border border-cyan/20 text-card-light placeholder-card-muted focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-card-light font-medium mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-dark-card-light border border-cyan/20 text-card-light placeholder-card-muted focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/50"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-yellow-500/20 text-yellow-400 font-bold hover:bg-yellow-500/30 transition-colors border border-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait...' : view === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {/* Toggle View */}
      <div className="mt-6 text-center">
        <button
          onClick={() => onNavigate(view === 'login' ? 'signup' : 'login')}
          className="text-cyan hover:text-cyan-dark transition-colors font-medium"
        >
          {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

export default AuthModule;