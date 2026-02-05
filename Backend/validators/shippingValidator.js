import { body } from 'express-validator';

export const validateAddressValidator = [
  body('addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 2 })
    .withMessage('State must be 2 characters')
    .toUpperCase(),

  body('zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),

  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country must be 2 characters')
    .toUpperCase(),

  body('addressLine2')
    .optional()
    .trim(),
];

export const calculateRatesValidator = [
  body('toAddress')
    .notEmpty()
    .withMessage('Destination address is required'),

  body('toAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),

  body('toAddress.phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),

  body('toAddress.addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required'),

  body('toAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('toAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  body('toAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required'),

  body('toAddress.country')
    .optional()
    .trim(),

  body('toAddress.addressLine2')
    .optional()
    .trim(),

  body('toAddress.residential')
    .optional()
    .isBoolean()
    .withMessage('Residential must be a boolean'),
];