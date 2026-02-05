import express from 'express';
import {
  getCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { createCategoryValidator, updateCategoryValidator } from '../validators/categoryValidator.js';
import upload from '../config/upload.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

router.post(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  upload.single('image'),
  createCategoryValidator,
  validate,
  createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  upload.single('image'),
  updateCategoryValidator,
  validate,
  updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteCategory
);

export default router;