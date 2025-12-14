import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

const LeaderboardWidget = ({ currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.profile.getLeaderboard(10);
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-400" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Medal className="text-orange-600" size={24} />;
    return <span className="text-card-muted font-bold text-lg">#{rank}</span>;
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/40';
    if (rank === 2) return 'bg-gray-400/20 border-gray-400/40';
    if (rank === 3) return 'bg-orange-500/20 border-orange-500/40';
    return 'bg-cyan/10 border-cyan/20';
  };

  if (loading) {
    return (
      <div className="bg-primary-navy dark:bg-dark-card rounded-2xl p-6 border border-cyan/20">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-yellow-400" size={28} />
          <h2 className="text-2xl font-bold text-yellow-400">Global Leaderboard</h2>
        </div>
        <div className="text-center py-8 text-card-muted">Loading rankings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary-navy dark:bg-dark-card rounded-2xl p-6 border border-cyan/20">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-yellow-400" size={28} />
          <h2 className="text-2xl font-bold text-yellow-400">Global Leaderboard</h2>
        </div>
        <div className="text-center py-8 text-orange">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-primary-navy dark:bg-dark-card rounded-2xl p-6 border border-cyan/20 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-400" size={28} />
          <h2 className="text-2xl font-bold text-yellow-400">Global Leaderboard</h2>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 rounded-lg bg-cyan/20 text-cyan hover:bg-cyan/30 transition-colors text-sm font-medium border border-cyan/40"
        >
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-dark-card-light rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/40">
            <TrendingUp size={16} className="text-yellow-400" />
          </div>
          <div>
            <div className="text-xs text-card-muted">Tokens</div>
            <div className="text-sm font-bold text-yellow-400">Earned</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan/20 rounded-full flex items-center justify-center border border-cyan/40">
            <CheckCircle size={16} className="text-cyan" />
          </div>
          <div>
            <div className="text-xs text-card-muted">Quizzes</div>
            <div className="text-sm font-bold text-cyan">Passed</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange/20 rounded-full flex items-center justify-center border border-orange/40">
            <BookOpen size={16} className="text-orange" />
          </div>
          <div>
            <div className="text-xs text-card-muted">Lessons</div>
            <div className="text-sm font-bold text-orange">Done</div>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-card-muted">
            No rankings yet. Be the first to earn tokens!
          </div>
        ) : (
          leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                entry.is_current_user
                  ? 'bg-yellow-500/10 border-yellow-500/40 ring-2 ring-yellow-500/20'
                  : `${getRankBadgeColor(entry.rank)} hover:bg-dark-card-light`
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={`https://api.dicebear.com/8.x/initials/svg?seed=${entry.name}`}
                  alt={entry.name}
                  className={`w-12 h-12 rounded-full border-2 ${
                    entry.is_current_user ? 'border-yellow-400' : 'border-cyan'
                  }`}
                />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold truncate ${
                      entry.is_current_user ? 'text-yellow-400' : 'text-card-light'
                    }`}
                  >
                    {entry.name}
                  </span>
                  {entry.is_current_user && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/40">
                      You
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                {/* Tokens */}
                <div className="text-center">
                  <div className="font-bold text-yellow-400">{entry.total_tokens}</div>
                  <div className="text-xs text-card-muted">tokens</div>
                </div>

                {/* Quizzes */}
                <div className="text-center">
                  <div className="font-bold text-cyan">{entry.quizzes_passed}</div>
                  <div className="text-xs text-card-muted">quizzes</div>
                </div>

                {/* Lessons */}
                <div className="text-center">
                  <div className="font-bold text-orange">{entry.lessons_completed}</div>
                  <div className="text-xs text-card-muted">lessons</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Note */}
      {leaderboard.length > 0 && (
        <div className="mt-6 pt-4 border-t border-cyan/20 text-center">
          <p className="text-sm text-card-muted">
            Rankings update in real-time based on total tokens earned 🏆
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;