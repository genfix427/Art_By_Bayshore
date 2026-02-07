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
    // Get unshipped orders that haven't been cleared
    const unshippedOrders = await Order.find({
      orderStatus: { $in: ['pending', 'confirmed'] },
      notificationCleared: false
    })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get new inquiries that haven't been read
    const newInquiries = await Inquiry.find({
      status: 'new',
      isRead: false
    })
      .populate('product', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get recent subscribers (last 24 hours) that haven't been cleared
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubscribers = await Subscriber.find({
      status: 'subscribed',
      createdAt: { $gte: twentyFourHoursAgo },
      notificationCleared: false
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

// @desc    Get sidebar notification counts
// @route   GET /api/v1/notifications/sidebar-counts
// @access  Private/Admin
export const getSidebarNotificationCounts = asyncHandler(async (req, res, next) => {
  try {
    // Unshipped orders that haven't been cleared
    const unshippedOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ['pending', 'confirmed'] },
      notificationCleared: false
    });

    // New inquiries that haven't been read
    const newInquiriesCount = await Inquiry.countDocuments({
      status: 'new',
      isRead: false
    });

    // Recent subscribers (last 24 hours) that haven't been cleared
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubscribersCount = await Subscriber.countDocuments({
      status: 'subscribed',
      createdAt: { $gte: twentyFourHoursAgo },
      notificationCleared: false
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

// @desc    Clear specific order notification
// @route   PUT /api/v1/notifications/orders/:id/clear
// @access  Private/Admin
export const clearOrderNotification = asyncHandler(async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse('Order not found', 404));
    }

    order.notificationCleared = true;
    order.notificationClearedAt = new Date();
    await order.save({ validateBeforeSave: false });

    logger.info(`Order ${order.orderNumber} notification cleared by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Order notification cleared',
      data: order,
    });
  } catch (error) {
    logger.error(`Clear order notification error: ${error.message}`);
    return next(new ErrorResponse('Failed to clear order notification', 500));
  }
});

// @desc    Clear all order notifications
// @route   PUT /api/v1/notifications/orders/clear
// @access  Private/Admin
export const clearOrderNotifications = asyncHandler(async (req, res, next) => {
  try {
    const result = await Order.updateMany(
      { 
        orderStatus: { $in: ['pending', 'confirmed'] },
        notificationCleared: false 
      },
      { 
        $set: { 
          notificationCleared: true,
          notificationClearedAt: new Date()
        } 
      }
    );

    logger.info(`All order notifications cleared by ${req.user.email}. Cleared: ${result.modifiedCount}`);

    res.status(200).json({
      success: true,
      message: 'Order notifications cleared',
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error(`Clear order notifications error: ${error.message}`);
    return next(new ErrorResponse('Failed to clear order notifications', 500));
  }
});

// @desc    Clear subscriber notifications
// @route   PUT /api/v1/notifications/subscribers/clear
// @access  Private/Admin
export const clearSubscriberNotifications = asyncHandler(async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await Subscriber.updateMany(
      {
        status: 'subscribed',
        createdAt: { $gte: twentyFourHoursAgo },
        notificationCleared: false
      },
      { 
        $set: { 
          notificationCleared: true,
          notificationClearedAt: new Date()
        } 
      }
    );

    logger.info(`All subscriber notifications cleared by ${req.user.email}. Cleared: ${result.modifiedCount}`);

    res.status(200).json({
      success: true,
      message: 'Subscriber notifications cleared',
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error(`Clear subscriber notifications error: ${error.message}`);
    return next(new ErrorResponse('Failed to clear subscriber notifications', 500));
  }
});

// @desc    Mark all notifications as viewed
// @route   PUT /api/v1/notifications/view-all
// @access  Private/Admin
export const markAllNotificationsAsViewed = asyncHandler(async (req, res, next) => {
  try {
    let orderResult = { modifiedCount: 0 };
    let inquiryResult = { modifiedCount: 0 };
    let subscriberResult = { modifiedCount: 0 };

    // Clear order notifications
    orderResult = await Order.updateMany(
      { 
        orderStatus: { $in: ['pending', 'confirmed'] },
        notificationCleared: false 
      },
      { 
        $set: { 
          notificationCleared: true,
          notificationClearedAt: new Date()
        } 
      }
    );

    // Mark all inquiries as read
    inquiryResult = await Inquiry.updateMany(
      { status: 'new', isRead: false },
      { $set: { isRead: true } }
    );

    // Clear subscriber notifications
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    subscriberResult = await Subscriber.updateMany(
      {
        status: 'subscribed',
        createdAt: { $gte: twentyFourHoursAgo },
        notificationCleared: false
      },
      { 
        $set: { 
          notificationCleared: true,
          notificationClearedAt: new Date()
        } 
      }
    );

    const totalCleared = orderResult.modifiedCount + inquiryResult.modifiedCount + subscriberResult.modifiedCount;

    logger.info(`All notifications marked as viewed by ${req.user.email}. Total cleared: ${totalCleared}`);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as viewed',
      data: {
        ordersCleared: orderResult.modifiedCount,
        inquiriesMarkedAsRead: inquiryResult.modifiedCount,
        subscribersCleared: subscriberResult.modifiedCount,
        totalCleared: totalCleared,
      },
    });
  } catch (error) {
    logger.error(`Mark all notifications as viewed error: ${error.message}`);
    return next(new ErrorResponse('Failed to mark all notifications as viewed', 500));
  }
});