import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, Divider, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { fetchProtectedData } from '../api';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

const WalletModule = () => {
    const { token } = useAuth();
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({});
    const [walletAddress, setWalletAddress] = useState(''); // 🟢 NEW STATE FOR WALLET ADDRESS
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const fetchData = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch multiple data points concurrently
            const [balanceData, historyData, summaryData, profileData] = await Promise.all([
                fetchProtectedData('/wallet/balance', token),
                fetchProtectedData('/wallet/history', token),
                fetchProtectedData('/rewards/summary', token),
                fetchProtectedData('/user/profile', token) // 🟢 Fetch user profile for the address
            ]);

            setBalance(balanceData.token_balance);
            setHistory(historyData);
            setSummary(summaryData);

            // 🟢 UPDATE STATE: Set the Cardano address
            if (profileData && profileData.cardano_address) {
                setWalletAddress(profileData.cardano_address);
            }
        } catch (err) {
            console.error("Wallet data fetching failed:", err);
            setError(err.message || "Failed to load wallet data.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopy = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        }
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        // Format to show start and end for readability
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

            {/* 🟢 NEW SECTION: CARDANO WALLET ADDRESS */}
            <Box sx={{ p: 2, mb: 3, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                <Typography variant="subtitle1" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Cardano Wallet Address
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', overflowWrap: 'break-word', flexGrow: 1, mr: 2 }}>
                        {formatAddress(walletAddress)}
                    </Typography>
                    <Button 
                        onClick={handleCopy} 
                        variant="outlined" 
                        size="small"
                        startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                        disabled={!walletAddress}
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </Box>
                {/* Optional full address tooltip or full display on click */}
                <Typography variant="caption" color="text.secondary">
                    Used for receiving ADA/NFTs on the Cardano Testnet.
                </Typography>
            </Box>
            {/* END: CARDANO WALLET ADDRESS */}


            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" color="primary">
                    $READS Token Balance
                </Typography>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                    {balance.toLocaleString()}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                <HistoryToggleOffIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Reward History
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                <Typography variant="body1">
                    **Total Earned:** {summary.total_tokens_earned ? summary.total_tokens_earned.toLocaleString() : 0}
                </Typography>
                <Typography variant="body1">
                    **Quizzes Passed:** {summary.total_quizzes_passed || 0}
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
