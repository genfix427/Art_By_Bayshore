import express from 'express';
import {
  validateAddress,
  calculateShippingRates,
  trackShipment,
} from '../controllers/shippingController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  validateAddressValidator,
  calculateRatesValidator,
} from '../validators/shippingValidator.js';

const router = express.Router();

router.use(protect);

router.post('/validate-address', validateAddressValidator, validate, validateAddress);
router.post('/calculate-rates', calculateRatesValidator, validate, calculateShippingRates);
router.get('/track/:trackingNumber', trackShipment);

export default router;