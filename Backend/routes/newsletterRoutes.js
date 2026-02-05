import express from 'express';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  updateSubscriber,
  deleteSubscriber,
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  deleteCampaign,
  getNewsletterStats,
} from '../controllers/newsletterController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  subscribeValidator,
  createCampaignValidator,
} from '../validators/newsletterValidator.js';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribeValidator, validate, subscribe);
router.get('/unsubscribe/:token', unsubscribe);

// Admin routes - Subscribers
router.get(
  '/subscribers',
  protect,
  authorize('admin', 'superadmin'),
  getSubscribers
);

router.put(
  '/subscribers/:id',
  protect,
  authorize('admin', 'superadmin'),
  updateSubscriber
);

router.delete(
  '/subscribers/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteSubscriber
);

// Admin routes - Campaigns
router.get(
  '/campaigns',
  protect,
  authorize('admin', 'superadmin'),
  getCampaigns
);

router.get(
  '/campaigns/:id',
  protect,
  authorize('admin', 'superadmin'),
  getCampaign
);

router.post(
  '/campaigns',
  protect,
  authorize('admin', 'superadmin'),
  createCampaignValidator,
  validate,
  createCampaign
);

router.put(
  '/campaigns/:id',
  protect,
  authorize('admin', 'superadmin'),
  updateCampaign
);

router.post(
  '/campaigns/:id/send',
  protect,
  authorize('admin', 'superadmin'),
  sendCampaign
);

router.delete(
  '/campaigns/:id',
  protect,
  authorize('admin', 'superadmin'),
  deleteCampaign
);

// Statistics
router.get(
  '/stats',
  protect,
  authorize('admin', 'superadmin'),
  getNewsletterStats
);

export default router;