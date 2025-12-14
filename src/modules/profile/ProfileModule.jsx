import React from 'react';
import { User, Mail, Calendar, LogOut, Shield } from 'lucide-react';
// The user object passed from App.jsx already contains all necessary data.

const ProfileModule = ({ user, onLogout }) => {
  
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    // The user.joined field is expected to be an ISO string from the backend
    const date = new Date(isoString);
    return date.toLocaleDateString();
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
        
      {/* Action Button */}
      <div className="pt-4">
        <button 
          onClick={onLogout}
          className="w-full py-3 rounded-xl bg-orange text-white font-bold hover:bg-orange-light transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileModule;