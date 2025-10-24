import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { sequelize } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import fs from 'fs';

export class AuthService {
  async register(userData) {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: userData.email }, { username: userData.username }]
      }
    });

    if (existingUser) {
      throw new ApiError(400, 'User already exists');
    }

    const user = await User.create(userData);
    const token = this.generateToken(user.id);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Update lastLogin timestamp using raw SQL
    const now = new Date();
    const debugPath = '/tmp/lastlogin-debug.txt';
    
    try {
      // Test query - select and return the value
      const testResult = await sequelize.query(
        `SELECT last_login FROM users WHERE id = :userId`,
        {
          replacements: { userId: user.id },
          type: 'SELECT'
        }
      );
      
      fs.appendFileSync(debugPath, `[BEFORE UPDATE] Current last_login in DB: ${JSON.stringify(testResult)}\n`);

      await sequelize.query(
        `UPDATE users SET last_login = :lastLogin, updated_at = :updatedAt WHERE id = :userId`,
        {
          replacements: {
            lastLogin: now,
            updatedAt: now,
            userId: user.id
          }
        }
      );
      
      fs.appendFileSync(debugPath, `[AFTER UPDATE] Update query executed, now: ${now}\n`);

      // Check if update worked
      const afterResult = await sequelize.query(
        `SELECT last_login FROM users WHERE id = :userId`,
        {
          replacements: { userId: user.id },
          type: 'SELECT'
        }
      );
      
      fs.appendFileSync(debugPath, `[AFTER CHECK] New last_login in DB: ${JSON.stringify(afterResult)}\n`);
      
      // Re-fetch the user to get the updated lastLogin value
      const freshUser = await User.findByPk(user.id);
      fs.appendFileSync(debugPath, `[SEQUELIZE FETCH] lastLogin from sequelize: ${freshUser.lastLogin}\n`);
      
      const token = this.generateToken(freshUser.id);
      return {
        token,
        user: this.sanitizeUser(freshUser)
      };
    } catch (error) {
      fs.appendFileSync(debugPath, `[ERROR] Failed to update lastLogin: ${error.message}\n`);
      // Even if update fails, allow login to proceed
      const token = this.generateToken(user.id);
      return {
        token,
        user: this.sanitizeUser(user)
      };
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      balance: user.balance,
      lastLogin: user.lastLogin
    };
  }
}