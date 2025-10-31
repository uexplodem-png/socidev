'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Change email_verification_token from STRING to TEXT
    // to support longer JWT tokens (can be 200-500+ characters)
    await queryInterface.changeColumn('users', 'email_verification_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to STRING
    await queryInterface.changeColumn('users', 'email_verification_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
