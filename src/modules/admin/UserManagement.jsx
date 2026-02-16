import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Shield, ShieldOff } from 'lucide-react';
import { api } from '../../services/api';

const UserManagement = ({ onToast, currentUserId }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.admin.getUsers();
            setUsers(data.sort((a, b) => b.is_admin - a.is_admin));
        } catch {
            onToast({ message: 'Failed to load users.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [onToast]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleToggleAdmin = async (userId, currentStatus, userName) => {
        if (userId === currentUserId) {
            onToast({ message: 'You cannot change your own admin status.', type: 'error' });
            return;
        }
        const action = currentStatus ? 'demote' : 'promote';
        if (!window.confirm(`Are you sure you want to ${action} ${userName}?`)) return;
        try {
            await api.admin.promoteUser(userId, !currentStatus);
            onToast({
                message: `✅ ${userName} ${currentStatus ? 'demoted from' : 'promoted to'} admin!`,
                type: 'success',
            });
            fetchUsers();
        } catch (error) {
            onToast({ message: `Failed to update user: ${error.message}`, type: 'error' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <RefreshCw className="animate-spin text-[#16a34a]" size={28} />
                <p className="text-sm text-gray-500">Loading users…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                        <Users size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                        <p className="text-xs text-gray-500">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {users.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Users size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No users found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => (
                        <div
                            key={user.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                        >
                            {/* User info */}
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
                                    alt={user.name}
                                    className="w-11 h-11 rounded-full border-2 border-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                {user.is_admin && (
                                    <span className="flex-shrink-0 text-xs font-bold text-[#16a34a] bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                        Admin
                                    </span>
                                )}
                            </div>

                            {/* Action button */}
                            <button
                                onClick={() => handleToggleAdmin(user.id, user.is_admin, user.name)}
                                disabled={user.id === currentUserId}
                                className={`w-full py-2 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                    user.id === currentUserId
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : user.is_admin
                                        ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white'
                                        : 'bg-green-50 text-[#16a34a] border border-green-200 hover:bg-[#16a34a] hover:text-white'
                                }`}
                            >
                                {user.id === currentUserId ? (
                                    <><ShieldOff size={14} /> You (Cannot Change)</>
                                ) : user.is_admin ? (
                                    <><ShieldOff size={14} /> Demote from Admin</>
                                ) : (
                                    <><Shield size={14} /> Promote to Admin</>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserManagement;
