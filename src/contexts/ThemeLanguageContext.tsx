import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language, type Translations } from '../lib/i18n';

type Theme = 'light' | 'dark' | 'system';

interface ThemeLanguageContextType {
  language: Language;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (key: keyof Translations) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('juba_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar'; // Default Arabic as requested by prompt title جوبا نيوز
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    localStorage.setItem('juba_theme', 'dark');
    return 'dark';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;
  const direction: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', direction);
    localStorage.setItem('juba_lang', language);
  }, [language, direction]);

  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('juba_theme', theme);
  }, [theme, resolvedTheme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const t = (key: keyof Translations): string => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || String(key);
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        language,
        direction,
        isRTL,
        theme,
        resolvedTheme,
        setLanguage,
        setTheme,
        t,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within ThemeLanguageProvider');
  }
  return context;
};
