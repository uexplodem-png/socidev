import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone,
      balance: user.balance,
      userMode: user.userMode,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  }

  async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const updatedUser = await user.update(updateData);
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      phone: updatedUser.phone
    };
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });
  }

  async updateUserMode(userId, userMode) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const updatedUser = await user.update({ userMode });
    return {
      id: updatedUser.id,
      userMode: updatedUser.userMode
    };
  }

  async getSettings(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Get settings from user model or separate settings table
    return {
      notifications: {
        email: true,
        browser: true,
        ...user.settings?.notifications
      },
      privacy: {
        hideProfile: false,
        hideStats: false,
        ...user.settings?.privacy
      },
      language: user.settings?.language || 'en'
    };
  }

  async updateSettings(userId, settings) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const updatedUser = await user.update({
      settings: {
        ...user.settings,
        ...settings
      }
    });

    return updatedUser.settings;
  }
}