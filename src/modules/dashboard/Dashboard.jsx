import React, { useState, useEffect } from 'react';
import { PlayCircle, Wallet, FileText, BookOpen, ArrowRight, TrendingUp, Award, Bell } from 'lucide-react';
import { api } from '../../services/api';
import LeaderboardWidget from './LeaderboardWidget.jsx';

const Dashboard = ({ user, wallet, onNavigate }) => {
  const [stats, setStats] = useState({ lessons_completed: 0, quizzes_taken: 0 });

  useEffect(() => {
    api.profile.getStats().then(setStats);
  }, []);

  const weeklyProgress = Math.min(stats.lessons_completed * 20, 100);
  const lessonsThisWeek = Math.min(stats.lessons_completed, 5);

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-6 pb-24 space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            className="w-11 h-11 rounded-full object-cover border-2 border-reads-green"
            alt="Profile"
          />
          <div>
            <p className="text-reads-muted text-xs font-medium">Welcome back,</p>
            <h2 className="text-reads-navy font-bold text-base leading-tight">{user.name}</h2>
          </div>
        </div>
        <button
          onClick={() => onNavigate('notifications')}
          className="relative w-10 h-10 rounded-full bg-white shadow-reads-card flex items-center justify-center"
        >
          <Bell size={20} className="text-reads-navy" />
          {/* notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-reads-green rounded-full" />
        </button>
      </div>

      {/* ── Token Balance card ── */}
      <div className="bg-reads-green-bg rounded-2xl p-5 shadow-reads-card border border-reads-green/20">
        <p className="text-reads-muted text-xs font-medium mb-1">Token Balance</p>
        <div className="flex items-center justify-between">
          <h3 className="text-reads-navy text-3xl font-black tracking-tight">
            {wallet.balance}{' '}
            <span className="text-reads-gold font-black">$READS</span>
          </h3>
          {/* Coin icon */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-reads-gold-light via-reads-gold to-reads-gold-dark shadow-reads-gold flex items-center justify-center flex-shrink-0">
            <span className="text-reads-navy font-black text-lg leading-none">$</span>
          </div>
        </div>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 bg-reads-green text-white text-xs font-semibold px-3 py-1 rounded-full">
            <TrendingUp size={11} />
            +50 earned today
          </span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-reads-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-reads-green-bg flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-reads-green" />
          </div>
          <div>
            <p className="text-reads-navy text-xl font-black leading-none">{stats.lessons_completed}</p>
            <p className="text-reads-muted text-xs mt-0.5">Lessons Completed</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-reads-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Award size={18} className="text-reads-gold-dark" />
          </div>
          <div>
            <p className="text-reads-navy text-xl font-black leading-none">{stats.quizzes_taken}</p>
            <p className="text-reads-muted text-xs mt-0.5">Tests Passed</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions grid ── */}
      <div>
        <h3 className="text-reads-navy font-bold text-base mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">

          {/* Start Learning */}
          <button
            onClick={() => onNavigate('learn', 'categories')}
            className="bg-white rounded-2xl p-4 shadow-reads-card flex flex-col items-center gap-2 hover:shadow-reads-green transition-shadow group"
          >
            <div className="w-12 h-12 rounded-full bg-reads-green-bg flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen size={22} className="text-reads-green" />
            </div>
            <span className="text-reads-navy text-xs font-semibold text-center leading-tight">
              Start Learning
            </span>
          </button>

          {/* Take a Test */}
          <button
            onClick={() => onNavigate('learn', 'quiz')}
            className="bg-white rounded-2xl p-4 shadow-reads-card flex flex-col items-center gap-2 hover:shadow-reads-green transition-shadow group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={22} className="text-blue-500" />
            </div>
            <span className="text-reads-navy text-xs font-semibold text-center leading-tight">
              Take a Test
            </span>
          </button>

          {/* Wallet */}
          <button
            onClick={() => onNavigate('wallet')}
            className="bg-white rounded-2xl p-4 shadow-reads-card flex flex-col items-center gap-2 hover:shadow-reads-gold transition-shadow group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet size={22} className="text-reads-gold-dark" />
            </div>
            <span className="text-reads-navy text-xs font-semibold text-center leading-tight">
              Wallet
            </span>
          </button>
        </div>
      </div>

      {/* ── Weekly Progress ── */}
      <div className="bg-white rounded-2xl p-5 shadow-reads-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-reads-navy font-bold text-sm">Your Weekly Progress</p>
          <span className="text-reads-green font-bold text-sm">{weeklyProgress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-reads-navy h-full rounded-full transition-all duration-700"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        <p className="text-reads-muted text-xs mt-2">
          {lessonsThisWeek}/5 lessons completed
        </p>
      </div>

      {/* ── Next Lesson ── */}
      <div className="bg-white rounded-2xl p-5 shadow-reads-card">
        <p className="text-reads-muted text-xs font-medium mb-1">Next Lesson</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-reads-navy font-bold text-base">Algebra Basics</p>
            <button
              onClick={() => onNavigate('learn', 'categories')}
              className="mt-3 inline-flex items-center gap-1 bg-reads-green text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-reads-green-light transition-colors shadow-reads-green"
            >
              Continue
            </button>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-reads-green-bg flex items-center justify-center flex-shrink-0">
            <BookOpen size={28} className="text-reads-green" />
          </div>
        </div>
      </div>

      {/* ── Leaderboard widget ── */}
      <div>
        <LeaderboardWidget currentUserId={user.id} />
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-reads-navy font-bold text-base">Recent Activity</h3>
          <button
            onClick={() => onNavigate('wallet')}
            className="text-reads-green text-xs font-semibold flex items-center gap-1 hover:text-reads-green-light transition-colors"
          >
            View all <ArrowRight size={13} />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-reads-card overflow-hidden divide-y divide-gray-50">
          {/* Positive transaction */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-reads-green-bg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-reads-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-reads-navy text-sm font-semibold truncate">Introduction to Algebra Quiz</p>
              <p className="text-reads-muted text-xs">Completed • Today, 2:30 PM</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-reads-green text-sm font-bold">+20 $READS</p>
            </div>
          </div>

          {/* Another row */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-reads-green-bg flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-reads-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-reads-navy text-sm font-semibold truncate">Lesson Completion Reward</p>
              <p className="text-reads-muted text-xs">Today, 10:15 AM</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-reads-green text-sm font-bold">+25 $READS</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
