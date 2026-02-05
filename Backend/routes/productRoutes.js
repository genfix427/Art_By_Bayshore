import express from 'express';
import {
  getProducts,
  getProduct,
  getProductBySlug,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
  getFeaturedProducts,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { createProductValidator, updateProductValidator } from '../validators/productValidator.js';
import upload from '../config/upload.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured/list', getFeaturedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProduct);
router.get('/:id/related', getRelatedProducts);

router.post(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  upload.array('images', 10),
  createProductValidator,
  validate,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  upload.array('images', 10),
  updateProductValidator,
  validate,
  updateProduct
);

router.delete(
  '/:id/images/:imageId',
  protect,
  authorize('admin', 'superadmin'),
  deleteProductImage
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteProduct
);

export default router;