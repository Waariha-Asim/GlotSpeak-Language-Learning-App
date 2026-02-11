import React from 'react';
import { Home, MessageCircle, Mic, TrendingUp, Settings } from 'lucide-react';
import type { Page } from '../App';
import { useTheme } from '../ThemeContext'; // ✅ Global Theme import kiya

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard', icon: Home, label: 'Home' },
  { id: 'conversation', icon: MessageCircle, label: 'Chat' },
  { id: 'speech', icon: Mic, label: 'Speech' },
  { id: 'progress', icon: TrendingUp, label: 'Progress' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const { darkMode } = useTheme(); // ✅ Dark mode state le li

  return (
    <nav className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md border-t transition-colors duration-300 ${
      darkMode 
        ? "bg-gray-900 border-gray-800" 
        : "bg-white border-gray-200"
    } px-4 py-2 z-50`}>
      <div className="flex justify-around">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = currentPage === id;
          
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? (darkMode ? 'text-purple-400 bg-purple-900/30' : 'text-purple-600 bg-purple-50')
                  : (darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};