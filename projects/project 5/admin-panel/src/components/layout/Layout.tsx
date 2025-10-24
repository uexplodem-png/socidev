import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { validateToken } from '../../store/slices/authSlice';
import { setTheme } from '../../store/slices/themeSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from '../ui/Toast';
import { cn } from '../../utils/cn';

const Layout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, mode } = useAppSelector(state => state.theme);
  const { isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      dispatch(setTheme(savedTheme));
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      dispatch(setTheme('dark'));
    }

    // Validate token on app start
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(validateToken());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main className="pt-16 p-6">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default Layout;