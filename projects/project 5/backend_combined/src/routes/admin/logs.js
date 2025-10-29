/**
 * Admin Logs Routes
 * 
 * Routes for viewing audit logs and action logs.
 */

import express from 'express';
import { adminLogsController } from '../../controllers/admin/logs.controller.js';
import { requirePermission } from '../../middleware/auth.js';

const router = express.Router();

// Audit logs routes
router.get('/audit-logs',
  requirePermission('audit_logs.view'),
  adminLogsController.getAuditLogs
);

router.get('/audit-logs/actions',
  requirePermission('audit_logs.view'),
  adminLogsController.getAuditActions
);

router.get('/audit-logs/resources',
  requirePermission('audit_logs.view'),
  adminLogsController.getAuditResources
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
  requirePermission('audit_logs.view'), // Using audit_logs permission for system logs
  adminLogsController.getCombinedLogs
);

router.get('/system-logs/error',
  requirePermission('audit_logs.view'),
  adminLogsController.getErrorLogs
);

router.delete('/system-logs/clear/:type',
  requirePermission('audit_logs.delete'), // Special permission for clearing logs
  adminLogsController.clearSystemLogs
);

export { router as adminLogsRouter };
