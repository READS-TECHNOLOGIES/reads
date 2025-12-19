import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw, Shield, AlertTriangle, Clock, Ban } from 'lucide-react';

// --- Helper Components ---

const LoadingState = ({ message = "Loading quiz questions..." }) => (
    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-indigo-500" />
        <p>{message}</p>
    </div>
);

const CompletedState = ({ lessonTitle, onNavigate }) => (
    <div className="space-y-6 animate-fade-in p-8 bg-green-50 dark:bg-slate-800 rounded-2xl shadow-lg border-l-4 border-green-500">
        <CheckCircle size={48} className="text-green-600 mx-auto" />
        <h3 className="text-2xl font-bold text-center dark:text-white">Quiz Completed!</h3>
        <p className="text-center text-gray-600 dark:text-gray-400">
            You have already successfully completed the quiz for <strong>{lessonTitle}</strong> and earned your reward.
        </p>
        <button 
            onClick={() => onNavigate('learn', 'categories')}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold"
        >
            Explore More Lessons
        </button>
    </div>
);

const RateLimitError = ({ status, onNavigate, lessonId }) => (
    <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-lg border-2 border-yellow-500">
        <AlertTriangle size={48} className="text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-center text-yellow-800 dark:text-yellow-300 mb-2">
            Cannot Start Quiz
        </h3>
        <p className="text-center text-yellow-700 dark:text-yellow-400 mb-4">
            {status.reason}
        </p>
        
        {status.cooldown_remaining && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <p className="text-sm text-center text-yellow-800 dark:text-yellow-300">
                    ⏱️ Cooldown: <strong>{status.cooldown_remaining} seconds</strong> remaining
                </p>
            </div>
        )}
        
        {status.hourly_attempts_remaining !== undefined && (
            <p className="text-sm text-center text-yellow-700 dark:text-yellow-400 mb-2">
                📊 Hourly attempts remaining: <strong>{status.hourly_attempts_remaining}</strong>
            </p>
        )}
        
        {status.daily_attempts_remaining !== undefined && (
            <p className="text-sm text-center text-yellow-700 dark:text-yellow-400 mb-4">
                📊 Daily attempts remaining: <strong>{status.daily_attempts_remaining}</strong>
            </p>
        )}

        <button 
            onClick={() => onNavigate('learn', 'detail', lessonId)}
            className="w-full px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition font-semibold flex items-center justify-center"
        >
            <ArrowLeft size={16} className="mr-2" /> Back to Lesson
        </button>
    </div>
);

// 🆕 FLAGGED STATE COMPONENT
const FlaggedState = ({ violations, lessonTitle, onNavigate, lessonId }) => (
    <div className="space-y-6 animate-fade-in p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg border-l-4 border-red-500">
        <Ban size={48} className="text-red-600 dark:text-red-400 mx-auto" />
        <h3 className="text-2xl font-bold text-center text-red-800 dark:text-red-300">Quiz Flagged</h3>
        <p className="text-center text-red-700 dark:text-red-400">
            This quiz attempt for <strong>{lessonTitle}</strong> has been flagged due to security violations.
        </p>
        
        <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center">
                <AlertTriangle size={18} className="mr-2" />
                Violations Detected ({violations.length})
            </h4>
            <ul className="space-y-2 text-sm text-red-700 dark:text-red-400">
                {violations.map((v, idx) => (
                    <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <div>
                            <strong>{v.type}:</strong> {v.reason}
                            <span className="text-xs block text-red-600 dark:text-red-500 mt-1">
                                {new Date(v.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ <strong>This attempt has been recorded.</strong> You cannot submit this quiz. Please try again and avoid any suspicious activities.
            </p>
        </div>

        <button 
            onClick={() => onNavigate('learn', 'detail', lessonId)}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold flex items-center justify-center"
        >
            <ArrowLeft size={16} className="mr-2" /> Back to Lesson
        </button>
    </div>
);

// ===================================================================
// --- MAIN QuizView COMPONENT WITH ANTI-CHEAT & FLAGGING ---
// ===================================================================

const QuizView = ({ lessonData, onNavigate, onUpdateWallet }) => {
    const { lessonId, lessonTitle, category } = lessonData;

    const [quizAttempt, setQuizAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [questionTimes, setQuestionTimes] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [attemptStartTime, setAttemptStartTime] = useState(null);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [copyAttempts, setCopyAttempts] = useState(0);
    const [quizStatus, setQuizStatus] = useState(null);
    
    // 🆕 FLAGGING STATE
    const [isFlagged, setIsFlagged] = useState(false);
    const [violations, setViolations] = useState([]);

    const quizContainerRef = useRef(null);

    // 🆕 FLAG QUIZ FUNCTION
    const flagQuiz = async (violationType, reason) => {
        console.log('🚨 flagQuiz called:', { violationType, reason, isFlagged });
        
        if (isFlagged) {
            console.log('⚠️ Already flagged, skipping duplicate flag');
            return; // Already flagged, don't spam
        }

        const violation = {
            type: violationType,
            reason: reason,
            timestamp: new Date().toISOString()
        };

        console.log('📝 Adding violation to state:', violation);
        setViolations(prev => [...prev, violation]);
        setIsFlagged(true);

        // Call API to flag the quiz
        if (quizAttempt?.attempt_id) {
            console.log('🔄 Calling API to flag quiz:', {
                lessonId,
                attemptId: quizAttempt.attempt_id,
                violationType,
                reason
            });
            
            try {
                const result = await api.learn.flagQuizAttempt(
                    lessonId,
                    quizAttempt.attempt_id,
                    violationType,
                    reason
                );
                console.log('✅ API flag result:', result);
            } catch (error) {
                console.error('❌ Failed to flag quiz via API:', error);
            }
        } else {
            console.warn('⚠️ No attempt ID available, cannot flag via API');
        }

        // Show alert
        alert(`⚠️ Security Violation Detected!\n\n${reason}\n\nThis quiz has been flagged and cannot be submitted.`);
    };

    // 🔒 ENHANCED COPY & SECURITY PROTECTION WITH FLAGGING
    useEffect(() => {
        console.log('🔧 Setting up security event listeners. Status:', status, 'isFlagged:', isFlagged);
        
        const preventCopy = (e) => {
            console.log('🚫 COPY ATTEMPT DETECTED');
            e.preventDefault();
            setCopyAttempts(prev => prev + 1);
            flagQuiz('COPY_ATTEMPT', 'User attempted to copy quiz content');
        };

        const preventCut = (e) => {
            console.log('🚫 CUT ATTEMPT DETECTED');
            e.preventDefault();
            flagQuiz('CUT_ATTEMPT', 'User attempted to cut quiz content');
        };

        const preventRightClick = (e) => {
            console.log('🚫 RIGHT CLICK DETECTED');
            e.preventDefault();
            flagQuiz('RIGHT_CLICK', 'User attempted to right-click during quiz');
        };

        const preventSelectStart = (e) => {
            console.log('🚫 TEXT SELECTION DETECTED');
            e.preventDefault();
            flagQuiz('TEXT_SELECTION', 'User attempted to select text during quiz');
        };

        const preventKeyboardShortcuts = (e) => {
            // Detect Ctrl+C, Ctrl+A, Ctrl+X, Cmd+C, Cmd+A, Cmd+X
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                console.log('🚫 KEYBOARD COPY DETECTED');
                e.preventDefault();
                flagQuiz('KEYBOARD_COPY', 'User attempted keyboard copy shortcut (Ctrl/Cmd+C)');
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
                console.log('🚫 KEYBOARD SELECT ALL DETECTED');
                e.preventDefault();
                flagQuiz('KEYBOARD_SELECT_ALL', 'User attempted select all shortcut (Ctrl/Cmd+A)');
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
                console.log('🚫 KEYBOARD CUT DETECTED');
                e.preventDefault();
                flagQuiz('KEYBOARD_CUT', 'User attempted keyboard cut shortcut (Ctrl/Cmd+X)');
            }
        };

        const container = quizContainerRef.current;
        if (container && status === 'questions' && !isFlagged) {
            console.log('✅ Attaching event listeners to container');
            container.addEventListener('copy', preventCopy);
            container.addEventListener('cut', preventCut);
            container.addEventListener('contextmenu', preventRightClick);
            container.addEventListener('selectstart', preventSelectStart);
            document.addEventListener('keydown', preventKeyboardShortcuts);
            
            return () => {
                console.log('🧹 Cleaning up event listeners');
                container.removeEventListener('copy', preventCopy);
                container.removeEventListener('cut', preventCut);
                container.removeEventListener('contextmenu', preventRightClick);
                container.removeEventListener('selectstart', preventSelectStart);
                document.removeEventListener('keydown', preventKeyboardShortcuts);
            };
        } else {
            console.log('⚠️ Not attaching listeners. Container:', !!container, 'Status:', status, 'isFlagged:', isFlagged);
        }
    }, [status, isFlagged, quizAttempt, lessonId]);

    // 🆕 INITIALIZE QUIZ WITH ANTI-CHEAT
    useEffect(() => {
        const initializeQuiz = async () => {
            setStatus('loading');
            setErrorMessage('');
            
            try {
                // Check if user can take quiz
                const statusCheck = await api.learn.checkQuizStatus(lessonId);
                setQuizStatus(statusCheck);

                if (!statusCheck.can_attempt) {
                    setStatus('rate_limited');
                    return;
                }

                // Start quiz attempt with random questions
                const attempt = await api.learn.startQuizAttempt(lessonId);
                console.log('✅ Quiz attempt started:', attempt);
                setQuizAttempt(attempt);
                setQuestions(attempt.questions);
                setAttemptStartTime(Date.now());
                setQuestionStartTime(Date.now());
                setStatus('questions');

            } catch (err) {
                const message = err.message || 'An unknown API error occurred.';
                console.error("Quiz initialization error:", message);

                if (message === 'QuizAlreadyCompleted' || message.includes('already completed')) {
                    setStatus('completed');
                } else if (message.includes('Rate limit')) {
                    setStatus('rate_limited');
                    setErrorMessage(message);
                } else {
                    setErrorMessage(message);
                    setStatus('error');
                }
            }
        };

        initializeQuiz();
    }, [lessonId]);

    // 🆕 TRACK TIME PER QUESTION
    const handleAnswerChange = (questionId, selectedOption) => {
        if (isFlagged) {
            alert('⚠️ This quiz has been flagged. You cannot change answers.');
            return;
        }

        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));

        setQuestionTimes(prev => ({
            ...prev,
            [questionId]: timeSpent
        }));
    };

    // Navigate between questions
    const handleNextQuestion = () => {
        if (isFlagged) return;
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionStartTime(Date.now());
        }
    };

    const handlePreviousQuestion = () => {
        if (isFlagged) return;
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setQuestionStartTime(Date.now());
        }
    };

    // 🆕 SUBMIT WITH TIME VALIDATION - PREVENT IF FLAGGED
    const handleSubmit = async () => {
        if (isFlagged) {
            alert('⚠️ This quiz has been flagged and cannot be submitted. Please return to the lesson and try again.');
            return;
        }

        setStatus('submitting');
        setErrorMessage('');

        try {
            // Validate all questions answered
            if (Object.keys(answers).length !== questions.length) {
                alert('Please answer all questions before submitting.');
                setStatus('questions');
                return;
            }

            // Calculate total time
            const totalTimeSeconds = Math.floor((Date.now() - attemptStartTime) / 1000);
            const minTimePerQuestion = quizAttempt.min_time_per_question || 3;

            // Validate minimum time per question
            for (const qId of Object.keys(questionTimes)) {
                if (questionTimes[qId] < minTimePerQuestion) {
                    alert(`⚠️ Please spend at least ${minTimePerQuestion} seconds on each question.`);
                    setStatus('questions');
                    return;
                }
            }

            // Format answers with time tracking
            const formattedAnswers = questions.map(q => ({
                question_id: q.id,
                selected: answers[q.id],
                time_spent_seconds: questionTimes[q.id] || minTimePerQuestion
            }));

            console.log('🔵 About to submit quiz with:', {
                lessonId,
                attemptId: quizAttempt.attempt_id,
                answersCount: formattedAnswers.length,
                totalTimeSeconds
            });

            // Submit with anti-cheat validation
            const result = await api.learn.submitQuizAttempt(
                lessonId,
                quizAttempt.attempt_id,
                formattedAnswers,
                totalTimeSeconds
            );

            console.log('🟢 Quiz submission successful, result:', result);

            // Update wallet
            if (result.tokens_awarded > 0 && onUpdateWallet) {
                try {
                    await onUpdateWallet(result.tokens_awarded);
                } catch (walletErr) {
                    console.warn('Wallet update failed (non-critical):', walletErr);
                }
            }

            // Show warning if flagged
            if (result.flagged_suspicious) {
                alert(`⚠️ ${result.message || 'Your submission has been flagged for review due to unusually fast completion time.'}`);
            }

            // ✅ NAVIGATE TO RESULTS PAGE
            console.log('🟢 Navigating to results page...');
            onNavigate('learn', 'quiz-results', lessonId, {
                result: result,
                questions: questions,
                userAnswers: answers,
                lessonTitle: lessonTitle
            });

        } catch (err) {
            const message = err.message || 'An unknown API error occurred during submission.';
            console.error("🔴 Quiz submission failed:", message, err);
            setErrorMessage(message);
            setStatus('error');
        }
    };

    // --- RENDER LOGIC ---

    if (status === 'loading') {
        return <LoadingState message="Initializing quiz with anti-cheat protection..." />;
    }

    if (status === 'submitting') {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw size={32} className="mx-auto mb-4 animate-spin text-indigo-500" />
                <p className="text-lg font-semibold">Submitting Quiz...</p>
                <p className="text-sm mt-2">Validating answers and calculating rewards...</p>
            </div>
        );
    }

    if (status === 'completed') {
        return <CompletedState lessonTitle={lessonTitle} onNavigate={onNavigate} />;
    }

    if (status === 'rate_limited') {
        return <RateLimitError status={quizStatus} onNavigate={onNavigate} lessonId={lessonId} />;
    }

    if (status === 'error') {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg border-l-4 border-red-500">
                <XCircle size={24} className="mx-auto mb-3 text-red-500" />
                <p className='font-bold text-red-600 dark:text-red-400'>Quiz Error</p>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>{errorMessage}</p>
                <button 
                    onClick={() => { setStatus('loading'); setErrorMessage(''); }} 
                    className="mt-4 text-indigo-600 hover:underline"
                >
                    <RefreshCw size={16} className="inline mr-1" /> Retry
                </button>
                <div className='mt-4'>
                    <button onClick={() => onNavigate('learn', 'detail', lessonId)} className="flex items-center mx-auto text-sm text-gray-500 hover:text-indigo-600">
                         <ArrowLeft size={16} className="mr-1" /> Back to Lesson
                    </button>
                </div>
            </div>
        );
    }

    // 🆕 SHOW FLAGGED STATE IF QUIZ IS FLAGGED
    if (isFlagged) {
        return <FlaggedState 
            violations={violations} 
            lessonTitle={lessonTitle} 
            onNavigate={onNavigate}
            lessonId={lessonId}
        />;
    }

    // 🆕 QUIZ INTERFACE WITH ANTI-CHEAT
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const allAnswered = Object.keys(answers).length === questions.length;

    return (
        <div 
            ref={quizContainerRef}
            className="space-y-6 animate-fade-in select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
        >
            <button onClick={() => onNavigate('learn', 'detail', lessonId)} className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4 dark:text-indigo-400 dark:hover:text-indigo-300">
                <ArrowLeft size={16} className="mr-1" /> Back to Lesson
            </button>

            {/* 🔒 Security Warning */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 rounded-lg">
                <div className="flex items-center space-x-2">
                    <Shield size={20} className="text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        🔒 This quiz is protected. Right-click, text selection, and copying will flag the quiz.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold dark:text-white">Quiz: {lessonTitle}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Current Question */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700">
                <p className="font-semibold text-lg dark:text-white mb-4">
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                </p>

                <div className="space-y-3">
                    {currentQuestion.options.map(option => {
                        const optionKey = option.split('. ')[0];
                        const isSelected = answers[currentQuestion.id] === optionKey;

                        return (
                            <button
                                key={option}
                                onClick={() => handleAnswerChange(currentQuestion.id, optionKey)}
                                disabled={isFlagged}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 
                                    ${isSelected 
                                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-md ring-4 ring-indigo-200 dark:ring-indigo-800' 
                                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-slate-600 hover:border-indigo-300'
                                    }
                                    ${isFlagged ? 'opacity-50 cursor-not-allowed' : ''}`
                                }
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0 || isFlagged}
                    className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Previous
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Answered: {Object.keys(answers).length}/{questions.length}
                </span>

                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        onClick={handleNextQuestion}
                        disabled={isFlagged}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered || isFlagged}
                        className={`px-8 py-3 text-lg font-semibold text-white rounded-full shadow-lg transition duration-200 flex items-center space-x-2
                            ${allAnswered && !isFlagged
                                ? 'bg-green-500 hover:bg-green-600 transform hover:scale-105'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`
                        }
                    >
                        <Award size={20} />
                        <span>Submit Quiz</span>
                    </button>
                )}
            </div>

            {/* Info Footer */}
            {quizAttempt?.min_time_per_question && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 text-center flex items-center justify-center">
                        <Clock size={16} className="mr-2" />
                        ℹ️ Minimum {quizAttempt.min_time_per_question} seconds per question required
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuizView;