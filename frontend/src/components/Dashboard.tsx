import React, { useEffect, useState } from 'react';
import { MessageCircle, Mic, BookOpen, PenTool, Flame, Target } from 'lucide-react';
import type { Page } from '../App';
import { useTheme } from '../ThemeContext';

// Logo import
import logo from '../assets/images/glotspeak_logo.png';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [userName, setUserName] = useState<string>('');
  const { darkMode } = useTheme();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserName(parsed.name || '');
    }
  }, []);

  return (
    <div className={`p-4 min-h-screen transition-colors duration-300 ${
      darkMode 
        ? "bg-gray-900" 
        : "bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500"
    }`}>
      
      {/* Logo Section */}
      <div className="flex justify-start pt-6 mb-2">
        <img 
          src={logo} 
          alt="GlotSpeak" 
          className="h-10 w-auto drop-shadow-lg" 
        />
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Hi, {userName || 'there'}! 👋</h1>
          <p className={darkMode ? "text-gray-400" : "text-purple-100"}>Ready to practice today?</p>
        </div>
        <div className={`${darkMode ? "bg-gray-800" : "bg-white/20"} backdrop-blur-lg rounded-full px-4 py-2 flex items-center shadow-lg border border-white/10`}>
          <Flame className="text-orange-400" size={20} />
          <span className="text-white font-bold ml-2 text-lg">7</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className={`${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white/10"} backdrop-blur-lg rounded-2xl p-4 mb-6 shadow-xl border border-white/10`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Today's Goal</h3>
          <Target className="text-green-300" size={20} />
        </div>
        <div className="flex items-center mb-2">
          <div className={`flex-1 rounded-full h-2 mr-3 ${darkMode ? "bg-gray-700" : "bg-white/20"}`}>
            <div className="bg-green-400 h-2 rounded-full w-3/4 shadow-[0_0_10px_rgba(74,222,128,0.4)]"></div>
          </div>
          <span className="text-white text-sm font-bold">15/20 min</span>
        </div>
        <p className={darkMode ? "text-gray-400 text-sm" : "text-purple-100 text-sm"}>Keep it up! You're almost there.</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => onNavigate('conversation')}
          className={`rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 text-left border border-transparent ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
          }`}
        >
          <div className="bg-purple-100 dark:bg-purple-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <MessageCircle className="text-purple-500" size={22} />
          </div>
          <h4 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Conversation</h4>
          <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>AI Dialogues</p>
        </button>
        
        <button
          onClick={() => onNavigate('speech')}
          className={`rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 text-left border border-transparent ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
          }`}
        >
          <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <Mic className="text-blue-500" size={22} />
          </div>
          <h4 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Pronunciation</h4>
          <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>Speech Practice</p>
        </button>
      </div>

      {/* Main Features List */}
      <div className="space-y-3">
        <button
          onClick={() => onNavigate('library')}
          className={`w-full rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 border border-transparent ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
        >
          <div className="flex items-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-4">
              <BookOpen className="text-indigo-500" size={24} />
            </div>
            <div className="text-left">
              <h4 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Lesson Library</h4>
              <p className={darkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>1,000+ lessons</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('grammar')}
          className={`w-full rounded-2xl p-4 shadow-lg transition-all duration-200 transform hover:scale-105 border border-transparent ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
        >
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-4">
              <PenTool className="text-green-500" size={24} />
            </div>
            <div className="text-left">
              <h4 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Grammar & Vocab</h4>
              <p className={darkMode ? "text-gray-400 text-sm" : "text-gray-500 text-sm"}>Interactive exercises</p>
            </div>
          </div>
        </button>
      </div>

      {/* Extra Large Spacer for Future Links & Better UX */}
      <div className="h-40 flex flex-col items-center justify-center">
          {/* Yahan future mein links aayenge */}
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
          <div className="w-12 h-1 bg-white/10 rounded-full mb-4"></div> {/* Subtle visual separator */}
          <p className="text-white/30 text-xs font-medium tracking-widest uppercase">
            GlotSpeak AI
          </p>
          
      </div>
      
    </div>
  );
};