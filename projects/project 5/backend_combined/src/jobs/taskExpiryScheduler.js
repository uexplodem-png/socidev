/**
 * PART 5: Task Execution Expiry Cron Job
 * Runs every 5 minutes to expire task reservations that haven't been submitted within 15 minutes
 */

import cron from 'node-cron';
import { Op } from 'sequelize';
import { TaskExecution, Task } from '../models/index.js';
import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Expire old task reservations that haven't been submitted
 */
export const expireOldReservations = async () => {
  try {
    logger.info('[CRON] Starting task execution expiry check...');

    // Find all pending executions that have expired
    const expiredExecutions = await TaskExecution.findAll({
      where: {
        status: 'pending',
        submittedAt: null,
        expiresAt: {
          [Op.lt]: new Date()
        }
      },
      attributes: ['id', 'taskId', 'userId', 'reservedAt', 'expiresAt']
    });

    if (expiredExecutions.length === 0) {
      logger.info('[CRON] No expired task executions found');
      return;
    }

    logger.info(`[CRON] Found ${expiredExecutions.length} expired task executions`);

    // Process each expired execution
    for (const execution of expiredExecutions) {
      const transaction = await sequelize.transaction();
      
      try {
        // Update execution status to expired
        await execution.update({ 
          status: 'expired' 
        }, { transaction });

        // Return slot to task (increment remaining_quantity)
        await Task.increment('remainingQuantity', {
          by: 1,
          where: { id: execution.taskId },
          transaction
        });

        await transaction.commit();
        
        logger.info(`[CRON] Expired execution ${execution.id} for task ${execution.taskId}`);
      } catch (error) {
        await transaction.rollback();
        logger.error(`[CRON] Error expiring execution ${execution.id}:`, error);
      }
    }

    logger.info(`[CRON] Successfully expired ${expiredExecutions.length} task executions`);

  } catch (error) {
    logger.error('[CRON] Error in task expiry job:', error);
  }
};

/**
 * Start the cron job
 * Runs every 5 minutes
 */
export const startTaskExpiryScheduler = () => {
  // Run every 5 minutes (cron pattern: */5 * * * *)
  cron.schedule('*/5 * * * *', async () => {
    await expireOldReservations();
  });

  logger.info('✅ Task execution expiry scheduler started (runs every 5 minutes)');
};
