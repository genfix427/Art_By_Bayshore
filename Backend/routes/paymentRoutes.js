import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  createSetupIntent,
  getPaymentStatus,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createPaymentIntentValidator,
  confirmPaymentValidator,
} from '../validators/paymentValidator.js';

const router = express.Router();

router.use(protect);

// FIX: Pass validators TO the validate function
router.post('/create-intent', validate(createPaymentIntentValidator), createPaymentIntent);
router.post('/confirm', validate(confirmPaymentValidator), confirmPayment);
router.get('/methods', getPaymentMethods);
router.post('/setup-intent', createSetupIntent);
router.get('/status/:paymentIntentId', getPaymentStatus);

export default router;