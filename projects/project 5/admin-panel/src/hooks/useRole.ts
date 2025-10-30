import { useAppSelector } from '../store';

interface RolePermissions {
    // User Management
    canViewUsers: boolean;
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canSuspendUsers: boolean;
    canBanUsers: boolean;
    canAdjustBalance: boolean;

    // Order Management
    canViewOrders: boolean;
    canEditOrders: boolean;
    canCancelOrders: boolean;
    canRefundOrders: boolean;

    // Task Management
    canViewTasks: boolean;
    canEditTasks: boolean;
    canApproveTasks: boolean;
    canRejectTasks: boolean;
    canDeleteTasks: boolean;

    // Financial Operations
    canViewBalance: boolean;
    canViewTransactions: boolean;
    canApproveTransactions: boolean;
    canRejectTransactions: boolean;
    canViewWithdrawals: boolean;
    canApproveWithdrawals: boolean;
    canRejectWithdrawals: boolean;

    // Content Management
    canViewSocialAccounts: boolean;
    canViewDevices: boolean;
    canBanDevices: boolean;
    canViewPlatforms: boolean;
    canEditPlatforms: boolean;
    canViewServices: boolean;
    canEditServices: boolean;

    // System
    canViewAudit: boolean;
    canViewSettings: boolean;
    canEditSettings: boolean;
    canManageRoles: boolean;

    // Role checks
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isModerator: boolean;
}

/**
 * Hook to check user role and permissions
 * Based on role hierarchy: super_admin > admin > moderator
 */
export const useRole = (): RolePermissions => {
    const { user } = useAppSelector(state => state.auth);

    const isSuperAdmin = user?.role === 'super_admin';
    const isAdmin = user?.role === 'admin';
    const isModerator = user?.role === 'moderator';

    return {
        // Role checks
        isSuperAdmin,
        isAdmin,
        isModerator,

        // User Management
        canViewUsers: isSuperAdmin || isAdmin || isModerator,
        canCreateUsers: isSuperAdmin || isAdmin,
        canEditUsers: isSuperAdmin || isAdmin,
        canSuspendUsers: isSuperAdmin || isAdmin || isModerator,
        canBanUsers: isSuperAdmin || isAdmin,
        canAdjustBalance: isSuperAdmin || isAdmin,

        // Order Management
        canViewOrders: isSuperAdmin || isAdmin || isModerator,
        canEditOrders: isSuperAdmin || isAdmin,
        canCancelOrders: isSuperAdmin || isAdmin || isModerator,
        canRefundOrders: isSuperAdmin || isAdmin,

        // Task Management
        canViewTasks: isSuperAdmin || isAdmin || isModerator,
        canEditTasks: isSuperAdmin || isAdmin,
        canApproveTasks: isSuperAdmin || isAdmin || isModerator,
        canRejectTasks: isSuperAdmin || isAdmin || isModerator,
        canDeleteTasks: isSuperAdmin || isAdmin,

        // Financial Operations
        canViewBalance: isSuperAdmin || isAdmin || isModerator,
        canViewTransactions: isSuperAdmin || isAdmin || isModerator,
        canApproveTransactions: isSuperAdmin || isAdmin,
        canRejectTransactions: isSuperAdmin || isAdmin,
        canViewWithdrawals: isSuperAdmin || isAdmin || isModerator,
        canApproveWithdrawals: isSuperAdmin || isAdmin,
        canRejectWithdrawals: isSuperAdmin || isAdmin,

        // Content Management
        canViewSocialAccounts: isSuperAdmin || isAdmin || isModerator,
        canViewDevices: isSuperAdmin || isAdmin || isModerator,
        canBanDevices: isSuperAdmin || isAdmin,
        canViewPlatforms: isSuperAdmin || isAdmin || isModerator,
        canEditPlatforms: isSuperAdmin || isAdmin,
        canViewServices: isSuperAdmin || isAdmin || isModerator,
        canEditServices: isSuperAdmin || isAdmin,

        // System
        canViewAudit: isSuperAdmin || isAdmin || isModerator,
        canViewSettings: isSuperAdmin || isAdmin || isModerator,
        canEditSettings: isSuperAdmin || isAdmin,
        canManageRoles: isSuperAdmin,
    };
};
