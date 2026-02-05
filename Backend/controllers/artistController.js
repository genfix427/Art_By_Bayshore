import Artist from '../models/Artist.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import imageProcessor from '../utils/imageProcessor.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all artists
// @route   GET /api/v1/artists
// @access  Public
export const getArtists = asyncHandler(async (req, res, next) => {
  const { page, limit, isActive, isFeatured, search } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { nationality: { $regex: search, $options: 'i' } },
      { artStyle: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const total = await Artist.countDocuments(query);
  const artists = await Artist.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ displayOrder: 1, name: 1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: artists,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get single artist
// @route   GET /api/v1/artists/:id
// @access  Public
export const getArtist = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findById(req.params.id)
    .populate('createdBy', 'firstName lastName');

  if (!artist) {
    return next(new ErrorResponse('Artist not found', 404));
  }

  // Get artist's artworks count
  const artworksCount = await Product.countDocuments({ 
    artist: artist._id, 
    isActive: true 
  });

  const artistData = artist.toObject();
  artistData.artworksCount = artworksCount;

  res.status(200).json({
    success: true,
    data: artistData,
  });
});

// @desc    Get artist by slug
// @route   GET /api/v1/artists/slug/:slug
// @access  Public
export const getArtistBySlug = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findOne({ slug: req.params.slug });

  if (!artist) {
    return next(new ErrorResponse('Artist not found', 404));
  }

  // Get artist's artworks count
  const artworksCount = await Product.countDocuments({ 
    artist: artist._id, 
    isActive: true 
  });

  const artistData = artist.toObject();
  artistData.artworksCount = artworksCount;

  res.status(200).json({
    success: true,
    data: artistData,
  });
});

// @desc    Get artist's products
// @route   GET /api/v1/artists/:id/products
// @access  Public
export const getArtistProducts = asyncHandler(async (req, res, next) => {
  const { page, limit } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const artist = await Artist.findById(req.params.id);
  if (!artist) {
    return next(new ErrorResponse('Artist not found', 404));
  }

  const query = { artist: req.params.id, isActive: true };
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: products,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Create artist
// @route   POST /api/v1/artists
// @access  Private/Admin
export const createArtist = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  // Handle image upload
  if (req.file) {
    const processedPath = await imageProcessor.processImage(req.file.path, {
      width: 800,
      height: 800,
    });
    req.body.profileImage = '/uploads/' + processedPath.split('/uploads/')[1];
  }

  const artist = await Artist.create(req.body);

  logger.info(`Artist created: ${artist.name} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Artist created successfully',
    data: artist,
  });
});

// @desc    Update artist
// @route   PUT /api/v1/artists/:id
// @access  Private/Admin
export const updateArtist = asyncHandler(async (req, res, next) => {
  let artist = await Artist.findById(req.params.id);

  if (!artist) {
    return next(new ErrorResponse('Artist not found', 404));
  }

  // Handle image upload
  if (req.file) {
    // Delete old image if exists
    if (artist.profileImage) {
      const oldImagePath = path.join(__dirname, '..', artist.profileImage);
      imageProcessor.deleteFile(oldImagePath);
    }

    const processedPath = await imageProcessor.processImage(req.file.path, {
      width: 800,
      height: 800,
    });
    req.body.profileImage = '/uploads/' + processedPath.split('/uploads/')[1];
  }

  artist = await Artist.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  logger.info(`Artist updated: ${artist.name} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Artist updated successfully',
    data: artist,
  });
});

// @desc    Delete artist
// @route   DELETE /api/v1/artists/:id
// @access  Private/Admin
export const deleteArtist = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    return next(new ErrorResponse('Artist not found', 404));
  }

  // Check if artist has products
  const productCount = await Product.countDocuments({ artist: artist._id });
  if (productCount > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete artist with ${productCount} associated products`,
        400
      )
    );
  }

  // Delete image if exists
  if (artist.profileImage) {
    const imagePath = path.join(__dirname, '..', artist.profileImage);
    imageProcessor.deleteFile(imagePath);
  }

  await artist.deleteOne();

  logger.info(`Artist deleted: ${artist.name} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Artist deleted successfully',
    data: {},
  });
});