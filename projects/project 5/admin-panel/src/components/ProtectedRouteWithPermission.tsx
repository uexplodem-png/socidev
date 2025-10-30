import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { usePermissions } from '../hooks/usePermissions';
import { NoPermission } from './NoPermission';

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

    // If user doesn't have required permissions, show NoPermission component
    if (!hasAccess) {
        const requiredPermission = permission || (permissions && permissions.length > 0 ? permissions.join(', ') : 'unknown');
        return <NoPermission requiredPermission={requiredPermission} />;
    }

    return <>{children}</>;
};
