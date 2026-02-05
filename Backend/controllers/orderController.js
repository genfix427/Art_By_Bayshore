import Order from '../models/Order.js';
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
  const order = await Order.findById(req.params.id).populate('items.product');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  if (order.fedexShipment.trackingNumber) {
    return next(new ErrorResponse('Shipment already created for this order', 400));
  }

  // Prepare from address (warehouse)
  const fromAddress = {
    fullName: process.env.COMPANY_NAME,
    phoneNumber: process.env.SUPPORT_PHONE || '1234567890',
    addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || '123 Art Street',
    city: process.env.WAREHOUSE_CITY || 'New York',
    state: process.env.WAREHOUSE_STATE || 'NY',
    zipCode: process.env.WAREHOUSE_ZIP || '10001',
    country: 'US',
  };

  // Prepare packages from order items
  const cartItems = order.items.map(item => ({
    quantity: item.quantity,
    price: item.price,
    dimensions: item.dimensions,
    weight: item.weight,
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

  const shipmentResult = await fedexService.createShipment(shipmentData);

  if (!shipmentResult.success) {
    return next(new ErrorResponse(shipmentResult.error || 'Failed to create shipment', 400));
  }

  // Update order with shipment details
  order.fedexShipment.trackingNumber = shipmentResult.trackingNumber;
  order.fedexShipment.masterId = shipmentResult.masterId;
  order.fedexShipment.labelUrl = shipmentResult.labelUrl;
  order.fedexShipment.serviceType = shipmentResult.serviceType;
  order.shippingStatus = 'label-created';
  order.orderStatus = 'shipped';

  order.statusHistory.push({
    status: 'shipped',
    timestamp: new Date(),
    updatedBy: req.user.id,
    note: `Shipment created. Tracking: ${shipmentResult.trackingNumber}`,
  });

  await order.save();

  // Send shipping confirmation email
  // await emailService.shippingConfirmationEmail(order);

  logger.info(`Shipment created for order ${order.orderNumber}. Tracking: ${shipmentResult.trackingNumber}`);

  res.status(200).json({
    success: true,
    message: 'Shipment created successfully',
    data: {
      trackingNumber: shipmentResult.trackingNumber,
      labelUrl: shipmentResult.labelUrl,
      order,
    },
  });
});

// @desc    Update order tracking
// @route   POST /api/v1/orders/:id/update-tracking
// @access  Private/Admin
export const updateOrderTracking = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  if (!order.fedexShipment.trackingNumber) {
    return next(new ErrorResponse('No tracking number found for this order', 400));
  }

  try {
    const trackingResult = await fedexService.trackShipment(order.fedexShipment.trackingNumber);

    if (!trackingResult.success) {
      // If in development and FedEx not configured, use mock data
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using mock tracking data in development mode');
        
        return res.status(200).json({
          success: true,
          data: {
            tracking: {
              trackingNumber: order.fedexShipment.trackingNumber,
              status: 'In Transit',
              events: [
                {
                  timestamp: new Date().toISOString(),
                  status: 'Label Created',
                  location: 'Origin',
                  description: 'Shipping label created',
                },
              ],
              mock: true,
            },
            order,
          },
        });
      }

      return next(new ErrorResponse(trackingResult.error || 'Failed to retrieve tracking', 400));
    }

    // Update order tracking history
    if (trackingResult.events) {
      order.trackingHistory = trackingResult.events.map(event => ({
        status: event.status,
        location: event.location,
        timestamp: new Date(event.timestamp),
        description: event.description,
      }));
    }

    // Update shipping status based on latest event
    const latestStatus = trackingResult.status?.toLowerCase() || '';
    
    if (latestStatus.includes('delivered')) {
      order.shippingStatus = 'delivered';
      order.orderStatus = 'delivered';
    } else if (latestStatus.includes('out for delivery')) {
      order.shippingStatus = 'out-for-delivery';
    } else if (latestStatus.includes('in transit')) {
      order.shippingStatus = 'in-transit';
    } else if (latestStatus.includes('picked up')) {
      order.shippingStatus = 'picked-up';
    }

    if (trackingResult.estimatedDelivery) {
      order.fedexShipment.estimatedDelivery = new Date(trackingResult.estimatedDelivery);
    }

    await order.save();

    logger.info(`Tracking updated for order ${order.orderNumber}`);

    res.status(200).json({
      success: true,
      data: {
        tracking: trackingResult,
        order,
      },
    });
  } catch (error) {
    logger.error(`Tracking update error for order ${order.orderNumber}:`, error);
    return next(new ErrorResponse(error.message || 'Failed to update tracking', 400));
  }
});

// @desc    Cancel order
// @route   POST /api/v1/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check authorization
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    if (order.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to cancel this order', 403));
    }

    // Users can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return next(new ErrorResponse('This order cannot be cancelled', 400));
    }
  }

  if (order.orderStatus === 'cancelled') {
    return next(new ErrorResponse('Order is already cancelled', 400));
  }

  // Cancel FedEx shipment if exists
  if (order.fedexShipment.trackingNumber) {
    await fedexService.cancelShipment(order.fedexShipment.trackingNumber);
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
    } catch (error) {
      logger.error(`Refund failed for order ${order.orderNumber}: ${error.message}`);
    }
  }

  order.orderStatus = 'cancelled';
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

  logger.info(`Order ${order.orderNumber} cancelled`);

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});

// @desc    Get order statistics
// @route   GET /api/v1/orders/stats/overview
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res, next) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
  const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });

  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
      },
    },
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10);

  const stats = {
    totalOrders,
    pendingOrders,
    shippedOrders,
    deliveredOrders,
    totalRevenue: revenueData[0]?.totalRevenue || 0,
    averageOrderValue: revenueData[0]?.averageOrderValue || 0,
    recentOrders,
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});