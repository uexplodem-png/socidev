# Maintenance Mode Implementation Guide

## Overview
Maintenance mode now properly supports privileged user access and displays beautiful maintenance pages for regular users.

## Features Implemented

### 1. Role-Based Access Control ✅
**Backend:** `/backend_combined/src/middleware/security.js`

Maintenance mode now allows the following roles to bypass and continue working:
- **super_admin** - Full system access
- **admin** - Full system access
- **moderator** - Full system access

Regular users (task_doer, task_giver) will be blocked and shown the maintenance page.

```javascript
// For authenticated requests, check if user has privileged role
if (req.user) {
  // Allow super_admin, admin, and moderator to bypass maintenance
  if (req.user.role === 'super_admin' || 
      req.user.role === 'admin' || 
      req.user.role === 'moderator') {
    return next();
  }
}
```

### 2. Frontend Maintenance Page ✅
**File:** `/frontend/src/pages/Maintenance.tsx`

Beautiful maintenance page with:
- **Animated gradient design** (purple, blue, indigo)
- **Spinning gear icon** with pulsing animation
- **Auto-refresh functionality** - checks every 30 seconds
- **Progress indicator** with animated loading bar
- **Status cards** explaining what's happening
- **Manual refresh button** for immediate status check
- **Floating particle effects** for visual appeal
- **Responsive design** for all screen sizes

Features:
- ✅ Auto-refresh when maintenance ends
- ✅ Your data is safe messaging
- ✅ Expected downtime display
- ✅ Support contact information

### 3. Admin Panel Maintenance Page ✅
**File:** `/admin-panel/src/pages/MaintenanceAdmin.tsx`

Professional admin-focused maintenance page with:
- **Dark slate/gray gradient** (professional theme)
- **Admin privilege badge** highlighting special access
- **Technical information** about admin access restoration
- **Auto-detection** of when maintenance completes
- **No action required** messaging for admins
- **Security emphasis** - data integrity assured

Note: Admin panel users (who are already admins/moderators) will typically not see this page since they bypass maintenance, but it's available if needed.

### 4. Frontend Detection & Routing ✅
**File:** `/frontend/src/App.tsx`

- Added maintenance mode detection using `useFeatureFlags` hook
- Checks user roles from JWT token
- Shows maintenance page to non-privileged users
- Privileged users (super_admin, admin, moderator) continue to full app

```typescript
// Check maintenance mode - only show to non-privileged users
if (isMaintenanceMode()) {
  const userRoles = user?.roles?.map(r => r.key) || [];
  const isPrivilegedUser = userRoles.includes('super_admin') || 
                           userRoles.includes('admin') || 
                           userRoles.includes('moderator');
  
  if (!isPrivilegedUser) {
    return <Maintenance />;
  }
}
```

### 5. Settings Store Enhancement ✅
**File:** `/admin-panel/src/store/settingsStore.ts`

Added `isMaintenanceMode()` helper function to check maintenance status:
```typescript
isMaintenanceMode: (): boolean => {
  const state = get();
  return state.settings.modes?.maintenance?.enabled || 
         state.settings.general?.maintenanceMode || 
         false;
}
```

## How It Works

### For Regular Users:
1. When maintenance mode is enabled in settings
2. Frontend checks maintenance status via settings API
3. If user is not admin/moderator → **Beautiful maintenance page shown**
4. Page auto-refreshes every 30 seconds to detect when maintenance ends
5. When maintenance ends → **Automatically redirects to normal app**

### For Admins/Moderators:
1. When maintenance mode is enabled
2. Backend middleware checks user role
3. If user is super_admin, admin, or moderator → **Full access granted**
4. They can continue managing the system during maintenance
5. They can disable maintenance mode from Settings panel

## Testing Instructions

### Test 1: Enable Maintenance Mode
1. Login as admin
2. Go to Settings → General tab
3. Enable "Maintenance Mode"
4. Save settings
5. **Expected:** Admin stays logged in and can work normally

### Test 2: Regular User Experience
1. Logout from admin account
2. Try to access site as regular user (or without login)
3. **Expected:** See beautiful maintenance page
4. Click "Check Status" button
5. **Expected:** Page reloads to check if maintenance ended

### Test 3: Role-Based Access
1. Enable maintenance mode as admin
2. Create test accounts with different roles:
   - Regular user (task_doer)
   - Moderator
   - Admin
3. **Expected Results:**
   - Regular user: Sees maintenance page
   - Moderator: Full access
   - Admin: Full access

### Test 4: Auto-Refresh
1. Enable maintenance mode
2. Open site as regular user (see maintenance page)
3. In another window, login as admin and disable maintenance
4. Wait 30 seconds
5. **Expected:** User's page automatically refreshes and shows normal app

## UI Features

### Maintenance Page Design Elements:
- 🎨 Gradient backgrounds (purple → blue → indigo)
- ⚙️ Animated spinning gear icon
- 📊 Progress bar with pulse animation
- 💳 Info cards with icons
- 🔄 Refresh button with rotation animation
- 🌟 Floating particle effects
- 📱 Fully responsive design
- ⏰ Expected downtime information
- 📧 Support contact information

### Admin Maintenance Page:
- 🎨 Professional slate/gray theme
- 🛡️ Admin privilege badge
- 📋 Technical status information
- ✅ No action required messaging
- 🔐 Security emphasis
- 🔄 Auto-detection features

## Environment Requirements
No additional environment variables needed. Uses existing settings API.

## API Endpoints Used
- `GET /api/settings/public` - Check maintenance status (frontend)
- `GET /api/admin/settings` - Manage maintenance mode (admin)

## Database Settings
Maintenance mode is controlled by:
- `maintenance.enabled` (boolean)
- `general.maintenanceMode` (boolean) - legacy support

Both are checked by the system.

## Troubleshooting

### Issue: Admin sees maintenance page
**Solution:** Ensure user role is correctly set to 'super_admin', 'admin', or 'moderator' in database.

### Issue: Maintenance page doesn't show
**Solution:** Check that `maintenance.enabled` or `general.maintenanceMode` is set to `true` in settings.

### Issue: Auto-refresh not working
**Solution:** Check browser console for errors. Ensure settings API endpoint is accessible.

### Issue: Users can still access during maintenance
**Solution:** Verify that security middleware is properly applied to all routes and user role is not privileged.

## Related Files
- Backend: `/backend_combined/src/middleware/security.js`
- Frontend: `/frontend/src/pages/Maintenance.tsx`
- Frontend: `/frontend/src/App.tsx`
- Admin Panel: `/admin-panel/src/pages/MaintenanceAdmin.tsx`
- Admin Panel: `/admin-panel/src/store/settingsStore.ts`

## Commit
Changes committed to GitHub: `e273240`
Repository: https://github.com/uexplodem-png/socidev

---

**Implementation Date:** October 30, 2025
**Status:** ✅ Complete and Production Ready
