import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    get() {
      const value = this.getDataValue('balance');
      return value === null ? 0 : parseFloat(value);
    }
  },
  role: {
    type: DataTypes.ENUM('task_doer', 'task_giver', 'admin', 'super_admin', 'moderator'),
    defaultValue: 'task_doer'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'banned', 'pending'),
    defaultValue: 'active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_verified'
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'two_factor_enabled'
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'two_factor_secret'
  },
  twoFactorBackupCodes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'two_factor_backup_codes',
    get() {
      const value = this.getDataValue('twoFactorBackupCodes');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('twoFactorBackupCodes', JSON.stringify(value));
    }
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'email_verification_token'
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'email_verification_expires'
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'password_reset_token'
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'password_reset_expires'
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'locked_until'
  },
  userMode: {
    type: DataTypes.ENUM('task_doer', 'task_giver', 'both'),
    defaultValue: 'task_doer',
    field: 'user_mode'
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'refresh_token'
  },
  restrictedPermissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    field: 'restricted_permissions',
    comment: 'Admin tarafından sınırlandırılmış yetkiler'
  }
}, {
  tableName: 'users',
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default User;

export { User };