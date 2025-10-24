import React from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex">
      {isAuthenticated && <Sidebar className="hidden md:block" />}
      <div className={`flex-1 flex flex-col ${isAuthenticated ? 'md:pl-64' : ''}`}>
        {!isAuthenticated && <Header />}
        {isAuthenticated && <Topbar />}
        <main className={`flex-grow ${isAuthenticated ? 'bg-gray-50' : ''}`}>
          {isAuthenticated ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          ) : (
            children
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};