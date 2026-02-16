import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Wallet, User, Shield, LogOut } from 'lucide-react';
import readsLogo from '../assets/reads-logo.png';

// --- SERVICE & MODULE IMPORTS ---
import { api } from './services/api';
import WelcomePage from './modules/welcome/WelcomePage.jsx';
import AuthModule from './modules/auth/AuthModule.jsx';
import ResetPasswordPage from './modules/auth/ResetPasswordPage.jsx';
import Dashboard from './modules/dashboard/Dashboard.jsx';
import LearnModule from './modules/learn/LearnModule.jsx';
import WalletModule from './modules/wallet/WalletModule.jsx';
import ProfileModule from './modules/profile/ProfileModule.jsx';
import SettingsModule from './modules/settings/SettingsModule.jsx';
import AdminModule from './modules/admin/AdminModule.jsx';

// ─────────────────────────────────────────────
// Loading Screen
// ─────────────────────────────────────────────
const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-reads-cream relative overflow-hidden">
      {/* Soft glow */}
      <div className="absolute w-56 h-56 bg-reads-green/10 rounded-full blur-3xl" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <img src={readsLogo} alt="$READS Logo" className="w-28 h-28 object-contain" />
        <p className="text-reads-navy font-display font-black text-2xl tracking-tight">$READS</p>
        <p className="text-reads-muted text-sm">Learn. Earn. Excel.</p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-reads-gold via-reads-green to-reads-green-light transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Bottom Navigation Bar
// ─────────────────────────────────────────────
const BottomNav = ({ view, onNavigate, isAdmin }) => {
  const tabs = [
    { name: 'Home',    icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Learn',   icon: BookOpen,        view: 'learn',    subView: 'categories' },
    { name: 'Wallet',  icon: Wallet,          view: 'wallet' },
    { name: 'Profile', icon: User,            view: 'profile' },
  ];

  if (isAdmin) {
    tabs.push({ name: 'Admin', icon: Shield, view: 'admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2">
        {tabs.map(tab => {
          const active = view === tab.view;
          return (
            <button
              key={tab.name}
              onClick={() => onNavigate(tab.view, tab.subView || '')}
              className="flex flex-col items-center gap-1 py-3 px-4 min-w-[60px] transition-colors"
            >
              <tab.icon
                size={22}
                className={active ? 'text-reads-green' : 'text-reads-muted'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-semibold ${
                  active ? 'text-reads-green' : 'text-reads-muted'
                }`}
              >
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
export default function App() {
  // Password reset route
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [view, setView] = useState('welcome');
  const [authView, setAuthView] = useState('login');
  const [subView, setSubView] = useState('');
  const [navPayload, setNavPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Navigation handler ──
  const handleNavigate = (newView, newSubView = '', payload = null) => {
    setView(newView);
    setSubView(newSubView);
    setNavPayload(payload);
  };

  // ── Logout ──
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setTokenBalance(0);
    setView('login');
    setAuthView('login');
  };

  // ── Login success ──
  const handleLoginSuccess = async () => {
    const userData = await api.auth.me();
    if (userData) {
      setUser(userData);
      const balance = await api.wallet.getBalance();
      setTokenBalance(balance);
      handleNavigate('dashboard');
    } else {
      handleLogout();
    }
  };

  // ── Session check on mount ──
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await handleLoginSuccess();
      } else {
        setView('welcome');
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  // ── Refresh balance when returning to dashboard ──
  useEffect(() => {
    if (view === 'dashboard' && user) {
      api.wallet.getBalance().then(setTokenBalance);
    }
  }, [view, user]);

  // ── Loading screen ──
  if (isLoading) return <LoadingScreen />;

  // ── Welcome page ──
  if (!user && view === 'welcome') {
    return <WelcomePage onGetStarted={() => setView('login')} />;
  }

  // ── Auth screens (login / signup / forgot-password) ──
  if (!user) {
    return (
      <AuthModule
        view={authView}
        onLoginSuccess={handleLoginSuccess}
        onNavigate={setAuthView}
      />
    );
  }

  // ── Authenticated app shell ──
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Page content (padded for bottom nav) ── */}
      <main className="max-w-lg mx-auto w-full pb-24 min-h-screen">

        {view === 'dashboard' && (
          <Dashboard
            user={user}
            wallet={{ balance: tokenBalance }}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'learn' && (
          <LearnModule
            onUpdateWallet={setTokenBalance}
          />
        )}

        {view === 'wallet' && (
          <WalletModule
            balance={tokenBalance}
            onUpdateBalance={setTokenBalance}
          />
        )}

        {view === 'profile' && (
          <ProfileModule
            user={user}
            onLogout={handleLogout}
          />
        )}

        {view === 'settings' && (
          <SettingsModule />
        )}

        {view === 'admin' && user?.is_admin && (
          <AdminModule user={user} />
        )}

      </main>

      {/* ── Bottom navigation ── */}
      <BottomNav
        view={view}
        onNavigate={handleNavigate}
        isAdmin={user?.is_admin}
      />

    </div>
  );
}
