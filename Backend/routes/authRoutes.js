import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendVerificationValidator,
} from '../validators/authValidator.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', validate(resendVerificationValidator), resendVerificationEmail);
router.post('/forgot-password', validate(forgotPasswordValidator), forgotPassword);
router.put('/reset-password/:token', validate(resetPasswordValidator), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, validate(updatePasswordValidator), updatePassword);
router.post('/logout', protect, logout);

export default router;