# Admin & Moderator Menu Access Setup

## ✅ Completed Setup

The admin panel menus have been configured for **Admin** and **Moderator** roles with appropriate permissions.

---

## 🔐 Test User Credentials

### Super Admin
- **Email:** `superadmin@gmail.com`
- **Password:** `Meva1618`
- **Permissions:** 31 (ALL permissions)
- **Menu Access:** Full access to everything

### Admin
- **Email:** `admin@gmail.com`
- **Password:** `Meva1618`
- **Permissions:** 26
- **Menu Access:** Full access to most features (see details below)

### Moderator
- **Email:** `moderator@gmail.com`
- **Password:** `Meva1618`
- **Permissions:** 12
- **Menu Access:** View access to all menus + limited edit capabilities (see details below)

### Task Doer
- **Email:** `taskdoer@gmail.com`
- **Password:** `Meva1618`
- **Permissions:** 0
- **Menu Access:** No admin panel access (frontend only)

### Task Giver
- **Email:** `taskgiver@gmail.com`
- **Password:** `Meva1618`
- **Permissions:** 0
- **Menu Access:** No admin panel access (frontend only)

---

## 📋 Menu Visibility & Permissions

### Dashboard
- **Super Admin:** ✅ Full Access
- **Admin:** ✅ Full Access
- **Moderator:** ✅ View Access

### Users
- **Super Admin:** ✅ View, Edit, Create, Ban, Delete
- **Admin:** ✅ View, Edit, Create, Ban
- **Moderator:** 👁️ View Only

### Orders
- **Super Admin:** ✅ View, Edit, Refund, Cancel
- **Admin:** ✅ View, Edit, Refund, Cancel
- **Moderator:** ✏️ View, Edit

### Transactions
- **Super Admin:** ✅ View, Approve, Reject, Adjust, Create
- **Admin:** ✅ View, Approve, Reject, Adjust, Create
- **Moderator:** 👁️ View Only

### Balance
- **Super Admin:** ✅ View
- **Admin:** ✅ View
- **Moderator:** 👁️ View Only

### Withdrawals
- **Super Admin:** ✅ View, Process
- **Admin:** ✅ View, Process
- **Moderator:** 👁️ View Only

### Social Accounts
- **Super Admin:** ✅ View
- **Admin:** ✅ View
- **Moderator:** 👁️ View Only

### Tasks
- **Super Admin:** ✅ View, Review, Approve, Reject
- **Admin:** ✅ View, Review, Approve, Reject
- **Moderator:** ✏️ View, Review

### Task Submissions
- **Super Admin:** ✅ View, Review, Approve, Reject
- **Admin:** ✅ View, Review, Approve, Reject
- **Moderator:** ✏️ View, Review

### Devices
- **Super Admin:** ✅ View, Manage
- **Admin:** ✅ View, Manage
- **Moderator:** 👁️ View Only

### Analytics
- **Super Admin:** ✅ View
- **Admin:** ✅ View
- **Moderator:** 👁️ View

### Platforms & Services
- **Super Admin:** ✅ View, Edit
- **Admin:** ✅ View, Edit
- **Moderator:** 👁️ View Only

### Audit Logs
- **Super Admin:** ✅ View
- **Admin:** ✅ View
- **Moderator:** 👁️ View

### Settings
- **Super Admin:** ✅ View, Edit (All tabs)
- **Admin:** ✅ View, Edit (General, Feature Flags, Modes, Security)
- **Moderator:** 👁️ View Only

---

## 🎯 Permission Breakdown

### Super Admin (31 permissions)
```
users.view, users.edit, users.create, users.ban, users.delete
orders.view, orders.edit, orders.refund, orders.cancel
transactions.view, transactions.approve, transactions.reject, transactions.adjust, transactions.create
tasks.view, tasks.review, tasks.approve, tasks.reject
withdrawals.view, withdrawals.process
devices.view, devices.manage
analytics.view
settings.view, settings.edit
audit_logs.view, action_logs.view
roles.view, roles.edit, roles.assign
permissions.view
```

### Admin (26 permissions)
```
users.view, users.edit, users.create, users.ban
orders.view, orders.edit, orders.refund, orders.cancel
transactions.view, transactions.approve, transactions.reject, transactions.adjust, transactions.create
tasks.view, tasks.review, tasks.approve, tasks.reject
withdrawals.view, withdrawals.process
devices.view, devices.manage
analytics.view
settings.view, settings.edit
audit_logs.view, action_logs.view
```

**Missing compared to Super Admin:**
- ❌ users.delete
- ❌ roles.view, roles.edit, roles.assign
- ❌ permissions.view

### Moderator (12 permissions)
```
users.view
orders.view, orders.edit
transactions.view
tasks.view, tasks.review
withdrawals.view
devices.view
analytics.view
settings.view
audit_logs.view, action_logs.view
```

**Key Capabilities:**
- ✅ Can view all data across all modules
- ✅ Can edit orders
- ✅ Can review tasks (but not approve/reject)
- ❌ Cannot approve/reject transactions
- ❌ Cannot process withdrawals
- ❌ Cannot manage users
- ❌ Cannot modify settings

---

## 🛠️ Scripts

### Update Permissions
```bash
node backend_combined/scripts/update-admin-moderator-permissions.cjs
```
Updates the permissions for admin and moderator roles.

### Create Test Users
```bash
node backend_combined/scripts/create-admin-moderator-users.cjs
```
Creates/updates the admin and moderator test users.

### Verify RBAC Setup
```bash
node backend_combined/scripts/verify-rbac.cjs
```
Verifies the entire RBAC system including role assignments.

---

## 🔄 How to Test

1. **Clear browser cache/localStorage** to remove old tokens
2. **Login as Admin:**
   - Email: `admin@gmail.com`
   - Password: `Meva1618`
   - Expected: Should see 13 menu items (all except Platforms & Services management)

3. **Login as Moderator:**
   - Email: `moderator@gmail.com`
   - Password: `Meva1618`
   - Expected: Should see 13 menu items (same as admin but with limited permissions)

4. **Test Permissions:**
   - Try editing a user as moderator → Should be denied
   - Try approving a task as moderator → Should be denied
   - Try viewing audit logs as moderator → Should work
   - Try editing an order as moderator → Should work

---

## 📝 Notes

- **JWT tokens include permissions:** The JWT token now contains the full list of permissions and roles, so menu visibility is determined client-side
- **Permission cache:** Permissions are cached for 60 seconds on the frontend
- **Backend protection:** All API endpoints are protected with `requirePermission` middleware
- **Audit logging:** All admin actions are logged in the audit_logs table

---

## 🚀 Status

✅ **COMPLETE** - Admin panel menus are now properly configured for Admin and Moderator roles with appropriate permissions.

Last Updated: October 28, 2025
