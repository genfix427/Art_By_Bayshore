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

// ✅ Public route for creating inquiries
router.post('/', validate(createInquiryValidator), createInquiry);

// ✅ Add a debug route to test
router.post('/test', (req, res) => {
  console.log('Test route hit');
  console.log('Body:', req.body);
  res.json({ message: 'Test route working', body: req.body });
});

// ✅ Stats route
router.get(
  '/stats/overview',
  protect,
  authorize('admin', 'superadmin'),
  getInquiryStats
);

// ✅ Protected admin routes
router.get(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  getInquiries
);

// This route should be LAST to avoid conflicts
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
  validate(respondToInquiryValidator),
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