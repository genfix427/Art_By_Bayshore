import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Artist from '../models/Artist.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import imageProcessor from '../utils/imageProcessor.js';
import cloudinary from '../config/cloudinary.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
export const getProducts = asyncHandler(async (req, res, next) => {
  const {
    page,
    limit,
    category,
    artist,
    productType,
    isActive,
    isFeatured,
    minPrice,
    maxPrice,
    search,
    sortBy,
  } = req.query;

  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};

  // Filters
  if (category) query.category = category;
  if (artist) query.artist = artist;
  if (productType) query.productType = productType;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

  // Price range for price-based products
  if (minPrice || maxPrice) {
    query.productType = 'price-based';
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Search
  if (search) {
    query.$text = { $search: search };
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (sortBy) {
    switch (sortBy) {
      case 'price-asc':
        sort = { price: 1 };
        break;
      case 'price-desc':
        sort = { price: -1 };
        break;
      case 'name-asc':
        sort = { title: 1 };
        break;
      case 'name-desc':
        sort = { title: -1 };
        break;
      case 'popular':
        sort = { viewsCount: -1 };
        break;
      case 'bestselling':
        sort = { salesCount: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('artist', 'name slug profileImage')
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: products,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('artist', 'name slug profileImage biography')
    .populate('createdBy', 'firstName lastName');

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Increment view count
  product.viewsCount += 1;
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Get product by slug
// @route   GET /api/v1/products/slug/:slug
// @access  Public
export const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category', 'name slug')
    .populate('artist', 'name slug profileImage biography')
    .populate('createdBy', 'firstName lastName');

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Increment view count
  product.viewsCount += 1;
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Get related products
// @route   GET /api/v1/products/:id/related
// @access  Public
export const getRelatedProducts = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    $or: [
      { category: product.category },
      { artist: product.artist },
    ],
    isActive: true,
  })
    .populate('category', 'name slug')
    .populate('artist', 'name slug profileImage')
    .limit(8)
    .sort({ viewsCount: -1 });

  res.status(200).json({
    success: true,
    data: relatedProducts,
  });
});

// @desc    Create product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res, next) => {
  console.log('=== CREATE PRODUCT CONTROLLER ===');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Files count:', req.files?.length || 0);

  // Verify category exists
  const category = await Category.findById(req.body.category);
  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Verify artist exists
  const artist = await Artist.findById(req.body.artist);
  if (!artist) {
    return next(new ErrorResponse('Artist not found', 404));
  }

  req.body.createdBy = req.user.id;

  // Parse JSON strings
  if (typeof req.body.dimensions === 'string') {
    try {
      req.body.dimensions = JSON.parse(req.body.dimensions);
    } catch (error) {
      console.log('Failed to parse dimensions:', error.message);
    }
  }
  
  if (typeof req.body.weight === 'string') {
    try {
      req.body.weight = JSON.parse(req.body.weight);
    } catch (error) {
      console.log('Failed to parse weight:', error.message);
    }
  }

  // Handle multiple image uploads to Cloudinary
  if (req.files && req.files.length > 0) {
    console.log('=== STARTING CLOUDINARY UPLOAD ===');
    console.log('Files to upload:', req.files.map(f => ({
      name: f.originalname,
      size: f.size,
      hasBuffer: !!f.buffer
    })));

    try {
      // Upload to Cloudinary
      const uploadResults = await imageProcessor.uploadMultiple(req.files, 'art_haven/products');
      
      console.log('Cloudinary upload results:', uploadResults);
      
      // Make sure we have valid results
      if (!uploadResults || uploadResults.length === 0) {
        throw new Error('No upload results returned from Cloudinary');
      }

      // Map results - imageProcessor now returns consistent format
      req.body.images = uploadResults.map((result, index) => {
        if (!result.url || !result.public_id) {
          throw new Error(`Invalid Cloudinary result for image ${index}: missing URL or public_id`);
        }
        
        return {
          url: result.url,
          public_id: result.public_id,
          alt: req.body.title || `Product image ${index + 1}`,
          isPrimary: index === 0,
        };
      });

      console.log('Images ready to save:', req.body.images);
      console.log('=== CLOUDINARY UPLOAD COMPLETE ===');
      
    } catch (error) {
      console.error('=== CLOUDINARY UPLOAD FAILED ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      return next(new ErrorResponse(`Failed to upload images to Cloudinary: ${error.message}`, 500));
    }
  } else {
    console.log('No files to upload');
    req.body.images = []; // Initialize empty array if no files
  }

  try {
    console.log('Creating product with data:', {
      title: req.body.title,
      imagesCount: req.body.images?.length || 0
    });

    const product = await Product.create(req.body);
    
    console.log('Product created successfully:', {
      id: product._id,
      title: product.title,
      images: product.images.map(img => ({
        url: img.url,
        public_id: img.public_id
      }))
    });

    logger.info(`Product created: ${product.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Product creation error:', error);
    next(error);
  }
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Verify category if being updated
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }
  }

  // Verify artist if being updated
  if (req.body.artist) {
    const artist = await Artist.findById(req.body.artist);
    if (!artist) {
      return next(new ErrorResponse('Artist not found', 404));
    }
  }

  // Parse JSON strings
  if (typeof req.body.dimensions === 'string') {
    try {
      req.body.dimensions = JSON.parse(req.body.dimensions);
    } catch (error) {
      console.log('Failed to parse dimensions:', error.message);
    }
  }
  
  if (typeof req.body.weight === 'string') {
    try {
      req.body.weight = JSON.parse(req.body.weight);
    } catch (error) {
      console.log('Failed to parse weight:', error.message);
    }
  }

  // Handle new image uploads to Cloudinary
  if (req.files && req.files.length > 0) {
    console.log('Uploading new images to Cloudinary');
    
    try {
      const uploadResults = await imageProcessor.uploadMultiple(req.files, 'art_haven/products');
      
      // FIXED: Use result.url instead of result.secure_url (imageProcessor returns url)
      const newImages = uploadResults.map((result, index) => ({
        url: result.url,
        public_id: result.public_id,
        alt: req.body.title || product.title || result.alt,
        isPrimary: index === 0 && (!product.images || product.images.length === 0),
      }));

      // Append new images to existing ones
      req.body.images = [...(product.images || []), ...newImages];
      console.log('Total images after update:', req.body.images.length);
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return next(new ErrorResponse(`Failed to upload images: ${error.message}`, 500));
    }
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  logger.info(`Product updated: ${product.title} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

// @desc    Delete product image
// @route   DELETE /api/v1/products/:id/images/:imageId
// @access  Private/Admin
export const deleteProductImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  const image = product.images.id(req.params.imageId);

  if (!image) {
    return next(new ErrorResponse('Image not found', 404));
  }

  // Delete image from Cloudinary
  if (image.public_id) {
    try {
      await imageProcessor.deleteFromCloudinary(image.public_id);
      console.log('Deleted from Cloudinary:', image.public_id);
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
      // Continue anyway - image might already be deleted
    }
  }

  // Remove from array
  product.images.pull(req.params.imageId);

  // If deleted image was primary, set first image as primary
  if (image.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  logger.info(`Product image deleted from ${product.title} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
    data: product,
  });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Delete all product images from Cloudinary
  if (product.images && product.images.length > 0) {
    const deletePromises = product.images.map(image => {
      if (image.public_id) {
        return imageProcessor.deleteFromCloudinary(image.public_id);
      }
      return Promise.resolve();
    });
    
    try {
      await Promise.all(deletePromises);
      console.log('Deleted all product images from Cloudinary');
    } catch (error) {
      console.error('Error deleting images from Cloudinary:', error);
      // Continue with product deletion
    }
  }

  await product.deleteOne();

  logger.info(`Product deleted: ${product.title} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    data: {},
  });
});

// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .populate('artist', 'name slug profileImage')
    .limit(12)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: products,
  });
});