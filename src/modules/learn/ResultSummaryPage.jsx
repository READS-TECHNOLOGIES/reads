import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle } from 'lucide-react';

const StatCard = ({ label, value, color }) => (
    <div className="p-3 bg-black/30 rounded-lg border-2 border-cyan-light">
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-card-muted mt-1">{label}</p>
    </div>
);

const ResultSummaryPage = ({ result, questions, userAnswers, lessonTitle, onNavigate }) => {
    console.log('🟢 ResultSummaryPage rendered with:', { result, questions, userAnswers, lessonTitle });

    if (!result || !questions || !userAnswers) {
        console.error('🔴 ResultSummaryPage missing required props:', { result, questions, userAnswers });
        return (
            <div className="p-8 text-center bg-red-900/20 border-2 border-red-500 rounded-xl">
                <XCircle size={48} className="mx-auto mb-3 text-red-500" />
                <p className="text-red-600 dark:text-red-400 font-bold">Error: Missing result data</p>
                <button 
                    onClick={() => onNavigate('learn', 'categories')}
                    className="mt-4 px-4 py-2 bg-cyan text-white rounded-lg hover:bg-primary-cyan-dark border-2 border-cyan"
                >
                    Back to Lessons
                </button>
            </div>
        );
    }

    const passed = result.passed !== undefined ? result.passed : result.score >= 70;
    const Icon = passed ? Award : XCircle;
    const total = (result.correct || 0) + (result.wrong || 0) || questions.length;
    const flagged = result.flagged_suspicious || false;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with score */}
            <div className="p-8 bg-light-card dark:bg-dark-card rounded-2xl shadow-lg border-2 border-cyan">
                <div className="text-center">
                    <Icon size={48} className={`mx-auto mb-3 ${passed ? 'text-green-500' : 'text-red-500'}`} />
                    <h3 className="text-3xl font-bold text-white">{passed ? "Congratulations!" : "Quiz Failed"}</h3>
                    <p className="text-card-muted mb-4">Results for: <strong className="text-white">{lessonTitle}</strong></p>
                </div>

                {/* Suspicious Activity Warning */}
                {flagged && (
                    <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
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

                <div className="grid grid-cols-3 gap-4 text-center border-b border-cyan-light pb-4">
                    <StatCard label="Score" value={`${result.score}%`} color={passed ? 'text-green-500' : 'text-red-500'} />
                    <StatCard label="Correct" value={`${result.correct}/${total}`} color="text-cyan" />
                    <StatCard label="Tokens Earned" value={`+${result.tokens_awarded || 0}`} color={flagged ? 'text-red-500' : 'text-orange'} />
                </div>

                {!passed && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                            You need 70% or higher to pass. Review the questions below and try again after the cooldown period!
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed question review */}
            <div className="space-y-4">
                <h4 className="text-xl font-bold text-white">Question Review</h4>
                {questions.map((q, index) => {
                    const userAnswer = userAnswers[q.id];
                    const correctAnswer = q.correct_answer || q.correct_option || q.correctAnswer;
                    const isCorrect = userAnswer === correctAnswer;

                    return (
                        <div 
                            key={q.id} 
                            className={`p-6 rounded-xl shadow-md border-2 ${
                                isCorrect 
                                    ? 'bg-green-900/20 border-green-500' 
                                    : 'bg-red-900/20 border-red-500'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <p className="font-semibold text-lg text-white flex-1">
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
                                    const optionKey = option.split('. ')[0]; // Extract "A", "B", "C", "D"
                                    const isUserAnswer = userAnswer === optionKey;
                                    const isCorrectOption = correctAnswer === optionKey;

                                    let bgColor = 'bg-black/30';
                                    let borderColor = 'border-cyan-light';
                                    let textColor = 'text-gray-200';
                                    let badge = null;

                                    if (isCorrect && isUserAnswer) {
                                        // ✅ User answered correctly - show single green badge
                                        bgColor = 'bg-green-900/30';
                                        borderColor = 'border-green-500';
                                        textColor = 'text-green-200';
                                        badge = (
                                            <span className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1">
                                                <CheckCircle size={14} /> Your Answer ✓
                                            </span>
                                        );
                                    } else if (!isCorrect && isUserAnswer) {
                                        // ❌ User answered wrong - show red badge
                                        bgColor = 'bg-red-900/30';
                                        borderColor = 'border-red-500';
                                        textColor = 'text-red-200';
                                        badge = (
                                            <span className="text-xs font-semibold bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1">
                                                <XCircle size={14} /> Your Answer ✗
                                            </span>
                                        );
                                    } else if (!isCorrect && isCorrectOption) {
                                        // ✅ Show the correct answer when user was wrong
                                        bgColor = 'bg-green-900/30';
                                        borderColor = 'border-green-500';
                                        textColor = 'text-green-200';
                                        badge = (
                                            <span className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1">
                                                <CheckCircle size={14} /> Correct Answer
                                            </span>
                                        );
                                    }

                                    return (
                                        <div
                                            key={option}
                                            className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor} transition-all`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="flex-1 font-medium">{option}</span>
                                                {badge && (
                                                    <div className="flex items-center gap-2">
                                                        {badge}
                                                    </div>
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
                className="w-full px-4 py-3 bg-cyan text-white rounded-xl hover:bg-primary-cyan-dark transition font-semibold border-2 border-cyan shadow-lg hover:shadow-cyan/50 flex items-center justify-center gap-2"
            >
                <ArrowLeft size={20} />
                Continue Learning
            </button>
        </div>
    );
};

export default ResultSummaryPage;