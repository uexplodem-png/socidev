import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { NoPermission } from './NoPermission';

interface ProtectedPageProps {
    children: React.ReactNode;
    requiredPermission: string;
    pageName?: string;
}

/**
 * Wrapper component that checks permission before rendering page content
 * Shows NoPermission component if user doesn't have required permission
 * Uses usePermissions which fetches from backend API
 */
export const ProtectedPage: React.FC<ProtectedPageProps> = ({
    children,
    requiredPermission,
    pageName
}) => {
    const { hasPermission, isLoading } = usePermissions();

    // Show loading state while checking permissions
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Check permission
    if (!hasPermission(requiredPermission)) {
        return (
            <NoPermission
                requiredPermission={requiredPermission}
                message={pageName ? `You don't have permission to access ${pageName}` : undefined}
            />
        );
    }

    return <>{children}</>;
};
