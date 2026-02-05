import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import logger from '../utils/logger.js';

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin
export const getCoupons = asyncHandler(async (req, res, next) => {
  const { page, limit, isActive, search } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.code = { $regex: search, $options: 'i' };
  }

  const total = await Coupon.countDocuments(query);
  const coupons = await Coupon.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('applicableCategories', 'name')
    .populate('applicableProducts', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: coupons,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get single coupon
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin
export const getCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate('createdBy', 'firstName lastName')
    .populate('applicableCategories', 'name slug')
    .populate('applicableProducts', 'title slug')
    .populate('excludedProducts', 'title slug')
    .populate('usedBy.user', 'firstName lastName email');

  if (!coupon) {
    return next(new ErrorResponse('Coupon not found', 404));
  }

  res.status(200).json({
    success: true,
    data: coupon,
  });
});

// @desc    Validate coupon
// @route   POST /api/v1/coupons/validate
// @access  Public
export const validateCoupon = asyncHandler(async (req, res, next) => {
  const { code, userId, cartItems, subtotal } = req.body;

  const coupon = await Coupon.findOne({ 
    code: code.toUpperCase(),
  });

  if (!coupon) {
    return next(new ErrorResponse('Invalid coupon code', 404));
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return next(new ErrorResponse('This coupon is no longer active', 400));
  }

  // Check if coupon is expired
  const now = new Date();
  if (now < coupon.startDate) {
    return next(new ErrorResponse('This coupon is not yet valid', 400));
  }
  if (now > coupon.expiryDate) {
    return next(new ErrorResponse('This coupon has expired', 400));
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return next(new ErrorResponse('This coupon has reached its usage limit', 400));
  }

  // Check user-specific usage
  if (userId) {
    const userUsage = coupon.usedBy.filter(
      usage => usage.user.toString() === userId
    ).length;

    if (userUsage >= coupon.usagePerUser) {
      return next(new ErrorResponse('You have already used this coupon the maximum number of times', 400));
    }
  }

  // Check minimum purchase requirement
  if (subtotal < coupon.minimumPurchase) {
    return next(
      new ErrorResponse(
        `Minimum purchase of $${coupon.minimumPurchase.toFixed(2)} required for this coupon`,
        400
      )
    );
  }

  // Check applicable categories and products
  if (cartItems && cartItems.length > 0) {
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // If specific categories are set
    if (coupon.applicableCategories.length > 0) {
      const validProducts = products.filter(product =>
        coupon.applicableCategories.includes(product.category.toString())
      );

      if (validProducts.length === 0) {
        return next(new ErrorResponse('This coupon is not applicable to items in your cart', 400));
      }
    }

    // If specific products are set
    if (coupon.applicableProducts.length > 0) {
      const validProducts = products.filter(product =>
        coupon.applicableProducts.includes(product._id.toString())
      );

      if (validProducts.length === 0) {
        return next(new ErrorResponse('This coupon is not applicable to items in your cart', 400));
      }
    }

    // Check excluded products
    if (coupon.excludedProducts.length > 0) {
      const excludedInCart = products.filter(product =>
        coupon.excludedProducts.includes(product._id.toString())
      );

      if (excludedInCart.length === products.length) {
        return next(new ErrorResponse('This coupon cannot be applied to items in your cart', 400));
      }
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discountValue;
  } else {
    discountAmount = (subtotal * coupon.discountValue) / 100;
    
    // Apply maximum discount if set
    if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
      discountAmount = coupon.maximumDiscount;
    }
  }

  // Ensure discount doesn't exceed subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  res.status(200).json({
    success: true,
    message: 'Coupon is valid',
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      description: coupon.description,
    },
  });
});

// @desc    Create coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin
export const createCoupon = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;
  req.body.code = req.body.code.toUpperCase();

  const coupon = await Coupon.create(req.body);

  logger.info(`Coupon created: ${coupon.code} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: coupon,
  });
});

// @desc    Update coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
export const updateCoupon = asyncHandler(async (req, res, next) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse('Coupon not found', 404));
  }

  if (req.body.code) {
    req.body.code = req.body.code.toUpperCase();
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  logger.info(`Coupon updated: ${coupon.code} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: coupon,
  });
});

// @desc    Delete coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
export const deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse('Coupon not found', 404));
  }

  await coupon.deleteOne();

  logger.info(`Coupon deleted: ${coupon.code} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully',
    data: {},
  });
});

// @desc    Get coupon usage statistics
// @route   GET /api/v1/coupons/:id/stats
// @access  Private/Admin
export const getCouponStats = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorResponse('Coupon not found', 404));
  }

  const stats = {
    totalUsed: coupon.usedCount,
    remainingUses: coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : 'Unlimited',
    uniqueUsers: new Set(coupon.usedBy.map(u => u.user.toString())).size,
    isActive: coupon.isActive,
    isExpired: coupon.expiryDate < new Date(),
    daysUntilExpiry: Math.ceil((coupon.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});