import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'title images price stockQuantity isActive productType');

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Filter out inactive products or out of stock items
  const validItems = cart.items.filter(item => 
    item.product && 
    item.product.isActive && 
    item.product.productType === 'price-based'
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  // Verify product exists and is available
  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (!product.isActive) {
    return next(new ErrorResponse('This product is not available', 400));
  }

  if (product.productType !== 'price-based') {
    return next(new ErrorResponse('This product cannot be added to cart. Please use "Ask for Price"', 400));
  }

  if (product.stockQuantity < quantity) {
    return next(new ErrorResponse(`Only ${product.stockQuantity} items available in stock`, 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (product.stockQuantity < newQuantity) {
      return next(new ErrorResponse(`Only ${product.stockQuantity} items available in stock`, 400));
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price;
  } else {
    // Add new item with product snapshot
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      title: product.title,
      image: product.images && product.images.length > 0 ? product.images[0].url : null,
      dimensions: product.dimensions,
      weight: product.weight,
    });
  }

  await cart.save();
  await cart.populate('items.product', 'title images price stockQuantity isActive');

  logger.info(`Product added to cart: ${product.title} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Product added to cart',
    data: cart,
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:itemId
// @access  Private
export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  if (quantity < 1) {
    return next(new ErrorResponse('Quantity must be at least 1', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return next(new ErrorResponse('Cart item not found', 404));
  }

  // Check stock availability
  const product = await Product.findById(item.product);
  
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (product.stockQuantity < quantity) {
    return next(new ErrorResponse(`Only ${product.stockQuantity} items available in stock`, 400));
  }

  item.quantity = quantity;
  item.price = product.price; // Update price in case it changed

  await cart.save();
  await cart.populate('items.product', 'title images price stockQuantity isActive');

  res.status(200).json({
    success: true,
    message: 'Cart updated',
    data: cart,
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:itemId
// @access  Private
export const removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  cart.items.pull(req.params.itemId);
  await cart.save();
  await cart.populate('items.product', 'title images price stockQuantity isActive');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: cart,
  });
});

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: cart,
  });
});

// @desc    Sync cart (merge guest cart with user cart after login)
// @route   POST /api/v1/cart/sync
// @access  Private
export const syncCart = asyncHandler(async (req, res, next) => {
  const { guestCartItems } = req.body;

  if (!guestCartItems || guestCartItems.length === 0) {
    return next(new ErrorResponse('No items to sync', 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  // Merge guest cart items
  for (const guestItem of guestCartItems) {
    const product = await Product.findById(guestItem.productId);
    
    if (!product || !product.isActive || product.productType !== 'price-based') {
      continue;
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === guestItem.productId
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + guestItem.quantity;
      
      if (product.stockQuantity >= newQuantity) {
        cart.items[existingItemIndex].quantity = newQuantity;
      }
    } else {
      if (product.stockQuantity >= guestItem.quantity) {
        cart.items.push({
          product: product._id,
          quantity: guestItem.quantity,
          price: product.price,
          title: product.title,
          image: product.images && product.images.length > 0 ? product.images[0].url : null,
          dimensions: product.dimensions,
          weight: product.weight,
        });
      }
    }
  }

  await cart.save();
  await cart.populate('items.product', 'title images price stockQuantity isActive');

  res.status(200).json({
    success: true,
    message: 'Cart synced successfully',
    data: cart,
  });
});