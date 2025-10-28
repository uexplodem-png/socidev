# 🎯 RBAC System - Action Items & Next Steps

## 🚨 HIGH PRIORITY (Do These First)

### 1. Fix Permission Key Mismatches
**File**: `backend_combined/migrations/039-seed-rbac-and-settings.cjs`

Add missing/fix existing permissions:
```javascript
// Add these to the permissions array:
{ key: 'users.suspend', label: 'Suspend/Unsuspend Users', group: 'users' },
{ key: 'analytics.view', label: 'View Analytics', group: 'analytics' },
{ key: 'withdrawals.view', label: 'View Withdrawals', group: 'withdrawals' },
{ key: 'withdrawals.process', label: 'Process Withdrawals', group: 'withdrawals' },
```

Then run:
```bash
cd backend_combined
# Create a new migration
npx sequelize-cli migration:generate --name add-missing-permissions
# Edit the migration file to add the 4 missing permissions
npx sequelize-cli db:migrate
```

### 2. Test Settings Page in Browser
**Action**: Open admin panel and navigate to Settings

Test each tab:
- [ ] General Tab - Verify settings load and save
- [ ] Feature Flags Tab - Toggle flags on/off
- [ ] Access Control Tab - Change role permissions
- [ ] Modes Tab - Adjust mode settings
- [ ] Security Tab - Configure security options

### 3. Verify Super Admin Access
**Action**: Login as superadmin@gmail.com

Test:
- [ ] Can access all Settings tabs
- [ ] Can toggle all feature flags
- [ ] Can modify all permissions
- [ ] Can assign roles to users
- [ ] Can see all pages without restrictions

## ⚙️ MEDIUM PRIORITY (Do Soon)

### 4. Create Test Users
**File**: Use the assign-super-admin.js script or admin UI

Create users with different roles:
```bash
cd backend_combined
# Create moderator
node scripts/assign-super-admin.js moderator@test.com
# Then manually change role_id to 3 (moderator) in database

# Create task_giver  
node scripts/assign-super-admin.js taskgiver@test.com
# Change role_id to 4

# Create task_doer
node scripts/assign-super-admin.js taskdoer@test.com
# Change role_id to 5
```

Test each role can only access permitted features.

### 5. Wire ProtectedButton into Existing Pages

#### Balance.tsx
```typescript
// Import at top
import ProtectedButton from '../components/common/ProtectedButton';
import { useSettingsStore } from '../store/settingsStore';

// Replace approve button
<ProtectedButton
  permission="transactions.approve"
  featureFlag="features.transactions.approveEnabled"
  onClick={handleApprove}
  className="your-classes"
>
  Approve
</ProtectedButton>

// Replace reject button
<ProtectedButton
  permission="transactions.reject"
  featureFlag="features.transactions.rejectEnabled"
  onClick={handleReject}
  className="your-classes"
>
  Reject
</ProtectedButton>
```

#### Users.tsx
```typescript
<ProtectedButton
  permission="users.create"
  featureFlag="features.users.createEnabled"
  onClick={handleCreateUser}
>
  Create User
</ProtectedButton>

<ProtectedButton
  permission="users.edit"
  featureFlag="features.users.editEnabled"
  onClick={() => handleEdit(user.id)}
>
  Edit
</ProtectedButton>

<ProtectedButton
  permission="users.suspend"
  featureFlag="features.users.suspendEnabled"
  onClick={() => handleSuspend(user.id)}
>
  Suspend
</ProtectedButton>
```

#### Orders.tsx
```typescript
<ProtectedButton
  permission="orders.edit"
  featureFlag="features.orders.editEnabled"
  onClick={handleEdit}
>
  Edit Order
</ProtectedButton>

<ProtectedButton
  permission="orders.refund"
  featureFlag="features.orders.refundEnabled"
  onClick={handleRefund}
>
  Process Refund
</ProtectedButton>
```

#### Tasks.tsx
```typescript
<ProtectedButton
  permission="tasks.approve"
  featureFlag="features.tasks.approveEnabled"
  onClick={handleApprove}
>
  Approve Task
</ProtectedButton>

<ProtectedButton
  permission="tasks.reject"
  featureFlag="features.tasks.rejectEnabled"
  onClick={handleReject}
>
  Reject Task
</ProtectedButton>
```

### 6. Test Feature Flag Toggling
**Action**: In Settings → Feature Flags

For each module:
1. Turn off `transactions.approveEnabled`
2. Go to Balance page
3. Verify "Approve" button is disabled
4. Turn it back on
5. Verify button is enabled again

Repeat for all feature flags.

### 7. Test Permission Denial
**Action**: Login as moderator

Expected behavior:
- [ ] Can view pages but not edit
- [ ] Action buttons are hidden
- [ ] Direct API calls return 403 Forbidden
- [ ] Proper error messages shown

### 8. Verify Audit Logging
**Action**: Check database audit_logs table

After performing admin actions:
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

Verify:
- [ ] Actor information captured
- [ ] Action and resource logged
- [ ] IP address recorded
- [ ] Metadata stored correctly

## 📋 LOW PRIORITY (Nice to Have)

### 9. Add Unit Tests
**Files to create**:
- `backend_combined/tests/services/settingsService.test.js`
- `backend_combined/tests/services/permissionsService.test.js`
- `backend_combined/tests/routes/rbac.test.js`

### 10. Add Integration Tests
**File**: `backend_combined/tests/integration/rbac-flow.test.js`

Test complete flows:
- User role assignment
- Permission checking
- Feature flag toggling
- Cache invalidation

### 11. Performance Testing
Test with:
- 1000 permission checks per second
- 100 concurrent users
- Cache hit/miss ratios
- Database query performance

### 12. Security Testing
- [ ] Test JWT tampering
- [ ] Test permission bypass attempts
- [ ] Test SQL injection in RBAC queries
- [ ] Test XSS in permission metadata
- [ ] Test CSRF on role assignments

## 📚 Documentation Updates

### 13. API Documentation
Create OpenAPI/Swagger docs for:
- RBAC endpoints
- Settings endpoints
- Required permissions for each endpoint

### 14. User Guide
Create admin user guide:
- How to manage roles
- How to assign permissions
- How to toggle feature flags
- How to view audit logs

### 15. Developer Guide
Document:
- How to add new permissions
- How to add new feature flags
- How to use ProtectedButton
- How to use usePermissions hook

## 🔧 Optional Enhancements

### 16. Permission Groups UI
Add to AccessControlTab:
- Expand/collapse groups
- Select all in group
- Permission search/filter

### 17. Audit Log Viewer
Create new page:
- Filterable audit log table
- Export to CSV
- Real-time updates
- User activity timeline

### 18. Role Presets
Add quick role creation:
- "Support Agent" preset
- "Content Moderator" preset
- "Financial Manager" preset
- Custom role templates

### 19. Permission Dependencies
Add logic:
- If user has A, automatically grant B
- If revoking C, warn about dependencies
- Show permission tree view

### 20. Settings Backup/Restore
Add endpoints:
- Export all settings as JSON
- Import settings from backup
- Version history
- Rollback capability

---

## ✅ Completion Checklist

### Phase 1: Critical Fixes
- [x] Fix migration number conflicts
- [x] Mark migrations as completed
- [x] Restore Settings.tsx
- [ ] Fix permission key mismatches
- [ ] Add missing permissions

### Phase 2: Testing
- [ ] Test Settings page in browser
- [ ] Verify super admin access
- [ ] Create test users with different roles
- [ ] Test permission denials
- [ ] Test feature flag toggling
- [ ] Verify audit logs

### Phase 3: Integration
- [ ] Wire ProtectedButton into Balance page
- [ ] Wire ProtectedButton into Users page
- [ ] Wire ProtectedButton into Orders page
- [ ] Wire ProtectedButton into Tasks page
- [ ] Add page-level permission guards

### Phase 4: Polish
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Performance testing
- [ ] Security testing
- [ ] Documentation updates

---

## 🎯 Quick Start Guide

### For Immediate Testing:
1. Start backend: `cd backend_combined && npm start`
2. Start admin panel: `cd admin-panel && npm run dev`
3. Login as: `superadmin@gmail.com`
4. Navigate to: Settings page
5. Test: Toggle feature flags
6. Test: Update role permissions
7. Verify: Changes take effect

### For Development:
1. Fix missing permissions (see #1 above)
2. Wire one page (Balance recommended)
3. Create test user (moderator)
4. Test permission restrictions
5. Iterate on other pages

### For Production:
1. Complete all Phase 1 & 2 tasks
2. Complete Phase 3 for critical pages
3. Run security audit
4. Load test with expected traffic
5. Deploy with monitoring

---

**Last Updated**: October 28, 2025  
**Status**: System operational, enhancements pending  
**Next Review**: After high priority items completed
