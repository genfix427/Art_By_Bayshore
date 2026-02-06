// validators/productValidator.js
import { body, param } from 'express-validator';
import Artist from '../models/Artist.js';

export const createProductValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Product title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),

  body('artist')
    .notEmpty()
    .withMessage('Artist is required')
    .isMongoId()
    .withMessage('Invalid artist ID')
    .custom(async (value) => {
      const artist = await Artist.findById(value);
      if (!artist) {
        throw new Error('Artist not found');
      }
      return true;
    }),

  body('productType')
    .notEmpty()
    .withMessage('Product type is required')
    .isIn(['price-based', 'ask-for-price'])
    .withMessage('Invalid product type'),

  // Price validation with custom sanitizer
  body('price')
    .customSanitizer(value => {
      if (value === '' || value === null || value === undefined) return null;
      return parseFloat(value);
    })
    .custom((value, { req }) => {
      if (req.body.productType === 'price-based' && (!value || isNaN(value))) {
        throw new Error('Price is required for price-based products');
      }
      return true;
    })
    .if((value, { req }) => req.body.productType === 'price-based' && value !== null)
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  // Stock quantity validation
  body('stockQuantity')
    .customSanitizer(value => {
      if (value === '' || value === null || value === undefined) return 0;
      return parseInt(value, 10);
    })
    .custom((value, { req }) => {
      if (req.body.productType === 'price-based' && (value === null || value === undefined)) {
        throw new Error('Stock quantity is required');
      }
      return true;
    })
    .if((value, { req }) => req.body.productType === 'price-based' && value !== null)
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a positive number'),

  // Weight validation - handle stringified JSON or direct value
  // Weight validation - handle stringified JSON or direct value
body('weight')
  .customSanitizer(value => {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } catch {
      return {};
    }
  })
  .isObject()
  .withMessage('Weight must be an object')
  .custom((value) => {
    if (!value || typeof value !== 'object') {
      throw new Error('Weight is required');
    }
    if (!value.value || isNaN(value.value)) {
      throw new Error('Weight value is required and must be a number');
    }
    if (parseFloat(value.value) <= 0) {
      throw new Error('Weight must be a positive number');
    }
    return true;
  }),

  // Dimensions validation
  body('dimensions')
    .customSanitizer(value => {
      try {
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return value;
      } catch {
        return {};
      }
    })
    .isObject()
    .withMessage('Dimensions must be an object'),

  // Optional boolean fields
  body('isFramed')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('isFramed must be a boolean'),

  body('isOriginal')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('isOriginal must be a boolean'),

  body('isActive')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('isFeatured')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),

  // Optional string fields
  body('medium')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Medium cannot exceed 100 characters'),

  body('yearCreated')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1800 and ${new Date().getFullYear()}`),

  body('sku')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters'),

  body('lowStockThreshold')
    .optional()
    .toInt()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a positive number'),

  // SEO fields
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),

  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),

  body('metaKeywords')
    .optional()
    .customSanitizer(value => {
      try {
        if (typeof value === 'string') {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        }
        return value;
      } catch {
        return [];
      }
    })
    .isArray()
    .withMessage('Meta keywords must be an array'),

  body('tags')
    .optional()
    .customSanitizer(value => {
      try {
        if (typeof value === 'string') {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        }
        return value;
      } catch {
        return [];
      }
    })
    .isArray()
    .withMessage('Tags must be an array'),
];

export const updateProductValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  ...createProductValidator,
];