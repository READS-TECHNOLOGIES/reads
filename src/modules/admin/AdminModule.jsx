import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, Plus, ShieldOff, Trash2, Video, List, CheckCircle, AlertCircle, 
    Award, Settings, Zap, ArrowLeft, XCircle, RefreshCw, Shield
} from 'lucide-react';
import { api } from '../../services/api'; 

// ====================================================================
// --- 0. Feedback Components ---
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
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl text-white ${color} flex items-center gap-3 z-50 transition-all duration-300 transform translate-y-0 opacity-100 border-2`}>
            <Icon size={20} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <XCircle size={16} />
            </button>
        </div>
    );
};

// ====================================================================
// --- 1. Lesson Creation Form ---
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
                    <input type="text" name="category" value={formData.category} onChange={handleChange} required
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                        placeholder="e.g., JAMB Mathematics"
                    />
                </div>
                <div className='col-span-1'>
                    <label className="block text-sm font-medium text-card-muted mb-2">Order Index</label>
                    <input type="number" name="order_index" value={formData.order_index} onChange={handleChange} required
                        className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                        placeholder="0"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-card-muted mb-2">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                    className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                    placeholder="Lesson Title"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-card-muted mb-2">Video URL (Optional)</label>
                <input type="url" name="video_url" value={formData.video_url} onChange={handleChange}
                    className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                    placeholder="https://www.youtube.com/watch?v=..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-card-muted mb-2">Content (Markdown/HTML)</label>
                <textarea name="content" value={formData.content} onChange={handleChange} required
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
// --- 2. Quiz Creation Form ---
// ====================================================================

const QuizCreationForm = ({ lessonId, lessonTitle, onComplete, onToast }) => {
    const initialQuestion = { question: '', options: ['', '', '', ''], correct_option: 'A' };
    const [questions, setQuestions] = useState([initialQuestion]);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Create Quiz for: <span className='text-cyan'>{lessonTitle}</span></h3>
            <p className='text-sm text-gray-600 dark:text-card-muted'>Lesson ID: {lessonId}</p>

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
                        <textarea value={q.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)} required
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
                                <input type="text" value={option} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} required
                                    className="w-full p-3 border-2 border-cyan-light bg-black/20 dark:bg-black/30 rounded-lg text-white placeholder-card-muted focus:border-cyan focus:ring-2 focus:ring-cyan outline-none transition-all"
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Correct Answer</label>
                        <select value={q.correct_option} onChange={(e) => handleQuestionChange(qIndex, 'correct_option', e.target.value)}
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
                    disabled={isLoading}
                    className="py-3 px-6 bg-cyan text-white font-semibold rounded-lg shadow-lg hover:bg-primary-cyan-dark transition-all disabled:opacity-50 flex items-center justify-center border-2 border-cyan"
                >
                    {isLoading ? <RefreshCw size={20} className="animate-spin mr-2" /> : <CheckCircle size={20} className="mr-2" />}
                    {isLoading ? 'Uploading Quiz...' : 'Save Quiz'}
                </button>
            </div>
        </form>
    );
};

// ====================================================================
// --- 3. User Management Component ---
// ====================================================================

const UserManagement = ({ currentAdminId, onToast }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getUsers(); 
            const sortedData = [...data].sort((a, b) => {
                if (a.is_admin === b.is_admin) return 0;
                return a.is_admin ? -1 : 1;
            });
            setUsers(sortedData);
        } catch (error) {
            onToast({ message: 'Failed to fetch user list.', type: 'error' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleAdminStatus = useCallback(async (userId, currentStatus) => {
        if (userId === currentAdminId) {
            onToast({ message: "You cannot change your own admin status.", type: 'error' });
            return;
        }

        setActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            const newStatus = !currentStatus; 
            await api.admin.promoteUser(userId, newStatus); 
            onToast({ message: `User successfully ${newStatus ? 'promoted' : 'demoted'}!`, type: 'success' });
            setUsers(prevUsers => prevUsers.map(u => 
                u.id === userId ? { ...u, is_admin: newStatus } : u
            ));
        } catch (error) {
            onToast({ message: `Failed to change status: ${error.message}`, type: 'error' });
            fetchUsers(); 
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    }, [onToast, currentAdminId, fetchUsers]);

    if (isLoading) {
        return <div className="text-center p-8 text-white">Loading Users... <RefreshCw size={20} className="animate-spin inline-block ml-2 text-cyan" /></div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white border-b-2 border-cyan pb-3">User Management ({users.length} Total)</h3>

            <div className="grid grid-cols-5 font-semibold text-sm text-gray-600 dark:text-card-muted border-b border-cyan-light pb-2 px-6">
                <p className='col-span-2'>User Name</p>
                <p className='hidden md:block col-span-2'>Email</p>
                <p className='col-span-1 text-center'>Actions</p>
            </div>

            <div className="space-y-3">
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`grid grid-cols-5 items-center p-4 rounded-xl shadow-sm transition-all border-2 bg-light-card dark:bg-dark-card ${user.is_admin ? 'border-cyan' : 'border-cyan-light'}`}
                    >
                        <div className="flex items-center gap-3 col-span-2">
                            <img 
                                src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`} 
                                className="w-8 h-8 rounded-full border-2 border-cyan" 
                                alt={user.name} 
                            />
                            <div>
                                <p className="font-medium text-white">{user.name}</p>
                                <p className="text-xs mt-0.5 md:hidden text-card-muted">
                                    {user.is_admin ? 'Admin' : 'User'}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-card-muted hidden md:block col-span-2">{user.email}</p> 

                        <div className="col-span-1 flex justify-center gap-2">
                            {user.is_admin && (
                                <span className="inline-flex items-center gap-1 bg-cyan text-white text-xs font-medium px-3 py-1 rounded-full">
                                    Admin
                                </span>
                            )}
                            <button
                                onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                                disabled={actionLoading[user.id] || user.id === currentAdminId}
                                title={user.is_admin ? 'Demote User' : 'Promote User'}
                                className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 ${
                                    user.is_admin 
                                        ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' 
                                        : 'border-cyan text-cyan hover:bg-cyan hover:text-white'
                                }`}
                            >
                                {actionLoading[user.id] ? (
                                    <RefreshCw size={20} className="animate-spin" />
                                ) : user.is_admin ? (
                                    <ShieldOff size={20} />
                                ) : (
                                    <Shield size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ====================================================================
// --- 4. Lesson and Quiz Management Component ---
// ====================================================================

const LessonQuizManager = ({ onSelectLesson, onToast }) => {
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchLessons = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getAllLessons(); 
            setLessons(data);
        } catch (error) {
            onToast({ message: 'Failed to fetch lessons list.', type: 'error' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson and its associated quizzes/progress?')) return;

        setIsDeleting(true);
        try {
            await api.admin.deleteLesson(lessonId);
            onToast({ message: 'Lesson deleted successfully!', type: 'success' });
            fetchLessons();
        } catch (error) {
            onToast({ message: 'Failed to delete lesson. It might be in use.', type: 'error' });
            console.error(error);
        } finally {
             setIsDeleting(false);
        }
    };

    const sortedLessons = [...lessons].sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return a.order_index - b.order_index;
    });

    if (isLoading) {
        return <div className="text-center p-8 text-white">Loading Lessons... <RefreshCw size={20} className="animate-spin inline-block ml-2 text-cyan" /></div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white border-b-2 border-cyan pb-3">Manage Lessons & Quizzes ({lessons.length} Total)</h3>

            {sortedLessons.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-card-muted p-8 bg-light-card dark:bg-dark-card rounded-xl border-2 border-cyan">No lessons available. Please add a lesson first.</p>
            ) : (
                <div className="space-y-3">
                    {sortedLessons.map((lesson) => (
                        <div 
                            key={lesson.id} 
                            className="flex justify-between items-center p-4 bg-light-card dark:bg-dark-card rounded-xl shadow-sm border-2 border-cyan"
                        >
                            <div className="flex items-center gap-4">
                                <Video size={20} className="text-cyan" />
                                <div>
                                    <p className="font-semibold text-white">{lesson.title}</p>
                                    <p className="text-xs text-card-muted">{lesson.category} | Index: {lesson.order_index}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onSelectLesson({ id: lesson.id, title: lesson.title })}
                                    className="px-4 py-2 text-sm font-medium text-white bg-cyan rounded-lg hover:bg-primary-cyan-dark transition-colors border-2 border-cyan"
                                >
                                    Manage Quiz
                                </button>
                                <button
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    title="Delete Lesson and Quiz Data"
                                    className="p-2 text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                                    disabled={isDeleting}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ====================================================================
// --- 5. Main Admin Module Component ---
// ====================================================================

const AdminModule = ({ user }) => {
    const isAdmin = user && user.is_admin; 
    const [activeTab, setActiveTab] = useState('dashboard');
    const [quizLesson, setQuizLesson] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const showToast = useCallback((newToast) => setToast(newToast), []);

    const handleSelectLesson = useCallback((lessonData) => {
        setQuizLesson(lessonData);
        setActiveTab('quizzes');
    }, []);

    const handleBackToList = useCallback(() => {
        setQuizLesson(null);
        setActiveTab('quizzes');
    }, []);

    if (!isAdmin) {
        return (
            <div className="p-10 text-center space-y-4">
                <ShieldOff size={48} className="mx-auto text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Access Denied</h2>
                <p className="text-gray-600 dark:text-card-muted">You must be an administrator to access this module.</p>
            </div>
        );
    }

    const renderAdminDashboard = () => (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white border-b-2 border-cyan pb-3">Admin Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg border-2 border-cyan">
                    <Users size={24} className="text-cyan mb-2"/>
                    <p className="text-sm text-card-muted">Total Users</p>
                    <p className="text-3xl font-bold text-white">...</p>
                    <button onClick={() => setActiveTab('users')} className="mt-3 text-sm text-cyan hover:text-primary-cyan-dark underline">Manage Users</button>
                </div>
                <div className="p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg border-2 border-cyan">
                    <Video size={24} className="text-cyan mb-2"/>
                    <p className="text-sm text-card-muted">Total Lessons</p>
                    <p className="text-3xl font-bold text-white">...</p>
                    <button onClick={() => setActiveTab('quizzes')} className="mt-3 text-sm text-cyan hover:text-primary-cyan-dark underline">Manage Content</button>
                </div>
                <div className="p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg border-2 border-cyan">
                    <Award size={24} className="text-orange mb-2"/>
                    <p className="text-sm text-card-muted">Tokens Awarded</p>
                    <p className="text-3xl font-bold text-orange">...</p>
                    <button onClick={() => setActiveTab('lessons')} className="mt-3 text-sm text-cyan hover:text-primary-cyan-dark underline">Create New Lesson</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white border-b-2 border-cyan pb-4">Admin Dashboard</h1>

            <div className="flex border-b-2 border-cyan">
                <AdminTab name="Dashboard" icon={Settings} active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setQuizLesson(null); }} />
                <AdminTab name="Manage Content" icon={Video} active={activeTab === 'quizzes'} onClick={() => { setActiveTab('quizzes'); }} />
                <AdminTab name="Add Lesson" icon={Plus} active={activeTab === 'lessons'} onClick={() => { setActiveTab('lessons'); setQuizLesson(null); }} />
                <AdminTab name="User Management" icon={Users} active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setQuizLesson(null); }} />
            </div>

            <div className='py-4'>
                {activeTab === 'dashboard' && renderAdminDashboard()}

                {activeTab === 'quizzes' && (
                    <div>
                        {quizLesson ? (
                            <>
                                <button 
                                    onClick={handleBackToList} 
                                    className="flex items-center text-cyan hover:text-primary-cyan-dark text-sm font-medium mb-4"
                                >
                                    <ArrowLeft size={16} className="mr-1" /> Back to Lesson List
                                </button>
                                <QuizCreationForm 
                                    lessonId={quizLesson.id} 
                                    lessonTitle={quizLesson.title} 
                                    onComplete={handleBackToList} 
                                    onToast={showToast}
                                />
                            </>
                        ) : (
                            <LessonQuizManager 
                                onSelectLesson={handleSelectLesson} 
                                onToast={showToast}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'lessons' && <LessonCreateForm onToast={showToast} />}
                {activeTab === 'users' && <UserManagement currentAdminId={user.id} onToast={showToast} />}
            </div>

            <Toast {...toast} onClose={() => setToast({ message: '', type: 'info' })} />
        </div>
    );
}

// ====================================================================
// --- 6. Helper Components ---
// ====================================================================

const AdminTab = ({ name, icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors border-b-2
            ${active 
                ? 'border-cyan text-cyan' 
                : 'border-transparent text-gray-500 dark:text-card-muted hover:text-cyan dark:hover:text-cyan'
            }`
        }
    >
        <Icon size={18} className="mr-2" />
        {name}
    </button>
);


export default AdminModule;