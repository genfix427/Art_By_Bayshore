// validators/wishlistValidator.js
import { body, param } from 'express-validator';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

export const addToWishlistValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID')
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product ID format');
      }
      
      const product = await Product.findById(value);
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (!product.isActive) {
        throw new Error('Product is not active');
      }
      
      return true;
    }),
];

export const wishlistIdValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID')
];