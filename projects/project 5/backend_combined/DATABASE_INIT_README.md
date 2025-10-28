# Database Initialization System

## Overview
The backend now automatically initializes the database with permissions, roles, and system settings on first startup. No manual seeding required!

## What Gets Auto-Created

### ✅ 70 Permissions
Organized by category:
- **Dashboard**: view, analytics
- **Users**: view, create, edit, delete, suspend, ban, verify, balance
- **Orders**: view, create, edit, delete, cancel, refund
- **Tasks**: view, create, edit, delete, approve, reject, review_screenshots
- **Transactions**: view, create, approve, reject, adjust
- **Withdrawals**: view, approve, reject, process
- **Disputes**: view, respond, resolve, close
- **Platforms**: view, create, edit, delete
- **Services**: view, create, edit, delete
- **Settings**: view, edit, system
- **Roles**: view, create, edit, delete, assign
- **Permissions**: view, manage
- **Audit**: view audit logs, view activity logs
- **Reports**: view, export, financial
- **Social Accounts**: view, manage, verify
- **Instagram**: view, manage
- **Devices**: view, manage, ban
- **API Keys**: view, create, revoke

### ✅ 5 Roles with Permissions

| Role | Permissions | Description |
|------|------------|-------------|
| **super_admin** | All 70 | Full system access |
| **admin** | 48 | Most management features except critical system changes |
| **moderator** | 21 | Content moderation and basic management |
| **task_giver** | 7 | Can create orders and view tasks |
| **task_doer** | 7 | Can complete tasks and withdraw earnings |

### ✅ 7 System Settings Categories
- **site**: name, description, logo, favicon
- **maintenance**: enabled, message
- **security**: login attempts, lockout, session timeout, password requirements
- **tasks**: min/max rates, cooldown, screenshot requirements, auto-approval
- **orders**: min/max amounts, auto-refund, refund window
- **withdrawals**: min/max amounts, processing time, fee, methods
- **notifications**: email, browser, new order, task completed, withdrawal processed

## How It Works

### On Server Start
1. Backend connects to database
2. Runs Sequelize migrations (creates tables if needed)
3. **NEW**: Checks if permissions/roles exist
4. If not found, automatically creates all 70 permissions, 5 roles, and assigns permissions
5. Creates default system settings
6. Server starts normally

### Smart Detection
- **First run**: Creates everything automatically
- **Subsequent runs**: Detects existing data and skips initialization
- **Updates**: Run manual script to update permissions/roles

## Commands

### Check Database Status
```bash
node scripts/check-database.js
```
Shows:
- Number of permissions
- Number of roles  
- Number of role-permission assignments
- Sample permissions
- Permissions per role

### Manual Reinitialization
```bash
node scripts/init-database.js
```
Forces recreation of permissions, roles, and settings. Useful after:
- Adding new permissions
- Modifying role assignments
- Updating system settings

### Start Backend (Auto-Initializes)
```bash
npm run dev
```
Automatically initializes database on first start.

## For New Deployments

1. **Create Database**
   ```bash
   mysql -u root -e "CREATE DATABASE social_developer;"
   ```

2. **Run Migrations**
   ```bash
   npx sequelize-cli db:migrate
   ```

3. **Start Backend**
   ```bash
   npm run dev
   ```
   ✅ Permissions, roles, and settings are created automatically!

4. **Register User** via API/Frontend

5. **Assign Super Admin**
   - Update user's role in database to 'super_admin'
   - OR use the UserRole table to assign the super_admin role
   ```sql
   UPDATE users SET role = 'super_admin' WHERE email = 'admin@example.com';
   ```

6. **Login** - Admin panel will show all menus with full permissions!

## Adding New Permissions

1. Edit `src/utils/initializeDatabase.js`
2. Add permission to `PERMISSIONS` object:
   ```javascript
   newFeature: [
     { key: 'feature.view', label: 'View Feature', group: 'feature' },
     { key: 'feature.manage', label: 'Manage Feature', group: 'feature' },
   ],
   ```

3. Add to role assignments in `ROLES`:
   ```javascript
   super_admin: {
     permissions: '*', // Gets all automatically
   },
   admin: {
     permissions: [
       // ... existing ...
       'feature.view',
       'feature.manage',
     ],
   },
   ```

4. Run reinitialization:
   ```bash
   node scripts/init-database.js
   ```

## Troubleshooting

### "Database already initialized" but no permissions showing?
Run manual reinitialization:
```bash
node scripts/init-database.js
```

### Need to reset everything?
```bash
# Drop and recreate database
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
npm run dev
```

### Check what's in database:
```bash
node scripts/check-database.js
```

## Benefits

✅ **No manual seeding required**  
✅ **Consistent across all environments**  
✅ **Safe for production** (checks before creating)  
✅ **Easy to update** (just run script)  
✅ **Clear permission structure**  
✅ **Role-based access control ready**  

## Files Changed

- `src/server.js` - Added auto-initialization call
- `src/utils/initializeDatabase.js` - Core initialization logic (NEW)
- `scripts/init-database.js` - Manual reinitialization script (NEW)
- `scripts/check-database.js` - Database status checker (NEW)
- `migrations/2025102821254004-create-role-permissions.cjs` - Fixed with mode/allow fields

## Migration Generated

All 26 migration files were generated using `npx sequelize-cli model:generate`:
- Roles, Permissions, Users
- Role-Permissions, User-Roles
- Orders, Tasks, Transactions
- Audit Logs, Activity Logs
- Withdrawals, Devices, Sessions
- User Settings, Disputes
- Order Statistics, Task Executions
- Instagram Accounts/Follows
- Social Accounts, Platforms, Services
- Payment Gateways, System Settings
- Refunds, Desktop API Keys

Migrations ensure clean database schema without using Sequelize's `sync()`.
