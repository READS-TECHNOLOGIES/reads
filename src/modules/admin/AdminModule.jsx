import { useState } from 'react';
import { LayoutDashboard, BookOpen, Plus, Users, AlertTriangle, Bell, X, CheckCircle, XCircle } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import LessonCreateForm from './LessonCreateForm';
import ManageContent from './ManageContent';
import UserManagement from './UserManagement';
import SuspiciousAttemptsMonitor from './SuspiciousAttemptsMonitor';
import NotificationManager from './NotificationManager';

// ── Toast notification ────────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl max-w-sm
            ${isSuccess ? 'bg-[#16a34a] text-white' : 'bg-red-500 text-white'}`}
        >
            {isSuccess
                ? <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                : <XCircle size={18} className="flex-shrink-0 mt-0.5" />}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={onDismiss} className="opacity-75 hover:opacity-100 ml-1">
                <X size={16} />
            </button>
        </div>
    );
};

// ── Tab configuration ─────────────────────────────────────────────────────────
const TABS = [
    { id: 'dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'create',         label: 'Create Lesson',    icon: Plus             },
    { id: 'manage',         label: 'Manage Content',   icon: BookOpen         },
    { id: 'users',          label: 'Users',            icon: Users            },
    { id: 'notifications',  label: 'Notifications',    icon: Bell             },
    { id: 'security',       label: 'Security',         icon: AlertTriangle    },
];

// ── Main AdminModule ──────────────────────────────────────────────────────────
const AdminModule = ({ currentUserId }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [toast, setToast] = useState(null);

    const showToast = (t) => {
        setToast(t);
        setTimeout(() => setToast(null), 4000);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':      return <AdminDashboard onToast={showToast} />;
            case 'create':         return <LessonCreateForm onToast={showToast} onSuccess={() => setActiveTab('manage')} />;
            case 'manage':         return <ManageContent onToast={showToast} />;
            case 'users':          return <UserManagement onToast={showToast} currentUserId={currentUserId} />;
            case 'notifications':  return <NotificationManager onToast={showToast} />;
            case 'security':       return <SuspiciousAttemptsMonitor onToast={showToast} />;
            default:               return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* ── Top bar ── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-16 gap-4">
                        {/* Brand */}
                        <div className="flex items-center gap-2.5 mr-6">
                            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-extrabold">$R</span>
                            </div>
                            <span className="font-black text-gray-900 text-base tracking-tight">
                                READS <span className="text-[#16a34a] font-medium">Admin</span>
                            </span>
                        </div>

                        {/* Nav tabs */}
                        <nav className="flex items-center gap-1 overflow-x-auto flex-1">
                            {TABS.map(({ id, label, icon: Icon }) => {
                                const isActive = activeTab === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                            isActive
                                                ? 'bg-[#16a34a] text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Icon size={15} />
                                        <span className="hidden sm:inline">{label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </header>

            {/* ── Page content ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {renderContent()}
            </main>

            {/* ── Toast ── */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
};

export default AdminModule;
