import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ArrowLeft, PlayCircle, Clock, Award, CheckCircle, Trash2, XCircle, RefreshCw, AlertTriangle, Shield } from 'lucide-react';
import { api } from '../../services/api';
import ResultSummaryPage from './ResultSummaryPage.jsx'; // 🆕 Import the new component

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
// --- 1. Lesson Detail View with Time Tracking ---
// ====================================================================

const LessonDetailView = ({ lesson, onNavigate }) => {
    const [readTime, setReadTime] = useState(0);
    const [isTracking, setIsTracking] = useState(true);
    const accumulatedTimeRef = useRef(0);
    const lastStartTimeRef = useRef(null);
    const intervalRef = useRef(null);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        // Prevent multiple initializations
        if (isInitializedRef.current) return;
        
        isInitializedRef.current = true;
        lastStartTimeRef.current = Date.now();
        accumulatedTimeRef.current = 0;
        setReadTime(0);
        setIsTracking(true);
        
        // Update displayed time every second
        intervalRef.current = setInterval(() => {
            if (lastStartTimeRef.current) {
                const currentSessionTime = Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
                const totalTime = accumulatedTimeRef.current + currentSessionTime;
                setReadTime(totalTime);
            }
        }, 1000);

        // Track visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab hidden - pause tracking
                if (lastStartTimeRef.current) {
                    const currentSessionTime = Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
                    accumulatedTimeRef.current += currentSessionTime;
                    lastStartTimeRef.current = null;
                }
                setIsTracking(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } else {
                // Tab visible - resume tracking
                lastStartTimeRef.current = Date.now();
                setIsTracking(true);
                
                intervalRef.current = setInterval(() => {
                    if (lastStartTimeRef.current) {
                        const currentSessionTime = Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
                        const totalTime = accumulatedTimeRef.current + currentSessionTime;
                        setReadTime(totalTime);
                    }
                }, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            
            // Track final read time
            if (lesson?.id) {
                let finalTime = accumulatedTimeRef.current;
                if (lastStartTimeRef.current) {
                    finalTime += Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
                }
                api.learn.trackLessonTime(lesson.id, finalTime).catch(err => {
                    console.warn('Failed to track lesson time:', err);
                });
            }
            
            // Reset for next mount
            isInitializedRef.current = false;
        };
    }, [lesson?.id]);

    const safeContent = (lesson.content || 'Content not available.').replace(/\n/g, '<br/>');

    const getEmbedUrl = (url) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch?v=')) {
            const match = url.match(/[?&]v=([^&]+)/);
            return match ? `https://www.youtube.com/embed/${match[1]}` : url;
        }
        return url.startsWith('http') ? url : `https://www.youtube.com/embed/${url}`;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const minReadTime = lesson.min_read_time || 30;
    const canTakeQuiz = readTime >= minReadTime;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => onNavigate('learn', 'list', { name: lesson.category })} 
                    className="flex items-center text-cyan hover:text-primary-cyan-dark text-sm font-medium transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Lessons
                </button>

                {/* Read Time Tracker */}
                <div className="flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-full border border-cyan-light">
                    <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <Clock size={16} className="text-cyan" />
                    <span className="text-sm text-white font-semibold">{formatTime(readTime)}</span>
                </div>
            </div>

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

            {/* Quiz CTA with Time Validation */}
            <div className={`p-6 rounded-2xl border-2 ${canTakeQuiz ? 'bg-cyan/10 border-cyan' : 'bg-yellow-500/10 border-yellow-500'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {canTakeQuiz ? 'Ready to Test Your Knowledge?' : 'Keep Reading...'}
                        </h3>
                        {canTakeQuiz ? (
                            <p className="text-card-muted">Complete the quiz to earn tokens!</p>
                        ) : (
                            <p className="text-yellow-400 flex items-center">
                                <Shield size={16} className="mr-2" />
                                Read for at least {minReadTime}s before taking the quiz ({minReadTime - readTime}s remaining)
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => onNavigate('learn', 'quiz', { lessonId: lesson.id, lessonTitle: lesson.title, category: lesson.category })}
                        disabled={!canTakeQuiz}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border-2 
                            ${canTakeQuiz 
                                ? 'bg-cyan text-white hover:bg-primary-cyan-dark border-cyan shadow-lg' 
                                : 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Award size={20} /> {canTakeQuiz ? 'Start Quiz' : 'Locked'}
                    </button>
                </div>
            </div>

            {/* Reading Tips */}
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-300 mb-2 flex items-center">
                    <Shield size={16} className="mr-2" /> 📚 Study Tips
                </h4>
                <ul className="text-sm text-blue-200 space-y-1">
                    <li>• Read carefully to understand key concepts</li>
                    <li>• Watch the video for better retention</li>
                    <li>• Minimum read time required: {minReadTime} seconds</li>
                    <li>• Quiz questions are randomly selected</li>
                </ul>
            </div>
        </div>
    );
};

// ====================================================================
// --- 2. Quiz View with Anti-Cheat (UPDATED TO NAVIGATE TO RESULTS) ---
// ====================================================================

const QuizView = ({ lessonData, onNavigate, onUpdateWallet }) => {
    const { lessonId, lessonTitle } = lessonData;

    const [quizAttempt, setQuizAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [step, setStep] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState({});
    const [questionTimes, setQuestionTimes] = useState({});
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [attemptStartTime, setAttemptStartTime] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [quizStatus, setQuizStatus] = useState(null);
    const [copyAttempts, setCopyAttempts] = useState(0);

    const quizContainerRef = useRef(null);

    // 🔒 Copy Protection
    useEffect(() => {
        const preventCopy = (e) => {
            e.preventDefault();
            setCopyAttempts(prev => prev + 1);
            if (copyAttempts >= 2) {
                alert('⚠️ Copy protection active. Please answer honestly.');
            }
        };

        const preventRightClick = (e) => {
            e.preventDefault();
            alert('⚠️ Right-click is disabled during the quiz.');
        };

        const container = quizContainerRef.current;
        if (container) {
            container.addEventListener('copy', preventCopy);
            container.addEventListener('contextmenu', preventRightClick);
            
            return () => {
                container.removeEventListener('copy', preventCopy);
                container.removeEventListener('contextmenu', preventRightClick);
            };
        }
    }, [copyAttempts]);

    // Initialize quiz with anti-cheat checks
    useEffect(() => {
        const initializeQuiz = async () => {
            console.log('🎯 Initializing quiz for lesson:', lessonId);
            setIsLoading(true);
            setLoadError(null);

            try {
                // Check if user can take quiz
                console.log('📋 Step 1: Checking quiz status...');
                const status = await api.learn.checkQuizStatus(lessonId);
                console.log('✅ Quiz status received:', status);
                setQuizStatus(status);

                if (!status.can_attempt) {
                    console.log('❌ Cannot attempt quiz:', status.reason);
                    setLoadError(status.reason);
                    setIsLoading(false);
                    return;
                }

                // Start quiz attempt
                console.log('🚀 Step 2: Starting quiz attempt...');
                const attempt = await api.learn.startQuizAttempt(lessonId);
                console.log('✅ Quiz attempt started:', attempt);
                
                if (!attempt || !attempt.questions || attempt.questions.length === 0) {
                    console.error('❌ No questions received in attempt:', attempt);
                    setLoadError('No quiz questions available for this lesson.');
                    setIsLoading(false);
                    return;
                }
                
                setQuizAttempt(attempt);
                setQuestions(attempt.questions);
                setAttemptStartTime(Date.now());
                setQuestionStartTime(Date.now());
                console.log('✅ Quiz initialized successfully with', attempt.questions.length, 'questions');
                setIsLoading(false);

            } catch (e) {
                console.error('❌ Failed to initialize quiz:', e);
                console.error('Error details:', {
                    message: e.message,
                    stack: e.stack,
                    lessonId: lessonId
                });
                
                if (e.message === 'QuizAlreadyCompleted') {
                    setLoadError("COMPLETED");
                } else if (e.message.includes('Rate limit')) {
                    setLoadError("Rate limit exceeded. Please try again later.");
                } else if (e.message.includes('404')) {
                    setLoadError("Quiz not found for this lesson. Please contact admin.");
                } else {
                    setLoadError(`Failed to start quiz: ${e.message}`);
                }
                setIsLoading(false);
            }
        };

        if (lessonId) {
            console.log('🎮 QuizView mounted with lessonId:', lessonId);
            initializeQuiz();
        } else {
            console.error('❌ No lessonId provided to QuizView');
            setLoadError('No lesson ID provided');
            setIsLoading(false);
        }
    }, [lessonId]);

    const handleAnswerSelect = (optionChar) => {
        const currentQuestion = questions[step];
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        
        setSelectedAnswer(optionChar);
        setQuestionTimes(prev => ({
            ...prev,
            [currentQuestion.id]: timeSpent
        }));
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
            setQuestionStartTime(Date.now());
        } else {
            // 🆕 Submit quiz and navigate to results page
            setIsLoading(true);
            try {
                const totalTimeSeconds = Math.floor((Date.now() - attemptStartTime) / 1000);
                const minTimePerQuestion = quizAttempt.min_time_per_question;

                // Validate minimum time
                for (const qId of Object.keys(questionTimes)) {
                    if (questionTimes[qId] < minTimePerQuestion) {
                        alert(`⚠️ Please spend at least ${minTimePerQuestion} seconds on each question.`);
                        setIsLoading(false);
                        return;
                    }
                }

                const formattedAnswers = questions.map(q => ({
                    question_id: q.id,
                    selected: newAnswers[q.id],
                    time_spent_seconds: questionTimes[q.id] || minTimePerQuestion
                }));

                console.log('🔵 Submitting quiz...');
                const result = await api.learn.submitQuizAttempt(
                    lessonId,
                    quizAttempt.attempt_id,
                    formattedAnswers,
                    totalTimeSeconds
                );

                console.log('🟢 Quiz submission successful:', result);

                // Update wallet
                if (result.tokens_awarded > 0 && onUpdateWallet) {
                    await onUpdateWallet(result.tokens_awarded);
                }

                // Show warning if flagged
                if (result.flagged_suspicious) {
                    alert(`⚠️ ${result.message || 'Your submission has been flagged for review.'}`);
                }

                // 🆕 Navigate to results page with all the data
                console.log('🟢 Navigating to results page...');
                onNavigate('learn', 'quiz-results', lessonId, {
                    result: result,
                    questions: questions,
                    userAnswers: newAnswers,
                    lessonTitle: lessonTitle
                });

            } catch (e) {
                console.error("🔴 Quiz submission failed:", e);
                setLoadError(`Submission failed: ${e.message || 'Unknown error'}`);
                setIsLoading(false);
            }
        }
    };

    // Error states
    if (loadError === "COMPLETED") {
        return <CompletedState lessonTitle={lessonTitle} onNavigate={onNavigate} />;
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-yellow-900/20 border-2 border-yellow-500 rounded-xl shadow-lg animate-fade-in">
                <AlertTriangle size={48} className="mx-auto mb-3 text-yellow-500" />
                <h2 className="text-xl font-semibold text-yellow-400">Cannot Start Quiz</h2>
                <p className="text-yellow-300 mt-2">{loadError}</p>
                
                {quizStatus?.cooldown_remaining && (
                    <p className="text-sm text-yellow-200 mt-2">
                        ⏱️ Cooldown: {quizStatus.cooldown_remaining}s remaining
                    </p>
                )}
                
                {quizStatus?.hourly_attempts_remaining !== undefined && (
                    <p className="text-sm text-yellow-200 mt-1">
                        Hourly attempts: {quizStatus.hourly_attempts_remaining} left
                    </p>
                )}
                
                {quizStatus?.daily_attempts_remaining !== undefined && (
                    <p className="text-sm text-yellow-200 mt-1">
                        Daily attempts: {quizStatus.daily_attempts_remaining} left
                    </p>
                )}

                <button
                    onClick={() => onNavigate('learn', 'detail', lessonId)}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-cyan rounded-lg hover:bg-primary-cyan-dark transition-all border-2 border-cyan"
                >
                    <ArrowLeft size={16} className="inline mr-1" /> Back to Lesson
                </button>
            </div>
        );
    }

    if (isLoading || !questions.length) {
        const loadingMessage = isLoading && !quizAttempt
            ? "Loading quiz..."
            : isLoading && quizAttempt
            ? "Submitting quiz..."
            : "Initializing...";
            
        return (
            <div className="p-8 text-center">
                <LoadingState message={loadingMessage} />
            </div>
        );
    }

    // Quiz interface
    const currentQuestion = questions[step];
    const optionChars = ['A', 'B', 'C', 'D'];
    const progress = ((step + 1) / questions.length) * 100;

    return (
        <div 
            ref={quizContainerRef}
            className="animate-fade-in select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
            <button
                onClick={() => onNavigate('learn', 'detail', lessonId)}
                className="flex items-center text-cyan hover:text-primary-cyan-dark text-sm font-medium mb-6 transition-colors"
            >
                <ArrowLeft size={16} className="mr-1" /> Back to Lesson
            </button>

            {/* 🔒 Copy Protection Warning */}
            {copyAttempts > 0 && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
                    <p className="text-red-400 text-sm flex items-center">
                        <Shield size={16} className="mr-2" />
                        ⚠️ Copy protection active. Please answer honestly.
                    </p>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white">Question {step + 1}/{questions.length}</h3>
                <span className="text-sm text-card-muted">{Math.round(progress)}% Complete</span>
            </div>

            <div className="w-full bg-black/30 rounded-full h-3 mb-8 border border-cyan-light overflow-hidden">
                <div
                    style={{ width: `${progress}%` }}
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

            {quizAttempt?.min_time_per_question && (
                <p className="text-center text-sm text-card-muted mt-4">
                    ℹ️ Minimum {quizAttempt.min_time_per_question}s per question required
                </p>
            )}
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
// --- 4. Main Learn Module (UPDATED WITH QUIZ-RESULTS ROUTE) ---
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

    // 🆕 5. Quiz Results View
    if (subView === 'quiz-results') {
        console.log('🟢 Rendering quiz results with data:', activeData);
        
        if (!activeData || !activeData.result || !activeData.questions || !activeData.userAnswers) {
            console.error('🔴 Missing required data for results page:', activeData);
            return (
                <div className="text-center p-8 bg-red-900/20 border-2 border-red-500 rounded-xl">
                    <XCircle size={48} className="mx-auto mb-3 text-red-500" />
                    <h2 className="text-xl font-semibold text-red-400">Error Loading Results</h2>
                    <p className="text-red-300 mt-2">Quiz result data is missing or incomplete.</p>
                    <button
                        onClick={() => onNavigate('learn', 'categories')}
                        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-cyan rounded-lg hover:bg-primary-cyan-dark transition-all border-2 border-cyan"
                    >
                        Back to Categories
                    </button>
                </div>
            );
        }

        return (
            <ResultSummaryPage
                result={activeData.result}
                questions={activeData.questions}
                userAnswers={activeData.userAnswers}
                lessonTitle={activeData.lessonTitle}
                onNavigate={onNavigate}
            />
        );
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