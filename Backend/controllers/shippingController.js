import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import fedexService from '../config/fedex.js';
import Cart from '../models/Cart.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

// @desc    Validate shipping address
// @route   POST /api/v1/shipping/validate-address
// @access  Private
export const validateAddress = asyncHandler(async (req, res, next) => {
  const { addressLine1, addressLine2, city, state, zipCode, country } = req.body;

  const address = {
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode: zipCode.replace(/\s/g, ''), // Remove spaces
    country: country || 'US',
  };

  try {
    const validationResult = await fedexService.validateAddress(address);
    
    res.status(200).json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    logger.error('Address validation error:', error);
    return next(new ErrorResponse(error.message || 'Failed to validate address', 400));
  }
});

// @desc    Calculate shipping rates
// @route   POST /api/v1/shipping/calculate-rates
// @access  Private
export const calculateShippingRates = asyncHandler(async (req, res, next) => {
  const { toAddress } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'title price dimensions weight');

  if (!cart || cart.items.length === 0) {
    return next(new ErrorResponse('Cart is empty', 400));
  }

  // Prepare cart items for dimension calculation
  const cartItems = cart.items.map(item => ({
    quantity: item.quantity,
    price: item.price,
    dimensions: item.dimensions,
    weight: item.weight,
  }));

  // Calculate package dimensions based on cart items
  const packages = fedexService.calculatePackageDimensions(cartItems);

  // From address (your warehouse/store)
  const fromAddress = {
    fullName: process.env.COMPANY_NAME || 'Your Company',
    phoneNumber: process.env.SUPPORT_PHONE || '1234567890',
    addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || '123 Art Street',
    city: process.env.WAREHOUSE_CITY || 'New York',
    state: process.env.WAREHOUSE_STATE || 'NY',
    zipCode: process.env.WAREHOUSE_ZIP || '10001',
    country: 'US',
  };

  // Prepare destination address
  const destinationAddress = {
    fullName: toAddress.fullName,
    phoneNumber: toAddress.phoneNumber,
    addressLine1: toAddress.addressLine1,
    addressLine2: toAddress.addressLine2,
    city: toAddress.city,
    state: toAddress.state,
    zipCode: toAddress.zipCode.replace(/\s/g, ''),
    country: toAddress.country || 'US',
    residential: toAddress.residential !== false,
  };

  const shipmentDetails = {
    fromAddress,
    toAddress: destinationAddress,
    packages,
    shipDate: new Date().toISOString().split('T')[0],
  };

  try {
    const ratesResult = await fedexService.getShippingRates(shipmentDetails);

    if (!ratesResult.success) {
      return next(new ErrorResponse(ratesResult.error || 'Failed to calculate shipping rates', 400));
    }

    logger.info(`Shipping rates calculated for ${req.user.email}: ${ratesResult.options.length} options`);

    res.status(200).json({
      success: true,
      data: {
        packages,
        shippingOptions: ratesResult.options,
      },
    });
  } catch (error) {
    logger.error('Shipping rates calculation error:', error);
    return next(new ErrorResponse(error.message || 'Failed to calculate shipping rates', 400));
  }
});

// @desc    Get tracking information
// @route   GET /api/v1/shipping/track/:trackingNumber
// @access  Private
export const trackShipment = asyncHandler(async (req, res, next) => {
  const { trackingNumber } = req.params;

  if (!trackingNumber) {
    return next(new ErrorResponse('Tracking number is required', 400));
  }

  try {
    const trackingResult = await fedexService.trackShipment(trackingNumber);

    if (!trackingResult.success) {
      // In development mode, return mock data if FedEx API is not available
      if (process.env.NODE_ENV === 'development' && trackingResult.error?.includes('credentials')) {
        logger.warn(`FedEx API not configured. Returning mock tracking data for: ${trackingNumber}`);
        
        return res.status(200).json({
          success: true,
          data: {
            success: true,
            trackingNumber,
            status: 'In Transit',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
              {
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'Picked up',
                location: 'New York, NY',
                description: 'Shipment picked up from sender',
              },
              {
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'In transit',
                location: 'Philadelphia, PA',
                description: 'Package in transit to destination',
              },
              {
                timestamp: new Date().toISOString(),
                status: 'In transit',
                location: 'Baltimore, MD',
                description: 'Package at FedEx facility',
              },
            ],
            mock: true,
          },
        });
      }

      return next(new ErrorResponse(
        trackingResult.error || 'Failed to retrieve tracking information', 
        400
      ));
    }

    res.status(200).json({
      success: true,
      data: trackingResult,
    });
  } catch (error) {
    logger.error(`Tracking error for ${trackingNumber}:`, error);
    
    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Returning mock tracking data due to error');
      
      return res.status(200).json({
        success: true,
        data: {
          success: true,
          trackingNumber,
          status: 'In Transit',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          events: [
            {
              timestamp: new Date().toISOString(),
              status: 'Package information received',
              location: 'Origin Facility',
              description: 'Shipping label created',
            },
          ],
          mock: true,
        },
      });
    }

    return next(new ErrorResponse(error.message || 'Failed to track shipment', 400));
  }
});