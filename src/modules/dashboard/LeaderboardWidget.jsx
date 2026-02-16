import { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={22} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={22} className="text-gray-400" />;
    if (rank === 3) return <Medal size={22} className="text-orange-500" />;
    return <span className="text-gray-400 font-bold text-base">#{rank}</span>;
};

const getRankStyle = (rank, isCurrentUser) => {
    if (isCurrentUser) return 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-100';
    if (rank === 1)    return 'bg-yellow-50 border-yellow-100';
    if (rank === 2)    return 'bg-gray-50 border-gray-100';
    if (rank === 3)    return 'bg-orange-50 border-orange-100';
    return 'bg-white border-gray-100 hover:bg-gray-50';
};

const StatPill = ({ value, label, color }) => (
    <div className="text-center min-w-[48px]">
        <p className={`text-sm font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
    </div>
);

const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 animate-pulse">
        <div className="w-10 h-6 bg-gray-200 rounded" />
        <div className="w-11 h-11 bg-gray-200 rounded-full" />
        <div className="flex-1 h-4 bg-gray-200 rounded" />
        <div className="flex gap-4">
            <div className="w-10 h-8 bg-gray-200 rounded" />
            <div className="w-10 h-8 bg-gray-200 rounded" />
            <div className="w-10 h-8 bg-gray-200 rounded" />
        </div>
    </div>
);

const LeaderboardWidget = ({ currentUserId }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await api.profile.getLeaderboard(10);
            setLeaderboard(data);
        } catch (err) {
            setError('Failed to load leaderboard');
            console.error('Leaderboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaderboard(); }, []);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-50 rounded-xl">
                        <Trophy size={20} className="text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Global Leaderboard</h2>
                        <p className="text-xs text-gray-400">Top earners on the platform</p>
                    </div>
                </div>
                <button
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                {[
                    { icon: TrendingUp, iconCls: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Tokens', sub: 'Earned' },
                    { icon: CheckCircle, iconCls: 'text-[#16a34a]', bg: 'bg-green-50', label: 'Quizzes', sub: 'Passed' },
                    { icon: BookOpen, iconCls: 'text-[#f97316]', bg: 'bg-orange-50', label: 'Lessons', sub: 'Done' },
                ].map(({ icon: Icon, iconCls, bg, label, sub }) => (
                    <div key={label} className="flex items-center gap-2.5 px-4 py-3">
                        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon size={15} className={iconCls} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">{label}</p>
                            <p className={`text-xs font-bold ${iconCls}`}>{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Body */}
            <div className="p-4 space-y-2">
                {loading ? (
                    [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                ) : error ? (
                    <div className="text-center py-12 text-red-500 text-sm font-medium">{error}</div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                        <Trophy size={36} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-gray-500 font-medium text-sm">No rankings yet</p>
                        <p className="text-gray-400 text-xs mt-1">Be the first to earn tokens!</p>
                    </div>
                ) : (
                    leaderboard.map((entry) => (
                        <div
                            key={entry.user_id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${getRankStyle(entry.rank, entry.is_current_user)}`}
                        >
                            {/* Rank icon */}
                            <div className="flex items-center justify-center w-10 flex-shrink-0">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* Avatar */}
                            <img
                                src={`https://api.dicebear.com/8.x/initials/svg?seed=${entry.name}`}
                                alt={entry.name}
                                className={`w-11 h-11 rounded-full border-2 flex-shrink-0 ${
                                    entry.is_current_user ? 'border-yellow-400' : 'border-gray-100'
                                }`}
                            />

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm truncate ${
                                        entry.is_current_user ? 'text-yellow-600' : 'text-gray-900'
                                    }`}>
                                        {entry.name}
                                    </span>
                                    {entry.is_current_user && (
                                        <span className="flex-shrink-0 text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                                            You
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4">
                                <StatPill value={entry.total_tokens}      label="tokens"  color="text-yellow-600" />
                                <StatPill value={entry.quizzes_passed}    label="quizzes" color="text-[#16a34a]"  />
                                <StatPill value={entry.lessons_completed} label="lessons" color="text-[#f97316]"  />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {!loading && !error && leaderboard.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Rankings update in real-time based on total $READS tokens earned 🏆
                    </p>
                </div>
            )}
        </div>
    );
};

export default LeaderboardWidget;
