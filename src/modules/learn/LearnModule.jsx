import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight, ArrowLeft, Clock, Award, CheckCircle, Trash2,
  XCircle, RefreshCw, AlertTriangle, Shield, BookOpen, TrendingUp,
  RotateCcw, Trophy
} from 'lucide-react';
import { api } from '../../services/api';

// ====================================================================
// SHARED HELPERS
// ====================================================================

const Spinner = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-12 gap-3">
    <RefreshCw size={28} className="animate-spin text-reads-green" />
    <p className="text-reads-muted text-sm font-medium">{message}</p>
  </div>
);

const ErrorCard = ({ title, message, onBack, backLabel = 'Back to Categories' }) => (
  <div className="mx-4 mt-6 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
    <XCircle size={32} className="mx-auto mb-3 text-reads-red" />
    <h2 className="text-reads-navy font-bold mb-1">{title}</h2>
    <p className="text-reads-muted text-sm mb-4">{message}</p>
    <button
      onClick={onBack}
      className="px-5 py-2.5 text-sm font-bold text-white bg-reads-green rounded-xl hover:bg-reads-green-light transition-colors"
    >
      {backLabel}
    </button>
  </div>
);

// ====================================================================
// VIEW 1 — CATEGORIES
// ====================================================================

const CategoriesView = ({ onNavigate, isAdmin }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('JAMB');
  const examTabs = ['JAMB', 'WAEC', 'IELTS', 'SAT'];

  useEffect(() => {
    api.learn.getCategories()
      .then(data => { setCategories(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner message="Loading categories..." />;

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-reads-navy font-bold text-base">Learn-to-Earn</h2>
          <span className="text-reads-gold-dark text-sm">🪙</span>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-reads-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-reads-muted text-xs">Your Progress: 12%</p>
            <p className="text-reads-muted text-xs">3 lessons completed this week</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-reads-navy h-full rounded-full" style={{ width: '12%' }} />
          </div>
        </div>
      </div>

      {/* Exam tabs */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto">
        {examTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
              ${activeTab === tab
                ? 'bg-reads-green text-white shadow-reads-green'
                : 'bg-white text-reads-muted border border-gray-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Category cards */}
      <div className="px-4 space-y-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-reads-card">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="text-reads-navy font-bold text-sm">{cat.name}</h3>
                <p className="text-reads-muted text-xs mt-0.5">
                  {cat.description || 'Study the passage and answer questions.'}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 my-2 overflow-hidden">
              <div className="bg-reads-navy h-full rounded-full" style={{ width: `${cat.progress || 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-reads-gold-dark text-xs font-semibold">
                🪙 +{cat.token_reward || 20} $READS
              </span>
              <button
                onClick={() => onNavigate('list', cat)}
                className="px-4 py-1.5 bg-reads-green text-white text-xs font-bold rounded-full hover:bg-reads-green-light transition-colors shadow-reads-green"
              >
                {cat.progress > 0 ? 'Continue' : 'Start'}
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-reads-muted text-sm py-8">No categories found.</p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="px-4 mt-6">
          <button
            onClick={() => onNavigate('list', categories[0])}
            className="w-full py-3.5 bg-reads-green text-white font-bold rounded-full shadow-reads-green hover:bg-reads-green-light transition-colors text-sm"
          >
            Resume Last Lesson
          </button>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// VIEW 2 — LESSON LIST
// ====================================================================

const LessonListView = ({ category, onNavigate, isAdmin }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLessons = useCallback(() => {
    setLoading(true);
    api.learn.getLessons(category.name)
      .then(data => { setLessons(data || []); setLoading(false); })
      .catch(() => { setLessons([]); setLoading(false); });
  }, [category.name]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteLesson(lesson.id);
      fetchLessons();
    } catch {
      alert('Failed to delete lesson.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || isDeleting) return <Spinner message={isDeleting ? 'Deleting...' : 'Loading lessons...'} />;

  return (
    <div className="animate-fade-in pb-6">
      <div className="flex items-center gap-3 px-4 pt-5 mb-4">
        <button onClick={() => onNavigate('categories', null)} className="text-reads-navy">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-reads-navy font-bold text-base flex-1">
          {category.name}
          {isAdmin && <span className="ml-2 text-xs text-reads-red font-normal">(Admin)</span>}
        </h2>
      </div>

      <div className="px-4 space-y-3">
        {lessons.map(lesson => (
          <div key={lesson.id} className="bg-white rounded-2xl p-4 shadow-reads-card">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-reads-navy font-bold text-sm">{lesson.title}</h3>
                <p className="text-reads-muted text-xs mt-0.5">
                  {lesson.description || 'Tap to start learning.'}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(lesson)}
                  className="p-1.5 text-reads-red hover:bg-reads-red-bg rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 my-2 overflow-hidden">
              <div className="bg-reads-navy h-full rounded-full" style={{ width: `${lesson.progress || 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-reads-gold-dark text-xs font-semibold">
                🪙 +{lesson.token_reward || 20} $READS
              </span>
              <button
                onClick={() => onNavigate('detail', { lessonId: lesson.id, categoryData: category })}
                className="px-4 py-1.5 bg-reads-green text-white text-xs font-bold rounded-full hover:bg-reads-green-light transition-colors shadow-reads-green"
              >
                {lesson.progress > 0 ? 'Continue' : 'Start'}
              </button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && (
          <p className="text-center text-reads-muted text-sm py-8">No lessons found.</p>
        )}
      </div>
    </div>
  );
};

// ====================================================================
// VIEW 3 — LESSON DETAIL (with time tracking)
// ====================================================================

const LessonDetailView = ({ lessonId, categoryData, onNavigate }) => {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readTime, setReadTime] = useState(0);
  const [isTracking, setIsTracking] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const accumulatedRef = useRef(0);
  const lastStartRef   = useRef(null);
  const intervalRef    = useRef(null);
  const initializedRef = useRef(false);

  // Fetch lesson
  useEffect(() => {
    setLoading(true);
    setError(null);
    setLesson(null);
    initializedRef.current = false;

    api.learn.getLessonDetail(lessonId)
      .then(data => { setLesson(data); setLoading(false); })
      .catch(err => { setError(err.message || 'Failed to load lesson'); setLoading(false); });
  }, [lessonId]);

  // Time tracking — only after lesson loaded
  useEffect(() => {
    if (!lesson || initializedRef.current) return;
    initializedRef.current = true;
    accumulatedRef.current = 0;
    lastStartRef.current = Date.now();
    setReadTime(0);
    setIsTracking(true);

    const startTick = () => setInterval(() => {
      if (lastStartRef.current) {
        setReadTime(accumulatedRef.current + Math.floor((Date.now() - lastStartRef.current) / 1000));
      }
    }, 1000);

    intervalRef.current = startTick();

    const onVisibility = () => {
      if (document.hidden) {
        if (lastStartRef.current) {
          accumulatedRef.current += Math.floor((Date.now() - lastStartRef.current) / 1000);
          lastStartRef.current = null;
        }
        setIsTracking(false);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        lastStartRef.current = Date.now();
        setIsTracking(true);
        intervalRef.current = startTick();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      let finalTime = accumulatedRef.current;
      if (lastStartRef.current) finalTime += Math.floor((Date.now() - lastStartRef.current) / 1000);
      api.learn.trackLessonTime(lessonId, finalTime).catch(() => {});
      initializedRef.current = false;
    };
  }, [lesson, lessonId]);

  const handleStartQuiz = useCallback(async () => {
    setCheckingStatus(true);
    try {
      let finalTime = accumulatedRef.current;
      if (lastStartRef.current) finalTime += Math.floor((Date.now() - lastStartRef.current) / 1000);
      await api.learn.trackLessonTime(lessonId, finalTime);

      const status = await api.learn.checkQuizStatus(lessonId);
      if (!status.can_attempt) {
        let msg = status.reason || 'Cannot start quiz at this time';
        if (status.cooldown_remaining) msg += `\n\nCooldown: ${status.cooldown_remaining}s remaining`;
        if (status.hourly_attempts_remaining !== undefined) msg += `\nHourly attempts left: ${status.hourly_attempts_remaining}`;
        if (status.daily_attempts_remaining !== undefined) msg += `\nDaily attempts left: ${status.daily_attempts_remaining}`;
        alert(msg);
        return;
      }
      onNavigate('quiz', { lessonId: lesson.id, lessonTitle: lesson.title, category: lesson.category });
    } catch {
      alert('Failed to start quiz. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  }, [lessonId, lesson, onNavigate]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const getEmbedId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    return m ? m[1] : null;
  };

  if (loading) return <Spinner message="Loading lesson..." />;
  if (error) return <ErrorCard title="Error Loading Lesson" message={error} onBack={() => onNavigate('list', categoryData)} backLabel="Back to Lessons" />;
  if (!lesson) return <ErrorCard title="Lesson Not Found" message="The content could not be loaded." onBack={() => onNavigate('categories', null)} />;

  const minReadTime = lesson.min_read_time || 30;
  const canTakeQuiz = readTime >= minReadTime;
  const progressPct = Math.min((readTime / minReadTime) * 100, 100);
  const videoId     = getEmbedId(lesson.video_url);
  const safeContent = (lesson.content || 'No content available.').replace(/\n/g, '<br/>');

  return (
    <div className="animate-fade-in pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => onNavigate('list', categoryData || { name: lesson.category })}
          className="flex items-center gap-1 text-reads-navy text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Lessons
        </button>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
          ${isTracking ? 'bg-reads-green-bg text-reads-green border-reads-green/30' : 'bg-gray-100 text-reads-muted border-gray-200'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-reads-green animate-pulse' : 'bg-gray-400'}`} />
          <Clock size={11} />
          {formatTime(readTime)}
        </div>
      </div>

      {/* Lesson header */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-reads-card mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-reads-green-bg flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-reads-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-reads-muted text-xs font-medium">{lesson.category}</p>
            <h1 className="text-reads-navy font-bold text-base leading-snug">{lesson.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-reads-muted text-xs flex items-center gap-1"><Clock size={11} /> 5–10 minutes</span>
              <span className="text-reads-gold-dark text-xs font-semibold">🪙 +{lesson.token_reward || 20} $READS</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-reads-muted text-xs">Reading progress</span>
            <span className="text-reads-green text-xs font-semibold">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-reads-green h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Video */}
      {videoId && (
        <div className="mx-4 mb-4 aspect-video rounded-2xl overflow-hidden shadow-reads-card border border-gray-100">
          <iframe
            title={lesson.title}
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* Content */}
      <div className="mx-4 bg-white rounded-2xl p-5 shadow-reads-card mb-4">
        <h3 className="text-reads-navy font-bold text-sm mb-3">Introduction</h3>
        <div
          className="prose max-w-none text-reads-navy-soft text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      </div>

      {/* Study tips */}
      <div className="mx-4 bg-reads-green-bg rounded-xl p-4 border border-reads-green/20 mb-4">
        <h4 className="text-reads-green font-semibold text-xs mb-2 flex items-center gap-1">
          <Shield size={13} /> Study Tips
        </h4>
        <ul className="text-reads-navy-soft text-xs space-y-1">
          <li>• Read carefully to understand key concepts</li>
          <li>• Watch the video for better retention</li>
          <li>• Minimum read time required: {minReadTime} seconds</li>
          <li>• Time tracking pauses when you switch tabs</li>
          <li>• Copying text during the quiz will flag your attempt</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mx-4">
        <div className="bg-white rounded-xl p-4 shadow-reads-card flex items-center gap-3 mb-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${canTakeQuiz ? 'bg-reads-green border-reads-green' : 'border-gray-300'}`}
          >
            {canTakeQuiz && (
              <svg viewBox="0 0 10 8" className="w-3 h-3">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-reads-navy text-sm font-medium">I have finished studying this lesson</span>
        </div>

        {!canTakeQuiz && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 text-xs">
              Read for <span className="font-bold">{minReadTime - readTime}s</span> more to unlock the quiz.
            </p>
          </div>
        )}

        <button
          onClick={handleStartQuiz}
          disabled={!canTakeQuiz || checkingStatus}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
            ${canTakeQuiz && !checkingStatus
              ? 'bg-reads-green text-white shadow-reads-green hover:bg-reads-green-light'
              : 'bg-gray-100 text-reads-muted cursor-not-allowed'}`}
        >
          {checkingStatus
            ? <><RefreshCw size={15} className="animate-spin" /> Checking...</>
            : canTakeQuiz
            ? <><Award size={15} /> Start Quiz to Earn +{lesson.token_reward || 20} $READS</>
            : `Read ${minReadTime - readTime}s more to unlock quiz`}
        </button>
      </div>
    </div>
  );
};

// ====================================================================
// VIEW 4 — QUIZ
// ====================================================================

const QuizView = ({ lessonData, onNavigate, onUpdateWallet }) => {
  const { lessonId, lessonTitle } = lessonData;
  const [phase, setPhase] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizStatus, setQuizStatus] = useState(null);
  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [attemptStartTime, setAttemptStartTime] = useState(null);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const containerRef = useRef(null);
  const timerRef     = useRef(null);

  // Per-question timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    setElapsed(0);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, step]);

  // Copy protection
  useEffect(() => {
    const el = containerRef.current;
    if (!el || phase !== 'quiz') return;
    const noCopy  = (e) => { e.preventDefault(); setCopyAttempts(p => p + 1); };
    const noRight = (e) => e.preventDefault();
    el.addEventListener('copy', noCopy);
    el.addEventListener('contextmenu', noRight);
    return () => { el.removeEventListener('copy', noCopy); el.removeEventListener('contextmenu', noRight); };
  }, [phase]);

  // Init quiz
  useEffect(() => {
    const init = async () => {
      setPhase('loading');
      try {
        const status = await api.learn.checkQuizStatus(lessonId);
        setQuizStatus(status);
        if (!status.can_attempt) { setErrorMsg(status.reason || 'Cannot attempt quiz now.'); setPhase('error'); return; }

        const attempt = await api.learn.startQuizAttempt(lessonId);
        if (!attempt?.questions?.length) { setErrorMsg('No quiz questions available.'); setPhase('error'); return; }

        setQuizAttempt(attempt);
        setQuestions(attempt.questions);
        setAttemptStartTime(Date.now());
        setQuestionStartTime(Date.now());
        setPhase('quiz');
      } catch (e) {
        setErrorMsg(e.message === 'QuizAlreadyCompleted' ? 'COMPLETED' : (e.message || 'Failed to start quiz.'));
        setPhase('error');
      }
    };
    if (lessonId) init();
    else { setErrorMsg('No lesson ID provided.'); setPhase('error'); }
  }, [lessonId]);

  const handleSelect = (char) => {
    setSelectedAnswer(char);
    setQuestionTimes(prev => ({ ...prev, [questions[step].id]: Math.floor((Date.now() - questionStartTime) / 1000) }));
  };

  const handleNext = async () => {
    if (!selectedAnswer) return;
    const newAnswers = { ...answers, [questions[step].id]: selectedAnswer };
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (step < questions.length - 1) {
      setStep(s => s + 1);
      setQuestionStartTime(Date.now());
      return;
    }

    setPhase('submitting');
    try {
      const totalTime  = Math.floor((Date.now() - attemptStartTime) / 1000);
      const minTime    = quizAttempt.min_time_per_question || 0;
      const formatted  = questions.map(q => ({
        question_id: q.id,
        selected: newAnswers[q.id],
        time_spent_seconds: questionTimes[q.id] || minTime,
      }));

      const result = await api.learn.submitQuizAttempt(lessonId, quizAttempt.attempt_id, formatted, totalTime);
      if (result.tokens_awarded > 0 && onUpdateWallet) await onUpdateWallet(result.tokens_awarded);
      if (result.flagged_suspicious) alert(`⚠️ ${result.message || 'Your submission has been flagged.'}`);

      onNavigate('quiz-results', { result, questions, userAnswers: newAnswers, lessonTitle });
    } catch (e) {
      setErrorMsg(`Submission failed: ${e.message}`);
      setPhase('error');
    }
  };

  const formatClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (phase === 'loading')    return <Spinner message="Loading quiz..." />;
  if (phase === 'submitting') return <Spinner message="Submitting quiz..." />;

  if (phase === 'error') {
    if (errorMsg === 'COMPLETED') {
      return (
        <div className="mx-4 mt-6 p-6 bg-white rounded-2xl shadow-reads-card border border-reads-green/30 text-center">
          <div className="w-16 h-16 bg-reads-green-bg rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-reads-green" />
          </div>
          <h3 className="text-reads-navy font-bold text-lg mb-1">Already Completed!</h3>
          <p className="text-reads-muted text-sm mb-4">
            You've already earned your reward for <span className="font-semibold text-reads-navy">{lessonTitle}</span>.
          </p>
          <button
            onClick={() => onNavigate('categories', null)}
            className="w-full py-3 bg-reads-green text-white font-bold rounded-xl hover:bg-reads-green-light transition-colors"
          >
            Explore More Lessons
          </button>
        </div>
      );
    }
    return (
      <div className="mx-4 mt-6 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
        <AlertTriangle size={36} className="mx-auto mb-3 text-amber-500" />
        <h2 className="text-reads-navy font-bold mb-1">Cannot Start Quiz</h2>
        <p className="text-reads-muted text-sm mb-2">{errorMsg}</p>
        {quizStatus?.cooldown_remaining && <p className="text-xs text-reads-muted">⏱ Cooldown: {quizStatus.cooldown_remaining}s</p>}
        {quizStatus?.hourly_attempts_remaining !== undefined && <p className="text-xs text-reads-muted">Hourly attempts left: {quizStatus.hourly_attempts_remaining}</p>}
        {quizStatus?.daily_attempts_remaining !== undefined && <p className="text-xs text-reads-muted">Daily attempts left: {quizStatus.daily_attempts_remaining}</p>}
        <button
          onClick={() => onNavigate('detail', { lessonId, categoryData: null })}
          className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-reads-green rounded-xl hover:bg-reads-green-light transition-colors"
        >
          <ArrowLeft size={14} className="inline mr-1" /> Back to Lesson
        </button>
      </div>
    );
  }

  const q        = questions[step];
  const opts     = ['A', 'B', 'C', 'D'];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div ref={containerRef} className="animate-fade-in pb-8 select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <button onClick={() => onNavigate('detail', { lessonId, categoryData: null })} className="text-reads-navy">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-reads-navy font-bold text-base">Quiz</h2>
        <span className="text-reads-muted text-xs font-mono font-semibold">{formatClock(elapsed)}</span>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-reads-muted text-xs">Question {step + 1} of {questions.length}</p>
          <p className="text-reads-muted text-xs">{Math.round(progress)}% complete</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-reads-navy h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {copyAttempts > 0 && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-reads-red text-xs flex items-center gap-1"><Shield size={12} /> Copy protection active — your attempt may be flagged.</p>
        </div>
      )}

      {/* Question */}
      <div className="mx-4 mb-3 bg-white rounded-2xl p-5 shadow-reads-card">
        <p className="text-reads-navy font-semibold text-sm leading-snug">{q.question}</p>
      </div>

      {/* Options */}
      <div className="mx-4 space-y-2.5 mb-5">
        {q.options.map((opt, i) => {
          const char     = opts[i];
          const selected = selectedAnswer === char;
          return (
            <button
              key={char}
              onClick={() => handleSelect(char)}
              className={`w-full text-left p-4 rounded-xl transition-all border flex items-center gap-3
                ${selected
                  ? 'bg-reads-green-bg border-reads-green ring-2 ring-reads-green/20'
                  : 'bg-white border-gray-100 hover:border-reads-green/40 shadow-reads-card'}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${selected ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'}`}>
                {char}
              </span>
              <span className={`text-sm font-medium ${selected ? 'text-reads-navy' : 'text-reads-navy-soft'}`}>{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-4">
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="w-full py-3.5 bg-reads-green text-white font-bold rounded-xl shadow-reads-green hover:bg-reads-green-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
        </button>
        {quizAttempt?.min_time_per_question > 0 && (
          <p className="text-center text-xs text-reads-muted mt-2">
            Minimum {quizAttempt.min_time_per_question}s per question required
          </p>
        )}
      </div>
    </div>
  );
};

// ====================================================================
// VIEW 5 — QUIZ RESULTS
// ====================================================================

const QuizResultsView = ({ result, questions, userAnswers, lessonTitle, onNavigate }) => {
  const score       = result?.score ?? 0;
  const total       = questions?.length ?? 0;
  const tokens      = result?.tokens_awarded ?? 0;
  const accuracy    = total > 0 ? Math.round((score / total) * 100) : 0;
  const timeSpent   = result?.time_spent_seconds ?? 0;
  const formatTime  = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const opts        = ['A', 'B', 'C', 'D'];

  return (
    <div className="animate-fade-in pb-8">
      {/* Score hero */}
      <div className="px-4 pt-8 pb-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={40} className="text-reads-gold-dark" />
        </div>
        <h2 className="text-reads-navy font-black text-2xl">You Scored {score}/{total}</h2>
        <p className="text-reads-green font-semibold text-sm mt-1">
          {accuracy >= 80 ? 'Great job! Keep learning to earn more.' : 'Keep studying to improve your score!'}
        </p>
        <p className="text-reads-muted text-xs mt-1">Accuracy: {accuracy}%</p>

        {tokens > 0 && (
          <div className="mt-4 inline-flex flex-col items-center bg-amber-50 border border-reads-gold/30 rounded-2xl px-6 py-3">
            <span className="text-reads-gold-dark font-black text-base">+{tokens} $READS Earned</span>
            <span className="text-reads-muted text-xs mt-0.5">Added to your wallet</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-reads-card mb-4">
        <h3 className="text-reads-navy font-bold text-sm mb-3">Your Performance</h3>
        {[
          { icon: <CheckCircle size={16} className="text-reads-green" />, label: 'Correct Answers', value: score },
          { icon: <XCircle size={16} className="text-reads-red" />, label: 'Wrong Answers', value: total - score },
          { icon: <Clock size={16} className="text-blue-400" />, label: 'Time Spent', value: formatTime(timeSpent) },
          { icon: <TrendingUp size={16} className="text-purple-400" />, label: 'Accuracy', value: `${accuracy}%` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-2.5 border-b last:border-0 border-gray-50">
            <span className="flex items-center gap-2 text-sm text-reads-navy-soft">{icon} {label}</span>
            <span className="font-bold text-reads-navy text-sm">{value}</span>
          </div>
        ))}
      </div>

      {/* Review */}
      {questions?.length > 0 && (
        <div className="mx-4 mb-4">
          <h3 className="text-reads-navy font-bold text-sm mb-3">Review Questions</h3>
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userAnswer    = userAnswers?.[q.id];
              const correctAnswer = q.correct_answer;
              const isCorrect     = userAnswer === correctAnswer;

              return (
                <div key={q.id} className="bg-white rounded-2xl p-4 shadow-reads-card">
                  <p className="text-reads-navy font-semibold text-xs mb-3">Q{idx + 1}. {q.question}</p>
                  {q.options?.map((opt, i) => {
                    const char         = opts[i];
                    const isUserPick   = userAnswer === char;
                    const isCorrectOpt = correctAnswer === char;
                    let cls = 'bg-gray-50 border-gray-100 text-reads-muted';
                    if (isCorrectOpt)          cls = 'bg-reads-green-bg border-reads-green text-reads-green';
                    else if (isUserPick && !isCorrect) cls = 'bg-reads-red-bg border-reads-red text-reads-red';

                    return (
                      <div key={char} className={`flex items-center gap-2 p-2.5 rounded-xl border mb-1.5 ${cls}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                          ${isCorrectOpt ? 'bg-reads-green text-white' : isUserPick && !isCorrect ? 'bg-reads-red text-white' : 'bg-gray-200 text-reads-muted'}`}>
                          {char}
                        </span>
                        <span className="text-xs font-medium flex-1">{opt}</span>
                        {isCorrectOpt && <CheckCircle size={13} />}
                        {isUserPick && !isCorrect && <XCircle size={13} />}
                      </div>
                    );
                  })}
                  {q.explanation && (
                    <p className="text-reads-muted text-xs mt-2 pt-2 border-t border-gray-100 leading-relaxed">
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mx-4 space-y-2">
        <button
          onClick={() => onNavigate('categories', null)}
          className="w-full py-3.5 bg-reads-green text-white font-bold rounded-xl shadow-reads-green hover:bg-reads-green-light transition-colors text-sm"
        >
          Back to Summary
        </button>
        <button
          onClick={() => onNavigate('quiz', { lessonId: result?.lesson_id, lessonTitle })}
          className="w-full py-3 text-reads-green font-semibold text-sm flex items-center justify-center gap-1 hover:text-reads-green-light transition-colors"
        >
          <RotateCcw size={14} /> Retake Quiz
        </button>
      </div>
    </div>
  );
};

// ====================================================================
// MAIN EXPORT — self-contained router
// ====================================================================

export default function LearnModule({ onUpdateWallet, isAdmin = false }) {
  // Fully self-contained — App.jsx never touches internal routing
  const [view, setView] = useState('categories');
  const [data, setData] = useState(null);

  // Internal navigation only
  const go = useCallback((nextView, nextData) => {
    setView(nextView);
    setData(nextData);
  }, []);

  if (view === 'categories') return <CategoriesView onNavigate={go} isAdmin={isAdmin} />;

  if (view === 'list') return <LessonListView category={data} onNavigate={go} isAdmin={isAdmin} />;

  if (view === 'detail') {
    const lessonId    = typeof data === 'object' ? data?.lessonId : data;
    const categoryData = typeof data === 'object' ? data?.categoryData : null;
    return <LessonDetailView lessonId={lessonId} categoryData={categoryData} onNavigate={go} />;
  }

  if (view === 'quiz') return <QuizView lessonData={data} onNavigate={go} onUpdateWallet={onUpdateWallet} />;

  if (view === 'quiz-results') {
    return (
      <QuizResultsView
        result={data?.result}
        questions={data?.questions}
        userAnswers={data?.userAnswers}
        lessonTitle={data?.lessonTitle}
        onNavigate={go}
      />
    );
  }

  return (
    <div className="p-8 text-center text-reads-muted">
      <p className="text-sm mb-3">Welcome to the learning module.</p>
      <button onClick={() => go('categories', null)} className="text-reads-green font-semibold text-sm">
        View Categories
      </button>
    </div>
  );
}
