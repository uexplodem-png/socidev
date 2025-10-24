import Session from '../models/Session.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';

export class SessionService {
  async createSession(userId, req) {
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const session = await Session.create({
      userId,
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt
    });

    return session;
  }

  async validateSession(token) {
    const session = await Session.findOne({
      where: { token }
    });

    if (!session) {
      throw new ApiError(401, 'Invalid session');
    }

    if (new Date() > session.expiresAt) {
      await session.destroy();
      throw new ApiError(401, 'Session expired');
    }

    await session.update({
      lastActivity: new Date()
    });

    return session;
  }

  async invalidateSession(token) {
    const session = await Session.findOne({
      where: { token }
    });

    if (session) {
      await session.destroy();
    }
  }

  async invalidateAllUserSessions(userId) {
    await Session.destroy({
      where: { userId }
    });
  }

  async getUserSessions(userId) {
    const sessions = await Session.findAll({
      where: { userId },
      order: [['lastActivity', 'DESC']]
    });

    return sessions;
  }
}