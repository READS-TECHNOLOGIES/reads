import { useState } from 'react';
import { Plus, RefreshCw, BookOpen } from 'lucide-react';
import { api } from '../../services/api';

const INPUT_CLS =
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all text-sm';

const LABEL_CLS = 'block text-sm font-semibold text-gray-700 mb-1.5';

const LessonCreateForm = ({ onToast, onSuccess }) => {
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        content: '',
        video_url: '',
        order_index: 0,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'order_index' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category.trim() || !formData.title.trim() || !formData.content.trim()) {
            onToast({ message: 'Please fill in all required fields', type: 'error' });
            return;
        }
        setIsLoading(true);
        try {
            await api.admin.createLesson(formData);
            onToast({ message: '✅ Lesson created successfully!', type: 'success' });
            setFormData({ category: '', title: '', content: '', video_url: '', order_index: 0 });
            if (onSuccess) onSuccess();
        } catch (error) {
            onToast({ message: `Failed to create lesson: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2.5 bg-green-50 rounded-xl">
                    <BookOpen size={20} className="text-[#16a34a]" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Create New Lesson</h3>
                    <p className="text-xs text-gray-500">Add a new lesson to the platform</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL_CLS}>
                            Category <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className={INPUT_CLS}
                            placeholder="e.g., JAMB Mathematics"
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>
                            Order Index <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="order_index"
                            value={formData.order_index}
                            onChange={handleChange}
                            required
                            className={INPUT_CLS}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div>
                    <label className={LABEL_CLS}>
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className={INPUT_CLS}
                        placeholder="Lesson Title"
                    />
                </div>

                <div>
                    <label className={LABEL_CLS}>Video URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                        type="url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleChange}
                        className={INPUT_CLS}
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                </div>

                <div>
                    <label className={LABEL_CLS}>
                        Content <span className="text-red-500">*</span>
                        <span className="text-gray-400 font-normal ml-1">(Markdown / HTML)</span>
                    </label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        rows={10}
                        className={`${INPUT_CLS} resize-none font-mono`}
                        placeholder="Enter the lesson content here..."
                    />
                    <p className="text-xs text-gray-400 mt-1">Supports Markdown and HTML formatting</p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#16a34a] text-white font-semibold rounded-xl shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <><RefreshCw size={18} className="animate-spin" /> Creating Lesson…</>
                    ) : (
                        <><Plus size={18} /> Create Lesson</>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LessonCreateForm;
