import { body, validationResult } from 'express-validator';

export const validateRegistration = (data) => {
  const rules = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
  ];

  const errors = validationResult(data);
  return errors.isEmpty() ? null : errors.array();
};

export const validateLogin = (data) => {
  const rules = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').exists().withMessage('Password is required')
  ];

  const errors = validationResult(data);
  return errors.isEmpty() ? null : errors.array();
};