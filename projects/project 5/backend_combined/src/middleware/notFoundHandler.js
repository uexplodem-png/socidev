import logger from '../config/logger.js';

export const notFoundHandler = (req, res) => {
  logger.warn('Route not found:', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
};

export default notFoundHandler;