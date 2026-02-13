import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { Clock, Shield, AlertTriangle, Award, ArrowLeft, BookOpen, XCircle } from 'lucide-react';

// ── Loading spinner ──
const SimpleLoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12 gap-3">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-reads-green" />
    <p className="text-reads-muted text-sm font-medium">Loading Content...</p>
  </div>
);

const LessonDetail = ({ lessonId, onNavigate }) => {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Time tracking
  const [readTime, setReadTime] = useState(0);
  const [isTracking, setIsTracking] = useState(true);

  const accumulatedTimeRef = useRef(0);
  const lastStartTimeRef  = useRef(null);
  const intervalRef       = useRef(null);
  const isInitializedRef  = useRef(false);

  // ── Fetch lesson ──
  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setErrorDetails(null);
      try {
        if (!lessonId) {
          setErrorDetails({ message: 'No lesson ID provided', lessonId: 'undefined', timestamp: new Date().toISOString() });
          setLoading(false);
          return;
        }
        const data = await api.learn.getLessonDetail(lessonId);
        setLesson(data);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setErrorDetails({
          message: err.message || 'Unknown error occurred',
          lessonId: lessonId || 'undefined',
          timestamp: new Date().toISOString(),
        });
        setLesson(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  // ── Time tracking ──
  useEffect(() => {
    if (!lesson || isInitializedRef.current) return;

    isInitializedRef.current = true;
    lastStartTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    setReadTime(0);
    setIsTracking(true);

    intervalRef.current = setInterval(() => {
      if (lastStartTimeRef.current) {
        const current = Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
        setReadTime(accumulatedTimeRef.current + current);
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (lastStartTimeRef.current) {
          accumulatedTimeRef.current += Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
          lastStartTimeRef.current = null;
        }
        setIsTracking(false);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      } else {
        lastStartTimeRef.current = Date.now();
        setIsTracking(true);
        intervalRef.current = setInterval(() => {
          if (lastStartTimeRef.current) {
            setReadTime(accumulatedTimeRef.current + Math.floor((Date.now() - lastStartTimeRef.current) / 1000));
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (lessonId) {
        let finalTime = accumulatedTimeRef.current;
        if (lastStartTimeRef.current) finalTime += Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
        api.learn.trackLessonTime(lessonId, finalTime).catch(err => console.warn('Failed to track lesson time:', err));
      }
      isInitializedRef.current = false;
    };
  }, [lesson, lessonId]);

  // ── Start quiz handler ──
  const handleStartQuiz = useCallback(async () => {
    setCheckingStatus(true);
    try {
      let finalTime = accumulatedTimeRef.current;
      if (lastStartTimeRef.current) finalTime += Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
      await api.learn.trackLessonTime(lessonId, finalTime);

      const status = await api.learn.checkQuizStatus(lessonId);
      if (!status.can_attempt) {
        let msg = status.reason || 'Cannot start quiz at this time';
        if (status.cooldown_remaining) msg += `\n\nCooldown: ${status.cooldown_remaining}s remaining`;
        if (status.hourly_attempts_remaining !== undefined) msg += `\n\nHourly attempts remaining: ${status.hourly_attempts_remaining}`;
        if (status.daily_attempts_remaining !== undefined) msg += `\n\nDaily attempts remaining: ${status.daily_attempts_remaining}`;
        alert(msg);
        setCheckingStatus(false);
        return;
      }

      onNavigate('learn', 'quiz', {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        category: lesson.category,
      });
    } catch (err) {
      console.error('Error checking quiz status:', err);
      alert('Failed to start quiz. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  }, [lessonId, lesson, onNavigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : null;
    }
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    return url;
  };

  // ── Loading ──
  if (loading) return <SimpleLoadingSpinner />;

  // ── Error ──
  if (!lesson && errorDetails) {
    return (
      <div className="mx-4 mt-6 p-6 bg-red-50 border border-reads-red/20 rounded-2xl shadow-reads-card">
        <div className="flex items-center gap-3 mb-3">
          <XCircle size={24} className="text-reads-red flex-shrink-0" />
          <h2 className="text-reads-navy font-bold">Error Loading Lesson</h2>
        </div>
        <p className="text-reads-muted text-sm mb-4">The lesson details could not be found or loaded.</p>

        <div className="bg-white rounded-xl p-4 border border-red-100 mb-4 text-xs font-mono space-y-1 text-reads-navy-soft">
          <p><span className="font-semibold">Error:</span> {errorDetails.message}</p>
          <p><span className="font-semibold">Lesson ID:</span> {errorDetails.lessonId}</p>
          <p><span className="font-semibold">Time:</span> {new Date(errorDetails.timestamp).toLocaleString()}</p>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-4">
          <p className="text-xs font-semibold text-reads-navy mb-1">Troubleshooting:</p>
          <ul className="text-xs text-reads-muted space-y-0.5 list-disc list-inside">
            <li>Check if the backend server is running</li>
            <li>Verify the lesson exists in the database</li>
            <li>Open browser console (F12) for more details</li>
            <li>Check Network tab for API response</li>
          </ul>
        </div>

        <button
          onClick={() => onNavigate('learn', 'categories')}
          className="w-full py-2.5 text-sm font-bold text-white bg-reads-green rounded-xl hover:bg-reads-green-light transition-colors"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-4 mt-6 p-6 bg-red-50 border border-reads-red/20 rounded-2xl shadow-reads-card text-center">
        <XCircle size={32} className="mx-auto mb-3 text-reads-red" />
        <h2 className="text-reads-navy font-bold">Lesson Not Found</h2>
        <p className="text-reads-muted text-sm mt-1">The content for this lesson could not be loaded.</p>
        <button
          onClick={() => onNavigate('learn', 'categories')}
          className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-reads-green rounded-xl hover:bg-reads-green-light transition-colors"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  const lessonContent = lesson.content || 'No content provided for this lesson.';
  const videoId = getEmbedUrl(lesson.video_url);
  const minReadTime = lesson.min_read_time || 30;
  const canTakeQuiz = readTime >= minReadTime;
  const progressPct = Math.min((readTime / minReadTime) * 100, 100);

  return (
    <div className="animate-fade-in pb-8">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => onNavigate('learn', 'list', { name: lesson.category })}
          className="flex items-center gap-1 text-reads-navy text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Lessons
        </button>

        {/* Read time pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
          ${isTracking
            ? 'bg-reads-green-bg text-reads-green border-reads-green/30'
            : 'bg-gray-100 text-reads-muted border-gray-200'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-reads-green animate-pulse' : 'bg-gray-400'}`} />
          <Clock size={11} />
          {formatTime(readTime)}
        </div>
      </div>

      {/* ── Lesson header card ── */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-reads-card mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-reads-green-bg flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-reads-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-reads-muted text-xs font-medium">{lesson.category}</p>
            <h1 className="text-reads-navy font-bold text-lg leading-snug">{lesson.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-reads-muted text-xs flex items-center gap-1">
                <Clock size={11} /> 5–10 minutes
              </span>
              <span className="text-reads-gold-dark text-xs font-semibold">
                🪙 +{lesson.token_reward || 20} $READS
              </span>
            </div>
          </div>
        </div>

        {/* Read progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-reads-muted text-xs">Reading progress</span>
            <span className="text-reads-green text-xs font-semibold">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-reads-green h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Video ── */}
      {videoId && (
        <div className="mx-4 mb-4">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-reads-card border border-gray-100">
            <iframe
              title={`Video: ${lesson.title}`}
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* ── Lesson content ── */}
      <div className="mx-4 bg-white rounded-2xl p-5 shadow-reads-card mb-4">
        <h3 className="text-reads-navy font-bold text-sm mb-3">Introduction</h3>
        <div
          className="prose max-w-none text-reads-navy-soft text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lessonContent }}
        />
      </div>

      {/* ── Study tips ── */}
      <div className="mx-4 bg-reads-green-bg rounded-xl p-4 border border-reads-green/20 mb-4">
        <h4 className="text-reads-green font-semibold text-xs mb-2 flex items-center gap-1">
          <Shield size={13} /> Study Tips
        </h4>
        <ul className="text-reads-navy-soft text-xs space-y-1">
          <li>• Read carefully to understand key concepts</li>
          <li>• Take notes for better retention</li>
          <li>• Watch the video if available for visual learning</li>
          <li>• Minimum read time required: {minReadTime} seconds</li>
          <li>• Quiz questions are randomly selected from a pool</li>
          <li>• Time tracking pauses when you switch tabs</li>
          <li>• Copying text during the quiz is disabled and will flag your attempt</li>
        </ul>
      </div>

      {/* ── Quiz CTA ── */}
      <div className="mx-4">
        {/* "I have finished studying" checkbox */}
        <div className="bg-white rounded-xl p-4 shadow-reads-card flex items-center gap-3 mb-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${canTakeQuiz ? 'bg-reads-green border-reads-green' : 'border-gray-300'}`}
          >
            {canTakeQuiz && (
              <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-reads-navy text-sm font-medium">I have finished studying this lesson</span>
        </div>

        {/* Not ready warning */}
        {!canTakeQuiz && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mb-3">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 text-xs">
              <span className="font-semibold">Minimum read time required.</span>{' '}
              Read for {minReadTime - readTime} more second{minReadTime - readTime !== 1 ? 's' : ''} to unlock the quiz.
            </p>
          </div>
        )}

        {/* Start Quiz button */}
        <button
          onClick={handleStartQuiz}
          disabled={!canTakeQuiz || checkingStatus}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
            ${canTakeQuiz && !checkingStatus
              ? 'bg-reads-green text-white shadow-reads-green hover:bg-reads-green-light'
              : 'bg-gray-100 text-reads-muted cursor-not-allowed'}`}
        >
          {checkingStatus ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Checking...
            </>
          ) : (
            <>
              <Award size={16} />
              {canTakeQuiz
                ? `Start Quiz to Earn +${lesson.token_reward || 20} $READS`
                : `Read ${minReadTime - readTime}s more to unlock quiz`}
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default React.memo(LessonDetail);
