import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.requestId,
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = err.errors?.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Database validation error';
    code = 'DB_VALIDATION_ERROR';
    details = err.errors?.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
    details = err.errors?.map(error => ({
      field: error.path,
      message: `${error.path} already exists`,
      value: error.value,
    }));
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference';
    code = 'INVALID_REFERENCE';
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database error';
    code = 'DATABASE_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    code = 'UPLOAD_ERROR';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
      code = 'FILE_TOO_LARGE';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
      code = 'TOO_MANY_FILES';
    }
  } else if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status;
    message = err.message;
    code = err.code || 'HTTP_ERROR';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
    details = null;
  }

  // Send error response
  const errorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  if (details) {
    errorResponse.details = details;
  }

  // Include request ID if available
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req, res) => {
  logger.warn('Route not found:', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    requestId: req.requestId,
  });

  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
};