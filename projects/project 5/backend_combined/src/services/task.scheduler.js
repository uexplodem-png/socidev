import schedule from 'node-schedule';
import { Op } from 'sequelize';
import TaskExecution from '../models/TaskExecution.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Task Auto-Release Scheduler
 * 
 * Runs every 5 minutes to:
 * 1. Find TaskExecutions that are pending and past their 1-hour timeout
 * 2. Mark them as "failed" (abandoned)
 * 3. Restore the task's remainingQuantity to make the slot available again
 * 
 * This ensures fairness: users who claim tasks but don't complete them
 * within 1 hour will have their slot released for others to claim.
 */

class TaskScheduler {
  constructor() {
    this.job = null;
  }

  /**
   * Start the scheduler
   */
  start() {
    // Run every 5 minutes: '*/5 * * * *'
    // For testing, you can use '* * * * *' to run every minute
    this.job = schedule.scheduleJob('*/5 * * * *', async () => {
      logger.info('Running task auto-release job...');
      await this.releaseExpiredTasks();
    });

    logger.info('Task auto-release scheduler started (runs every 5 minutes)');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.cancel();
      logger.info('Task auto-release scheduler stopped');
    }
  }

  /**
   * Main job: Release expired task executions
   */
  async releaseExpiredTasks() {
    const transaction = await sequelize.transaction();

    try {
      const now = new Date();

      // Find all pending task executions that have expired (cooldownEndsAt < now)
      const expiredExecutions = await TaskExecution.findAll({
        where: {
          status: 'pending',
          cooldownEndsAt: {
            [Op.lt]: now, // cooldownEndsAt is in the past
          },
          completedAt: null, // Not completed
        },
        include: [
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'title', 'remainingQuantity', 'quantity'],
          },
          {
            model: User,
            attributes: ['id', 'username', 'email'],
          },
        ],
        transaction,
      });

      if (expiredExecutions.length === 0) {
        logger.info('No expired task executions found');
        await transaction.commit();
        return;
      }

      logger.info(`Found ${expiredExecutions.length} expired task executions`);

      // Process each expired execution
      for (const execution of expiredExecutions) {
        try {
          // Restore the task's remaining quantity
          await Task.increment('remainingQuantity', {
            by: 1,
            where: { id: execution.taskId },
            transaction,
          });

          // Mark the execution as failed
          await execution.update(
            {
              status: 'failed',
              completedAt: now,
            },
            { transaction }
          );

          logger.info(`Released task execution ${execution.id}:`, {
            userId: execution.userId,
            taskId: execution.taskId,
            taskTitle: execution.task?.title,
            username: execution.User?.username,
            startedAt: execution.startedAt,
            cooldownEndsAt: execution.cooldownEndsAt,
          });
        } catch (error) {
          logger.error(`Error processing execution ${execution.id}:`, error);
          // Continue with other executions even if one fails
        }
      }

      await transaction.commit();
      logger.info(`Successfully released ${expiredExecutions.length} expired task executions`);
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in task auto-release job:', error);
    }
  }

  /**
   * Run the job manually (useful for testing)
   */
  async runNow() {
    logger.info('Manually triggering task auto-release job...');
    await this.releaseExpiredTasks();
  }
}

// Export singleton instance
export const taskScheduler = new TaskScheduler();
export default taskScheduler;
