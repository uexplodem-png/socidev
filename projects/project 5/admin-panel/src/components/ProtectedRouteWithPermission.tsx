import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteWithPermissionProps {
  children: React.ReactNode;
  permission?: string; // Single permission key (e.g., 'users.view')
  permissions?: string[]; // Multiple permissions
  requireAll?: boolean; // If true, user must have ALL permissions (default: false = ANY)
  requireAdmin?: boolean; // If true, must be admin/moderator/super_admin
}

/**
 * Protected route component with RBAC permission checking.
 * 
 * Features:
 * - Checks authentication status
 * - Verifies admin role (if requireAdmin=true)
 * - Validates user has required permissions
 * - Shows loading state during permission checks
 * - Redirects unauthorized users to /login
 * 
 * @example
 * // Single permission
 * <ProtectedRouteWithPermission permission="users.view">
 *   <UsersPage />
 * </ProtectedRouteWithPermission>
 * 
 * @example
 * // Multiple permissions (ANY)
 * <ProtectedRouteWithPermission permissions={['orders.view', 'orders.edit']}>
 *   <OrdersPage />
 * </ProtectedRouteWithPermission>
 * 
 * @example
 * // Multiple permissions (ALL required)
 * <ProtectedRouteWithPermission 
 *   permissions={['users.view', 'users.edit']} 
 *   requireAll
 * >
 *   <UserEditPage />
 * </ProtectedRouteWithPermission>
 */
export const ProtectedRouteWithPermission: React.FC<ProtectedRouteWithPermissionProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  requireAdmin = true,
}) => {
  const { isAuthenticated, user, token, loading: authLoading } = useAppSelector(state => state.auth);
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading: permissionsLoading } = usePermissions();
  const location = useLocation();

  // Check if we have a token but haven't validated it yet (app just loaded)
  const hasToken = !!token;

  // Show loading state while validating token or loading permissions
  if (authLoading || permissionsLoading || (hasToken && !isAuthenticated && !user)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin privileges if required
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator';
  if (requireAdmin && !isAdmin) {
    return <Navigate 
      to="/login" 
      state={{ 
        from: location, 
        error: 'Access denied. Admin privileges required.' 
      }} 
      replace 
    />;
  }

  // Check permissions if specified
  let hasAccess = true;

  if (permission) {
    // Single permission check
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    // Multiple permissions check
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  // If user doesn't have required permissions, show access denied page
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg 
              className="mx-auto h-12 w-12 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          {permission && (
            <p className="text-sm text-gray-500 mb-6">
              Required permission: <code className="bg-gray-100 px-2 py-1 rounded">{permission}</code>
            </p>
          )}
          {permissions && permissions.length > 0 && (
            <div className="text-sm text-gray-500 mb-6">
              <p className="mb-2">Required permissions ({requireAll ? 'ALL' : 'ANY'}):</p>
              <ul className="space-y-1">
                {permissions.map((perm) => (
                  <li key={perm}>
                    <code className="bg-gray-100 px-2 py-1 rounded">{perm}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
