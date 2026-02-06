import express from 'express';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  addSubscriber,
  bulkAddSubscribers,
  exportSubscribers,
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
  addSubscriberValidator,
  bulkAddSubscribersValidator,
  createCampaignValidator,
} from '../validators/newsletterValidator.js';

const router = express.Router();

// Public routes
router.post('/subscribe', validate(subscribeValidator), subscribe);
router.get('/unsubscribe/:token', unsubscribe);

// Admin routes - Statistics
router.get(
  '/stats',
  protect,
  authorize('admin', 'superadmin'),
  getNewsletterStats
);

// Admin routes - Subscribers
router.get(
  '/subscribers',
  protect,
  authorize('admin', 'superadmin'),
  getSubscribers
);

router.post(
  '/subscribers',
  protect,
  authorize('admin', 'superadmin'),
  validate(addSubscriberValidator),
  addSubscriber
);

router.post(
  '/subscribers/bulk',
  protect,
  authorize('admin', 'superadmin'),
  validate(bulkAddSubscribersValidator),
  bulkAddSubscribers
);

router.get(
  '/subscribers/export',
  protect,
  authorize('admin', 'superadmin'),
  exportSubscribers
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
  validate(createCampaignValidator),
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

export default router;