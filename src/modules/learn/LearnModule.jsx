import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, PlayCircle, Clock, Award, CheckCircle, Trash2, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

// ====================================================================
// --- 0. Helper Components ---
// ====================================================================

const LoadingState = ({ message = "Loading..." }) => (
    <div className="p-8 text-center text-card-muted">
        <RefreshCw size={32} className="mx-auto mb-3 animate-spin text-cyan" />
        <p>{message}</p>
    </div>
);

const CompletedState = ({ lessonTitle, onNavigate }) => (
    <div className="space-y-6 animate-fade-in p-8 bg-light-card dark:bg-dark-card rounded-2xl shadow-lg border-2 border-green-500">
        <CheckCircle size={48} className="text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold text-center text-white">Quiz Completed!</h3>
        <p className="text-center text-card-muted">
            You have already successfully completed the quiz for {lessonTitle} and earned your reward.
        </p>
        <button
            onClick={() => onNavigate('learn', 'categories')}
            className="w-full px-4 py-3 bg-cyan text-white font-semibold rounded-xl hover:bg-primary-cyan-dark transition-all border-2 border-cyan shadow-lg"
        >
            Explore More Lessons
        </button>
    </div>
);

// ====================================================================
// --- 1. Lesson Detail View ---
// ====================================================================

const LessonDetailView = ({ lesson, onNavigate }) => {
    const safeContent = (lesson.content || 'Content not available.').replace(/\n/g, '<br/>');

    const getEmbedUrl = (url) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch?v=')) {
            const match = url.match(/[?&]v=([^&]+)/);
            return match ? `https://www.youtube.com/embed/${match[1]}` : url;
        }
        return url.startsWith('http') ? url : `https://www.youtube.com/embed/${url}`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <button 
                onClick={() => onNavigate('learn', 'list', { name: lesson.category })} 
                className="flex items-center text-cyan hover:text-primary-cyan-dark text-sm font-medium mb-4 transition-colors"
            >
                <ArrowLeft size={16} className="mr-1" /> Back to Lessons
            </button>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{lesson.title}</h2>
            <div className="flex items-center gap-4 text-sm">
                <span className="bg-cyan/20 text-cyan px-3 py-1 rounded-full font-semibold border border-cyan">{lesson.category}</span>
                <span className="flex items-center text-card-muted">
                    <Clock size={16} className="mr-1" /> Duration: 15 min
                </span>
            </div>

            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-xl border-2 border-cyan">
                <h3 className="text-xl font-bold mb-4 text-white">Content Overview</h3>
                <div
                    className="prose dark:prose-invert max-w-none text-white space-y-4"
                    dangerouslySetInnerHTML={{ __html: safeContent }}
                />
            </div>

            {lesson.video_url && (
                <div className="mt-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Video Lecture</h3>
                    <iframe
                        className="w-full aspect-video rounded-xl shadow-lg border-2 border-cyan"
                        src={getEmbedUrl(lesson.video_url)}
                        title="Video Lecture"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            )}

            <button
                onClick={() => onNavigate('learn', 'quiz', { lessonId: lesson.id, lessonTitle: lesson.title, category: lesson.category })}
                className="w-full py-4 bg-cyan text-white font-bold rounded-xl shadow-lg hover:bg-primary-cyan-dark transition-all flex items-center justify-center gap-2 mt-6 border-2 border-cyan hover:shadow-cyan/50"
            >
                <Award size={20} /> Start Quiz to Earn $READS
            </button>
        </div>
    );
};

// ====================================================================
// --- 2. Quiz View ---
// ====================================================================

const QuizView = ({ lessonData, onNavigate, onUpdateWallet }) => {
    const { lessonId, lessonTitle } = lessonData;

    const [questions, setQuestions] = useState([]);
    const [step, setStep] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        setLoadError(null);
        if (lessonId) {
            api.learn.getQuizQuestions(lessonId)
                .then(data => {
                    if (data && data.length > 0) {
                        setQuestions(data);
                    } else {
                        setLoadError("No quiz questions found for this lesson.");
                    }
                })
                .catch(e => {
                    const errorMessage = e.message || "An unknown error occurred.";
                    console.error("Failed to load quiz questions:", errorMessage);

                    if (errorMessage.includes("Quiz already completed")) {
                        setLoadError("COMPLETED");
                    } else {
                        setLoadError(`Quiz Load Error: ${errorMessage}`);
                    }
                });
        }
    }, [lessonId]);

    const handleAnswerSelect = (optionChar) => {
        setSelectedAnswer(optionChar);
    };

    const handleNext = async () => {
        if (selectedAnswer === null) return;

        const currentQuestion = questions[step];
        const newAnswers = {
            ...answers,
            [currentQuestion.id]: selectedAnswer
        };
        setAnswers(newAnswers);
        setSelectedAnswer(null);

        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            setIsLoading(true);
            try {
                const submissionArray = Object.entries(newAnswers).map(([q_id, selected]) => ({
                    question_id: q_id,
                    selected: selected
                }));

                const result = await api.learn.submitQuiz(lessonId, submissionArray);
                setQuizResult(result);
                onUpdateWallet(result.tokens_awarded);
            } catch (e) {
                console.error("Quiz submission failed:", e);
                setLoadError(`Submission failed. Please check your connection. Error: ${e.message || 'Unknown'}`);
                setIsLoading(false);
            }
        }
    };

    if (loadError === "COMPLETED") {
        return <CompletedState lessonTitle={lessonTitle} onNavigate={onNavigate} />;
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-red-900/20 border-2 border-red-500 rounded-xl shadow-lg animate-fade-in">
                <XCircle size={48} className="mx-auto mb-3 text-red-500" />
                <h2 className="text-xl font-semibold text-red-400">Quiz Load Error</h2>
                <p className="text-red-300 mt-2">{loadError}</p>
                <button
                    onClick={() => onNavigate('learn', 'detail', lessonId)}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-cyan rounded-lg hover:bg-primary-cyan-dark transition-all border-2 border-cyan"
                >
                    <ArrowLeft size={16} className="inline mr-1" /> Back to Lesson
                </button>
            </div>
        );
    }

    if (isLoading || (!questions.length && !quizResult)) {
        return <LoadingState message={isLoading ? "Submitting Quiz and Calculating Rewards..." : `Loading quiz questions for "${lessonTitle}"...`} />;
    }

    if (quizResult) {
        const { score, correct, wrong, tokens_awarded } = quizResult;
        const passed = score >= 70;

        return (
            <div className="text-center p-8 bg-light-card dark:bg-dark-card rounded-2xl shadow-xl space-y-6 animate-fade-in border-2 border-cyan">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 ${passed ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
                    {passed ? <CheckCircle size={40} className="text-green-500" /> : <XCircle size={40} className="text-red-500" />}
                </div>
                <h2 className="text-3xl font-bold text-white">{passed ? "Congratulations!" : "Quiz Failed"}</h2>
                <p className='text-card-muted'>You scored {score}% for the <strong className="text-white">{lessonTitle}</strong> quiz.</p>

                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-black/30 border-2 border-cyan-light">
                        <p className="text-sm text-card-muted">Score</p>
                        <p className={`text-2xl font-bold ${passed ? 'text-cyan' : 'text-red-500'}`}>{score}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-black/30 border-2 border-cyan-light">
                        <p className="text-sm text-card-muted">Correct</p>
                        <p className="text-2xl font-bold text-cyan">{correct}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-black/30 border-2 border-cyan-light">
                        <p className="text-sm text-card-muted">Tokens</p>
                        <p className="text-2xl font-bold text-orange">{tokens_awarded}</p>
                    </div>
                </div>

                <button 
                    onClick={() => onNavigate('wallet')} 
                    className="w-full bg-cyan text-white py-3 rounded-xl font-bold hover:bg-primary-cyan-dark transition-all border-2 border-cyan shadow-lg"
                >
                    Check Wallet
                </button>
                <button 
                    onClick={() => onNavigate('learn', 'categories')} 
                    className="text-card-muted text-sm hover:text-cyan transition-colors"
                >
                    Back to Courses
                </button>
            </div>
        );
    }

    const currentQuestion = questions[step];
    const optionChars = ['A', 'B', 'C', 'D'];

    return (
        <div className="animate-fade-in">
            <button
                onClick={() => onNavigate('learn', 'detail', lessonId)}
                className="flex items-center text-cyan hover:text-primary-cyan-dark text-sm font-medium mb-6 transition-colors"
            >
                <ArrowLeft size={16} className="mr-1" /> Back to Lesson
            </button>

            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white">Question {step + 1}/{questions.length}</h3>
            </div>
            <div className="w-full bg-black/30 rounded-full h-3 mb-8 border border-cyan-light overflow-hidden">
                <div
                    style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-cyan to-primary-cyan-dark rounded-full transition-all duration-300"
                />
            </div>

            <h2 className="text-xl font-bold mb-8 text-white">{currentQuestion.question}</h2>

            <div className="space-y-3">
                {currentQuestion.options.map((opt, i) => {
                    const optionChar = optionChars[i];
                    const isSelected = selectedAnswer === optionChar;
                    return (
                        <button
                            key={optionChar}
                            onClick={() => handleAnswerSelect(optionChar)}
                            className={`w-full text-left p-4 rounded-xl transition-all border-2
                                ${isSelected
                                    ? 'bg-cyan/20 border-cyan ring-4 ring-cyan/30'
                                    : 'bg-light-card dark:bg-dark-card border-cyan-light hover:border-cyan'}`
                            }
                        >
                            <span className={`font-bold mr-2 w-5 inline-block text-center ${isSelected ? 'text-cyan' : 'text-card-muted'}`}>
                                {optionChar}.
                            </span>
                            <span className='text-white'>{opt}</span>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={handleNext}
                disabled={selectedAnswer === null || isLoading}
                className="w-full py-3 bg-cyan text-white font-bold rounded-xl shadow-lg hover:bg-primary-cyan-dark transition-all disabled:opacity-50 mt-8 border-2 border-cyan"
            >
                {step < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
            </button>
        </div>
    );
};

// ====================================================================
// --- 3. Lesson Data Loader ---
// ====================================================================

const LessonDataLoader = ({ lessonId, onNavigate }) => {
    const [lessonData, setLessonData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetchDetail = async () => {
            if (!lessonId) {
                setLoading(false);
                return;
            }
            try {
                const data = await api.learn.getLessonDetail(lessonId);
                setLessonData(data);
            } catch (error) {
                console.error("Error fetching lesson detail:", error);
                setLessonData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [lessonId]);

    if (loading) {
        return <LoadingState message="Fetching lesson details..." />;
    }

    if (!lessonData) {
        return (
            <div className="text-center p-8 bg-red-900/20 border-2 border-red-500 rounded-xl">
                <h2 className="text-xl font-semibold text-red-400">Error Loading Lesson</h2>
                <p className="text-red-300 mt-2">The lesson details could not be found or loaded.</p>
                <button
                    onClick={() => onNavigate('learn', 'categories')}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-cyan rounded-lg hover:bg-primary-cyan-dark transition-all border-2 border-cyan"
                >
                    Go Back to Categories
                </button>
            </div>
        );
    }

    return <LessonDetailView lesson={lessonData} onNavigate={onNavigate} />;
};

// ====================================================================
// --- 4. Main Learn Module ---
// ====================================================================

export default function LearnModule({ subView, activeData, onNavigate, onUpdateWallet, isAdmin = false }) {
    const [categories, setCategories] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!categories.length) {
            api.learn.getCategories().then(setCategories);
        }
    }, [categories.length]);

    const fetchLessons = (categoryName) => {
        api.learn.getLessons(categoryName).then(setLessons).catch(e => {
            console.error("Failed to load lessons:", e);
            setLessons([]);
        });
    }

    useEffect(() => {
        if (subView === 'list' && activeData?.name) {
            fetchLessons(activeData.name);
        }
    }, [subView, activeData]);

    const handleDeleteLesson = async (lessonId, lessonTitle, categoryName) => {
        if (!isAdmin) return;

        if (!window.confirm(`Are you sure you want to permanently delete the lesson: "${lessonTitle}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.admin.deleteLesson(lessonId);
            console.log(`Lesson ${lessonId} deleted successfully.`);
            fetchLessons(categoryName);
        } catch (error) {
            console.error("Failed to delete lesson:", error);
            alert("Failed to delete lesson. Check API permissions.");
        } finally {
            setIsDeleting(false);
        }
    };

    // 1. Categories View
    if (subView === 'categories') {
        return (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Choose a Category</h2>
                <p className="text-gray-600 dark:text-card-muted">Select a course category to view available lessons and quizzes.</p>
                <div className="grid gap-4">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onNavigate('learn', 'list', cat)}
                            className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg flex items-center justify-between group hover:shadow-cyan/50 transition-all border-2 border-cyan hover:border-cyan-light"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold bg-cyan/20 text-cyan text-2xl border-2 border-cyan">
                                    {cat.name.substring(0, 1)}
                                </div>
                                <div className='text-left'>
                                    <h3 className="font-bold text-xl text-white">{cat.name}</h3>
                                    <p className="text-sm text-card-muted">{cat.count} lessons available</p>
                                </div>
                            </div>
                            <ChevronRight size={24} className="text-cyan group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                    {categories.length === 0 && <p className="text-center text-card-muted">No categories found.</p>}
                </div>
            </div>
        );
    }

    // 2. Lesson List View
    if (subView === 'list') {
        const category = activeData?.name || 'Lessons';

        if (isDeleting) {
            return <LoadingState message="Deleting lesson... Please wait." />;
        }

        return (
            <div className="space-y-6 animate-fade-in">
                <button 
                    onClick={() => onNavigate('learn', 'categories')} 
                    className="flex items-center text-cyan hover:text-primary-cyan-dark text-sm font-medium mb-4 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Categories
                </button>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {category} Lessons {isAdmin && <span className="text-sm text-red-500">(Admin Mode)</span>}
                </h2>
                <div className="space-y-3">
                    {lessons.map(lesson => (
                        <div
                            key={lesson.id}
                            className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-lg flex items-center justify-between group transition-all border-2 border-cyan hover:border-cyan-light hover:shadow-cyan/30"
                        >
                            <button
                                onClick={() => onNavigate('learn', 'detail', lesson.id)}
                                className="flex items-center gap-4 flex-grow text-left"
                            >
                                <div className="w-12 h-12 bg-cyan/20 rounded-full flex items-center justify-center border-2 border-cyan">
                                    <PlayCircle size={24} className="text-cyan" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{lesson.title}</h3>
                                    <p className="text-xs text-card-muted flex items-center mt-1">
                                        <Clock size={12} className="mr-1" /> {lesson.duration || '15 min'}
                                    </p>
                                </div>
                            </button>

                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDeleteLesson(lesson.id, lesson.title, lesson.category)}
                                        className="p-2 text-red-500 hover:text-red-600 rounded-full hover:bg-red-500/20 transition-colors border-2 border-red-500"
                                        title={`Delete ${lesson.title}`}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <ChevronRight size={20} className="text-cyan transition-transform" />
                            </div>
                        </div>
                    ))}
                    {lessons.length === 0 && <p className="text-center text-card-muted">No lessons found for this category.</p>}
                </div>
            </div>
        );
    }

    // 3. Lesson Detail View
    if (subView === 'detail') {
        return <LessonDataLoader lessonId={activeData} onNavigate={onNavigate} />;
    }

    // 4. Quiz View
    if (subView === 'quiz') {
        return <QuizView lessonData={activeData} onNavigate={onNavigate} onUpdateWallet={onUpdateWallet} />;
    }

    // Default Fallback
    return (
        <div className="p-8 text-center text-card-muted">
            <p>Welcome to the learning module. Please select a category to begin.</p>
            <button
                onClick={() => onNavigate('learn', 'categories')}
                className="mt-4 text-cyan hover:text-primary-cyan-dark font-semibold"
            >
                View Categories
            </button>
        </div>
    );
}