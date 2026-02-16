import { useState } from 'react';
import { Shield, RefreshCw, Save } from 'lucide-react';
import { api } from '../../services/api';

const INPUT_CLS =
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all text-sm';

const LABEL_CLS = 'block text-sm font-semibold text-gray-700 mb-1.5';

const CONFIG_FIELDS = [
    { name: 'total_questions_in_pool', label: 'Total Questions in Pool', emoji: '📚', hint: 'Total questions you will upload' },
    { name: 'questions_per_quiz',      label: 'Questions Per Quiz',      emoji: '🎲', hint: 'Random questions shown per attempt' },
    { name: 'token_reward',            label: 'Token Reward ($READS)',   emoji: '💰', hint: 'Tokens awarded on passing', step: 10 },
    { name: 'passing_score',           label: 'Passing Score (%)',       emoji: '🎯', hint: 'Minimum % to earn tokens', max: 100 },
    { name: 'cooldown_seconds',        label: 'Cooldown (seconds)',      emoji: '⏳', hint: 'Wait time before retake' },
    { name: 'min_read_time_seconds',   label: 'Min Read Time (seconds)', emoji: '📖', hint: 'Minimum lesson read time' },
    { name: 'min_time_per_question',   label: 'Min Time Per Question',   emoji: '⏱️', hint: 'Seconds per question minimum' },
];

const QuizConfigForm = ({ lessonId, existingConfig, onToast, onComplete }) => {
    const [config, setConfig] = useState({
        total_questions_in_pool: existingConfig?.total_questions_in_pool || 10,
        questions_per_quiz:      existingConfig?.questions_per_quiz      || 5,
        token_reward:            existingConfig?.token_reward            || 100,
        passing_score:           existingConfig?.passing_score           || 70,
        cooldown_seconds:        existingConfig?.cooldown_seconds        || 30,
        min_read_time_seconds:   existingConfig?.min_read_time_seconds   || 60,
        min_time_per_question:   existingConfig?.min_time_per_question   || 5,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (config.questions_per_quiz > config.total_questions_in_pool) {
            onToast({ message: 'Questions per quiz cannot exceed total questions in pool', type: 'error' });
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2.5 bg-orange-50 rounded-xl">
                    <Shield size={20} className="text-[#f97316]" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Anti-Cheat Configuration</h4>
                    <p className="text-xs text-gray-500">
                        {existingConfig ? 'Update existing configuration' : 'Set up quiz protection settings'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CONFIG_FIELDS.map(({ name, label, emoji, hint, step, max }) => (
                        <div key={name}>
                            <label className={LABEL_CLS}>{emoji} {label}</label>
                            <input
                                type="number"
                                name={name}
                                value={config[name]}
                                onChange={handleChange}
                                min="1"
                                step={step || 1}
                                max={max}
                                required
                                className={INPUT_CLS}
                            />
                            <p className="text-xs text-gray-400 mt-1">{hint}</p>
                        </div>
                    ))}
                </div>

                {/* Info banner */}
                <div className="flex gap-3 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                    <Shield size={18} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                    <p>Questions are randomly selected from the pool each attempt, making answer-sharing ineffective.</p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#16a34a] text-white font-semibold rounded-xl shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <><RefreshCw size={18} className="animate-spin" /> Saving…</>
                    ) : (
                        <><Save size={18} /> {existingConfig ? 'Update Configuration' : 'Save Configuration'}</>
                    )}
                </button>
            </form>
        </div>
    );
};

export default QuizConfigForm;
