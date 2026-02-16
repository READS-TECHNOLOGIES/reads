import React, { useState } from 'react';
import { User, Mail, Calendar, LogOut, Shield, Trash2, AlertCircle, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

const ProfileModule = ({ user, onLogout }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText]         = useState('');
  const [isDeleting, setIsDeleting]           = useState(false);
  const [error, setError]                     = useState('');

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') { setError('Please type DELETE to confirm'); return; }
    setIsDeleting(true);
    setError('');
    try {
      await api.auth.deleteAccount();
      alert('Your account has been permanently deleted.');
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="animate-fade-in pb-8">

        {/* ── Page title ── */}
        <div className="px-4 pt-5 pb-4">
          <h2 className="text-reads-navy font-bold text-base">Profile</h2>
        </div>

        {/* ── Avatar card ── */}
        <div className="mx-4 bg-white rounded-2xl shadow-reads-card p-6 flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            <img
              src={user.avatar}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4 border-reads-green shadow-reads-green"
            />
            {user.is_admin && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-reads-gold rounded-full flex items-center justify-center border-2 border-white">
                <Shield size={12} className="text-reads-navy" />
              </div>
            )}
          </div>
          <h3 className="text-reads-navy font-black text-lg leading-tight">{user.name}</h3>
          <p className="text-reads-muted text-sm mt-0.5">{user.email}</p>
          {user.is_admin && (
            <span className="mt-2 inline-flex items-center gap-1 bg-reads-gold/15 text-reads-gold-dark text-xs font-semibold px-3 py-1 rounded-full border border-reads-gold/30">
              <Shield size={11} /> Administrator
            </span>
          )}
        </div>

        {/* ── Account details ── */}
        <div className="mx-4 bg-white rounded-2xl shadow-reads-card overflow-hidden mb-4">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-reads-navy font-bold text-sm">Account Details</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { icon: User,     label: 'User ID',       value: user.id },
              { icon: Mail,     label: 'Email',         value: user.email },
              { icon: Calendar, label: 'Member Since',  value: formatDate(user.joined) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-full bg-reads-green-bg flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-reads-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-reads-muted text-xs">{label}</p>
                  <p className="text-reads-navy text-sm font-semibold truncate">{value}</p>
                </div>
                <ChevronRight size={16} className="text-gray-200 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="mx-4 space-y-3">
          {/* Log out */}
          <button
            onClick={onLogout}
            className="w-full bg-white rounded-2xl shadow-reads-card px-4 py-4 flex items-center gap-3 hover:shadow-reads-green transition-shadow group"
          >
            <div className="w-9 h-9 rounded-full bg-reads-green-bg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <LogOut size={17} className="text-reads-green" />
            </div>
            <span className="flex-1 text-left text-reads-navy font-semibold text-sm">Log Out</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          {/* Delete account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-white rounded-2xl shadow-reads-card px-4 py-4 flex items-center gap-3 hover:shadow-[0_4px_16px_rgba(239,68,68,0.2)] transition-shadow group"
          >
            <div className="w-9 h-9 rounded-full bg-reads-red-bg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Trash2 size={17} className="text-reads-red" />
            </div>
            <span className="flex-1 text-left text-reads-red font-semibold text-sm">Delete Account</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        {/* ── Version note ── */}
        <p className="text-center text-reads-muted text-xs mt-8">$READS v1.0 · Learn. Earn. Excel.</p>

      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-reads-navy/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">

            {/* Icon + heading */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-reads-red-bg flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-reads-red" />
              </div>
              <div>
                <h2 className="text-reads-navy font-bold text-base">Delete Account</h2>
                <p className="text-reads-muted text-xs mt-1 leading-relaxed">
                  This action <span className="font-semibold text-reads-red">cannot be undone</span>. All your data, tokens, and progress will be permanently removed.
                </p>
              </div>
            </div>

            {/* Confirm input */}
            <div className="mb-4">
              <label className="block text-reads-navy text-xs font-semibold mb-2">
                Type <span className="text-reads-red font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => { setConfirmText(e.target.value); setError(''); }}
                placeholder="DELETE"
                disabled={isDeleting}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-reads-navy text-sm
                           focus:outline-none focus:border-reads-red focus:ring-2 focus:ring-reads-red/20
                           placeholder-reads-muted-light disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-reads-red-bg border border-reads-red/20 rounded-xl text-reads-red text-xs font-medium">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setConfirmText(''); setError(''); }}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-reads-navy text-sm font-semibold
                           hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'DELETE'}
                className="flex-1 py-3 rounded-xl bg-reads-red text-white text-sm font-bold
                           hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileModule;
