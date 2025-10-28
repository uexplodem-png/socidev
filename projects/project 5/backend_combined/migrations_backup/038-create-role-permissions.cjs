'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mode: {
        type: Sequelize.ENUM('all', 'taskDoer', 'taskGiver'),
        allowNull: false,
        defaultValue: 'all'
      },
      allow: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1
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

    // Unique constraint on role_id + permission_id + mode
    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id', 'mode'], {
      name: 'uniq_role_perm_mode',
      unique: true
    });

    // Composite index for fast lookups
    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id', 'mode'], {
      name: 'idx_role_permissions_lookup'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('role_permissions');
  }
};
