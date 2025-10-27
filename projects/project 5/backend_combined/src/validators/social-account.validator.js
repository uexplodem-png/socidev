import { body, param } from 'express-validator';

export const validateSocialAccount = [
  body('platform')
    .isString()
    .notEmpty()
    .withMessage('Platform is required'),
  body('username')
    .isString()
    .notEmpty()
    .withMessage('Username is required'),
  body('credentials')
    .optional()
    .isObject()
    .withMessage('Credentials must be an object')
];

export const validateAccountSettings = [
  param('id')
    .isUUID()
    .withMessage('Invalid account ID'),
  body('settings')
    .isObject()
    .withMessage('Settings must be an object')
];