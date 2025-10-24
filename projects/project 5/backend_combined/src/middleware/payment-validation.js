import { body, param } from 'express-validator';
import { validateRequest } from './validate-request.js';

export const validatePaymentCreation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('currency')
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Invalid currency code'),
  
  body('method')
    .isIn(['credit_card', 'bank_transfer', 'crypto'])
    .withMessage('Invalid payment method'),
  
  body('details')
    .isObject()
    .withMessage('Invalid payment details'),
  
  // Credit Card Validation
  body('details.cardNumber')
    .if(body('method').equals('credit_card'))
    .matches(/^\d{16}$/)
    .withMessage('Invalid card number'),
  
  body('details.expiryDate')
    .if(body('method').equals('credit_card'))
    .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)
    .withMessage('Invalid expiry date'),
  
  body('details.cvv')
    .if(body('method').equals('credit_card'))
    .matches(/^\d{3,4}$/)
    .withMessage('Invalid CVV'),
  
  // Bank Transfer Validation
  body('details.bankName')
    .if(body('method').equals('bank_transfer'))
    .notEmpty()
    .withMessage('Bank name is required'),
  
  body('details.accountHolder')
    .if(body('method').equals('bank_transfer'))
    .notEmpty()
    .withMessage('Account holder name is required'),
  
  body('details.iban')
    .if(body('method').equals('bank_transfer'))
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/)
    .withMessage('Invalid IBAN'),
  
  // Crypto Validation
  body('details.walletAddress')
    .if(body('method').equals('crypto'))
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address'),
  
  validateRequest
];

export const validateRefund = [
  param('id')
    .isUUID()
    .withMessage('Invalid payment ID'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  validateRequest
];

export const validateWebhook = [
  param('provider')
    .isIn(['stripe', 'paypal', 'crypto'])
    .withMessage('Invalid payment provider'),
  
  validateRequest
];