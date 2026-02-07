import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getNotifications,
  getSidebarNotificationCounts,
  markInquiryAsRead,
  markAllInquiriesAsRead,
  clearOrderNotification,
  clearOrderNotifications,
  clearSubscriberNotifications, // Note the 's' at the end
  markAllNotificationsAsViewed,
} from '../controllers/notificationController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Get all notifications
router.get('/', getNotifications);

// Get sidebar notification counts
router.get('/sidebar-counts', getSidebarNotificationCounts);

// Mark inquiry as read
router.put('/inquiries/:id/read', markInquiryAsRead);

// Mark all inquiries as read
router.put('/inquiries/read-all', markAllInquiriesAsRead);

// Clear specific order notification
router.put('/orders/:id/clear', clearOrderNotification);

// Clear all order notifications
router.put('/orders/clear', clearOrderNotifications);

// Clear subscriber notifications - FIXED NAME
router.put('/subscribers/clear', clearSubscriberNotifications);

// Mark all notifications as viewed
router.put('/view-all', markAllNotificationsAsViewed);

export default router;