import { body } from 'express-validator';

export const validateDeposit = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('method')
    .isIn(['bank_transfer', 'credit_card', 'crypto'])
    .withMessage('Invalid payment method'),
  body('details')
    .isObject()
    .withMessage('Invalid details'),
  body('details.bankName')
    .if(body('method').equals('bank_transfer'))
    .notEmpty()
    .withMessage('Bank name is required for bank transfers'),
  body('details.accountHolder')
    .if(body('method').equals('bank_transfer'))
    .notEmpty()
    .withMessage('Account holder name is required for bank transfers'),
  body('details.cardNumber')
    .if(body('method').equals('credit_card'))
    .matches(/^[0-9]{16}$/)
    .withMessage('Invalid card number'),
  body('details.walletAddress')
    .if(body('method').equals('crypto'))
    .notEmpty()
    .withMessage('Wallet address is required for crypto transactions')
];

export const validateWithdrawal = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('method')
    .isIn(['bank_transfer', 'crypto'])
    .withMessage('Invalid withdrawal method'),
  body('details')
    .isObject()
    .withMessage('Invalid details'),
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
    .notEmpty()
    .withMessage('IBAN is required'),
  body('details.walletAddress')
    .if(body('method').equals('crypto'))
    .notEmpty()
    .withMessage('Wallet address is required')
];