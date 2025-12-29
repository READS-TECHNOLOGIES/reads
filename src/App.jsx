import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Wallet, User, Settings as SettingsIcon, Menu, X, Sun, Moon, LogOut, Shield } from 'lucide-react';
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

// --- Helper Components ---

const ThemeToggle = ({ onClick, isDark }) => (
    <button 
        onClick={onClick} 
        className="p-2 rounded-full hover:bg-primary-gray dark:hover:bg-dark-card-light transition-colors"
    >
        {isDark ? <Sun className="text-orange" size={20} /> : <Moon className="text-cyan" size={20} />}
    </button>
);

// --- Animated Loading Screen Component ---
const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-navy via-dark-bg to-primary-navy">
        <div className="relative flex flex-col items-center">
            {/* Rotating Spinner Ring */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-transparent border-t-cyan border-r-yellow-400 rounded-full animate-spin-slow"></div>
            </div>
            
            {/* Second Spinner Ring (opposite direction) */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-4 border-transparent border-b-orange border-l-cyan-light rounded-full animate-spin-reverse-slow"></div>
            </div>

            {/* Logo with Pulse Animation */}
            <div className="relative z-10 animate-pulse-slower">
                <img 
                    src={readsLogo} 
                    alt="$READS Logo" 
                    className="w-24 h-24 object-contain drop-shadow-2xl"
                />
            </div>

            {/* Loading Text */}
            <div className="mt-8 flex flex-col items-center space-y-2">
                <h2 className="text-2xl font-bold text-cyan animate-fade-in">
                    $READS
                </h2>
                <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-cyan rounded-full animate-bounce-slow" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce-slow" style={{ animationDelay: '200ms' }}></span>
                    <span className="w-2 h-2 bg-orange rounded-full animate-bounce-slow" style={{ animationDelay: '400ms' }}></span>
                </div>
            </div>
        </div>

        <style jsx>{`
            @keyframes spin-reverse-slow {
                from {
                    transform: rotate(360deg);
                }
                to {
                    transform: rotate(0deg);
                }
            }

            @keyframes pulse-slower {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                }
            }

            @keyframes fade-in {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes bounce-slow {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-8px);
                }
            }

            .animate-spin-slow {
                animation: spin 4s linear infinite;
            }

            .animate-spin-reverse-slow {
                animation: spin-reverse-slow 5s linear infinite;
            }

            .animate-pulse-slower {
                animation: pulse-slower 4s ease-in-out infinite;
            }

            .animate-fade-in {
                animation: fade-in 1.2s ease-out;
            }

            .animate-bounce-slow {
                animation: bounce-slow 1.5s ease-in-out infinite;
            }
        `}</style>
    </div>
);

// --- Main Application Component ---
export default function App() {
  // Check if this is the password reset page
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  const [user, setUser] = useState(null); // Full user profile from /user/profile
  const [tokenBalance, setTokenBalance] = useState(0); // Current wallet balance
  const [view, setView] = useState('welcome'); // 'welcome', 'login', 'dashboard', 'learn', etc.
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', 'forgot-password'
  const [subView, setSubView] = useState(''); // Used by LearnModule
  const [navPayload, setNavPayload] = useState(null); // Data passed to sub-modules
  const [darkMode, setDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Handlers ---
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const handleNavigate = (newView, newSubView = '', payload = null) => {
    setView(newView);
    setSubView(newSubView);
    setNavPayload(payload);
    setSidebarOpen(false); // Close sidebar after navigation on mobile
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setTokenBalance(0);
    setView('login');
    setAuthView('login');
    setSidebarOpen(false);
  };

  const handleLoginSuccess = async () => {
    const userData = await api.auth.me();
    if (userData) {
        setUser(userData);
        // Fetch initial balance
        const balance = await api.wallet.getBalance();
        setTokenBalance(balance);
        handleNavigate('dashboard');
    } else {
        // Should not happen if token is valid, but fallback
        handleLogout();
    }
  };


  // 1. Check for User Session and Fetch Initial Data on App Load
  useEffect(() => {
    const checkSession = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            await handleLoginSuccess(); // Attempts to fetch user data and balance
        } else {
            // No token, show welcome page
            setView('welcome');
        }
        setIsLoading(false);
    };

    checkSession();
  }, []);

  // 2. Dark Mode Toggle Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 3. Update Balance on mount (in case they navigated back to dashboard)
  useEffect(() => {
      if (view === 'dashboard' && user) {
          api.wallet.getBalance().then(setTokenBalance);
      }
  }, [view, user]);


  // --- Render Auth or App Shell ---

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Show welcome page if no user and view is 'welcome'
  if (!user && view === 'welcome') {
    return <WelcomePage onGetStarted={() => setView('login')} />;
  }
  
  // Show auth module if no user (and not on welcome page)
  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-light-general dark:bg-dark-general p-4">
            <AuthModule 
                view={authView} 
                onLoginSuccess={handleLoginSuccess} 
                onNavigate={setAuthView} 
                logoUrl="/logo-placeholder.png"
            />
        </div>
    );
  }

  // --- Navigation Items ---
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Learn', icon: BookOpen, view: 'learn', subView: 'categories' },
    { name: 'Wallet', icon: Wallet, view: 'wallet' },
    { name: 'Profile', icon: User, view: 'profile' },
    { name: 'Settings', icon: SettingsIcon, view: 'settings' },
  ];
  
  // Conditionally add Admin Panel to navigation
  if (user?.is_admin) {
      navItems.push({ name: 'Admin Panel', icon: Shield, view: 'admin' });
  }

  // Get current page name
  const currentPageName = navItems.find(item => item.view === view)?.name || 'Dashboard';


  return (
    <div className={`flex min-h-screen bg-light-general dark:bg-dark-general ${darkMode ? 'dark' : ''}`}>
      
      {/* --- Sidebar (Desktop & Mobile) --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                   w-64 bg-primary-navy dark:bg-dark-card shadow-xl md:shadow-none p-4 flex flex-col transition-transform duration-300 border-r border-cyan/20`}
      >
        <div className="flex justify-between items-center mb-8">
            <div className='flex items-center gap-3'>
                <img src={readsLogo} alt="$READS Logo" className="w-8 h-8 rounded-lg object-contain" />
                <span className="font-bold text-lg text-card-light">$READS</span>
            </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1">
            <X size={24} className='text-card-light' />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <button
              key={item.name}
              onClick={() => handleNavigate(item.view, item.subView)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors font-medium 
                         ${view === item.view 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' 
                            : 'text-yellow-400 hover:bg-dark-card-light hover:text-yellow-300'}`
                        }
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>

        {/* Footer/Logout */}
        <div className="mt-8 pt-4 border-t border-cyan/20 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-card-light">
                    <img 
                        src={user.avatar} 
                        className="w-8 h-8 rounded-full object-cover border-2 border-cyan" 
                        alt="Profile" 
                    />
                    <span className='text-sm font-semibold truncate max-w-[100px]'>{user.name}</span>
                </div>
                <ThemeToggle onClick={toggleTheme} isDark={darkMode} />
            </div>

            <button
                onClick={handleLogout}
                className="w-full py-2 rounded-xl text-sm bg-orange/20 text-orange hover:bg-orange/30 transition-colors flex items-center justify-center gap-2 font-medium border border-orange/30"
            >
                <LogOut size={16} /> Log Out
            </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header (Shows on mobile) */}
        <header className="p-4 flex justify-between items-center bg-primary-navy dark:bg-dark-card md:hidden border-b border-cyan/20 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className='text-card-light'><Menu /></button>
          <span className="font-bold text-card-light">$READS</span>
          <span className='w-6 h-6'></span> {/* Placeholder for alignment */}
        </header>

        {/* Desktop Header - Shows active tab name */}
        <div className="hidden md:block p-6 bg-primary-navy dark:bg-dark-card border-b border-cyan/20">
          <h1 className="text-2xl font-bold text-yellow-400">
            {currentPageName}
          </h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          <div className="max-w-4xl mx-auto w-full pb-20">
            {view === 'dashboard' && <Dashboard user={user} wallet={{balance: tokenBalance}} onNavigate={handleNavigate} />}
            
            {view === 'learn' && (
              <LearnModule 
                subView={subView} 
                activeData={navPayload} 
                onNavigate={handleNavigate} 
                // Updates balance in App.jsx state after a successful quiz
                onUpdateWallet={setTokenBalance} 
              />
            )}
            
            {view === 'wallet' && <WalletModule balance={tokenBalance} onUpdateBalance={setTokenBalance} />}
            
            {view === 'profile' && <ProfileModule user={user} onLogout={handleLogout} />}
            
            {view === 'settings' && <SettingsModule darkMode={darkMode} toggleTheme={toggleTheme} />}

            {/* --- ADMIN MODULE RENDERED HERE --- */}
            {view === 'admin' && <AdminModule user={user} />}
          </div>
        </div>
      </main>
    </div>
  );
}