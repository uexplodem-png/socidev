# RBAC System Analysis - Admin vs Member Panels

## 📊 Current State

### 1. Permissions Table (Shared)
**Total:** 45 permissions currently in seeder
- **users** (6): view, create, edit, suspend, ban, balance.adjust
- **finance** (6): transactions (view, approve, reject), withdrawals (view, approve, reject)
- **tasks** (5): view, edit, approve, reject, delete
- **orders** (4): view, edit, cancel, refund
- **content** (7): social_accounts.view, devices (view, ban), platforms (view, edit), services (view, edit)
- **system** (3): audit.view, settings (view, edit)
- **rbac** (3): roles (view, manage), permissions.view
- **analytics** (2): analytics.view, dashboard.view
- **emails** (6): view, create, edit, delete, send, send_bulk
- **api** (3): view, edit, delete

### 2. Admin Role Permissions Table
**Current:** 45 permissions × 3 roles = **135 mappings** ✅
- **super_admin**: All 45 permissions
- **admin**: ~30-35 permissions
- **moderator**: ~15-20 permissions

### 3. Member Role Permissions Table (role_permissions)
**Should have:** Üye paneli için ayrı roller ve yetkiler
- **task_giver**: Görev veren kullanıcılar
- **task_doer**: Görev yapan kullanıcılar
- **regular_user**: Normal kullanıcılar

---

## 🔍 Problem Analysis

### Issue 1: Permission Count Mismatch
**Expected:** 135 admin role permissions
**Current:** 45 permissions × 3 roles = 135 ✅ (DOĞRU!)
**But:** Server startup'ta 84 permission görünüyor

### Issue 2: Duplicate Permission Creation
Server startup loglarında **84 permissions** yaratıldığını görüyoruz. Bu şu anlama geliyor:
- Seeder: 45 permission (admin panel için)
- InitDB script: 84 permission (hem admin hem üye panel için)
- **ÇAKIŞMA VAR!**

---

## 🎯 Correct RBAC Structure

### Admin Panel Permissions (45)
**Admin-only operations** - Yalnızca admin panelinde kullanılır

#### User Management (6)
- users.view
- users.create
- users.edit
- users.suspend
- users.ban
- balance.adjust

#### Financial Operations (6)
- transactions.view
- transactions.approve
- transactions.reject
- withdrawals.view
- withdrawals.approve
- withdrawals.reject

#### Task Management (5)
- tasks.view
- tasks.edit
- tasks.approve
- tasks.reject
- tasks.delete

#### Order Management (4)
- orders.view
- orders.edit
- orders.cancel
- orders.refund

#### Content Management (7)
- social_accounts.view
- devices.view
- devices.ban
- platforms.view
- platforms.edit
- services.view
- services.edit

#### System Management (3)
- audit.view
- settings.view
- settings.edit

#### RBAC Management (3)
- roles.view
- roles.manage
- permissions.view

#### Analytics & Dashboard (2)
- analytics.view
- dashboard.view

#### Email Management (6)
- emails.view
- emails.create
- emails.edit
- emails.delete
- emails.send
- emails.send_bulk

#### API Management (3)
- api.view
- api.edit
- api.delete

**TOTAL: 45 admin permissions**

---

### Member Panel Permissions (Should be separate)
**Member-only operations** - Yalnızca üye panelinde kullanılır

#### Task Execution (task_doer)
- tasks.view_available
- tasks.claim
- tasks.execute
- tasks.submit_proof
- tasks.view_my_tasks

#### Task Creation (task_giver)
- tasks.create_own
- tasks.edit_own
- tasks.cancel_own
- tasks.view_my_orders
- orders.create

#### Profile & Account
- profile.view
- profile.edit
- social_accounts.connect
- social_accounts.disconnect

#### Financial (Member)
- balance.view
- transactions.view_own
- withdrawals.request
- withdrawals.view_own

#### Notifications
- notifications.view
- notifications.mark_read

**TOTAL: ~20-25 member permissions (ayrı olmalı)**

---

## ✅ Recommendations

### Option 1: Keep Separate (RECOMMENDED)
**Admin Panel:**
- Table: `admin_role_permissions`
- Roles: `super_admin`, `admin`, `moderator`
- Permissions: 45 admin-specific permissions
- Total mappings: 45 × 3 = **135 rows** ✅

**Member Panel:**
- Table: `role_permissions`
- Roles: `task_giver`, `task_doer`, `regular_user`
- Permissions: 20-25 member-specific permissions
- Total mappings: ~60-75 rows

### Option 2: Unified System
**Single Permissions Table:**
- Total: ~65-70 permissions (admin + member)
- Single `role_permissions` table
- All roles: super_admin, admin, moderator, task_giver, task_doer, regular_user
- Total mappings: 65 × 6 roles = ~390 rows

---

## 🛠️ Action Items

### Fix 1: Remove Duplicate InitDB Permissions
**File:** `backend_combined/src/scripts/initDB.js`
- InitDB creates 84 permissions on startup
- Seeder creates 45 permissions
- **CONFLICT:** Remove initDB permission creation, use seeders only

### Fix 2: Separate Admin & Member Permissions
**Create new seeder:** `20251031-seed-member-permissions.cjs`
- Add member-specific permissions
- Keep admin permissions separate

### Fix 3: Update Admin Role Permissions Seeder
**Current:** 45 permissions × 3 roles = 135 ✅
**Status:** Already correct!

### Fix 4: Create Member Role Permissions Seeder
**New seeder:** `20251031-seed-member-role-permissions.cjs`
- Map member permissions to task_giver, task_doer roles

---

## 📋 Current Status

✅ Admin role permissions seeder: **CORRECT (135 mappings)**
✅ Permission count in seeder: **45 admin permissions**
⚠️ InitDB script: **Creating duplicate 84 permissions**
❌ Member panel permissions: **Missing separate structure**
❌ Member role mappings: **Not defined**

---

## 🎯 Decision Needed

**Should we:**
1. Keep admin (45) and member (20-25) permissions **separate**? (RECOMMENDED)
2. Merge into single unified system with 65-70 total permissions?

**My recommendation:** Keep separate!
- **Admin panel** uses `admin_role_permissions` (135 mappings)
- **Member panel** uses `role_permissions` (separate permissions)
- Clearer separation of concerns
- Easier to maintain and audit
