/**
 * Migration: Add 2FA and email verification fields
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add two_factor_secret column if it doesn't exist
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.two_factor_secret) {
      await queryInterface.addColumn('users', 'two_factor_secret', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'TOTP secret for 2FA'
      });
    }
    
    if (!tableDescription.two_factor_backup_codes) {
      await queryInterface.addColumn('users', 'two_factor_backup_codes', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of backup codes'
      });
    }
    
    if (!tableDescription.email_verification_token) {
      await queryInterface.addColumn('users', 'email_verification_token', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Token for email verification'
      });
    }
    
    if (!tableDescription.email_verification_expires) {
      await queryInterface.addColumn('users', 'email_verification_expires', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Expiry time for email verification token'
      });
    }
    
    if (!tableDescription.password_reset_token) {
      await queryInterface.addColumn('users', 'password_reset_token', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Token for password reset'
      });
    }
    
    if (!tableDescription.password_reset_expires) {
      await queryInterface.addColumn('users', 'password_reset_expires', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Expiry time for password reset token'
      });
    }
    
    if (!tableDescription.locked_until) {
      await queryInterface.addColumn('users', 'locked_until', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Account lockout expiry time'
      });
    }
    
    console.log('✅ Added 2FA and verification fields to users table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'two_factor_secret');
    await queryInterface.removeColumn('users', 'two_factor_backup_codes');
    await queryInterface.removeColumn('users', 'email_verification_token');
    await queryInterface.removeColumn('users', 'email_verification_expires');
    await queryInterface.removeColumn('users', 'password_reset_token');
    await queryInterface.removeColumn('users', 'password_reset_expires');
    await queryInterface.removeColumn('users', 'locked_until');
    
    console.log('✅ Removed 2FA and verification fields from users table');
  }
};
