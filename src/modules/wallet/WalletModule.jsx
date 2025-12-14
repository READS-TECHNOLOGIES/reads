import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Wallet, History, Copy, Check, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';

const WalletModule = ({ user, balance, onUpdateBalance }) => {
    const initialAddress = user?.cardano_address || null;

    const [currentBalance, setCurrentBalance] = useState(balance || 0);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({});
    const [walletAddress, setWalletAddress] = useState(initialAddress);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showFullAddress, setShowFullAddress] = useState(false);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setLoading(false);
            setError("Authentication token not found. Please login.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [balanceData, historyData, profileData] = await Promise.all([
                api.wallet.getBalance(),
                api.wallet.getHistory(),
                api.auth.me()
            ]);

            const newBalance = typeof balanceData === 'number' ? balanceData : (balanceData?.token_balance || 0);
            setCurrentBalance(newBalance);
            if (onUpdateBalance) {
                onUpdateBalance(newBalance);
            }

            setHistory(historyData || []);

            const totalEarned = (historyData || []).reduce((sum, item) => sum + (item.tokens_earned || 0), 0);
            const quizzesPassed = (historyData || []).filter(item => item.type === 'quiz').length;
            setSummary({
                total_tokens_earned: totalEarned,
                total_quizzes_passed: quizzesPassed
            });

            if (profileData?.cardano_address) {
                setWalletAddress(profileData.cardano_address);
            } else {
                console.warn("Profile loaded but cardano_address is missing:", profileData);
                if (!walletAddress) {
                    setError("Cardano address not found. Please contact support.");
                }
            }

        } catch (err) {
            console.error("Wallet data fetching failed:", err);
            if (err.message === 'AuthenticationRequired') {
                setError("Session expired. Please re-login.");
            } else {
                setError(err.message || "Failed to load wallet data.");
            }
        } finally {
            setLoading(false);
        }
    }, [onUpdateBalance, walletAddress]);

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setLoading(false);
            setError("User not logged in.");
        }
    }, [user, fetchData]);

    const handleCopy = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const toggleAddressVisibility = () => {
        setShowFullAddress(!showFullAddress);
    };

    const formatAddress = (address) => {
        if (!address) return 'No address available';
        if (showFullAddress) return address;
        return `${address.slice(0, 10)}...${address.slice(-6)}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <RefreshCw size={32} className="animate-spin text-primary-cyan dark:text-dark-cyan" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-orange p-4 rounded-xl">
                <div className="flex items-start">
                    <AlertCircle size={20} className="text-primary-orange dark:text-dark-orange mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white">Error Loading Wallet</h3>
                        <p className="text-sm text-gray-600 dark:text-card-muted mt-1">{error}</p>
                        <button 
                            onClick={fetchData}
                            className="mt-3 text-sm text-primary-cyan dark:text-dark-cyan hover:text-primary-cyan-dark font-medium flex items-center"
                        >
                            <RefreshCw size={16} className="mr-1" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                <Wallet size={32} className="mr-3 text-primary-cyan dark:text-dark-cyan" />
                Your $READS Wallet
            </h2>

            {/* CARDANO WALLET ADDRESS SECTION */}
            <div className="p-6 border-2 border-cyan rounded-xl bg-light-card dark:bg-dark-card shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        🔗 Cardano Wallet Address
                    </h3>
                    <button
                        onClick={toggleAddressVisibility}
                        disabled={!walletAddress}
                        className="p-2 rounded-full hover:bg-primary-navy-dark dark:hover:bg-dark-card-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={showFullAddress ? "Hide full address" : "Show full address"}
                    >
                        {showFullAddress ? <EyeOff size={20} className="text-cyan" /> : <Eye size={20} className="text-cyan" />}
                    </button>
                </div>

                <div className="flex items-center justify-between bg-black/20 dark:bg-black/30 p-4 rounded-lg border border-cyan-light">
                    <p className={`font-mono flex-grow mr-4 ${showFullAddress ? 'break-all text-xs md:text-sm' : 'truncate text-sm'} text-white`}>
                        {formatAddress(walletAddress)}
                    </p>
                    <button
                        onClick={handleCopy}
                        disabled={!walletAddress}
                        className={`min-w-[100px] px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 ${
                            copied
                            ? 'bg-cyan border-cyan text-white scale-105'
                            : 'bg-transparent border-cyan text-cyan hover:bg-cyan hover:text-white'
                        }`}
                    >
                        {copied ? (
                            <>
                                <Check size={16} className="mr-1" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={16} className="mr-1" />
                                Copy
                            </>
                        )}
                    </button>
                </div>

                <p className="text-xs text-card-muted mt-3">
                    💡 Use this address to receive ADA and NFTs on the Cardano Preprod Testnet
                </p>
            </div>

            {/* BALANCE SECTION */}
            <div className="flex justify-between items-center p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-md border-2 border-cyan">
                <h3 className="text-xl font-semibold text-white">
                    $READS Balance
                </h3>
                <p className="text-4xl font-extrabold text-orange">
                    {currentBalance.toLocaleString()}
                </p>
            </div>

            {/* REWARD HISTORY */}
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md border-2 border-cyan p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <History size={24} className="mr-2 text-cyan" />
                    Reward History
                </h3>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-black/20 dark:bg-black/30 rounded-lg border border-cyan-light">
                        <p className="text-sm text-card-muted">Total Earned</p>
                        <p className="text-2xl font-bold text-orange">
                            {summary.total_tokens_earned ? summary.total_tokens_earned.toLocaleString() : 0} $READS
                        </p>
                    </div>
                    <div className="p-4 bg-black/20 dark:bg-black/30 rounded-lg border border-cyan-light">
                        <p className="text-sm text-card-muted">Quizzes Passed</p>
                        <p className="text-2xl font-bold text-cyan">
                            {summary.total_quizzes_passed || 0}
                        </p>
                    </div>
                </div>

                {/* Transaction History List */}
                <div className="border-2 border-cyan-light rounded-lg overflow-hidden max-h-96 overflow-y-auto bg-black/10 dark:bg-black/20">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-card-muted">
                            <History size={48} className="mx-auto mb-3 opacity-30" />
                            <p>No transaction history yet.</p>
                            <p className="text-sm mt-1">Complete quizzes to earn $READS tokens!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-cyan-light/20">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 hover:bg-black/20 dark:hover:bg-black/30 transition-colors flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-white">
                                            {item.lesson_title || 'Reward'}
                                        </p>
                                        <p className="text-sm text-card-muted">
                                            {item.type || 'Unknown'} • {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-orange">
                                            +{item.tokens_earned} $READS
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletModule;