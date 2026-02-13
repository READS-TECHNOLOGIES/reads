import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ArrowLeft, PlayCircle, Clock, Award, CheckCircle, Trash2, XCircle, RefreshCw, AlertTriangle, Shield, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import ResultSummaryPage from './ResultSummaryPage.jsx';

// ====================================================================
// --- 0. Helper Components ---
// ====================================================================

const LoadingState = ({ message = "Loading..." }) => (
  <div className="p-8 text-center text-reads-muted">
    <RefreshCw size={32} className="mx-auto mb-3 animate-spin text-reads-green" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

const CompletedState = ({ lessonTitle, onNavigate }) => (
  <div className="space-y-5 animate-fade-in p-8 bg-white rounded-2xl shadow-reads-card border border-reads-green/30 text-center">
    <div className="w-16 h-16 bg-reads-green-bg rounded-full flex items-center justify-center mx-auto">
      <CheckCircle size={32} className="text-reads-green" />
    </div>
    <h3 className="text-2xl font-bold text-reads-navy">Quiz Completed!</h3>
    <p className="text-reads-muted text-sm">
      You have already successfully completed the quiz for{' '}
      <span className="font-semibold text-reads-navy">{lessonTitle}</span> and earned your reward.
    </p>
    <button
      onClick={() => onNavigate('learn', 'categories')}
      className="w-full py-3 bg-reads-green text-white font-bold rounded-xl hover:bg-reads-green-light transition-colors shadow-reads-green"
    >
      Explore More Lessons
    </button>
  </div>
);

// ====================================================================
// --- 1. Lesson Detail View with Time Tracking ---
// ====================================================================

const LessonDetailView = ({ lesson, onNavigate }) => {
  const [readTime, setReadTime] = useState(0);
  const [isTracking, setIsTracking] = useState(true);
  const accumulatedTimeRef = useRef(0);
  const lastStartTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
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
      if (lesson?.id) {
        let finalTime = accumulatedTimeRef.current;
        if (lastStartTimeRef.current) finalTime += Math.floor((Date.now() - lastStartTimeRef.current) / 1000);
        api.learn.trackLessonTime(lesson.id, finalTime).catch(err => console.warn('Failed to track lesson time:', err));
      }
      isInitializedRef.current = false;
    };
  }, [lesson?.id]);

  const safeContent = (lesson.content || 'Content not available.').replace(/\n/g, '<br/>');

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }
    return url.startsWith('http') ? url : `https://www.youtube.com/embed/${url}`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const minReadTime = lesson.min_read_time || 30;
  const canTakeQuiz = readTime >= minReadTime;

  return (
    <div className="space-y-5 animate-fade-in pb-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between pt-4 px-4">
        <button
          onClick={() => onNavigate('learn', 'list', { name: lesson.category })}
          className="flex items-center text-reads-navy text-sm font-medium hover:text-reads-navy-soft transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Lessons
        </button>

        {/* Read time pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border
          ${isTracking
            ? 'bg-reads-green-bg text-reads-green border-reads-green/30'
            : 'bg-gray-100 text-reads-muted border-gray-200'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-reads-green animate-pulse' : 'bg-gray-400'}`} />
          <Clock size={12} />
          {formatTime(readTime)}
        </div>
      </div>

      {/* ── Lesson header card ── */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-reads-card flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-reads-green-bg flex items-center justify-center flex-shrink-0">
          <BookOpen size={20} className="text-reads-green" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-reads-muted text-xs font-medium">{lesson.category}</p>
          <h2 className="text-reads-navy font-bold text-lg leading-snug">{lesson.title}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-reads-muted text-xs flex items-center gap-1">
              <Clock size={11} /> 5–10 minutes
            </span>
            <span className="text-reads-gold-dark text-xs font-semibold flex items-center gap-1">
              🪙 +{lesson.token_reward || 20} $READS
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-reads-navy h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((readTime / minReadTime) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Lesson content ── */}
      <div className="mx-4 bg-white rounded-2xl p-5 shadow-reads-card">
        <h3 className="text-reads-navy font-bold text-base mb-1">Introduction</h3>
        <div
          className="prose max-w-none text-reads-navy-soft text-sm leading-relaxed space-y-3"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      </div>

      {/* ── Video (if available) ── */}
      {lesson.video_url && (
        <div className="mx-4">
          <h3 className="text-reads-navy font-bold text-base mb-2">Video Lecture</h3>
          <iframe
            className="w-full aspect-video rounded-xl shadow-reads-card border border-gray-100"
            src={getEmbedUrl(lesson.video_url)}
            title="Video Lecture"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* ── Study tips ── */}
      <div className="mx-4 bg-reads-green-bg rounded-xl p-4 border border-reads-green/20">
        <h4 className="text-reads-green font-semibold text-sm mb-2 flex items-center gap-1">
          <Shield size={14} /> Study Tips
        </h4>
        <ul className="text-reads-navy-soft text-xs space-y-1">
          <li>• Read carefully to understand key concepts</li>
          <li>• Watch the video for better retention</li>
          <li>• Minimum read time required: {minReadTime} seconds</li>
          <li>• Quiz questions are randomly selected</li>
        </ul>
      </div>

      {/* ── Finish & Quiz CTA ── */}
      <div className="mx-4">
        {/* Checkbox row */}
        <label className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-reads-card cursor-pointer mb-4">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${canTakeQuiz ? 'bg-reads-green border-reads-green' : 'border-gray-300'}`}
          >
            {canTakeQuiz && <CheckCircle size={12} className="text-white" />}
          </div>
          <span className="text-reads-navy text-sm font-medium">I have finished studying this lesson</span>
        </label>

        <button
          onClick={() => onNavigate('learn', 'quiz', { lessonId: lesson.id, lessonTitle: lesson.title, category: lesson.category })}
          disabled={!canTakeQuiz}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all
            ${canTakeQuiz
              ? 'bg-reads-green text-white shadow-reads-green hover:bg-reads-green-light'
              : 'bg-gray-100 text-reads-muted cursor-not-allowed'}`}
        >
          {canTakeQuiz
            ? `Start Quiz to Earn +${lesson.token_reward || 20} $READS`
            : `Read ${minReadTime - readTime}s more to unlock quiz`}
        </button>
      </div>
    </div>
  );
};

// ====================================================================
// --- 2. Quiz View ---
// ====================================================================

const QuizView = ({ lessonData, onNavigate, onUpdateWallet }) => {
  const { lessonId, lessonTitle } = lessonData;

  const [quizAttempt, setQuizAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [attemptStartTime, setAttemptStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [quizStatus, setQuizStatus] = useState(null);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);

  const quizContainerRef = useRef(null);
  const timerRef = useRef(null);

  // Timer countdown display
  useEffect(() => {
    if (questions.length && step < questions.length) {
      setTimeLeft(null);
      if (timerRef.current) clearInterval(timerRef.current);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, questions.length]);

  // Copy protection
  useEffect(() => {
    const preventCopy = (e) => {
      e.preventDefault();
      setCopyAttempts(prev => prev + 1);
      if (copyAttempts >= 2) alert('⚠️ Copy protection active. Please answer honestly.');
    };
    const preventRightClick = (e) => {
      e.preventDefault();
      alert('⚠️ Right-click is disabled during the quiz.');
    };
    const container = quizContainerRef.current;
    if (container) {
      container.addEventListener('copy', preventCopy);
      container.addEventListener('contextmenu', preventRightClick);
      return () => {
        container.removeEventListener('copy', preventCopy);
        container.removeEventListener('contextmenu', preventRightClick);
      };
    }
  }, [copyAttempts]);

  // Initialize quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const status = await api.learn.checkQuizStatus(lessonId);
        setQuizStatus(status);
        if (!status.can_attempt) { setLoadError(status.reason); setIsLoading(false); return; }

        const attempt = await api.learn.startQuizAttempt(lessonId);
        if (!attempt?.questions?.length) { setLoadError('No quiz questions available for this lesson.'); setIsLoading(false); return; }

        setQuizAttempt(attempt);
        setQuestions(attempt.questions);
        setAttemptStartTime(Date.now());
        setQuestionStartTime(Date.now());
        setIsLoading(false);
      } catch (e) {
        if (e.message === 'QuizAlreadyCompleted') setLoadError("COMPLETED");
        else if (e.message.includes('Rate limit')) setLoadError("Rate limit exceeded. Please try again later.");
        else if (e.message.includes('404')) setLoadError("Quiz not found for this lesson. Please contact admin.");
        else setLoadError(`Failed to start quiz: ${e.message}`);
        setIsLoading(false);
      }
    };
    if (lessonId) initializeQuiz();
    else { setLoadError('No lesson ID provided'); setIsLoading(false); }
  }, [lessonId]);

  const handleAnswerSelect = (optionChar) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setSelectedAnswer(optionChar);
    setQuestionTimes(prev => ({ ...prev, [questions[step].id]: timeSpent }));
  };

  const handleNext = async () => {
    if (selectedAnswer === null) return;
    const newAnswers = { ...answers, [questions[step].id]: selectedAnswer };
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (step < questions.length - 1) {
      setStep(step + 1);
      setQuestionStartTime(Date.now());
    } else {
      setIsLoading(true);
      try {
        const totalTimeSeconds = Math.floor((Date.now() - attemptStartTime) / 1000);
        const minTimePerQuestion = quizAttempt.min_time_per_question;

        for (const qId of Object.keys(questionTimes)) {
          if (questionTimes[qId] < minTimePerQuestion) {
            alert(`⚠️ Please spend at least ${minTimePerQuestion} seconds on each question.`);
            setIsLoading(false);
            return;
          }
        }

        const formattedAnswers = questions.map(q => ({
          question_id: q.id,
          selected: newAnswers[q.id],
          time_spent_seconds: questionTimes[q.id] || minTimePerQuestion
        }));

        const result = await api.learn.submitQuizAttempt(lessonId, quizAttempt.attempt_id, formattedAnswers, totalTimeSeconds);

        if (result.tokens_awarded > 0 && onUpdateWallet) await onUpdateWallet(result.tokens_awarded);
        if (result.flagged_suspicious) alert(`⚠️ ${result.message || 'Your submission has been flagged for review.'}`);

        onNavigate('learn', 'quiz-results', { result, questions, userAnswers: newAnswers, lessonTitle });
      } catch (e) {
        setLoadError(`Submission failed: ${e.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    }
  };

  // ── Error / loading states ──
  if (loadError === "COMPLETED") return <CompletedState lessonTitle={lessonTitle} onNavigate={onNavigate} />;

  if (loadError) {
    return (
      <div className="mx-4 mt-6 text-center p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-reads-card">
        <AlertTriangle size={40} className="mx-auto mb-3 text-amber-500" />
        <h2 className="text-reads-navy font-bold text-lg">Cannot Start Quiz</h2>
        <p className="text-reads-muted text-sm mt-1">{loadError}</p>
        {quizStatus?.cooldown_remaining && (
          <p className="text-xs text-reads-muted mt-2">⏱ Cooldown: {quizStatus.cooldown_remaining}s remaining</p>
        )}
        {quizStatus?.hourly_attempts_remaining !== undefined && (
          <p className="text-xs text-reads-muted mt-1">Hourly attempts: {quizStatus.hourly_attempts_remaining} left</p>
        )}
        {quizStatus?.daily_attempts_remaining !== undefined && (
          <p className="text-xs text-reads-muted mt-1">Daily attempts: {quizStatus.daily_attempts_remaining} left</p>
        )}
        <button
          onClick={() => onNavigate('learn', 'detail', lessonId)}
          className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-reads-green rounded-xl hover:bg-reads-green-light transition-colors"
        >
          <ArrowLeft size={14} className="inline mr-1" /> Back to Lesson
        </button>
      </div>
    );
  }

  if (isLoading || !questions.length) {
    return <LoadingState message={isLoading && quizAttempt ? "Submitting quiz..." : "Loading quiz..."} />;
  }

  // ── Quiz UI ──
  const currentQuestion = questions[step];
  const optionChars = ['A', 'B', 'C', 'D'];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div
      ref={quizContainerRef}
      className="animate-fade-in select-none pb-8"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => onNavigate('learn', 'detail', lessonId)}
          className="flex items-center text-reads-navy text-sm font-medium"
        >
          <ArrowLeft size={16} className="mr-1" />
        </button>
        <h2 className="text-reads-navy font-bold text-base">Quiz</h2>
        <span className="text-reads-muted text-xs font-semibold">
          {timeLeft !== null ? `${String(Math.floor(timeLeft / 60)).padStart(2,'0')}:${String(timeLeft % 60).padStart(2,'0')}` : ''}
        </span>
      </div>

      {/* Progress */}
      <div className="px-4 mb-1">
        <p className="text-reads-muted text-xs mb-1">Question {step + 1} of {questions.length}</p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-reads-navy rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Copy protection warning */}
      {copyAttempts > 0 && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-500 text-xs flex items-center gap-1">
            <Shield size={13} /> Copy protection active. Please answer honestly.
          </p>
        </div>
      )}

      {/* Question */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-reads-card">
        <p className="text-reads-navy font-semibold text-base leading-snug">
          {currentQuestion.question}
        </p>
      </div>

      {/* Options */}
      <div className="mx-4 mt-3 space-y-2.5">
        {currentQuestion.options.map((opt, i) => {
          const optionChar = optionChars[i];
          const isSelected = selectedAnswer === optionChar;
          return (
            <button
              key={optionChar}
              onClick={() => handleAnswerSelect(optionChar)}
              className={`w-full text-left p-4 rounded-xl transition-all border
                ${isSelected
                  ? 'bg-reads-green-bg border-reads-green ring-2 ring-reads-green/20'
                  : 'bg-white border-gray-100 hover:border-reads-green/40 shadow-reads-card'}`}
            >
              <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold mr-3 flex-shrink-0
                ${isSelected ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'}`}>
                {optionChar}
              </span>
              <span className={`text-sm font-medium ${isSelected ? 'text-reads-navy' : 'text-reads-navy-soft'}`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <div className="mx-4 mt-5">
        <button
          onClick={handleNext}
          disabled={selectedAnswer === null || isLoading}
          className="w-full py-3.5 bg-reads-green text-white font-bold rounded-xl shadow-reads-green
                     hover:bg-reads-green-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
        </button>
        {quizAttempt?.min_time_per_question && (
          <p className="text-center text-xs text-reads-muted mt-2">
            Minimum {quizAttempt.min_time_per_question}s per question required
          </p>
        )}
      </div>
    </div>
  );
};

// ====================================================================
// --- 3. Lesson Data Loader ---
// ====================================================================

const LessonDataLoader = ({ lessonId, onNavigate }) => {
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!lessonId) { setLoading(false); return; }
    api.learn.getLessonDetail(lessonId)
      .then(setLessonData)
      .catch(err => { console.error("Error fetching lesson detail:", err); setLessonData(null); })
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) return <LoadingState message="Fetching lesson details..." />;

  if (!lessonData) {
    return (
      <div className="mx-4 mt-6 text-center p-6 bg-red-50 border border-red-200 rounded-2xl shadow-reads-card">
        <XCircle size={36} className="mx-auto mb-3 text-reads-red" />
        <h2 className="text-reads-navy font-bold">Error Loading Lesson</h2>
        <p className="text-reads-muted text-sm mt-1">The lesson could not be found or loaded.</p>
        <button
          onClick={() => onNavigate('learn', 'categories')}
          className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-reads-green rounded-xl hover:bg-reads-green-light transition-colors"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  return <LessonDetailView lesson={lessonData} onNavigate={onNavigate} />;
};

// ====================================================================
// --- 4. Main LearnModule ---
// ====================================================================

export default function LearnModule({ subView, activeData, onNavigate, onUpdateWallet, isAdmin = false }) {
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!categories.length) api.learn.getCategories().then(setCategories);
  }, [categories.length]);

  const fetchLessons = (categoryName) => {
    api.learn.getLessons(categoryName)
      .then(setLessons)
      .catch(e => { console.error("Failed to load lessons:", e); setLessons([]); });
  };

  useEffect(() => {
    if (subView === 'list' && activeData?.name) fetchLessons(activeData.name);
  }, [subView, activeData]);

  const handleDeleteLesson = async (lessonId, lessonTitle, categoryName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete "${lessonTitle}"?`)) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteLesson(lessonId);
      fetchLessons(categoryName);
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      alert("Failed to delete lesson.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── 1. Categories ──
  if (subView === 'categories') {
    const examTabs = ['JAMB', 'WAEC', 'IELTS', 'SAT'];
    const [activeTab, setActiveTab] = useState(examTabs[0]);

    return (
      <div className="animate-fade-in pb-6">
        {/* Page header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-reads-navy font-bold text-base">Learn-to-Earn</h2>
            <span className="text-reads-gold-dark text-xs">🪙</span>
          </div>
          {/* Progress */}
          <div className="bg-white rounded-xl p-3 shadow-reads-card mt-2">
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
        <div className="px-4 flex gap-2 mb-4 overflow-x-auto no-scrollbar">
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

        {/* Lesson cards */}
        <div className="px-4 space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-reads-card">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0 pr-3">
                  <h3 className="text-reads-navy font-bold text-sm">{cat.name}</h3>
                  <p className="text-reads-muted text-xs mt-0.5">{cat.description || 'Study and answer questions.'}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1 my-2 overflow-hidden">
                <div
                  className="bg-reads-navy h-full rounded-full"
                  style={{ width: `${cat.progress || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-reads-gold-dark text-xs font-semibold flex items-center gap-1">
                  🪙 +{cat.token_reward || 20} $READS
                </span>
                <button
                  onClick={() => onNavigate('learn', 'list', cat)}
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

        {/* Resume last lesson sticky button */}
        <div className="px-4 mt-6">
          <button
            onClick={() => onNavigate('learn', 'list', categories[0])}
            className="w-full py-3.5 bg-reads-green text-white font-bold rounded-full shadow-reads-green hover:bg-reads-green-light transition-colors text-sm"
          >
            Resume Last Lesson
          </button>
        </div>
      </div>
    );
  }

  // ── 2. Lesson List ──
  if (subView === 'list') {
    const category = activeData?.name || 'Lessons';
    if (isDeleting) return <LoadingState message="Deleting lesson..." />;

    return (
      <div className="animate-fade-in pb-6">
        <div className="flex items-center gap-3 px-4 pt-5 mb-4">
          <button
            onClick={() => onNavigate('learn', 'categories')}
            className="text-reads-navy"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-reads-navy font-bold text-base flex-1">
            {category}
            {isAdmin && <span className="ml-2 text-xs text-reads-red font-normal">(Admin)</span>}
          </h2>
        </div>

        <div className="px-4 space-y-3">
          {lessons.map(lesson => (
            <div key={lesson.id} className="bg-white rounded-2xl p-4 shadow-reads-card">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-reads-navy font-bold text-sm">{lesson.title}</h3>
                  <p className="text-reads-muted text-xs mt-0.5">{lesson.description || 'Tap to start learning.'}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteLesson(lesson.id, lesson.title, lesson.category)}
                    className="p-1.5 text-reads-red hover:bg-reads-red-bg rounded-lg transition-colors flex-shrink-0"
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1 my-2 overflow-hidden">
                <div
                  className="bg-reads-navy h-full rounded-full"
                  style={{ width: `${lesson.progress || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-reads-gold-dark text-xs font-semibold flex items-center gap-1">
                  🪙 +{lesson.token_reward || 20} $READS
                </span>
                <button
                  onClick={() => onNavigate('learn', 'detail', lesson.id)}
                  className="px-4 py-1.5 bg-reads-green text-white text-xs font-bold rounded-full hover:bg-reads-green-light transition-colors shadow-reads-green"
                >
                  {lesson.progress > 0 ? 'Continue' : 'Start'}
                </button>
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <p className="text-center text-reads-muted text-sm py-8">No lessons found for this category.</p>
          )}
        </div>
      </div>
    );
  }

  // ── 3. Lesson Detail ──
  if (subView === 'detail') {
    return <LessonDataLoader lessonId={activeData} onNavigate={onNavigate} />;
  }

  // ── 4. Quiz ──
  if (subView === 'quiz') {
    return <QuizView lessonData={activeData} onNavigate={onNavigate} onUpdateWallet={onUpdateWallet} />;
  }

  // ── 5. Quiz Results ──
  if (subView === 'quiz-results') {
    if (!activeData?.result || !activeData?.questions || !activeData?.userAnswers) {
      return (
        <div className="mx-4 mt-6 text-center p-6 bg-red-50 border border-red-200 rounded-2xl shadow-reads-card">
          <XCircle size={36} className="mx-auto mb-3 text-reads-red" />
          <h2 className="text-reads-navy font-bold">Error Loading Results</h2>
          <p className="text-reads-muted text-sm mt-1">Quiz result data is missing or incomplete.</p>
          <button
            onClick={() => onNavigate('learn', 'categories')}
            className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-reads-green rounded-xl hover:bg-reads-green-light transition-colors"
          >
            Back to Categories
          </button>
        </div>
      );
    }
    return (
      <ResultSummaryPage
        result={activeData.result}
        questions={activeData.questions}
        userAnswers={activeData.userAnswers}
        lessonTitle={activeData.lessonTitle}
        onNavigate={onNavigate}
      />
    );
  }

  // ── Default ──
  return (
    <div className="p-8 text-center text-reads-muted">
      <p className="text-sm">Welcome to the learning module. Please select a category to begin.</p>
      <button
        onClick={() => onNavigate('learn', 'categories')}
        className="mt-4 text-reads-green hover:text-reads-green-light font-semibold text-sm"
      >
        View Categories
      </button>
    </div>
  );
}
