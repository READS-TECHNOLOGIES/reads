import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Clock, Shield, AlertTriangle, Award } from 'lucide-react';

// Simple Loading Spinner
const SimpleLoadingSpinner = () => (
    <div className="flex justify-center items-center h-full p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-gray-500 dark:text-gray-400">Loading Content...</p>
    </div>
);

const LessonDetail = ({ lessonId, onNavigate }) => {
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quizStatus, setQuizStatus] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(false);
    
    // 🆕 TIME TRACKING STATE
    const [readTime, setReadTime] = useState(0);
    const [isTracking, setIsTracking] = useState(true);
    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);

    // Fetch lesson data
    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                if (!lessonId) {
                    console.error("LessonDetail: No lesson ID provided.");
                    setLoading(false);
                    return;
                }
                
                const data = await api.learn.getLessonDetail(lessonId); 
                setLesson(data);
            } catch (err) {
                console.error("Error fetching lesson:", err);
                setLesson(null); 
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId]);

    // 🆕 TIME TRACKING - Start tracking when component mounts
    useEffect(() => {
        if (!lesson) return;

        // Start tracking read time
        startTimeRef.current = Date.now();
        setIsTracking(true);
        
        intervalRef.current = setInterval(() => {
            if (startTimeRef.current && isTracking) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setReadTime(elapsed);
            }
        }, 1000);

        // Track visibility changes (user switching tabs)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User left the tab, pause tracking
                setIsTracking(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            } else {
                // User returned, resume tracking
                setIsTracking(true);
                startTimeRef.current = Date.now() - (readTime * 1000);
                intervalRef.current = setInterval(() => {
                    if (startTimeRef.current) {
                        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                        setReadTime(elapsed);
                    }
                }, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            
            // Save final read time when leaving
            if (startTimeRef.current && lessonId) {
                const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
                api.learn.trackLessonTime(lessonId, finalTime).catch(err => {
                    console.warn('Failed to track lesson time:', err);
                });
            }
        };
    }, [lesson, lessonId, readTime, isTracking]);

    // 🆕 Check quiz status before allowing start
    const handleStartQuiz = async () => {
        setCheckingStatus(true);
        
        try {
            // Save final read time
            if (startTimeRef.current) {
                const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
                await api.learn.trackLessonTime(lessonId, finalTime);
            }

            // Check if user can take quiz
            const status = await api.learn.checkQuizStatus(lessonId);
            
            if (!status.can_attempt) {
                // Show error message
                let errorMsg = status.reason || 'Cannot start quiz at this time';
                
                if (status.cooldown_remaining) {
                    errorMsg += `\n\nCooldown: ${status.cooldown_remaining} seconds remaining`;
                }
                
                if (status.hourly_attempts_remaining !== undefined) {
                    errorMsg += `\n\nHourly attempts remaining: ${status.hourly_attempts_remaining}`;
                }
                
                if (status.daily_attempts_remaining !== undefined) {
                    errorMsg += `\n\nDaily attempts remaining: ${status.daily_attempts_remaining}`;
                }
                
                alert(errorMsg);
                setCheckingStatus(false);
                return;
            }

            // Navigate to quiz
            onNavigate('learn', 'quiz', { 
                lessonId: lesson.id, 
                lessonTitle: lesson.title,
                category: lesson.category 
            });
            
        } catch (err) {
            console.error('Error checking quiz status:', err);
            alert('Failed to start quiz. Please try again.');
        } finally {
            setCheckingStatus(false);
        }
    };

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get YouTube embed URL
    const getEmbedUrl = (url) => {
        if (!url) return null;
        if (url.includes('youtube.com/watch?v=')) {
            const match = url.match(/[?&]v=([^&]+)/);
            return match ? match[1] : null;
        }
        if (url.includes('youtu.be/')) {
            return url.split('youtu.be/')[1].split('?')[0];
        }
        return url; // Assume it's just the ID
    };

    // --- RENDER CHECKS ---
    if (loading) {
        return <SimpleLoadingSpinner />;
    }

    if (!lesson) {
        return (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500 rounded-xl">
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Lesson Not Found</h2>
                <p className="text-red-500 dark:text-red-300 mt-2">The content for this lesson could not be loaded.</p>
                <button 
                    onClick={() => onNavigate('learn', 'categories')} 
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition duration-150"
                >
                    Go Back to Categories
                </button>
            </div>
        );
    }
    
    const lessonContent = lesson.content || "No content provided for this lesson.";
    const videoId = getEmbedUrl(lesson.video_url);
    const minReadTime = lesson.min_read_time || 30;
    const canTakeQuiz = readTime >= minReadTime;

    return (
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-4 md:p-8">
            {/* Header with Back Button and Time Tracker */}
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => onNavigate('learn', 'lessons', lesson.category)} 
                    className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center transition-colors"
                >
                    &larr; Back to {lesson.category} Lessons
                </button>

                {/* 🆕 Read Time Tracker */}
                <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-700">
                    <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {formatTime(readTime)}
                    </span>
                </div>
            </div>
            
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                {lesson.title}
            </h1>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-6">Category: {lesson.category}</p>

            {videoId && (
                <div className="mb-6 aspect-video rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-slate-700">
                    <iframe
                        title={`Video: ${lesson.title}`}
                        src={`https://www.youtube.com/embed/${videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
            )}

            <div 
                className="prose dark:prose-invert prose-lg max-w-none mt-6 text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: lessonContent }}
            />

            {/* 🆕 Quiz Call-to-Action with Status */}
            <div className={`mt-8 p-6 rounded-xl border-2 ${
                canTakeQuiz 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
            }`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
                            {canTakeQuiz ? (
                                <>
                                    <Award className="mr-2 text-green-600 dark:text-green-400" size={24} />
                                    Ready to Test Your Knowledge?
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 text-yellow-600 dark:text-yellow-400" size={24} />
                                    Keep Reading...
                                </>
                            )}
                        </h3>
                        {canTakeQuiz ? (
                            <p className="text-gray-600 dark:text-gray-400">
                                Complete the quiz to earn tokens and track your progress!
                            </p>
                        ) : (
                            <div className="flex items-start space-x-2 text-yellow-700 dark:text-yellow-300">
                                <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Minimum read time required</p>
                                    <p className="text-sm">
                                        Please read for at least {minReadTime} seconds before taking the quiz.
                                        <br />
                                        <span className="font-semibold">Time remaining: {minReadTime - readTime}s</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleStartQuiz}
                        disabled={!canTakeQuiz || checkingStatus}
                        className={`ml-4 px-6 py-3 text-lg font-semibold rounded-full shadow-lg transform transition duration-200 flex items-center space-x-2 ${
                            canTakeQuiz && !checkingStatus
                                ? 'text-white bg-green-500 hover:bg-green-600 hover:scale-105'
                                : 'text-gray-400 bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                        }`}
                    >
                        {checkingStatus ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Checking...</span>
                            </>
                        ) : (
                            <>
                                <Award size={20} />
                                <span>{canTakeQuiz ? 'Start Quiz' : `Wait ${minReadTime - readTime}s`}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 🆕 Reading Tips */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                    <Shield size={16} className="mr-2" /> 📚 Study Tips
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Read the lesson carefully to understand key concepts</li>
                    <li>• Take notes if needed for better retention</li>
                    <li>• Watch the video if available for visual learning</li>
                    <li>• Minimum read time: {minReadTime} seconds (anti-cheat protection)</li>
                    <li>• Quiz questions are randomly selected from a pool</li>
                    <li>• Time tracking pauses when you switch tabs</li>
                </ul>
            </div>
        </div>
    );
};

export default LessonDetail;