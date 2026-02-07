import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  getNotificationCounts,
} from '../controllers/dashboardController.js';

const router = express.Router();

// Dashboard routes
router.get('/stats', protect, authorize('admin', 'superadmin'), getDashboardStats);
router.get('/notification-counts', protect, authorize('admin', 'superadmin'), getNotificationCounts);

export default router;