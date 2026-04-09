import express from 'express';
import {
  getOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  createShipment,
  updateOrderTracking,
  cancelOrder,
  getOrderStats,
  resendOrderConfirmation,
  downloadLabel,
  viewLabel, // Add this
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Customer routes
router.get('/my-orders', getMyOrders);

// Admin routes
router.get('/stats/overview', authorize('admin', 'superadmin'), getOrderStats);
router.get('/', authorize('admin', 'superadmin'), getOrders);

// Order specific routes
router.get('/:id', getOrder);
router.get('/:id/download-label', authorize('admin', 'superadmin'), downloadLabel);
router.get('/:id/view-label', authorize('admin', 'superadmin'), viewLabel); // Add this
router.put('/:id/status', authorize('admin', 'superadmin'), updateOrderStatus);
router.post('/:id/ship', authorize('admin', 'superadmin'), createShipment);
router.post('/:id/update-tracking', authorize('admin', 'superadmin'), updateOrderTracking);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/resend-confirmation', authorize('admin', 'superadmin'), resendOrderConfirmation);

export default router;