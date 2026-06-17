import { useState, useEffect } from 'react';
import {
  BookOpen, ChevronRight, ChevronLeft, CheckCircle, Lock,
  Clock, Trophy, Star, Play, ArrowLeft, Loader2, AlertCircle,
  Calendar, Award, BarChart2
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, TokenBadge, Badge, ProgressBar, Toast } from '../../components/UI.jsx';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString() ?? '0';
const pct = (v) => `${Math.round(v ?? 0)}%`;

// ── Course Card ───────────────────────────────────────────────────────────────
function CourseCard({ course, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full reads-card text-left p-4 space-y-3 active:scale-95 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-black text-reads-navy text-sm leading-tight">{course.title}</p>
          <p className="text-reads-muted text-xs mt-0.5">{course.subject}</p>
        </div>
        {course.scope !== 'general' && (
          <Badge label={course.scope === 'class' ? 'Class' : 'School'} variant="blue" />
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-reads-muted">
        <span className="flex items-center gap-1"><BookOpen size={12} />{course.weeks_count} weeks</span>
        <span className="flex items-center gap-1"><Trophy size={12} />{fmt(course.course_reward)} $READS</span>
        <span className="flex items-center gap-1"><Star size={12} />Pass: {course.course_pass_mark}%</span>
      </div>
      {course.enrolled && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-reads-muted">Week {course.current_week} of {course.weeks_count}</span>
            <span className="text-reads-green font-bold">{pct((course.current_week - 1) / course.weeks_count * 100)}</span>
          </div>
          <ProgressBar value={((course.current_week - 1) / course.weeks_count) * 100} />
        </div>
      )}
      {!course.enrolled && (
        <div className="flex items-center justify-between">
          <span className="text-reads-teal text-xs font-bold">Enroll to start →</span>
          {course.start_date && (
            <span className="text-reads-muted text-xs flex items-center gap-1">
              <Calendar size={11} />
              Starts {new Date(course.start_date).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ── Week Card ─────────────────────────────────────────────────────────────────
function WeekCard({ week, coursePassMark, onSelectLesson }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="reads-card overflow-hidden">
      <button
        onClick={() => week.unlocked && setOpen(!open)}
        className={`w-full p-4 text-left flex items-center gap-3 ${!week.unlocked ? 'opacity-60' : ''}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${week.passed ? 'bg-green-100' : week.completed ? 'bg-amber-100' : week.unlocked ? 'bg-reads-navy-bg' : 'bg-gray-100'}`}
        >
          {!week.unlocked ? <Lock size={16} className="text-gray-400" /> :
           week.passed ? <CheckCircle size={16} className="text-reads-green" /> :
           <BookOpen size={16} className="text-reads-navy" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-reads-navy text-sm">Week {week.week_number}{week.title ? `: ${week.title}` : ''}</p>
          <p className="text-reads-muted text-xs">
            {week.unlocked
              ? `${week.lessons_completed}/${week.lessons_total} lessons · ${week.week_reward} $READS`
              : 'Complete previous week to unlock'}
          </p>
        </div>
        {week.unlocked && (
          <div className="flex items-center gap-2">
            {week.week_score !== null && (
              <span className={`text-xs font-bold ${week.passed ? 'text-reads-green' : 'text-amber-500'}`}>
                {pct(week.week_score)}
              </span>
            )}
            <ChevronRight size={16} className={`text-reads-muted transition-transform ${open ? 'rotate-90' : ''}`} />
          </div>
        )}
      </button>

      {open && week.unlocked && (
        <div className="border-t border-reads-border divide-y divide-reads-border">
          {week.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => !lesson.locked && onSelectLesson(lesson, week)}
              disabled={lesson.locked}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                ${lesson.locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-reads-cream active:scale-95'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${lesson.completed ? 'bg-green-100' : 'bg-reads-navy-bg'}`}
              >
                {lesson.completed
                  ? <CheckCircle size={14} className="text-reads-green" />
                  : <Play size={14} className="text-reads-navy" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-reads-navy text-sm font-medium truncate">{lesson.title}</p>
                {lesson.topic && <p className="text-reads-muted text-xs truncate">{lesson.topic}</p>}
              </div>
              {lesson.quiz_score !== null && (
                <span className={`text-xs font-bold flex-shrink-0 ${lesson.quiz_score >= coursePassMark ? 'text-reads-green' : 'text-amber-500'}`}>
                  {pct(lesson.quiz_score)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lesson View ───────────────────────────────────────────────────────────────
function CourseLessonView({ lesson, week, course, onComplete, onBack }) {
  const [tab, setTab] = useState('content');  // content | quiz
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.lessons.get(lesson.id);
        setContent(data);
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lesson.id]);

  const startQuiz = async () => {
    try {
      const data = await api.lessons.startQuiz(lesson.id);
      setQuestions(data.questions || []);
      setAttemptId(data.attempt_id);
      setTab('quiz');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const formatted = questions.map(q => ({
        question_id: q.id,
        selected_text: answers[q.id] ?? '',   // matches backend grading
      }));
      const res = await api.lessons.submitQuiz(lesson.id, attemptId, formatted);
      setResult(res);

      // Mark lesson complete in course
      await fetch(`${API_URL}/courses/${course.id}/weeks/${week.id}/lessons/${lesson.id}/complete?quiz_score=${res.score}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      onComplete(res);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-reads-border">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-reads-cream">
          <ArrowLeft size={20} className="text-reads-navy" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-reads-navy text-sm truncate">{lesson.title}</p>
          <p className="text-reads-muted text-xs">Week {week.week_number}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-reads-border">
        {['content', 'quiz'].map(t => (
          <button
            key={t}
            onClick={() => t === 'quiz' ? startQuiz() : setTab('content')}
            className={`flex-1 py-2.5 text-sm font-bold capitalize transition-colors
              ${tab === t ? 'text-reads-navy border-b-2 border-reads-navy' : 'text-reads-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'content' && content && (
          <div className="space-y-4">
            {content.topic && <p className="text-reads-teal text-xs font-bold uppercase tracking-wide">{content.topic}</p>}
            <div className="prose prose-sm max-w-none text-reads-navy whitespace-pre-wrap leading-relaxed">
              {content.content}
            </div>
            <button
              onClick={startQuiz}
              className="w-full reads-btn-primary py-3 mt-4"
            >
              Take Quiz →
            </button>
          </div>
        )}

        {tab === 'quiz' && !result && (
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-3">
                <p className="font-bold text-reads-navy text-sm">{i + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all
                        ${answers[q.id] === opt
                          ? 'border-reads-navy bg-reads-navy-bg text-reads-navy font-bold'
                          : 'border-reads-border text-reads-muted hover:border-reads-navy'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={submitQuiz}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="w-full reads-btn-primary py-3 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Submit Quiz'}
            </button>
          </div>
        )}

        {tab === 'quiz' && result && (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center
              ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}
            >
              {result.passed
                ? <CheckCircle size={40} className="text-reads-green" />
                : <AlertCircle size={40} className="text-red-500" />}
            </div>
            <div>
              <p className="font-black text-reads-navy text-2xl">{pct(result.score)}</p>
              <p className="text-reads-muted text-sm">{result.passed ? 'Passed!' : 'Not passed'}</p>
            </div>
            {result.passed && (
              <div className="bg-reads-green-bg rounded-2xl px-6 py-3">
                <p className="text-reads-green font-bold text-sm">Lesson complete ✓</p>
                <p className="text-reads-muted text-xs mt-1">Rewards accumulate until course completion</p>
              </div>
            )}
            {!result.passed && (
              <p className="text-reads-muted text-sm">Score {course.quiz_pass_mark}% or more to pass. Try again.</p>
            )}
            <div className="flex gap-3 w-full mt-2">
              {!result.passed && (
                <button onClick={() => { setResult(null); setAnswers({}); startQuiz(); }}
                  className="flex-1 border-2 border-reads-navy text-reads-navy font-bold py-3 rounded-2xl text-sm">
                  Retry
                </button>
              )}
              <button onClick={onBack} className="flex-1 reads-btn-primary py-3 text-sm">
                {result.passed ? 'Next Lesson' : 'Back to Course'}
              </button>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Course Detail View ────────────────────────────────────────────────────────
function CourseDetailView({ courseId, onBack }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    try {
      const data = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      }).then(r => r.json());
      setCourse(data);
    } catch (e) {
      showToast('Failed to load course', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId]);

  const enroll = async () => {
    setEnrolling(true);
    try {
      await fetch(`${API_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      await load();
      showToast('Enrolled! Start from Week 1.');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <LoadingOverlay />;
  if (!course) return <EmptyState icon={BookOpen} title="Course not found" />;

  if (selectedLesson) {
    return (
      <CourseLessonView
        lesson={selectedLesson}
        week={selectedWeek}
        course={course}
        onComplete={() => { setSelectedLesson(null); load(); showToast('Lesson complete!'); }}
        onBack={() => setSelectedLesson(null)}
      />
    );
  }

  const completedWeeks = course.weeks?.filter(w => w.completed).length ?? 0;
  const totalWeeks = course.weeks?.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-reads-border">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-reads-cream">
            <ArrowLeft size={20} className="text-reads-navy" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-reads-navy text-base truncate">{course.title}</p>
            <p className="text-reads-muted text-xs">{course.subject}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1 text-reads-muted">
            <Trophy size={12} className="text-reads-gold" />
            <span>{fmt(course.course_reward)} $READS</span>
          </div>
          <div className="flex items-center gap-1 text-reads-muted">
            <Star size={12} className="text-reads-teal" />
            <span>Pass: {course.course_pass_mark}%</span>
          </div>
          <div className="flex items-center gap-1 text-reads-muted">
            <BarChart2 size={12} />
            <span>{completedWeeks}/{totalWeeks} weeks done</span>
          </div>
        </div>

        {course.enrolled && totalWeeks > 0 && (
          <div className="mt-2">
            <ProgressBar value={(completedWeeks / totalWeeks) * 100} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {course.description && (
          <p className="text-reads-muted text-sm leading-relaxed">{course.description}</p>
        )}

        {!course.enrolled && (
          <button
            onClick={enroll}
            disabled={enrolling}
            className="w-full reads-btn-primary py-3 flex items-center justify-center gap-2"
          >
            {enrolling ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {enrolling ? 'Enrolling...' : 'Enroll & Start'}
          </button>
        )}

        {course.enrollment_status === 'completed' && !course.reward_claimed && (
          <div className="reads-card bg-reads-gold/10 border border-reads-gold p-4 text-center space-y-2">
            <p className="font-black text-reads-navy">🎉 Course Complete!</p>
            <p className="text-reads-muted text-sm">You've completed this course. Go to Wallet → Claim to get your rewards.</p>
          </div>
        )}

        {/* Weeks */}
        <div className="space-y-3">
          {course.weeks?.map(week => (
            <WeekCard
              key={week.id}
              week={week}
              coursePassMark={course.quiz_pass_mark}
              onSelectLesson={(lesson, week) => { setSelectedLesson(lesson); setSelectedWeek(week); }}
            />
          ))}
        </div>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Main Courses Module ───────────────────────────────────────────────────────
export default function CoursesModule() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filter, setFilter] = useState('all'); // all | enrolled | available
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/courses`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        const data = await res.json();
        setCourses(data.courses || []);
      } catch (e) {
        setToast({ msg: 'Failed to load courses', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (selectedCourse) {
    return (
      <CourseDetailView
        courseId={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  const filtered = courses.filter(c => {
    if (filter === 'enrolled') return c.enrolled;
    if (filter === 'available') return !c.enrolled;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-reads-border">
        <p className="font-black text-reads-navy text-lg">Courses</p>
        <p className="text-reads-muted text-xs">Structured learning paths with weekly lessons</p>
        <div className="flex gap-2 mt-3">
          {[['all', 'All'], ['enrolled', 'My Courses'], ['available', 'Available']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                ${filter === val ? 'bg-reads-navy text-white' : 'bg-reads-cream text-reads-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <LoadingOverlay />}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title={filter === 'enrolled' ? 'No enrolled courses' : 'No courses available'}
            subtitle={filter === 'enrolled' ? 'Browse available courses to get started' : 'Check back soon'}
          />
        )}
        <div className="space-y-3">
          {filtered.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => setSelectedCourse(course.id)}
            />
          ))}
        </div>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
