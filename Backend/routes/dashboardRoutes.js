import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  getNotificationCounts,
} from '../controllers/dashboardController.js';
import {
  getNotifications,
  markInquiryAsRead,
  markAllInquiriesAsRead,
  clearOrderNotification,
  clearSubscriberNotification,
  getSidebarNotificationCounts,
} from '../controllers/notificationController.js';

const router = express.Router();

// Dashboard routes
router.get('/stats', protect, authorize('admin', 'superadmin'), getDashboardStats);
router.get('/notification-counts', protect, authorize('admin', 'superadmin'), getNotificationCounts);

// Notification routes
router.get('/notifications', protect, authorize('admin', 'superadmin'), getNotifications);
router.get('/notifications/sidebar-counts', protect, authorize('admin', 'superadmin'), getSidebarNotificationCounts);
router.put('/notifications/inquiries/:id/read', protect, authorize('admin', 'superadmin'), markInquiryAsRead);
router.put('/notifications/inquiries/read-all', protect, authorize('admin', 'superadmin'), markAllInquiriesAsRead);
router.delete('/notifications/orders/:id/clear', protect, authorize('admin', 'superadmin'), clearOrderNotification);
router.delete('/notifications/subscribers/:id/clear', protect, authorize('admin', 'superadmin'), clearSubscriberNotification);

export default router;