import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  addToCartValidator,
  updateCartItemValidator,
} from '../validators/cartValidator.js';

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/items', validate(addToCartValidator), addToCart);
router.put('/items/:itemId', validate(updateCartItemValidator), updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);
router.post('/sync', syncCart);

export default router;