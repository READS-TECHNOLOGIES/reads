import { useState, useEffect, useCallback } from 'react';
import { Users, BookOpen, List, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

// ── colour tokens matching $READS app ──────────────────────────────────────
// primary green  : #16a34a  (green-700)
// accent orange  : #f97316  (orange-500)
// danger red     : #ef4444  (red-500)
// card bg        : #ffffff / #f8fafc
// text primary   : #0f172a
// text muted     : #64748b

const CARD_CONFIGS = [
    {
        key: 'totalUsers',
        title: 'Total Users',
        icon: Users,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-500',
        text: 'text-blue-700',
    },
    {
        key: 'totalLessons',
        title: 'Total Lessons',
        icon: BookOpen,
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-[#16a34a]',
        text: 'text-[#16a34a]',
    },
    {
        key: 'totalQuizzes',
        title: 'Active Quizzes',
        icon: List,
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        iconBg: 'bg-[#f97316]',
        text: 'text-[#f97316]',
    },
    {
        key: 'suspiciousAttempts',
        title: 'Suspicious Attempts',
        icon: AlertTriangle,
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconBg: 'bg-red-500',
        text: 'text-red-600',
    },
];

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
    </div>
);

const AdminDashboard = ({ onToast }) => {
    const [stats, setStats] = useState({
        totalUsers: 0, totalLessons: 0, totalQuizzes: 0, suspiciousAttempts: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const [users, lessons, suspicious] = await Promise.all([
                api.admin.getUsers(),
                api.admin.getAllLessons(),
                api.admin.getSuspiciousAttempts(10),
            ]);
            setStats({
                totalUsers: users.length,
                totalLessons: lessons.length,
                totalQuizzes: lessons.filter(l => l.quiz_count > 0).length,
                suspiciousAttempts: suspicious.length,
            });
        } catch {
            onToast({ message: 'Failed to load dashboard stats', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    return (
        <div className="space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Platform statistics at a glance</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                    <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading
                    ? [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
                    : CARD_CONFIGS.map(({ key, title, icon: Icon, bg, border, iconBg, text }) => (
                        <div
                            key={key}
                            className={`${bg} border ${border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className={`inline-flex p-3 rounded-xl ${iconBg} mb-4`}>
                                <Icon size={22} className="text-white" />
                            </div>
                            <p className={`text-3xl font-bold ${text}`}>{stats[key]}</p>
                            <p className="text-sm text-gray-500 mt-1">{title}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default AdminDashboard;
