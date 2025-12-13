import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw } from 'lucide-react';

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
    const passed = result.score >= 70;
    const Icon = passed ? Award : XCircle;
    
    // Calculate total from correct + wrong, or use questions length
    const total = (result.correct || 0) + (result.wrong || 0) || questions.length;

    console.log('ResultSummary rendering with:', { result, questions, userAnswers, total });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with score */}
            <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <Icon size={48} className={`mx-auto mb-3 ${passed ? 'text-green-500' : 'text-red-500'}`} />
                    <h3 className="text-3xl font-bold dark:text-white">{passed ? "Congratulations!" : "Quiz Failed"}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Results for: <strong>{lessonTitle}</strong></p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center border-b pb-4">
                    <StatCard label="Score" value={`${result.score}%`} color={passed ? 'text-green-500' : 'text-red-500'} />
                    <StatCard label="Correct" value={`${result.correct}/${total}`} color="text-indigo-500" />
                    <StatCard label="Tokens Earned" value={`+${result.tokens_awarded || 0}`} color="text-yellow-500" />
                </div>

                {!passed && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                            You need 70% or higher to pass. Review the questions below and try again!
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


// ===================================================================
// --- MAIN QuizView COMPONENT ---
// ===================================================================

const QuizView = ({ lessonData, onNavigate, onUpdateWallet }) => {
    const { lessonId, lessonTitle, category } = lessonData;

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submissionResult, setSubmissionResult] = useState(null);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchQuiz = async () => {
            setStatus('loading');
            setErrorMessage('');
            try {
                const data = await api.learn.getQuizQuestions(lessonId);
                console.log('Quiz questions fetched:', data);
                setQuestions(data);
                setStatus('questions');
            } catch (err) {
                const message = err.message || 'An unknown API error occurred.';
                console.error("Quiz fetch error:", message);

                if (message === 'QuizAlreadyCompleted') {
                    setStatus('completed');
                } else {
                    setErrorMessage(message);
                    setStatus('error');
                }
            }
        };

        if (!submissionResult) {
            fetchQuiz();
        }
    }, [lessonId, submissionResult]);


    const handleAnswerChange = (questionId, selectedOption) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));
    };

    const handleSubmit = async () => {
        console.log('🔵 handleSubmit called, setting status to submitting');
        setStatus('submitting');
        setErrorMessage('');

        const submissionBody = {
            lesson_id: lessonId,
            answers: Object.entries(answers).map(([question_id, selected]) => ({
                question_id: question_id,
                selected: selected
            }))
        };

        console.log('🔵 Submitting quiz with answers:', submissionBody);

        try {
            const result = await api.learn.submitQuiz(lessonId, submissionBody.answers);
            console.log('🟢 Quiz submission result received:', result);

            // Update wallet balance if tokens were awarded
            if (result.tokens_awarded > 0 && onUpdateWallet) {
                console.log('🔵 Updating wallet with tokens:', result.tokens_awarded);
                onUpdateWallet(result.tokens_awarded); 
            }

            console.log('🔵 Setting submission result and changing status to results');
            setSubmissionResult(result);
            setStatus('results');
            console.log('🟢 Status changed to results');

        } catch (err) {
            const message = err.message || 'An unknown API error occurred during submission.';
            console.error("🔴 Quiz submission failed:", message, err);
            setErrorMessage(message); 
            setStatus('error');
        }
    };

    // --- RENDER LOGIC ---
    console.log('🔵 QuizView rendering with status:', status);

    if (status === 'loading') {
        return <LoadingState message="Fetching quiz questions..." />;
    }

    if (status === 'submitting') {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw size={32} className="mx-auto mb-4 animate-spin text-indigo-500" />
                <p className="text-lg font-semibold">Submitting Quiz...</p>
                <p className="text-sm mt-2">Calculating Rewards...</p>
            </div>
        );
    }

    if (status === 'completed') {
        return <CompletedState lessonTitle={lessonTitle} onNavigate={onNavigate} />;
    }

    if (status === 'results' && 'submissionResult') {
        console.log('🟢 Rendering ResultSummary component');
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
                <p className='font-bold text-red-600 dark:text-red-400'>Congratulations 🎊🎊🎉🎉 Quiz  Already Completed</p>
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

    // Default view: Display Questions
    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={() => onNavigate('learn', 'detail', lessonId)} className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4 dark:text-indigo-400 dark:hover:text-indigo-300">
                <ArrowLeft size={16} className="mr-1" /> Back to Lesson
            </button>
            <h2 className="text-3xl font-bold dark:text-white">Quiz: {lessonTitle}</h2>
            <p className="text-gray-600 dark:text-gray-400">Test your knowledge on {category}. You must score 70% or more to earn tokens.</p>

            <div className="space-y-8">
                {questions.map((q, index) => (
                    <div key={q.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700">
                        <p className="font-semibold text-lg dark:text-white mb-4">
                            {index + 1}. {q.question}
                        </p>

                        <div className="space-y-3">
                            {q.options.map(option => {
                                const optionKey = option.split('. ')[0];
                                const isSelected = answers[q.id] === optionKey;

                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswerChange(q.id, optionKey)}
                                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 
                                            ${isSelected 
                                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' 
                                                : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-slate-600'
                                            }`
                                        }
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-6 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length !== questions.length}
                    className={`px-8 py-3 text-lg font-semibold text-white rounded-full shadow-lg transition duration-200
                        ${Object.keys(answers).length === questions.length 
                            ? 'bg-green-500 hover:bg-green-600 transform hover:scale-105'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`
                    }
                >
                    Submit Quiz ({Object.keys(answers).length}/{questions.length})
                </button>
            </div>
        </div>
    );
};

export default QuizView;