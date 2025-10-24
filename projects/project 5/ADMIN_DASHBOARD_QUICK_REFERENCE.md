# Admin Dashboard Real Data Integration - Quick Reference

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend_combined
npm run dev
```
Backend: http://localhost:3000

### 2. Start Admin Panel
```bash
cd admin-panel
npm run dev
```
Admin Panel: http://localhost:5173

### 3. Login
```
Email: admin@example.com
Password: AdminPassword123!
```

## 📊 API Endpoints Summary

| Page | Endpoint | Method | Status |
|------|----------|--------|--------|
| Dashboard | `/api/admin/dashboard/stats` | GET | ✅ Live |
| Dashboard | `/api/admin/dashboard/chart` | GET | ✅ Live |
| Users | `/api/admin/users` | GET/POST | ✅ Live |
| User Detail | `/api/admin/users/{id}` | GET/PUT | ✅ Live |
| Orders | `/api/admin/orders` | GET/POST | ✅ Live |
| Order Detail | `/api/admin/orders/{id}` | GET | ✅ Live |
| Tasks | `/api/admin/tasks` | GET | ✅ Live |
| Task Actions | `/api/admin/tasks/{id}/{approve/reject}` | POST | ✅ Live |
| Withdrawals | `/api/admin/transactions?type=withdrawal` | GET | ✅ Live |
| Transactions | `/api/admin/transactions` | GET/POST | ✅ Live |
| Audit Logs | `/api/admin/audit-logs` | GET | ✅ Live |
| Platforms | `/api/admin/platforms` | GET/POST/PUT/DELETE | ✅ Live |
| Services | `/api/admin/services` | GET/POST/PUT/DELETE | ✅ Live |

## 🔍 Testing Commands

### Health Check
```bash
curl http://localhost:3000/health
```

### Login & Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"AdminPassword123!"
  }'
```

### Get Dashboard Stats
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/dashboard/stats?timeRange=30d
```

### List Users
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/users?page=1&limit=10
```

### Get User Details
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/users/USER_ID
```

### List Orders
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/orders?page=1&limit=10
```

### List Tasks
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/admin/tasks?page=1&limit=10&admin_status=pending
```

### Approve Task
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/admin/tasks/TASK_ID/approve \
  -d '{"notes":"Looks good"}'
```

## 📁 File Structure

```
admin-panel/
├── src/
│   ├── services/
│   │   ├── api.ts           ← High-level wrappers
│   │   └── realApi.ts       ← HTTP client
│   ├── pages/
│   │   ├── Dashboard.tsx    ← Connected ✅
│   │   ├── Users.tsx        ← Connected ✅
│   │   ├── Orders.tsx       ← Connected ✅
│   │   ├── Tasks.tsx        ← Connected ✅
│   │   ├── Withdrawals.tsx  ← Connected ✅
│   │   ├── Transactions.tsx ← Connected ✅
│   │   ├── AuditLogs.tsx    ← Connected ✅
│   │   └── PlatformsServices.tsx ← Connected ✅
│   └── store/
│       └── slices/
│           └── dashboardSlice.ts ← Using realApi
```

## 🔐 Authentication Flow

1. User logs in with email/password
2. Backend returns JWT token
3. Token stored in Redux + localStorage
4. All API requests include `Authorization: Bearer TOKEN`
5. Backend validates token with `authenticateToken` middleware
6. Admin role checked with `requireAdmin` middleware

## 🎯 What's Connected

### ✅ Fully Connected Pages
- **Dashboard** - Real stats, charts with time range filtering
- **Users** - Full CRUD, balance adjustment, user details
- **Orders** - List, detail, status updates, refunds
- **Tasks** - List, approve/reject, status updates
- **Withdrawals** - List pending, approve/reject
- **Transactions** - Full transaction history
- **Audit Logs** - Admin action audit trail with export
- **Platforms & Services** - Full management CRUD

### 📊 Data Available
- Real-time statistics and metrics
- Historical data with pagination
- Filtering, searching, sorting
- User balance history
- Task submissions
- Order tracking
- Activity audit logs
- Platform configurations

## 🐛 Debugging Tips

1. **Redux DevTools** (Chrome Extension)
   - View state changes
   - Time-travel debugging
   - Action history

2. **Network Tab** (F12 → Network)
   - Check API requests/responses
   - Verify headers (Authorization)
   - Inspect response payloads

3. **Console** (F12 → Console)
   - API errors logged
   - Network error messages
   - Component errors

4. **Backend Logs**
   ```bash
   tail -f backend_combined/logs/error.log
   tail -f backend_combined/logs/combined.log
   ```

## ⚡ Performance Notes

- **Pagination**: Default 10 items per page, adjustable
- **Caching**: Dashboard stats cached per time range
- **Lazy Loading**: User detail tabs load on demand
- **Debouncing**: Search inputs debounced to prevent spam

## 🔧 Common Issues

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Token expired, login again |
| 403 Forbidden | Admin role required |
| CORS Error | Check backend CORS config |
| Network Error | Is backend running on :3000? |
| Data not showing | Check browser console for errors |

## 📝 API Response Format

### Success Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           Admin Dashboard (React + TypeScript)      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Pages (Users, Orders, Tasks, etc)           │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                     │
│  ┌──────────────▼───────────────────────────────┐   │
│  │ Redux Store + Actions (dashboardSlice, etc)  │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                     │
│  ┌──────────────▼───────────────────────────────┐   │
│  │ API Layer (api.ts wrappers)                  │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                     │
│  ┌──────────────▼───────────────────────────────┐   │
│  │ HTTP Client (realApi.ts)                     │   │
│  └──────────────┬───────────────────────────────┘   │
└─────────────────┼──────────────────────────────────┘
                  │ HTTP Requests
         ┌────────▼─────────┐
         │  Backend API     │
         │ (:3000/api/...)  │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │   MySQL DB       │
         └──────────────────┘
```

## 📚 Documentation

See `ADMIN_DASHBOARD_INTEGRATION_GUIDE.md` for:
- Detailed API documentation
- Data transformation details
- Error handling patterns
- Testing procedures
- Troubleshooting guide
