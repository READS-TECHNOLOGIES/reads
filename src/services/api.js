import React, { useState } from 'react';
import { User, Mail, Calendar, LogOut, Shield, Trash2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

const ProfileModule = ({ user, onLogout }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await api.auth.deleteAccount();
      
      // Account deleted successfully
      alert('Your account has been permanently deleted.');
      // Redirect to home or login page
      window.location.href = '/';
      
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
      console.error('Delete account error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const CardItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between p-4 bg-primary-navy dark:bg-dark-card rounded-xl border border-cyan/20">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-cyan dark:text-cyan" />
        <span className="text-card-muted dark:text-card-muted font-medium">{label}</span>
      </div>
      <span className="font-semibold text-card-light dark:text-card-light break-all text-right text-sm">{value}</span>
    </div>
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-primary-navy dark:text-card-light">User Profile</h2>
        
        {/* Avatar and Basic Info */}
        <div className="text-center p-8 bg-primary-navy dark:bg-dark-card rounded-2xl shadow-xl border border-cyan/30">
          <img 
              src={user.avatar} 
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-cyan dark:border-cyan" 
              alt="Profile" 
          />
          <h3 className="text-xl font-bold text-card-light dark:text-card-light">{user.name}</h3>
          <p className="text-sm text-card-muted">{user.email}</p>
          
          {user.is_admin && (
               <span className="mt-2 inline-flex items-center gap-1 bg-orange/20 text-orange text-xs font-medium px-3 py-1 rounded-full border border-orange">
                  <Shield size={12} /> Administrator
              </span>
          )}
        </div>

        {/* Account Details */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-primary-navy dark:text-card-light border-b border-cyan/30 pb-2">Account Details</h3>
          
          <CardItem icon={User} label="User ID" value={user.id} />
          
          <CardItem icon={Mail} label="Email" value={user.email} />
          
          <CardItem 
            icon={Calendar} 
            label="Member Since" 
            value={formatDate(user.joined)} 
          />
        </div>
          
        {/* Action Buttons */}
        <div className="pt-4 space-y-3">
          <button 
            onClick={onLogout}
            className="w-full py-3 rounded-xl bg-orange text-white font-bold hover:bg-orange-light transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <LogOut size={18} /> Log Out
          </button>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Trash2 size={18} /> Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cyan/30">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-card-light mb-2">
                  Delete Account
                </h2>
                <p className="text-gray-600 dark:text-card-muted text-sm">
                  This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-card-muted mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-primary-navy text-gray-900 dark:text-card-light"
                placeholder="DELETE"
                disabled={isDeleting}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                  setError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 dark:border-cyan/30 text-gray-700 dark:text-card-light rounded-lg hover:bg-gray-50 dark:hover:bg-primary-navy transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'DELETE'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileModule;