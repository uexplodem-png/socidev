/**
 * Migration: Add Performance Indexes
 * 
 * This migration adds indexes to improve query performance across the application:
 * - Foreign key indexes for JOIN operations
 * - Status and date indexes for filtering
 * - Composite indexes for common query patterns
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Orders table indexes
      await queryInterface.addIndex('orders', ['user_id', 'status'], {
        name: 'idx_orders_user_status',
        transaction
      });
      
      await queryInterface.addIndex('orders', ['platform', 'status'], {
        name: 'idx_orders_platform_status',
        transaction
      });
      
      await queryInterface.addIndex('orders', ['created_at'], {
        name: 'idx_orders_created_at',
        transaction
      });

      // Tasks table indexes
      await queryInterface.addIndex('tasks', ['user_id', 'status'], {
        name: 'idx_tasks_user_status',
        transaction
      });
      
      await queryInterface.addIndex('tasks', ['platform', 'admin_status'], {
        name: 'idx_tasks_platform_admin_status',
        transaction
      });
      
      await queryInterface.addIndex('tasks', ['order_id'], {
        name: 'idx_tasks_order_id',
        transaction
      });
      
      await queryInterface.addIndex('tasks', ['remaining_quantity'], {
        name: 'idx_tasks_remaining_quantity',
        transaction
      });

      // Task Executions table indexes
      await queryInterface.addIndex('task_executions', ['user_id', 'status'], {
        name: 'idx_task_executions_user_status',
        transaction
      });
      
      await queryInterface.addIndex('task_executions', ['task_id', 'status'], {
        name: 'idx_task_executions_task_status',
        transaction
      });
      
      await queryInterface.addIndex('task_executions', ['created_at'], {
        name: 'idx_task_executions_created_at',
        transaction
      });

      // Transactions table indexes
      await queryInterface.addIndex('transactions', ['user_id', 'type'], {
        name: 'idx_transactions_user_type',
        transaction
      });
      
      await queryInterface.addIndex('transactions', ['user_id', 'status'], {
        name: 'idx_transactions_user_status',
        transaction
      });
      
      await queryInterface.addIndex('transactions', ['type', 'status', 'created_at'], {
        name: 'idx_transactions_type_status_date',
        transaction
      });
      
      await queryInterface.addIndex('transactions', ['order_id'], {
        name: 'idx_transactions_order_id',
        transaction
      });

      // Devices table indexes
      await queryInterface.addIndex('devices', ['user_id', 'status'], {
        name: 'idx_devices_user_status',
        transaction
      });

      // Social Accounts table indexes
      await queryInterface.addIndex('social_accounts', ['user_id', 'platform'], {
        name: 'idx_social_accounts_user_platform',
        transaction
      });
      
      await queryInterface.addIndex('social_accounts', ['platform', 'status'], {
        name: 'idx_social_accounts_platform_status',
        transaction
      });

      // Audit Logs table indexes
      await queryInterface.addIndex('audit_logs', ['actor_id', 'created_at'], {
        name: 'idx_audit_logs_actor_date',
        transaction
      });
      
      await queryInterface.addIndex('audit_logs', ['target_user_id', 'created_at'], {
        name: 'idx_audit_logs_target_date',
        transaction
      });
      
      await queryInterface.addIndex('audit_logs', ['resource', 'resource_id'], {
        name: 'idx_audit_logs_resource',
        transaction
      });

      await transaction.commit();
      console.log('✅ Performance indexes added successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Orders indexes
      await queryInterface.removeIndex('orders', 'idx_orders_user_status', { transaction });
      await queryInterface.removeIndex('orders', 'idx_orders_platform_status', { transaction });
      await queryInterface.removeIndex('orders', 'idx_orders_created_at', { transaction });

      // Tasks indexes
      await queryInterface.removeIndex('tasks', 'idx_tasks_user_status', { transaction });
      await queryInterface.removeIndex('tasks', 'idx_tasks_platform_admin_status', { transaction });
      await queryInterface.removeIndex('tasks', 'idx_tasks_order_id', { transaction });
      await queryInterface.removeIndex('tasks', 'idx_tasks_remaining_quantity', { transaction });

      // Task Executions indexes
      await queryInterface.removeIndex('task_executions', 'idx_task_executions_user_status', { transaction });
      await queryInterface.removeIndex('task_executions', 'idx_task_executions_task_status', { transaction });
      await queryInterface.removeIndex('task_executions', 'idx_task_executions_created_at', { transaction });

      // Transactions indexes
      await queryInterface.removeIndex('transactions', 'idx_transactions_user_type', { transaction });
      await queryInterface.removeIndex('transactions', 'idx_transactions_user_status', { transaction });
      await queryInterface.removeIndex('transactions', 'idx_transactions_type_status_date', { transaction });
      await queryInterface.removeIndex('transactions', 'idx_transactions_order_id', { transaction });

      // Devices indexes
      await queryInterface.removeIndex('devices', 'idx_devices_user_status', { transaction });

      // Social Accounts indexes
      await queryInterface.removeIndex('social_accounts', 'idx_social_accounts_user_platform', { transaction });
      await queryInterface.removeIndex('social_accounts', 'idx_social_accounts_platform_status', { transaction });

      // Audit Logs indexes
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_actor_date', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_target_date', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_resource', { transaction });

      await transaction.commit();
      console.log('✅ Performance indexes removed successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
