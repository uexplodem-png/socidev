import { ActivityService } from '../services/activity.service.js';

const activityService = new ActivityService();

export const logActivity = (type, action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await activityService.logActivity(
          req.user.id,
          type,
          action,
          { path: req.path, method: req.method },
          req
        );
      }
      next();
    } catch (error) {
      // Log error but don't block the request
      console.error('Activity logging failed:', error);
      next();
    }
  };
};