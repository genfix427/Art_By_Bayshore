import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

class FedExService {
  constructor() {
    this.mode = process.env.FEDEX_MODE || 'sandbox';
    this.baseURL = this.mode === 'production'
      ? process.env.FEDEX_API_URL_PRODUCTION || 'https://apis.fedex.com'
      : process.env.FEDEX_API_URL_SANDBOX || 'https://apis-sandbox.fedex.com';

    this.apiKey = process.env.FEDEX_API_KEY;
    this.secretKey = process.env.FEDEX_SECRET_KEY;
    this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
    this.meterNumber = process.env.FEDEX_METER_NUMBER;

    if (!this.apiKey || !this.secretKey || !this.accountNumber) {
      throw new Error('FedEx configuration missing in environment variables');
    }

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async requestWithRetry(config, retries = 3) {
    try {
      const response = await axios({
        timeout: 10000, // ⏱️ prevent hanging requests
        ...config,
      });

      return response;

    } catch (error) {
      const status = error.response?.status;

      const isRetryable =
        !status || // network error
        status >= 500 || // server error
        status === 429; // rate limit

      if (retries > 0 && isRetryable) {
        const delay = (4 - retries) * 1000; // exponential delay

        logger.warn(`FedEx retry (${3 - retries + 1}/3) after ${delay}ms`, {
          url: config.url,
          status,
          error: error.message,
        });

        await new Promise(res => setTimeout(res, delay));

        return this.requestWithRetry(config, retries - 1);
      }

      logger.error('FedEx request failed permanently', {
        url: config.url,
        status,
        error: error.message,
      });

      throw error;
    }
  }

  // OAuth 2.0 Authentication
  async authenticate() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      logger.info('Authenticating with FedEx API...');

      const response = await this.requestWithRetry({
        method: 'POST',
        url: `${this.baseURL}/oauth/token`,
        data: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.secretKey,
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.data?.access_token) {
        throw new Error('FedEx did not return access token');
      }

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      logger.info('FedEx authentication successful');
      return this.accessToken;
    } catch (error) {
      logger.error(`FedEx authentication failed: ${error.message}`);
      throw new Error(`FedEx authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  // Address Validation
  async validateAddress(address) {
    try {
      const token = await this.authenticate();

      const payload = {
        addressesToValidate: [
          {
            address: {
              streetLines: [
                address.addressLine1,
                address.addressLine2 || '',
              ].filter(Boolean),
              city: address.city,
              stateOrProvinceCode: address.state,
              postalCode: address.zipCode,
              countryCode: address.country || 'US',
            },
          },
        ],
      };

      const response = await this.requestWithRetry({
        method: 'POST',
        url: `${this.baseURL}/address/v1/addresses/resolve`,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
      });

      const result = response.data.output.resolvedAddresses[0];

      logger.info(`Address validation completed for ${address.city}, ${address.state}`);

      return {
        isValid: result.classification === 'BUSINESS' || result.classification === 'RESIDENTIAL' || result.classification === 'UNKNOWN',
        classification: result.classification || 'UNKNOWN',
        resolvedAddress: result.resolvedAddress || null,
        attributes: result.attributes || [],
        parsedAddress: result.parsedAddress || null,
      };
    } catch (error) {
      logger.error(`Address validation failed: ${error.message}`);

      // Return validation result even on error
      return {
        isValid: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
        classification: 'UNKNOWN',
      };
    }
  }

  // Calculate shipping rates based on dimensions, weight, and addresses
  /**
   * Calculate shipping rates with production-grade handling
   */
  async getShippingRates(shipmentDetails) {
    try {
      // ===================================
      // STEP 1: Validate Input
      // ===================================
      if (
        !shipmentDetails ||
        !shipmentDetails.fromAddress ||
        !shipmentDetails.toAddress ||
        !Array.isArray(shipmentDetails.packages) ||
        shipmentDetails.packages.length === 0
      ) {
        return {
          success: false,
          error: 'Missing required shipment details',
          options: [],
        };
      }

      const token = await this.authenticate();

      const { fromAddress, toAddress, packages, shipDate } = shipmentDetails;

      // ===================================
      // STEP 2: Prepare Package Data
      // ===================================
      const requestedPackageLineItems = packages.map((pkg, index) => {
        if (!pkg.weight || !pkg.dimensions) {
          throw new Error(`Package ${index + 1} missing weight or dimensions`);
        }

        return {
          groupPackageCount: 1,
          weight: {
            units: pkg.weight.unit?.toUpperCase() === 'KG' ? 'KG' : 'LB',
            value: pkg.weight.value,
          },
          dimensions: {
            length: Math.ceil(pkg.dimensions.length),
            width: Math.ceil(pkg.dimensions.width),
            height: Math.ceil(pkg.dimensions.height),
            units: pkg.dimensions.unit?.toUpperCase() === 'CM' ? 'CM' : 'IN',
          },
          insuredValue: {
            currency: 'USD',
            amount: pkg.insuredValue || 100,
          },
        };
      });

      // ===================================
      // STEP 3: Build Payload
      // ===================================
      const payload = {
        accountNumber: {
          value: this.accountNumber,
        },
        requestedShipment: {
          shipper: {
            address: {
              streetLines: [fromAddress.addressLine1],
              city: fromAddress.city,
              stateOrProvinceCode: fromAddress.state,
              postalCode: fromAddress.zipCode,
              countryCode: fromAddress.country || 'US',
            },
          },
          recipient: {
            address: {
              streetLines: [toAddress.addressLine1],
              city: toAddress.city,
              stateOrProvinceCode: toAddress.state,
              postalCode: toAddress.zipCode,
              countryCode: toAddress.country || 'US',
              residential: toAddress.residential !== false,
            },
          },
          pickupType: 'USE_SCHEDULED_PICKUP',
          rateRequestType: ['ACCOUNT', 'LIST'],
          requestedPackageLineItems,
          shipDateStamp: shipDate || new Date().toISOString().split('T')[0],
        },
      };

      // ===================================
      // STEP 4: API CALL
      // ===================================
      const response = await this.requestWithRetry({
        method: 'POST',
        url: `${this.baseURL}/rate/v1/rates/quotes`,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
      });

      const rateReplyDetails = response.data?.output?.rateReplyDetails || [];

      if (!rateReplyDetails.length) {
        logger.warn('No shipping rates returned from FedEx', {
          destination: `${toAddress.city}, ${toAddress.state}`,
        });

        return {
          success: true,
          options: [],
          message: 'No shipping options available',
        };
      }

      // ===================================
      // STEP 5: Parse Rates
      // ===================================
      const shippingOptions = rateReplyDetails
        .filter(rate => rate?.ratedShipmentDetails?.length > 0)
        .map(rate => {
          const shipmentDetail = rate.ratedShipmentDetails[0];

          const totalNetCharge =
            shipmentDetail?.totalNetCharge ||
            shipmentDetail?.shipmentRateDetail?.totalNetCharge ||
            0;

          return {
            serviceType: rate.serviceType,
            serviceName: this.getServiceName(rate.serviceType),

            totalCharge: parseFloat(totalNetCharge) || 0,
            currency: shipmentDetail?.currency || 'USD',

            // Delivery Info
            deliveryDate:
              rate.commit?.dateDetail?.dateTime || null,

            deliveryDay:
              rate.commit?.dateDetail?.dayFormat || null,

            transitDays: rate.commit?.transitDays || null,

            // Cost Breakdown
            rateDetail: {
              baseCharge: shipmentDetail?.totalBaseCharge || 0,
              surcharges:
                shipmentDetail?.shipmentRateDetail?.totalSurcharges || 0,
              taxes:
                shipmentDetail?.shipmentRateDetail?.totalTaxes || 0,
            },

            // Raw fallback data (optional debugging)
            raw: process.env.NODE_ENV === 'development' ? rate : undefined,
          };
        })
        .sort((a, b) => a.totalCharge - b.totalCharge);

      logger.info('Shipping rates calculated successfully', {
        destination: `${toAddress.city}, ${toAddress.state}`,
        optionsCount: shippingOptions.length,
        cheapest: shippingOptions[0]?.totalCharge,
      });

      return {
        success: true,
        options: shippingOptions,
        cheapest: shippingOptions[0] || null,
        fastest:
          shippingOptions.find(opt => opt.transitDays === 1) ||
          shippingOptions[0] ||
          null,
        packageCount: packages.length,
      };

    } catch (error) {
      logger.error('Shipping rate calculation failed', {
        error: error.message,
        destination: shipmentDetails?.toAddress
          ? `${shipmentDetails.toAddress.city}, ${shipmentDetails.toAddress.state}`
          : 'Unknown',
      });

      return {
        success: false,
        error:
          error.response?.data?.errors?.[0]?.message ||
          error.message ||
          'Failed to fetch shipping rates',
        options: [],
      };
    }
  }

  // Create shipment and generate label
  async createShipment(shipmentData) {
    try {
      const token = await this.authenticate();

      const {
        fromAddress,
        toAddress,
        packages,
        serviceType,
        shipDate,
        reference,
        cartValue = 100, // 👈 IMPORTANT for insurance
      } = shipmentData;

      // ===================================
      // STEP 1: Validate Input
      // ===================================
      if (!fromAddress || !toAddress || !packages || packages.length === 0) {
        return {
          success: false,
          error: 'Missing required shipment data',
        };
      }

      // ===================================
      // STEP 2: Prepare Packages
      // ===================================
      const requestedPackageLineItems = packages.map((pkg, index) => {
        if (!pkg.weight || !pkg.dimensions) {
          throw new Error(`Package ${index + 1} missing weight or dimensions`);
        }

        return {
          weight: {
            units: pkg.weight.unit?.toUpperCase() === 'KG' ? 'KG' : 'LB',
            value: pkg.weight.value,
          },
          dimensions: {
            length: Math.ceil(pkg.dimensions.length),
            width: Math.ceil(pkg.dimensions.width),
            height: Math.ceil(pkg.dimensions.height),
            units: pkg.dimensions.unit?.toUpperCase() === 'CM' ? 'CM' : 'IN',
          },
          customerReferences: [
            {
              customerReferenceType: 'CUSTOMER_REFERENCE',
              value: reference || 'ORDER',
            },
          ],
        };
      });

      // ===================================
      // STEP 3: Add Smart Protection Logic
      // ===================================

      // 🔐 Signature required for high-value orders
      const requireSignature = cartValue >= 200; // you can change threshold

      // 🛡️ Insurance amount
      const insuranceAmount = Math.max(cartValue, 100);

      const shipmentSpecialServices = {
        specialServiceTypes: [],
      };

      // Add Signature
      if (requireSignature) {
        shipmentSpecialServices.specialServiceTypes.push('SIGNATURE_OPTION');
        shipmentSpecialServices.signatureOptionDetail = {
          optionType: 'DIRECT', // or 'ADULT'
        };
      }

      // Add Insurance
      shipmentSpecialServices.specialServiceTypes.push('INSURANCE');
      shipmentSpecialServices.insuranceDetail = {
        insuredValue: {
          currency: 'USD',
          amount: insuranceAmount,
        },
      };

      // ===================================
      // STEP 4: Build Payload
      // ===================================
      const payload = {
        labelResponseOptions: 'URL_ONLY',
        requestedShipment: {
          shipper: {
            contact: {
              personName: fromAddress.fullName,
              phoneNumber: fromAddress.phoneNumber,
              companyName: process.env.COMPANY_NAME,
            },
            address: {
              streetLines: [fromAddress.addressLine1, fromAddress.addressLine2].filter(Boolean),
              city: fromAddress.city,
              stateOrProvinceCode: fromAddress.state,
              postalCode: fromAddress.zipCode,
              countryCode: fromAddress.country || 'US',
            },
          },
          recipients: [
            {
              contact: {
                personName: toAddress.fullName,
                phoneNumber: toAddress.phoneNumber,
                emailAddress: toAddress.email,
              },
              address: {
                streetLines: [toAddress.addressLine1, toAddress.addressLine2].filter(Boolean),
                city: toAddress.city,
                stateOrProvinceCode: toAddress.state,
                postalCode: toAddress.zipCode,
                countryCode: toAddress.country || 'US',
                residential: toAddress.residential !== false,
              },
            },
          ],
          shipDatestamp: shipDate || new Date().toISOString().split('T')[0],
          serviceType: serviceType || 'FEDEX_GROUND',
          packagingType: 'YOUR_PACKAGING',
          pickupType: 'USE_SCHEDULED_PICKUP',
          blockInsightVisibility: false,

          shippingChargesPayment: {
            paymentType: 'SENDER',
          },

          // ✅ PROTECTION ADDED HERE
          shipmentSpecialServices,

          labelSpecification: {
            imageType: 'PDF',
            labelStockType: 'PAPER_85X11_TOP_HALF_LABEL',
          },

          requestedPackageLineItems,
        },
        accountNumber: {
          value: this.accountNumber,
        },
      };

      // ===================================
      // STEP 5: API CALL (WITH RETRY)
      // ===================================
      const response = await this.requestWithRetry({
        method: 'POST',
        url: `${this.baseURL}/ship/v1/shipments`,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
      });

      // ===================================
      // STEP 6: Safe Parsing
      // ===================================
      const shipmentOutput = response.data?.output?.transactionShipments?.[0];
      const packageDetails = shipmentOutput?.pieceResponses?.[0];

      if (!shipmentOutput || !packageDetails) {
        throw new Error('Invalid FedEx shipment response');
      }

      const trackingNumber = packageDetails.trackingNumber;
      const labelUrl = packageDetails.packageDocuments?.[0]?.url || null;

      logger.info('✅ Shipment created', {
        trackingNumber,
        service: shipmentOutput.serviceType,
        insured: insuranceAmount,
        signatureRequired: requireSignature,
      });

      return {
        success: true,
        trackingNumber,
        masterId: shipmentOutput.masterTrackingNumber || trackingNumber,
        labelUrl,
        serviceType: shipmentOutput.serviceType,
        serviceName: this.getServiceName(shipmentOutput.serviceType),
        shipDate: shipmentOutput.shipDatestamp,
        insuredValue: insuranceAmount,
        signatureRequired: requireSignature,
      };

    } catch (error) {
      logger.error('Shipment creation failed', {
        error: error.message,
      });

      return {
        success: false,
        error:
          error.response?.data?.errors?.[0]?.message ||
          error.message ||
          'Failed to create shipment',
      };
    }
  }

  // Track shipment
  async trackShipment(trackingNumber) {
    try {
      const token = await this.authenticate();

      const payload = {
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: trackingNumber,
            },
          },
        ],
      };

      const response = await this.requestWithRetry({
        method: 'POST',
        url: `${this.baseURL}/track/v1/trackingnumbers`,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
      });

      const trackingInfo = response.data.output.completeTrackResults[0]?.trackResults[0];

      if (!trackingInfo) {
        return {
          success: false,
          error: 'Tracking information not available',
        };
      }

      const events = trackingInfo.scanEvents?.map(event => ({
        timestamp: event.date,
        status: event.eventDescription,
        location: event.scanLocation ?
          `${event.scanLocation.city || ''}, ${event.scanLocation.stateOrProvinceCode || ''}`.trim() :
          'N/A',
        description: event.derivedStatusCode || event.eventType,
      })) || [];

      logger.info(`Tracking retrieved for ${trackingNumber}`);

      return {
        success: true,
        trackingNumber: trackingInfo.trackingNumberInfo.trackingNumber,
        status: trackingInfo.latestStatusDetail?.statusByLocale || trackingInfo.latestStatusDetail?.description,
        estimatedDelivery: trackingInfo.estimatedDeliveryTimeWindow?.window?.ends ||
          trackingInfo.dateAndTimes?.find(d => d.type === 'ESTIMATED_DELIVERY')?.dateTime,
        actualDelivery: trackingInfo.dateAndTimes?.find(d => d.type === 'ACTUAL_DELIVERY')?.dateTime,
        events: events.reverse(),
      };
    } catch (error) {
      logger.error(`Tracking failed: ${error.message}`);

      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  }

  // Void/Cancel shipment
  async cancelShipment(trackingNumber) {
    try {
      const token = await this.authenticate();

      const payload = {
        accountNumber: {
          value: this.accountNumber,
        },
        trackingNumber: trackingNumber,
        deletionControl: 'DELETE_ALL_PACKAGES',
      };

      await this.requestWithRetry({
        method: 'PUT',
        url: `${this.baseURL}/ship/v1/shipments/cancel`,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
      });

      logger.info(`Shipment cancelled: ${trackingNumber}`);

      return {
        success: true,
        message: 'Shipment cancelled successfully',
      };
    } catch (error) {
      logger.error(`Shipment cancellation failed: ${error.message}`);

      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  }

  // Helper to get friendly service names
  getServiceName(serviceType) {
    const serviceNames = {
      'FEDEX_GROUND': 'FedEx Ground',
      'GROUND_HOME_DELIVERY': 'FedEx Home Delivery',
      'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
      'FEDEX_2_DAY': 'FedEx 2Day',
      'FEDEX_2_DAY_AM': 'FedEx 2Day A.M.',
      'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
      'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
      'FIRST_OVERNIGHT': 'FedEx First Overnight',
      'INTERNATIONAL_ECONOMY': 'FedEx International Economy',
      'INTERNATIONAL_PRIORITY': 'FedEx International Priority',
      'INTERNATIONAL_FIRST': 'FedEx International First',
    };

    return serviceNames[serviceType] || serviceType;
  }

  // Calculate package dimensions from cart items
  calculatePackageDimensions(cartItems) {
    // Group items and calculate total dimensions
    // For artwork, we'll use the largest dimensions as base and stack accordingly

    if (!cartItems || cartItems.length === 0) {
      return [{
        dimensions: { length: 12, width: 12, height: 6, unit: 'IN' },
        weight: { value: 5, unit: 'LB' },
        insuredValue: 100,
      }];
    }

    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;
    let totalValue = 0;

    cartItems.forEach(item => {
      const quantity = item.quantity || 1;

      // Weight calculation
      const itemWeight = item.weight?.value || 5;
      totalWeight += itemWeight * quantity;

      // Dimension calculation - use frame dimensions if available, otherwise artwork
      const dims = item.dimensions?.frame || item.dimensions?.artwork || {};
      const length = dims.length || 12;
      const width = dims.width || 12;
      const height = dims.height || 2;

      // Track largest length and width
      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);

      // Stack heights for multiple items
      totalHeight += height * quantity;

      // Calculate insured value
      totalValue += (item.price || 100) * quantity;
    });

    // Add packaging material weight and dimensions
    totalWeight += 2; // 2 lbs for packaging
    totalHeight += 4; // 4 inches for packaging material

    // Ensure minimum dimensions
    maxLength = Math.max(maxLength, 12);
    maxWidth = Math.max(maxWidth, 12);
    totalHeight = Math.max(totalHeight, 6);

    // FedEx has maximum dimensions - if exceeded, split into multiple packages
    const maxDimPerPackage = 108; // inches (L+W+H)
    const maxWeightPerPackage = 150; // lbs

    const packages = [];

    if (maxLength + maxWidth + totalHeight <= maxDimPerPackage && totalWeight <= maxWeightPerPackage) {
      // Single package
      packages.push({
        dimensions: {
          length: maxLength,
          width: maxWidth,
          height: totalHeight,
          unit: 'IN',
        },
        weight: {
          value: totalWeight,
          unit: 'LB',
        },
        insuredValue: totalValue,
      });
    } else {
      // Multiple packages needed - split by items
      let currentPackage = {
        dimensions: { length: 12, width: 12, height: 6, unit: 'IN' },
        weight: { value: 2, unit: 'LB' },
        insuredValue: 0,
      };

      cartItems.forEach(item => {
        const quantity = item.quantity || 1;

        for (let i = 0; i < quantity; i++) {
          const itemWeight = item.weight?.value || 5;
          const dims = item.dimensions?.frame || item.dimensions?.artwork || {};

          currentPackage.weight.value += itemWeight;
          currentPackage.dimensions.length = Math.max(currentPackage.dimensions.length, dims.length || 12);
          currentPackage.dimensions.width = Math.max(currentPackage.dimensions.width, dims.width || 12);
          currentPackage.dimensions.height += (dims.height || 2);
          currentPackage.insuredValue += item.price || 100;

          // Check if package exceeds limits
          if (currentPackage.weight.value > maxWeightPerPackage - 10 ||
            currentPackage.dimensions.length + currentPackage.dimensions.width + currentPackage.dimensions.height > maxDimPerPackage - 20) {
            packages.push({ ...currentPackage });
            currentPackage = {
              dimensions: { length: 12, width: 12, height: 6, unit: 'IN' },
              weight: { value: 2, unit: 'LB' },
              insuredValue: 0,
            };
          }
        }
      });

      if (currentPackage.insuredValue > 0) {
        packages.push(currentPackage);
      }
    }

    return packages;
  }
}

export default new FedExService();