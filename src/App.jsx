import { useState, useEffect, lazy, Suspense, Component } from 'react';
import {
  Award, LayoutDashboard, BookOpen, Wallet, User, Grid,
  Bell, Shield, School, Settings as SettingsIcon,
  GraduationCap, ShoppingBag, ClipboardList, Sparkles, Trophy
} from 'lucide-react';

import { api } from './services/api.js';

// ── Modules ───────────────────────────────────────────────────────────────────
import WelcomePage          from './modules/welcome/WelcomePage.jsx';
import AuthModule           from './modules/auth/AuthModule.jsx';
import ResetPasswordPage    from './modules/auth/ResetPasswordPage.jsx';
import AcceptInvitePage     from './modules/auth/AcceptInvitePage.jsx';
const ClaimPage = lazy(() => import('./modules/wallet/ClaimPage.jsx'));
import LoadingScreen        from './components/LoadingScreen.jsx';
import Dashboard            from './modules/dashboard/Dashboard.jsx';
import LearnModule          from './modules/learn/LearnModule.jsx';
import WalletModule         from './modules/wallet/WalletModule.jsx';
import ProfileModule        from './modules/profile/ProfileModule.jsx';
import SettingsModule       from './modules/settings/SettingsModule.jsx';
import NotificationInbox    from './modules/notifications/NotificationInbox.jsx';
import SchoolModule         from './modules/school/SchoolModule.jsx';
import AdminModule          from './modules/admin/AdminModule.jsx';
import PartnerModule        from './modules/partner/PartnerModule.jsx';

// ─────────────────────────────────────────────
// Claim page error boundary + loading fallback
// ─────────────────────────────────────────────
class ClaimErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen bg-reads-cream flex flex-col items-center justify-center p-6 gap-4 text-center">
        <div className="w-16 h-16 bg-reads-navy rounded-3xl flex items-center justify-center shadow-lg">
          <span className="text-reads-gold font-black text-2xl">₳</span>
        </div>
        <p className="font-black text-reads-navy text-lg">Failed to load claim page</p>
        <p className="text-reads-muted text-sm">Check your connection and try again.</p>
        <button onClick={() => window.location.reload()}
          className="bg-reads-navy text-white font-bold px-6 py-3 rounded-2xl text-sm mt-2">
          Retry
        </button>
      </div>
    );
    return this.props.children;
  }
}

const ClaimFallback = () => (
  <div className="min-h-screen bg-reads-cream flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 bg-reads-navy rounded-3xl flex items-center justify-center shadow-lg">
      <span className="text-reads-gold font-black text-2xl">₳</span>
    </div>
    <p className="font-black text-reads-navy text-xl">$READS Claim</p>
    <div className="flex gap-1.5 mt-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-reads-green animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
    <p className="text-reads-muted text-sm">Loading wallet module…</p>
  </div>
);

// ─────────────────────────────────────────────
// Coming Soon overlay for locked Phase 2+ features
// ─────────────────────────────────────────────
const ComingSoon = ({ label, onBack }) => (
  <div className="px-4 pt-10 pb-8 flex flex-col items-center text-center animate-fade-in">
    <div className="w-20 h-20 rounded-3xl bg-reads-navy flex items-center justify-center mb-5">
      <span className="text-3xl">🚀</span>
    </div>
    <h2 className="font-display font-black text-reads-navy text-2xl mb-2">{label}</h2>
    <p className="text-reads-muted text-sm mb-1 max-w-xs">
      This feature is coming in Phase 2 of the $READS platform.
    </p>
    <p className="text-reads-muted text-xs mb-8 max-w-xs">
      Focus on learning and earning now — {label.toLowerCase()} launches soon!
    </p>
    <div className="w-full max-w-xs reads-card p-4 mb-6 text-left space-y-2">
      <p className="text-reads-navy font-bold text-xs uppercase tracking-wide mb-2">Phase 2 includes</p>
      {['Exam Registration', 'Vetted Tutors', 'Smart Challenge', 'EduContent Marketplace', 'AI Tutor', 'NFT Certificates'].map(f => (
        <div key={f} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-reads-green flex-shrink-0" />
          <span className="text-reads-muted text-xs">{f}</span>
        </div>
      ))}
    </div>
    <button onClick={onBack}
      className="reads-btn-secondary w-full max-w-xs">
      ← Back to More
    </button>
  </div>
);

// ─────────────────────────────────────────────
// "More" tile grid
// ─────────────────────────────────────────────
const MoreModule = ({ onNavigate }) => {
  // Phase 1 live features
  const livetiles = [
    { label: 'My School',    icon: School,        view: 'school',       color: '#16A34A', bg: '#f0fdf4' },
    { label: 'Notifications',icon: Bell,          view: 'notifications',color: '#F59E0B', bg: '#fff7ed' },
    { label: 'Settings',     icon: SettingsIcon,  view: 'settings',     color: '#6B7280', bg: '#f9fafb' },
  ];

  // Phase 2+ features — locked with Coming Soon
  const soonTiles = [
    { label: 'Tutors',       icon: GraduationCap, view: 'tutors',      color: '#6366F1', bg: '#eef2ff' },
    { label: 'Exams',        icon: ClipboardList, view: 'exams',       color: '#0D7A6E', bg: '#f0fdfa' },
    { label: 'Marketplace',  icon: ShoppingBag,   view: 'marketplace', color: '#D4A017', bg: '#fffbeb' },
    { label: 'AI Tutor',     icon: Sparkles,      view: 'ai-tutor',    color: '#7C3AED', bg: '#f5f3ff' },
    { label: 'Challenge',    icon: Trophy,        view: 'challenge',   color: '#FFD700', bg: '#1a2a4a' },
    { label: 'My Results',   icon: Award,         view: 'student-portal', color: '#0D1F3C', bg: '#f0fdf4' },
  ];

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <h2 className="font-display font-black text-reads-navy text-xl mb-5">More</h2>

      {/* Live */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {livetiles.map(({ label, icon: Icon, view, color, bg }) => (
          <button key={view} onClick={() => onNavigate(view)}
            className="flex flex-col items-start gap-3 p-5 reads-card active:scale-95 transition-transform text-left">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={24} style={{ color }} />
            </div>
            <p className="text-reads-navy font-bold text-sm">{label}</p>
          </button>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-reads-muted text-xs font-bold uppercase tracking-wider px-2">Coming in Phase 2</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {soonTiles.map(({ label, icon: Icon, view, color, bg }) => (
            <button key={view} onClick={() => onNavigate(view)}
              className="relative flex flex-col items-start gap-3 p-5 reads-card opacity-60 text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={24} style={{ color }} />
              </div>
              <p className="text-reads-navy font-bold text-sm">{label}</p>
              <span className="absolute top-2 right-2 bg-reads-navy text-white text-[9px] font-black px-2 py-0.5 rounded-full">SOON</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Bottom Navigation Bar
// ─────────────────────────────────────────────
const BottomNav = ({ view, onNavigate, isAdmin, unreadCount }) => {
  const tabs = [
    { name: 'Home',    icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Learn',   icon: BookOpen,        view: 'learn' },
    { name: 'Wallet',  icon: Wallet,          view: 'wallet' },
    { name: 'Profile', icon: User,            view: 'profile' },
    { name: 'More',    icon: Grid,            view: 'more' },
  ];
  if (isAdmin) tabs.push({ name: 'Admin', icon: Shield, view: 'admin' });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.07)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 pb-safe">
        {tabs.map((tab) => {
          const active = view === tab.view || (tab.view === 'more' && !['dashboard','learn','wallet','profile'].includes(view));
          return (
            <button key={tab.name} onClick={() => onNavigate(tab.view)}
              className="flex flex-col items-center gap-0.5 py-3 px-3 min-w-[54px] relative transition-colors">
              {/* Active dot */}
              {active && <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-reads-green rounded-full" />}
              <tab.icon
                size={22}
                className={`transition-colors ${active ? 'text-reads-green' : 'text-reads-muted'}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-reads-green' : 'text-reads-muted'}`}>
                {tab.name}
              </span>
              {/* Unread badge on Profile */}
              {tab.view === 'more' && unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-reads-red text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────
// Top Bar (logo + bell)
// ─────────────────────────────────────────────
const TopBar = ({ unreadCount, onBell }) => (
  <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
    <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-reads-navy rounded-xl flex items-center justify-center">
          <img src="/assets/reads-logo.png" alt="$READS" className="w-6 h-6 object-contain" />
        </div>
        <span className="font-display font-black text-reads-navy text-base">$READS</span>
      </div>
      <button onClick={onBell}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
        <Bell size={20} className="text-reads-navy" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-reads-red text-white text-xs font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [view, setView]               = useState('welcome');
  const [isLoading, setIsLoading]     = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Detect special URL paths
  const path = window.location.pathname;
  const isPasswordReset = path === '/reset-password';
  const isStaffInvite   = path === '/accept-invite';
  const isClaimPage     = path === '/claim';

  const navigate = (newView) => setView(newView);

  const handleLoginSuccess = async () => {
    const userData = await api.auth.me();
    if (!userData) { handleLogout(); return; }
    const [stats, balance, notifData] = await Promise.allSettled([
      api.profile.getStats(),
      api.wallet.getBalance(),
      api.notifications.getUnreadCount(),
    ]);
    const s = stats.status === 'fulfilled' ? stats.value : {};
    setUser({
      ...userData,
      lessons_completed: s.lessons_completed ?? 0,
      quizzes_taken: s.quizzes_taken ?? 0,
    });
    setTokenBalance(balance.status === 'fulfilled' ? balance.value : 0);
    setUnreadCount(notifData.status === 'fulfilled' ? notifData.value?.count ?? 0 : 0);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    setUser(null);
    setTokenBalance(0);
    setUnreadCount(0);
    setView('welcome');
  };

  const [globalToast, setGlobalToast] = useState(null);

  // Session restore + session-expired listener
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await handleLoginSuccess();
      } else {
        setView('welcome');
      }
      setIsLoading(false);
    };
    restore();

    const onExpired = () => {
      setUser(null);
      setTokenBalance(0);
      setUnreadCount(0);
      setView('auth');
      // Small delay so AuthModule mounts before showing the toast
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('reads:show-toast', {
          detail: { msg: 'Session expired. Please log in again.', type: 'error' }
        }));
      }, 100);
    };
    window.addEventListener('reads:session-expired', onExpired);

    const onToast = (e) => {
      setGlobalToast(e.detail);
      setTimeout(() => setGlobalToast(null), 4000);
    };
    window.addEventListener('reads:show-toast', onToast);
    return () => {
      window.removeEventListener('reads:session-expired', onExpired);
      window.removeEventListener('reads:show-toast', onToast);
    };
  }, []);

  // Content protection — disable right-click, text selection, copy, screenshot keys
  useEffect(() => {
    const noContext  = (e) => e.preventDefault();
    const noCopy     = (e) => { if (e.type === 'copy' || e.type === 'cut') e.preventDefault(); };
    const noKeys     = (e) => {
      // Block PrintScreen, Ctrl+P (print), Ctrl+S (save), Ctrl+U (source)
      if (e.key === 'PrintScreen') e.preventDefault();
      if (e.ctrlKey && ['p','s','u'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const noSelect   = () => { if (window.getSelection) window.getSelection().removeAllRanges(); };

    document.addEventListener('contextmenu', noContext);
    document.addEventListener('copy',        noCopy);
    document.addEventListener('cut',         noCopy);
    document.addEventListener('keydown',     noKeys);
    document.addEventListener('keyup',       (e) => { if (e.key === 'PrintScreen') noSelect(); });

    return () => {
      document.removeEventListener('contextmenu', noContext);
      document.removeEventListener('copy',        noCopy);
      document.removeEventListener('cut',         noCopy);
      document.removeEventListener('keydown',     noKeys);
    };
  }, []);

  // Refresh balance on wallet/dashboard view
  useEffect(() => {
    if (user && (view === 'dashboard' || view === 'wallet')) {
      api.wallet.getBalance().then(setTokenBalance);
    }
  }, [view, user]);

  // ── Special routes ──────────────────────────────────────────────────────────
  if (isStaffInvite)   return <AcceptInvitePage />;
  if (isPasswordReset) return <ResetPasswordPage />;
  if (isClaimPage)     return <ClaimErrorBoundary><Suspense fallback={<ClaimFallback />}><ClaimPage /></Suspense></ClaimErrorBoundary>;
  if (isLoading)       return <LoadingScreen />;

  // ── Unauthenticated ─────────────────────────────────────────────────────────
  if (!user) {
    if (view === 'welcome') return <WelcomePage onGetStarted={() => setView('login')} />;
    return (
      <>
        <AuthModule onLoginSuccess={handleLoginSuccess} />
        {globalToast && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in
            ${globalToast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-reads-green border border-green-200'}`}>
            {globalToast.msg}
          </div>
        )}
      </>
    );
  }

  // ── Partner portal ──────────────────────────────────────────────────────────
  if (user.account_type === 'partner') {
    // School partners — Phase 1 live
    if (!user.partner_type || user.partner_type === 'school') {
      return <PartnerModule user={user} onLogout={handleLogout} />;
    }
    // CBT centre & Tutor portals — Phase 2 locked
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-reads-navy flex items-center justify-center mb-5">
          <span className="text-3xl">🚀</span>
        </div>
        <h2 className="font-display font-black text-reads-navy text-2xl mb-2">
          {user.partner_type === 'cbt_centre' ? 'CBT Centre Portal' : 'Tutor Portal'}
        </h2>
        <p className="text-reads-muted text-sm mb-6 max-w-xs">
          Your application is approved. This portal launches in Phase 2 — we will notify you when it is ready.
        </p>
        <button onClick={handleLogout} className="reads-btn-secondary">Sign Out</button>
      </div>
    );
  }

  // ── Main student app ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <TopBar unreadCount={unreadCount} onBell={() => setShowNotifications(true)} />

      {/* Notification drawer */}
      {showNotifications && (
        <NotificationInbox
          onClose={() => setShowNotifications(false)}
          onUnreadCountChange={setUnreadCount}
        />
      )}

      <main className="max-w-lg mx-auto w-full pb-24 pt-14 min-h-screen">

        {view === 'dashboard' && (
          <Dashboard
            user={user}
            wallet={{ balance: tokenBalance }}
            onNavigate={navigate}
          />
        )}

        {view === 'learn' && (
          <LearnModule onUpdateWallet={setTokenBalance} />
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
            tokenBalance={tokenBalance}
            onLogout={handleLogout}
            onUserUpdate={setUser}
          />
        )}

        {view === 'settings' && <SettingsModule />}

        {view === 'school' && (
          <SchoolModule tokenBalance={tokenBalance} onBalanceUpdate={setTokenBalance} />
        )}

        {/* Phase 2+ — Coming Soon */}
        {view === 'student-portal' && (
          <ComingSoon label="My Results" onBack={() => navigate('more')} />
        )}
        {view === 'challenge' && (
          <ComingSoon label="Challenge" onBack={() => navigate('more')} />
        )}
        {view === 'tutors' && (
          <ComingSoon label="Tutors" onBack={() => navigate('more')} />
        )}
        {view === 'exams' && (
          <ComingSoon label="Exams" onBack={() => navigate('more')} />
        )}
        {view === 'marketplace' && (
          <ComingSoon label="Marketplace" onBack={() => navigate('more')} />
        )}
        {view === 'ai-tutor' && (
          <ComingSoon label="AI Tutor" onBack={() => navigate('more')} />
        )}

        {view === 'notifications' && (
          <NotificationInbox
            onClose={() => navigate('more')}
            onUnreadCountChange={setUnreadCount}
          />
        )}

        {view === 'admin' && user?.is_admin && (
          <AdminModule currentUserId={user.id} />
        )}

        {view === 'more' && (
          <MoreModule onNavigate={navigate} />
        )}

      </main>

      <BottomNav
        view={view}
        onNavigate={navigate}
        isAdmin={user?.is_admin}
        unreadCount={unreadCount}
      />
    </div>
  );
}
