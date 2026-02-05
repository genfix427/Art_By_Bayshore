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
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/my-orders', getMyOrders);
router.get('/stats/overview', authorize('admin', 'superadmin'), getOrderStats);
router.get('/', authorize('admin', 'superadmin'), getOrders);
router.get('/:id', getOrder);

router.put('/:id/status', authorize('admin', 'superadmin'), updateOrderStatus);
router.post('/:id/ship', authorize('admin', 'superadmin'), createShipment);
router.post('/:id/update-tracking', authorize('admin', 'superadmin'), updateOrderTracking);
router.post('/:id/cancel', cancelOrder);

export default router;