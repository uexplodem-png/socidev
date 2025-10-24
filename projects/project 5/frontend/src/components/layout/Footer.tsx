import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Footer = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (isAuthenticated) {
    return (
      <footer className="bg-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">{t('footerText')}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('aboutUs')}</h3>
            <p className="text-gray-300">{t('aboutDescription')}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white">{t('home')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">{t('about')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">{t('contact')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('contact')}</h3>
            <p className="text-gray-300">{t('contactEmail')}: info@example.com</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-300">
            &copy; {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};