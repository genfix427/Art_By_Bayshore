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

  campaign.status = 'sending';
  await campaign.save();

  // Get recipients based on campaign settings
  let recipientQuery = { status: 'subscribed' };

  if (campaign.recipients === 'tags' && campaign.recipientTags.length > 0) {
    recipientQuery.tags = { $in: campaign.recipientTags };
  } else if (campaign.recipients === 'custom' && campaign.recipientEmails.length > 0) {
    recipientQuery.email = { $in: campaign.recipientEmails };
  }

  const subscribers = await Subscriber.find(recipientQuery);

  if (subscribers.length === 0) {
    campaign.status = 'failed';
    await campaign.save();
    return next(new ErrorResponse('No recipients found for this campaign', 400));
  }

  // Prepare emails
  const emails = subscribers.map(subscriber => {
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/newsletter/unsubscribe/${subscriber.unsubscribeToken}`;
    
    let personalizedHtml = campaign.content.html;
    personalizedHtml = personalizedHtml.replace(/{{firstName}}/g, subscriber.firstName || '');
    personalizedHtml = personalizedHtml.replace(/{{email}}/g, subscriber.email);
    personalizedHtml += `
      <hr style="margin-top: 30px;">
      <p style="font-size: 12px; color: #666;">
        You're receiving this email because you subscribed to ${process.env.COMPANY_NAME}.
        <br>
        <a href="${unsubscribeUrl}">Unsubscribe</a>
      </p>
    `;

    return {
      to: subscriber.email,
      from: {
        email: campaign.fromEmail,
        name: campaign.fromName,
      },
      subject: campaign.subject,
      html: personalizedHtml,
      text: campaign.content.text,
    };
  });

  // Send emails in batches
  const batchSize = 100;
  let sentCount = 0;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    try {
      await emailService.sendMultiple(batch);
      sentCount += batch.length;
    } catch (error) {
      logger.error(`Failed to send campaign batch: ${error.message}`);
    }
  }

  // Update campaign
  campaign.status = 'sent';
  campaign.sentAt = new Date();
  campaign.stats.totalSent = sentCount;
  campaign.stats.delivered = sentCount; // Will be updated by webhooks
  await campaign.save();

  logger.info(`Campaign sent: ${campaign.name} to ${sentCount} recipients by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: `Campaign sent successfully to ${sentCount} recipients`,
    data: campaign,
  });
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