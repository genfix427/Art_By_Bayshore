import Order from '../models/Order.js';
import Inquiry from '../models/Inquiry.js';
import { Subscriber } from '../models/Newsletter.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import logger from '../utils/logger.js';

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/v1/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  try {
    // Get current date and calculate date ranges
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // 1. ORDER STATISTICS
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const confirmedOrders = await Order.countDocuments({ orderStatus: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    const yesterdayOrders = await Order.countDocuments({
      createdAt: { 
        $gte: yesterday,
        $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Revenue calculations
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalPaidOrders: { $sum: 1 },
        },
      },
    ]);

    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid', 
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        } 
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
        },
      },
    ]);

    const yesterdayRevenue = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid', 
          orderStatus: { $ne: 'cancelled' },
          createdAt: { 
            $gte: yesterday,
            $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
          }
        } 
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
        },
      },
    ]);

    // 2. INQUIRY STATISTICS
    const totalInquiries = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: 'new' });
    const respondedInquiries = await Inquiry.countDocuments({ status: 'responded' });
    const convertedInquiries = await Inquiry.countDocuments({ status: 'converted' });
    const todayInquiries = await Inquiry.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    // 3. NEWSLETTER STATISTICS
    const totalSubscribers = await Subscriber.countDocuments({ status: 'subscribed' });
    const todaySubscribers = await Subscriber.countDocuments({
      status: 'subscribed',
      subscribedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    // 4. USER STATISTICS
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    // 5. PRODUCT STATISTICS
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const askForPriceProducts = await Product.countDocuments({ productType: 'ask-for-price' });
    const priceBasedProducts = await Product.countDocuments({ productType: 'price-based' });

    // 6. MONTHLY REVENUE DATA (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          averageValue: { $avg: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // Format monthly data for charts
    const formattedMonthlyData = monthlyRevenue.map(item => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      revenue: item.revenue,
      orders: item.orders,
      averageValue: item.averageValue,
    }));

    // 7. WEEKLY ORDERS (Last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $limit: 4 }
    ]);

    // 8. TOP SELLING PRODUCTS
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Populate product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await Product.findById(item._id).select('title images category');
        return {
          product: product || { title: 'Deleted Product' },
          totalQuantity: item.totalQuantity,
          totalRevenue: item.totalRevenue,
        };
      })
    );

    // 9. ORDER STATUS DISTRIBUTION
    const orderStatusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // 10. RECENT ACTIVITIES
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentInquiries = await Inquiry.find()
      .populate('product', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate percentage changes
    const orderChange = yesterdayOrders > 0 
      ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1)
      : todayOrders > 0 ? 100 : 0;

    const revenueChange = yesterdayRevenue[0]?.revenue > 0
      ? ((todayRevenue[0]?.revenue || 0 - yesterdayRevenue[0]?.revenue) / yesterdayRevenue[0]?.revenue * 100).toFixed(1)
      : todayRevenue[0]?.revenue > 0 ? 100 : 0;

    const stats = {
      summary: {
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        averageOrderValue: revenueData[0]?.averageOrderValue || 0,
        totalOrders,
        totalPaidOrders: revenueData[0]?.totalPaidOrders || 0,
        conversionRate: totalInquiries > 0 ? (convertedInquiries / totalInquiries * 100).toFixed(2) : 0,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        yesterday: yesterdayOrders,
        change: orderChange,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: revenueData[0]?.totalRevenue || 0,
        today: todayRevenue[0]?.revenue || 0,
        yesterday: yesterdayRevenue[0]?.revenue || 0,
        change: revenueChange,
      },
      inquiries: {
        total: totalInquiries,
        new: newInquiries,
        responded: respondedInquiries,
        converted: convertedInquiries,
        today: todayInquiries,
        conversionRate: totalInquiries > 0 ? (convertedInquiries / totalInquiries * 100).toFixed(2) : 0,
      },
      newsletter: {
        totalSubscribers,
        todaySubscribers,
      },
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        today: todayUsers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        askForPrice: askForPriceProducts,
        priceBased: priceBasedProducts,
      },
      charts: {
        monthlyRevenue: formattedMonthlyData,
        weeklyOrders,
      },
      analytics: {
        topProducts: topProductsWithDetails,
        orderStatusDistribution,
      },
      recentActivities: {
        orders: recentOrders,
        inquiries: recentInquiries,
      },
    };

    logger.info(`Dashboard stats fetched by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(`Dashboard stats error: ${error.message}`);
    return next(new ErrorResponse('Failed to fetch dashboard statistics', 500));
  }
});

// @desc    Get notification counts for dashboard
// @route   GET /api/v1/dashboard/notification-counts
// @access  Private/Admin
export const getNotificationCounts = asyncHandler(async (req, res, next) => {
  try {
    const unshippedOrders = await Order.countDocuments({ 
      orderStatus: { $in: ['pending', 'confirmed'] } 
    });

    const newInquiries = await Inquiry.countDocuments({ 
      status: 'new',
      isRead: false 
    });

    const newSubscribers = await Subscriber.countDocuments({
      status: 'subscribed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    res.status(200).json({
      success: true,
      data: {
        unshippedOrders,
        newInquiries,
        newSubscribers,
        total: unshippedOrders + newInquiries + newSubscribers,
      },
    });
  } catch (error) {
    logger.error(`Notification counts error: ${error.message}`);
    return next(new ErrorResponse('Failed to fetch notification counts', 500));
  }
});