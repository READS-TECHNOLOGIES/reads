import React, { useState } from 'react';
import { 
    Sparkles, FileText, HelpCircle, TrendingUp, CheckCircle, 
    AlertCircle, RefreshCw, Copy, Download, Wand2, Brain, 
    ListChecks, Lightbulb, Shield
} from 'lucide-react';
import { api } from '../../services/api';

// ====================================================================
// --- AI Content Assistant Component ---
// ====================================================================

const AIContentAssistant = ({ onToast }) => {
    const [activeFeature, setActiveFeature] = useState('generate-lesson');
    const [isLoading, setIsLoading] = useState(false);

    const features = [
        { id: 'generate-lesson', name: 'Generate Lesson', icon: FileText },
        { id: 'generate-quiz', name: 'Generate Quiz', icon: HelpCircle },
        { id: 'improve-content', name: 'Improve Content', icon: TrendingUp },
        { id: 'suggest-topics', name: 'Suggest Topics', icon: Lightbulb },
        { id: 'quality-check', name: 'Quality Check', icon: Shield },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-cyan pb-4">
                <div className="flex items-center space-x-3">
                    <Sparkles size={32} className="text-cyan" />
                    <div>
                        <h2 className="text-3xl font-bold text-white">AI Content Assistant</h2>
                        <p className="text-sm text-card-muted mt-1">
                            Powered by Claude AI • Generate and improve educational content
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 bg-cyan/20 px-4 py-2 rounded-lg border-2 border-cyan">
                    <Brain size={20} className="text-cyan" />
                    <span className="text-sm font-semibold text-cyan">Claude Sonnet 4</span>
                </div>
            </div>

            {/* Feature Selection Tabs */}
            <div className="flex border-b-2 border-cyan overflow-x-auto">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <button
                            key={feature.id}
                            onClick={() => setActiveFeature(feature.id)}
                            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                                ${activeFeature === feature.id
                                    ? 'border-cyan text-cyan'
                                    : 'border-transparent text-gray-500 dark:text-card-muted hover:text-cyan'
                                }`}
                        >
                            <Icon size={18} className="mr-2" />
                            {feature.name}
                        </button>
                    );
                })}
            </div>

            {/* Feature Content */}
            <div className="py-4">
                {activeFeature === 'generate-lesson' && (
                    <GenerateLessonForm onToast={onToast} isLoading={isLoading} setIsLoading={setIsLoading} />
                )}
                {activeFeature === 'generate-quiz' && (
                    <GenerateQuizForm onToast={onToast} isLoading={isLoading} setIsLoading={setIsLoading} />
                )}
                {activeFeature === 'improve-content' && (
                    <ImproveContentForm onToast={onToast} isLoading={isLoading} setIsLoading={setIsLoading} />
                )}
                {activeFeature === 'suggest-topics' && (
                    <SuggestTopicsForm onToast={onToast} isLoading={isLoading} setIsLoading={setIsLoading} />
                )}
                {activeFeature === 'quality-check' && (
                    <QualityCheckForm onToast={onToast} isLoading={isLoading} setIsLoading={setIsLoading} />
                )}
            </div>
        </div>
    );
};

// ====================================================================
// --- Generate Lesson Form ---
// ====================================================================

const GenerateLessonForm = ({ onToast, isLoading, setIsLoading }) => {
    const [formData, setFormData] = useState({
        topic: '',
        category: 'JAMB',
        difficulty: 'intermediate',
        target_length: 1000,
    });
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiGenerateLessonContent({
                topic: formData.topic,
                category: formData.category,
                difficulty: formData.difficulty,
                target_length: parseInt(formData.target_length),
            });
            setResult(response);
            onToast({ message: 'Lesson content generated successfully!', type: 'success' });
        } catch (error) {
            onToast({ message: `Failed to generate lesson: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        onToast({ message: 'Copied to clipboard!', type: 'success' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <FileText size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Generate Lesson Content</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Create comprehensive lesson content from a topic. The AI will generate structured, educational material ready to use.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Topic / Subject</label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Photosynthesis in Plants"
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                            >
                                <option value="JAMB">JAMB</option>
                                <option value="WAEC">WAEC</option>
                                <option value="NECO">NECO</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Difficulty Level</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Target Word Count</label>
                            <input
                                type="number"
                                name="target_length"
                                value={formData.target_length}
                                onChange={handleChange}
                                min="500"
                                max="5000"
                                step="100"
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 flex items-center justify-center border-2 border-cyan transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin mr-2" />
                                Running Quality Check...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} className="mr-2" />
                                Check Quality
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Result Display */}
            {result && (
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan space-y-4">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Shield size={20} className="mr-2 text-cyan" />
                        Quality Report
                    </h4>

                    {/* Overall Score */}
                    {result.overall_score !== undefined && (
                        <div className="bg-black/20 p-4 rounded-lg border border-cyan-light">
                            <div className="flex items-center justify-between">
                                <span className="text-card-muted">Overall Quality Score</span>
                                <span className={`text-2xl font-bold ${
                                    result.overall_score >= 80 ? 'text-green-500' :
                                    result.overall_score >= 60 ? 'text-yellow-500' :
                                    'text-red-500'
                                }`}>
                                    {result.overall_score}/100
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Issues Found */}
                    {result.issues && result.issues.length > 0 && (
                        <div className="space-y-2">
                            <h5 className="font-semibold text-white flex items-center">
                                <AlertCircle size={18} className="mr-2 text-yellow-500" />
                                Issues Found ({result.issues.length})
                            </h5>
                            {result.issues.map((issue, idx) => (
                                <div key={idx} className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500">
                                    <p className="text-sm text-yellow-300">{issue}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggestions */}
                    {result.suggestions && result.suggestions.length > 0 && (
                        <div className="space-y-2">
                            <h5 className="font-semibold text-white flex items-center">
                                <CheckCircle size={18} className="mr-2 text-cyan" />
                                Improvement Suggestions ({result.suggestions.length})
                            </h5>
                            {result.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="bg-cyan/10 p-3 rounded-lg border border-cyan">
                                    <p className="text-sm text-cyan">{suggestion}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    {result.summary && (
                        <div className="bg-black/20 p-4 rounded-lg border border-cyan-light">
                            <h5 className="font-semibold text-white mb-2">Summary</h5>
                            <p className="text-sm text-card-muted">{result.summary}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ====================================================================
// --- Reusable Result Card Component ---
// ====================================================================

const ResultCard = ({ title, data, onCopy, fields }) => {
    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white flex items-center">
                    <CheckCircle size={20} className="mr-2 text-green-500" />
                    {title}
                </h4>
            </div>
            <div className="space-y-4">
                {fields.map((field, idx) => (
                    <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-card-muted">{field.label}</label>
                            <button
                                onClick={() => onCopy(data[field.key])}
                                className="px-3 py-1 text-xs bg-cyan/20 text-cyan border border-cyan rounded hover:bg-cyan hover:text-white transition-all flex items-center"
                            >
                                <Copy size={14} className="mr-1" />
                                Copy
                            </button>
                        </div>
                        {field.multiline ? (
                            <div className="bg-black/20 p-4 rounded-lg border border-cyan-light max-h-[400px] overflow-y-auto">
                                <pre className="text-sm text-white whitespace-pre-wrap font-sans">
                                    {data[field.key]}
                                </pre>
                            </div>
                        ) : (
                            <div className="bg-black/20 p-3 rounded-lg border border-cyan-light">
                                <p className="text-sm text-white">{data[field.key]}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIContentAssistant;-50 flex items-center justify-center border-2 border-cyan transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin mr-2" />
                                Generating with AI...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} className="mr-2" />
                                Generate Lesson
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Result Display */}
            {result && (
                <ResultCard
                    title="Generated Lesson Content"
                    data={result}
                    onCopy={copyToClipboard}
                    fields={[
                        { label: 'Title', key: 'title' },
                        { label: 'Content', key: 'content', multiline: true },
                    ]}
                />
            )}
        </div>
    );
};

// ====================================================================
// --- Generate Quiz Form ---
// ====================================================================

const GenerateQuizForm = ({ onToast, isLoading, setIsLoading }) => {
    const [formData, setFormData] = useState({
        lesson_content: '',
        num_questions: 10,
        difficulty: 'intermediate',
    });
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiGenerateQuizQuestions({
                lesson_content: formData.lesson_content,
                num_questions: parseInt(formData.num_questions),
                difficulty: formData.difficulty,
            });
            setResult(response);
            onToast({ message: 'Quiz questions generated successfully!', type: 'success' });
        } catch (error) {
            onToast({ message: `Failed to generate quiz: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(JSON.stringify(text, null, 2));
        onToast({ message: 'Quiz copied to clipboard!', type: 'success' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <HelpCircle size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Generate Quiz Questions</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Automatically create quiz questions from lesson content. Perfect for testing comprehension.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Lesson Content</label>
                        <textarea
                            name="lesson_content"
                            value={formData.lesson_content}
                            onChange={handleChange}
                            required
                            rows="10"
                            placeholder="Paste your lesson content here..."
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Number of Questions</label>
                            <input
                                type="number"
                                name="num_questions"
                                value={formData.num_questions}
                                onChange={handleChange}
                                min="3"
                                max="20"
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Difficulty Level</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 flex items-center justify-center border-2 border-cyan transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin mr-2" />
                                Generating Quiz...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} className="mr-2" />
                                Generate Quiz
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Result Display */}
            {result && result.questions && (
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white flex items-center">
                            <ListChecks size={20} className="mr-2 text-cyan" />
                            Generated Questions ({result.questions.length})
                        </h4>
                        <button
                            onClick={() => copyToClipboard(result.questions)}
                            className="px-4 py-2 bg-cyan/20 text-cyan border-2 border-cyan rounded-lg hover:bg-cyan hover:text-white transition-all flex items-center"
                        >
                            <Copy size={16} className="mr-2" />
                            Copy All
                        </button>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {result.questions.map((q, idx) => (
                            <div key={idx} className="bg-black/20 p-4 rounded-lg border border-cyan-light">
                                <p className="font-semibold text-white mb-2">Q{idx + 1}: {q.question}</p>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {q.options.map((opt, optIdx) => (
                                        <div
                                            key={optIdx}
                                            className={`p-2 rounded text-sm ${
                                                q.correct_option === String.fromCharCode(65 + optIdx)
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500'
                                                    : 'bg-black/20 text-card-muted'
                                            }`}
                                        >
                                            {String.fromCharCode(65 + optIdx)}: {opt}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-green-400">✓ Correct: {q.correct_option}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ====================================================================
// --- Improve Content Form ---
// ====================================================================

const ImproveContentForm = ({ onToast, isLoading, setIsLoading }) => {
    const [formData, setFormData] = useState({
        content: '',
        instruction: 'Make it more detailed and add examples',
    });
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiImproveContent({
                content: formData.content,
                instruction: formData.instruction,
            });
            setResult(response);
            onToast({ message: 'Content improved successfully!', type: 'success' });
        } catch (error) {
            onToast({ message: `Failed to improve content: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        onToast({ message: 'Copied to clipboard!', type: 'success' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Improve Content</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Enhance existing content with AI. Add details, simplify language, or restructure for better clarity.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Current Content</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            rows="8"
                            placeholder="Paste the content you want to improve..."
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Improvement Instructions</label>
                        <input
                            type="text"
                            name="instruction"
                            value={formData.instruction}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Make it more concise, Add more examples, Simplify the language"
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none"
                        />
                        <p className="text-xs text-card-muted mt-1">
                            Examples: "Add real-world examples", "Make it suitable for beginners", "Expand with more details"
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 flex items-center justify-center border-2 border-cyan transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin mr-2" />
                                Improving Content...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} className="mr-2" />
                                Improve Content
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Result Display */}
            {result && (
                <ResultCard
                    title="Improved Content"
                    data={result}
                    onCopy={copyToClipboard}
                    fields={[
                        { label: 'Improved Content', key: 'improved_content', multiline: true },
                        { label: 'Changes Made', key: 'explanation' },
                    ]}
                />
            )}
        </div>
    );
};

// ====================================================================
// --- Suggest Topics Form ---
// ====================================================================

const SuggestTopicsForm = ({ onToast, isLoading, setIsLoading }) => {
    const [formData, setFormData] = useState({
        topic: '',
        category: 'JAMB',
        num_suggestions: 5,
    });
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiSuggestRelatedTopics({
                topic: formData.topic,
                category: formData.category,
                num_suggestions: parseInt(formData.num_suggestions),
            });
            setResult(response);
            onToast({ message: 'Topic suggestions generated!', type: 'success' });
        } catch (error) {
            onToast({ message: `Failed to suggest topics: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Suggest Related Topics</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Get AI-powered suggestions for related topics to expand your content library.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Current Topic</label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Photosynthesis"
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Category Context</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                            >
                                <option value="JAMB">JAMB</option>
                                <option value="WAEC">WAEC</option>
                                <option value="NECO">NECO</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-muted mb-2">Number of Suggestions</label>
                            <input
                                type="number"
                                name="num_suggestions"
                                value={formData.num_suggestions}
                                onChange={handleChange}
                                min="3"
                                max="10"
                                className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 flex items-center justify-center border-2 border-cyan transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin mr-2" />
                                Generating Suggestions...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} className="mr-2" />
                                Get Suggestions
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Result Display */}
            {result && result.suggestions && (
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Lightbulb size={20} className="mr-2 text-cyan" />
                        Suggested Topics ({result.suggestions.length})
                    </h4>
                    <div className="space-y-3">
                        {result.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="bg-black/20 p-4 rounded-lg border border-cyan-light hover:border-cyan transition-all">
                                <h5 className="font-semibold text-white mb-1">{suggestion.title}</h5>
                                <p className="text-sm text-card-muted">{suggestion.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ====================================================================
// --- Quality Check Form ---
// ====================================================================

const QualityCheckForm = ({ onToast, isLoading, setIsLoading }) => {
    const [formData, setFormData] = useState({
        content: '',
        content_type: 'lesson',
    });
    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiQualityCheckContent({
                content: formData.content,
                content_type: formData.content_type,
            });
            setResult(response);
            onToast({ message: 'Quality check completed!', type: 'success' });
        } catch (error) {
            onToast({ message: `Quality check failed: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <Shield size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Quality Check Content</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Check your content for grammar errors, factual accuracy, and clarity improvements.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Content to Check</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            rows="10"
                            placeholder="Paste your content here for quality checking..."
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">Content Type</label>
                        <select
                            name="content_type"
                            value={formData.content_type}
                            onChange={handleChange}
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white focus:border-cyan outline-none"
                        >
                            <option value="lesson">Lesson Content</option>
                            <option value="quiz">Quiz Questions</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity