import { body } from 'express-validator';

export const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number')
];

export const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

export const validateSettingsUpdate = [
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Invalid notifications format'),
  
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification setting must be boolean'),
  
  body('notifications.browser')
    .optional()
    .isBoolean()
    .withMessage('Browser notification setting must be boolean'),
  
  body('privacy')
    .optional()
    .isObject()
    .withMessage('Invalid privacy format'),
  
  body('privacy.hideProfile')
    .optional()
    .isBoolean()
    .withMessage('Hide profile setting must be boolean'),
  
  body('privacy.hideStats')
    .optional()
    .isBoolean()
    .withMessage('Hide stats setting must be boolean'),
  
  body('language')
    .optional()
    .isIn(['en', 'tr'])
    .withMessage('Invalid language selection')
];