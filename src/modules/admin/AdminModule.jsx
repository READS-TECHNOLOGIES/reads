import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, Plus, ShieldOff, Trash2, Video, List, CheckCircle, AlertCircle, 
    Award, Settings, ArrowLeft, XCircle, RefreshCw, Shield, AlertTriangle, 
    LayoutDashboard, BookOpen, UserCog
} from 'lucide-react';
import { api } from '../../services/api';

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
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl text-white ${color} flex items-center gap-3 z-50 transition-all duration-300 border-2 animate-slide-in-right`}>
            <Icon size={20} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <XCircle size={16} />
            </button>
        </div>
    );
};

// ====================================================================
// --- Dashboard Overview Cards ---
// ====================================================================

const DashboardOverview = ({ stats, onToast }) => {
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        totalLessons: 0,
        totalQuizzes: 0,
        suspiciousAttempts: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const [users, lessons, suspicious] = await Promise.all([
                    api.admin.getUsers(),
                    api.admin.getAllLessons(),
                    api.admin.getSuspiciousAttempts(10)
                ]);

                setDashboardStats({
                    totalUsers: users.length,
                    totalLessons: lessons.length,
                    totalQuizzes: lessons.filter(l => l.quiz_count > 0).length,
                    suspiciousAttempts: suspicious.length
                });
            } catch (error) {
                onToast({ message: 'Failed to load dashboard stats', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [onToast]);

    const cards = [
        { 
            title: 'Total Users', 
            value: dashboardStats.totalUsers, 
            icon: Users, 
            color: 'bg-blue-500',
            gradient: 'from-blue-500 to-blue-600'
        },
        { 
            title: 'Total Lessons', 
            value: dashboardStats.totalLessons, 
            icon: BookOpen, 
            color: 'bg-purple-500',
            gradient: 'from-purple-500 to-purple-600'
        },
        { 
            title: 'Active Quizzes', 
            value: dashboardStats.totalQuizzes, 
            icon: List, 
            color: 'bg-cyan',
            gradient: 'from-cyan to-primary-cyan-dark'
        },
        { 
            title: 'Suspicious Activity', 
            value: dashboardStats.suspiciousAttempts, 
            icon: AlertTriangle, 
            color: 'bg-red-500',
            gradient: 'from-red-500 to-red-600'
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan-light animate-pulse">
                        <div className="h-12 bg-cyan-light/20 rounded mb-4"></div>
                        <div className="h-8 bg-cyan-light/20 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div 
                            key={idx} 
                            className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border-2 border-cyan hover:border-cyan-light transition-all hover:scale-105 duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient}`}>
                                    <Icon size={24} className="text-white" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1">{card.value}</h3>
                            <p className="text-sm text-card-muted">{card.title}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Action Card */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg border-2 border-red-400 text-white">
                    <div className="flex items-center space-x-3 mb-3">
                        <Shield size={28} />
                        <h3 className="text-xl font-bold">Anti-Cheat Monitor</h3>
                    </div>
                    <p className="text-white/80 text-sm mb-4">
                        {dashboardStats.suspiciousAttempts === 0 
                            ? '✅ No suspicious activity detected' 
                            : `⚠️ ${dashboardStats.suspiciousAttempts} flagged attempts require review`
                        }
                    </p>
                    <div className="flex items-center space-x-2 text-xs bg-white/20 px-3 py-2 rounded-lg w-fit">
                        <AlertTriangle size={16} />
                        <span>Real-time Detection Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// --- Lesson Creation Form ---
// ====================================================================

const LessonCreateForm = ({ onToast, onSuccess }) => {
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
        
        // Validation
        if (!formData.category.trim() || !formData.title.trim() || !formData.content.trim()) {
            onToast({ message: 'Please fill in all required fields', type: 'error' });
            return;
        }

        setIsLoading(true);

        try {
            await api.admin.createLesson(formData);
            onToast({ message: '✅ Lesson created successfully!', type: 'success' });
            setFormData({ category: '', title: '', content: '', video_url: '', order_index: 0 });
            if (onSuccess) onSuccess();
        } catch (error) {
            onToast({ message: `Failed to create lesson: ${error.message}`, type: 'error' });
            console.error('Lesson creation failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border-2 border-cyan">
            <h3 className="text-2xl font-bold text-white border-b border-cyan pb-3 flex items-center">
                <Plus size={24} className="mr-2 text-cyan" />
                Create New Lesson
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='col-span-1'>
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-medium text-card-muted mb-2">
                        Order Index <span className="text-red-500">*</span>
                    </label>
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
                <label className="block text-sm font-medium text-card-muted mb-2">
                    Title <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-sm font-medium text-card-muted mb-2">
                    Content (Markdown/HTML) <span className="text-red-500">*</span>
                </label>
                <textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleChange} 
                    required
                    rows="10"
                    className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all resize-none font-mono text-sm"
                    placeholder="Enter the lesson content here..."
                />
                <p className="text-xs text-card-muted mt-1">Supports Markdown and HTML formatting</p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-cyan text-white font-semibold rounded-lg shadow-lg hover:bg-primary-cyan-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan hover:shadow-cyan/50"
            >
                {isLoading ? (
                    <>
                        <RefreshCw size={20} className="animate-spin mr-2" />
                        Creating Lesson...
                    </>
                ) : (
                    <>
                        <Plus size={20} className="mr-2" />
                        Create Lesson
                    </>
                )}
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
        questions_per_quiz: existingConfig?.questions_per_quiz || 5,
        token_reward: existingConfig?.token_reward || 100,
        passing_score: existingConfig?.passing_score || 70,
        cooldown_seconds: existingConfig?.cooldown_seconds || 30,
        min_read_time_seconds: existingConfig?.min_read_time_seconds || 60,
        min_time_per_question: existingConfig?.min_time_per_question || 5,
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
        
        // Validation
        if (config.questions_per_quiz > config.total_questions_in_pool) {
            onToast({ 
                message: 'Questions per quiz cannot exceed total questions in pool', 
                type: 'error' 
            });
            return;
        }

        setIsLoading(true);

        try {
            if (existingConfig) {
                await api.admin.updateQuizConfig(lessonId, config);
                onToast({ message: '✅ Quiz configuration updated!', type: 'success' });
            } else {
                await api.admin.createQuizConfig({ lesson_id: lessonId, ...config });
                onToast({ message: '✅ Quiz configuration created!', type: 'success' });
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
                        required
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
                        required
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
                        required
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
                        required
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
                        required
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
                        required
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
                        required
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                    />
                    <p className="text-xs text-card-muted mt-1">Minimum time required per question</p>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan transition-all"
            >
                {isLoading ? (
                    <>
                        <RefreshCw size={20} className="animate-spin mr-2" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Shield size={20} className="mr-2" />
                        {existingConfig ? 'Update Configuration' : 'Create Configuration'}
                    </>
                )}
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
        setQuestions([...questions, { ...initialQuestion, options: ['', '', '', ''] }]);
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

        // Validation
        const invalidQuestions = questions.filter(q => 
            !q.question.trim() || q.options.some(opt => !opt.trim())
        );

        if (invalidQuestions.length > 0) {
            onToast({ message: 'Please fill in all question fields', type: 'error' });
            return;
        }

        setIsLoading(true);

        const quizData = {
            lesson_id: lessonId,
            questions: questions.map((q) => ({
                question: q.question.trim(),
                options: q.options.map(opt => opt.trim()),
                correct_option: q.correct_option,
            })),
        };

        try {
            await api.admin.createQuiz(quizData);
            onToast({ message: `✅ Quiz for "${lessonTitle}" created successfully!`, type: 'success' });
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
        return (
            <div className="text-center p-8">
                <RefreshCw className="animate-spin mx-auto text-cyan mb-3" size={32} />
                <p className="text-card-muted">Loading configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <List size={24} className="mr-2 text-cyan" />
                Create Quiz for: <span className='text-cyan ml-2'>{lessonTitle}</span>
            </h3>

            {/* Anti-Cheat Configuration Warning */}
            <div className={`${quizConfig ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'} border-2 rounded-xl p-4`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <Shield size={24} className={`${quizConfig ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'} flex-shrink-0 mt-1`} />
                        <div>
                            <h4 className={`font-semibold ${quizConfig ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                                {quizConfig ? '✅ Anti-Cheat Configured' : '⚠️ Configure Anti-Cheat First'}
                            </h4>
                            <p className={`text-sm ${quizConfig ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'} mt-1`}>
                                {quizConfig 
                                    ? `Pool: ${quizConfig.total_questions_in_pool} questions • Show: ${quizConfig.questions_per_quiz} • Reward: ${quizConfig.token_reward} tokens`
                                    : 'Set quiz rules, time requirements, and token rewards before uploading questions.'
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className={`px-4 py-2 ${quizConfig ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-lg text-sm font-semibold whitespace-nowrap transition-colors`}
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
                        className="px-4 py-2 text-sm font-medium text-white bg-black/20 dark:bg-black/30 border-2 border-cyan-light rounded-lg hover:bg-black/30 dark:hover:bg-black/40 transition-colors flex items-center"
                    >
                        <Plus size={16} className="mr-1"/> Add Question
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !quizConfig}
                        className="py-3 px-6 bg-cyan text-white font-semibold rounded-lg shadow-lg hover:bg-primary-cyan-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin mr-2" />
                                Uploading Quiz...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} className="mr-2" />
                                Save Quiz
                            </>
                        )}
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
// --- Manage Content (Lessons List) ---
// ====================================================================

const ManageContent = ({ onToast }) => {
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [managingQuiz, setManagingQuiz] = useState(null);

    const fetchLessons = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getAllLessons();
            setLessons(data);
        } catch (error) {
            onToast({ message: 'Failed to load lessons.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    const handleDeleteLesson = async (lessonId, lessonTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${lessonTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.admin.deleteLesson(lessonId);
            onToast({ message: `✅ Lesson "${lessonTitle}" deleted successfully!`, type: 'success' });
            fetchLessons();
        } catch (error) {
            onToast({ message: `Failed to delete lesson: ${error.message}`, type: 'error' });
        }
    };

    if (managingQuiz) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setManagingQuiz(null)}
                    className="flex items-center text-cyan hover:text-primary-cyan-dark transition-colors mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Lesson List
                </button>
                <QuizCreationForm
                    lessonId={managingQuiz.id}
                    lessonTitle={managingQuiz.title}
                    onComplete={() => {
                        setManagingQuiz(null);
                        fetchLessons();
                    }}
                    onToast={onToast}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <RefreshCw className="animate-spin mx-auto text-cyan mb-3" size={32} />
                <p className="text-card-muted">Loading lessons...</p>
            </div>
        );
    }

    const groupedLessons = lessons.reduce((acc, lesson) => {
        if (!acc[lesson.category]) {
            acc[lesson.category] = [];
        }
        acc[lesson.category].push(lesson);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                    <BookOpen size={24} className="mr-2 text-cyan" />
                    Manage Lessons ({lessons.length})
                </h3>
                <button
                    onClick={fetchLessons}
                    className="px-4 py-2 bg-cyan text-white rounded-lg hover:bg-primary-cyan-dark flex items-center border-2 border-cyan transition-colors"
                >
                    <RefreshCw size={16} className="mr-2" /> Refresh
                </button>
            </div>

            {lessons.length === 0 ? (
                <div className="text-center p-12 bg-light-card dark:bg-dark-card rounded-xl border-2 border-cyan">
                    <BookOpen size={48} className="mx-auto mb-3 text-cyan opacity-50" />
                    <p className="text-card-muted">No lessons created yet. Add your first lesson!</p>
                </div>
            ) : (
                Object.keys(groupedLessons).map((category) => (
                    <div key={category} className="space-y-4">
                        <h4 className="text-xl font-bold text-white border-b border-cyan pb-2">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedLessons[category]
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className="bg-light-card dark:bg-dark-card p-5 rounded-xl shadow-lg border-2 border-cyan hover:border-cyan-light transition-all hover:scale-105 duration-300"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h5 className="text-lg font-bold text-white mb-1">{lesson.title}</h5>
                                                <p className="text-xs text-card-muted">Order: {lesson.order_index}</p>
                                            </div>
                                        </div>
                                        
                                        {lesson.video_url && (
                                            <div className="flex items-center text-xs text-cyan mb-3">
                                                <Video size={14} className="mr-1" />
                                                Video included
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setManagingQuiz({ id: lesson.id, title: lesson.title })}
                                                className="flex-1 py-2 px-3 bg-cyan/20 text-cyan border-2 border-cyan rounded-lg hover:bg-cyan hover:text-white transition-all text-sm font-semibold"
                                            >
                                                Manage Quiz
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                                className="p-2 bg-red-500/20 text-red-500 border-2 border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// ====================================================================
// --- User Management ---
// ====================================================================

const UserManagement = ({ onToast, currentUserId }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getUsers();
            setUsers(data.sort((a, b) => b.is_admin - a.is_admin));
        } catch (error) {
            onToast({ message: 'Failed to load users.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleAdmin = async (userId, currentStatus, userName) => {
        if (userId === currentUserId) {
            onToast({ message: "You cannot change your own admin status.", type: 'error' });
            return;
        }

        const action = currentStatus ? 'demote' : 'promote';
        if (!window.confirm(`Are you sure you want to ${action} ${userName} ${currentStatus ? 'from' : 'to'} admin?`)) {
            return;
        }

        try {
            await api.admin.promoteUser(userId, !currentStatus);
            onToast({ 
                message: `✅ ${userName} ${currentStatus ? 'demoted from' : 'promoted to'} admin!`, 
                type: 'success' 
            });
            fetchUsers();
        } catch (error) {
            onToast({ message: `Failed to update user: ${error.message}`, type: 'error' });
        }
    };

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <RefreshCw className="animate-spin mx-auto text-cyan mb-3" size={32} />
                <p className="text-card-muted">Loading users...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                    <Users size={24} className="mr-2 text-cyan" />
                    User Management ({users.length})
                </h3>
                <button
                    onClick={fetchUsers}
                    className="px-4 py-2 bg-cyan text-white rounded-lg hover:bg-primary-cyan-dark flex items-center border-2 border-cyan transition-colors"
                >
                    <RefreshCw size={16} className="mr-2" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="bg-light-card dark:bg-dark-card p-5 rounded-xl shadow-lg border-2 border-cyan hover:border-cyan-light transition-all"
                    >
                        <div className="flex items-center space-x-3 mb-4">
                            <img
                                src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
                                alt={user.name}
                                className="w-12 h-12 rounded-full border-2 border-cyan"
                            />
                            <div className="flex-1">
                                <h5 className="text-lg font-bold text-white">{user.name}</h5>
                                <p className="text-xs text-card-muted">{user.email}</p>
                            </div>
                            {user.is_admin && (
                                <div className="bg-green-500/20 text-green-500 px-2 py-1 rounded-full text-xs font-semibold border border-green-500">
                                    Admin
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleToggleAdmin(user.id, user.is_admin, user.name)}
                            disabled={user.id === currentUserId}
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center ${
                                user.id === currentUserId
                                    ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                    : user.is_admin
                                    ? 'bg-red-500/20 text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white'
                                    : 'bg-green-500/20 text-green-500 border-2 border-green-500 hover:bg-green-500 hover:text-white'
                            }`}
                        >
                            {user.id === currentUserId ? (
                                <>
                                    <ShieldOff size={16} className="mr-2" />
                                    You (Cannot Change)
                                </>
                            ) : user.is_admin ? (
                                <>
                                    <ShieldOff size={16} className="mr-2" />
                                    Demote from Admin
                                </>
                            ) : (
                                <>
                                    <Shield size={16} className="mr-2" />
                                    Promote to Admin
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ====================================================================
// --- Enhanced Suspicious Attempts Monitor with Flagging Details ---
// ====================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Ban, Clock, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const SuspiciousAttemptsMonitor = ({ onToast, api }) => {
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedAttempt, setExpandedAttempt] = useState(null);

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
    }, [onToast, api]);

    useEffect(() => {
        fetchAttempts();
    }, [fetchAttempts]);

    const getViolationBadge = (timeSpent, expectedMin) => {
        const ratio = timeSpent / expectedMin;
        if (ratio < 0.3) return { color: 'bg-red-500', label: 'SEVERE', intensity: 'Critical' };
        if (ratio < 0.5) return { color: 'bg-orange-500', label: 'HIGH', intensity: 'High' };
        if (ratio < 0.7) return { color: 'bg-yellow-500', label: 'MEDIUM', intensity: 'Medium' };
        return { color: 'bg-blue-500', label: 'LOW', intensity: 'Low' };
    };

    const getViolationType = (attempt) => {
        // This is a placeholder - you'll need to extend your backend to store violation types
        // For now, we'll determine it based on time
        const ratio = attempt.total_time_seconds / attempt.expected_min_time;
        if (ratio < 0.3) return 'Extreme Speed Violation';
        if (ratio < 0.5) return 'Time Manipulation Suspected';
        return 'Abnormal Completion Time';
    };

    const toggleExpand = (attemptId) => {
        setExpandedAttempt(expandedAttempt === attemptId ? null : attemptId);
    };

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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                        <AlertTriangle size={24} className="mr-2 text-yellow-500" />
                        Suspicious Quiz Attempts
                    </h3>
                    <p className="text-sm text-card-muted mt-1">
                        {attempts.length} flagged attempts detected
                    </p>
                </div>
                <button
                    onClick={fetchAttempts}
                    className="px-4 py-2 bg-cyan text-white rounded-lg hover:bg-primary-cyan-dark flex items-center border-2 border-cyan transition-colors"
                >
                    <RefreshCw size={16} className="mr-2" /> Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-400 font-medium">Total Flagged</p>
                            <p className="text-3xl font-bold text-red-500">{attempts.length}</p>
                        </div>
                        <Ban size={32} className="text-red-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-orange-500/10 border-2 border-orange-500 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-400 font-medium">Severe Violations</p>
                            <p className="text-3xl font-bold text-orange-500">
                                {attempts.filter(a => a.total_time_seconds / a.expected_min_time < 0.3).length}
                            </p>
                        </div>
                        <AlertTriangle size={32} className="text-orange-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-400 font-medium">Last 24 Hours</p>
                            <p className="text-3xl font-bold text-yellow-500">
                                {attempts.filter(a => 
                                    (Date.now() - new Date(a.flagged_at).getTime()) < 86400000
                                ).length}
                            </p>
                        </div>
                        <Clock size={32} className="text-yellow-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Attempts List */}
            {attempts.length === 0 ? (
                <div className="text-center p-12 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500">
                    <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                    <p className="text-green-700 dark:text-green-300 font-semibold">✅ No suspicious attempts detected</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">All quiz submissions appear legitimate</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {attempts.map((attempt) => {
                        const badge = getViolationBadge(attempt.total_time_seconds, attempt.expected_min_time);
                        const isExpanded = expandedAttempt === attempt.attempt_id;
                        const violationType = getViolationType(attempt);
                        const timeDiff = attempt.expected_min_time - attempt.total_time_seconds;
                        const percentageFaster = ((timeDiff / attempt.expected_min_time) * 100).toFixed(0);

                        return (
                            <div
                                key={attempt.attempt_id}
                                className="bg-light-card dark:bg-dark-card rounded-xl border-2 border-red-500 overflow-hidden transition-all hover:shadow-lg"
                            >
                                {/* Main Row */}
                                <div
                                    onClick={() => toggleExpand(attempt.attempt_id)}
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/20 transition-colors"
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* Severity Badge */}
                                        <div className={`${badge.color} text-white px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0`}>
                                            {badge.label}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <p className="font-bold text-white truncate">{attempt.user_name}</p>
                                                <span className="text-xs text-card-muted">•</span>
                                                <p className="text-sm text-card-muted truncate">{attempt.lesson_title}</p>
                                            </div>
                                            <div className="flex items-center space-x-4 text-xs">
                                                <span className="text-red-400 font-semibold">
                                                    ⚡ {attempt.total_time_seconds}s (Expected: {attempt.expected_min_time}s)
                                                </span>
                                                <span className="text-yellow-400">
                                                    {percentageFaster}% faster than minimum
                                                </span>
                                                {attempt.score >= 70 && (
                                                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                                        ✓ Passed ({attempt.score}%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timestamp */}
                                        <div className="text-right flex-shrink-0 hidden md:block">
                                            <p className="text-xs text-card-muted">
                                                {new Date(attempt.flagged_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-card-muted">
                                                {new Date(attempt.flagged_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="ml-4 flex-shrink-0">
                                        {isExpanded ? (
                                            <ChevronUp size={20} className="text-cyan" />
                                        ) : (
                                            <ChevronDown size={20} className="text-card-muted" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t-2 border-red-500/30 bg-black/20 p-4 space-y-4">
                                        {/* Violation Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                                <h5 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
                                                    <AlertTriangle size={16} className="mr-2" />
                                                    Violation Type
                                                </h5>
                                                <p className="text-white font-medium">{violationType}</p>
                                                <p className="text-sm text-card-muted mt-2">
                                                    Severity: <span className={`font-semibold ${
                                                        badge.intensity === 'Critical' ? 'text-red-500' :
                                                        badge.intensity === 'High' ? 'text-orange-500' :
                                                        badge.intensity === 'Medium' ? 'text-yellow-500' :
                                                        'text-blue-500'
                                                    }`}>{badge.intensity}</span>
                                                </p>
                                            </div>

                                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                                                <h5 className="text-sm font-semibold text-orange-400 mb-3 flex items-center">
                                                    <Clock size={16} className="mr-2" />
                                                    Time Analysis
                                                </h5>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-card-muted">Time Taken:</span>
                                                        <span className="text-red-400 font-bold">{attempt.total_time_seconds}s</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-card-muted">Expected Minimum:</span>
                                                        <span className="text-white">{attempt.expected_min_time}s</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-card-muted">Time Difference:</span>
                                                        <span className="text-yellow-400 font-bold">-{timeDiff}s ({percentageFaster}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                                <p className="text-xs text-blue-400 mb-1">Quiz Score</p>
                                                <p className={`text-2xl font-bold ${
                                                    attempt.score >= 70 ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                    {attempt.score}%
                                                </p>
                                            </div>

                                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                                <p className="text-xs text-purple-400 mb-1">User ID</p>
                                                <p className="text-sm text-white font-mono truncate">
                                                    {attempt.user_id.toString().substring(0, 8)}...
                                                </p>
                                            </div>

                                            <div className="bg-cyan/10 border border-cyan/30 rounded-lg p-3">
                                                <p className="text-xs text-cyan mb-1">Attempt ID</p>
                                                <p className="text-sm text-white font-mono truncate">
                                                    {attempt.attempt_id.toString().substring(0, 8)}...
                                                </p>
                                            </div>
                                        </div>

                                        {/* Warning Message */}
                                        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded">
                                            <div className="flex items-start space-x-3">
                                                <Shield size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-yellow-400">
                                                        Anti-Cheat Detection
                                                    </p>
                                                    <p className="text-xs text-yellow-300 mt-1">
                                                        This attempt was automatically flagged by the anti-cheat system due to 
                                                        completion time significantly below the expected minimum. Consider reviewing 
                                                        this user's account for patterns of suspicious behavior.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SuspiciousAttemptsMonitor;
// ====================================================================
// --- Main Admin Module ---
// ====================================================================

const AdminModule = ({ user }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [toast, setToast] = useState({ message: '', type: 'info' });

    const handleToast = (newToast) => {
        setToast(newToast);
    };

    const closeToast = () => {
        setToast({ message: '', type: 'info' });
    };

    if (!user?.is_admin) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center p-8 bg-light-card dark:bg-dark-card rounded-xl border-2 border-red-500">
                <ShieldOff size={64} className="mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-card-muted">You need admin privileges to access this module.</p>
            </div>
        );
    }

    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'manage-content', name: 'Manage Content', icon: List },
        { id: 'add-lesson', name: 'Add Lesson', icon: Plus },
        { id: 'users', name: 'User Management', icon: UserCog },
        { id: 'suspicious', name: 'Suspicious Activity', icon: AlertTriangle },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8 border-b-2 border-cyan pb-4">
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                    <Shield size={36} className="mr-3 text-cyan" />
                    Admin Control Panel
                </h1>
                <p className="text-card-muted">Manage content, users, and monitor platform activity</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b-2 border-cyan mb-8 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-cyan text-cyan'
                                    : 'border-transparent text-gray-500 dark:text-card-muted hover:text-cyan'
                            }`}
                        >
                            <Icon size={18} className="mr-2" />
                            {tab.name}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-screen">
                {activeTab === 'dashboard' && <DashboardOverview onToast={handleToast} />}
                {activeTab === 'manage-content' && <ManageContent onToast={handleToast} />}
                {activeTab === 'add-lesson' && <LessonCreateForm onToast={handleToast} onSuccess={() => setActiveTab('manage-content')} />}
                {activeTab === 'users' && <UserManagement onToast={handleToast} currentUserId={user.id} />}
                {activeTab === 'suspicious' && <SuspiciousAttemptsMonitor onToast={handleToast} />}
            </div>

            {/* Toast Notification */}
            <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
    );
};

export default AdminModule;