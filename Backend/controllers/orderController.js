import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import fedexService from '../config/fedex.js';
import emailService from '../config/sendgrid.js';
import stripe from '../config/stripe.js';
import logger from '../utils/logger.js';

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res, next) => {
  const { page, limit, orderStatus, paymentStatus, search } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};
  if (orderStatus) query.orderStatus = orderStatus;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'fedexShipment.trackingNumber': { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get user orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res, next) => {
  const { page, limit } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = { user: req.user.id };
  const total = await Order.countDocuments(query);
  
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phoneNumber')
    .populate('items.product', 'title images artist category');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check authorization
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    if (order.user._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to access this order', 403));
    }
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderStatus, adminNote } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  const previousStatus = order.orderStatus;
  order.orderStatus = orderStatus;

  if (adminNote) {
    order.notes.admin = adminNote;
  }

  order.statusHistory.push({
    status: orderStatus,
    timestamp: new Date(),
    updatedBy: req.user.id,
    note: adminNote,
  });

  await order.save();

  // Send status update email if status changed significantly
  if (previousStatus !== orderStatus && ['shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
    try {
      const user = await User.findById(order.user);
      if (user) {
        if (orderStatus === 'cancelled') {
          await emailService.orderCancellationEmail(order, user);
          order.emailsSent.push({
            type: 'cancellation',
            sentAt: new Date(),
            success: true,
          });
          await order.save();
        }
      }
    } catch (emailError) {
      logger.error(`Failed to send status update email for order ${order.orderNumber}: ${emailError.message}`);
    }
  }

  logger.info(`Order ${order.orderNumber} status updated to ${orderStatus} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
});

// @desc    Create FedEx shipment for order
// @route   POST /api/v1/orders/:id/ship
// @access  Private/Admin
export const createShipment = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product')
    .populate('user', 'firstName lastName email phoneNumber');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  if (order.fedexShipment.trackingNumber) {
    return next(new ErrorResponse('Shipment already created for this order', 400));
  }

  if (order.orderStatus === 'cancelled') {
    return next(new ErrorResponse('Cannot create shipment for cancelled order', 400));
  }

  if (order.paymentStatus !== 'paid') {
    return next(new ErrorResponse('Cannot create shipment for unpaid order', 400));
  }

  // Prepare from address (warehouse)
  const fromAddress = {
    fullName: process.env.COMPANY_NAME || 'Art By Bayshore',
    phoneNumber: process.env.SUPPORT_PHONE || '1234567890',
    addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || '1717 N Bayshore Dr 121',
    city: process.env.WAREHOUSE_CITY || 'Miami',
    state: process.env.WAREHOUSE_STATE || 'FL',
    zipCode: process.env.WAREHOUSE_ZIP || '33132',
    country: 'US',
  };

  // Prepare packages from order items
  const cartItems = order.items.map(item => ({
    quantity: item.quantity,
    price: item.price,
    dimensions: item.dimensions || { length: 24, width: 24, height: 4, unit: 'in' },
    weight: item.weight || { value: 5, unit: 'lb' },
  }));

  const packages = fedexService.calculatePackageDimensions(cartItems);

  const shipmentData = {
    fromAddress,
    toAddress: order.shippingAddress,
    packages,
    serviceType: order.fedexShipment.serviceType || 'FEDEX_GROUND',
    shipDate: new Date().toISOString().split('T')[0],
    reference: order.orderNumber,
  };

  let shipmentResult;

  try {
    shipmentResult = await fedexService.createShipment(shipmentData);
  } catch (error) {
    logger.error(`FedEx shipment creation error for order ${order.orderNumber}: ${error.message}`);
    
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Using mock shipment data in development mode');
      shipmentResult = {
        success: true,
        trackingNumber: `MOCK${Date.now()}`,
        masterId: `MASTER${Date.now()}`,
        labelUrl: 'https://example.com/mock-label.pdf',
        serviceType: order.fedexShipment.serviceType || 'FEDEX_GROUND',
        mock: true,
      };
    } else {
      return next(new ErrorResponse(error.message || 'Failed to create shipment', 400));
    }
  }

  if (!shipmentResult.success) {
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Using mock shipment data in development mode');
      shipmentResult = {
        success: true,
        trackingNumber: `MOCK${Date.now()}`,
        masterId: `MASTER${Date.now()}`,
        labelUrl: 'https://example.com/mock-label.pdf',
        serviceType: order.fedexShipment.serviceType || 'FEDEX_GROUND',
        mock: true,
      };
    } else {
      return next(new ErrorResponse(shipmentResult.error || 'Failed to create shipment', 400));
    }
  }

  // Update order with shipment details
  order.fedexShipment.trackingNumber = shipmentResult.trackingNumber;
  order.fedexShipment.masterId = shipmentResult.masterId;
  order.fedexShipment.labelUrl = shipmentResult.labelUrl;
  order.fedexShipment.serviceType = shipmentResult.serviceType;
  order.fedexShipment.estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
  order.shippingStatus = 'label-created';
  order.orderStatus = 'shipped';

  order.statusHistory.push({
    status: 'shipped',
    timestamp: new Date(),
    updatedBy: req.user.id,
    note: `Shipment created. Tracking: ${shipmentResult.trackingNumber}`,
  });

  await order.save();

  logger.info(`Shipment created for order ${order.orderNumber}. Tracking: ${shipmentResult.trackingNumber}`);

  // Send shipping confirmation email
  try {
    const user = await User.findById(order.user._id || order.user);
    
    if (user) {
      const emailResult = await emailService.shippingConfirmationEmail(order, user);
      
      order.emailsSent.push({
        type: 'shipping',
        sentAt: new Date(),
        success: emailResult.success,
      });
      await order.save();

      if (emailResult.success) {
        logger.info(`Shipping confirmation email sent for order: ${order.orderNumber}`);
      } else {
        logger.warn(`Failed to send shipping email for order ${order.orderNumber}: ${emailResult.error}`);
      }
    }
  } catch (emailError) {
    logger.error(`Email error for order ${order.orderNumber}: ${emailError.message}`);
    // Don't fail the shipment creation if email fails
  }

  // Also notify owner about shipment
  try {
    await emailService.ownerShipmentNotification(order);
  } catch (ownerEmailError) {
    logger.error(`Owner notification error for order ${order.orderNumber}: ${ownerEmailError.message}`);
  }

  res.status(200).json({
    success: true,
    message: 'Shipment created successfully',
    data: {
      trackingNumber: shipmentResult.trackingNumber,
      labelUrl: shipmentResult.labelUrl,
      estimatedDelivery: order.fedexShipment.estimatedDelivery,
      order,
      mock: shipmentResult.mock || false,
    },
  });
});

// @desc    Update order tracking
// @route   POST /api/v1/orders/:id/update-tracking
// @access  Private/Admin
export const updateOrderTracking = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phoneNumber');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  if (!order.fedexShipment.trackingNumber) {
    return next(new ErrorResponse('No tracking number found for this order', 400));
  }

  const previousShippingStatus = order.shippingStatus;
  const previousOrderStatus = order.orderStatus;

  let trackingResult;

  try {
    trackingResult = await fedexService.trackShipment(order.fedexShipment.trackingNumber);
  } catch (error) {
    logger.error(`Tracking API error for order ${order.orderNumber}: ${error.message}`);
    trackingResult = { success: false, error: error.message };
  }

  if (!trackingResult.success) {
    // If in development and FedEx not configured, use mock data
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Using mock tracking data in development mode');
      
      // Simulate tracking progression
      const mockStatuses = ['label-created', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered'];
      const currentIndex = mockStatuses.indexOf(order.shippingStatus);
      const nextIndex = Math.min(currentIndex + 1, mockStatuses.length - 1);
      const newStatus = mockStatuses[nextIndex];

      trackingResult = {
        success: true,
        trackingNumber: order.fedexShipment.trackingNumber,
        status: newStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        events: [
          {
            timestamp: new Date().toISOString(),
            status: newStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            location: 'Miami, FL',
            description: `Package ${newStatus.replace(/-/g, ' ')}`,
          },
          ...(order.trackingHistory || []).map(h => ({
            timestamp: h.timestamp,
            status: h.status,
            location: h.location,
            description: h.description,
          })),
        ],
        mock: true,
      };
    } else {
      return next(new ErrorResponse(trackingResult.error || 'Failed to retrieve tracking', 400));
    }
  }

  // Update order tracking history
  if (trackingResult.events && trackingResult.events.length > 0) {
    order.trackingHistory = trackingResult.events.map(event => ({
      status: event.status,
      location: event.location,
      timestamp: new Date(event.timestamp),
      description: event.description,
    }));
  }

  // Update shipping status based on latest event
  const latestStatus = (trackingResult.status || '').toLowerCase();
  
  if (latestStatus.includes('delivered')) {
    order.shippingStatus = 'delivered';
    order.orderStatus = 'delivered';
  } else if (latestStatus.includes('out for delivery') || latestStatus.includes('out-for-delivery')) {
    order.shippingStatus = 'out-for-delivery';
  } else if (latestStatus.includes('in transit') || latestStatus.includes('in-transit')) {
    order.shippingStatus = 'in-transit';
  } else if (latestStatus.includes('picked up') || latestStatus.includes('picked-up')) {
    order.shippingStatus = 'picked-up';
  } else if (latestStatus.includes('exception')) {
    order.shippingStatus = 'exception';
  }

  if (trackingResult.estimatedDelivery) {
    order.fedexShipment.estimatedDelivery = new Date(trackingResult.estimatedDelivery);
  }

  // Add to status history if status changed
  if (order.shippingStatus !== previousShippingStatus) {
    order.statusHistory.push({
      status: order.shippingStatus,
      timestamp: new Date(),
      updatedBy: req.user.id,
      note: `Tracking updated: ${trackingResult.status}`,
    });
  }

  await order.save();

  logger.info(`Tracking updated for order ${order.orderNumber}: ${order.shippingStatus}`);

  // Send delivery confirmation email if just delivered
  if (order.shippingStatus === 'delivered' && previousShippingStatus !== 'delivered') {
    try {
      const user = order.user._id ? order.user : await User.findById(order.user);
      
      if (user && user.email) {
        // Check if delivery email was already sent
        const alreadySent = order.emailsSent.some(
          e => e.type === 'delivery' && e.success
        );
        
        if (!alreadySent) {
          const emailResult = await emailService.deliveryConfirmationEmail(order, user);
          
          order.emailsSent.push({
            type: 'delivery',
            sentAt: new Date(),
            success: emailResult.success,
          });
          await order.save();
          
          if (emailResult.success) {
            logger.info(`Delivery confirmation email sent for order: ${order.orderNumber}`);
          } else {
            logger.warn(`Failed to send delivery email for order ${order.orderNumber}: ${emailResult.error}`);
          }
        }
      }
    } catch (emailError) {
      logger.error(`Delivery email error for order ${order.orderNumber}: ${emailError.message}`);
      // Don't fail the tracking update if email fails
    }

    // Notify owner about delivery
    try {
      await emailService.ownerDeliveryNotification(order);
    } catch (ownerEmailError) {
      logger.error(`Owner delivery notification error for order ${order.orderNumber}: ${ownerEmailError.message}`);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Tracking updated successfully',
    data: {
      tracking: trackingResult,
      order,
    },
  });
});

// @desc    Cancel order
// @route   POST /api/v1/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check authorization
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    if (order.user._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to cancel this order', 403));
    }

    // Users can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return next(new ErrorResponse('This order cannot be cancelled. Please contact support.', 400));
    }
  }

  if (order.orderStatus === 'cancelled') {
    return next(new ErrorResponse('Order is already cancelled', 400));
  }

  if (order.orderStatus === 'delivered') {
    return next(new ErrorResponse('Delivered orders cannot be cancelled. Please request a return instead.', 400));
  }

  // Cancel FedEx shipment if exists
  if (order.fedexShipment.trackingNumber) {
    try {
      await fedexService.cancelShipment(order.fedexShipment.trackingNumber);
      logger.info(`FedEx shipment cancelled for order ${order.orderNumber}`);
    } catch (fedexError) {
      logger.error(`Failed to cancel FedEx shipment for order ${order.orderNumber}: ${fedexError.message}`);
      // Continue with order cancellation even if FedEx cancellation fails
    }
  }

  // Refund payment if already paid
  if (order.paymentStatus === 'paid' && order.paymentIntentId) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        reason: 'requested_by_customer',
      });

      order.paymentStatus = 'refunded';
      order.refundDetails = {
        amount: refund.amount / 100,
        reason: req.body.reason || 'Customer requested cancellation',
        refundedAt: new Date(),
        refundId: refund.id,
      };

      logger.info(`Refund processed for order ${order.orderNumber}: ${refund.id}`);
    } catch (refundError) {
      logger.error(`Refund failed for order ${order.orderNumber}: ${refundError.message}`);
      // Mark as needing manual refund
      order.notes.admin = `${order.notes.admin || ''}\nAUTO-REFUND FAILED: ${refundError.message}. Manual refund required.`;
    }
  }

  order.orderStatus = 'cancelled';
  order.shippingStatus = 'cancelled';
  
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    updatedBy: req.user.id,
    note: req.body.reason || 'Order cancelled',
  });

  await order.save();

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 
        stockQuantity: item.quantity,
        salesCount: -item.quantity,
      },
    });
  }

  logger.info(`Order ${order.orderNumber} cancelled by ${req.user.email}`);

  // Send cancellation email
  try {
    const user = order.user._id ? order.user : await User.findById(order.user);
    
    if (user && user.email) {
      const emailResult = await emailService.orderCancellationEmail(order, user);
      
      order.emailsSent.push({
        type: 'cancellation',
        sentAt: new Date(),
        success: emailResult.success,
      });
      await order.save();

      if (emailResult.success) {
        logger.info(`Cancellation email sent for order: ${order.orderNumber}`);
      }
    }
  } catch (emailError) {
    logger.error(`Cancellation email error for order ${order.orderNumber}: ${emailError.message}`);
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});

// @desc    Resend order confirmation email
// @route   POST /api/v1/orders/:id/resend-confirmation
// @access  Private/Admin
export const resendOrderConfirmation = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phoneNumber');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  const user = order.user._id ? order.user : await User.findById(order.user);

  if (!user || !user.email) {
    return next(new ErrorResponse('User email not found', 400));
  }

  try {
    const emailResult = await emailService.sendOrderEmails(order, user);

    order.emailsSent.push({
      type: 'confirmation',
      sentAt: new Date(),
      success: emailResult.customerEmail?.success || false,
    });
    await order.save();

    if (emailResult.success) {
      logger.info(`Order confirmation email resent for order: ${order.orderNumber}`);
      res.status(200).json({
        success: true,
        message: 'Order confirmation email sent successfully',
      });
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }
  } catch (error) {
    logger.error(`Failed to resend confirmation email for order ${order.orderNumber}: ${error.message}`);
    return next(new ErrorResponse('Failed to send email', 500));
  }
});

// @desc    Get order statistics
// @route   GET /api/v1/orders/stats/overview
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res, next) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const confirmedOrders = await Order.countDocuments({ orderStatus: 'confirmed' });
  const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
  const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
  const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });

  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  // Revenue by month (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        orderStatus: { $ne: 'cancelled' },
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10);

  const stats = {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue: revenueData[0]?.totalRevenue || 0,
    averageOrderValue: revenueData[0]?.averageOrderValue || 0,
    paidOrders: revenueData[0]?.totalOrders || 0,
    monthlyRevenue,
    recentOrders,
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});