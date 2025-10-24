import { body } from 'express-validator';

export const validateDispute = [
  body('type')
    .isIn(['order_issue', 'payment_issue', 'technical_issue', 'other'])
    .withMessage('Invalid dispute type'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('orderId')
    .isUUID()
    .withMessage('Invalid order ID')
];

export const validateDisputeUpdate = [
  body('status')
    .optional()
    .isIn(['open', 'under_review', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  
  body('resolution')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Resolution cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Resolution cannot exceed 2000 characters')
];