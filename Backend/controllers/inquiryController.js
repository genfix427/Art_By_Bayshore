import Inquiry from '../models/Inquiry.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import emailService from '../config/sendgrid.js';
import logger from '../utils/logger.js';

// @desc    Get all inquiries
// @route   GET /api/v1/inquiries
// @access  Private/Admin
export const getInquiries = asyncHandler(async (req, res, next) => {
  const { page, limit, status, priority, search } = req.query;
  const { currentPage, pageSize, skip } = getPagination(page, limit);

  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) {
    query.$or = [
      { inquiryNumber: { $regex: search, $options: 'i' } },
      { 'customerInfo.email': { $regex: search, $options: 'i' } },
      { 'customerInfo.firstName': { $regex: search, $options: 'i' } },
      { 'customerInfo.lastName': { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Inquiry.countDocuments(query);
  const inquiries = await Inquiry.find(query)
    .populate('product', 'title images price productType')
    .populate('user', 'firstName lastName email')
    .populate('adminResponse.respondedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  res.status(200).json({
    success: true,
    data: inquiries,
    pagination: getPaginationMeta(total, currentPage, pageSize),
  });
});

// @desc    Get single inquiry
// @route   GET /api/v1/inquiries/:id
// @access  Private/Admin or Owner
export const getInquiry = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('product', 'title images price productType artist category')
    .populate('user', 'firstName lastName email phoneNumber')
    .populate('adminResponse.respondedBy', 'firstName lastName email')
    .populate('notes.addedBy', 'firstName lastName')
    .populate('convertedToOrder');

  if (!inquiry) {
    return next(new ErrorResponse('Inquiry not found', 404));
  }

  // Check authorization (admin or inquiry owner)
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    if (!inquiry.user || inquiry.user._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to access this inquiry', 403));
    }
  }

  // Mark as read if admin is viewing
  if ((req.user.role === 'admin' || req.user.role === 'superadmin') && !inquiry.isRead) {
    inquiry.isRead = true;
    await inquiry.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    data: inquiry,
  });
});

// @desc    Create inquiry (Ask for Price)
// @route   POST /api/v1/inquiries
// @access  Public
export const createInquiry = asyncHandler(async (req, res, next) => {
  const { productId, firstName, lastName, email, phoneNumber, message } = req.body;

  // Verify product exists and is ask-for-price type
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (product.productType !== 'ask-for-price') {
    return next(new ErrorResponse('This product does not support price inquiries', 400));
  }

  const inquiryData = {
    product: productId,
    customerInfo: {
      firstName,
      lastName,
      email,
      phoneNumber,
    },
    message,
  };

  // Link to user if authenticated
  if (req.user) {
    inquiryData.user = req.user.id;
  }

  const inquiry = await Inquiry.create(inquiryData);

  // Send confirmation email to customer
  await emailService.inquiryConfirmationEmail(inquiry, product);

  // Send notification email to admin
  await emailService.adminInquiryNotification(inquiry, product);

  logger.info(`New inquiry created: ${inquiry.inquiryNumber} for product: ${product.title}`);

  res.status(201).json({
    success: true,
    message: 'Your inquiry has been submitted successfully. We will respond soon.',
    data: inquiry,
  });
});

// @desc    Update inquiry status
// @route   PUT /api/v1/inquiries/:id/status
// @access  Private/Admin
export const updateInquiryStatus = asyncHandler(async (req, res, next) => {
  const { status, priority, quotedPrice } = req.body;

  let inquiry = await Inquiry.findById(req.params.id);

  if (!inquiry) {
    return next(new ErrorResponse('Inquiry not found', 404));
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  if (quotedPrice !== undefined) updateData.quotedPrice = quotedPrice;

  inquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  logger.info(`Inquiry ${inquiry.inquiryNumber} status updated by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Inquiry updated successfully',
    data: inquiry,
  });
});

// @desc    Respond to inquiry
// @route   POST /api/v1/inquiries/:id/respond
// @access  Private/Admin
export const respondToInquiry = asyncHandler(async (req, res, next) => {
  const { message, quotedPrice } = req.body;

  let inquiry = await Inquiry.findById(req.params.id).populate('product');

  if (!inquiry) {
    return next(new ErrorResponse('Inquiry not found', 404));
  }

  inquiry.adminResponse = {
    message,
    respondedBy: req.user.id,
    respondedAt: new Date(),
  };

  if (quotedPrice) {
    inquiry.quotedPrice = quotedPrice;
  }

  inquiry.status = 'responded';

  await inquiry.save();

  // Send response email to customer
  const emailResult = await emailService.inquiryResponseEmail(inquiry, message);

  if (emailResult.success) {
    inquiry.emailsSent.push({
      type: 'response',
      sentAt: new Date(),
      success: true,
    });
    await inquiry.save({ validateBeforeSave: false });
  }

  logger.info(`Response sent for inquiry ${inquiry.inquiryNumber} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Response sent successfully',
    data: inquiry,
  });
});

// @desc    Add note to inquiry
// @route   POST /api/v1/inquiries/:id/notes
// @access  Private/Admin
export const addInquiryNote = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.findById(req.params.id);

  if (!inquiry) {
    return next(new ErrorResponse('Inquiry not found', 404));
  }

  inquiry.notes.push({
    content: req.body.note,
    addedBy: req.user.id,
    addedAt: new Date(),
  });

  await inquiry.save();

  logger.info(`Note added to inquiry ${inquiry.inquiryNumber} by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Note added successfully',
    data: inquiry,
  });
});

// @desc    Delete inquiry
// @route   DELETE /api/v1/inquiries/:id
// @access  Private/Admin
export const deleteInquiry = asyncHandler(async (req, res, next) => {
  const inquiry = await Inquiry.findById(req.params.id);

  if (!inquiry) {
    return next(new ErrorResponse('Inquiry not found', 404));
  }

  await inquiry.deleteOne();

  logger.info(`Inquiry ${inquiry.inquiryNumber} deleted by ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Inquiry deleted successfully',
    data: {},
  });
});

// @desc    Get inquiry statistics
// @route   GET /api/v1/inquiries/stats/overview
// @access  Private/Admin
export const getInquiryStats = asyncHandler(async (req, res, next) => {
  const total = await Inquiry.countDocuments();
  const newCount = await Inquiry.countDocuments({ status: 'new' });
  const respondedCount = await Inquiry.countDocuments({ status: 'responded' });
  const convertedCount = await Inquiry.countDocuments({ status: 'converted' });

  const avgResponseTime = await Inquiry.aggregate([
    {
      $match: {
        'adminResponse.respondedAt': { $exists: true },
      },
    },
    {
      $project: {
        responseTime: {
          $subtract: ['$adminResponse.respondedAt', '$createdAt'],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$responseTime' },
      },
    },
  ]);

  const stats = {
    total,
    new: newCount,
    responded: respondedCount,
    converted: convertedCount,
    conversionRate: total > 0 ? ((convertedCount / total) * 100).toFixed(2) : 0,
    avgResponseTimeHours: avgResponseTime.length > 0 
      ? (avgResponseTime[0].avgTime / (1000 * 60 * 60)).toFixed(2) 
      : 0,
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});