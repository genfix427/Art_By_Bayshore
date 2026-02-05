// controllers/wishlistController.js
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user.id })
    .populate({
      path: 'items.product',
      select: 'title price compareAtPrice images slug category artist isActive stockQuantity productType',
      populate: [
        {
          path: 'category',
          select: 'name slug'
        },
        {
          path: 'artist',
          select: 'name slug'
        }
      ]
    });

  // If no wishlist exists, create one
  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user.id,
      items: []
    });
  }

  // Filter out inactive products
  const activeItems = wishlist.items.filter(item => 
    item.product && item.product.isActive
  );

  // Update wishlist with active items only
  if (activeItems.length !== wishlist.items.length) {
    wishlist.items = activeItems;
    await wishlist.save();
  }

  res.status(200).json({
    success: true,
    data: wishlist,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist
// @access  Private
export const addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  // Validate product exists and is active
  const product = await Product.findOne({
    _id: productId,
    isActive: true
  });

  if (!product) {
    return next(new ErrorResponse('Product not found or inactive', 404));
  }

  // Find or create wishlist
  let wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user.id,
      items: []
    });
  }

  // Check if product is already in wishlist
  const existingItem = wishlist.items.find(item => 
    item.product.toString() === productId
  );

  if (existingItem) {
    return next(new ErrorResponse('Product already in wishlist', 400));
  }

  // Add product to wishlist
  wishlist.items.push({
    product: productId,
    addedAt: Date.now()
  });

  await wishlist.save();

  // Populate product details
  await wishlist.populate({
    path: 'items.product',
    select: 'title price compareAtPrice images slug'
  });

  res.status(200).json({
    success: true,
    message: 'Product added to wishlist',
    data: wishlist,
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    return next(new ErrorResponse('Wishlist not found', 404));
  }

  // Remove product from wishlist
  wishlist.items = wishlist.items.filter(item => 
    item.product.toString() !== productId
  );

  await wishlist.save();

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist',
    data: wishlist,
  });
});

// @desc    Check if product is in wishlist
// @route   GET /api/v1/wishlist/check/:productId
// @access  Private
export const checkWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user.id });

  const isInWishlist = wishlist ? 
    wishlist.items.some(item => item.product.toString() === productId) : 
    false;

  res.status(200).json({
    success: true,
    data: {
      isInWishlist,
      wishlistId: wishlist?._id
    },
  });
});

// @desc    Clear wishlist
// @route   DELETE /api/v1/wishlist
// @access  Private
export const clearWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });

  if (!wishlist) {
    return next(new ErrorResponse('Wishlist not found', 404));
  }

  wishlist.items = [];
  await wishlist.save();

  res.status(200).json({
    success: true,
    message: 'Wishlist cleared',
    data: wishlist,
  });
});

// @desc    Get wishlist count
// @route   GET /api/v1/wishlist/count
// @access  Private
export const getWishlistCount = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });

  const count = wishlist ? wishlist.items.length : 0;

  res.status(200).json({
    success: true,
    data: {
      count
    },
  });
});