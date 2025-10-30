'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      api_key_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'api_keys',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      endpoint: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'API endpoint called',
      },
      method: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'HTTP method (GET, POST, PUT, DELETE)',
      },
      status_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'HTTP response status code',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'Client IP address',
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Client user agent',
      },
      request_body: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Request payload (sanitized)',
      },
      response_body: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Response payload (sanitized)',
      },
      response_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Response time in milliseconds',
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if request failed',
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional request metadata',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Indexes for better query performance
    await queryInterface.addIndex('api_logs', ['api_key_id', 'created_at'], {
      name: 'idx_api_logs_api_key_created',
    });

    await queryInterface.addIndex('api_logs', ['user_id', 'created_at'], {
      name: 'idx_api_logs_user_created',
    });

    await queryInterface.addIndex('api_logs', ['endpoint'], {
      name: 'idx_api_logs_endpoint',
    });

    await queryInterface.addIndex('api_logs', ['status_code'], {
      name: 'idx_api_logs_status_code',
    });

    await queryInterface.addIndex('api_logs', ['created_at'], {
      name: 'idx_api_logs_created_at',
    });

    await queryInterface.addIndex('api_logs', ['ip_address'], {
      name: 'idx_api_logs_ip_address',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('api_logs');
  },
};
