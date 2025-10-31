/**
 * PART 3: Order Issue Reporting System (Secure Message System)
 * Provides secure communication between users and admins about orders
 * with XSS protection, rate limiting, and comprehensive audit logging
 */

import express from 'express';
import { body, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { OrderIssue, Order, User } from '../../models/index.js';
import { authenticateToken as auth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { logAudit } from '../../utils/logging.js';

const router = express.Router();

// Rate limiting to prevent spam - 10 messages per 15 minutes per user
const issueMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many messages sent. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Get all issues for an order
 * Users can only see their own order issues, admins can see all
 */
router.get('/orders/:orderId/issues',
  auth,
  param('orderId').isUUID(),
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    // Verify order exists
    const order = await Order.findByPk(orderId, {
      attributes: ['id', 'userId', 'service', 'platform']
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Check access permissions
    const isAdmin = req.user.permissions && (
      req.user.permissions.includes('orders.view') || 
      req.user.permissions.includes('all')
    );
    
    if (!isAdmin && order.userId !== req.user.id) {
      return res.status(403).json({
        error: 'You do not have permission to view these issues',
        code: 'ACCESS_DENIED'
      });
    }

    // Fetch all issues for this order
    const issues = await OrderIssue.findAll({
      where: { orderId },
      attributes: ['id', 'message', 'senderType', 'status', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      orderId,
      orderRef: order.id.substring(0, 8).toUpperCase(),
      issues: issues.map(issue => ({
        id: issue.id,
        message: issue.message,
        senderType: issue.senderType,
        senderName: issue.senderType === 'admin' 
          ? `${issue.admin?.firstName || 'Admin'} ${issue.admin?.lastName || ''}`
          : `${issue.user?.firstName || 'User'} ${issue.user?.lastName || ''}`,
        status: issue.status,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt
      }))
    });
  })
);

/**
 * Create a new issue message
 * Rate limited and XSS protected
 */
router.post('/orders/:orderId/issues',
  auth,
  issueMessageLimiter,
  param('orderId').isUUID(),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters')
    .escape(), // XSS protection
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { message } = req.body;

    // Verify order exists
    const order = await Order.findByPk(orderId, {
      attributes: ['id', 'userId', 'service', 'platform']
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Check access permissions
    const isAdmin = req.user.permissions && (
      req.user.permissions.includes('orders.view') || 
      req.user.permissions.includes('all')
    );
    
    if (!isAdmin && order.userId !== req.user.id) {
      return res.status(403).json({
        error: 'You do not have permission to send messages for this order',
        code: 'ACCESS_DENIED'
      });
    }

    // Create the issue message
    const issue = await OrderIssue.create({
      orderId,
      userId: isAdmin ? order.userId : req.user.id,
      adminId: isAdmin ? req.user.id : null,
      message,
      senderType: isAdmin ? 'admin' : 'user',
      status: 'open',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Log the action
    await logAudit(req, {
      action: 'ISSUE_MESSAGE_SENT',
      resource: 'order_issue',
      resourceId: issue.id,
      targetUserId: order.userId,
      description: `${isAdmin ? 'Admin' : 'User'} sent message for order #${orderId.substring(0, 8).toUpperCase()}`,
      metadata: {
        orderId,
        issueId: issue.id,
        messageLength: message.length,
        senderType: issue.senderType
      }
    });

    // Fetch the created issue with relations
    const createdIssue = await OrderIssue.findByPk(issue.id, {
      attributes: ['id', 'message', 'senderType', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Issue message sent successfully',
      issue: {
        id: createdIssue.id,
        message: createdIssue.message,
        senderType: createdIssue.senderType,
        senderName: createdIssue.senderType === 'admin'
          ? `${createdIssue.admin?.firstName || 'Admin'} ${createdIssue.admin?.lastName || ''}`
          : `${createdIssue.user?.firstName || 'User'} ${createdIssue.user?.lastName || ''}`,
        status: createdIssue.status,
        createdAt: createdIssue.createdAt
      }
    });
  })
);

/**
 * Update issue status (admin only)
 */
router.patch('/issues/:id/status',
  auth,
  requirePermission('orders.edit'),
  param('id').isInt(),
  body('status')
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const issue = await OrderIssue.findByPk(id, {
      attributes: ['id', 'orderId', 'status', 'senderType'],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'userId']
        }
      ]
    });

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found',
        code: 'ISSUE_NOT_FOUND'
      });
    }

    const oldStatus = issue.status;
    await issue.update({ status });

    // Log the status change
    await logAudit(req, {
      action: 'ISSUE_STATUS_UPDATED',
      resource: 'order_issue',
      resourceId: issue.id,
      targetUserId: issue.order.userId,
      description: `Issue status changed from ${oldStatus} to ${status}`,
      metadata: {
        issueId: issue.id,
        orderId: issue.orderId,
        oldStatus,
        newStatus: status
      }
    });

    res.json({
      success: true,
      message: 'Issue status updated successfully',
      issue: {
        id: issue.id,
        status: issue.status
      }
    });
  })
);

/**
 * Get issue statistics (admin only)
 */
router.get('/issues/stats',
  auth,
  requirePermission('orders.view'),
  asyncHandler(async (req, res) => {
    const { sequelize } = OrderIssue;

    const stats = await OrderIssue.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    });

    res.json({
      stats: statsMap,
      total: Object.values(statsMap).reduce((sum, count) => sum + count, 0)
    });
  })
);

export default router;
