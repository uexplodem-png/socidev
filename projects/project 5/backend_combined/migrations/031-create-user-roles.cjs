'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.STRING(36),
        allowNull: false
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Unique constraint on user_id + role_id
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id'], {
      name: 'uniq_user_role',
      unique: true
    });

    // Index for queries by user_id
    await queryInterface.addIndex('user_roles', ['user_id'], {
      name: 'idx_user_roles_user_id'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_roles');
  }
};
