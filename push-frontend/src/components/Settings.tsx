import React, { useState } from 'react';
import { Moon, Sun, User, LogOut, ChevronRight, Globe, BarChart, X, Check } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useUser } from '../UserContext';

interface SettingsProps {
  onLogout?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, level, updateLanguage, updateLevel } = useUser();
  
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempName, setTempName] = useState(user.name || '');
  const [tempEmail, setTempEmail] = useState(user.email || '');

  const handleLogout = () => {
// Only remove authentication data, keep progress tracking
localStorage.removeItem('token');
localStorage.removeItem('user');

if (onLogout) {
onLogout();
} else {
window.location.href = '/login';
    }
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: tempName, email: tempEmail };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditModalOpen(false);
    alert("Profile Updated Successfully!");
  };

  return (
    <div className={`p-4 pb-24 min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-800'
    }`}>
      <h1 className="text-2xl font-bold mb-6 pt-4">Settings</h1>

      {/* Profile Card */}
      <div className={`${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4 mb-6 border flex items-center`}>
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
          {user.name?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="font-bold text-lg">{user.name || 'User'}</h2>
          <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-500 text-sm'}>{user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Preferences */}
        <h3 className={`text-xs font-bold uppercase tracking-wider px-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Preferences
        </h3>
        
        <div className={`${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white'} rounded-2xl border p-4 cursor-pointer`} onClick={toggleDarkMode}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${darkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <span className="font-medium">Dark Mode</span>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </div>
        </div>

        {/* Learning Configuration */}
        <div className={`${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white'} rounded-2xl border overflow-hidden`}>
          <div className={`flex items-center justify-between p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-100'}`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Globe size={20} />
              </div>
              <span className="font-medium">Learning Language</span>
            </div>
            <select value={language} onChange={(e) => updateLanguage(e.target.value)} className={`bg-transparent font-medium outline-none text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <option value="English">English</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                <BarChart size={20} />
              </div>
              <span className="font-medium">Learning Level</span>
            </div>
            <select value={level} onChange={(e) => updateLevel(e.target.value)} className={`bg-transparent font-medium outline-none text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Account Section */}
        <h3 className={`text-xs font-bold uppercase tracking-wider px-2 pt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Account
        </h3>
        <div className={`${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white'} rounded-2xl border overflow-hidden`}>
          <div onClick={() => setIsEditModalOpen(true)} className={`flex items-center justify-between p-4 cursor-pointer hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <User size={20} />
              </div>
              <span className="font-medium">Edit Profile</span>
            </div>
            <ChevronRight size={18} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
          </div>
        </div>

        <button onClick={handleLogout} className="w-full mt-6 flex items-center justify-center p-4 rounded-2xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all">
          <LogOut size={20} className="mr-2" /> Logout
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'} w-full max-w-sm rounded-3xl p-6 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={24} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase ml-1 opacity-50">Full Name</label>
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border-2 outline-none ${darkMode ? 'bg-gray-900 border-gray-700 focus:border-blue-500' : 'bg-gray-50 border-gray-100 focus:border-blue-400'}`} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase ml-1 opacity-50">Email Address</label>
                <input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className={`w-full mt-1 p-3 rounded-xl border-2 outline-none ${darkMode ? 'bg-gray-900 border-gray-700 focus:border-blue-500' : 'bg-gray-50 border-gray-100 focus:border-blue-400'}`} />
              </div>
            </div>
            <div className="flex space-x-3 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={handleSaveProfile} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center"><Check size={18} className="mr-1" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};