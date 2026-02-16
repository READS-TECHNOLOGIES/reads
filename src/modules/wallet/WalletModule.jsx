import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  RefreshCw, AlertCircle, Send, Download, History,
  Copy, Check, Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex flex-col items-center justify-center p-16 gap-3">
    <RefreshCw size={28} className="animate-spin text-reads-green" />
    <p className="text-reads-muted text-sm">Loading wallet...</p>
  </div>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today    = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString())     return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
};

const txIcon = (type, amount) => {
  const positive = amount >= 0;
  if (type === 'referral') return { icon: ArrowUpRight, bg: 'bg-blue-50', color: 'text-blue-500' };
  if (!positive)           return { icon: TrendingDown,  bg: 'bg-reads-red-bg', color: 'text-reads-red' };
  return                          { icon: TrendingUp,    bg: 'bg-reads-green-bg', color: 'text-reads-green' };
};

const txLabel = (item) => {
  if (item.lesson_title) return item.lesson_title;
  const map = {
    quiz:     'Earned from Quiz',
    lesson:   'Lesson Completion Reward',
    referral: 'Referral Bonus',
    streak:   'Daily Streak Bonus',
    payment:  'Exam Payment',
    purchase: 'Premium Study Material',
    challenge:'Weekly Challenge Reward',
  };
  return map[item.type] || 'Reward';
};

// ── Main Component ───────────────────────────────────────────────────

const WalletModule = ({ user, balance, onUpdateBalance }) => {
  const [currentBalance, setCurrentBalance] = useState(balance || 0);
  const [history, setHistory]               = useState([]);
  const [summary, setSummary]               = useState({ earned: 0, spent: 0, quizzes: 0 });
  const [walletAddress, setWalletAddress]   = useState(user?.cardano_address || null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [copied, setCopied]                 = useState(false);
  const [showAddress, setShowAddress]       = useState(false);
  const [activeTab, setActiveTab]           = useState('all');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setError('Please log in to view your wallet.'); setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      const [balanceData, historyData, profileData] = await Promise.all([
        api.wallet.getBalance(),
        api.wallet.getHistory(),
        api.auth.me(),
      ]);

      const newBalance = typeof balanceData === 'number' ? balanceData : (balanceData?.token_balance || 0);
      setCurrentBalance(newBalance);
      if (onUpdateBalance) onUpdateBalance(newBalance);

      const txList = historyData || [];
      setHistory(txList);

      const earned  = txList.reduce((s, i) => s + (i.tokens_earned > 0 ? i.tokens_earned : 0), 0);
      const spent   = txList.reduce((s, i) => s + (i.tokens_earned < 0 ? Math.abs(i.tokens_earned) : 0), 0);
      const quizzes = txList.filter(i => i.type === 'quiz').length;
      setSummary({ earned, spent, quizzes });

      if (profileData?.cardano_address) setWalletAddress(profileData.cardano_address);

    } catch (err) {
      setError(err.message === 'AuthenticationRequired'
        ? 'Session expired. Please log in again.'
        : err.message || 'Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  }, [onUpdateBalance]);

  useEffect(() => {
    if (user) fetchData();
    else { setError('User not logged in.'); setLoading(false); }
  }, [user, fetchData]);

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr) => {
    if (!addr) return 'No address linked';
    return showAddress ? addr : `${addr.slice(0, 12)}...${addr.slice(-6)}`;
  };

  const filteredHistory = history.filter(item => {
    if (activeTab === 'all')     return true;
    if (activeTab === 'earned')  return (item.tokens_earned || 0) > 0;
    if (activeTab === 'spent')   return (item.tokens_earned || 0) < 0;
    return true;
  });

  // ── States ──
  if (loading) return <Spinner />;

  if (error) return (
    <div className="mx-4 mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-reads-red flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-reads-navy font-bold text-sm">Error Loading Wallet</h3>
          <p className="text-reads-muted text-xs mt-1">{error}</p>
          <button onClick={fetchData} className="mt-3 text-reads-green text-xs font-semibold flex items-center gap-1 hover:text-reads-green-light transition-colors">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-8">

      {/* ── Page title ── */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-reads-navy font-bold text-base">Wallet</h2>
        <button onClick={fetchData} className="text-reads-muted hover:text-reads-green transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ── Balance card ── */}
      <div className="mx-4 bg-reads-green-bg rounded-2xl p-5 shadow-reads-card border border-reads-green/20 mb-4">
        <p className="text-reads-muted text-xs font-medium mb-1">Your Balance</p>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-reads-navy text-3xl font-black tracking-tight">
              {currentBalance.toLocaleString()}{' '}
              <span className="text-reads-gold-dark font-black">$READS</span>
            </h3>
            <p className="text-reads-muted text-xs mt-1">Updated just now</p>
          </div>
          {/* Coin icon */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-reads-gold-light via-reads-gold to-reads-gold-dark shadow-reads-gold flex items-center justify-center flex-shrink-0">
            <span className="text-reads-navy font-black text-xl">$</span>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="mx-4 grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: Send,     label: 'Send Tokens', color: 'text-reads-green', bg: 'bg-reads-green-bg' },
          { icon: Download, label: 'Receive',     color: 'text-reads-green', bg: 'bg-reads-green-bg' },
          { icon: History,  label: 'History',     color: 'text-reads-green', bg: 'bg-reads-green-bg' },
        ].map(({ icon: Icon, label, color, bg }) => (
          <button
            key={label}
            className="bg-white rounded-2xl p-4 shadow-reads-card flex flex-col items-center gap-2 hover:shadow-reads-green transition-shadow group"
          >
            <div className={`w-11 h-11 rounded-full ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon size={20} className={color} />
            </div>
            <span className="text-reads-navy text-xs font-semibold text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Summary stats ── */}
      <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-reads-card">
          <p className="text-reads-muted text-xs mb-1">Total Earned</p>
          <p className="text-reads-green font-black text-lg">+{summary.earned.toLocaleString()}</p>
          <p className="text-reads-muted text-xs">$READS</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-reads-card">
          <p className="text-reads-muted text-xs mb-1">Quizzes Passed</p>
          <p className="text-reads-navy font-black text-lg">{summary.quizzes}</p>
          <p className="text-reads-muted text-xs">completed</p>
        </div>
      </div>

      {/* ── Cardano address card ── */}
      {walletAddress && (
        <div className="mx-4 bg-white rounded-2xl p-4 shadow-reads-card mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-reads-navy font-bold text-sm">🔗 Cardano Address</p>
            <button
              onClick={() => setShowAddress(v => !v)}
              className="text-reads-muted hover:text-reads-navy transition-colors"
            >
              {showAddress ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2 border border-gray-100">
            <p className={`font-mono text-reads-navy-soft flex-1 min-w-0 ${showAddress ? 'break-all text-xs' : 'truncate text-xs'}`}>
              {formatAddress(walletAddress)}
            </p>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                ${copied
                  ? 'bg-reads-green-bg border-reads-green text-reads-green'
                  : 'bg-white border-gray-200 text-reads-muted hover:border-reads-green hover:text-reads-green'}`}
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
          <p className="text-reads-muted text-xs mt-2">
            💡 Use this address to receive ADA and NFTs on the Cardano Preprod Testnet
          </p>
        </div>
      )}

      {/* ── Recent Transactions ── */}
      <div className="mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-reads-navy font-bold text-base">Recent Transactions</h3>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-3">
          {['all', 'earned', 'spent'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors
                ${activeTab === tab
                  ? 'bg-reads-green text-white'
                  : 'bg-white text-reads-muted border border-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="bg-white rounded-2xl shadow-reads-card overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center">
              <History size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-reads-muted text-sm font-medium">No transactions yet</p>
              <p className="text-reads-muted text-xs mt-1">Complete quizzes to earn $READS!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredHistory.map((item, idx) => {
                const amount   = item.tokens_earned || 0;
                const positive = amount >= 0;
                const { icon: Icon, bg, color } = txIcon(item.type, amount);

                return (
                  <div key={item.id || idx} className="flex items-center gap-3 px-4 py-3.5">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={color} />
                    </div>
                    {/* Label + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-reads-navy text-sm font-semibold truncate">{txLabel(item)}</p>
                      <p className="text-reads-muted text-xs">{formatDate(item.created_at)}</p>
                    </div>
                    {/* Amount */}
                    <p className={`text-sm font-bold flex-shrink-0 ${positive ? 'text-reads-green' : 'text-reads-red'}`}>
                      {positive ? '+' : ''}{amount} $READS
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-4 flex items-start gap-2 px-1">
          <span className="text-reads-muted text-xs mt-0.5">ℹ️</span>
          <p className="text-reads-muted text-xs leading-relaxed">
            1 $READS = Market-based token. Value varies.
          </p>
        </div>
      </div>

    </div>
  );
};

export default WalletModule;
