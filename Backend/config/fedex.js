import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

class FedExService {
  constructor() {
    this.mode = process.env.FEDEX_MODE || 'sandbox';
    this.baseURL = this.mode === 'production' 
      ? process.env.FEDEX_API_URL_PRODUCTION 
      : process.env.FEDEX_API_URL_SANDBOX;
    
    this.apiKey = process.env.FEDEX_API_KEY;
    this.secretKey = process.env.FEDEX_SECRET_KEY;
    this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
    this.meterNumber = process.env.FEDEX_METER_NUMBER;
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // OAuth 2.0 Authentication
  async authenticate() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      logger.info('Authenticating with FedEx API...');

      const response = await axios.post(
        `${this.baseURL}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.secretKey,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

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

      const response = await axios.post(
        `${this.baseURL}/address/v1/addresses/resolve`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
          },
        }
      );

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
  async getShippingRates(shipmentDetails) {
    try {
      const token = await this.authenticate();

      const {
        fromAddress,
        toAddress,
        packages, // Array of packages with dimensions and weight
        shipDate,
      } = shipmentDetails;

      // Prepare package line items with actual product dimensions
      const requestedPackageLineItems = packages.map((pkg, index) => ({
        groupPackageCount: 1,
        weight: {
          units: pkg.weight.unit.toUpperCase() === 'KG' ? 'KG' : 'LB',
          value: pkg.weight.value,
        },
        dimensions: {
          length: Math.ceil(pkg.dimensions.length),
          width: Math.ceil(pkg.dimensions.width),
          height: Math.ceil(pkg.dimensions.height),
          units: pkg.dimensions.unit.toUpperCase() === 'CM' ? 'CM' : 'IN',
        },
        insuredValue: {
          currency: 'USD',
          amount: pkg.insuredValue || 100,
        },
      }));

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
          rateRequestType: ['LIST', 'ACCOUNT'],
          requestedPackageLineItems: requestedPackageLineItems,
          shipDateStamp: shipDate || new Date().toISOString().split('T')[0],
        },
      };

      const response = await axios.post(
        `${this.baseURL}/rate/v1/rates/quotes`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
          },
        }
      );

      const rateReplyDetails = response.data.output.rateReplyDetails || [];

      // Parse and format shipping options
      const shippingOptions = rateReplyDetails
        .filter(rate => rate.ratedShipmentDetails && rate.ratedShipmentDetails.length > 0)
        .map(rate => {
          const shipmentDetail = rate.ratedShipmentDetails[0];
          const totalNetCharge = shipmentDetail.totalNetCharge || 0;

          return {
            serviceType: rate.serviceType,
            serviceName: this.getServiceName(rate.serviceType),
            totalCharge: parseFloat(totalNetCharge),
            currency: shipmentDetail.currency || 'USD',
            deliveryTimestamp: rate.commit?.dateDetail?.dayFormat || null,
            transitDays: rate.commit?.transitDays || 'N/A',
            rateDetail: {
              baseCharge: shipmentDetail.totalBaseCharge || 0,
              fuelSurcharge: shipmentDetail.shipmentRateDetail?.totalSurcharges || 0,
              totalTaxes: shipmentDetail.shipmentRateDetail?.totalTaxes || 0,
            },
          };
        })
        .sort((a, b) => a.totalCharge - b.totalCharge);

      logger.info(`Retrieved ${shippingOptions.length} shipping rates for ${toAddress.city}, ${toAddress.state}`);

      return {
        success: true,
        options: shippingOptions,
      };
    } catch (error) {
      logger.error(`Shipping rate calculation failed: ${error.message}`);
      
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
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
      } = shipmentData;

      const requestedPackageLineItems = packages.map((pkg, index) => ({
        weight: {
          units: pkg.weight.unit.toUpperCase() === 'KG' ? 'KG' : 'LB',
          value: pkg.weight.value,
        },
        dimensions: {
          length: Math.ceil(pkg.dimensions.length),
          width: Math.ceil(pkg.dimensions.width),
          height: Math.ceil(pkg.dimensions.height),
          units: pkg.dimensions.unit.toUpperCase() === 'CM' ? 'CM' : 'IN',
        },
        customerReferences: [
          {
            customerReferenceType: 'CUSTOMER_REFERENCE',
            value: reference || 'ORDER',
          },
        ],
      }));

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
              streetLines: [fromAddress.addressLine1],
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
          labelSpecification: {
            imageType: 'PDF',
            labelStockType: 'PAPER_85X11_TOP_HALF_LABEL',
          },
          requestedPackageLineItems: requestedPackageLineItems,
        },
        accountNumber: {
          value: this.accountNumber,
        },
      };

      const response = await axios.post(
        `${this.baseURL}/ship/v1/shipments`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
          },
        }
      );

      const shipmentOutput = response.data.output.transactionShipments[0];
      const packageDetails = shipmentOutput.pieceResponses[0];

      logger.info(`Shipment created successfully. Tracking: ${packageDetails.trackingNumber}`);

      return {
        success: true,
        trackingNumber: packageDetails.trackingNumber,
        masterId: shipmentOutput.masterTrackingNumber || packageDetails.trackingNumber,
        labelUrl: packageDetails.packageDocuments[0].url,
        serviceType: shipmentOutput.serviceType,
        shipDate: shipmentOutput.shipDatestamp,
      };
    } catch (error) {
      logger.error(`Shipment creation failed: ${error.message}`);
      
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
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

      const response = await axios.post(
        `${this.baseURL}/track/v1/trackingnumbers`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
          },
        }
      );

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

      await axios.put(
        `${this.baseURL}/ship/v1/shipments/cancel`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
          },
        }
      );

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