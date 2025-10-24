import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'tr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const contextValue = useMemo(() => {
    const t = (key: string, params?: Record<string, string | number>): string => {
      const text = translations[language][key as keyof typeof translations[typeof language]] || key;
      
      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, value]) => {
          return acc.replace(`{{${paramKey}}}`, String(value));
        }, text);
      }
      
      return text;
    };

    return { language, setLanguage, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};