'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Increase token field lengths to TEXT
    await queryInterface.changeColumn('users', 'email_verification_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.changeColumn('users', 'password_reset_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.changeColumn('users', 'refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to STRING
    await queryInterface.changeColumn('users', 'email_verification_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.changeColumn('users', 'password_reset_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.changeColumn('users', 'refresh_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
