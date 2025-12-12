import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, Divider, List, ListItem, ListItemText, CircularProgress, Alert, Tooltip, IconButton } from '@mui/material';
// 🟢 CORRECTED PATH: Use the correct relative path to your API file
import { fetchProtectedData, api } from '../../services/api'; 
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// 🟢 WalletModule now receives the user object from App.jsx
const WalletModule = ({ user, balance, onUpdateBalance }) => { 
    // We can infer the token using the user object, but for API calls, 
    // we must retrieve the token explicitly from localStorage 
    // (matching the logic in api.js) or pass it down.
    
    // For simplicity, we use the user object to get the address immediately
    const initialAddress = user?.cardano_address || '';

    const [currentBalance, setCurrentBalance] = useState(balance);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({});
    const [walletAddress, setWalletAddress] = useState(initialAddress);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showFullAddress, setShowFullAddress] = useState(false);

    // 💡 Helper to retrieve token from LocalStorage, matching api.js logic
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
            // Fetch all data concurrently using api object and token from localStorage
            const [balanceData, historyData, summaryData, profileData] = await Promise.all([
                api.wallet.getBalance(), // api functions retrieve token internally
                api.wallet.getHistory(), // api functions retrieve token internally
                fetchProtectedData('/rewards/summary', token), // Explicitly use fetchProtectedData if necessary
                api.auth.me() // Re-fetch profile in case address was updated since App mount
            ]);

            setCurrentBalance(balanceData);
            onUpdateBalance(balanceData); // Update parent state
            setHistory(historyData);
            setSummary(summaryData);

            if (profileData && profileData.cardano_address) {
                setWalletAddress(profileData.cardano_address);
            }
        } catch (err) {
            console.error("Wallet data fetching failed:", err);
            // Handle the specific 'AuthenticationRequired' error thrown by api.js
            if (err.message === 'AuthenticationRequired') {
                 // The parent App component should handle the actual logout based on its periodic checks or navigation back to 'login'.
                 setError("Session expired. Please re-login.");
            } else {
                 setError(err.message || "Failed to load wallet data.");
            }
        } finally {
            setLoading(false);
        }
    }, [onUpdateBalance]);

    useEffect(() => {
        // Run fetch only if user is logged in
        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [fetchData, user]);

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
        if (!address) return 'N/A';
        if (showFullAddress) return address;
        return `${address.slice(0, 10)}...${address.slice(-6)}`;
    };

    if (loading) {
        return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
    }

    if (error) {
        return <Alert severity="error">Error: {error}</Alert>;
    }

    return (
        <Paper sx={{ p: 3, maxWidth: 800, margin: '20px auto' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                <AccountBalanceWalletIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Your $READS Wallet
            </Typography>

            {/* CARDANO WALLET ADDRESS SECTION */}
            <Box sx={{ 
                p: 2.5, 
                mb: 3, 
                border: '2px solid #3f51b5', 
                borderRadius: 2, 
                backgroundColor: '#f5f7ff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
                        🔗 Cardano Wallet Address
                    </Typography>
                    <Tooltip title={showFullAddress ? "Hide full address" : "Show full address"}>
                        <IconButton 
                            onClick={toggleAddressVisibility} 
                            size="small"
                            disabled={!walletAddress}
                        >
                            {showFullAddress ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    backgroundColor: 'white',
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                }}>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: showFullAddress ? '0.75rem' : '0.875rem',
                            wordBreak: showFullAddress ? 'break-all' : 'normal',
                            flexGrow: 1, 
                            mr: 2,
                            color: '#424242'
                        }}
                    >
                        {walletAddress ? formatAddress(walletAddress) : 'No address available'}
                    </Typography>
                    <Button 
                        onClick={handleCopy} 
                        variant="contained" 
                        size="small"
                        startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                        disabled={!walletAddress}
                        sx={{ 
                            minWidth: '100px',
                            backgroundColor: copied ? '#4caf50' : '#3f51b5',
                            '&:hover': {
                                backgroundColor: copied ? '#45a049' : '#303f9f'
                            }
                        }}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    💡 Use this address to receive ADA and NFTs on the Cardano Preprod Testnet
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" color="primary">
                    $READS Token Balance
                </Typography>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                    {currentBalance.toLocaleString()}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                <HistoryToggleOffIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Reward History
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                <Typography variant="body1">
                    <strong>Total Earned:</strong> {summary.total_tokens_earned ? summary.total_tokens_earned.toLocaleString() : 0}
                </Typography>
                <Typography variant="body1">
                    <strong>Quizzes Passed:</strong> {summary.total_quizzes_passed || 0}
                </Typography>
            </Box>

            <List sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, mt: 2 }}>
                {history.length === 0 ? (
                    <ListItem>
                        <ListItemText primary="No reward history yet." />
                    </ListItem>
                ) : (
                    history.map((item) => (
                        <ListItem key={item.id} secondaryAction={
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                +{item.tokens_earned} $READS
                            </Typography>
                        }>
                            <ListItemText
                                primary={item.lesson_title}
                                secondary={`Source: ${item.type} | Date: ${new Date(item.created_at).toLocaleDateString()}`}
                            />
                        </ListItem>
                    ))
                )}
            </List>
        </Paper>
    );
};

export default WalletModule;
