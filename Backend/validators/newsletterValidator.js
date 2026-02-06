import { body, param } from 'express-validator';

export const subscribeValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
];

export const addSubscriberValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('source')
    .optional()
    .trim(),
];

export const bulkAddSubscribersValidator = [
  body('subscribers')
    .notEmpty()
    .withMessage('Subscribers array is required')
    .isArray()
    .withMessage('Subscribers must be an array')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('Subscribers array cannot be empty');
      }
      if (value.length > 1000) {
        throw new Error('Cannot add more than 1000 subscribers at once');
      }
      return true;
    }),
];

export const createCampaignValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required'),

  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Email subject is required'),

  body('content.html')
    .trim()
    .notEmpty()
    .withMessage('Email content is required'),

  body('recipients')
    .notEmpty()
    .withMessage('Recipients type is required')
    .isIn(['all', 'subscribed', 'tags', 'custom'])
    .withMessage('Invalid recipients type'),
];