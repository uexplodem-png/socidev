import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredMode?: 'taskGiver' | 'taskDoer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredMode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const userMode = localStorage.getItem('userMode') as 'taskGiver' | 'taskDoer';

  // Show nothing while loading
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredMode && userMode !== requiredMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};