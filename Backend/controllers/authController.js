import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import logger from '../utils/logger.js';
import emailService from '../config/sendgrid.js';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
  });

  // Generate verification token - THIS RETURNS THE PLAIN TOKEN
  const verificationToken = user.generateEmailVerificationToken();
  
  // Save user with the HASHED token in the database
  await user.save({ validateBeforeSave: false });

  // IMPORTANT: Use the PLAIN TOKEN in the URL (not user.emailVerificationToken which is hashed!)
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  // Debug logs
  console.log('📧 Registration Debug:');
  console.log('Plain Token (for email URL):', verificationToken);
  console.log('Plain Token Length:', verificationToken.length); // Should be 64
  console.log('Hashed Token (in DB):', user.emailVerificationToken);
  console.log('Hashed Token Length:', user.emailVerificationToken.length); // Should be 64
  console.log('Verification URL:', verificationUrl);
  console.log('Tokens are different?', verificationToken !== user.emailVerificationToken); // Should be TRUE
  
  try {
    await emailService.emailVerificationEmail(user, verificationUrl);
    
    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error(`Error sending verification email: ${error.message}`);
    return next(new ErrorResponse('User created but error sending verification email. Please contact support.', 500));
  }
});

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res, next) => {
  // Get the token from URL
  const plainToken = req.params.token;
  
  // Hash the token to match what's in the database
  const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');

  console.log('🔍 Verification Attempt:');
  console.log('Plain Token from URL:', plainToken);
  console.log('Hashed Token for Query:', hashedToken);
  console.log('Current Time:', new Date());

  // Find user with matching hashed token and not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    console.log('❌ No user found with valid token');
    
    // Check if token exists but expired
    const expiredUser = await User.findOne({
      emailVerificationToken: hashedToken,
    });
    
    if (expiredUser) {
      console.log('⏰ Token found but expired');
      console.log('Token Expiry was:', new Date(expiredUser.emailVerificationExpire));
      return next(new ErrorResponse('Verification token has expired. Please request a new one.', 400));
    }
    
    // Check if user already verified
    const verifiedUser = await User.findOne({
      email: { $exists: true },
      isEmailVerified: true,
      emailVerificationToken: { $exists: false },
    });
    
    console.log('🔍 Checking for already verified users...');
    
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  console.log('✅ User found:', user.email);
  console.log('Is already verified?', user.isEmailVerified);

  // Check if already verified (shouldn't happen but good to check)
  if (user.isEmailVerified) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    console.log('ℹ️ Email was already verified');

    return res.status(200).json({
      success: true,
      message: 'Email is already verified. You can login now.',
      alreadyVerified: true,
    });
  }

  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  console.log('✅ Email verified successfully for:', user.email);
  logger.info(`Email verified for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now login.',
    alreadyVerified: false,
  });
});

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Public
export const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide email address', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal that user doesn't exist for security
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a verification link.',
    });
  }

  if (user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      message: 'This email is already verified. You can login now.',
      alreadyVerified: true,
    });
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  console.log('📧 Resending Verification:');
  console.log('Email:', email);
  console.log('New Token:', verificationToken);
  console.log('URL:', verificationUrl);
  
  try {
    await emailService.emailVerificationEmail(user, verificationUrl);
    
    logger.info(`Verification email resent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
      alreadyVerified: false,
    });
  } catch (error) {
    logger.error(`Error resending verification email: ${error.message}`);
    return next(new ErrorResponse('Error sending verification email', 500));
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return next(new ErrorResponse('Please verify your email before logging in', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(
      new ErrorResponse(
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        403
      )
    );
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new ErrorResponse('Your account has been deactivated', 403));
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Increment login attempts
    await user.incLoginAttempts();
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide email address', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal that user doesn't exist for security
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  console.log('🔑 Password Reset:');
  console.log('Email:', email);
  console.log('Reset Token:', resetToken);
  console.log('Reset URL:', resetUrl);

  try {
    await emailService.passwordResetEmail(user, resetUrl);

    logger.info(`Password reset email sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error(`Error sending password reset email: ${error.message}`);
    return next(new ErrorResponse('Error sending password reset email', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  console.log('🔑 Password Reset Attempt:');
  console.log('Plain Token:', req.params.token);
  console.log('Hashed Token:', hashedToken);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  if (!user) {
    console.log('❌ Invalid or expired reset token');
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  console.log('✅ Valid reset token for:', user.email);

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  
  // Reset login attempts if account was locked
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  await user.save();

  logger.info(`Password reset successful for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  logger.info(`User profile updated: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  logger.info(`Password updated for user: ${user.email}`);

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// @desc    Logout user / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  logger.info(`User logged out: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: {},
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, message) => {
  // Create token
  const token = user.generateAuthToken();

  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: user,
    });
};