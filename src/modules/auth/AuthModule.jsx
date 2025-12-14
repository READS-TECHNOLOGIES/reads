import React, { useState } from 'react';
import { api } from '../../services/api';

// --- Shared Input Field Component ---
const InputField = ({ label, type, name, value, onChange, placeholder, required = true, minLength }) => (
    <div>
        <label className="block text-sm font-medium text-card-muted mb-2">
            {label}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            minLength={minLength} 
            className="w-full px-4 py-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
        />
    </div>
);

// --- 1. Signup Form ---
const SignupForm = ({ onLoginSuccess, onNavigate }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.auth.signup(formData.name, formData.email, formData.password);
            onLoginSuccess(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-900/20 border-2 border-red-500 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}
            <InputField
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
            />
            <InputField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
            />
            <InputField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                minLength="8" 
            />
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-6 rounded-xl bg-cyan text-white font-bold hover:bg-primary-cyan-dark transition-all disabled:opacity-50 border-2 border-cyan shadow-lg hover:shadow-cyan/50"
            >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
            <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full text-sm text-card-muted hover:text-cyan transition-colors mt-4"
            >
                Already have an account? <span className="text-cyan font-semibold">Log In</span>
            </button>
        </form>
    );
};

// --- 2. Login Form ---
const LoginForm = ({ onLoginSuccess, onNavigate }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.auth.login(formData.email, formData.password);
            onLoginSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-900/20 border-2 border-red-500 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}
            <InputField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
            />
            <InputField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
            />
            <div className="flex justify-end">
                 <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-xs text-cyan hover:text-primary-cyan-dark transition-colors"
                >
                    Forgot Password?
                </button>
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-6 rounded-xl bg-cyan text-white font-bold hover:bg-primary-cyan-dark transition-all disabled:opacity-50 border-2 border-cyan shadow-lg hover:shadow-cyan/50"
            >
                {isLoading ? 'Signing In...' : 'Log In'}
            </button>
            <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full text-sm text-card-muted hover:text-cyan transition-colors mt-4"
            >
                Don't have an account? <span className="text-cyan font-semibold">Sign Up</span>
            </button>
        </form>
    );
};

// --- 3. Forgot Password Form ---
const ForgotPasswordForm = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const resetFormState = () => {
        setStep(1);
        setEmail('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
        setError('');
    };

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            await api.auth.requestPasswordReset(email);
            setMessage('Success! Check your email for a password reset link. It will expire in 24 hours.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please verify your email.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            await api.auth.resetPassword(resetToken, newPassword);
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => {
                resetFormState();
                onNavigate('login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={step === 1 ? handleRequestReset : handleResetPassword} className="space-y-4">
            {step === 1 && (
                <>
                    <p className="text-sm text-card-muted">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <InputField
                        label="Email Address"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {error && (
                        <div className="p-3 bg-red-900/20 border-2 border-red-500 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-green-900/20 border-2 border-green-500 rounded-lg">
                            <p className="text-sm text-green-400">{message}</p>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setMessage('');
                                    setError('');
                                    setStep(2);
                                }}
                                className="mt-2 text-xs text-cyan hover:text-primary-cyan-dark font-medium"
                            >
                                I have the token, let me enter it manually →
                            </button>
                        </div>
                    )}
                </>
            )}

            {step === 2 && (
                <>
                    <p className="text-sm text-card-muted">
                        Enter the reset token from your email and your new password (min 8 characters).
                    </p>
                    <InputField
                        label="Reset Token"
                        type="text"
                        name="resetToken"
                        placeholder="Paste token from email"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                    />
                    <InputField
                        label="New Password"
                        type="password"
                        name="newPassword"
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength="8" 
                    />
                    <InputField
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength="8" 
                    />

                    {error && (
                        <div className="p-3 bg-red-900/20 border-2 border-red-500 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </>
            )}

            {(message && step === 2) && (
                <div className="p-3 bg-green-900/20 border-2 border-green-500 rounded-lg">
                    <p className="text-sm text-green-400">{message}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || (step === 1 && message)}
                className="w-full py-3 mt-6 rounded-xl bg-cyan text-white font-bold hover:bg-primary-cyan-dark transition-all disabled:opacity-50 border-2 border-cyan shadow-lg hover:shadow-cyan/50"
            >
                {isLoading ? 'Processing...' : step === 1 ? 'Send Reset Link' : 'Reset Password'}
            </button>

            <div className="text-center pt-2">
                <button
                    type="button"
                    onClick={() => {
                        resetFormState();
                        onNavigate('login');
                    }}
                    className="text-xs text-card-muted hover:text-cyan transition-colors"
                >
                    ← Back to Login
                </button>
            </div>

            {step === 2 && (
                 <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={resetFormState}
                        className="text-xs text-card-muted hover:text-cyan transition-colors"
                    >
                        Resend Reset Link
                    </button>
                </div>
            )}
        </form>
    );
};

// --- Main Auth Module Component ---
export default function AuthModule({ view, onLoginSuccess, onNavigate }) {
    let content;
    let title;
    let subtitle;

    switch (view) {
        case 'signup':
            content = <SignupForm onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;
            title = 'Create Your Account';
            subtitle = 'Join thousands of learners earning $READS tokens';
            break;
        case 'forgot-password':
            content = <ForgotPasswordForm onNavigate={onNavigate} />;
            title = 'Reset Password';
            subtitle = 'We'll help you get back to learning';
            break;
        case 'login':
        default:
            content = <LoginForm onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;
            title = 'Welcome Back';
            subtitle = 'Sign in to continue learning and earning';
            break;
    }

    return (
        <div className="max-w-md mx-auto p-4 md:p-8">
            <div className="text-center mb-8">
                {/* Logo with gradient */}
                <div className="w-20 h-20 mx-auto mb-4 rounded-full shadow-xl bg-gradient-to-br from-cyan to-primary-cyan-dark flex items-center justify-center text-4xl text-white font-extrabold border-4 border-cyan">
                    $R
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">{title}</h2>
                <p className="text-sm text-gray-600 dark:text-card-muted">
                    {subtitle}
                </p>
            </div>
            
            {/* Auth Card */}
            <div className="bg-light-card dark:bg-dark-card p-6 md:p-8 rounded-2xl shadow-2xl border-2 border-cyan">
                {content}
            </div>

            {/* Footer info */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-card-muted">
                    By continuing, you agree to our Terms & Privacy Policy
                </p>
            </div>
        </div>
    );
}