// routes/wishlistRoutes.js
import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
  getWishlistCount,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { addToWishlistValidator } from '../validators/wishlistValidator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.get('/count', getWishlistCount);
router.get('/check/:productId', checkWishlist);
router.post('/', validate(addToWishlistValidator), addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.delete('/', clearWishlist);

export default router;