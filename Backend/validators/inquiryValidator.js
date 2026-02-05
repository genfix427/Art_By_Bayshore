import { body, param } from 'express-validator';

export const createInquiryValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('phoneNumber')
    .optional()
    .trim(),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
];

export const respondToInquiryValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid inquiry ID'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Response message is required'),

  body('quotedPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quoted price must be a positive number'),
];