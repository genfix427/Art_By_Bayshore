import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import { Subscriber } from '../models/Newsletter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

// @desc    Get all notifications for admin
// @route   GET /api/v1/notifications
// @access  Private/Admin
export const getNotifications = asyncHandler(async (req, res, next) => {
  try {
    // Get unshipped orders (pending or confirmed)
    const unshippedOrders = await Order.find({
      orderStatus: { $in: ['pending', 'confirmed'] }
    })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get new inquiries (unread)
    const newInquiries = await Inquiry.find({
      status: 'new',
      isRead: false
    })
      .populate('product', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get recent subscribers (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubscribers = await Subscriber.find({
      status: 'subscribed',
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const notifications = {
      unshippedOrders: unshippedOrders.map(order => ({
        type: 'order',
        id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest',
        customerEmail: order.user?.email || order.shippingAddress?.email,
        status: order.orderStatus,
        total: order.total,
        createdAt: order.createdAt,
        priority: order.priority || 'medium',
      })),
      newInquiries: newInquiries.map(inquiry => ({
        type: 'inquiry',
        id: inquiry._id,
        inquiryNumber: inquiry.inquiryNumber,
        customerName: inquiry.customerInfo ? 
          `${inquiry.customerInfo.firstName} ${inquiry.customerInfo.lastName}` : 'Customer',
        customerEmail: inquiry.customerInfo?.email,
        product: inquiry.product?.title || 'Product',
        message: inquiry.message,
        createdAt: inquiry.createdAt,
        priority: inquiry.priority || 'medium',
      })),
      recentSubscribers: recentSubscribers.map(subscriber => ({
        type: 'subscriber',
        id: subscriber._id,
        email: subscriber.email,
        name: subscriber.firstName ? `${subscriber.firstName} ${subscriber.lastName}` : 'Subscriber',
        source: subscriber.source,
        createdAt: subscriber.createdAt,
      })),
    };

    // Counts for badge display
    const counts = {
      orders: unshippedOrders.length,
      inquiries: newInquiries.length,
      subscribers: recentSubscribers.length,
      total: unshippedOrders.length + newInquiries.length + recentSubscribers.length,
    };

    res.status(200).json({
      success: true,
      data: {
        notifications,
        counts,
      },
    });
  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    return next(new ErrorResponse('Failed to fetch notifications', 500));
  }
});

// @desc    Mark inquiry as read
// @route   PUT /api/v1/notifications/inquiries/:id/read
// @access  Private/Admin
export const markInquiryAsRead = asyncHandler(async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return next(new ErrorResponse('Inquiry not found', 404));
    }

    inquiry.isRead = true;
    await inquiry.save({ validateBeforeSave: false });

    logger.info(`Inquiry ${inquiry.inquiryNumber} marked as read by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry marked as read',
      data: inquiry,
    });
  } catch (error) {
    logger.error(`Mark inquiry as read error: ${error.message}`);
    return next(new ErrorResponse('Failed to mark inquiry as read', 500));
  }
});

// @desc    Mark all inquiries as read
// @route   PUT /api/v1/notifications/inquiries/read-all
// @access  Private/Admin
export const markAllInquiriesAsRead = asyncHandler(async (req, res, next) => {
  try {
    const result = await Inquiry.updateMany(
      { status: 'new', isRead: false },
      { $set: { isRead: true } }
    );

    logger.info(`All inquiries marked as read by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'All inquiries marked as read',
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error(`Mark all inquiries as read error: ${error.message}`);
    return next(new ErrorResponse('Failed to mark all inquiries as read', 500));
  }
});

// @desc    Clear order notification (when order is shipped)
// @route   DELETE /api/v1/notifications/orders/:id/clear
// @access  Private/Admin
export const clearOrderNotification = asyncHandler(async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    // Only clear notification if order is shipped or delivered
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      logger.info(`Order ${order.orderNumber} notification cleared by ${req.user.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Order notification cleared',
        data: order,
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Order is not shipped yet',
        data: order,
      });
    }
  } catch (error) {
    logger.error(`Clear order notification error: ${error.message}`);
    return next(new ErrorResponse('Failed to clear order notification', 500));
  }
});

// @desc    Clear subscriber notification (when viewed)
// @route   DELETE /api/v1/notifications/subscribers/:id/clear
// @access  Private/Admin
export const clearSubscriberNotification = asyncHandler(async (req, res, next) => {
  try {
    // This is a soft clear - we just acknowledge that the admin has seen it
    // No actual modification needed to the subscriber record
    
    logger.info(`Subscriber notification cleared by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Subscriber notification cleared',
    });
  } catch (error) {
    logger.error(`Clear subscriber notification error: ${error.message}`);
    return next(new ErrorResponse('Failed to clear subscriber notification', 500));
  }
});

// @desc    Get sidebar notification counts
// @route   GET /api/v1/notifications/sidebar-counts
// @access  Private/Admin
export const getSidebarNotificationCounts = asyncHandler(async (req, res, next) => {
  try {
    // Unshipped orders count (for Orders sidebar)
    const unshippedOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ['pending', 'confirmed'] }
    });

    // New inquiries count (for Inquiries sidebar)
    const newInquiriesCount = await Inquiry.countDocuments({
      status: 'new',
      isRead: false
    });

    // Recent subscribers count (for Newsletter sidebar)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubscribersCount = await Subscriber.countDocuments({
      status: 'subscribed',
      createdAt: { $gte: twentyFourHoursAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        orders: unshippedOrdersCount,
        inquiries: newInquiriesCount,
        newsletter: recentSubscribersCount,
      },
    });
  } catch (error) {
    logger.error(`Sidebar notification counts error: ${error.message}`);
    return next(new ErrorResponse('Failed to fetch sidebar notification counts', 500));
  }
});