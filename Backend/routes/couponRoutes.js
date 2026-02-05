import express from 'express';
import {
  getCoupons,
  getCoupon,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats,
} from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createCouponValidator,
  updateCouponValidator,
  validateCouponValidator,
} from '../validators/couponValidator.js';

const router = express.Router();

router.post('/validate', validateCouponValidator, validate, validateCoupon);

router.get('/', protect, authorize('admin', 'superadmin'), getCoupons);
router.get('/:id', protect, authorize('admin', 'superadmin'), getCoupon);
router.get('/:id/stats', protect, authorize('admin', 'superadmin'), getCouponStats);

router.post(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  createCouponValidator,
  validate,
  createCoupon
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  updateCouponValidator,
  validate,
  updateCoupon
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteCoupon
);

export default router;