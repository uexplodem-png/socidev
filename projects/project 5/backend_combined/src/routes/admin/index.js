import express from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import dashboardRoutes from './dashboard.js';
import usersRoutes from './users.js';
import ordersRoutes from './orders.js';
import tasksRoutes from './tasks.js';
import transactionsRoutes from './transactions.js';
import withdrawalsRoutes from './withdrawals.js';
import auditLogsRoutes from './auditLogs.js';
import actionLogsRoutes from './actionLogs.js';
import { adminLogsRouter } from './logs.js';
import settingsRoutes from './settings.js';
import platformsServicesRoutes from './platformsServices.js';
import rbacRoutes from './rbac.js';
import adminPermissionsRoutes from './adminPermissions.js';
import emailsRoutes from './emails.js';

const router = express.Router();

// Apply authentication and admin authorization to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Mount sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/orders', ordersRoutes);
router.use('/tasks', tasksRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/withdrawals', withdrawalsRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/action-logs', actionLogsRoutes);
router.use('/', adminLogsRouter); // New unified logs router (includes system-logs)
router.use('/settings', settingsRoutes);
router.use('/rbac', rbacRoutes);
router.use('/admin-permissions', adminPermissionsRoutes); // Dynamic admin role permissions
router.use('/', platformsServicesRoutes);
router.use('/emails', emailsRoutes); // Email management system

// Admin root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Social Developer Platform Admin API',
    version: '1.0.0',
    user: req.user.toJSON(),
    endpoints: {
      dashboard: '/api/admin/dashboard',
      users: '/api/admin/users',
      orders: '/api/admin/orders',
      tasks: '/api/admin/tasks',
      transactions: '/api/admin/transactions',
      withdrawals: '/api/admin/withdrawals',
      auditLogs: '/api/admin/audit-logs',
      actionLogs: '/api/admin/action-logs',
      settings: '/api/admin/settings',
      rbac: '/api/admin/rbac',
    },
  });
});

export { router as adminRouter };