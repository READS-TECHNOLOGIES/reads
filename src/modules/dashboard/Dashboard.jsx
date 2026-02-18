import { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Award, ArrowRight, Clock } from 'lucide-react';
import { api } from '../../services/api';
import LeaderboardWidget from '../leaderboard/LeaderboardWidget';

export default function Dashboard({ user, wallet, onNavigate }) {
    const [stats, setStats] = useState({ lessons_completed: 0, quizzes_taken: 0 });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, activityData] = await Promise.all([
                api.profile.getStats(),
                api.wallet.getHistory()
            ]);
            setStats(statsData);
            setRecentActivity(activityData.slice(0, 3)); // Show only 3 most recent
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Welcome Section */}
            <div className="bg-white border-b border-gray-100 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
                            alt={user.name}
                            className="w-14 h-14 rounded-full border-2 border-[#16a34a]"
                        />
                        <div>
                            <p className="text-sm text-gray-500">Welcome back,</p>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                {user.name.split(' ')[0]}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Token Balance Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Token Balance</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black text-gray-900">{wallet.balance}</h2>
                            <span className="text-xl font-bold text-[#f97316]">$READS</span>
                        </div>
                        <div className="w-14 h-14 bg-[#f97316] rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl">$</span>
                        </div>
                    </div>
                    {recentActivity.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 text-sm">
                            <TrendingUp size={14} className="text-[#16a34a]" />
                            <span className="font-semibold text-[#16a34a]">
                                +{recentActivity[0].tokens_earned} earned today
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                            <BookOpen size={20} className="text-[#16a34a]" />
                        </div>
                        <p className="text-2xl font-black text-gray-900">{stats.lessons_completed}</p>
                        <p className="text-sm text-gray-500">Lessons Completed</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                            <Award size={20} className="text-[#f97316]" />
                        </div>
                        <p className="text-2xl font-black text-gray-900">{stats.quizzes_taken}</p>
                        <p className="text-sm text-gray-500">Tests Passed</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => onNavigate('learn', 'categories')}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2"
                        >
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                <BookOpen size={20} className="text-[#16a34a]" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Start Learning</span>
                        </button>
                        <button
                            onClick={() => onNavigate('learn', 'categories')}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2"
                        >
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Award size={20} className="text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Take a Test</span>
                        </button>
                        <button
                            onClick={() => onNavigate('wallet')}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2"
                        >
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                <TrendingUp size={20} className="text-[#f97316]" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Wallet</span>
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                        <button
                            onClick={() => onNavigate('wallet')}
                            className="text-sm font-semibold text-[#16a34a] hover:text-green-700 flex items-center gap-1"
                        >
                            View all
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                        <div className="h-5 bg-gray-200 rounded w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                            <Clock size={48} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-500 font-medium">No recent activity</p>
                            <p className="text-gray-400 text-sm mt-1">Complete lessons to start earning!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <TrendingUp size={20} className="text-[#16a34a]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-gray-900 truncate">
                                                {activity.lesson_title}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {new Date(activity.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-sm text-[#16a34a]">
                                                +{activity.tokens_earned} $READS
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Leaderboard */}
                <div className="mb-6">
                    <LeaderboardWidget currentUserId={user.id} />
                </div>
            </div>
        </div>
    );
}
