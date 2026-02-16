import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle, RefreshCw, List, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import QuizConfigForm from './QuizConfigForm';

const INPUT_CLS =
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all text-sm';

const LABEL_CLS = 'block text-sm font-semibold text-gray-700 mb-1.5';

const getOptionLetter = (idx) => ['A', 'B', 'C', 'D'][idx];

const emptyQuestion = () => ({
    question_text: '',
    options: ['', '', '', ''],
    correct_option: 'A',
    explanation: '',
});

const QuizCreationForm = ({ lessonId, lessonTitle, onToast, onComplete }) => {
    const [quizConfig, setQuizConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [showConfigForm, setShowConfigForm] = useState(false);
    const [questions, setQuestions] = useState([emptyQuestion()]);
    const [isLoading, setIsLoading] = useState(false);

    const loadConfig = useCallback(async () => {
        setConfigLoading(true);
        try {
            const cfg = await api.admin.getQuizConfig(lessonId);
            setQuizConfig(cfg);
        } catch {
            setQuizConfig(null);
        } finally {
            setConfigLoading(false);
        }
    }, [lessonId]);

    useEffect(() => { loadConfig(); }, [loadConfig]);

    const handleQuestionChange = (qIdx, field, value) => {
        setQuestions(prev => {
            const updated = [...prev];
            updated[qIdx] = { ...updated[qIdx], [field]: value };
            return updated;
        });
    };

    const handleOptionChange = (qIdx, oIdx, value) => {
        setQuestions(prev => {
            const updated = [...prev];
            const opts = [...updated[qIdx].options];
            opts[oIdx] = value;
            updated[qIdx] = { ...updated[qIdx], options: opts };
            return updated;
        });
    };

    const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);

    const removeQuestion = (qIdx) => {
        if (questions.length === 1) return;
        setQuestions(prev => prev.filter((_, i) => i !== qIdx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!quizConfig) {
            onToast({ message: 'Please configure anti-cheat settings first', type: 'error' });
            return;
        }
        setIsLoading(true);
        try {
            await api.admin.uploadQuizQuestions(lessonId, questions);
            onToast({ message: `✅ ${questions.length} questions uploaded!`, type: 'success' });
            onComplete();
        } catch (error) {
            onToast({ message: `Failed to upload questions: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (configLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-[#16a34a]" size={28} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Lesson context */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2 bg-[#16a34a] rounded-lg">
                    <List size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-xs text-gray-500">Adding questions for</p>
                    <p className="font-bold text-gray-900 text-sm">{lessonTitle}</p>
                </div>
            </div>

            {/* Config status or form */}
            {showConfigForm ? (
                <QuizConfigForm
                    lessonId={lessonId}
                    existingConfig={quizConfig}
                    onToast={onToast}
                    onComplete={() => { setShowConfigForm(false); loadConfig(); }}
                />
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                    {quizConfig ? (
                        <>
                            <div className="flex items-center gap-2 text-sm text-[#16a34a] font-semibold">
                                <CheckCircle size={16} />
                                Anti-cheat configured — Pool: {quizConfig.total_questions_in_pool}q, Per quiz: {quizConfig.questions_per_quiz}q, Reward: {quizConfig.token_reward} $READS
                            </div>
                            <button
                                onClick={() => setShowConfigForm(true)}
                                className="text-xs text-gray-500 hover:text-[#16a34a] underline"
                            >
                                Edit
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold">
                                <AlertCircle size={16} />
                                Anti-cheat settings not configured yet
                            </div>
                            <button
                                onClick={() => setShowConfigForm(true)}
                                className="text-xs font-semibold text-white bg-[#f97316] px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Configure
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Questions form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {questions.map((q, qIdx) => (
                    <div
                        key={qIdx}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-[#16a34a] bg-green-50 px-3 py-1 rounded-full">
                                Question {qIdx + 1}
                            </span>
                            {questions.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIdx)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div>
                            <label className={LABEL_CLS}>Question Text</label>
                            <textarea
                                value={q.question_text}
                                onChange={e => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                                required
                                rows={3}
                                className={`${INPUT_CLS} resize-none`}
                                placeholder="Enter your question..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {q.options.map((option, oIdx) => (
                                <div key={oIdx}>
                                    <label className={LABEL_CLS}>Option {getOptionLetter(oIdx)}</label>
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                                        required
                                        className={INPUT_CLS}
                                        placeholder={`Option ${getOptionLetter(oIdx)}`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLS}>Correct Answer</label>
                                <select
                                    value={q.correct_option}
                                    onChange={e => handleQuestionChange(qIdx, 'correct_option', e.target.value)}
                                    className={INPUT_CLS}
                                >
                                    {['A', 'B', 'C', 'D'].map(letter => (
                                        <option key={letter} value={letter}>{letter}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={LABEL_CLS}>Explanation <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input
                                    type="text"
                                    value={q.explanation}
                                    onChange={e => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                                    className={INPUT_CLS}
                                    placeholder="Why is this the correct answer?"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-green-300 text-[#16a34a] font-semibold text-sm rounded-xl hover:bg-green-50 transition-colors"
                    >
                        <Plus size={16} /> Add Question
                    </button>

                    <button
                        type="submit"
                        disabled={isLoading || !quizConfig}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#16a34a] text-white font-semibold text-sm rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isLoading ? (
                            <><RefreshCw size={16} className="animate-spin" /> Uploading…</>
                        ) : (
                            <><CheckCircle size={16} /> Save Quiz ({questions.length}q)</>
                        )}
                    </button>
                </div>

                {!quizConfig && (
                    <p className="text-sm text-amber-600 text-center bg-amber-50 border border-amber-100 rounded-xl py-3">
                        ⚠️ Configure anti-cheat settings above before saving questions
                    </p>
                )}
            </form>
        </div>
    );
};

export default QuizCreationForm;
