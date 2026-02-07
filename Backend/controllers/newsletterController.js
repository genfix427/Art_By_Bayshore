import { Subscriber, Campaign } from '../models/Newsletter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import emailService from '../config/sendgrid.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

// ==================== SUBSCRIBER ROUTES ====================

// @desc    Subscribe to newsletter
// @route   POST /api/v1/newsletter/subscribe
// @access  Public
export const subscribe = asyncHandler(async (req, res, next) => {
  const { email, firstName, lastName } = req.body;

  // Check if already subscribed
  let subscriber = await Subscriber.findOne({ email: email.toLowerCase() });

  if (subscriber) {
    if (subscriber.status === 'subscribed') {
      return next(new ErrorResponse('This email is already subscribed', 400));
    } else {
      // Resubscribe
      subscriber.status = 'subscribed';
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
    }
  } else {
    // Create new subscriber
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    
    subscriber = await Subscriber.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      unsubscribeToken,
      source: req.body.source || 'website',
    });
  }

  await subscriber.save();

  // Send confirmation email
  await emailService.newsletterSubscriptionEmail(subscriber);

  logger.info(`New newsletter subscription: ${email}`);

  res.status(201).json({
    success: true,
    message: 'Successfully subscribed to newsletter',
    data: { email: subscriber.email },
  });
});

// @desc    Unsubscribe from newsletter
// @route   GET /api/v1/newsletter/unsubscribe/:token
// @access  Public
export const unsubscribe = asyncHandler(async (req, res, next) => {
  const subscriber = await Subscriber.findOne({ 
    unsubscribeToken: req.params.token 
  });

  if (!subscriber) {
    return next(new ErrorResponse('Invalid unsubscribe link', 404));
  }

  subscriber.status = 'unsubscribed';
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();

  logger.info(`Newsletter unsubscribe: ${subscriber.email}`);

  res.status(200).json({
    success: true,
    message: 'Successfully unsubscribed from newsletter',
  });
});

// @desc    Get all subscribers
// @route   GET /api/v1/newsletter/subscribers
// @access  Private/Admin
export const getSubscribers = asyncHandler(async (req, res, next) => {
  const { page, limit, status, search } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Subscriber.countDocuments(query);
  const subscribers = await Subscriber.find(query)
    .sort({ subscribedAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: subscribers,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Update subscriber
// @route   PUT /api/v1/newsletter/subscribers/:id
// @access  Private/Admin
export const updateSubscriber = asyncHandler(async (req, res, next) => {
  let subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return next(new ErrorResponse('Subscriber not found', 404));
  }

  subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Subscriber updated successfully',
    data: subscriber,
  });
});

// @desc    Delete subscriber
// @route   DELETE /api/v1/newsletter/subscribers/:id
// @access  Private/Admin
export const deleteSubscriber = asyncHandler(async (req, res, next) => {
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return next(new ErrorResponse('Subscriber not found', 404));
  }

  await subscriber.deleteOne();

  logger.info(`Subscriber deleted: ${subscriber.email} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Subscriber deleted successfully',
    data: {},
  });
});

// ==================== CAMPAIGN ROUTES ====================

// @desc    Get all campaigns
// @route   GET /api/v1/newsletter/campaigns
// @access  Private/Admin
export const getCampaigns = asyncHandler(async (req, res, next) => {
  const { page, limit, status } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};
  if (status) query.status = status;

  const total = await Campaign.countDocuments(query);
  const campaigns = await Campaign.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: campaigns,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get single campaign
// @route   GET /api/v1/newsletter/campaigns/:id
// @access  Private/Admin
export const getCampaign = asyncHandler(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email');

  if (!campaign) {
    return next(new ErrorResponse('Campaign not found', 404));
  }

  res.status(200).json({
    success: true,
    data: campaign,
  });
});

// @desc    Create campaign
// @route   POST /api/v1/newsletter/campaigns
// @access  Private/Admin
export const createCampaign = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const campaign = await Campaign.create(req.body);

  logger.info(`Campaign created: ${campaign.name} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: campaign,
  });
});

// @desc    Update campaign
// @route   PUT /api/v1/newsletter/campaigns/:id
// @access  Private/Admin
export const updateCampaign = asyncHandler(async (req, res, next) => {
  let campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return next(new ErrorResponse('Campaign not found', 404));
  }

  if (campaign.status === 'sent') {
    return next(new ErrorResponse('Cannot update a campaign that has been sent', 400));
  }

  campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  logger.info(`Campaign updated: ${campaign.name} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Campaign updated successfully',
    data: campaign,
  });
});

// @desc    Send campaign
// @route   POST /api/v1/newsletter/campaigns/:id/send
// @access  Private/Admin
export const sendCampaign = asyncHandler(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return next(new ErrorResponse('Campaign not found', 404));
  }

  if (campaign.status === 'sent') {
    return next(new ErrorResponse('This campaign has already been sent', 400));
  }

  if (campaign.status === 'sending') {
    return next(new ErrorResponse('This campaign is currently being sent', 400));
  }

  // Update campaign status to "sending"
  campaign.status = 'sending';
  await campaign.save();

  try {
    // Get recipients based on campaign settings
    let recipientQuery = { status: 'subscribed' };

    if (campaign.recipients === 'tags' && campaign.recipientTags.length > 0) {
      recipientQuery.tags = { $in: campaign.recipientTags };
    } else if (campaign.recipients === 'custom' && campaign.recipientEmails.length > 0) {
      recipientQuery.email = { $in: campaign.recipientEmails };
    }

    const subscribers = await Subscriber.find(recipientQuery)
      .select('email firstName lastName unsubscribeToken');

    console.log(`Found ${subscribers.length} subscribers to send to`);

    if (subscribers.length === 0) {
      campaign.status = 'failed';
      campaign.error = 'No recipients found';
      await campaign.save();
      return next(new ErrorResponse('No recipients found for this campaign', 400));
    }

    // Send campaign using email service
    const result = await emailService.sendNewsletterCampaign(campaign, subscribers);

    console.log('Campaign sending result:', result);

    // Update campaign stats
    if (result.sentCount > 0) {
      campaign.status = result.failedCount === 0 ? 'sent' : 'partial';
      campaign.stats = {
        totalSent: result.sentCount,
        delivered: result.sentCount,
        opened: 0,
        clicked: 0,
        bounced: result.failedCount,
        unsubscribed: 0,
      };
      campaign.sentAt = new Date();
      
      if (result.failedCount > 0) {
        campaign.error = `Failed to send to ${result.failedCount} emails`;
        campaign.failedEmails = result.failedEmails;
      }
    } else {
      campaign.status = 'failed';
      campaign.error = 'No emails were sent successfully';
    }
    
    await campaign.save();

    logger.info(
      `Campaign sent: ${campaign.name} - ${result.sentCount} sent, ${result.failedCount} failed`
    );

    res.status(200).json({
      success: true,
      message: result.failedCount === 0 
        ? `Campaign sent successfully to ${result.sentCount} recipients`
        : `Campaign partially sent. ${result.sentCount} sent, ${result.failedCount} failed`,
      data: {
        campaign,
        stats: {
          sent: result.sentCount,
          failed: result.failedCount,
          failedEmails: result.failedEmails,
        },
      },
    });

  } catch (error) {
    // Update campaign status to failed
    campaign.status = 'failed';
    campaign.error = error.message;
    await campaign.save();

    console.error('Campaign send error:', error);
    logger.error(`Campaign send failed: ${error.message}`);
    return next(new ErrorResponse(`Failed to send campaign: ${error.message}`, 500));
  }
});

// @desc    Delete campaign
// @route   DELETE /api/v1/newsletter/campaigns/:id
// @access  Private/Admin
export const deleteCampaign = asyncHandler(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return next(new ErrorResponse('Campaign not found', 404));
  }

  await campaign.deleteOne();

  logger.info(`Campaign deleted: ${campaign.name} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Campaign deleted successfully',
    data: {},
  });
});

// @desc    Get newsletter statistics
// @route   GET /api/v1/newsletter/stats
// @access  Private/Admin
export const getNewsletterStats = asyncHandler(async (req, res, next) => {
  const totalSubscribers = await Subscriber.countDocuments({ status: 'subscribed' });
  const totalUnsubscribed = await Subscriber.countDocuments({ status: 'unsubscribed' });
  const totalCampaigns = await Campaign.countDocuments({ status: 'sent' });

  const campaignStats = await Campaign.aggregate([
    { $match: { status: 'sent' } },
    {
      $group: {
        _id: null,
        totalSent: { $sum: '$stats.totalSent' },
        totalOpened: { $sum: '$stats.opened' },
        totalClicked: { $sum: '$stats.clicked' },
      },
    },
  ]);

  const stats = {
    subscribers: {
      active: totalSubscribers,
      unsubscribed: totalUnsubscribed,
      total: totalSubscribers + totalUnsubscribed,
    },
    campaigns: {
      total: totalCampaigns,
      totalEmailsSent: campaignStats[0]?.totalSent || 0,
      averageOpenRate: campaignStats[0]?.totalSent > 0 
        ? ((campaignStats[0].totalOpened / campaignStats[0].totalSent) * 100).toFixed(2)
        : 0,
      averageClickRate: campaignStats[0]?.totalSent > 0
        ? ((campaignStats[0].totalClicked / campaignStats[0].totalSent) * 100).toFixed(2)
        : 0,
    },
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Add subscriber manually (Admin)
// @route   POST /api/v1/newsletter/subscribers
// @access  Private/Admin
export const addSubscriber = asyncHandler(async (req, res, next) => {
  const { email, firstName, lastName, tags, source } = req.body;

  // Check if already exists
  let subscriber = await Subscriber.findOne({ email: email.toLowerCase() });

  if (subscriber) {
    if (subscriber.status === 'subscribed') {
      return next(new ErrorResponse('This email is already subscribed', 400));
    } else {
      // Reactivate
      subscriber.status = 'subscribed';
      subscriber.firstName = firstName || subscriber.firstName;
      subscriber.lastName = lastName || subscriber.lastName;
      subscriber.tags = tags || subscriber.tags;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
    }
  } else {
    // Create new subscriber
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    
    subscriber = new Subscriber({
      email: email.toLowerCase(),
      firstName,
      lastName,
      tags: tags || [],
      unsubscribeToken,
      source: source || 'admin',
      status: 'subscribed',
    });
  }

  await subscriber.save();

  logger.info(`Subscriber added manually: ${email} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Subscriber added successfully',
    data: subscriber,
  });
});

// @desc    Export subscribers
// @route   GET /api/v1/newsletter/subscribers/export
// @access  Private/Admin
export const exportSubscribers = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  
  const query = {};
  if (status) query.status = status;

  const subscribers = await Subscriber.find(query)
    .select('email firstName lastName status tags subscribedAt source')
    .sort({ subscribedAt: -1 });

  // Convert to CSV format
  const headers = ['Email', 'First Name', 'Last Name', 'Status', 'Subscribed At', 'Source', 'Tags'];
  
  const csvRows = subscribers.map(subscriber => {
    const row = [
      subscriber.email,
      subscriber.firstName || '',
      subscriber.lastName || '',
      subscriber.status,
      new Date(subscriber.subscribedAt).toISOString(),
      subscriber.source || 'website',
      (subscriber.tags || []).join(';')
    ];
    
    // Escape commas and quotes
    return row.map(field => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    }).join(',');
  });

  const csvContent = [headers.join(','), ...csvRows].join('\n');

  // Set response headers for file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=subscribers_export_${Date.now()}.csv`);
  
  res.send(csvContent);
});

// @desc    Bulk add subscribers
// @route   POST /api/v1/newsletter/subscribers/bulk
// @access  Private/Admin
export const bulkAddSubscribers = asyncHandler(async (req, res, next) => {
  const { subscribers } = req.body;

  if (!Array.isArray(subscribers) || subscribers.length === 0) {
    return next(new ErrorResponse('Please provide an array of subscribers', 400));
  }

  const results = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const sub of subscribers) {
    try {
      const email = sub.email?.toLowerCase()?.trim();
      
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.errors.push({ email: sub.email || 'unknown', error: 'Invalid email format' });
        results.skipped++;
        continue;
      }

      // Check if subscriber exists
      let subscriber = await Subscriber.findOne({ email });

      if (subscriber) {
        if (subscriber.status === 'subscribed') {
          results.skipped++;
        } else {
          // Reactivate unsubscribed user
          subscriber.status = 'subscribed';
          subscriber.firstName = sub.firstName || subscriber.firstName;
          subscriber.lastName = sub.lastName || subscriber.lastName;
          subscriber.subscribedAt = new Date();
          subscriber.unsubscribedAt = undefined;
          await subscriber.save();
          results.updated++;
        }
      } else {
        // Create new subscriber
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        await Subscriber.create({
          email,
          firstName: sub.firstName || '',
          lastName: sub.lastName || '',
          tags: sub.tags || [],
          unsubscribeToken,
          source: sub.source || 'admin_bulk',
          status: 'subscribed',
        });
        results.added++;
      }
    } catch (error) {
      results.errors.push({ email: sub.email || 'unknown', error: error.message });
      results.skipped++;
    }
  }

  logger.info(
    `Bulk subscribers import: ${results.added} added, ${results.updated} updated, ${results.skipped} skipped by ${req.user.email}`
  );

  res.status(200).json({
    success: true,
    message: 'Bulk import completed',
    data: results,
  });
});