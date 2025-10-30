import React from 'react';
import { useRole } from '../hooks/useRole';
import NoPermission from './NoPermission';

interface WithPermissionCheckProps {
    permission: keyof ReturnType<typeof useRole>;
    fallback?: React.ReactNode;
    requiredRole?: string;
    children: React.ReactNode;
}

/**
 * HOC to wrap components and check if user has required permission
 * Shows NoPermission component if access is denied
 */
const WithPermissionCheck: React.FC<WithPermissionCheckProps> = ({
    permission,
    fallback,
    requiredRole,
    children,
}) => {
    const rolePermissions = useRole();
    const hasPermission = rolePermissions[permission];

    if (!hasPermission) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <NoPermission
                title="Access Denied"
                message="You do not have the required permissions to access this page."
                requiredPermission={permission}
                requiredRole={requiredRole}
            />
        );
    }

    return <>{children}</>;
};

export default WithPermissionCheck;
export { WithPermissionCheck };
