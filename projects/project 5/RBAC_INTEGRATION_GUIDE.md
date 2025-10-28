# Permission & Feature Flag Integration Guide

## Overview
This document explains how to integrate permission checks and feature flags into admin panel pages using the RBAC system.

## Components Available

### 1. usePermissions Hook
```typescript
import { usePermissions } from '../hooks/usePermissions';

const { 
  hasPermission,           // Check single permission
  hasAnyPermission,        // Check if has any of provided permissions
  hasAllPermissions,       // Check if has all provided permissions
  canAccess,              // Check resource.action pattern
  isLoading,              // Loading state
  isSuperAdmin,           // Is super_admin role
  refresh                 // Refresh permissions cache
} = usePermissions();
```

### 2. useSettingsStore Hook
```typescript
import { useSettingsStore } from '../store/settingsStore';

const { 
  getFeatureFlag,         // Get feature flag value
  settings,               // All settings
  isLoading,              // Loading state
  refresh                 // Refresh settings cache
} = useSettingsStore();
```

### 3. ProtectedButton Component
```typescript
import ProtectedButton from '../components/common/ProtectedButton';

<ProtectedButton
  permission="transactions.approve"
  featureFlag="features.transactions.approveEnabled"
  onClick={handleApprove}
  className="btn btn-primary"
>
  Approve Transaction
</ProtectedButton>
```

### 4. ProtectedElement Component
```typescript
import ProtectedElement from '../components/common/ProtectedElement';

<ProtectedElement permission="users.edit">
  <EditUserPanel />
</ProtectedElement>
```

## Integration Examples

### Example 1: Balance/Transactions Page

**Permissions needed:**
- `transactions.view` - View transactions list
- `transactions.approve` - Approve transactions
- `transactions.reject` - Reject transactions
- `transactions.create` - Create manual transactions
- `transactions.adjust` - Adjust transaction amounts

**Feature flags:**
- `features.transactions.enabled` - Transactions module enabled
- `features.transactions.approveEnabled` - Allow approving
- `features.transactions.rejectEnabled` - Allow rejecting
- `features.transactions.createEnabled` - Allow creating
- `features.transactions.adjustEnabled` - Allow adjusting

**Implementation:**
```typescript
import { usePermissions } from '../hooks/usePermissions';
import { useSettingsStore } from '../store/settingsStore';
import ProtectedButton from '../components/common/ProtectedButton';
import ProtectedElement from '../components/common/ProtectedElement';

const Balance: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { getFeatureFlag } = useSettingsStore();

  // Gate the entire page
  if (!hasPermission('transactions.view')) {
    return <AccessDenied />;
  }

  return (
    <div>
      {/* Approve button with permission + feature flag */}
      <ProtectedButton
        permission="transactions.approve"
        featureFlag="features.transactions.approveEnabled"
        onClick={handleApprove}
        className="btn-success"
      >
        Approve
      </ProtectedButton>

      {/* Reject button */}
      <ProtectedButton
        permission="transactions.reject"
        featureFlag="features.transactions.rejectEnabled"
        onClick={handleReject}
        className="btn-danger"
      >
        Reject
      </ProtectedButton>

      {/* Create button */}
      <ProtectedElement permission="transactions.create">
        <button 
          onClick={() => setShowCreateModal(true)}
          disabled={!getFeatureFlag('features.transactions.createEnabled')}
        >
          Create Transaction
        </button>
      </ProtectedElement>
    </div>
  );
};
```

### Example 2: Users Page

**Permissions needed:**
- `users.view` - View users list
- `users.create` - Create new users
- `users.edit` - Edit user details
- `users.ban` - Ban/suspend users
- `users.delete` - Delete users

**Feature flags:**
- `features.users.enabled`
- `features.users.createEnabled`
- `features.users.editEnabled`
- `features.users.suspendEnabled`
- `features.users.deleteEnabled`

**Implementation:**
```typescript
const Users: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { getFeatureFlag } = useSettingsStore();

  if (!hasPermission('users.view')) {
    return <AccessDenied />;
  }

  return (
    <div>
      <ProtectedButton
        permission="users.create"
        featureFlag="features.users.createEnabled"
        onClick={handleCreateUser}
      >
        Create User
      </ProtectedButton>

      {users.map(user => (
        <div key={user.id}>
          <ProtectedButton
            permission="users.edit"
            featureFlag="features.users.editEnabled"
            onClick={() => handleEdit(user.id)}
          >
            Edit
          </ProtectedButton>

          <ProtectedButton
            permission="users.ban"
            featureFlag="features.users.suspendEnabled"
            onClick={() => handleSuspend(user.id)}
          >
            Suspend
          </ProtectedButton>
        </div>
      ))}
    </div>
  );
};
```

### Example 3: Orders Page

**Permissions needed:**
- `orders.view`
- `orders.edit`
- `orders.refund`
- `orders.cancel`

**Feature flags:**
- `features.orders.enabled`
- `features.orders.createEnabled`
- `features.orders.editEnabled`
- `features.orders.refundEnabled`
- `features.orders.cancelEnabled`

### Example 4: Tasks Page

**Permissions needed:**
- `tasks.view`
- `tasks.review`
- `tasks.approve`
- `tasks.reject`

**Feature flags:**
- `features.tasks.enabled`
- `features.tasks.createEnabled`
- `features.tasks.approveEnabled`
- `features.tasks.rejectEnabled`
- `features.tasks.deleteEnabled`

## Best Practices

### 1. Page-Level Guards
Always check view permission at the page level:
```typescript
if (!hasPermission('resource.view')) {
  return <AccessDenied />;
}
```

### 2. Button-Level Protection
Use `ProtectedButton` for action buttons:
```typescript
<ProtectedButton
  permission="resource.action"
  featureFlag="features.resource.actionEnabled"
  onClick={handler}
>
  Action Label
</ProtectedButton>
```

### 3. Section-Level Protection
Use `ProtectedElement` for entire sections:
```typescript
<ProtectedElement permission="resource.manage">
  <AdminControls />
</ProtectedElement>
```

### 4. Multiple Permissions
Check multiple permissions when needed:
```typescript
// Any permission
if (hasAnyPermission(['users.edit', 'users.ban'])) {
  return <ModeratorControls />;
}

// All permissions
if (hasAllPermissions(['users.edit', 'users.delete'])) {
  return <FullAdminControls />;
}
```

### 5. Feature Flag Checks
Always check feature flags for user-facing actions:
```typescript
const canApprove = hasPermission('transactions.approve') && 
                   getFeatureFlag('features.transactions.approveEnabled');

if (!canApprove) {
  return <DisabledButton tooltip="Feature disabled" />;
}
```

### 6. Loading States
Handle loading states gracefully:
```typescript
const { hasPermission, isLoading } = usePermissions();

if (isLoading) {
  return <LoadingSpinner />;
}
```

## Permission Keys Reference

### Users Module
- `users.view` - View users list
- `users.create` - Create new users
- `users.edit` - Edit user details
- `users.ban` - Ban/suspend users
- `users.delete` - Delete users

### Transactions Module
- `transactions.view` - View transactions
- `transactions.approve` - Approve transactions
- `transactions.reject` - Reject transactions
- `transactions.adjust` - Adjust amounts
- `transactions.create` - Create manual transactions

### Orders Module
- `orders.view` - View orders
- `orders.edit` - Edit orders
- `orders.refund` - Process refunds
- `orders.cancel` - Cancel orders

### Tasks Module
- `tasks.view` - View tasks
- `tasks.review` - Review submissions
- `tasks.approve` - Approve tasks
- `tasks.reject` - Reject tasks

### Settings Module
- `settings.view` - View settings
- `settings.edit` - Edit settings

### Audit Module
- `audit_logs.view` - View audit logs
- `action_logs.view` - View action logs

### RBAC Module
- `roles.view` - View roles
- `roles.edit` - Edit role permissions
- `permissions.view` - View permissions
- `roles.assign` - Assign roles to users

## Feature Flag Keys Reference

### Transactions
- `features.transactions.enabled`
- `features.transactions.createEnabled`
- `features.transactions.approveEnabled`
- `features.transactions.rejectEnabled`
- `features.transactions.adjustEnabled`

### Users
- `features.users.enabled`
- `features.users.createEnabled`
- `features.users.editEnabled`
- `features.users.suspendEnabled`
- `features.users.deleteEnabled`

### Orders
- `features.orders.enabled`
- `features.orders.createEnabled`
- `features.orders.editEnabled`
- `features.orders.refundEnabled`
- `features.orders.cancelEnabled`

### Tasks
- `features.tasks.enabled`
- `features.tasks.createEnabled`
- `features.tasks.approveEnabled`
- `features.tasks.rejectEnabled`
- `features.tasks.deleteEnabled`

## Testing

### 1. Test Permission Denial
- Create user with limited role (moderator, task_giver, task_doer)
- Verify buttons are hidden/disabled appropriately
- Verify page access is denied when needed

### 2. Test Feature Flag Toggling
- Go to Settings → Feature Flags
- Toggle flags off
- Verify buttons become disabled
- Verify appropriate messages are shown

### 3. Test Super Admin Bypass
- Login as super_admin
- Verify all permissions work regardless of assignments
- Verify all feature flags work

### 4. Test Cache Invalidation
- Change role permissions in Settings → Access Control
- Click "Clear RBAC Cache"
- Verify changes take effect immediately

## Troubleshooting

### Permissions not working?
1. Check JWT token contains permissions: `localStorage.getItem('token')`
2. Decode token and verify permissions array exists
3. Check sessionStorage for cached permissions
4. Call `refresh()` to reload permissions

### Feature flags not working?
1. Check Settings API is returning flags: `/api/admin/settings`
2. Verify flags are structured correctly (nested objects)
3. Check browser console for errors
4. Call `useSettingsStore.getState().refresh()` to reload

### Changes not taking effect?
1. Clear RBAC cache in Settings → Access Control
2. Clear session storage: `sessionStorage.clear()`
3. Log out and log back in to get fresh JWT
4. Check backend applied changes to database

## Migration Checklist

For each admin page:
- [ ] Import usePermissions hook
- [ ] Import useSettingsStore hook  
- [ ] Add page-level permission check
- [ ] Replace action buttons with ProtectedButton
- [ ] Add feature flag checks to all actions
- [ ] Wrap admin-only sections with ProtectedElement
- [ ] Test with different roles
- [ ] Test with feature flags off
- [ ] Verify loading states
- [ ] Update tests if applicable
