import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

const NotificationInbox = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await api.user.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.user.markNotificationRead(notificationId);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.user.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} className="text-[#16a34a]" />;
            case 'error': return <AlertCircle size={18} className="text-red-600" />;
            case 'warning': return <AlertTriangle size={18} className="text-[#f97316]" />;
            default: return <Info size={18} className="text-blue-600" />;
        }
    };

    const getStyle = (type) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-orange-50 border-orange-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 px-4 py-3 border-b border-gray-100">
                    {['all', 'unread', 'read'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                filter === f
                                    ? 'bg-[#16a34a] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="ml-auto text-xs font-semibold text-[#16a34a] hover:text-green-700"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Notifications list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
                            <p className="text-sm text-gray-500 mt-3">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell size={48} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-500 font-medium">No notifications</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {filter === 'unread' ? "You're all caught up!" : "Check back later"}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                    getStyle(notification.type)
                                } ${notification.is_read ? 'opacity-60' : 'shadow-sm'}`}
                            >
                                {!notification.is_read && (
                                    <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-gray-900 mb-1">
                                            {notification.title}
                                        </h3>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationInbox;
