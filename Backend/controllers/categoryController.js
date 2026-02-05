import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import imageProcessor from '../utils/imageProcessor.js';
import logger from '../utils/logger.js';
import path from 'path';

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res, next) => {
  const { page, limit, isActive, parentCategory } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (parentCategory) query.parentCategory = parentCategory;

  const total = await Category.countDocuments(query);
  const categories = await Category.find(query)
    .populate('parentCategory', 'name slug')
    .populate('createdBy', 'firstName lastName')
    .sort({ displayOrder: 1, name: 1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: categories,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Public
export const getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('parentCategory', 'name slug')
    .populate('subcategories')
    .populate('createdBy', 'firstName lastName');

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Get category by slug
// @route   GET /api/v1/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate('parentCategory', 'name slug')
    .populate('subcategories');

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  // Handle image upload
  if (req.file) {
    const processedPath = await imageProcessor.processImage(req.file.path, {
      width: 800,
      height: 800,
    });
    req.body.image = '/uploads/' + processedPath.split('/uploads/')[1];
  }

  const category = await Category.create(req.body);

  logger.info(`Category created: ${category.name} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Handle image upload
  if (req.file) {
    // Delete old image if exists
    if (category.image) {
      const oldImagePath = path.join(__dirname, '..', category.image);
      imageProcessor.deleteFile(oldImagePath);
    }

    const processedPath = await imageProcessor.processImage(req.file.path, {
      width: 800,
      height: 800,
    });
    req.body.image = '/uploads/' + processedPath.split('/uploads/')[1];
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  logger.info(`Category updated: ${category.name} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete category with ${productCount} associated products`,
        400
      )
    );
  }

  // Check if category has subcategories
  const subcategoryCount = await Category.countDocuments({ parentCategory: category._id });
  if (subcategoryCount > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete category with ${subcategoryCount} subcategories`,
        400
      )
    );
  }

  // Delete image if exists
  if (category.image) {
    const imagePath = path.join(__dirname, '..', category.image);
    imageProcessor.deleteFile(imagePath);
  }

  await category.deleteOne();

  logger.info(`Category deleted: ${category.name} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
    data: {},
  });
});