import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserVerification,
  deleteUser,
  toggleUserStatus,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  updateUserRoleValidator,
  getUserByIdValidator,
} from '../validators/adminValidator.js';

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', validate(getUserByIdValidator), getUserById);
router.put('/users/:id/role', validate(updateUserRoleValidator), updateUserRole);
router.put('/users/:id/verify', toggleUserVerification);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

export default router;