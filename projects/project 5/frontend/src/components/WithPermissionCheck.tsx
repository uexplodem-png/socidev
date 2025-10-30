import React from 'react';
import { useAuth } from '../context/AuthContext';
import NoPermission from './NoPermission';

interface WithPermissionCheckProps {
  permission: string;
  permissionName?: string;
  requiredMode?: 'taskDoer' | 'taskGiver' | 'both';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * HOC to wrap components and check if user has required permission
 * Shows NoPermission component if access is denied
 */
const WithPermissionCheck: React.FC<WithPermissionCheckProps> = ({
  permission,
  permissionName,
  requiredMode,
  fallback,
  children,
}) => {
  const { canUsePermission } = useAuth();
  const permissionCheck = canUsePermission(permission);

  if (!permissionCheck.canUse || permissionCheck.isRestricted) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <NoPermission
        title={permissionCheck.isRestricted ? 'Erişim Kısıtlanmış' : 'Erişim Reddedildi'}
        message={
          permissionCheck.isRestricted
            ? 'Bu özelliğe erişiminiz geçici olarak kısıtlanmıştır.'
            : 'Bu özelliği kullanmak için gerekli izniniz bulunmamaktadır.'
        }
        permissionName={permissionName || permission}
        requiredMode={requiredMode}
      />
    );
  }

  return <>{children}</>;
};

export default WithPermissionCheck;
