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
        { id: 'generate-lesson', name: 'Generate Lesson', icon: FileText, description: 'Create full lesson content from a topic' },
        { id: 'generate-quiz', name: 'Generate Quiz', icon: HelpCircle, description: 'Auto-generate quiz questions' },
        { id: 'improve-content', name: 'Improve Content', icon: TrendingUp, description: 'Enhance existing content' },
        { id: 'suggest-topics', name: 'Suggest Topics', icon: Lightbulb, description: 'Get related topic ideas' },
        { id: 'quality-check', name: 'Quality Check', icon: Shield, description: 'Review content quality' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-cyan pb-4">
                <div className="flex items-center space-x-3">
                    <Sparkles size={32} className="text-cyan" />
                    <div>
                        <h2 className="text-3xl font-bold text-white">AI Content Assistant</h2>
                        <p className="text-sm text-card-muted mt-1">
                            Powered by Claude AI • Generate and improve educational content 10x faster
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
                            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeFeature === feature.id
                                    ? 'border-cyan text-cyan'
                                    : 'border-transparent text-gray-500 dark:text-card-muted hover:text-cyan'
                            }`}
                            title={feature.description}
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
        
        if (!formData.topic.trim()) {
            onToast({ message: 'Please enter a topic', type: 'error' });
            return;
        }

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
            onToast({ message: '✅ Lesson content generated successfully!', type: 'success' });
        } catch (error) {
            onToast({ message: `Failed to generate lesson: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        onToast({ message: '📋 Copied to clipboard!', type: 'success' });
    };

    const downloadAsFile = (content, filename) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        onToast({ message: '💾 Downloaded successfully!', type: 'success' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <FileText size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Generate Lesson Content</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Create comprehensive, structured lesson content from any topic. The AI will generate educational material with proper formatting, examples, and explanations.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">
                            Topic / Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Photosynthesis in Plants, Quadratic Equations, Newton's Laws"
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none transition-all"
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
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan transition-all"
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
                    onDownload={downloadAsFile}
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
        
        if (!formData.lesson_content.trim()) {
            onToast({ message: 'Please enter lesson content', type: 'error' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiGenerateQuizQuestions({
                lesson_content: formData.lesson_content,
                num_questions: parseInt(formData.num_questions),
                difficulty: formData.difficulty,
            });
            setResult(response);
            onToast({ message: '✅ Quiz questions generated successfully!', type: 'success' });
        } catch (error) {
            onToast({ message: `Failed to generate quiz: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(JSON.stringify(text, null, 2));
        onToast({ message: '📋 Quiz copied to clipboard!', type: 'success' });
    };

    const downloadAsFile = (questions) => {
        const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quiz_questions.json';
        link.click();
        URL.revokeObjectURL(url);
        onToast({ message: '💾 Quiz downloaded!', type: 'success' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <HelpCircle size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Generate Quiz Questions</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Automatically create multiple-choice quiz questions from lesson content. Perfect for testing comprehension and reinforcing learning.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">
                            Lesson Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="lesson_content"
                            value={formData.lesson_content}
                            onChange={handleChange}
                            required
                            rows="10"
                            placeholder="Paste your lesson content here..."
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none resize-none font-mono text-sm"
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
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan transition-all"
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
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => copyToClipboard(result.questions)}
                                className="px-4 py-2 bg-cyan/20 text-cyan border-2 border-cyan rounded-lg hover:bg-cyan hover:text-white transition-all flex items-center"
                            >
                                <Copy size={16} className="mr-2" />
                                Copy All
                            </button>
                            <button
                                onClick={() => downloadAsFile(result.questions)}
                                className="px-4 py-2 bg-green-500/20 text-green-500 border-2 border-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all flex items-center"
                            >
                                <Download size={16} className="mr-2" />
                                Download JSON
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {result.questions.map((q, idx) => (
                            <div key={idx} className="bg-black/20 p-4 rounded-lg border border-cyan-light hover:border-cyan transition-all">
                                <p className="font-semibold text-white mb-3">Q{idx + 1}: {q.question}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                    {q.options.map((opt, optIdx) => (
                                        <div
                                            key={optIdx}
                                            className={`p-3 rounded text-sm transition-all ${
                                                q.correct_option === String.fromCharCode(65 + optIdx)
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500 font-semibold'
                                                    : 'bg-black/20 text-card-muted border border-cyan-light'
                                            }`}
                                        >
                                            <span className="font-bold">{String.fromCharCode(65 + optIdx)}:</span> {opt}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-green-400 flex items-center">
                                    <CheckCircle size={14} className="mr-1" />
                                    Correct: {q.correct_option}
                                </p>
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

    const quickInstructions = [
        'Make it more detailed and add examples',
        'Simplify the language for beginners',
        'Add real-world applications',
        'Make it more concise',
        'Improve clarity and structure',
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.content.trim() || !formData.instruction.trim()) {
            onToast({ message: 'Please fill in all fields', type: 'error' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiImproveContent({
                content: formData.content,
                instruction: formData.instruction,
            });
            setResult(response);
            onToast({ message: '✅ Content improved successfully!', type: 'success' });
        } catch (error) {
            onToast({ message: `Failed to improve content: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        onToast({ message: '📋 Copied to clipboard!', type: 'success' });
    };

    const downloadAsFile = (content, filename) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        onToast({ message: '💾 Downloaded successfully!', type: 'success' });
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Improve Content</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Enhance existing content with AI. Add details, simplify language, restructure for clarity, or adapt for different audiences.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">
                            Current Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            rows="8"
                            placeholder="Paste the content you want to improve..."
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none resize-none font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">
                            Improvement Instructions <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="instruction"
                            value={formData.instruction}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Make it more concise, Add more examples, Simplify the language"
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {quickInstructions.map((instr, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, instruction: instr }))}
                                    className="text-xs px-3 py-1 bg-cyan/20 text-cyan border border-cyan rounded-full hover:bg-cyan hover:text-white transition-all"
                                >
                                    {instr}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan transition-all"
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
                    onDownload={downloadAsFile}
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
        
        if (!formData.topic.trim()) {
            onToast({ message: 'Please enter a topic', type: 'error' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiSuggestRelatedTopics({
                topic: formData.topic,
                category: formData.category,
                num_suggestions: parseInt(formData.num_suggestions),
            });
            setResult(response);
            onToast({ message: '✅ Topic suggestions generated!', type: 'success' });
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
                    Get AI-powered suggestions for related topics to expand your content library and create comprehensive learning paths.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">
                            Current Topic <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Photosynthesis, Quadratic Equations, Newton's Laws"
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
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan transition-all"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="bg-black/20 p-4 rounded-lg border border-cyan-light hover:border-cyan transition-all group cursor-pointer">
                                <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-semibold text-white group-hover:text-cyan transition-colors">{suggestion.title}</h5>
                                    <span className="text-xs bg-cyan/20 text-cyan px-2 py-1 rounded-full">{idx + 1}</span>
                                </div>
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
        
        if (!formData.content.trim()) {
            onToast({ message: 'Please enter content to check', type: 'error' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await api.admin.aiQualityCheckContent({
                content: formData.content,
                content_type: formData.content_type,
            });
            setResult(response);
            onToast({ message: '✅ Quality check completed!', type: 'success' });
        } catch (error) {
            onToast({ message: `Quality check failed: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-500/20 border-green-500';
        if (score >= 60) return 'bg-yellow-500/20 border-yellow-500';
        return 'bg-red-500/20 border-red-500';
    };

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border-2 border-cyan">
                <div className="flex items-center space-x-2 mb-4">
                    <Shield size={24} className="text-cyan" />
                    <h3 className="text-xl font-bold text-white">Quality Check Content</h3>
                </div>
                <p className="text-sm text-card-muted mb-6">
                    Check your content for grammar errors, factual accuracy, clarity, and educational value. Get actionable suggestions for improvement.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-muted mb-2">
                            Content to Check <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            rows="10"
                            placeholder="Paste your content here for quality checking..."
                            className="w-full p-3 border-2 border-cyan-light bg-black/20 rounded-lg text-white placeholder-card-muted focus:border-cyan outline-none resize-none font-mono text-sm"
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
                        className="w-full py-3 bg-cyan text-white font-semibold rounded-lg hover:bg-primary-cyan-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-cyan transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin mr-2" />
                                Running Quality Check...
                            </>
                        ) : (
                            <>
                                <Shield size={20} className="mr-2" />
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
                        <div className={`p-6 rounded-lg border-2 ${getScoreBg(result.overall_score)}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-card-muted mb-1">Overall Quality Score</p>
                                    <p className={`text-4xl font-bold ${getScoreColor(result.overall_score)}`}>
                                        {result.overall_score}/100
                                    </p>
                                </div>
                                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
                                    result.overall_score >= 80 ? 'border-green-500' :
                                    result.overall_score >= 60 ? 'border-yellow-500' :
                                    'border-red-500'
                                }`}>
                                    <span className={`text-2xl font-bold ${getScoreColor(result.overall_score)}`}>
                                        {result.overall_score >= 80 ? '✓' :
                                         result.overall_score >= 60 ? '!' :
                                         '✗'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Issues Found */}
                    {result.issues && result.issues.length > 0 && (
                        <div className="space-y-2">
                            <h5 className="font-semibold text-white flex items-center">
                                <AlertCircle size={18} className="mr-2 text-red-500" />
                                Issues Found ({result.issues.length})
                            </h5>
                            <div className="space-y-2">
                                {result.issues.map((issue, idx) => (
                                    <div key={idx} className="bg-red-500/10 p-3 rounded-lg border border-red-500 flex items-start space-x-2">
                                        <span className="text-red-500 font-bold text-xs mt-0.5">{idx + 1}</span>
                                        <p className="text-sm text-red-300 flex-1">{issue}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggestions */}
                    {result.suggestions && result.suggestions.length > 0 && (
                        <div className="space-y-2">
                            <h5 className="font-semibold text-white flex items-center">
                                <CheckCircle size={18} className="mr-2 text-cyan" />
                                Improvement Suggestions ({result.suggestions.length})
                            </h5>
                            <div className="space-y-2">
                                {result.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="bg-cyan/10 p-3 rounded-lg border border-cyan flex items-start space-x-2">
                                        <span className="text-cyan font-bold text-xs mt-0.5">{idx + 1}</span>
                                        <p className="text-sm text-cyan flex-1">{suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {result.summary && (
                        <div className="bg-black/20 p-4 rounded-lg border border-cyan-light">
                            <h5 className="font-semibold text-white mb-2 flex items-center">
                                <FileText size={18} className="mr-2 text-cyan" />
                                Summary
                            </h5>
                            <p className="text-sm text-card-muted leading-relaxed">{result.summary}</p>
                        </div>
                    )}

                    {/* No Issues */}
                    {(!result.issues || result.issues.length === 0) && result.overall_score >= 80 && (
                        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500 text-center">
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                            <p className="text-green-300 font-semibold">✅ Excellent! No major issues found.</p>
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

const ResultCard = ({ title, data, onCopy, onDownload, fields }) => {
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
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onCopy(data[field.key])}
                                    className="px-3 py-1 text-xs bg-cyan/20 text-cyan border border-cyan rounded hover:bg-cyan hover:text-white transition-all flex items-center"
                                >
                                    <Copy size={14} className="mr-1" />
                                    Copy
                                </button>
                                {onDownload && field.multiline && (
                                    <button
                                        onClick={() => onDownload(data[field.key], `${field.label.toLowerCase().replace(/\s+/g, '_')}.txt`)}
                                        className="px-3 py-1 text-xs bg-green-500/20 text-green-500 border border-green-500 rounded hover:bg-green-500 hover:text-white transition-all flex items-center"
                                    >
                                        <Download size={14} className="mr-1" />
                                        Download
                                    </button>
                                )}
                            </div>
                        </div>
                        {field.multiline ? (
                            <div className="bg-black/20 p-4 rounded-lg border border-cyan-light max-h-[400px] overflow-y-auto">
                                <pre className="text-sm text-white whitespace-pre-wrap font-sans leading-relaxed">
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

export default AIContentAssistant;