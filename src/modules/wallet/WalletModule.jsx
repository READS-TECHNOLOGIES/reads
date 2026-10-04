import { useState, useEffect, useCallback } from 'react';
import {
  Coins, ArrowUpRight, ArrowDownLeft, Send, RefreshCw,
  Copy, CheckCircle, Loader2, ExternalLink, Wallet,
  Link, LinkIcon, Unlink, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Modal, Toast } from '../../components/UI.jsx';

const TX_TYPES = {
  earned:   { label: 'Earned',   color: 'text-reads-green', bg: 'bg-reads-green-bg',  icon: ArrowDownLeft },
  received: { label: 'Received', color: 'text-reads-green', bg: 'bg-reads-green-bg',  icon: ArrowDownLeft },
  sent:     { label: 'Sent',     color: 'text-reads-red',   bg: 'bg-reads-red-bg',    icon: ArrowUpRight  },
  spent:    { label: 'Spent',    color: 'text-reads-red',   bg: 'bg-reads-red-bg',    icon: ArrowUpRight  },
  fee:      { label: 'Fee',      color: 'text-reads-muted', bg: 'bg-gray-100',        icon: ArrowUpRight  },
};

const SUPPORTED_WALLETS = ['eternl', 'nami', 'typhon', 'vespr', 'flint', '1am'];

const TxRow = ({ tx }) => {
  const meta = TX_TYPES[tx.type] || TX_TYPES.sent;
  const Icon = meta.icon;
  const positive = tx.type === 'earned' || tx.type === 'received';
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-reads-navy font-semibold text-sm truncate">{tx.description}</p>
        <p className="text-reads-muted text-xs mt-0.5">
          {new Date(tx.created_at).toLocaleString()} · <span className="capitalize">{meta.label}</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-black text-sm ${positive ? 'text-reads-green' : 'text-reads-red'}`}>
          {positive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
        </p>
        <p className="text-reads-muted-light text-[10px]">$READS</p>
      </div>
    </div>
  );
};

// ── Send Modal ────────────────────────────────────────────────────────────────
const SendModal = ({ balance, onClose, onSent }) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!to.trim()) return setError('Enter recipient address or username.');
    if (!amt || amt <= 0) return setError('Enter a valid amount.');
    if (amt > balance) return setError('Insufficient balance.');
    setLoading(true); setError('');
    try {
      await api.wallet.send({ recipient: to.trim(), amount: amt, note });
      onSent(amt);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Send $READS" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="reads-label">Recipient</label>
          <input className="reads-input" placeholder="Wallet address or username"
            value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="reads-label">Amount</label>
          <div className="relative">
            <input type="number" className="reads-input pr-20" placeholder="0"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-reads-muted text-sm font-bold">$READS</span>
          </div>
          <p className="text-reads-muted text-xs mt-1">Balance: {balance.toLocaleString()} $READS</p>
        </div>
        <div>
          <label className="reads-label">Note (optional)</label>
          <input className="reads-input" placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handleSend} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Sending…' : 'Send Tokens'}
        </button>
      </div>
    </Modal>
  );
};

// ── Cardano Wallet Section ────────────────────────────────────────────────────
const CardanoSection = ({ linkedAddress, onLinked, onUnlinked, showToast }) => {
  const [expanded, setExpanded]         = useState(!!linkedAddress);
  const [connecting, setConnecting]     = useState(false);
  const [unlinking, setUnlinking]       = useState(false);
  const [onChainBalance, setOnChain]    = useState(null);
  const [loadingBal, setLoadingBal]     = useState(false);
  const [manualAddr, setManualAddr]     = useState('');
  const [showManual, setShowManual]     = useState(false);
  const [copied, setCopied]             = useState(false);

  const detectWallet = () => SUPPORTED_WALLETS.find((w) => window.cardano?.[w]);

  const copyAddr = () => {
    navigator.clipboard.writeText(linkedAddress).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const connectBrowser = async () => {
    const walletName = detectWallet();
    if (!walletName) {
      setShowManual(true);
      return;
    }
    setConnecting(true);
    try {
      const walletApi = await window.cardano[walletName].enable();
      const changeAddrHex = await walletApi.getChangeAddress();
      const usedAddrs = await walletApi.getUsedAddresses();
      const address = usedAddrs.length > 0 ? usedAddrs[0] : changeAddrHex;
      await api.wallet.linkCardano(address);
      onLinked(address);
      showToast(`${walletName} wallet connected!`);
    } catch (e) {
      showToast(e.message || 'Connection failed', 'error');
    } finally { setConnecting(false); }
  };

  const linkManual = async () => {
    if (!manualAddr.trim()) return;
    setConnecting(true);
    try {
      await api.wallet.linkCardano(manualAddr.trim());
      onLinked(manualAddr.trim());
      setShowManual(false);
      showToast('Cardano wallet linked!');
    } catch (e) {
      showToast(e.message || 'Invalid address', 'error');
    } finally { setConnecting(false); }
  };

  const unlink = async () => {
    setUnlinking(true);
    try {
      await api.wallet.unlinkCardano();
      onUnlinked();
      setOnChain(null);
      showToast('Wallet unlinked');
    } catch (e) {
      showToast('Failed to unlink', 'error');
    } finally { setUnlinking(false); }
  };

  const fetchOnChainBalance = async () => {
    if (!linkedAddress) return;
    setLoadingBal(true);
    try {
      const data = await api.wallet.cardanoBalance();
      setOnChain(data);
    } catch (_) {
      showToast('Could not fetch on-chain balance', 'error');
    } finally { setLoadingBal(false); }
  };

  useEffect(() => {
    if (linkedAddress && expanded) fetchOnChainBalance();
  }, [linkedAddress, expanded]);

  const shortAddr = (addr) => addr ? `${addr.slice(0, 14)}...${addr.slice(-6)}` : '';

  return (
    <div className="reads-card mb-5 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-black text-blue-600">₳</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-reads-navy text-sm">Cardano Wallet</p>
          <p className="text-reads-muted text-xs">
            {linkedAddress ? shortAddr(linkedAddress) : 'Not connected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {linkedAddress && (
            <span className="w-2 h-2 rounded-full bg-reads-green" />
          )}
          {expanded ? <ChevronUp size={16} className="text-reads-muted" /> : <ChevronDown size={16} className="text-reads-muted" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">

          {/* Not linked state */}
          {!linkedAddress && (
            <>
              {!showManual ? (
                <>
                  <p className="text-reads-muted text-xs">
                    Connect your Cardano wallet to receive $READS on-chain and use token features.
                  </p>
                  <button
                    onClick={connectBrowser}
                    disabled={connecting}
                    className="reads-btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {connecting
                      ? <Loader2 size={16} className="animate-spin" />
                      : <LinkIcon size={16} />}
                    {connecting ? 'Connecting…' : 'Connect Wallet (Eternl / Nami)'}
                  </button>
                  <button
                    onClick={() => setShowManual(true)}
                    className="w-full text-reads-muted text-xs underline text-center"
                  >
                    Enter address manually
                  </button>
                  <p className="text-reads-muted text-[10px] text-center">
                    Supports Eternl · Nami · Typhon · Vespr
                  </p>
                </>
              ) : (
                <>
                  <label className="reads-label">Paste your Preprod address</label>
                  <input
                    className="reads-input text-xs"
                    placeholder="addr_test1..."
                    value={manualAddr}
                    onChange={(e) => setManualAddr(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowManual(false)}
                      className="flex-1 reads-btn-secondary text-sm py-2">Cancel</button>
                    <button onClick={linkManual} disabled={connecting}
                      className="flex-1 reads-btn-primary text-sm py-2 flex items-center justify-center gap-1">
                      {connecting && <Loader2 size={14} className="animate-spin" />}
                      Link
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Linked state */}
          {linkedAddress && (
            <>
              {/* Address row */}
              <div className="bg-gray-50 rounded-2xl px-3 py-2.5 flex items-center gap-2">
                <code className="text-reads-navy text-xs font-mono flex-1 truncate">{linkedAddress}</code>
                <button onClick={copyAddr} className="flex-shrink-0 text-reads-muted">
                  {copied ? <CheckCircle size={16} className="text-reads-green" /> : <Copy size={16} />}
                </button>
              </div>

              {/* On-chain balance */}
              {loadingBal ? (
                <div className="flex items-center gap-2 text-reads-muted text-xs">
                  <Loader2 size={14} className="animate-spin" /> Fetching on-chain balance…
                </div>
              ) : onChainBalance ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 rounded-2xl p-3 text-center">
                    <p className="font-black text-reads-navy text-base">{onChainBalance.reads_tokens?.toLocaleString() ?? 0}</p>
                    <p className="text-reads-muted text-[10px] mt-0.5">$READS on-chain</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3 text-center">
                    <p className="font-black text-reads-navy text-base">{onChainBalance.ada ?? 0}</p>
                    <p className="text-reads-muted text-[10px] mt-0.5">ADA balance</p>
                  </div>
                </div>
              ) : null}

              {/* Network badge */}
              <div className="flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {onChainBalance?.network ?? 'preprod'}
                </span>
                <button
                  onClick={fetchOnChainBalance}
                  className="text-reads-muted text-xs flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
                {onChainBalance?.network === 'preprod' && (
                  <a
                    href={`https://preprod.cardanoscan.io/address/${linkedAddress}`}
                    target="_blank" rel="noreferrer"
                    className="text-reads-muted text-xs flex items-center gap-1 ml-auto"
                  >
                    View <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Unlink */}
              <button
                onClick={unlink}
                disabled={unlinking}
                className="w-full flex items-center justify-center gap-2 text-reads-red text-xs py-2 border border-reads-red/30 rounded-2xl active:scale-95 transition-transform"
              >
                {unlinking ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                {unlinking ? 'Unlinking…' : 'Unlink Wallet'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── On-Chain Claim Section ────────────────────────────────────────────────────
const ClaimSection = ({ linkedAddress, showToast }) => {
  const [rewards, setRewards]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [claiming, setClaiming]   = useState(null); // reward id being voucher-issued
  const [voucher, setVoucher]     = useState(null); // active voucher sheet
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    api.wallet.getPendingRewards()
      .then(d => setRewards(d?.rewards || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Step 1: issue voucher from backend (signs the claim params)
  const handleIssueVoucher = async (rewardId) => {
    if (!linkedAddress) return showToast('Link a Cardano wallet first', 'error');
    setClaiming(rewardId);
    try {
      const v = await api.wallet.issueVoucher(rewardId);
      setVoucher(v);
    } catch (err) {
      showToast(err.message || 'Failed to issue voucher', 'error');
    } finally {
      setClaiming(null);
    }
  };

  // Step 2: build the /claim URL and open it
  // The URL carries the full signed voucher + the user's JWT so ClaimPage
  // can authenticate inside the Eternl DApp browser without a login screen.
  const getClaimUrl = () => {
    if (!voucher) return '';
    const voucherPayload = {
      reward_id:          voucher.reward_id,
      amount:             voucher.amount,
      expires_slot:       voucher.expires_slot,
      platform_signature: voucher.platform_signature,
      platform_vkey:      voucher.platform_vkey,
      description:        voucher.description || '',
    };
    const encoded = encodeURIComponent(JSON.stringify(voucherPayload));
    const token   = encodeURIComponent(localStorage.getItem('access_token') || '');
    return `${window.location.origin}/claim?voucher=${encoded}&token=${token}`;
  };

  // Open directly (works on desktop browser with wallet extension)
  const openClaimPage = () => {
    const url = getClaimUrl();
    if (url) window.open(url, '_blank');
  };

  // Copy URL for pasting into Eternl DApp browser on mobile
  const copyClaimUrl = () => {
    const url = getClaimUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast('Claim URL copied — paste it in Eternl DApp Browser');
    });
  };

  // After claim confirmed on /claim page, refresh rewards list
  const refreshRewards = async () => {
    try {
      const d = await api.wallet.getPendingRewards();
      setRewards(d?.rewards || []);
    } catch (_) {}
  };

  const unclaimed      = rewards.filter(r => r.status === 'unclaimed');
  const issued         = rewards.filter(r => r.status === 'voucher_issued');
  const claimed        = rewards.filter(r => r.status === 'claimed');
  const totalUnclaimed = unclaimed.reduce((s, r) => s + r.amount, 0);

  if (loading) return null;
  if (rewards.length === 0) return null;

  const walletDetected = SUPPORTED_WALLETS.find(w => window.cardano?.[w]);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-black text-reads-navy text-sm uppercase tracking-wide">On-Chain Claims</p>
        {totalUnclaimed > 0 && (
          <span className="text-[10px] font-black bg-reads-green text-white px-2 py-1 rounded-full">
            {totalUnclaimed.toLocaleString()} $READS ready
          </span>
        )}
      </div>

      {/* ── Active voucher bottom sheet ─────────────────────────── */}
      {voucher && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-3xl px-5 py-6 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-reads-navy text-base">
                  Claim {voucher.amount?.toLocaleString()} $READS
                </p>
                <p className="text-reads-muted text-xs mt-0.5">{voucher.description}</p>
              </div>
              <button
                onClick={() => { setVoucher(null); setCopied(false); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <span className="text-reads-muted text-sm">✕</span>
              </button>
            </div>

            {/* Voucher details */}
            <div className="bg-gray-50 rounded-2xl px-4 py-3 space-y-2 text-xs">
              {[
                ['Amount',  `${voucher.amount?.toLocaleString()} $READS`],
                ['To',      `${linkedAddress?.slice(0, 16)}…`],
                ['Expires', `Slot ${voucher.expires_slot?.toLocaleString()}`],
                ['Network', 'Cardano Preprod'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-reads-muted">{label}</span>
                  <span className="text-reads-navy font-bold font-mono">{val}</span>
                </div>
              ))}
            </div>

            {/* How-to instructions */}
            <div className="bg-blue-50 rounded-2xl px-4 py-3 space-y-1.5">
              <p className="font-bold text-reads-navy text-xs">How to claim</p>
              <ol className="text-xs text-reads-muted space-y-1 list-decimal list-inside leading-relaxed">
                <li>Tap <strong>Open Claim Page</strong> below</li>
                <li>If on <strong>mobile</strong>, copy the URL instead and open it in <strong>Eternl → DApp Browser</strong></li>
                <li>Tap <strong>Sign & Claim</strong> on the page that opens</li>
                <li>Approve the transaction in your wallet</li>
              </ol>
            </div>

            {/* Primary CTA — open /claim in new tab */}
            <button
              onClick={openClaimPage}
              className="reads-btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
            >
              <ExternalLink size={18} />
              Open Claim Page
            </button>

            {/* Secondary — copy URL for Eternl mobile DApp browser */}
            <button
              onClick={copyClaimUrl}
              className="w-full flex items-center justify-center gap-2 border border-reads-navy/20 text-reads-navy font-bold text-sm py-3 rounded-2xl active:scale-95 transition-transform"
            >
              {copied
                ? <><CheckCircle size={16} className="text-reads-green" /> URL Copied!</>
                : <><Copy size={16} /> Copy URL (for Eternl mobile)</>}
            </button>

            {/* Refresh after claim */}
            <button
              onClick={() => { refreshRewards(); setVoucher(null); }}
              className="w-full text-reads-muted text-xs text-center underline"
            >
              I already claimed — refresh my rewards
            </button>
          </div>
        </div>
      )}

      {/* ── Reward cards ──────────────────────────────────────────── */}
      <div className="space-y-2">

        {/* Unclaimed */}
        {unclaimed.map(r => (
          <div key={r.id} className="reads-card px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-reads-green-bg flex items-center justify-center flex-shrink-0">
              <span className="font-black text-reads-green text-sm">{r.amount.toLocaleString()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-reads-navy text-sm truncate">{r.description}</p>
              <p className="text-reads-muted text-xs capitalize">{r.source} reward</p>
            </div>
            <button
              onClick={() => handleIssueVoucher(r.id)}
              disabled={claiming === r.id}
              className="reads-btn-primary px-3 py-2 text-xs flex items-center gap-1 flex-shrink-0"
            >
              {claiming === r.id ? <Loader2 size={12} className="animate-spin" /> : '₳'}
              Claim
            </button>
          </div>
        ))}

        {/* Voucher issued — can re-open claim page */}
        {issued.map(r => (
          <div key={r.id} className="reads-card px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <span className="font-black text-amber-500 text-sm">{r.amount.toLocaleString()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-reads-navy text-sm truncate">{r.description}</p>
              <p className="text-reads-muted text-xs">Voucher issued — tap to retry</p>
            </div>
            <button
              onClick={() => handleIssueVoucher(r.id)}
              disabled={claiming === r.id}
              className="px-3 py-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-2xl flex-shrink-0"
            >
              {claiming === r.id ? <Loader2 size={12} className="animate-spin" /> : 'Retry'}
            </button>
          </div>
        ))}

        {/* Claimed — last 3 */}
        {claimed.slice(0, 3).map(r => (
          <div key={r.id} className="reads-card px-4 py-3 flex items-center gap-3 opacity-50">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={18} className="text-reads-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-reads-navy text-sm truncate">{r.description}</p>
              <p className="text-reads-muted text-xs font-mono truncate">{r.claim_tx_hash?.slice(0, 16)}…</p>
            </div>
            <span className="text-reads-green text-[10px] font-black px-2 py-1 bg-green-50 rounded-full flex-shrink-0">
              CLAIMED
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── Main Wallet Module ────────────────────────────────────────────────────────
export default function WalletModule({ balance: initialBalance, onUpdateBalance }) {
  const [balance, setBalance]           = useState(initialBalance ?? 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [txFilter, setTxFilter]         = useState('all');
  const [showSend, setShowSend]         = useState(false);
  const [cardanoAddress, setCardano]    = useState('');
  const [toast, setToast]               = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [bal, txData, me] = await Promise.allSettled([
          api.wallet.getBalance(),
          api.wallet.getTransactions({ limit: 50 }),
          api.auth.me(),
        ]);
        if (bal.status === 'fulfilled') {
          setBalance(bal.value);
          onUpdateBalance?.(bal.value);
        }
        if (txData.status === 'fulfilled') setTransactions(txData.value?.transactions || []);
        if (me.status === 'fulfilled' && me.value?.cardano_address) {
          setCardano(me.value.cardano_address);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSent = async (amt) => {
    setShowSend(false);
    showToast(`Sent ${amt} $READS successfully!`);
    const [newBal, txData] = await Promise.allSettled([
      api.wallet.getBalance(),
      api.wallet.getTransactions({ limit: 50 }),
    ]);
    if (newBal.status === 'fulfilled') { setBalance(newBal.value); onUpdateBalance?.(newBal.value); }
    if (txData.status === 'fulfilled') setTransactions(txData.value?.transactions || []);
  };

  const filtered = transactions.filter((tx) => {
    if (txFilter === 'in') return tx.type === 'earned' || tx.type === 'received';
    if (txFilter === 'out') return tx.type === 'sent' || tx.type === 'spent';
    return true;
  });

  const totalEarned = transactions
    .filter((t) => t.type === 'earned' || t.type === 'received')
    .reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions
    .filter((t) => t.type === 'sent' || t.type === 'spent')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-5">Wallet</h1>

      {/* Balance card */}
      <div className="relative bg-reads-navy rounded-3xl p-6 mb-5 overflow-hidden shadow-reads-card">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-reads-gold/10 rounded-full" />
        <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-reads-green/10 rounded-full" />
        <div className="relative z-10">
          <p className="text-reads-muted-light text-xs uppercase tracking-widest mb-1">Total Balance</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="font-black text-reads-gold text-4xl">{balance.toLocaleString()}</span>
            <span className="text-reads-muted-light font-semibold text-sm pb-1">$READS</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowSend(true)}
              className="flex-1 bg-reads-gold text-reads-navy font-bold text-sm rounded-2xl py-3 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <Send size={16} /> Send
            </button>
            <button className="flex-1 bg-white/10 text-white font-bold text-sm rounded-2xl py-3 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <RefreshCw size={16} /> Convert
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="reads-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={16} className="text-reads-green" />
            <p className="text-reads-muted text-xs">Total Earned</p>
          </div>
          <p className="font-black text-reads-navy text-lg">{totalEarned.toLocaleString()}</p>
          <p className="text-reads-muted text-xs">$READS</p>
        </div>
        <div className="reads-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-reads-red" />
            <p className="text-reads-muted text-xs">Total Spent</p>
          </div>
          <p className="font-black text-reads-navy text-lg">{totalSpent.toLocaleString()}</p>
          <p className="text-reads-muted text-xs">$READS</p>
        </div>
      </div>

      {/* Cardano wallet section */}
      <CardanoSection
        linkedAddress={cardanoAddress}
        onLinked={(addr) => setCardano(addr)}
        onUnlinked={() => setCardano('')}
        showToast={showToast}
      />

      {/* On-chain claim section */}
      <ClaimSection
        linkedAddress={cardanoAddress}
        showToast={showToast}
      />

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-reads-navy text-base">Transactions</h2>
          <div className="flex gap-1.5">
            {['all', 'in', 'out'].map((f) => (
              <button key={f} onClick={() => setTxFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  txFilter === f ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingOverlay message="Loading transactions…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Coins} title="No transactions" description="Your transaction history will appear here." />
        ) : (
          <div className="reads-card px-4">
            {filtered.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>

      {showSend && (
        <SendModal balance={balance} onClose={() => setShowSend(false)} onSent={handleSent} />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
