import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from './ThemeContext';
import { UserProvider } from './UserContext'; // ✅ Added this import
import { useProgressTracking } from './hooks/useProgressTracking';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ConversationLessons } from './components/ConversationLessons';
import { SpeechRecognition } from './components/SpeechRecognition';
import { LessonLibrary } from './components/LessonLibrary';
import { GrammarVocab } from './components/GrammarVocab';
import { Progress } from './components/Progress';
import { Settings } from './components/Settings';
import { Register } from './components/Register';
import { Login } from './components/login';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';

export type Page = 'dashboard' | 'conversation' | 'speech' | 'tutor' | 'library' | 'grammar' | 'progress' | 'settings' | 'community' | 'login' | 'register' | 'forgot' | 'reset-password';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  language: string;
  level: string;
}

function AppContent() {
  const { darkMode } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [user, setUser] = useState<User | null>(null);
  
  // Global progress tracking - works across all pages
  useProgressTracking();

  useEffect(() => {
    if (window.location.pathname.includes("reset-password")) {
      setCurrentPage("reset-password");
    }
  }, []);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    localStorage.setItem('token', authToken);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login': return <Login onNavigate={setCurrentPage} onLogin={handleLogin} />;
      case 'register': return <Register onNavigate={setCurrentPage} />;
      case 'forgot': return <ForgotPassword onNavigate={setCurrentPage} />;
      case 'reset-password': return <ResetPassword onNavigate={setCurrentPage} />;
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'conversation': return <ConversationLessons />;
      case 'speech': return <SpeechRecognition />;
      case 'library': return <LessonLibrary />;
      case 'grammar': return <GrammarVocab />;
      case 'progress': return <Progress />;
      case 'settings': return <Settings onLogout={handleLogout} />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const showNavigation = user && !['login', 'register', 'forgot', 'reset-password'].includes(currentPage);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-950" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
      <div className={`max-w-md mx-auto min-h-screen shadow-xl transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
        {renderPage()}
        {showNavigation && (
          <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider> {/* ✅ Wrap with UserProvider here */}
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}