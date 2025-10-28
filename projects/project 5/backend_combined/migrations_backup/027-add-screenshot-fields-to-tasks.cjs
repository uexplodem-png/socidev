'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add screenshot-related fields to tasks table
    await queryInterface.addColumn('tasks', 'screenshot_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'rejection_reason'
    });

    await queryInterface.addColumn('tasks', 'screenshot_thumbnail_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'screenshot_url'
    });

    await queryInterface.addColumn('tasks', 'screenshot_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: true,
      after: 'screenshot_thumbnail_url'
    });

    await queryInterface.addColumn('tasks', 'screenshot_submitted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'screenshot_status'
    });

    await queryInterface.addColumn('tasks', 'payout_processed', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      after: 'screenshot_submitted_at'
    });

    // Update existing status enum to include new statuses
    await queryInterface.sequelize.query(`
      ALTER TABLE tasks 
      MODIFY COLUMN status ENUM(
        'pending', 
        'in_progress', 
        'processing', 
        'submitted_for_approval', 
        'completed', 
        'failed', 
        'cancelled',
        'rejected_by_admin'
      ) DEFAULT 'pending'
    `);

    // Add index for screenshot_status for faster admin queries
    await queryInterface.addIndex('tasks', ['screenshot_status'], {
      name: 'tasks_screenshot_status_idx'
    });

    // Add index for payout_processed
    await queryInterface.addIndex('tasks', ['payout_processed'], {
      name: 'tasks_payout_processed_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('tasks', 'tasks_screenshot_status_idx');
    await queryInterface.removeIndex('tasks', 'tasks_payout_processed_idx');

    // Remove columns
    await queryInterface.removeColumn('tasks', 'payout_processed');
    await queryInterface.removeColumn('tasks', 'screenshot_submitted_at');
    await queryInterface.removeColumn('tasks', 'screenshot_status');
    await queryInterface.removeColumn('tasks', 'screenshot_thumbnail_url');
    await queryInterface.removeColumn('tasks', 'screenshot_url');

    // Revert status enum to original values
    await queryInterface.sequelize.query(`
      ALTER TABLE tasks 
      MODIFY COLUMN status ENUM(
        'pending', 
        'processing', 
        'completed', 
        'failed', 
        'cancelled'
      ) DEFAULT 'pending'
    `);
  }
};
