import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedElementProps {
    permission?: string;
    permissions?: string[]; // Multiple permissions
    requireAll?: boolean; // Require all permissions (default: false, requires any)
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Conditionally render children based on user permissions.
 * 
 * @example
 * <ProtectedElement permission="users.edit">
 *   <EditButton />
 * </ProtectedElement>
 * 
 * @example
 * <ProtectedElement 
 *   permissions={['users.edit', 'users.delete']} 
 *   requireAll
 *   fallback={<ViewOnlyMessage />}
 * >
 *   <AdminControls />
 * </ProtectedElement>
 */
export const ProtectedElement: React.FC<ProtectedElementProps> = ({
    permission,
    permissions,
    requireAll = false,
    fallback = null,
    children,
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

    // Show nothing while loading
    if (isLoading) {
        return <>{fallback}</>;
    }

    // Check single permission
    if (permission) {
        if (!hasPermission(permission)) {
            return <>{fallback}</>;
        }
        return <>{children}</>;
    }

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
        const hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);

        if (!hasAccess) {
            return <>{fallback}</>;
        }
        return <>{children}</>;
    }

    // No permission specified, render children
    return <>{children}</>;
};

export default ProtectedElement;
