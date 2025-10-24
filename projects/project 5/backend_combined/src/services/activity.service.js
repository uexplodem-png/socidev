import ActivityLog from '../models/ActivityLog.js';

export class ActivityService {
  async logActivity(userId, type, action, details = {}, req = null) {
    const activityLog = await ActivityLog.create({
      userId,
      type,
      action,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent']
    });

    return activityLog;
  }

  async getUserActivities(userId, { type, page = 1, limit = 10 }) {
    const where = { userId };
    if (type) where.type = type;

    const { rows: activities, count } = await ActivityLog.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      activities,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getRecentActivities(userId, limit = 5) {
    const activities = await ActivityLog.findAll({
      where: { userId },
      limit,
      order: [['createdAt', 'DESC']]
    });

    return activities;
  }
}