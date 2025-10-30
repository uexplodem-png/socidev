'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_keys', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true, // Her kullanıcının sadece 1 API key'i olabilir
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      api_key: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      api_secret: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'revoked'),
        defaultValue: 'active',
        allowNull: false,
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      total_requests: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      rate_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 1000, // Günlük istek limiti
        allowNull: false,
      },
      allowed_ips: {
        type: Sequelize.TEXT, // JSON array olarak saklanacak
        allowNull: true,
        comment: 'JSON array of allowed IP addresses',
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata (permissions, notes, etc.)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Indexes
    await queryInterface.addIndex('api_keys', ['user_id'], {
      name: 'idx_api_keys_user_id',
    });

    await queryInterface.addIndex('api_keys', ['api_key'], {
      name: 'idx_api_keys_api_key',
      unique: true,
    });

    await queryInterface.addIndex('api_keys', ['status'], {
      name: 'idx_api_keys_status',
    });

    await queryInterface.addIndex('api_keys', ['created_at'], {
      name: 'idx_api_keys_created_at',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('api_keys');
  },
};
