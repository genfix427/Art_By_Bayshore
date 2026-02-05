import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  createSetupIntent,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createPaymentIntentValidator,
  confirmPaymentValidator,
} from '../validators/paymentValidator.js';

const router = express.Router();

router.use(protect);

router.post('/create-intent', createPaymentIntentValidator, validate, createPaymentIntent);
router.post('/confirm', confirmPaymentValidator, validate, confirmPayment);
router.get('/methods', getPaymentMethods);
router.post('/setup-intent', createSetupIntent);

export default router;