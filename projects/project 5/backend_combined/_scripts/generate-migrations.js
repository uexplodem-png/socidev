import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const migrations = [
  {
    name: '001-create-users.cjs',
    content: `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      role: {
        type: Sequelize.ENUM('task_doer', 'task_giver', 'admin', 'super_admin', 'moderator'),
        defaultValue: 'task_doer',
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'banned', 'pending'),
        defaultValue: 'active',
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      two_factor_secret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      two_factor_backup_codes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      password_reset_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      user_mode: {
        type: Sequelize.ENUM('task_doer', 'task_giver', 'both'),
        defaultValue: 'task_doer',
      },
      refresh_token: {
        type: Sequelize.STRING,
        allowNull: true,
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

    // Add indexes
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
};
`
  },
  {
    name: '002-create-orders.cjs',
    content: `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      platform: {
        type: Sequelize.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
        allowNull: false,
      },
      service: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      remaining_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      completed_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
        defaultValue: 'pending',
      },
      speed: {
        type: Sequelize.ENUM('normal', 'fast', 'express'),
        defaultValue: 'normal',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Add indexes
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['platform']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  },
};
`
  },
  {
    name: '003-create-tasks.cjs',
    content: `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('like', 'follow', 'view', 'subscribe', 'comment', 'share'),
        allowNull: false,
      },
      platform: {
        type: Sequelize.ENUM('instagram', 'youtube', 'twitter', 'tiktok'),
        allowNull: false,
      },
      target_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      remaining_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      completed_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      rate: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'processing', 'submitted_for_approval', 'completed', 'failed', 'cancelled', 'rejected_by_admin'),
        defaultValue: 'pending',
      },
      admin_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      screenshot_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      screenshot_thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      screenshot_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: true,
      },
      screenshot_submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      payout_processed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      admin_reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      admin_reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      requirements: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Add indexes
    await queryInterface.addIndex('tasks', ['user_id']);
    await queryInterface.addIndex('tasks', ['order_id']);
    await queryInterface.addIndex('tasks', ['platform', 'type']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['admin_status']);
    await queryInterface.addIndex('tasks', ['last_updated_at']);
    await queryInterface.addIndex('tasks', ['priority']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tasks');
  },
};
`
  }
];

// Continue with more migration files...
const additionalMigrations = [
  {
    name: '004-create-transactions.cjs',
    content: `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      type: {
        type: Sequelize.ENUM('deposit', 'withdrawal', 'earning', 'spending', 'refund', 'adjustment'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      balance_before: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
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

    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  },
};
`
  },
  // Add remaining tables similarly...
];

// Write all migrations
[...migrations, ...additionalMigrations].forEach((migration) => {
  const filePath = path.join(migrationsDir, migration.name);
  fs.writeFileSync(filePath, migration.content);
  console.log(`✅ Created: ${migration.name}`);
});

console.log(`\n✅ Generated ${migrations.length + additionalMigrations.length} migration files`);
