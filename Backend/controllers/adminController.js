import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};

  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by verification status
  if (req.query.isEmailVerified) {
    query.isEmailVerified = req.query.isEmailVerified === 'true';
  }

  // Filter by active status
  if (req.query.isActive) {
    query.isActive = req.query.isActive === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Get total count for pagination
  const total = await User.countDocuments(query);

  // Get users
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  // CORRECT: Return the response in the proper format
  res.status(200).json({
    success: true,
    data: users,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  });
});


// @desc    Get user by ID
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('orderHistory');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  // Check if user exists
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent updating own role unless superadmin
  if (req.user.id === req.params.id && req.user.role !== 'superadmin') {
    return next(new ErrorResponse('You cannot change your own role', 403));
  }

  // Only superadmin can create superadmin
  if (role === 'superadmin' && req.user.role !== 'superadmin') {
    return next(new ErrorResponse('Only superadmin can assign superadmin role', 403));
  }

  // Only superadmin can modify other superadmins
  if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
    return next(new ErrorResponse('Only superadmin can modify superadmin users', 403));
  }

  user.role = role;
  await user.save();

  logger.info(`User role updated: ${user.email} -> ${role} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: user,
  });
});

// @desc    Toggle user email verification
// @route   PUT /api/v1/admin/users/:id/verify
// @access  Private/Admin
export const toggleUserVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Toggle verification status
  user.isEmailVerified = !user.isEmailVerified;

  // Clear verification token if verifying
  if (user.isEmailVerified) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
  }

  await user.save({ validateBeforeSave: false });

  logger.info(
    `User verification toggled: ${user.email} -> ${user.isEmailVerified} by ${req.user.email}`
  );

  res.status(200).json({
    success: true,
    message: `User ${user.isEmailVerified ? 'verified' : 'unverified'} successfully`,
    data: user,
  });
});

// @desc    Toggle user active status
// @route   PUT /api/v1/admin/users/:id/status
// @access  Private/Admin
export const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent deactivating own account
  if (req.user.id === req.params.id) {
    return next(new ErrorResponse('You cannot deactivate your own account', 403));
  }

  // Only superadmin can modify other admins/superadmins
  if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
    return next(new ErrorResponse('Only superadmin can modify admin users', 403));
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  logger.info(
    `User status toggled: ${user.email} -> ${user.isActive ? 'active' : 'inactive'} by ${req.user.email}`
  );

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent deleting own account
  if (req.user.id === req.params.id) {
    return next(new ErrorResponse('You cannot delete your own account', 403));
  }

  // Only superadmin can delete other admins/superadmins
  if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
    return next(new ErrorResponse('Only superadmin can delete admin users', 403));
  }

  await user.deleteOne();

  logger.info(`User deleted: ${user.email} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: {},
  });
});