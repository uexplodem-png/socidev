import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useSettingsStore } from '../../store/settingsStore';

interface ProtectedButtonProps {
  permission?: string;
  featureFlag?: string;
  requireBoth?: boolean; // If true, both permission and feature flag must pass
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any; // Allow other props
}

/**
 * A button component that respects permissions and feature flags.
 * 
 * - If permission is required and user lacks it, button is hidden or disabled
 * - If feature flag is off, button is disabled with tooltip
 * - Combines permission checks with feature flag checks
 * 
 * @example
 * <ProtectedButton
 *   permission="transactions.approve"
 *   featureFlag="features.transactions.approveEnabled"
 *   onClick={handleApprove}
 * >
 *   Approve
 * </ProtectedButton>
 */
export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  permission,
  featureFlag,
  requireBoth = true,
  children,
  fallback = null,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) => {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { getFeatureFlag } = useSettingsStore();

  // Check permission
  const hasRequiredPermission = !permission || hasPermission(permission);
  
  // Check feature flag
  const featureEnabled = !featureFlag || getFeatureFlag(featureFlag);

  // Determine if button should be shown/enabled
  let shouldShow = true;
  let shouldDisable = disabled;
  let disableReason = '';

  if (requireBoth) {
    // Both must pass
    if (!hasRequiredPermission) {
      shouldShow = false; // Hide if no permission
    }
    if (!featureEnabled) {
      shouldDisable = true;
      disableReason = 'This feature is currently disabled';
    }
  } else {
    // Either can pass
    if (!hasRequiredPermission && !featureEnabled) {
      shouldShow = false;
    }
    if (!featureEnabled) {
      shouldDisable = true;
      disableReason = 'This feature is currently disabled';
    }
  }

  // Show fallback if button shouldn't be shown
  if (!shouldShow) {
    return <>{fallback}</>;
  }

  // Show loading state while checking permissions
  if (permissionsLoading) {
    return (
      <button
        type={type}
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={shouldDisable}
      className={`${className} ${shouldDisable ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={shouldDisable ? disableReason : undefined}
      {...props}
    >
      {children}
    </button>
  );
};

export default ProtectedButton;
