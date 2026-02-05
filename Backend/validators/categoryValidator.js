// validators/categoryValidator.js
import { body, param } from 'express-validator';
import Category from '../models/Category.js';

export const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID')
    .custom(async (value, { req }) => {
      if (!value) return true;
      if (value === 'null' || value === 'undefined' || value === '') return true;
      
      const category = await Category.findById(value);
      if (!category) {
        throw new Error('Parent category not found');
      }
      return true;
    }),
  
  body('isActive')
    .optional()
    .toBoolean()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('displayOrder')
    .optional()
    .toInt()
    .isInt({ min: 0 })
    .withMessage('Display order must be a positive number'),
  
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
      if (!value) return [];
      try {
        // If it's already a stringified array, parse it
        if (typeof value === 'string' && value.startsWith('[')) {
          return JSON.parse(value);
        }
        // If it's a comma-separated string, convert to array
        if (typeof value === 'string') {
          return value.split(',').map(k => k.trim()).filter(k => k);
        }
        return value;
      } catch (error) {
        return [];
      }
    })
    .isArray()
    .withMessage('Meta keywords must be an array')
    .custom(value => {
      if (value.length > 10) {
        throw new Error('Cannot have more than 10 meta keywords');
      }
      return true;
    })
];

export const updateCategoryValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  ...createCategoryValidator,
];