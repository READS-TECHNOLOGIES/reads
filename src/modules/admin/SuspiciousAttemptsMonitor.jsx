import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Ban, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';

const getViolationBadge = (timeSpent, expectedMin) => {
    const ratio = timeSpent / expectedMin;
    if (ratio < 0.3) return { cls: 'bg-red-500 text-white',    label: 'SEVERE'  };
    if (ratio < 0.5) return { cls: 'bg-orange-500 text-white', label: 'HIGH'    };
    if (ratio < 0.7) return { cls: 'bg-yellow-500 text-white', label: 'MEDIUM'  };
    return              { cls: 'bg-blue-500 text-white',   label: 'LOW'     };
};

const getViolationType = (attempt) => {
    const ratio = attempt.total_time_seconds / attempt.expected_min_time;
    if (ratio < 0.3) return 'Extreme Speed Violation';
    if (ratio < 0.5) return 'Time Manipulation Suspected';
    return 'Abnormal Completion Time';
};

const SuspiciousAttemptsMonitor = ({ onToast }) => {
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedAttempt, setExpandedAttempt] = useState(null);

    const fetchAttempts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getSuspiciousAttempts(50);
            setAttempts(data);
        } catch {
            onToast({ message: 'Failed to load suspicious attempts.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <RefreshCw className="animate-spin text-[#16a34a]" size={28} />
                <p className="text-sm text-gray-500">Scanning for suspicious attempts…</p>
            </div>
        );
    }

    const severeCount = attempts.filter(a => a.total_time_seconds / a.expected_min_time < 0.3).length;
    const recentCount = attempts.filter(a => (Date.now() - new Date(a.flagged_at).getTime()) < 86400000).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 rounded-xl">
                        <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Suspicious Quiz Attempts</h3>
                        <p className="text-xs text-gray-500">{attempts.length} flagged attempt{attempts.length !== 1 ? 's' : ''} detected</p>
                    </div>
                </div>
                <button
                    onClick={fetchAttempts}
                    className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-red-500 font-semibold mb-1">Total Flagged</p>
                        <p className="text-3xl font-bold text-red-600">{attempts.length}</p>
                    </div>
                    <Ban size={28} className="text-red-300" />
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-orange-500 font-semibold mb-1">Severe Violations</p>
                        <p className="text-3xl font-bold text-orange-600">{severeCount}</p>
                    </div>
                    <AlertTriangle size={28} className="text-orange-300" />
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-yellow-600 font-semibold mb-1">Last 24 Hours</p>
                        <p className="text-3xl font-bold text-yellow-700">{recentCount}</p>
                    </div>
                    <Clock size={28} className="text-yellow-300" />
                </div>
            </div>

            {/* Attempts list */}
            {attempts.length === 0 ? (
                <div className="text-center py-16 bg-green-50 border border-green-100 rounded-2xl">
                    <CheckCircle size={40} className="mx-auto mb-3 text-[#16a34a]" />
                    <p className="font-bold text-[#16a34a]">No suspicious attempts detected</p>
                    <p className="text-sm text-green-600 mt-1">All quiz submissions appear legitimate</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {attempts.map(attempt => {
                        const badge = getViolationBadge(attempt.total_time_seconds, attempt.expected_min_time);
                        const isExpanded = expandedAttempt === attempt.attempt_id;
                        const violationType = getViolationType(attempt);
                        const pctFaster = (((attempt.expected_min_time - attempt.total_time_seconds) / attempt.expected_min_time) * 100).toFixed(0);
                        const flaggedAt = new Date(attempt.flagged_at);

                        return (
                            <div
                                key={attempt.attempt_id}
                                className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden"
                            >
                                {/* Main row */}
                                <button
                                    onClick={() => setExpandedAttempt(isExpanded ? null : attempt.attempt_id)}
                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-red-50/50 transition-colors"
                                >
                                    {/* Severity */}
                                    <span className={`${badge.cls} text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0`}>
                                        {badge.label}
                                    </span>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-bold text-gray-900 text-sm truncate">{attempt.user_name}</p>
                                            <span className="text-gray-300">·</span>
                                            <p className="text-sm text-gray-500 truncate">{attempt.lesson_title}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                            <span className="text-red-500 font-semibold">
                                                ⚡ {attempt.total_time_seconds}s (min: {attempt.expected_min_time}s)
                                            </span>
                                            <span className="text-amber-600">{pctFaster}% faster than minimum</span>
                                            {attempt.score >= 70 && (
                                                <span className="bg-green-50 text-[#16a34a] border border-green-100 px-2 py-0.5 rounded-full">
                                                    ✓ Passed ({attempt.score}%)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-gray-400">{flaggedAt.toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-400">{flaggedAt.toLocaleTimeString()}</p>
                                    </div>

                                    {/* Expand icon */}
                                    {isExpanded ? (
                                        <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                                    )}
                                </button>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-50">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                            {[
                                                { label: 'Violation Type',  value: violationType },
                                                { label: 'Score',           value: `${attempt.score}%` },
                                                { label: 'Time Spent',      value: `${attempt.total_time_seconds}s` },
                                                { label: 'Min Expected',    value: `${attempt.expected_min_time}s` },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="bg-gray-50 rounded-xl p-3">
                                                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                                                    <p className="text-sm font-bold text-gray-900">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {attempt.user_email && (
                                            <p className="text-xs text-gray-400 mt-3">
                                                User email: <span className="text-gray-600">{attempt.user_email}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SuspiciousAttemptsMonitor;
