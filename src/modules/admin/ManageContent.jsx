import { useState, useEffect, useCallback } from 'react';
import { BookOpen, RefreshCw, Trash2, ArrowLeft, Video, List } from 'lucide-react';
import { api } from '../../services/api';
import QuizCreationForm from './QuizCreationForm';

const ManageContent = ({ onToast }) => {
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [managingQuiz, setManagingQuiz] = useState(null);

    const fetchLessons = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getAllLessons();
            setLessons(data);
        } catch {
            onToast({ message: 'Failed to load lessons.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => { fetchLessons(); }, [fetchLessons]);

    const handleDeleteLesson = async (lessonId, lessonTitle) => {
        if (!window.confirm(`Delete "${lessonTitle}"? This cannot be undone.`)) return;
        try {
            await api.admin.deleteLesson(lessonId);
            onToast({ message: `✅ "${lessonTitle}" deleted`, type: 'success' });
            fetchLessons();
        } catch (error) {
            onToast({ message: `Failed to delete: ${error.message}`, type: 'error' });
        }
    };

    if (managingQuiz) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setManagingQuiz(null)}
                    className="flex items-center gap-2 text-sm font-semibold text-[#16a34a] hover:text-green-700 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Lesson List
                </button>
                <QuizCreationForm
                    lessonId={managingQuiz.id}
                    lessonTitle={managingQuiz.title}
                    onComplete={() => { setManagingQuiz(null); fetchLessons(); }}
                    onToast={onToast}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <RefreshCw className="animate-spin text-[#16a34a]" size={28} />
                <p className="text-sm text-gray-500">Loading lessons…</p>
            </div>
        );
    }

    const groupedLessons = lessons.reduce((acc, lesson) => {
        if (!acc[lesson.category]) acc[lesson.category] = [];
        acc[lesson.category].push(lesson);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 rounded-xl">
                        <BookOpen size={20} className="text-[#16a34a]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Manage Lessons</h3>
                        <p className="text-xs text-gray-500">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total</p>
                    </div>
                </div>
                <button
                    onClick={fetchLessons}
                    className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {lessons.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No lessons yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first lesson in the "Create Lesson" tab</p>
                </div>
            ) : (
                Object.keys(groupedLessons).map(category => (
                    <div key={category} className="space-y-3">
                        {/* Category header */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-700">{category}</span>
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400">{groupedLessons[category].length} lesson{groupedLessons[category].length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedLessons[category]
                                .sort((a, b) => a.order_index - b.order_index)
                                .map(lesson => (
                                    <div
                                        key={lesson.id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-gray-900 text-sm leading-tight mb-1 truncate">
                                                    {lesson.title}
                                                </h5>
                                                <p className="text-xs text-gray-400">Order: {lesson.order_index}</p>
                                            </div>
                                        </div>

                                        {lesson.video_url && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#16a34a] mb-3 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                                <Video size={12} />
                                                <span>Video included</span>
                                            </div>
                                        )}

                                        {lesson.quiz_count > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#f97316] mb-3 bg-orange-50 px-2 py-1 rounded-lg w-fit">
                                                <List size={12} />
                                                <span>{lesson.quiz_count} question{lesson.quiz_count !== 1 ? 's' : ''}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => setManagingQuiz({ id: lesson.id, title: lesson.title })}
                                                className="flex-1 py-2 px-3 bg-green-50 text-[#16a34a] border border-green-200 rounded-xl hover:bg-[#16a34a] hover:text-white transition-all text-xs font-semibold"
                                            >
                                                Manage Quiz
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                                className="p-2 bg-red-50 text-red-500 border border-red-200 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ManageContent;
