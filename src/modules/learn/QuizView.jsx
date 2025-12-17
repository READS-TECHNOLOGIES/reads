import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw, Shield, AlertTriangle, Clock } from 'lucide-react';

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

const ResultSummary = ({ result, questions, userAnswers, lessonTitle, onNavigate }) => {
    const passed = result.passed !== undefined ? result.passed : result.score >= 70;
    const Icon = passed ? Award : XCircle;
    const total = (result.correct || 0) + (result.wrong || 0) || questions.length;
    const flagged = result.flagged_suspicious || false;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with score */}
            <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <Icon size={48} className={`mx-auto mb-3 ${passed ? 'text-green-500' : 'text-red-500'}`} />
                    <h3 className="text-3xl font-bold dark:text-white">{passed ? "Congratulations!" : "Quiz Failed"}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Results for: <strong>{lessonTitle}</strong></p>
                </div>

                {/* 🆕 Suspicious Activity Warning */}
                {flagged && (
                    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                    ⚠️ Quiz Flagged for Review
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                    {result.message || 'Your submission was completed too quickly and has been flagged for admin review.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-center border-b pb-4">
                    <StatCard label="Score" value={`${result.score}%`} color={passed ? 'text-green-500' : 'text-red-500'} />
                    <StatCard label="Correct" value={`${result.correct}/${total}`} color="text-indigo-500" />
                    <StatCard label="Tokens Earned" value={`+${result.tokens_awarded || 0}`} color={flagged ? 'text-red-500' : 'text-yellow-500'} />
                </div>

                {!passed && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                            You need 70% or higher to pass. Review the questions below and try again after the cooldown period!
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed question review */}
            <div className="space-y-4">
                <h4 className="text-xl font-bold dark:text-white">Question Review</h4>
                {questions.map((q, index) => {
                    const userAnswer = userAnswers[q.id];
                    const correctAnswer = q.correct_answer || q.correct_option || q.correctAnswer;
                    const isCorrect = userAnswer === correctAnswer;

                    return (
                        <div 
                            key={q.id} 
                            className={`p-6 rounded-xl shadow-md border-2 ${
                                isCorrect 
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <p className="font-semibold text-lg dark:text-white flex-1">
                                    {index + 1}. {q.question}
                                </p>
                                {isCorrect ? (
                                    <CheckCircle size={24} className="text-green-500 flex-shrink-0 ml-2" />
                                ) : (
                                    <XCircle size={24} className="text-red-500 flex-shrink-0 ml-2" />
                                )}
                            </div>

                            <div className="space-y-2">
                                {q.options.map(option => {
                                    const optionKey = option.split('. ')[0];
                                    const isUserAnswer = userAnswer === optionKey;
                                    const isCorrectOption = correctAnswer === optionKey;

                                    let bgColor = 'bg-gray-50 dark:bg-slate-700';
                                    let borderColor = 'border-gray-200 dark:border-slate-600';
                                    let textColor = 'text-gray-700 dark:text-gray-200';

                                    if (isCorrectOption) {
                                        bgColor = 'bg-green-100 dark:bg-green-900/30';
                                        borderColor = 'border-green-500';
                                        textColor = 'text-green-800 dark:text-green-200';
                                    } else if (isUserAnswer && !isCorrect) {
                                        bgColor = 'bg-red-100 dark:bg-red-900/30';
                                        borderColor = 'border-red-500';
                                        textColor = 'text-red-800 dark:text-red-200';
                                    }

                                    return (
                                        <div
                                            key={option}
                                            className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{option}</span>
                                                {isCorrectOption && (
                                                    <span className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded">
                                                        Correct Answer
                                                    </span>
                                                )}
                                                {isUserAnswer && !isCorrect && (
                                                    <span className="text-xs font-semibold bg-red-500 text-white px-2 py-1 rounded">
                                                        Your Answer
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button 
                onClick={() => onNavigate('learn', 'categories')}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold"
            >
                Continue Learning
            </button>
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
);

// 🆕 Rate Limit Error Component
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

// ===================================================================
// --- MAIN QuizView COMPONENT WITH ANTI-CHEAT ---
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
    const [submissionResult, setSubmissionResult] = useState(null);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [copyAttempts, setCopyAttempts] = useState(0);
    const [quizStatus, setQuizStatus] = useState(null);

    const quizContainerRef = useRef(null);

    // 🔒 COPY PROTECTION
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
        if (container && status === 'questions') {
            container.addEventListener('copy', preventCopy);
            container.addEventListener('contextmenu', preventRightClick);
            
            return () => {
                container.removeEventListener('copy', preventCopy);
                container.removeEventListener('contextmenu', preventRightClick);
            };
        }
    }, [copyAttempts, status]);

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

        if (!submissionResult) {
            initializeQuiz();
        }
    }, [lessonId, submissionResult]);

    // 🆕 TRACK TIME PER QUESTION
    const handleAnswerChange = (questionId, selectedOption) => {
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
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionStartTime(Date.now());
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setQuestionStartTime(Date.now());
        }
    };

    // 🆕 SUBMIT WITH TIME VALIDATION - FIXED VERSION
    const handleSubmit = async () => {
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

            // ✅ FIX: Set submission result first
            setSubmissionResult(result);
            
            // Update wallet BEFORE changing status
            if (result.tokens_awarded > 0 && onUpdateWallet) {
                try {
                    await onUpdateWallet(result.tokens_awarded);
                } catch (walletErr) {
                    console.warn('Wallet update failed (non-critical):', walletErr);
                }
            }

            // ✅ FIX: Change status to results AFTER everything is ready
            setStatus('results');

            // Show warning if flagged
            if (result.flagged_suspicious) {
                setTimeout(() => {
                    alert(`⚠️ ${result.message || 'Your submission has been flagged for review due to unusually fast completion time.'}`);
                }, 500);
            }

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

    // ✅ FIX: Better handling of results state
    if (status === 'results') {
        if (!submissionResult) {
            return <LoadingState message="Loading results..." />;
        }
        return (
            <ResultSummary 
                result={submissionResult} 
                questions={questions}
                userAnswers={answers}
                lessonTitle={lessonTitle} 
                onNavigate={onNavigate} 
            />
        );
    }

    if (status === 'error') {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg border-l-4 border-red-500">
                <XCircle size={24} className="mx-auto mb-3 text-red-500" />
                <p className='font-bold text-red-600 dark:text-red-400'>Quiz Error</p>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>{errorMessage}</p>
                <button 
                    onClick={() => { setStatus('loading'); setErrorMessage(''); setSubmissionResult(null); }} 
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

            {/* 🔒 Copy Protection Warning */}
            {copyAttempts > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Shield size={20} className="text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-700 dark:text-red-300">
                            ⚠️ Copy protection is active. Please answer honestly.
                        </p>
                    </div>
                </div>
            )}

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
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 
                                    ${isSelected 
                                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-md ring-4 ring-indigo-200 dark:ring-indigo-800' 
                                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-slate-600 hover:border-indigo-300'
                                    }`
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
                    disabled={currentQuestionIndex === 0}
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
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        className={`px-8 py-3 text-lg font-semibold text-white rounded-full shadow-lg transition duration-200 flex items-center space-x-2
                            ${allAnswered 
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