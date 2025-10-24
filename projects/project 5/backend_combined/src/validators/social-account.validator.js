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
  body('accessToken')
    .isString()
    .notEmpty()
    .withMessage('Access token is required'),
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string')
];

export const validateAccountSettings = [
  param('id')
    .isUUID()
    .withMessage('Invalid account ID'),
  body('settings')
    .isObject()
    .withMessage('Settings must be an object')
];