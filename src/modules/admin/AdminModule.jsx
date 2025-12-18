import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, Plus, ShieldOff, Trash2, Video, List, CheckCircle, AlertCircle, 
    Award, Settings, ArrowLeft, XCircle, RefreshCw, Shield, AlertTriangle, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import AIContentAssistant from './AIContentAssistant'; // 🤖 Import AI Assistant

// ====================================================================
// --- Toast Notification Component ---
// ====================================================================

const Toast = ({ message, type, onClose }) => {
    const colorMap = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-cyan border-cyan',
    };
    const IconMap = {
        success: CheckCircle,
        error: AlertCircle,
        info: List,
    };
    const Icon = IconMap[type] || List;
    const color = colorMap[type] || 'bg-cyan';

    if (!message) return null;

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl text-white ${color} flex items-center gap-3 z-50 transition-all duration-300 border-2`}>
            <Icon size={20} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <XCircle size={16} />
            </button>
        </div>
    );
};

// ====================================================================
// --- Lesson Creation Form ---
// ====================================================================

const LessonCreateForm = ({ onToast }) => {
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        content: '',
        video_url: '',
        order_index: 0,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'order_index' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.admin.createLesson(formData);
            onToast({ message: 'Lesson created successfully!', type: 'success' });
            setFormData({ category: '', title: '', content: '', video_url: '', order_index: 0 });
        } catch (error) {
            onToast({ message: 'Failed to create lesson.', type: 'error' });
            console.error('Lesson creation failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border-2 border-cyan">
            <h3 className="text-2xl font-bold text-white border-b border-cyan pb-3">Create New Lesson</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='col-span-1'>
                    <label className="block text-sm font-medium text-card-muted mb-2">Category</label>
                    <input 
                        type="text" 
                        name="category" 
                        value={formData.category} 
                        onChange={handleChange} 
                        required
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                        placeholder="e.g., JAMB Mathematics"
                    />
                </div>
                <div className='col-span-1'>
                    <label className="block text-sm font-medium text-card-muted mb-2">Order Index</label>
                    <input 
                        type="number" 
                        name="order_index" 
                        value={formData.order_index} 
                        onChange={handleChange} 
                        required
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                        placeholder="0"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-card-muted mb-2">Title</label>
                <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required
                    className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                    placeholder="Lesson Title"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-card-muted mb-2">Video URL (Optional)</label>
                <input 
                    type="url" 
                    name="video_url" 
                    value={formData.video_url} 
                    onChange={handleChange}
                    className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                    placeholder="https://www.youtube.com/watch?v=..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-card-muted mb-2">Content (Markdown/HTML)</label>
                <textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleChange} 
                    required
                    rows="10"
                    className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all resize-none"
                    placeholder="Enter the lesson content here..."
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-cyan text-white font-semibold rounded-lg shadow-lg hover:bg-primary-cyan-dark transition-all disabled:opacity-50 flex items-center justify-center border-2 border-cyan hover:shadow-cyan/50"
            >
                {isLoading ? <RefreshCw size={20} className="animate-spin mr-2" /> : <Plus size={20} className="mr-2" />}
                {isLoading ? 'Creating Lesson...' : 'Create Lesson'}
            </button>
        </form>
    );
};

// ====================================================================
// --- Quiz Configuration Form (Anti-Cheat) ---
// ====================================================================

const QuizConfigForm = ({ lessonId, existingConfig, onToast, onComplete }) => {
    const [config, setConfig] = useState({
        total_questions_in_pool: existingConfig?.total_questions_in_pool || 10,
        questions_per_quiz: existingConfig?.questions_per_quiz || 3,
        token_reward: existingConfig?.token_reward || 100,
        passing_score: existingConfig?.passing_score || 70,
        cooldown_seconds: existingConfig?.cooldown_seconds || 30,
        min_read_time_seconds: existingConfig?.min_read_time_seconds || 30,
        min_time_per_question: existingConfig?.min_time_per_question || 3,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (existingConfig) {
                await api.admin.updateQuizConfig(lessonId, config);
                onToast({ message: 'Quiz configuration updated!', type: 'success' });
            } else {
                await api.admin.createQuizConfig({ lesson_id: lessonId, ...config });
                onToast({ message: 'Quiz configuration created!', type: 'success' });
            }
            onComplete();
        } catch (error) {
            onToast({ message: `Failed to save config: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border-2 border-cyan space-y-4">
            <div className="flex items-center justify-between border-b border-cyan pb-3">
                <h4 className="text-xl font-bold text-white flex items-center">
                    <Shield size={20} className="mr-2 text-cyan" />
                    Anti-Cheat Configuration
                </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        📚 Total Questions in Pool
                    </label>
                    <input
                        type="number"
                        name="total_questions_in_pool"
                        value={config.total_questions_in_pool}
                        onChange={handleChange}
                        min="1"
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Total questions you'll upload</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        🎲 Questions Per Quiz
                    </label>
                    <input
                        type="number"
                        name="questions_per_quiz"
                        value={config.questions_per_quiz}
                        onChange={handleChange}
                        min="1"
                        max={config.total_questions_in_pool}
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Random questions shown per attempt</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        💰 Token Reward
                    </label>
                    <input
                        type="number"
                        name="token_reward"
                        value={config.token_reward}
                        onChange={handleChange}
                        min="0"
                        step="10"
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Tokens for passing</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        ✅ Passing Score (%)
                    </label>
                    <input
                        type="number"
                        name="passing_score"
                        value={config.passing_score}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Minimum score to pass</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        ⏱️ Cooldown (seconds)
                    </label>
                    <input
                        type="number"
                        name="cooldown_seconds"
                        value={config.cooldown_seconds}
                        onChange={handleChange}
                        min="0"
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Wait time between attempts</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        📖 Min Read Time (seconds)
                    </label>
                    <input
                        type="number"
                        name="min_read_time_seconds"
                        value={config.min_read_time_seconds}
                        onChange={handleChange}
                        min="0"
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Required lesson read time</p>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        ⏳ Min Time Per Question (seconds)
                    </label>
                    <input
                        type="number"
                        name="min_time_per_question"
                        value={config.min_time_per_question}
                        onChange={handleChange}
                        min="0"
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Minimum time required per question</p>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 flex items-center justify-center border-2 border-cyan"
            >
                {isLoading ? <RefreshCw size={20} className="animate-spin mr-2" /> : <Shield size={20} className="mr-2" />}
                {isLoading ? 'Saving...' : existingConfig ? 'Update Configuration' : 'Create Configuration'}
            </button>
        </form>
    );
};

// ====================================================================
// --- Quiz Creation Form ---
// ====================================================================

const QuizCreationForm = ({ lessonId, lessonTitle, onComplete, onToast }) => {
    const initialQuestion = { question: '', options: ['', '', '', ''], correct_option: 'A' };
    const [questions, setQuestions] = useState([initialQuestion]);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [quizConfig, setQuizConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await api.admin.getQuizConfig(lessonId);
                setQuizConfig(config);
            } catch (err) {
                setQuizConfig(null);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, [lessonId]);

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, initialQuestion]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        } else {
            onToast({ message: "Quiz must have at least one question.", type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const quizData = {
            lesson_id: lessonId,
            questions: questions.map((q) => ({
                ...q,
                correct_option: q.correct_option, 
            })),
        };

        try {
            await api.admin.createQuiz(quizData); 
            onToast({ message: `Quiz for "${lessonTitle}" created successfully!`, type: 'success' });
            onComplete();
        } catch (error) {
            onToast({ message: `Failed to create quiz: ${error.message}`, type: 'error' });
            console.error('Quiz creation failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getOptionLetter = (index) => String.fromCharCode(65 + index);

    if (loadingConfig) {
        return <div className="text-center p-8"><RefreshCw className="animate-spin mx-auto text-cyan" size={32} /></div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Create Quiz for: <span className='text-cyan'>{lessonTitle}</span>
            </h3>

            {/* Anti-Cheat Configuration Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-xl p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <Shield size={24} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
                                {quizConfig ? '✅ Anti-Cheat Configured' : '⚠️ Configure Anti-Cheat First'}
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                {quizConfig 
                                    ? `Pool: ${quizConfig.total_questions_in_pool} questions, Show: ${quizConfig.questions_per_quiz}, Reward: ${quizConfig.token_reward} tokens`
                                    : 'Set quiz rules, time requirements, and token rewards before uploading questions.'
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-semibold whitespace-nowrap"
                    >
                        {showConfig ? 'Hide Config' : quizConfig ? 'Update Config' : 'Setup Config'}
                    </button>
                </div>
            </div>

            {showConfig && (
                <QuizConfigForm
                    lessonId={lessonId}
                    existingConfig={quizConfig}
                    onToast={onToast}
                    onComplete={() => {
                        setShowConfig(false);
                        api.admin.getQuizConfig(lessonId).then(setQuizConfig).catch(() => setQuizConfig(null));
                    }}
                />
            )}

            {/* Quiz Questions Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border-2 border-cyan space-y-4">
                        <div className='flex justify-between items-center'>
                            <h4 className="text-xl font-semibold text-white">Question {qIndex + 1}</h4>
                            {questions.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => removeQuestion(qIndex)} 
                                    className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-black/20 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Question Text</label>
                            <textarea 
                                value={q.question} 
                                onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)} 
                                required
                                rows="3"
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all resize-none"
                                placeholder="Enter the question text"
                            />
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            {q.options.map((option, oIndex) => (
                                <div key={oIndex}>
                                    <label className="block text-sm font-medium text-card-muted mb-2">
                                        Option {getOptionLetter(oIndex)}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={option} 
                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} 
                                        required
                                        className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Correct Answer</label>
                            <select 
                                value={q.correct_option} 
                                onChange={(e) => handleQuestionChange(qIndex, 'correct_option', e.target.value)}
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                            >
                                {['A', 'B', 'C', 'D'].map((letter) => (
                                    <option key={letter} value={letter} className="bg-primary-navy dark:bg-dark-bg">{letter}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}

                <div className='flex justify-between items-center'>
                    <button 
                        type="button" 
                        onClick={addQuestion}
                        className="px-4 py-2 text-sm font-medium text-white bg-black/20 dark:bg-black/30 border-2 border-cyan-light rounded-lg hover:bg-black/30 dark:hover:bg-black/40 transition-colors"
                    >
                        <Plus size={16} className="inline-block mr-1"/> Add Question
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !quizConfig}
                        className="py-3 px-6 bg-cyan text-white font-semibold rounded-lg shadow-lg hover:bg-primary-cyan-dark transition-all disabled:opacity-50 flex items-center justify-center border-2 border-cyan"
                    >
                        {isLoading ? <RefreshCw size={20} className="animate-spin mr-2" /> : <CheckCircle size={20} className="mr-2" />}
                        {isLoading ? 'Uploading Quiz...' : 'Save Quiz'}
                    </button>
                </div>

                {!quizConfig && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                        ⚠️ Please configure anti-cheat settings before uploading questions
                    </p>
                )}
            </form>
        </div>
    );
};

// ====================================================================
// --- Suspicious Attempts Monitor (FIXED) ---
// ====================================================================

const SuspiciousAttemptsMonitor = ({ onToast }) => {
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAttempts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getSuspiciousAttempts(50);
            setAttempts(data);
        } catch (error) {
            onToast({ message: 'Failed to load suspicious attempts.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        fetchAttempts();
    }, [fetchAttempts]);

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <RefreshCw className="animate-spin mx-auto text-cyan mb-3" size={32} />
                <p className="text-card-muted">Loading suspicious attempts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                    <AlertTriangle size={24} className="mr-2 text-yellow-500" />
                    Suspicious Quiz Attempts ({attempts.length})
                </h3>
                <button
                    onClick={fetchAttempts}
                    className="px-4 py-2 bg-cyan text-white rounded-lg hover:bg-primary-cyan-dark flex items-center border-2 border-cyan"
                >
                    <RefreshCw size={16} className="mr-2" /> Refresh
                </button>
            </div>

            {attempts.length === 0 ? (
                <div className="text-center p-12 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500">
                    <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                    <p className="text-green-700 dark:text-green-300 font-semibold">✅ No suspicious attempts detected</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">All quiz submissions appear legitimate</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-light-card dark:bg-dark-card rounded-xl border-2 border-cyan">
                    <table className="w-full">
                        <thead className="bg-cyan/20 border-b-2 border-cyan">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Lesson</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Time Taken</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Expected Min</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Score</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Flagged At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-light">
                            {attempts.map((attempt) => (
                                <tr key={attempt.attempt_id} className="hover:bg-black/20 transition-colors">
                                    <td className="px-4 py-3 text-sm text-white font-medium">{attempt.user_name}</td>
                                    <td className="px-4 py-3 text-sm text-card-muted">{attempt.lesson_title}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="text-red-500 font-bold">{attempt.total_time_seconds}s</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-card-muted">{attempt.expected_min_time}s</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`font-semibold ${attempt.score >= 70 ? 'text-green-500' : 'text-red-500'}`}>
                                            {attempt.score}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-card-muted">
                                        {new Date(attempt.flagged_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>