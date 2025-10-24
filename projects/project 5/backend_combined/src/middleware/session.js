import { SessionService } from '../services/session.service.js';

const sessionService = new SessionService();

export const validateSession = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const session = await sessionService.validateSession(token);
    req.session = session;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid session' });
  }
};