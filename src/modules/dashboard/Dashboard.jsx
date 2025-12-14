import React, { useState, useEffect } from 'react';
import { PlayCircle, Wallet, Award, ArrowRight, TrendingUp, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import LeaderboardWidget from './LeaderboardWidget.jsx';

const Dashboard = ({ user, wallet, onNavigate }) => {
  const [stats, setStats] = useState({ lessons_completed: 0, quizzes_taken: 0 });

  useEffect(() => {
    api.profile.getStats().then(setStats);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* --- Welcome Banner --- */}
      <div className="bg-gradient-to-br from-primary-navy to-primary-navy-dark dark:from-dark-bg dark:to-primary-navy rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border-2 border-cyan">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <img 
              src={user.avatar} 
              className="w-16 h-16 rounded-full border-4 border-cyan shadow-lg object-cover" 
              alt="Profile" 
            />
            <div>
              <p className="text-cyan text-sm font-medium">Welcome back,</p>
              <h2 className="text-3xl font-bold">{user.name}</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 backdrop-blur border-2 border-cyan-light rounded-xl p-4">
              <p className="text-xs uppercase text-card-muted mb-1">Balance</p>
              <p className="text-2xl font-bold text-orange">{wallet.balance} <span className="text-sm text-cyan">$READS</span></p>
            </div>
            <div className="bg-black/30 backdrop-blur border-2 border-cyan-light rounded-xl p-4">
              <p className="text-xs uppercase text-card-muted mb-1">Lessons</p>
              <p className="text-2xl font-bold text-cyan">{stats.lessons_completed}</p>
            </div>
            <div className="bg-black/30 backdrop-blur border-2 border-cyan-light rounded-xl p-4">
              <p className="text-xs uppercase text-card-muted mb-1">Quizzes</p>
              <p className="text-2xl font-bold text-cyan">{stats.quizzes_taken}</p>
            </div>
          </div>
        </div>
        {/* Decorative Background Elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-orange/10 rounded-full blur-3xl" />
      </div>

      {/* --- Quick Actions --- */}
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white pt-4 flex items-center">
        <TrendingUp size={24} className="mr-2 text-cyan" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Start Learning Card */}
        <button 
          onClick={() => onNavigate('learn', 'categories')} 
          className="p-6 bg-light-card dark:bg-dark-card rounded-2xl shadow-lg hover:shadow-cyan/50 transition-all text-left group border-2 border-cyan hover:border-cyan-light"
        >
          <div className="w-14 h-14 bg-cyan/20 text-cyan rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border-2 border-cyan">
            <PlayCircle size={28} />
          </div>
          <h3 className="font-bold text-white text-lg mb-1">Start Learning</h3>
          <p className="text-sm text-card-muted">Explore lessons and earn rewards</p>
          <div className="mt-3 flex items-center text-cyan text-sm font-semibold">
            Get Started <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Check Wallet Card */}
        <button 
          onClick={() => onNavigate('wallet')} 
          className="p-6 bg-light-card dark:bg-dark-card rounded-2xl shadow-lg hover:shadow-orange/50 transition-all text-left group border-2 border-cyan hover:border-orange"
        >
          <div className="w-14 h-14 bg-orange/20 text-orange rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border-2 border-orange">
            <Wallet size={28} />
          </div>
          <h3 className="font-bold text-white text-lg mb-1">My Wallet</h3>
          <p className="text-sm text-card-muted">View tokens and transaction history</p>
          <div className="mt-3 flex items-center text-orange text-sm font-semibold">
            Check Balance <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* --- 🏆 LEADERBOARD WIDGET --- */}
      <div className="pt-4">
        <LeaderboardWidget currentUserId={user.id} />
      </div>

      {/* --- Latest Activity / Rewards --- */}
      <div className="pt-4">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          <Award size={24} className="mr-2 text-orange" />
          Recent Activity
        </h3>
        
        {/* Activity Card */}
        <div className="bg-light-card dark:bg-dark-card rounded-2xl border-2 border-cyan shadow-lg overflow-hidden">
          <div className="p-5 flex justify-between items-center hover:bg-black/20 transition-colors">
            <div className='flex items-center gap-4'>
              <div className="w-12 h-12 bg-orange/20 rounded-full flex items-center justify-center border-2 border-orange">
                <Award size={24} className='text-orange'/>
              </div>
              <div>
                <p className='text-base font-semibold text-white'>Introduction to Algebra Quiz</p>
                <p className='text-sm text-card-muted'>Completed • May 28, 2024</p>
              </div>
            </div>
            <div className="text-right">
              <span className='text-xl font-bold text-orange'>+20</span>
              <p className="text-xs text-cyan font-medium">$READS</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onNavigate('wallet')} 
          className='mt-4 text-sm text-cyan hover:text-primary-cyan-dark flex items-center gap-1 font-semibold transition-colors'
        >
          View Full History <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* --- Learning Progress Section --- */}
      <div className="pt-4">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          <BookOpen size={24} className="mr-2 text-cyan" />
          Continue Learning
        </h3>
        
        <div className="bg-light-card dark:bg-dark-card rounded-2xl border-2 border-cyan p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-semibold text-lg">Pick up where you left off</p>
              <p className="text-card-muted text-sm">You're making great progress!</p>
            </div>
            <div className="text-cyan text-3xl font-bold">
              {Math.round((stats.quizzes_taken / (stats.lessons_completed || 1)) * 100)}%
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden border border-cyan-light">
            <div 
              className="bg-gradient-to-r from-cyan to-primary-cyan-dark h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.lessons_completed * 10, 100)}%` }}
            />
          </div>
          
          <button 
            onClick={() => onNavigate('learn', 'categories')}
            className="mt-4 w-full py-3 bg-cyan text-white font-bold rounded-xl hover:bg-primary-cyan-dark transition-all border-2 border-cyan shadow-lg hover:shadow-cyan/50"
          >
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;