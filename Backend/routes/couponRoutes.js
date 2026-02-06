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

// ✅ FIXED: Wrap validators in validate()
router.post('/validate', validate(validateCouponValidator), validateCoupon);

router.get('/', protect, authorize('admin', 'superadmin'), getCoupons);
router.get('/:id/stats', protect, authorize('admin', 'superadmin'), getCouponStats); // ⚠️ Move before /:id
router.get('/:id', protect, authorize('admin', 'superadmin'), getCoupon);

// ✅ FIXED
router.post(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  validate(createCouponValidator),
  createCoupon
);

// ✅ FIXED
router.put(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  validate(updateCouponValidator),
  updateCoupon
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteCoupon
);

export default router;