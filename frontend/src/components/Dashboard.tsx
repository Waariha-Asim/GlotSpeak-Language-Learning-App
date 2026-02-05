import React, { useEffect, useState } from 'react';
import { MessageCircle, Mic, BookOpen, PenTool, Flame, Target } from 'lucide-react';
import type { Page } from '../App';
import { useTheme } from '../ThemeContext'; // ✅ Global Theme use karne ke liye import

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [userName, setUserName] = useState<string>('');
  const { darkMode } = useTheme(); // ✅ Dark mode state le li

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserName(parsed.name || '');
    }
  }, []);

  return (
    <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${
      darkMode 
        ? "bg-gray-900" 
        : "bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500"
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Hi, {userName || 'there'}! 👋</h1>
          <p className={darkMode ? "text-gray-400" : "text-purple-100"}>Ready to practice today?</p>
        </div>
        <div className={`${darkMode ? "bg-gray-800" : "bg-white/20"} backdrop-blur-lg rounded-full p-3 flex items-center`}>
          <Flame className="text-orange-300" size={24} />
          <span className="text-white font-bold ml-1">7</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className={`${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white/10"} backdrop-blur-lg rounded-2xl p-4 mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Today's Goal</h3>
          <Target className="text-green-300" size={20} />
        </div>
        <div className="flex items-center mb-2">
          <div className={`flex-1 rounded-full h-2 mr-3 ${darkMode ? "bg-gray-700" : "bg-white/20"}`}>
            <div className="bg-green-400 h-2 rounded-full w-3/4"></div>
          </div>
          <span className="text-white text-sm">15/20 min</span>
        </div>
        <p className={darkMode ? "text-gray-400 text-sm" : "text-purple-100 text-sm"}>Keep it up! You're almost there.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => onNavigate('conversation')}
          className={`rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 text-left ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
        >
          <MessageCircle className="text-purple-500 mb-2" size={24} />
          <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Conversation</h4>
          <p className={darkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>AI Dialogues</p>
        </button>
        
        <button
          onClick={() => onNavigate('speech')}
          className={`rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 text-left ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
        >
          <Mic className="text-blue-500 mb-2" size={24} />
          <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Pronunciation</h4>
          <p className={darkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>Speech Practice</p>
        </button>
      </div>

      {/* Main Features */}
      <div className="space-y-2">
        <button
          onClick={() => onNavigate('library')}
          className={`w-full rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
        >
          <div className="flex items-center">
            <BookOpen className="text-indigo-500 mr-3" size={24} />
            <div className="text-left">
              <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Lesson Library</h4>
              <p className={darkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>1,000+ lessons</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('grammar')}
          className={`w-full rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
        >
          <div className="flex items-center">
            <PenTool className="text-green-500 mr-3" size={24} />
            <div className="text-left">
              <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Grammar & Vocab</h4>
              <p className={darkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>Interactive exercises</p>
            </div>
          </div>
        </button>

        <a
          href="https://docs.google.com/forms/u/0/d/e/1FAIpQLSdxId_61SJhXigbZ7KHwPugmpxtcf35us8pXAiqrZQrM43Kqw/formResponse"
          target="_blank"
          rel="noreferrer"
          className={`w-full rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 block ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
        >
          <div className="flex items-center">
            <PenTool className="text-blue-500 mr-3" size={24} />
            <div className="text-left">
              <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Submit Feedback</h4>
              <p className={darkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>Share your thoughts on GlotSpeak</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};
