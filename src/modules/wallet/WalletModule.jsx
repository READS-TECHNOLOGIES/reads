import React, { useState, useEffect, useCallback } from 'react';
// We still need MUI components, but we will style them using Tailwind classes
import { Box, Typography, Button, Divider, List, ListItem, ListItemText, CircularProgress, Alert, Tooltip, IconButton } from '@mui/material';
import { fetchProtectedData, api } from '../../services/api';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const WalletModule = ({ user, balance, onUpdateBalance }) => {
    // START FIX: Set initial state to a descriptive placeholder if no address is present.
    const initialAddress = user?.cardano_address || null; // Use null instead of '' for better falsy check
    // END FIX

    const [currentBalance, setCurrentBalance] = useState(balance);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({});
    const [walletAddress, setWalletAddress] = useState(initialAddress);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showFullAddress, setShowFullAddress] = useState(false);

    const getToken = () => localStorage.getItem('access_token');

    const fetchData = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            setError("Authentication token not found.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // These calls use the token internally via api.js
            const [balanceData, historyData, summaryData, profileData] = await Promise.all([
                api.wallet.getBalance(),
                api.wallet.getHistory(),
                fetchProtectedData('/rewards/summary', token),
                api.auth.me()
            ]);

            setCurrentBalance(balanceData.token_balance); // Ensure you are pulling the value out
            onUpdateBalance(balanceData.token_balance);
            setHistory(historyData);
            setSummary(summaryData);

            // START FIX: More explicit check for the address data
            if (profileData && profileData.cardano_address) {
                setWalletAddress(profileData.cardano_address);
            } else {
                // If profileData is null (due to a non-401 error in api.js) or address is missing:
                console.error("Wallet data fetch successful (200 OK) but 'cardano_address' is missing from profile data:", profileData);
                // We keep the old address or 'null' which will be rendered as 'No address available'
                if (!walletAddress) {
                    setError("Address not found. Please re-login or check account generation.");
                }
            }
            // END FIX

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
    }, [onUpdateBalance, walletAddress]); // Dependency array updated

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [fetchData, user]);

    const handleCopy = () => {
        // START FIX: Ensure address is not null/empty string before copying
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        // END FIX
    };

    const toggleAddressVisibility = () => {
        setShowFullAddress(!showFullAddress);
    };

    const formatAddress = (address) => {
        // START FIX: Handle 'null' explicitly
        if (!address) return 'No address available'; // Changed 'N/A' to match dashboard text
        // END FIX
        if (showFullAddress) return address;
        return `${address.slice(0, 10)}...${address.slice(-6)}`;
    };

    if (loading) {
        return <CircularProgress className="block mx-auto my-5 dark:text-indigo-400" />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            {/* Title */}
            <Typography variant="h4" className="mb-4 text-gray-800 dark:text-white font-bold">
                <AccountBalanceWalletIcon className="align-middle mr-2 text-indigo-500" />
                Your $READS Wallet
            </Typography>

            {/* CARDANO WALLET ADDRESS SECTION (Tailwind conversion) */}
            <div className="p-4 mb-5 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-slate-700 shadow-inner">

                <div className="flex items-center justify-between mb-3">
                    <Typography variant="subtitle1" className="font-bold text-indigo-700 dark:text-indigo-400">
                        🔗 Cardano Wallet Address
                    </Typography>
                    <Tooltip title={showFullAddress ? "Hide full address" : "Show full address"}>
                        <IconButton
                            onClick={toggleAddressVisibility}
                            size="small"
                            disabled={!walletAddress}
                            className="dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-slate-600 transition-colors"
                        >
                            {showFullAddress ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
                    <Typography
                        variant="body2"
                        className={`font-mono flex-grow mr-4 truncate ${showFullAddress ? 'text-xs md:text-sm' : 'text-sm'} text-gray-700 dark:text-gray-300`}
                        // Note: Using Box/div here instead of Typography with break-all for better Tailwind control
                    >
                        {/* FIX: Simplified rendering logic since formatAddress now handles the fallback */}
                        {formatAddress(walletAddress)}
                    </Typography>
                    <Button
                        onClick={handleCopy}
                        variant="contained"
                        size="small"
                        startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                        disabled={!walletAddress}
                        className={`min-w-[100px] text-white font-medium ${
                            copied
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        } transition-colors shadow-md`}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>

                <Typography variant="caption" className="block mt-2 text-gray-500 dark:text-gray-400">
                    💡 Use this address to receive ADA and NFTs on the Cardano Preprod Testnet
                </Typography>
            </div>

            {/* BALANCE SECTION */}
            <div className="flex justify-between items-center my-6 py-3 border-y border-gray-200 dark:border-slate-700">
                <Typography variant="h5" className="text-gray-700 dark:text-gray-300 font-semibold">
                    $READS Balance
                </Typography>
                <Typography variant="h3" className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                    {currentBalance.toLocaleString()}
                </Typography>
            </div>

            {/* REWARD HISTORY */}
            <Typography variant="h5" className="mb-3 text-gray-700 dark:text-white font-semibold">
                <HistoryToggleOffIcon className="align-middle mr-2 text-indigo-500" />
                Reward History
            </Typography>

            <div className="flex justify-around mb-4 p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300">
                <Typography variant="body1">
                    <strong>Total Earned:</strong> {summary.total_tokens_earned ? summary.total_tokens_earned.toLocaleString() : 0}
                </Typography>
                <Typography variant="body1">
                    <strong>Quizzes Passed:</strong> {summary.total_quizzes_passed || 0}
                </Typography>
            </div>

            {/* List */}
            <List className="max-h-80 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg mt-2 divide-y divide-gray-100 dark:divide-slate-700">
                {history.length === 0 ? (
                    <ListItem className="py-3 bg-white dark:bg-slate-800">
                        <ListItemText
                            primary="No reward history yet."
                            className="text-gray-500 dark:text-gray-400 text-center"
                        />
                    </ListItem>
                ) : (
                    history.map((item) => (
                        <ListItem
                            key={item.id}
                            secondaryAction={
                                <Typography variant="body2" className="text-green-600 dark:text-green-400 font-bold">
                                    +{item.tokens_earned} $READS
                                </Typography>
                            }
                            className="py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ListItemText
                                primary={item.lesson_title}
                                secondary={`Source: ${item.type} | Date: ${new Date(item.created_at).toLocaleDateString()}`}
                                primaryTypographyProps={{ className: 'text-gray-800 dark:text-gray-200 font-medium' }}
                                secondaryTypographyProps={{ className: 'text-gray-500 dark:text-gray-400 text-sm' }}
                            />
                        </ListItem>
                    ))
                )}
            </List>
        </div>
    );
};

export default WalletModule;
