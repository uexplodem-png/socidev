import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import permissionsService from './permissionsService.js';

export class AuthService {
  async register(userData) {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: userData.email }, { username: userData.username }]
      },
      attributes: ['id', 'email', 'username']
    });

    if (existingUser) {
      throw new ApiError(400, 'User already exists');
    }

    const user = await User.create(userData);
    const token = await this.generateToken(user.id);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'firstName', 'lastName', 'username', 'balance', 'lastLogin']
    });
    
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Update lastLogin timestamp
    const now = new Date();
    
    try {
      await user.update({ lastLogin: now });
      
      const token = await this.generateToken(user.id);
      return {
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      // Even if update fails, allow login to proceed
      const token = await this.generateToken(user.id);
      return {
        token,
        user: this.sanitizeUser(user)
      };
    }
  }

  async generateToken(userId) {
    // Get user permissions and roles for JWT
    const permissions = await permissionsService.getUserPermissions(userId);
    const roles = await permissionsService.getUserRoles(userId);
    
    return jwt.sign(
      { 
        userId,
        permissions,
        roles: roles.map(r => ({ id: r.id, key: r.key, label: r.label }))
      },
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
      balance: parseFloat(user.balance) || 0,
      lastLogin: user.lastLogin
    };
  }
}