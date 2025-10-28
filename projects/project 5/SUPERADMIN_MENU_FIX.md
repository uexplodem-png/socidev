# Super Admin Menu Issue - Troubleshooting Guide

## Issue
Super admin user cannot see menus in the admin panel after RBAC updates.

## Root Cause
The browser has an **old JWT token cached** that doesn't include the permissions and roles in the payload. The old token format only had `userId`, but the new format includes `permissions` and `roles` arrays.

## ✅ Solution: Clear Browser Cache and Re-login

### Step 1: Open Browser Developer Tools
- **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Firefox**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Safari**: Press `Cmd+Option+I`

### Step 2: Clear Application Storage
1. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
2. Expand **Local Storage** on the left sidebar
3. Click on `http://localhost:5173`
4. Find and **DELETE** the `token` key
5. Expand **Session Storage**
6. Click on `http://localhost:5173`
7. Find and **DELETE** the `user_permissions_cache` key (if exists)

### Step 3: Hard Refresh
- **Mac**: Press `Cmd + Shift + R`
- **Windows/Linux**: Press `Ctrl + Shift + R`

### Step 4: Login Again
1. Go to `http://localhost:5173`
2. Login with:
   - **Email**: `superadmin@gmail.com`
   - **Password**: `Meva1618`

### Step 5: Verify Menus
You should now see **ALL 14 menus**:
1. ✅ Dashboard
2. ✅ Users
3. ✅ Orders
4. ✅ Transactions
5. ✅ Balance
6. ✅ Withdrawals
7. ✅ Social Accounts
8. ✅ Tasks
9. ✅ Task Submissions
10. ✅ Devices
11. ✅ Analytics
12. ✅ Platforms & Services
13. ✅ Audit Logs
14. ✅ Settings

---

## Alternative: Quick Browser Console Fix

### Option 1: Clear from Console
1. Open Browser Console (`F12` → Console tab)
2. Run these commands:
```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Reload page
location.reload();
```

### Option 2: One-Click Clear (Bookmarklet)
Create a bookmark with this code:
```javascript
javascript:(function(){localStorage.clear();sessionStorage.clear();location.reload();})();
```

---

## Verification: Check Your Token

To verify your token has permissions, run this in the browser console **after logging in**:

```javascript
// Get token from localStorage
const token = localStorage.getItem('token');

if (!token) {
  console.log('❌ No token found');
} else {
  // Decode JWT payload
  const payload = JSON.parse(atob(token.split('.')[1]));
  
  console.log('✅ Token found!');
  console.log('Permissions:', payload.permissions?.length || 0);
  console.log('Roles:', payload.roles);
  
  if (payload.permissions && payload.permissions.length > 0) {
    console.log('✅ Token has permissions!');
    console.log('First 5 permissions:', payload.permissions.slice(0, 5));
  } else {
    console.log('❌ Token missing permissions - need to re-login!');
  }
}
```

---

## Still Not Working?

### Check 1: Verify Backend Token Generation
Run this in terminal:
```bash
cd "/Users/velatertach/Downloads/projects/project 5/backend_combined"

curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@gmail.com","password":"Meva1618"}' \
  | jq '.data.token' -r \
  | cut -d '.' -f 2 \
  | base64 -D \
  | jq '.permissions | length'
```

**Expected Output:** `31` (number of permissions)

If you see `0` or an error, the backend isn't generating tokens correctly.

### Check 2: Verify Database Permissions
```bash
node scripts/verify-rbac.cjs
```

Look for the super admin line - should show 31 permissions.

### Check 3: Check Browser Console
After logging in, press `F12` and check the **Console** tab for any errors:
- Look for red error messages
- Look for "Failed to decode token" messages
- Look for "Permission denied" messages

---

## Technical Details

### Old Token Format (BROKEN)
```json
{
  "userId": "80955119-a8a2-4b92-ab2e-46cbe5c98d94",
  "iat": 1761674208,
  "exp": 1761760608
}
```
❌ Missing `permissions` and `roles` arrays

### New Token Format (WORKING)
```json
{
  "userId": "80955119-a8a2-4b92-ab2e-46cbe5c98d94",
  "permissions": ["users.view", "users.edit", ...], // 31 permissions
  "roles": [{"id": 1, "key": "super_admin", "label": "Super Administrator"}],
  "iat": 1761675390,
  "exp": 1761761790
}
```
✅ Has `permissions` and `roles` arrays

---

## Quick Summary

**The issue is cached old tokens. Solution:**
1. Clear browser localStorage
2. Clear browser sessionStorage  
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Login again

**That's it!** 🎉
