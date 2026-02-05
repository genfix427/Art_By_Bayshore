import { body, param } from 'express-validator';

export const createCouponValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ max: 50 })
    .withMessage('Code cannot exceed 50 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Code can only contain uppercase letters, numbers, hyphens and underscores'),

  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['fixed', 'percentage'])
    .withMessage('Discount type must be either fixed or percentage'),

  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),

  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Invalid expiry date format'),

  body('minimumPurchase')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase must be a positive number'),

  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),
];

export const updateCouponValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid coupon ID'),
  
  ...createCouponValidator,
];

export const validateCouponValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),

  body('subtotal')
    .notEmpty()
    .withMessage('Subtotal is required')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
];