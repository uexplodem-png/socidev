import express from 'express';
import { authenticateDesktopApi, requirePermission } from '../middleware/desktopApiAuth.js';
import Task from '../models/Task.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';

const router = express.Router();

// All routes require desktop API authentication
router.use(authenticateDesktopApi);

/**
 * GET /api/desktop/tasks/available
 * Get available tasks for the desktop app to execute
 */
router.get('/tasks/available', requirePermission('getTasks'), async (req, res) => {
  try {
    const { limit = 10, platform, service_type } = req.query;
    const userId = req.userId;

    // Build query conditions
    const where = {
      status: 'pending',
      userId: { [Op.ne]: userId } // Don't get own tasks
    };

    if (platform) {
      where.platform = platform;
    }

    if (service_type) {
      where.serviceType = service_type;
    }

    const tasks = await Task.findAll({
      where,
      include: [{
        model: Order,
        as: 'order',
        attributes: ['id', 'platform', 'service', 'targetUrl', 'quantity', 'pricePerTask']
      }],
      limit: parseInt(limit),
      order: [['createdAt', 'ASC']]
    });

    logger.info('Available tasks fetched', { 
      userId, 
      count: tasks.length,
      apiKeyId: req.apiKey.id 
    });

    res.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          id: task.id,
          orderId: task.orderId,
          platform: task.platform,
          serviceType: task.serviceType,
          targetUrl: task.targetUrl,
          targetUsername: task.targetUsername,
          instructions: task.instructions,
          reward: task.reward,
          status: task.status,
          createdAt: task.createdAt,
          order: task.order
        })),
        count: tasks.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching available tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available tasks'
    });
  }
});

/**
 * GET /api/desktop/tasks/:taskId
 * Get detailed information about a specific task
 */
router.get('/tasks/:taskId', requirePermission('getTaskDetails'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    const task = await Task.findOne({
      where: { id: taskId },
      include: [{
        model: Order,
        as: 'order',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      }]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Don't allow users to get details of their own tasks
    if (task.userId === userId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot access your own tasks'
      });
    }

    logger.info('Task details fetched', { 
      userId, 
      taskId,
      apiKeyId: req.apiKey.id 
    });

    res.json({
      success: true,
      data: {
        task: {
          id: task.id,
          orderId: task.orderId,
          platform: task.platform,
          serviceType: task.serviceType,
          targetUrl: task.targetUrl,
          targetUsername: task.targetUsername,
          instructions: task.instructions,
          reward: task.reward,
          status: task.status,
          requirements: task.requirements,
          createdAt: task.createdAt,
          order: task.order
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching task details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task details'
    });
  }
});

/**
 * GET /api/desktop/tasks/in-progress
 * Get tasks currently in progress by this user
 */
router.get('/tasks/in-progress', requirePermission('getInProgressTasks'), async (req, res) => {
  try {
    const userId = req.userId;

    const tasks = await Task.findAll({
      where: {
        userId,
        status: 'in_progress'
      },
      include: [{
        model: Order,
        as: 'order',
        attributes: ['id', 'platform', 'service', 'targetUrl', 'quantity', 'pricePerTask']
      }],
      order: [['updatedAt', 'DESC']]
    });

    logger.info('In-progress tasks fetched', { 
      userId, 
      count: tasks.length,
      apiKeyId: req.apiKey.id 
    });

    res.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          id: task.id,
          orderId: task.orderId,
          platform: task.platform,
          serviceType: task.serviceType,
          targetUrl: task.targetUrl,
          targetUsername: task.targetUsername,
          instructions: task.instructions,
          reward: task.reward,
          status: task.status,
          startedAt: task.startedAt,
          order: task.order
        })),
        count: tasks.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching in-progress tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch in-progress tasks'
    });
  }
});

/**
 * POST /api/desktop/tasks/:taskId/complete
 * Mark a task as completed
 */
router.post('/tasks/:taskId/complete', requirePermission('completeTask'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;
    const { screenshotUrl, notes } = req.body;

    const task = await Task.findOne({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Verify task belongs to this user
    if (task.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only complete your own tasks'
      });
    }

    // Verify task is in progress
    if (task.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Task is not in progress',
        currentStatus: task.status
      });
    }

    // Update task to completed (pending approval)
    await task.update({
      status: 'pending_approval',
      completedAt: new Date(),
      screenshotUrl: screenshotUrl || task.screenshotUrl,
      notes: notes || task.notes
    });

    logger.info('Task completed via desktop API', { 
      userId, 
      taskId,
      apiKeyId: req.apiKey.id 
    });

    res.json({
      success: true,
      data: {
        task: {
          id: task.id,
          status: task.status,
          completedAt: task.completedAt,
          reward: task.reward
        },
        message: 'Task submitted for approval'
      }
    });
  } catch (error) {
    logger.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete task'
    });
  }
});

/**
 * POST /api/desktop/tasks/:taskId/start
 * Mark a task as started/in progress
 */
router.post('/tasks/:taskId/start', requirePermission('getTasks'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    const task = await Task.findOne({
      where: { 
        id: taskId,
        status: 'pending'
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or not available'
      });
    }

    // Don't allow users to start their own tasks
    if (task.userId === userId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot start your own task'
      });
    }

    // Assign task to user and mark as in progress
    await task.update({
      userId,
      status: 'in_progress',
      startedAt: new Date()
    });

    logger.info('Task started via desktop API', { 
      userId, 
      taskId,
      apiKeyId: req.apiKey.id 
    });

    res.json({
      success: true,
      data: {
        task: {
          id: task.id,
          status: task.status,
          startedAt: task.startedAt,
          reward: task.reward
        },
        message: 'Task started successfully'
      }
    });
  } catch (error) {
    logger.error('Error starting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start task'
    });
  }
});

/**
 * GET /api/desktop/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apiKeyId: req.apiKey.id,
      userId: req.userId,
      requestCount: req.apiKey.requestCount
    }
  });
});

export default router;
