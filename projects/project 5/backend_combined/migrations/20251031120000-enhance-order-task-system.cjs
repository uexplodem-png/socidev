'use strict';

/**
 * Part 1: Database Schema Updates & Indexes
 * Enhancements for Order & Task Management System
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1.1 Orders Table Enhancements
    console.log('Adding fields to orders table...');
    
    // Check if unit_price exists, if not add it
    const ordersTable = await queryInterface.describeTable('orders');
    
    if (!ordersTable.unit_price) {
      await queryInterface.addColumn('orders', 'unit_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Price per unit for refund calculations'
      });
    }
    
    if (!ordersTable.priority) {
      await queryInterface.addColumn('orders', 'priority', {
        type: Sequelize.ENUM('normal', 'urgent', 'critical'),
        defaultValue: 'normal',
        comment: 'Order priority for sorting'
      });
    }
    
    if (!ordersTable.last_status_change) {
      await queryInterface.addColumn('orders', 'last_status_change', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp of last status change'
      });
    }
    
    if (!ordersTable.refund_amount) {
      await queryInterface.addColumn('orders', 'refund_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount refunded if order is refunded'
      });
    }

    // Add composite indexes for orders
    console.log('Adding indexes to orders table...');
    try {
      await queryInterface.addIndex('orders', ['status', 'priority', 'created_at'], {
        name: 'idx_orders_status_priority_created',
        comment: 'For sorted order listings (newest + urgent first)'
      });
    } catch (e) {
      console.log('Index idx_orders_status_priority_created may already exist');
    }

    try {
      await queryInterface.addIndex('orders', ['user_id', 'platform', 'service', 'target_url'], {
        name: 'idx_orders_duplicate_check',
        comment: 'For duplicate order detection'
      });
    } catch (e) {
      console.log('Index idx_orders_duplicate_check may already exist');
    }

    // 1.2 Order Issues Table (Secure Message System)
    console.log('Creating order_issues table...');
    try {
      await queryInterface.createTable('order_issues', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        order_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'orders',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        admin_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'XSS-sanitized message content'
        },
        sender_type: {
          type: Sequelize.ENUM('user', 'admin'),
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
          defaultValue: 'open'
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'IPv4 or IPv6 address'
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      });

      await queryInterface.addIndex('order_issues', ['order_id', 'created_at'], {
        name: 'idx_order_issues_order_created'
      });

      await queryInterface.addIndex('order_issues', ['status', 'created_at'], {
        name: 'idx_order_issues_status_created'
      });

      await queryInterface.addIndex('order_issues', ['user_id'], {
        name: 'idx_order_issues_user'
      });

      console.log('order_issues table created successfully');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('order_issues table already exists');
      } else {
        throw e;
      }
    }

    // 1.3 Tasks Table Updates
    console.log('Updating tasks table...');
    const tasksTable = await queryInterface.describeTable('tasks');
    
    if (!tasksTable.excluded_user_id) {
      await queryInterface.addColumn('tasks', 'excluded_user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who cannot do this task (order owner)'
      });
    }

    // Ensure order_id has proper foreign key
    if (!tasksTable.order_id) {
      await queryInterface.addColumn('tasks', 'order_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Linked order if task auto-created'
      });
    }

    // Add indexes for tasks
    console.log('Adding indexes to tasks table...');
    try {
      await queryInterface.addIndex('tasks', ['priority', 'status', 'created_at'], {
        name: 'idx_tasks_priority_status_created',
        comment: 'For smart task listing (priority first, then oldest)'
      });
    } catch (e) {
      console.log('Index idx_tasks_priority_status_created may already exist');
    }

    try {
      await queryInterface.addIndex('tasks', ['excluded_user_id'], {
        name: 'idx_tasks_excluded_user'
      });
    } catch (e) {
      console.log('Index idx_tasks_excluded_user may already exist');
    }

    // 1.4 Task Executions Table Updates
    console.log('Updating task_executions table...');
    const taskExecutionsTable = await queryInterface.describeTable('task_executions');
    
    // Update status enum to include new statuses
    if (taskExecutionsTable.status) {
      await queryInterface.changeColumn('task_executions', 'status', {
        type: Sequelize.ENUM('pending', 'submitted', 'approved', 'rejected', 'expired', 'completed', 'failed'),
        defaultValue: 'pending',
        comment: 'Execution status including 15-minute timer states'
      });
    }
    
    if (!taskExecutionsTable.proof_url) {
      await queryInterface.addColumn('task_executions', 'proof_url', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL to proof/screenshot'
      });
    }
    
    if (!taskExecutionsTable.submission_notes) {
      await queryInterface.addColumn('task_executions', 'submission_notes', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User notes on submission'
      });
    }
    
    if (!taskExecutionsTable.admin_notes) {
      await queryInterface.addColumn('task_executions', 'admin_notes', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Admin notes on approval/rejection'
      });
    }
    
    if (!taskExecutionsTable.reserved_at) {
      await queryInterface.addColumn('task_executions', 'reserved_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When user reserved the task'
      });
    }
    
    if (!taskExecutionsTable.submitted_at) {
      await queryInterface.addColumn('task_executions', 'submitted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user submitted proof'
      });
    }
    
    if (!taskExecutionsTable.expires_at) {
      await queryInterface.addColumn('task_executions', 'expires_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '15 minutes from reserved_at'
      });
    }
    
    if (!taskExecutionsTable.reviewed_at) {
      await queryInterface.addColumn('task_executions', 'reviewed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When admin reviewed'
      });
    }
    
    if (!taskExecutionsTable.reviewed_by) {
      await queryInterface.addColumn('task_executions', 'reviewed_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Admin who reviewed'
      });
    }
    
    if (!taskExecutionsTable.ip_address) {
      await queryInterface.addColumn('task_executions', 'ip_address', {
        type: Sequelize.STRING(45),
        allowNull: true
      });
    }
    
    if (!taskExecutionsTable.user_agent) {
      await queryInterface.addColumn('task_executions', 'user_agent', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // Add indexes for task_executions
    console.log('Adding indexes to task_executions table...');
    try {
      await queryInterface.addIndex('task_executions', ['status', 'expires_at'], {
        name: 'idx_executions_status_expires',
        comment: 'For cron job to find expired executions'
      });
    } catch (e) {
      console.log('Index idx_executions_status_expires may already exist');
    }

    try {
      await queryInterface.addIndex('task_executions', ['task_id', 'status', 'created_at'], {
        name: 'idx_executions_task_status_created'
      });
    } catch (e) {
      console.log('Index idx_executions_task_status_created may already exist');
    }

    try {
      await queryInterface.addIndex('task_executions', ['user_id', 'status', 'created_at'], {
        name: 'idx_executions_user_status_created'
      });
    } catch (e) {
      console.log('Index idx_executions_user_status_created may already exist');
    }

    try {
      await queryInterface.addIndex('task_executions', ['reviewed_by'], {
        name: 'idx_executions_reviewed_by'
      });
    } catch (e) {
      console.log('Index idx_executions_reviewed_by may already exist');
    }

    console.log('Part 1: Database schema updates completed successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns and tables in reverse order
    console.log('Rolling back database changes...');
    
    // Remove task_executions indexes and columns
    await queryInterface.removeIndex('task_executions', 'idx_executions_reviewed_by');
    await queryInterface.removeIndex('task_executions', 'idx_executions_user_status_created');
    await queryInterface.removeIndex('task_executions', 'idx_executions_task_status_created');
    await queryInterface.removeIndex('task_executions', 'idx_executions_status_expires');
    
    await queryInterface.removeColumn('task_executions', 'user_agent');
    await queryInterface.removeColumn('task_executions', 'ip_address');
    await queryInterface.removeColumn('task_executions', 'reviewed_by');
    await queryInterface.removeColumn('task_executions', 'reviewed_at');
    await queryInterface.removeColumn('task_executions', 'expires_at');
    await queryInterface.removeColumn('task_executions', 'submitted_at');
    await queryInterface.removeColumn('task_executions', 'reserved_at');
    await queryInterface.removeColumn('task_executions', 'admin_notes');
    await queryInterface.removeColumn('task_executions', 'submission_notes');
    await queryInterface.removeColumn('task_executions', 'proof_url');
    
    // Remove tasks indexes and columns
    await queryInterface.removeIndex('tasks', 'idx_tasks_excluded_user');
    await queryInterface.removeIndex('tasks', 'idx_tasks_priority_status_created');
    await queryInterface.removeColumn('tasks', 'excluded_user_id');
    
    // Drop order_issues table
    await queryInterface.dropTable('order_issues');
    
    // Remove orders indexes and columns
    await queryInterface.removeIndex('orders', 'idx_orders_duplicate_check');
    await queryInterface.removeIndex('orders', 'idx_orders_status_priority_created');
    await queryInterface.removeColumn('orders', 'refund_amount');
    await queryInterface.removeColumn('orders', 'last_status_change');
    await queryInterface.removeColumn('orders', 'priority');
    await queryInterface.removeColumn('orders', 'unit_price');
    
    console.log('Rollback completed');
  }
};
