import { body } from 'express-validator';

export const createPaymentIntentValidator = [
  body('shippingCost')
    .notEmpty()
    .withMessage('Shipping cost is required')
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a positive number'),

  body('couponCode')
    .optional()
    .trim(),
];

export const confirmPaymentValidator = [
  body('paymentIntentId')
    .trim()
    .notEmpty()
    .withMessage('Payment intent ID is required'),

  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required'),

  body('shippingAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),

  body('shippingAddress.phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),

  body('shippingAddress.addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),

  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required'),

  body('shippingService')
    .trim()
    .notEmpty()
    .withMessage('Shipping service is required'),

  // Optional fields
  body('billingAddress')
    .optional(),

  body('couponCode')
    .optional()
    .trim(),

  body('shippingCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a positive number'),
];