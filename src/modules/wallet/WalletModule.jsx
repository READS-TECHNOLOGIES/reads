import React, { useState, useEffect } from 'react';
import { Wallet, Clock, TrendingUp, Copy, Check, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

// --- Helper function to safely format the date ---
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            return new Date(isoString.split('T')[0]).toLocaleDateString('en-US');
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
};

const WalletModule = ({ balance, onUpdateBalance }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardanoAddress, setCardanoAddress] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Fetch balance
            try {
                const balanceResponse = await api.wallet.getBalance();
                if (balanceResponse && typeof balanceResponse.token_balance === 'number') {
                    onUpdateBalance(balanceResponse.token_balance);
                }
            } catch (err) {
                console.error("Error fetching balance:", err);
            }

            // Fetch history
            try {
                const historyData = await api.wallet.getHistory();
                if (Array.isArray(historyData)) {
                    setHistory(historyData);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            }

            // Fetch Cardano wallet address
            try {
                const userResponse = await api.auth.getCurrentUser();
                if (userResponse && userResponse.cardano_wallet_address) {
                    setCardanoAddress(userResponse.cardano_wallet_address);
                }
            } catch (err) {
                console.log("No Cardano wallet found for user");
            }

        } catch (error) {
            console.error("Failed to fetch wallet data:", error);
            setError("Failed to load wallet data");
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, []); // Remove onUpdateBalance from dependencies to prevent infinite loops

  const handleCopyAddress = async () => {
    if (!cardanoAddress) return;
    try {
        await navigator.clipboard.writeText(cardanoAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
  };

  const openInExplorer = () => {
    if (!cardanoAddress) return;
    window.open(`https://preprod.cardanoscan.io/address/${cardanoAddress}`, '_blank');
  };

  const truncateAddress = (address) => {
    if (!address || address.length <= 20) return address;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  const renderHistoryItem = (tx) => {
      const isReward = tx.type === 'Reward';
      const icon = isReward 
          ? <TrendingUp size={16} className='text-green-500' /> 
          : <Clock size={16} className='text-gray-500'/>;
      const amountColor = isReward ? 'text-green-600 dark:text-green-400' : 'text-gray-500';

      return (
        <div key={tx.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <p className='text-sm font-semibold dark:text-white'>{tx.lesson_title || tx.type || 'Transaction'}</p>
                    <p className='text-xs text-gray-500'>{formatDate(tx.created_at)}</p>
                </div>
            </div>
            <span className={`font-bold ${amountColor}`}>{`+${tx.tokens_earned} TKN`}</span>
        </div>
      );
  };

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold dark:text-white">My Wallet</h2>
        <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold dark:text-white">My Wallet</h2>

      {/* Token Balance Card */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Current Token Balance</p>
        <h3 className="text-4xl font-bold">{balance} <span className="text-yellow-400 text-xl">TKN</span></h3>
        <p className='text-sm text-slate-400 mt-1'>Rewards are earned by completing quizzes.</p>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
          <Wallet size={120} />
        </div>
      </div>

      {/* Cardano Wallet Card */}
      {cardanoAddress && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 border border-purple-200 dark:border-slate-700 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-600 p-2.5 rounded-xl">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cardano Wallet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preprod Testnet
              </p>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-700">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
              Wallet Address
            </label>
            
            {/* Desktop view - full address */}
            <div className="hidden sm:flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-gray-900 dark:text-white break-all">
                {cardanoAddress}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={openInExplorer}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                title="View in explorer"
              >
                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Mobile view - truncated address */}
            <div className="flex sm:hidden items-center gap-2">
              <code className="flex-1 text-xs font-mono text-gray-900 dark:text-white">
                {truncateAddress(cardanoAddress)}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={openInExplorer}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="View in explorer"
              >
                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <a
              href="https://docs.cardano.org/cardano-testnets/tools/faucet/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm font-semibold"
            >
              Get Test ADA
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={openInExplorer}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors text-sm font-semibold"
            >
              View Explorer
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 This is a testnet wallet. Use the faucet to get free test ADA for development and testing.
            </p>
          </div>
        </div>
      )}

      {/* History Section */}
      <div>
        <h3 className="font-bold text-xl mb-4 dark:text-white">Recent Transactions</h3>
        <div className="space-y-3">
            {isLoading ? (
                <p className='text-center text-gray-500 dark:text-gray-400'>Loading history...</p>
            ) : history.length > 0 ? (
                history.map(renderHistoryItem)
            ) : (
                <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700">
                    <Clock size={24} className="mx-auto mb-2 text-gray-400"/>
                    <p>No transactions yet.</p>
                    <p className='text-sm mt-1'>Complete a quiz with a score of 70% or more to earn your first tokens!</p>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default WalletModule;