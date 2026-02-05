import express from 'express';
import {
  getInquiries,
  getInquiry,
  createInquiry,
  updateInquiryStatus,
  respondToInquiry,
  addInquiryNote,
  deleteInquiry,
  getInquiryStats,
} from '../controllers/inquiryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createInquiryValidator,
  respondToInquiryValidator,
} from '../validators/inquiryValidator.js';

const router = express.Router();

router.post('/', createInquiryValidator, validate, createInquiry);

router.get(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  getInquiries
);

router.get(
  '/stats/overview',
  protect,
  authorize('admin', 'superadmin'),
  getInquiryStats
);

router.get('/:id', protect, getInquiry);

router.put(
  '/:id/status',
  protect,
  authorize('admin', 'superadmin'),
  updateInquiryStatus
);

router.post(
  '/:id/respond',
  protect,
  authorize('admin', 'superadmin'),
  respondToInquiryValidator,
  validate,
  respondToInquiry
);

router.post(
  '/:id/notes',
  protect,
  authorize('admin', 'superadmin'),
  addInquiryNote
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteInquiry
);

export default router;