import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('scalperlab_theme') as ThemeMode;
    return saved || 'scuro'; // Default sleek dark look as in reference
  });

  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('scalperlab_theme', theme);

    const updateClass = () => {
      let activeIsDark = true;
      if (theme === 'chiaro') {
        activeIsDark = false;
      } else if (theme === 'scuro') {
        activeIsDark = true;
      } else {
        // Auto
        activeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(activeIsDark);
      const root = document.documentElement;
      if (activeIsDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        document.body.style.backgroundColor = '#0B0E11';
        document.body.style.color = '#F1F5F9';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        document.body.style.backgroundColor = '#F8FAFC';
        document.body.style.color = '#0F172A';
      }
    };

    updateClass();

    if (theme === 'auto') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateClass();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
