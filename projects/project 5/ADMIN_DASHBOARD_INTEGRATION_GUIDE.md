# Admin Dashboard Real Data Integration Guide

## Overview
The admin dashboard is now fully connected to real database data through the backend API. All pages fetch data directly from the database instead of using mock data.

## Architecture

### API Layer Structure
```
admin-panel/src/services/
├── api.ts          (High-level API wrappers exported to components)
└── realApi.ts      (Real HTTP requests to backend)
```

### Data Flow
```
Component → api.ts (wrapper) → realApi.ts (HTTP request) → Backend API → Database
```

## Connected Pages & APIs

### 1. **Dashboard** (`/api/admin/dashboard`)
- **Endpoint**: `/api/admin/dashboard/stats`
- **Data**: Revenue, users, orders, tasks, withdrawals stats with time range support (7d, 30d, 90d)
- **Method**: `dashboardAPI.getStats(timeRange)`
- **Features**:
  - Time range filtering (7 days, 30 days, 90 days)
  - Period-over-period comparison
  - Real-time stats calculation

- **Endpoint**: `/api/admin/dashboard/chart`
- **Data**: Daily aggregated chart data (revenue, users, orders, tasks)
- **Method**: `dashboardAPI.getChartData(timeRange)`

### 2. **Users** (`/api/admin/users`)
- **List Endpoint**: `/api/admin/users?page=1&limit=10&search=...`
- **Detail Endpoint**: `/api/admin/users/{id}` (includes related data: orders, transactions, withdrawals, devices, tasks, social accounts)
- **Methods**:
  - `usersAPI.getUsers(params)` - List with pagination
  - `usersAPI.getUserById(id)` - Full user details
  - `usersAPI.createUser(userData)` - Create new user
  - `usersAPI.updateUser(id, updates)` - Update user
  - `usersAPI.suspendUser(id, reason)` - Suspend user
  - `usersAPI.activateUser(id)` - Reactivate user
  - `usersAPI.adjustUserBalance(id, amount, type, reason)` - Adjust balance

### 3. **Orders** (`/api/admin/orders`)
- **List Endpoint**: `/api/admin/orders?page=1&limit=10&status=...&platform=...`
- **Detail Endpoint**: `/api/admin/orders/{id}`
- **Methods**:
  - `ordersAPI.getOrders(params)` - List with filtering
  - `ordersAPI.getOrderById(id)` - Order details
  - `ordersAPI.updateOrderStatus(id, status, notes)` - Update status
  - `ordersAPI.refundOrder(id)` - Process refund

### 4. **Tasks** (`/api/admin/tasks`)
- **List Endpoint**: `/api/admin/tasks?page=1&limit=10&admin_status=pending&platform=...`
- **Detail Endpoint**: `/api/admin/tasks/{id}`
- **Methods**:
  - `tasksAPI.getTasks(params)` - List with filtering
  - `tasksAPI.getTaskById(id)` - Task details
  - `tasksAPI.approveTask(id, notes)` - Approve task
  - `tasksAPI.rejectTask(id, reason, notes)` - Reject task
  - `tasksAPI.updateTaskStatus(id, admin_status, notes)` - Change status

### 5. **Withdrawals & Transactions** (`/api/admin/transactions` & `/api/admin/withdrawals`)
- **Withdrawals Endpoint**: `/api/admin/transactions?type=withdrawal&status=pending`
- **Transactions Endpoint**: `/api/admin/transactions?page=1&limit=10`
- **Methods**:
  - `withdrawalsAPI.getWithdrawals(params)` - Pending withdrawals
  - `withdrawalsAPI.getTransactions(params)` - All transactions
  - `withdrawalsAPI.approveWithdrawal(transactionId, notes)` - Approve
  - `withdrawalsAPI.rejectWithdrawal(transactionId, notes)` - Reject
  - `withdrawalsAPI.createTransaction(data)` - Create new transaction

### 6. **Audit Logs** (`/api/admin/audit-logs`)
- **List Endpoint**: `/api/admin/audit-logs?page=1&limit=10&action=...&resource=...`
- **Stats Endpoint**: `/api/admin/audit-logs/stats?timeRange=30d`
- **Export Endpoint**: `/api/admin/audit-logs/export?...`
- **Methods**:
  - `auditLogsAPI.getAuditLogs(params)` - List with filtering
  - `auditLogsAPI.getAuditLogStats(timeRange)` - Get stats
  - `auditLogsAPI.exportAuditLogs(filters)` - Export as file

### 7. **Platforms & Services** (`/api/admin/platforms` & `/api/admin/services`)
- **Platforms Endpoint**: `/api/admin/platforms?page=1&limit=10`
- **Services Endpoint**: `/api/admin/services?page=1&limit=10&platformId=...`
- **Methods**:
  - `realApiService.getPlatforms(params)` - List platforms
  - `realApiService.getPlatformById(id)` - Platform details
  - `realApiService.createPlatform(data)` - Create platform
  - `realApiService.updatePlatform(id, data)` - Update platform
  - `realApiService.deletePlatform(id)` - Delete platform
  - `realApiService.getServices(params)` - List services
  - `realApiService.getServiceById(id)` - Service details
  - `realApiService.createService(data)` - Create service
  - `realApiService.updateService(id, data)` - Update service
  - `realApiService.deleteService(id)` - Delete service

## Authentication

All requests include JWT authentication via the Authorization header:
```
Authorization: Bearer <token>
```

The token is:
- Obtained during login via `/api/auth/login`
- Stored in Redux store and localStorage
- Automatically included in all API requests via `realApiService.request()`
- Validated by `authenticateToken` middleware on the backend

## Error Handling

### Frontend Error Handling
```typescript
// All API calls include error handling:
try {
  const response = await usersAPI.getUsers(params);
  // Use data
} catch (error) {
  // Dispatch notification
  dispatch(addNotification({
    type: 'error',
    message: 'Failed to fetch users',
  }));
}
```

### Backend Error Handling
- All errors are formatted with status codes and messages
- Error responses include: `{ error: "message", code: "ERROR_CODE", statusCode: 400 }`
- 401: Unauthorized (expired/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 500: Server error

## Data Transformations

### Snake Case to Camel Case Conversion
The backend uses `snake_case` for database columns, but the frontend expects `camelCase`. The `realApiService` automatically converts:

```javascript
// Backend response:
{ first_name: "John", last_name: "Doe", email: "john@example.com" }

// Frontend receives:
{ firstName: "John", lastName: "Doe", email: "john@example.com" }
```

Key field mappings:
- `first_name` → `firstName`
- `last_name` → `lastName`
- `email_verified` → `emailVerified`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`
- `user_id` → `userId`
- And many more...

### Number Conversion
String amounts are automatically converted to numbers:
```typescript
// Before: amount: "100.50"
// After: amount: 100.50
```

## Starting the Development Environment

### Terminal 1: Backend
```bash
cd backend_combined
npm run dev
```
Backend runs on `http://localhost:3000`

### Terminal 2: Admin Panel
```bash
cd admin-panel
npm run dev
```
Admin panel runs on `http://localhost:5173`

### Terminal 3: Frontend (Optional)
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5174`

## Testing the Integration

### Manual Testing

1. **Login to Admin Panel**
   ```
   URL: http://localhost:3000/login
   Email: admin@example.com
   Password: AdminPassword123!
   ```

2. **Verify Backend is Running**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check Dashboard Data**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/admin/dashboard/stats?timeRange=30d
   ```

4. **List Users**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/admin/users?page=1&limit=10
   ```

### Debugging

1. **Check Browser Console** (F12)
   - API errors and request details
   - Redux state in Redux DevTools

2. **Check Backend Logs**
   ```bash
   tail -f backend_combined/logs/error.log
   ```

3. **Test Endpoints with Curl**
   - Verify backend responses
   - Check status codes
   - Validate data format

## Database Schema Reference

All data fetched follows the database schema. Key tables:
- `users` - User accounts with balance and status
- `orders` - Task orders created by users
- `tasks` - Tasks posted by task givers (admin-managed)
- `transactions` - All balance movements (deposits, withdrawals, payments)
- `withdrawals` - Withdrawal requests (deprecated, use transactions)
- `audit_logs` - Admin action audit trail
- `activity_logs` - User activity logs
- `platforms` - Social media platforms (Instagram, YouTube, etc.)
- `services` - Services per platform with pricing
- `devices` - User devices for task completion
- `social_accounts` - User's connected social media accounts

## Performance Considerations

1. **Pagination**: All list endpoints support pagination (default 10 per page)
2. **Filtering**: Use query parameters to filter results server-side
3. **Searching**: Use `search` parameter for text search
4. **Sorting**: Use `sortBy` and `sortOrder` for sorting
5. **Time Range**: Dashboard supports 7d, 30d, 90d, custom ranges

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket for live dashboard updates
2. **Advanced Analytics**: Add more detailed analytics and reporting
3. **Batch Operations**: Support bulk user/order management
4. **Custom Reports**: Export and schedule reports
5. **Role-based Permissions**: Implement granular permission checks

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "401 Unauthorized" | Token expired, need to login again |
| "403 Forbidden" | User role lacks required permissions |
| "Network error" | Backend not running, check port 3000 |
| "No data displayed" | Check browser console for errors, verify database has data |
| "Data is stale" | Refresh page, check last API call time |

## Key Files Modified

- `admin-panel/src/services/api.ts` - High-level API wrappers
- `admin-panel/src/services/realApi.ts` - HTTP client implementation
- `admin-panel/src/store/slices/dashboardSlice.ts` - Dashboard async thunks
- `admin-panel/src/pages/Users.tsx` - User management with real API
- `admin-panel/src/pages/Orders.tsx` - Orders list with real API
- `admin-panel/src/pages/Dashboard.tsx` - Dashboard stats from real API

## Environment Variables

Ensure these are set in `.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api
JWT_SECRET=your_secret_key  # Backend only
```
