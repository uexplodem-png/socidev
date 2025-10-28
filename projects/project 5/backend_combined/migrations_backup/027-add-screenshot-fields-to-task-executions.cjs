module.exports = {
  async up(queryInterface, Sequelize) {
    // Add screenshot-related fields to task_executions
    await queryInterface.addColumn('task_executions', 'screenshot_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('task_executions', 'screenshot_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: true,
    });

    await queryInterface.addColumn('task_executions', 'screenshot_submitted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('task_executions', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('task_executions', 'started_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('task_executions', 'screenshot_url');
    await queryInterface.removeColumn('task_executions', 'screenshot_status');
    await queryInterface.removeColumn('task_executions', 'screenshot_submitted_at');
    await queryInterface.removeColumn('task_executions', 'rejection_reason');
    await queryInterface.removeColumn('task_executions', 'started_at');
  },
};
