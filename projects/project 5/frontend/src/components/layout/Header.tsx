import { useState, useEffect } from 'react';
import { Menu, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { Sidebar } from './Sidebar';

export const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const mobileMenu = document.getElementById('mobile-menu');
      const menuButton = document.getElementById('menu-button');

      if (mobileMenu && menuButton &&
        !mobileMenu.contains(event.target as Node) &&
        !menuButton.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Hide header for non-authenticated users
  if (!isAuthenticated) {
    return null;
  }
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            id="menu-button"
            className="p-2 rounded-lg hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
          <h1 className="text-xl font-bold text-white">
            {t('appName')}
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {isAuthenticated ? (
            <>
              <span className="text-white/90">{user?.email}</span>
              <Button
                variant="outline"
                onClick={logout}
                className="text-white border-white/20 hover:bg-white/10 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </Button>
            </>
          ) : null}
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:hidden`}
      >
        <Sidebar isMobile={true} onClose={() => setIsMobileMenuOpen(false)} />
      </div>
    </header>
  );
};
