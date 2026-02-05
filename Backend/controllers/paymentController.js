import stripe from '../config/stripe.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import emailService from '../config/sendgrid.js';
import logger from '../utils/logger.js';

// @desc    Create payment intent
// @route   POST /api/v1/payment/create-intent
// @access  Private
export const createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { shippingCost, couponCode } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'title price stockQuantity isActive productType images');

  if (!cart || cart.items.length === 0) {
    return next(new ErrorResponse('Cart is empty', 400));
  }

  // Verify all products are still available
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      return next(new ErrorResponse(`Product ${item.title} is no longer available`, 400));
    }

    if (item.product.productType !== 'price-based') {
      return next(new ErrorResponse(`Product ${item.title} cannot be purchased directly`, 400));
    }

    if (item.product.stockQuantity < item.quantity) {
      return next(new ErrorResponse(
        `Only ${item.product.stockQuantity} units of ${item.title} available`,
        400
      ));
    }
  }

  let subtotal = cart.subtotal;
  let discount = 0;
  let couponData = null;

  // Apply coupon if provided
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

    if (coupon && coupon.isValid) {
      // Check minimum purchase
      if (subtotal >= coupon.minimumPurchase) {
        // Calculate discount
        if (coupon.discountType === 'fixed') {
          discount = coupon.discountValue;
        } else {
          discount = (subtotal * coupon.discountValue) / 100;
          
          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }
        }

        // Ensure discount doesn't exceed subtotal
        if (discount > subtotal) {
          discount = subtotal;
        }

        couponData = {
          code: coupon.code,
          discount,
          type: coupon.discountType,
        };
      }
    }
  }

  const shipping = parseFloat(shippingCost) || 0;
  const tax = 0; // Calculate tax based on shipping address if needed
  const total = subtotal - discount + shipping + tax;

  // Create or update Stripe customer
  let stripeCustomerId = req.user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.fullName,
      metadata: {
        userId: req.user.id.toString(),
      },
    });

    stripeCustomerId = customer.id;
    req.user.stripeCustomerId = stripeCustomerId;
    await req.user.save({ validateBeforeSave: false });
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100), // Convert to cents
    currency: 'usd',
    customer: stripeCustomerId,
    metadata: {
      userId: req.user.id.toString(),
      cartId: cart._id.toString(),
      couponCode: couponCode || '',
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      shipping: shipping.toString(),
      tax: tax.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  logger.info(`Payment intent created: ${paymentIntent.id} for ${req.user.email}`);

  res.status(200).json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      breakdown: {
        subtotal,
        discount,
        shipping,
        tax,
        total,
      },
      coupon: couponData,
    },
  });
});

// @desc    Confirm payment and create order
// @route   POST /api/v1/payment/confirm
// @access  Private
export const confirmPayment = asyncHandler(async (req, res, next) => {
  const { paymentIntentId, shippingAddress, billingAddress, shippingService, couponCode } = req.body;

  // Validate required fields
  if (!paymentIntentId) {
    return next(new ErrorResponse('Payment intent ID is required', 400));
  }

  if (!shippingAddress) {
    return next(new ErrorResponse('Shipping address is required', 400));
  }

  if (!shippingService) {
    return next(new ErrorResponse('Shipping service is required', 400));
  }

  // Check if order already exists for this payment intent (prevent duplicates)
  const existingOrder = await Order.findOne({ paymentIntentId });
  if (existingOrder) {
    logger.info(`Order already exists for payment intent: ${paymentIntentId}`);
    return res.status(200).json({
      success: true,
      message: 'Order already created',
      data: existingOrder,
    });
  }

  // Retrieve payment intent
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent) {
    return next(new ErrorResponse('Payment intent not found', 404));
  }

  if (paymentIntent.status !== 'succeeded') {
    return next(new ErrorResponse('Payment has not been completed', 400));
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    return next(new ErrorResponse('Cart is empty', 400));
  }

  // Get full user details for email
  const user = await User.findById(req.user.id);

  // Prepare order items with proper image URLs
  const orderItems = cart.items.map(item => {
    // Get the best available image URL
    let imageUrl = '';
    if (item.product.images && item.product.images.length > 0) {
      const firstImage = item.product.images[0];
      if (typeof firstImage === 'string') {
        imageUrl = firstImage;
      } else if (firstImage.url) {
        imageUrl = firstImage.url;
      }
    } else if (item.image) {
      imageUrl = item.image;
    }

    return {
      product: item.product._id,
      title: item.title || item.product.title,
      image: imageUrl,
      price: item.price,
      quantity: item.quantity,
      dimensions: item.dimensions || item.product.dimensions,
      weight: item.weight || item.product.weight,
    };
  });

  // Calculate totals from payment intent metadata
  const metadata = paymentIntent.metadata;
  const subtotal = parseFloat(metadata.subtotal);
  const discount = parseFloat(metadata.discount) || 0;
  const shipping = parseFloat(metadata.shipping);
  const tax = parseFloat(metadata.tax) || 0;
  const total = paymentIntent.amount / 100;

  // Prepare coupon data
  let couponUsed = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon) {
      couponUsed = {
        code: coupon.code,
        discount,
        type: coupon.discountType,
      };

      // Update coupon usage
      coupon.usedCount += 1;
      coupon.usedBy.push({
        user: req.user.id,
        usedAt: new Date(),
      });
      await coupon.save();
    }
  }

  // Create order using new + save() to ensure pre-save hooks run
  const order = new Order({
    user: req.user.id,
    items: orderItems,
    shippingAddress: {
      fullName: shippingAddress.fullName,
      phoneNumber: shippingAddress.phoneNumber,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country || 'US',
    },
    billingAddress: billingAddress || shippingAddress,
    subtotal,
    shippingCost: shipping,
    tax,
    discount,
    total,
    couponUsed,
    paymentIntentId: paymentIntent.id,
    stripeChargeId: paymentIntent.latest_charge,
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    fedexShipment: {
      serviceType: shippingService,
    },
    statusHistory: [{
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Order placed and payment confirmed',
    }],
    emailsSent: [],
  });

  // Save order (this triggers pre-save hooks for order number generation)
  await order.save();

  // Update product stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { 
        stockQuantity: -item.quantity,
        salesCount: item.quantity,
      },
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Add order to user's order history
  if (req.user.orderHistory) {
    req.user.orderHistory.push(order._id);
    await req.user.save({ validateBeforeSave: false });
  }

  logger.info(`Order created: ${order.orderNumber} for ${req.user.email}`);

  // Send order confirmation emails (customer & owner)
  try {
    const emailResult = await emailService.sendOrderEmails(order, user);
    
    // Record email sent status
    if (emailResult.customerEmail) {
      order.emailsSent.push({
        type: 'confirmation',
        sentAt: new Date(),
        success: emailResult.customerEmail.success,
      });
    }
    
    await order.save();

    if (emailResult.success) {
      logger.info(`Order confirmation emails sent for order: ${order.orderNumber}`);
    } else {
      logger.warn(`Some order emails failed for order: ${order.orderNumber}`);
    }
  } catch (emailError) {
    logger.error(`Email sending error for order ${order.orderNumber}: ${emailError.message}`);
    // Don't fail the order creation if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: order,
  });
});

// @desc    Get payment methods
// @route   GET /api/v1/payment/methods
// @access  Private
export const getPaymentMethods = asyncHandler(async (req, res, next) => {
  if (!req.user.stripeCustomerId) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: req.user.stripeCustomerId,
    type: 'card',
  });

  res.status(200).json({
    success: true,
    data: paymentMethods.data,
  });
});

// @desc    Create setup intent for saving payment method
// @route   POST /api/v1/payment/setup-intent
// @access  Private
export const createSetupIntent = asyncHandler(async (req, res, next) => {
  let stripeCustomerId = req.user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.fullName,
      metadata: {
        userId: req.user.id.toString(),
      },
    });

    stripeCustomerId = customer.id;
    req.user.stripeCustomerId = stripeCustomerId;
    await req.user.save({ validateBeforeSave: false });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
  });

  res.status(200).json({
    success: true,
    data: {
      clientSecret: setupIntent.client_secret,
    },
  });
});

// @desc    Get payment status
// @route   GET /api/v1/payment/status/:paymentIntentId
// @access  Private
export const getPaymentStatus = asyncHandler(async (req, res, next) => {
  const { paymentIntentId } = req.params;

  if (!paymentIntentId) {
    return next(new ErrorResponse('Payment intent ID is required', 400));
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  res.status(200).json({
    success: true,
    data: {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    },
  });
});