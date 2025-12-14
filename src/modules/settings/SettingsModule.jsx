import React from 'react';
import { Moon, Sun, ShieldCheck } from 'lucide-react';

const SettingsModule = ({ darkMode, toggleTheme }) => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-bold text-primary-navy dark:text-card-light">Settings</h2>
    
    {/* Theme Toggle */}
    <div className="bg-primary-navy dark:bg-dark-card rounded-2xl shadow-lg p-6 flex justify-between items-center border border-cyan/30">
      <div className="flex items-center gap-4">
        {darkMode 
            ? <Moon size={24} className="text-cyan" /> 
            : <Sun size={24} className="text-orange" />
        }
        <div>
            <span className="font-bold text-card-light dark:text-card-light">Dark Mode</span>
            <p className='text-sm text-card-muted'>Switch between light and dark themes.</p>
        </div>
      </div>
      <button 
        onClick={toggleTheme} 
        className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'bg-cyan' : 'bg-primary-navy-dark'}`}
      >
        <div 
            className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`} 
        />
      </button>
    </div>

    {/* Version Info */}
    <div className='pt-8 text-center text-card-muted text-sm space-y-2'>
        <ShieldCheck size={20} className='mx-auto text-cyan'/>
        <p>Application Version 1.0.0 (MVP)</p>
        <p>Backend powered by Python/FastAPI.</p>
    </div>
  </div>
);

export default SettingsModule;