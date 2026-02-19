import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle } from 'lucide-react';

const StatCard = ({ label, value, color }) => (
    <div className="p-4 bg-black/30 rounded-lg border-2 border-cyan">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-card-muted mt-1">{label}</p>
    </div>
);

/**
 * Normalizes an answer value to just the letter key (e.g. "A", "B", "C", "D")
 * Handles formats like: "A", "A.", "A. Some text", "A) Some text", "a"
 */
const normalizeAnswer = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    // If it's already a single letter
    if (/^[A-Da-d]$/.test(str)) return str.toUpperCase();
    // If it starts with a letter followed by . or ) or space
    const match = str.match(/^([A-Da-d])[.):\s]/);
    if (match) return match[1].toUpperCase();
    // Fallback: return first character uppercased
    return str.charAt(0).toUpperCase();
};

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

    // ── Recalculate score client-side for accuracy ──
    let correctCount = 0;
    const questionResults = questions.map((q) => {
        const rawUserAnswer = userAnswers[q.id];
        const rawCorrectAnswer = q.correct_answer ?? q.correct_option ?? q.correctAnswer ?? '';

        const userKey = normalizeAnswer(rawUserAnswer);
        const correctKey = normalizeAnswer(rawCorrectAnswer);
        const isCorrect = userKey !== '' && userKey === correctKey;

        if (isCorrect) correctCount++;

        return { q, userKey, correctKey, isCorrect };
    });

    const total = questions.length;
    const calculatedScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // Use backend score if available and close to ours, otherwise use calculated
    const displayScore = result.score !== undefined ? result.score : calculatedScore;
    const passed = result.passed !== undefined ? result.passed : displayScore >= 70;
    const flagged = result.flagged_suspicious || false;

    return (
        <div className="space-y-6 animate-fade-in pb-6">
            {/* Header with score */}
            <div className="p-6 bg-light-card dark:bg-dark-card rounded-2xl shadow-lg border-2 border-cyan">
                <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-cyan flex items-center justify-center">
                        <Award size={32} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{passed ? "Congratulations!" : "Quiz Completed"}</h3>
                    <p className="text-sm text-card-muted">Results for: <strong className="text-white">{lessonTitle}</strong></p>
                </div>

                {/* Suspicious Activity Warning */}
                {flagged && (
                    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                                    ⚠️ Quiz Flagged for Review
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                                    {result.message || 'Completed too quickly - under admin review.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                    <StatCard
                        label="Score"
                        value={`${displayScore}%`}
                        color={passed ? 'text-green-500' : 'text-red-500'}
                    />
                    <StatCard
                        label="Correct"
                        value={`${correctCount}/${total}`}
                        color="text-cyan"
                    />
                    <StatCard
                        label="Tokens"
                        value={`+${result.tokens_awarded || 0}`}
                        color={flagged ? 'text-red-500' : 'text-orange'}
                    />
                </div>

                {!passed && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400 text-center">
                            You need 70% or higher to pass. Review the questions below!
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed question review */}
            <div className="space-y-3">
                <h4 className="text-lg font-bold text-white px-1">Question Review</h4>

                {questionResults.map(({ q, userKey, correctKey, isCorrect }, index) => (
                    <div
                        key={q.id}
                        className={`p-4 rounded-xl shadow-md border-2 ${
                            isCorrect
                                ? 'bg-green-900/10 border-green-500/50'
                                : 'bg-red-900/10 border-red-500/50'
                        }`}
                    >
                        {/* Question header */}
                        <div className="flex items-start justify-between mb-3">
                            <p className="font-medium text-sm text-white flex-1 leading-relaxed">
                                <span className="text-cyan font-bold">{index + 1}.</span> {q.question}
                            </p>
                            {isCorrect ? (
                                <CheckCircle size={20} className="text-green-500 flex-shrink-0 ml-2 mt-0.5" />
                            ) : (
                                <XCircle size={20} className="text-red-500 flex-shrink-0 ml-2 mt-0.5" />
                            )}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                            {q.options.map((option) => {
                                const optionKey = normalizeAnswer(option);
                                const isUserAnswer = userKey === optionKey;
                                const isCorrectOption = correctKey === optionKey;

                                // Determine styling
                                let bgColor = 'bg-black/30';
                                let borderColor = 'border-transparent';
                                let textColor = 'text-gray-300';
                                let badge = null;

                                if (isCorrectOption && isUserAnswer) {
                                    // ✅ User picked the correct answer
                                    bgColor = 'bg-green-900/20';
                                    borderColor = 'border-green-500';
                                    textColor = 'text-white';
                                    badge = (
                                        <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                                            <CheckCircle size={12} /> ✅ Your Answer
                                        </div>
                                    );
                                } else if (!isCorrectOption && isUserAnswer) {
                                    // ❌ User picked a wrong answer
                                    bgColor = 'bg-red-900/20';
                                    borderColor = 'border-red-500';
                                    textColor = 'text-white';
                                    badge = (
                                        <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                                            <XCircle size={12} /> ❌ Your Answer
                                        </div>
                                    );
                                } else if (isCorrectOption && !isUserAnswer) {
                                    // ✅ This is the correct answer (user got it wrong)
                                    bgColor = 'bg-green-900/20';
                                    borderColor = 'border-green-500';
                                    textColor = 'text-white';
                                    badge = (
                                        <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                                            <CheckCircle size={12} /> ✅ Correct
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={option}
                                        className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor} transition-all`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1 text-sm">{option}</span>
                                            {badge}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Debug info - remove in production */}
                        {!isCorrect && (
                            <p className="mt-2 text-xs text-gray-500">
                                Your answer: <strong className="text-red-400">{userKey || 'None'}</strong> &nbsp;|&nbsp;
                                Correct: <strong className="text-green-400">{correctKey}</strong>
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={() => onNavigate('learn', 'categories')}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan to-primary-cyan-dark text-white rounded-xl hover:shadow-lg transition font-semibold border-2 border-cyan shadow-lg hover:shadow-cyan/50 flex items-center justify-center gap-2"
            >
                <ArrowLeft size={20} />
                Continue Learning
            </button>
        </div>
    );
};

export default ResultSummaryPage;
