/**
 * Admin Logs Routes
 * 
 * Routes for viewing audit logs and action logs.
 */

import express from 'express';
import { adminLogsController } from '../../controllers/admin/logs.controller.js';
import { requirePermission } from '../../middleware/auth.js';

const router = express.Router();

// Audit logs routes (these are handled by the dedicated auditLogs.js routes, kept for backward compatibility)
router.get('/audit-logs',
  requirePermission('audit.view'),
  adminLogsController.getAuditLogs || ((req, res) => res.status(404).json({ error: 'Route moved to /admin/audit-logs' }))
);

router.get('/audit-logs/actions',
  requirePermission('audit.view'),
  adminLogsController.getAuditActions || ((req, res) => res.status(404).json({ error: 'Route moved to /admin/audit-logs' }))
);

router.get('/audit-logs/resources',
  requirePermission('audit.view'),
  adminLogsController.getAuditResources || ((req, res) => res.status(404).json({ error: 'Route moved to /admin/audit-logs' }))
);

// Action logs routes
router.get('/action-logs',
  requirePermission('action_logs.view'),
  adminLogsController.getActionLogs
);

router.get('/action-logs/types',
  requirePermission('action_logs.view'),
  adminLogsController.getActionTypes
);

router.get('/action-logs/actions',
  requirePermission('action_logs.view'),
  adminLogsController.getActionActions
);

// System logs routes (combined.log and error.log)
router.get('/system-logs/combined',
  requirePermission('audit.view'), // Using audit permission for system logs
  adminLogsController.getCombinedLogs
);

router.get('/system-logs/error',
  requirePermission('audit.view'),
  adminLogsController.getErrorLogs
);

router.delete('/system-logs/clear/:type',
  requirePermission('audit.view'), // Using same permission for clearing logs
  adminLogsController.clearSystemLogs
);

export { router as adminLogsRouter };
