import { useState, useEffect, useCallback } from 'react';
import { Bell, Send, RefreshCw, Users, User, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

const INPUT_CLS =
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition-all text-sm';

const LABEL_CLS = 'block text-sm font-semibold text-gray-700 mb-1.5';

const NOTIFICATION_TYPES = [
    { value: 'info', label: 'Info', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { value: 'success', label: 'Success', color: 'text-[#16a34a]', bg: 'bg-green-50', border: 'border-green-200' },
    { value: 'warning', label: 'Warning', color: 'text-[#f97316]', bg: 'bg-orange-50', border: 'border-orange-200' },
    { value: 'error', label: 'Error', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

const NotificationManager = ({ onToast }) => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        recipientType: 'all', // 'all' or 'specific'
        recipientIds: [],
    });
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const data = await api.admin.getUsers();
            setUsers(data);
        } catch (error) {
            onToast({ message: 'Failed to load users', type: 'error' });
        } finally {
            setUsersLoading(false);
        }
    }, [onToast]);

    const fetchRecentNotifications = useCallback(async () => {
        try {
            // This would be an API endpoint that returns recently sent notifications
            // const data = await api.admin.getRecentNotifications();
            // setRecentNotifications(data);
            // For now, leaving empty until backend is ready
        } catch (error) {
            console.error('Failed to load recent notifications:', error);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchRecentNotifications();
    }, [fetchUsers, fetchRecentNotifications]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            }
            return [...prev, userId];
        });
    };

    const selectAllUsers = () => {
        setSelectedUsers(users.map(u => u.id));
    };

    const clearSelection = () => {
        setSelectedUsers([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.message.trim()) {
            onToast({ message: 'Please fill in title and message', type: 'error' });
            return;
        }

        if (formData.recipientType === 'specific' && selectedUsers.length === 0) {
            onToast({ message: 'Please select at least one recipient', type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                title: formData.title,
                message: formData.message,
                type: formData.type,
                recipient_type: formData.recipientType,
                recipient_ids: formData.recipientType === 'specific' ? selectedUsers : null,
            };

            await api.admin.sendNotification(payload);
            
            const recipientCount = formData.recipientType === 'all' ? users.length : selectedUsers.length;
            onToast({ 
                message: `✅ Notification sent to ${recipientCount} user${recipientCount !== 1 ? 's' : ''}!`, 
                type: 'success' 
            });
            
            // Reset form
            setFormData({ title: '', message: '', type: 'info', recipientType: 'all', recipientIds: [] });
            setSelectedUsers([]);
            fetchRecentNotifications();
        } catch (error) {
            onToast({ message: `Failed to send notification: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedType = NOTIFICATION_TYPES.find(t => t.value === formData.type);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                    <Bell size={20} className="text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Send Notifications</h3>
                    <p className="text-xs text-gray-500">Broadcast messages to users on the platform</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Notification Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className={LABEL_CLS}>
                                Notification Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className={INPUT_CLS}
                                placeholder="e.g., New Lessons Added!"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className={LABEL_CLS}>
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={4}
                                className={`${INPUT_CLS} resize-none`}
                                placeholder="Enter your notification message..."
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {formData.message.length} characters
                            </p>
                        </div>

                        {/* Type */}
                        <div>
                            <label className={LABEL_CLS}>Notification Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {NOTIFICATION_TYPES.map(({ value, label, color, bg, border }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: value }))}
                                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                                            formData.type === value
                                                ? `${bg} ${color} ${border}`
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recipient Type */}
                        <div>
                            <label className={LABEL_CLS}>Send To</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, recipientType: 'all' }));
                                        setSelectedUsers([]);
                                    }}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                                        formData.recipientType === 'all'
                                            ? 'bg-green-50 text-[#16a34a] border-green-200'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Users size={16} />
                                    All Users
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, recipientType: 'specific' }))}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                                        formData.recipientType === 'specific'
                                            ? 'bg-green-50 text-[#16a34a] border-green-200'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <User size={16} />
                                    Specific Users
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className={`${selectedType.bg} border ${selectedType.border} rounded-xl p-4`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 bg-white rounded-lg ${selectedType.border} border`}>
                                    <Bell size={16} className={selectedType.color} />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-bold text-sm mb-1 ${selectedType.color}`}>
                                        {formData.title || 'Notification Title'}
                                    </p>
                                    <p className="text-gray-700 text-xs leading-relaxed">
                                        {formData.message || 'Your notification message will appear here...'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-[#16a34a] text-white font-semibold rounded-xl shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <><RefreshCw size={18} className="animate-spin" /> Sending…</>
                            ) : (
                                <><Send size={18} /> Send Notification</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Right: User Selection */}
                {formData.recipientType === 'specific' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Select Recipients</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selectedUsers.length} of {users.length} selected
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllUsers}
                                    className="text-xs font-semibold text-[#16a34a] hover:text-green-700"
                                >
                                    All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {usersLoading ? (
                            <div className="text-center py-8">
                                <RefreshCw className="animate-spin text-[#16a34a] mx-auto mb-2" size={24} />
                                <p className="text-xs text-gray-500">Loading users…</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {users.map(user => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => toggleUserSelection(user.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                                            selectedUsers.includes(user.id)
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-white border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                            selectedUsers.includes(user.id)
                                                ? 'bg-[#16a34a] border-[#16a34a]'
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedUsers.includes(user.id) && (
                                                <CheckCircle size={14} className="text-white" />
                                            )}
                                        </div>
                                        <img
                                            src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full border border-gray-100 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Notifications Section (optional - for future) */}
            {recentNotifications.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Recent Notifications</h4>
                    <div className="space-y-3">
                        {recentNotifications.map((notif, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <Bell size={14} className="text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationManager;
