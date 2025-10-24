import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = true // Changed default to true for admin panel
}) => {
  const { isAuthenticated, user, token, loading } = useAppSelector(state => state.auth);
  const location = useLocation();

  // Check if we have a token but haven't validated it yet (app just loaded)
  const hasToken = !!token;

  // Show loading state while validating token or during initial load
  if (loading || (hasToken && !isAuthenticated && !user)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator';

  if (requireAdmin && !isAdmin) {
    // Redirect non-admin users to login page with an error
    return <Navigate to="/login" state={{ from: location, error: 'Access denied. Admin privileges required.' }} replace />;
  }

  return <>{children}</>;
};