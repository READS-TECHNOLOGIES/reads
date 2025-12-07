import React, { useState } from 'react';
import { api } from '../../services/api';

// --- Shared Input Field Component ---
const InputField = ({ label, type, name, value, onChange, placeholder, required = true, minLength }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white transition-colors"
        />
    </div>
);

// --- 1. Signup Form (Original) ---
const SignupForm = ({ onLoginSuccess, onNavigate }) => {
    // ... (Original SignupForm implementation)
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
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
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
                placeholder="********"
                minLength="8" 
            />
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
            <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full text-sm text-gray-500 hover:underline mt-4"
            >
                Already have an account? Log In
            </button>
        </form>
    );
};

// --- 2. Login Form (Original) ---
const LoginForm = ({ onLoginSuccess, onNavigate }) => {
    // ... (Original LoginForm implementation)
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
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
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
                placeholder="********"
            />
            <div className="flex justify-end">
                 <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                    Forgot Password?
                </button>
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
                {isLoading ? 'Signing In...' : 'Log In'}
            </button>
            <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="w-full text-sm text-gray-500 hover:underline mt-4"
            >
                Don't have an account? Sign Up
            </button>
        </form>
    );
};

// --- 3. Functional Forgot Password Form (New) ---
const ForgotPasswordForm = ({ onNavigate }) => {
    const [step, setStep] = useState(1); // Step 1: Request reset | Step 2: Reset password
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

    // Step 1: Request password reset link
    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            await api.auth.requestPasswordReset(email);
            
            setMessage('Success! Check your email for a password reset link. It will expire in 24 hours.');
            // Usability Improvement: Allow user to manually proceed to step 2 after seeing the success message
            // setStep(2); // Commenting out to force user to confirm they have the token first
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please verify your email.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reset password with token
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        // Validation
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
            {/* Step 1: Request Reset */}
            {step === 1 && (
                <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter your email address and we will send you a link to reset your password.
                    </p>
                    <InputField
                        label="Email Address"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                     {/* Show message/error before the button for better visibility */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
                            {/* USABILITY FIX: Provide a way to manually enter token if link isn't working/received */}
                            <button 
                                type="button" 
                                onClick={() => {
                                    setMessage('');
                                    setError('');
                                    setStep(2);
                                }}
                                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                            >
                                I have the token, let me enter it manually.
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Step 2: Reset Password */}
            {step === 2 && (
                <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    
                    {/* Error Message in Step 2 */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}
                </>
            )}
            
            {/* Success Message in Step 2 only if password reset was successful */}
            {(message && step === 2) && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
                </div>
            )}


            <button
                type="submit"
                disabled={isLoading || (step === 1 && message)}
                className="w-full py-3 mt-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
                    className="text-xs text-gray-500 hover:underline"
                >
                    Back to Login
                </button>
            </div>
            
            {/* Added a button to manually restart the request flow if stuck in step 2 */}
            {step === 2 && (
                 <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={resetFormState}
                        className="text-xs text-gray-500 hover:underline"
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

    switch (view) {
        case 'signup':
            content = <SignupForm onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;
            title = 'Create Your Account';
            break;
        case 'forgot-password':
            // Use the functional component here
            content = <ForgotPasswordForm onNavigate={onNavigate} />;
            title = 'Forgot Password';
            break;
        case 'login':
        default:
            content = <LoginForm onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;
            title = 'Welcome Back';
            break;
    }

    return (
        <div className="max-w-md mx-auto p-4 md:p-8">
            <div className="text-center mb-8">
                {/* Placeholder Logo */}
                <div className="w-20 h-20 mx-auto mb-4 rounded-full shadow-lg bg-indigo-100 flex items-center justify-center text-4xl text-indigo-600 font-extrabold">
                    $R
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Sign in to start learning and earning $READS tokens.
                </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700">
                {content}
            </div>
        </div>
    );
}
