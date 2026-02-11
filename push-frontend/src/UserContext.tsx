import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  language: string;
  level: string;
  updateLanguage: (lang: string) => void;
  updateLevel: (lvl: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // LocalStorage se initial values uthayein ya default set karein
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'English');
  const [level, setLevel] = useState(localStorage.getItem('app_level') || 'Beginner');

  const updateLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  const updateLevel = (lvl: string) => {
    setLevel(lvl);
    localStorage.setItem('app_level', lvl);
  };

  return (
    <UserContext.Provider value={{ language, level, updateLanguage, updateLevel }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};