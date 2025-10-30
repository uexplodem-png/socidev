import React from 'react';
import { useAdminPermission } from '../hooks/useAdminPermission';
import { NoPermission } from './NoPermission';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredPermission: string;
  pageName?: string;
}

/**
 * Wrapper component that checks permission before rendering page content
 * Shows NoPermission component if user doesn't have required permission
 */
export const ProtectedPage: React.FC<ProtectedPageProps> = ({ 
  children, 
  requiredPermission,
  pageName 
}) => {
  const hasPermission = useAdminPermission(requiredPermission);

  if (!hasPermission) {
    return (
      <NoPermission 
        requiredPermission={requiredPermission}
        message={pageName ? `You don't have permission to access ${pageName}` : undefined}
      />
    );
  }

  return <>{children}</>;
};
