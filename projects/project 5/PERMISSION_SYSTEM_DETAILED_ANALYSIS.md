# 🔐 MEMBER PANEL AUTHORIZATION SYSTEM - DETAILED ANALYSIS

## 📋 IMPORTANT NOTES

### ⚠️ Currently INACTIVE Permissions
The following permissions are **defined in database** but **NOT used in frontend**:
- Most permissions are not yet integrated into the frontend
- Only basic permissions are active (dashboard, orders, tasks, devices, accounts)
- These permissions will become active as features are added in the future

### ✅ Currently Active Permissions
Permissions **actually used** in the frontend:

---

## 1️⃣ ACCOUNTS (Social Media Accounts)

### 📍 Usage Locations:
- **Sidebar Menu**: "Social Media Accounts" group
- **Pages**: 
  - `/my-accounts/instagram` - Instagram accounts
  - `/my-accounts/youtube` - YouTube channels
  - `/my-accounts/tiktok` - TikTok accounts (future)
  - `/my-accounts/twitter` - Twitter accounts (future)

### 🔑 Permissions and Effects:

#### `accounts.view` ✅ ACTIVE
**Impact Area:**
- ✅ Shows "Social Media Accounts" menu in sidebar
- ✅ Access to `/my-accounts/instagram` page
- ✅ Access to `/my-accounts/youtube` page
- ✅ List user's connected social media accounts

**Default Permissions:**
- ✅ task_doer: HAS
- ✅ task_giver: HAS
- ✅ both: HAS

**If Restricted:**
- ❌ Menu hidden in sidebar
- ❌ Page access blocked
- 🔄 RestrictedPermission screen shown (not yet added)

**Code Location:**
```tsx
// Sidebar.tsx - Line 118
{
  id: "social-accounts",
  label: t("socialMediaAccounts"),
  icon: Users,
  permission: "accounts.view",  // ← HERE
  children: [...]
}

// App.tsx - Line 189, 199, 211, 221
<ProtectedRouteWithPermission permission='accounts.view'>
  <Route path="/my-accounts/instagram" element={<InstagramAccountsPage />} />
</ProtectedRouteWithPermission>
```

---

#### `accounts.create` ❌ NOT USED
**Status:** Exists in database, not used in frontend
**Planned Usage:** Add new social media account button
**Currently:** Can add accounts if accounts.view permission exists

---

#### `accounts.edit` ❌ NOT USED
**Status:** Exists in database, not used in frontend
**Planned Usage:** Edit account information button

---

#### `accounts.delete` ❌ NOT USED
**Status:** Exists in database, not used in frontend
**Planned Usage:** Delete account button

---

## 2️⃣ ACTION_LOGS (Action Logs)

### ❌ COMPLETELY UNUSED
**Status:** Feature doesn't exist in frontend yet
**Future Plan:** User action history page

---

## 3️⃣ ANALYTICS (Analytics)

### ❌ COMPLETELY UNUSED
**Status:** Feature doesn't exist in frontend yet
**Future Plan:** Statistics and analytics reports page

---

## 4️⃣ API_KEYS (API Keys)

### ❌ COMPLETELY UNUSED
**Status:** Feature doesn't exist in frontend yet
**Future Plan:** API key management for integrations

---

## 5️⃣ AUDIT (Audit Logs)

### ❌ COMPLETELY UNUSED
**Status:** Audit log system exists in backend but no frontend display
**Future Plan:** Used in admin panel, not planned for member panel

---

## 6️⃣ BALANCE (Balance Operations)

### 📍 Usage Locations:
- **Pages**:
  - `/add-balance` - Add balance
  - `/withdraw-balance` - Withdraw balance

### 🔑 Permissions:

#### `balance.view` ❌ NOT USED
**Status:** Not checked in code, everyone can see their balance
**Planned:** Balance display in dashboard and header

---

#### `balance.adjust` ❌ NOT USED
**Status:** Admin-only operation, not in member panel

---

## 7️⃣ DASHBOARD (Homepage)

### 📍 Usage Locations:
- **Main Page**: `/dashboard`

### 🔑 Permissions:

#### `dashboard.view` ✅ ACTIVE
**Impact Area:**
- ✅ Shows "Dashboard" menu in sidebar
- ✅ Access to `/dashboard` page
- ✅ View user statistics

**Default Permissions:**
- ✅ task_doer: HAS
- ✅ task_giver: HAS
- ✅ both: HAS
- ✅ admin: HAS
- ✅ moderator: HAS

**If Restricted:**
- ❌ Dashboard menu hidden
- ❌ Homepage access blocked
- ⚠️ User redirected to another page

**Code Location:**
```tsx
// Sidebar.tsx - Line 81
{
  id: "dashboard",
  label: t("dashboard"),
  icon: LayoutDashboard,
  href: "/dashboard",
  permission: "dashboard.view",  // ← HERE
}

// App.tsx - Line 113
<ProtectedRouteWithPermission permission='dashboard.view'>
  <Route path="/dashboard" element={<DashboardPage />} />
</ProtectedRouteWithPermission>
```

---

#### `dashboard.analytics` ❌ NOT USED
**Status:** Reserved for future feature

---

## 8️⃣ DEVICES (Device Settings)

### 📍 Usage Locations:
- **Pages**:
  - `/add-devices` - Add device
  - `/my-devices` - My devices

### 🔑 Permissions:

#### `devices.view` ✅ ACTIVE
**Impact Area:**
- ✅ Shows "Device Settings" menu group in sidebar
- ✅ Access to `/my-devices` page
- ✅ Submenu "My Devices" visible

**Default Permissions:**
- ✅ task_doer: HAS (as devices.add)
- ✅ task_giver: HAS (as devices.add)
- ✅ both: HAS

**If Restricted:**
- ❌ "Device Settings" menu group hidden
- ❌ Device list access blocked

**Code Location:**
```tsx
// Sidebar.tsx - Line 139
{
  id: "devices",
  label: t("deviceSettings"),
  icon: Laptop,
  permission: "devices.view",  // ← HERE
  children: [...]
}

// App.tsx - Line 177
<ProtectedRouteWithPermission permission='devices.view'>
  <Route path="/my-devices" element={<MyDevicesPage />} />
</ProtectedRouteWithPermission>
```

---

#### `devices.create` ✅ ACTIVE
**Impact Area:**
- ✅ Access to `/add-devices` page
- ✅ Submenu "Add Device" visible

**Default Permissions:**
- ✅ task_doer: HAS (as devices.add)
- ✅ task_giver: HAS (as devices.add)

**If Restricted:**
- ❌ "Add Device" submenu hidden
- ❌ Add device page access blocked

**Code Location:**
```tsx
// Sidebar.tsx - Line 147
{
  id: "add-devices",
  label: t("addDevices"),
  icon: Laptop,
  href: "/add-devices",
  permission: "devices.create",  // ← HERE
}

// App.tsx - Line 167
<ProtectedRouteWithPermission permission='devices.create'>
  <Route path="/add-devices" element={<AddDevicesPage />} />
</ProtectedRouteWithPermission>
```

---

#### `devices.manage` ❌ NOT USED
**Status:** Future feature (edit, delete)

---

#### `devices.ban` ❌ NOT USED
**Status:** Admin feature, won't be in member panel

---

## 9️⃣ DISPUTES (Disputes)

### ❌ COMPLETELY UNUSED
**Status:** Feature doesn't exist in frontend yet
**Future Plan:** Order/task dispute system

---

## 🔟 INSTAGRAM (Instagram Accounts)

### ❌ NOT USED (accounts.view used instead)
**Status:** Using `accounts.view` instead of separate permission

---

## 1️⃣1️⃣ ORDERS (Orders)

### 📍 Usage Locations:
- **Pages**:
  - `/new-order` - Create new order
  - `/my-orders` - My orders

### 🔑 Permissions:

#### `orders.create` ✅ ACTIVE + RESTRICTION SUPPORT
**Impact Area:**
- ✅ Shows "New Order" menu in sidebar (Task Giver only)
- ✅ Access to `/new-order` page
- ✅ Can use order creation form
- 🔒 **HAS RESTRICTION CHECK!**

**Default Permissions:**
- ❌ task_doer: NONE
- ✅ task_giver: HAS
- ✅ both: HAS

**If Restricted:**
- ❌ "New Order" menu hidden
- 🔴 **RestrictedPermission screen shown**
- 📝 Message: "Your Order Creation permission has been restricted"

**Code Location:**
```tsx
// Sidebar.tsx - Line 87
{
  id: "new-order",
  label: t("newOrder"),
  icon: ShoppingCart,
  href: "/new-order",
  requiredMode: "taskGiver",
  permission: "orders.create",  // ← HERE
}

// App.tsx - Line 125
<ProtectedRouteWithPermission permission='orders.create'>
  <Route path="/new-order" element={<NewOrderPage />} />
</ProtectedRouteWithPermission>

// new-order/index.tsx - Line 35-82
const permissionCheck = canUsePermission('orders.create');
if (permissionCheck.isRestricted) {
  return <RestrictedPermission permissionName="Order Creation" />;
}
```

---

#### `orders.view` ✅ ACTIVE
**Impact Area:**
- ✅ Shows "My Orders" menu in sidebar (Task Giver only)
- ✅ Access to `/my-orders` page
- ✅ List created orders

**Default Permissions:**
- ❌ task_doer: NONE
- ✅ task_giver: HAS
- ✅ both: HAS

**If Restricted:**
- ❌ "My Orders" menu hidden
- ❌ Order list access blocked

**Code Location:**
```tsx
// Sidebar.tsx - Line 94
{
  id: "my-orders",
  label: t("myOrders"),
  icon: ClipboardList,
  href: "/my-orders",
  requiredMode: "taskGiver",
  permission: "orders.view",  // ← HERE
}

// App.tsx - Line 135
<ProtectedRouteWithPermission permission='orders.view'>
  <Route path="/my-orders" element={<MyOrdersPage />} />
</ProtectedRouteWithPermission>
```

---

#### `orders.cancel` ❌ NOT USED
**Status:** In default permissions but not checked in frontend
**Planned:** Order cancel button

---

#### `orders.edit` ❌ NOT USED
#### `orders.delete` ❌ NOT USED
#### `orders.refund` ❌ NOT USED

---

## 1️⃣2️⃣ PERMISSIONS (Permission Management)

### ❌ COMPLETELY UNUSED
**Status:** Only in admin panel

---

## 1️⃣3️⃣ PLATFORMS (Platforms)

### ❌ NOT USED
**Status:** Managed in backend, not in member panel

---

## 1️⃣4️⃣ REPORTS (Reports)

### ❌ COMPLETELY UNUSED
**Future Plan:** User order/task reports

---

## 1️⃣5️⃣ ROLES (Role Management)

### ❌ COMPLETELY UNUSED
**Status:** Only in admin panel

---

## 1️⃣6️⃣ SERVICES (Services)

### ❌ NOT USED
**Status:** Managed in backend, not in member panel

---

## 1️⃣7️⃣ SETTINGS (Settings)

### ❌ NOT USED IN MEMBER PANEL
**Status:** Profile page exists but no permission check

---

## 1️⃣8️⃣ SOCIAL_ACCOUNTS (Social Media Accounts)

### ℹ️ SAME AS `accounts.view`
**Status:** Using `accounts.*` instead of separate permission

---

## 1️⃣9️⃣ TASKS (Tasks)

### 📍 Usage Locations:
- **Page**: `/tasks`

### 🔑 Permissions:

#### `tasks.view` ✅ ACTIVE
**Impact Area:**
- ✅ Shows "Tasks" menu in sidebar
- ✅ Access to `/tasks` page
- ✅ List available tasks

**Default Permissions:**
- ✅ task_doer: HAS
- ❌ task_giver: NONE
- ✅ both: HAS
- ✅ admin: HAS
- ✅ moderator: HAS

**If Restricted:**
- ❌ "Tasks" menu hidden
- ❌ Task list access blocked

**Code Location:**
```tsx
// Sidebar.tsx - Line 131
{
  id: "tasks",
  label: t("tasks"),
  icon: PlaySquare,
  href: "/tasks",
  permission: "tasks.view",  // ← HERE
}

// App.tsx - Line 233
<ProtectedRouteWithPermission permission='tasks.view'>
  <Route path="/tasks" element={<TasksPage />} />
</ProtectedRouteWithPermission>
```

---

#### `tasks.create` ❌ NOT USED
#### `tasks.edit` ❌ NOT USED
#### `tasks.delete` ❌ NOT USED
#### `tasks.approve` ❌ NOT USED
#### `tasks.reject` ❌ NOT USED
#### `tasks.review_screenshots` ❌ NOT USED

---

## 2️⃣0️⃣ TRANSACTIONS (Transactions)

### 📍 Usage Locations:
- **Page**: `/add-balance`

### 🔑 Permissions:

#### `transactions.create` ✅ ACTIVE
**Impact Area:**
- ✅ Shows "Add Balance" menu in sidebar (Task Giver only)
- ✅ Access to `/add-balance` page
- ✅ Can perform balance deposit

**Default Permissions:**
- ❌ task_doer: NONE
- ✅ task_giver: HAS (as balance.add)
- ✅ both: HAS

**If Restricted:**
- ❌ "Add Balance" menu hidden
- ❌ Balance deposit page access blocked

**Code Location:**
```tsx
// Sidebar.tsx - Line 102
{
  id: "add-balance",
  label: t("addBalance"),
  icon: Wallet,
  href: "/add-balance",
  requiredMode: "taskGiver",
  permission: "transactions.create",  // ← HERE
}

// App.tsx - Line 145
<ProtectedRouteWithPermission permission='transactions.create'>
  <Route path="/add-balance" element={<AddBalancePage />} />
</ProtectedRouteWithPermission>
```

---

#### Other transaction permissions ❌ NOT USED

---

## 2️⃣1️⃣ USERS (User Management)

### ❌ COMPLETELY UNUSED
**Status:** Only in admin panel

---

## 2️⃣2️⃣ WITHDRAWALS (Balance Withdrawal)

### 📍 Usage Locations:
- **Page**: `/withdraw-balance`

### 🔑 Permissions:

#### `withdrawals.create` ✅ ACTIVE
**Impact Area:**
- ✅ Shows "Withdraw Balance" menu in sidebar
- ✅ Access to `/withdraw-balance` page
- ✅ Can create withdrawal request

**Default Permissions:**
- ✅ task_doer: HAS (as balance.withdraw)
- ✅ task_giver: HAS
- ✅ both: HAS

**If Restricted:**
- ❌ "Withdraw Balance" menu hidden
- ❌ Withdrawal page access blocked

**Code Location:**
```tsx
// Sidebar.tsx - Line 109
{
  id: "withdraw-balance",
  label: t("withdrawBalance"),
  icon: ArrowDownLeft,
  href: "/withdraw-balance",
  permission: "withdrawals.create",  // ← HERE
}

// App.tsx - Line 157
<ProtectedRouteWithPermission permission='withdrawals.create'>
  <Route path="/withdraw-balance" element={<WithdrawBalancePage />} />
</ProtectedRouteWithPermission>
```

---

#### Other withdrawal permissions ❌ NOT USED

---

## 📊 SUMMARY TABLE

### ✅ Active Permissions (Used in Frontend)

| Permission | Page/Menu | Task Doer | Task Giver | Restriction Support |
|------------|-----------|-----------|------------|---------------------|
| `dashboard.view` | Homepage | ✅ | ✅ | ❌ |
| `orders.create` | New Order | ❌ | ✅ | ✅ |
| `orders.view` | My Orders | ❌ | ✅ | ❌ |
| `transactions.create` | Add Balance | ❌ | ✅ | ❌ |
| `withdrawals.create` | Withdraw Balance | ✅ | ✅ | ❌ |
| `devices.view` | My Devices | ✅ | ✅ | ❌ |
| `devices.create` | Add Device | ✅ | ✅ | ❌ |
| `accounts.view` | Social Accounts | ✅ | ✅ | ❌ |
| `tasks.view` | Tasks | ✅ | ❌ | ❌ |

**TOTAL: 9 active permissions**

### ❌ Defined But Unused Permissions

**TOTAL: ~80+ permissions not yet used in frontend**

These will become active as features are added in the future.

---

## 🎯 RECOMMENDATIONS

### 1. Add Missing Restriction Checks
These pages should have restriction control added:
- `/my-orders` - orders.view
- `/add-balance` - transactions.create
- `/withdraw-balance` - withdrawals.create
- `/tasks` - tasks.view
- `/my-devices` - devices.view
- `/add-devices` - devices.create
- `/my-accounts/*` - accounts.view

### 2. Add Sub-Action Permissions
Permission checks should be added for these actions:
- Order cancel button → `orders.cancel`
- Order edit button → `orders.edit`
- Device delete button → `devices.delete`
- Account delete button → `accounts.delete`
- Take task button → `tasks.take`
- Complete task button → `tasks.complete`

### 3. Prepare for New Features
Permissions defined in database but unused are for future features:
- Dispute system → disputes.*
- Analytics page → analytics.*
- Reports → reports.*
- API integration → api_keys.*

---

## 🔒 SECURITY NOTE

**IMPORTANT:** 
- Frontend control is only for UI
- Backend must have the same permission checks
- Every API endpoint must validate permissions
- Restricted permissions should be carried in JWT token

---

## 📝 CONCLUSION

**Used Permissions:** 9
**Unused Permissions:** ~80+
**Restriction Support:** Only 1 permission (orders.create)

The system is ready for basic features, but:
- More restriction controls should be added
- Sub-action permissions should be activated
- New features need permission definitions

---

## 🌍 MODE SYSTEM

### Task Doer Mode
Can access:
- ✅ Dashboard
- ✅ Tasks
- ✅ Withdraw Balance
- ✅ Devices
- ✅ Social Accounts

Cannot access:
- ❌ New Order
- ❌ My Orders
- ❌ Add Balance

### Task Giver Mode
Can access:
- ✅ Dashboard
- ✅ New Order
- ✅ My Orders
- ✅ Add Balance
- ✅ Withdraw Balance
- ✅ Devices
- ✅ Social Accounts

Cannot access:
- ❌ Tasks

### Both Mode
Has access to ALL features from both modes

---

## 🔧 TECHNICAL DETAILS

### Permission Check Flow:
```
1. User logs in → JWT token generated
2. Token contains: userId, permissions[], restrictedPermissions[], roles[]
3. Frontend decodes token and stores in AuthContext
4. Page/Menu checks: hasPermission() or canUsePermission()
5. If restricted: RestrictedPermission component shown
6. If no permission: Page/Menu hidden
```

### Backend Permission Check:
```javascript
// Example endpoint protection
router.get('/orders', 
  authenticateToken,           // Check if logged in
  requirePermission('orders.view'),  // Check permission
  async (req, res) => {
    // Endpoint logic
  }
);
```

### Restriction System:
```javascript
// User has permission but it's restricted
{
  userId: "123",
  permissions: ["orders.create", "orders.view"],
  restrictedPermissions: ["orders.create"],  // ← Admin restricted this
  roles: [...]
}

// Frontend check
const { canUse, isRestricted } = canUsePermission('orders.create');
// canUse: false (has permission but restricted)
// isRestricted: true (show restriction screen)
```

---

## 📌 KEY POINTS

1. **Access Control page affects ONLY member panel, NOT admin panel**
2. **Only 9 out of 80+ permissions are currently active**
3. **Only orders.create has full restriction support**
4. **All other permissions need restriction UI added**
5. **Backend must mirror all frontend permission checks**
6. **Mode system (taskDoer/taskGiver) works independently from permissions**

---

## 🚀 FUTURE ROADMAP

### Phase 1 (Current)
✅ Basic permission system
✅ 9 core permissions active
✅ One restriction example

### Phase 2 (Next)
- Add restriction support to all 9 active permissions
- Add sub-action permissions (cancel, edit, delete)
- Improve restriction UI/UX

### Phase 3 (Future)
- Activate unused permissions as features are built
- Add dispute system
- Add analytics and reports
- Add API key management

---

## 📖 USAGE EXAMPLES

### Example 1: Restrict Order Creation for Spam User
```
Admin Panel → Access Control → Select User
→ Add Restriction: orders.create
→ Save

Result:
- User can still see menu (has permission)
- Clicking shows: "Your permission has been temporarily restricted"
- Can contact support
- Other features work normally
```

### Example 2: Remove Task Access for Policy Violation
```
Admin Panel → Access Control → Select User
→ Add Restriction: tasks.view
→ Save

Result:
- "Tasks" menu disappears from sidebar
- Cannot access /tasks page
- Cannot take any tasks
- Other features unaffected
```

### Example 3: Block Balance Withdrawal During Investigation
```
Admin Panel → Access Control → Select User
→ Add Restriction: withdrawals.create
→ Save

Result:
- "Withdraw Balance" menu hidden
- Cannot create withdrawal requests
- Can still add balance
- Can still view balance
```
