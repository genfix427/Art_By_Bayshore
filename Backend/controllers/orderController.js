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

  if (order.fedexShipment?.trackingNumber) {
    return next(new ErrorResponse('Shipment already created for this order', 400));
  }

  if (order.orderStatus === 'cancelled') {
    return next(new ErrorResponse('Cannot create shipment for cancelled order', 400));
  }

  if (order.paymentStatus !== 'paid') {
    return next(new ErrorResponse('Cannot create shipment for unpaid order', 400));
  }

  // ===================================
  // STEP 1: Validate Shipping Address
  // ===================================
  logger.info('Validating shipping address before creating shipment...', {
    orderId: order._id,
    orderNumber: order.orderNumber,
  });

  const addressValidation = await fedexService.validateAddress({
    addressLine1: order.shippingAddress.addressLine1,
    addressLine2: order.shippingAddress.addressLine2,
    city: order.shippingAddress.city,
    state: order.shippingAddress.state,
    zipCode: order.shippingAddress.zipCode,
    country: order.shippingAddress.country || 'US',
  });

  // Block invalid addresses - admin must fix address first
  if (!addressValidation.isValid) {
    logger.error('Shipping address validation failed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      error: addressValidation.error,
      address: order.shippingAddress,
    });

    return next(
      new ErrorResponse(
        `Shipping address is invalid: ${addressValidation.error}. Please update the order address before creating shipment.`,
        400
      )
    );
  }

  logger.info('Shipping address validated successfully', {
    orderId: order._id,
    classification: addressValidation.classification,
  });

  // ===================================
  // STEP 2: Prepare Shipment Data
  // ===================================

  // Prepare from address (warehouse)
  const fromAddress = {
    fullName: process.env.COMPANY_NAME || 'Art By Bayshore',
    phoneNumber: process.env.SUPPORT_PHONE || '1234567890',
    addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || '1717 N Bayshore Dr',
    addressLine2: process.env.WAREHOUSE_ADDRESS_LINE2 || 'Unit 121',
    city: process.env.WAREHOUSE_CITY || 'Miami',
    state: process.env.WAREHOUSE_STATE || 'FL',
    zipCode: process.env.WAREHOUSE_ZIP || '33132',
    country: 'US',
  };

  // Prepare to address
  const toAddress = {
    fullName: order.shippingAddress.fullName,
    phoneNumber: order.shippingAddress.phoneNumber,
    email: order.user?.email || order.shippingAddress.email,
    addressLine1: order.shippingAddress.addressLine1,
    addressLine2: order.shippingAddress.addressLine2,
    city: order.shippingAddress.city,
    state: order.shippingAddress.state,
    zipCode: order.shippingAddress.zipCode,
    country: order.shippingAddress.country || 'US',
    residential: addressValidation.classification === 'RESIDENTIAL',
  };

  // Prepare packages from order items
  const cartItems = order.items.map(item => ({
    quantity: item.quantity,
    price: item.price,
    dimensions: item.dimensions || {
      length: 24,
      width: 24,
      height: 4,
      unit: 'IN',
    },
    weight: item.weight || {
      value: 5,
      unit: 'LB',
    },
  }));

  const packages = fedexService.calculatePackageDimensions(cartItems);

  // Calculate total cart value for insurance/signature requirements
  const cartValue = order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const shipmentData = {
    fromAddress,
    toAddress,
    packages,
    serviceType: order.fedexShipment?.serviceType || req.body.serviceType || 'FEDEX_GROUND',
    shipDate: new Date().toISOString().split('T')[0],
    reference: order.orderNumber,
    cartValue, // For signature requirements
  };

  // ===================================
  // STEP 3: Create FedEx Shipment
  // ===================================

  let shipmentResult;

  // Only create real shipment in production/sandbox mode
  if (process.env.FEDEX_MODE === 'production' || process.env.FEDEX_MODE === 'sandbox') {
    logger.info('Creating FedEx shipment...', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      mode: process.env.FEDEX_MODE,
      packages: packages.length,
    });

    try {
      shipmentResult = await fedexService.createShipment(shipmentData);

      if (!shipmentResult.success) {
        logger.error('FedEx shipment creation failed', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          error: shipmentResult.error,
        });

        return next(
          new ErrorResponse(
            `Failed to create FedEx shipment: ${shipmentResult.error}`,
            400
          )
        );
      }

      logger.info('✅ FedEx shipment created successfully', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        trackingNumber: shipmentResult.trackingNumber,
        service: shipmentResult.serviceName,
      });

    } catch (error) {
      logger.error('FedEx shipment creation error', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        error: error.message,
        stack: error.stack,
      });

      return next(
        new ErrorResponse(
          `Failed to create FedEx shipment: ${error.message}`,
          500
        )
      );
    }
  } else {
    // Development mode - use mock data
    logger.warn('⚠️  DEVELOPMENT MODE - Using mock shipment data', {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    shipmentResult = {
      success: true,
      trackingNumber: `DEV-${Date.now()}`,
      masterId: `MASTER-${Date.now()}`,
      labelUrl: 'https://example.com/mock-label.pdf',
      serviceType: shipmentData.serviceType,
      serviceName: fedexService.getServiceName(shipmentData.serviceType),
      shipDate: new Date().toISOString().split('T')[0],
      mock: true,
    };
  }

  // ===================================
  // STEP 4: Update Order with Shipment Details
  // ===================================

  order.fedexShipment = {
    trackingNumber: shipmentResult.trackingNumber,
    masterId: shipmentResult.masterId || shipmentResult.trackingNumber,
    labelUrl: shipmentResult.labelUrl,
    serviceType: shipmentResult.serviceType,
    serviceName: shipmentResult.serviceName || fedexService.getServiceName(shipmentResult.serviceType),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days default
    createdAt: new Date(),
  };

  order.shippingStatus = 'label-created';
  order.orderStatus = 'shipped';

  // Clear notification flags
  if (order.notificationCleared !== undefined) {
    order.notificationCleared = true;
    order.notificationClearedAt = new Date();
  }

  order.statusHistory.push({
    status: 'shipped',
    timestamp: new Date(),
    updatedBy: req.user.id,
    note: `Shipment created. Tracking: ${shipmentResult.trackingNumber}${shipmentResult.mock ? ' (MOCK)' : ''}`,
  });

  await order.save();

  logger.info('Order updated with shipment details', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    trackingNumber: shipmentResult.trackingNumber,
  });

  // ===================================
  // STEP 5: Send Shipping Confirmation Email
  // ===================================

  try {
    const user = order.user?._id ? order.user : await User.findById(order.user);

    if (user && user.email) {
      const emailResult = await emailService.shippingConfirmationEmail(order, user);

      order.emailsSent.push({
        type: 'shipping',
        sentAt: new Date(),
        success: emailResult?.success || false,
      });
      await order.save();

      if (emailResult?.success) {
        logger.info('Shipping confirmation email sent', {
          orderNumber: order.orderNumber,
          email: user.email,
        });
      } else {
        logger.warn('Failed to send shipping confirmation email', {
          orderNumber: order.orderNumber,
          error: emailResult?.error,
        });
      }
    }
  } catch (emailError) {
    logger.error('Email error during shipment creation', {
      orderNumber: order.orderNumber,
      error: emailError.message,
    });
    // Don't fail shipment creation if email fails
  }

  // ===================================
  // STEP 6: Notify Owner
  // ===================================

  try {
    await emailService.ownerShipmentNotification(order);
    logger.info('Owner notification sent for shipment', {
      orderNumber: order.orderNumber,
    });
  } catch (ownerEmailError) {
    logger.error('Owner notification error', {
      orderNumber: order.orderNumber,
      error: ownerEmailError.message,
    });
  }

  // ===================================
  // STEP 7: Return Response
  // ===================================

  res.status(200).json({
    success: true,
    message: shipmentResult.mock
      ? 'Mock shipment created (Development Mode)'
      : 'Shipment created successfully',
    data: {
      trackingNumber: shipmentResult.trackingNumber,
      labelUrl: shipmentResult.labelUrl,
      serviceName: shipmentResult.serviceName,
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

  if (!order.fedexShipment?.trackingNumber) {
    return next(new ErrorResponse('No tracking number found for this order', 400));
  }

  const previousShippingStatus = order.shippingStatus;
  const previousOrderStatus = order.orderStatus;

  let trackingResult;

  // ===================================
  // STEP 1: Get Tracking Information
  // ===================================

  // Only get real tracking in production/sandbox mode
  if (process.env.FEDEX_MODE === 'production' || process.env.FEDEX_MODE === 'sandbox') {
    logger.info('Retrieving FedEx tracking information...', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      trackingNumber: order.fedexShipment.trackingNumber,
    });

    try {
      trackingResult = await fedexService.trackShipment(order.fedexShipment.trackingNumber);

      if (!trackingResult.success) {
        logger.error('FedEx tracking retrieval failed', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          trackingNumber: order.fedexShipment.trackingNumber,
          error: trackingResult.error,
        });

        return next(
          new ErrorResponse(
            `Failed to retrieve tracking: ${trackingResult.error}`,
            400
          )
        );
      }

      logger.info('FedEx tracking retrieved successfully', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: trackingResult.status,
      });

    } catch (error) {
      logger.error('FedEx tracking API error', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        error: error.message,
      });

      return next(
        new ErrorResponse(
          `Failed to retrieve tracking: ${error.message}`,
          500
        )
      );
    }
  } else {
    // Development mode - simulate tracking progression
    logger.warn('⚠️  DEVELOPMENT MODE - Using mock tracking data', {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    const mockStatuses = [
      'label-created',
      'picked-up',
      'in-transit',
      'out-for-delivery',
      'delivered'
    ];
    
    const currentIndex = mockStatuses.indexOf(order.shippingStatus) || 0;
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
  }

  // ===================================
  // STEP 2: Update Tracking History
  // ===================================

  if (trackingResult.events && Array.isArray(trackingResult.events) && trackingResult.events.length > 0) {
    order.trackingHistory = trackingResult.events.map(event => ({
      status: event.status,
      location: event.location,
      timestamp: new Date(event.timestamp),
      description: event.description,
    }));
  }

  // ===================================
  // STEP 3: Update Shipping Status
  // ===================================

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

  // Update estimated delivery
  if (trackingResult.estimatedDelivery) {
    order.fedexShipment.estimatedDelivery = new Date(trackingResult.estimatedDelivery);
  }

  // Add to status history if status changed
  if (order.shippingStatus !== previousShippingStatus) {
    order.statusHistory.push({
      status: order.shippingStatus,
      timestamp: new Date(),
      updatedBy: req.user.id,
      note: `Tracking updated: ${trackingResult.status}${trackingResult.mock ? ' (MOCK)' : ''}`,
    });
  }

  await order.save();

  logger.info('Order tracking updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    previousStatus: previousShippingStatus,
    newStatus: order.shippingStatus,
  });

  // ===================================
  // STEP 4: Send Delivery Email if Delivered
  // ===================================

  if (order.shippingStatus === 'delivered' && previousShippingStatus !== 'delivered') {
    try {
      const user = order.user?._id ? order.user : await User.findById(order.user);

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
            success: emailResult?.success || false,
          });
          await order.save();

          if (emailResult?.success) {
            logger.info('Delivery confirmation email sent', {
              orderNumber: order.orderNumber,
              email: user.email,
            });
          } else {
            logger.warn('Failed to send delivery confirmation email', {
              orderNumber: order.orderNumber,
              error: emailResult?.error,
            });
          }
        }
      }
    } catch (emailError) {
      logger.error('Delivery email error', {
        orderNumber: order.orderNumber,
        error: emailError.message,
      });
    }

    // Notify owner about delivery
    try {
      await emailService.ownerDeliveryNotification(order);
      logger.info('Owner delivery notification sent', {
        orderNumber: order.orderNumber,
      });
    } catch (ownerEmailError) {
      logger.error('Owner delivery notification error', {
        orderNumber: order.orderNumber,
        error: ownerEmailError.message,
      });
    }
  }

  // ===================================
  // STEP 5: Return Response
  // ===================================

  res.status(200).json({
    success: true,
    message: trackingResult.mock
      ? 'Tracking updated (Development Mode)'
      : 'Tracking updated successfully',
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

  // ===================================
  // STEP 1: Check Authorization
  // ===================================

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    if (order.user._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to cancel this order', 403));
    }

    // Users can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return next(
        new ErrorResponse(
          'This order cannot be cancelled. Please contact support.',
          400
        )
      );
    }
  }

  if (order.orderStatus === 'cancelled') {
    return next(new ErrorResponse('Order is already cancelled', 400));
  }

  if (order.orderStatus === 'delivered') {
    return next(
      new ErrorResponse(
        'Delivered orders cannot be cancelled. Please request a return instead.',
        400
      )
    );
  }

  // ===================================
  // STEP 2: Cancel FedEx Shipment
  // ===================================

  if (order.fedexShipment?.trackingNumber) {
    // Only cancel real shipment in production/sandbox mode
    if (process.env.FEDEX_MODE === 'production' || process.env.FEDEX_MODE === 'sandbox') {
      logger.info('Cancelling FedEx shipment...', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        trackingNumber: order.fedexShipment.trackingNumber,
      });

      try {
        const cancelResult = await fedexService.cancelShipment(
          order.fedexShipment.trackingNumber,
          req.body.reason || 'Order cancellation'
        );

        if (cancelResult.success) {
          logger.info('✅ FedEx shipment cancelled', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            trackingNumber: order.fedexShipment.trackingNumber,
          });
        } else {
          logger.error('FedEx shipment cancellation failed', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            trackingNumber: order.fedexShipment.trackingNumber,
            error: cancelResult.error,
          });

          // Add note to order but continue with cancellation
          if (!order.notes) order.notes = {};
          order.notes.admin = `${order.notes.admin || ''}\nFedEx cancellation failed: ${cancelResult.error}. May require manual void.`;
        }
      } catch (fedexError) {
        logger.error('FedEx cancellation error', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          error: fedexError.message,
        });

        // Add note but continue
        if (!order.notes) order.notes = {};
        order.notes.admin = `${order.notes.admin || ''}\nFedEx cancellation error: ${fedexError.message}. May require manual void.`;
      }
    } else {
      logger.warn('⚠️  DEVELOPMENT MODE - Skipping FedEx cancellation', {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }
  }

  // ===================================
  // STEP 3: Refund Payment
  // ===================================

  if (order.paymentStatus === 'paid' && order.paymentIntentId) {
    try {
      logger.info('Processing refund...', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentIntentId: order.paymentIntentId,
        amount: order.total,
      });

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

      logger.info('✅ Refund processed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        refundId: refund.id,
        amount: refund.amount / 100,
      });

    } catch (refundError) {
      logger.error('Refund failed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        error: refundError.message,
      });

      // Mark as needing manual refund
      if (!order.notes) order.notes = {};
      order.notes.admin = `${order.notes.admin || ''}\n⚠️ AUTO-REFUND FAILED: ${refundError.message}. MANUAL REFUND REQUIRED!`;
      order.paymentStatus = 'refund-pending';
    }
  }

  // ===================================
  // STEP 4: Update Order Status
  // ===================================

  order.orderStatus = 'cancelled';
  order.shippingStatus = 'cancelled';

  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    updatedBy: req.user.id,
    note: req.body.reason || 'Order cancelled',
  });

  await order.save();

  // ===================================
  // STEP 5: Restore Product Stock
  // ===================================

  for (const item of order.items) {
    try {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stockQuantity: item.quantity,
          salesCount: -item.quantity,
        },
      });

      logger.debug('Stock restored for product', {
        productId: item.product,
        quantity: item.quantity,
      });
    } catch (stockError) {
      logger.error('Failed to restore stock', {
        productId: item.product,
        error: stockError.message,
      });
    }
  }

  logger.info('Order cancelled', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    cancelledBy: req.user.email,
    reason: req.body.reason,
  });

  // ===================================
  // STEP 6: Send Cancellation Email
  // ===================================

  try {
    const user = order.user?._id ? order.user : await User.findById(order.user);

    if (user && user.email) {
      const emailResult = await emailService.orderCancellationEmail(order, user);

      order.emailsSent.push({
        type: 'cancellation',
        sentAt: new Date(),
        success: emailResult?.success || false,
      });
      await order.save();

      if (emailResult?.success) {
        logger.info('Cancellation email sent', {
          orderNumber: order.orderNumber,
          email: user.email,
        });
      }
    }
  } catch (emailError) {
    logger.error('Cancellation email error', {
      orderNumber: order.orderNumber,
      error: emailError.message,
    });
  }

  // ===================================
  // STEP 7: Return Response
  // ===================================

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

  const user = order.user?._id ? order.user : await User.findById(order.user);

  if (!user || !user.email) {
    return next(new ErrorResponse('User email not found', 400));
  }

  try {
    const emailResult = await emailService.sendOrderEmails(order, user);

    order.emailsSent.push({
      type: 'confirmation',
      sentAt: new Date(),
      success: emailResult?.customerEmail?.success || false,
    });
    await order.save();

    if (emailResult?.success || emailResult?.customerEmail?.success) {
      logger.info('Order confirmation email resent', {
        orderNumber: order.orderNumber,
        email: user.email,
      });

      res.status(200).json({
        success: true,
        message: 'Order confirmation email sent successfully',
      });
    } else {
      throw new Error(emailResult?.error || 'Failed to send email');
    }
  } catch (error) {
    logger.error('Failed to resend confirmation email', {
      orderNumber: order.orderNumber,
      error: error.message,
    });

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

// @desc    Validate shipping address
// @route   POST /api/v1/orders/validate-address
// @access  Private
export const validateShippingAddress = asyncHandler(async (req, res, next) => {
  const { address } = req.body;

  if (!address) {
    return next(new ErrorResponse('Address is required', 400));
  }

  try {
    const validation = await fedexService.validateAddress({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country || 'US',
    });

    res.status(200).json({
      success: true,
      data: validation,
    });

  } catch (error) {
    logger.error('Address validation error', {
      error: error.message,
      address,
    });

    return next(new ErrorResponse('Failed to validate address', 500));
  }
});

// @desc    Get shipping rates for cart
// @route   POST /api/v1/orders/shipping-rates
// @access  Private
export const getShippingRates = asyncHandler(async (req, res, next) => {
  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new ErrorResponse('Cart items are required', 400));
  }

  if (!shippingAddress) {
    return next(new ErrorResponse('Shipping address is required', 400));
  }

  // Validate address first
  const addressValidation = await fedexService.validateAddress({
    addressLine1: shippingAddress.addressLine1,
    addressLine2: shippingAddress.addressLine2,
    city: shippingAddress.city,
    state: shippingAddress.state,
    zipCode: shippingAddress.zipCode,
    country: shippingAddress.country || 'US',
  });

  if (!addressValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shipping address',
      error: addressValidation.error,
      suggestion: addressValidation.resolvedAddress,
    });
  }

  // Get product details
  const cartItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) {
      cartItems.push({
        quantity: item.quantity || 1,
        price: product.price,
        dimensions: product.dimensions,
        weight: product.weight,
      });
    }
  }

  if (cartItems.length === 0) {
    return next(new ErrorResponse('No valid products found in cart', 400));
  }

  // Calculate packages
  const packages = fedexService.calculatePackageDimensions(cartItems);

  // Get rates
  const fromAddress = {
    addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1,
    city: process.env.WAREHOUSE_CITY,
    state: process.env.WAREHOUSE_STATE,
    zipCode: process.env.WAREHOUSE_ZIP,
    country: process.env.WAREHOUSE_COUNTRY || 'US',
  };

  const ratesResult = await fedexService.getShippingRates({
    fromAddress,
    toAddress: {
      addressLine1: shippingAddress.addressLine1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country || 'US',
      residential: addressValidation.classification === 'RESIDENTIAL',
    },
    packages,
  });

  res.json(ratesResult);
});