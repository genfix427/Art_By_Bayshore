// services/fedex.service.js
import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import { promisify } from 'util';
import { Readable } from 'stream';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Circuit Breaker Implementation
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000, resetTimeout = 300000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error(`Circuit breaker is OPEN. Service unavailable. Retry after ${Math.ceil((this.resetTimeout - timeSinceLastFailure) / 1000)}s`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      logger.info('Circuit breaker test successful, resetting to CLOSED');
    }
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.warn(`Circuit breaker failure count: ${this.failureCount}/${this.failureThreshold}`);

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened due to excessive failures');
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Idempotency Key Manager
class IdempotencyManager {
  constructor(ttl = 86400000) { // 24 hours default
    this.cache = new Map();
    this.ttl = ttl;
    this.cleanupInterval = setInterval(() => this.cleanup(), 3600000); // Cleanup every hour
  }

  generateKey(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      packages: data.packages,
      serviceType: data.serviceType,
      timestamp: new Date(data.timestamp || Date.now()).toISOString().split('T')[0], // Same day
    }));
    return hash.digest('hex');
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    logger.info(`Idempotency key cached: ${key.substring(0, 8)}...`);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Idempotency cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Distributed Rate Limiter (Redis-ready)
class RateLimiter {
  constructor(maxRequests = 50, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async checkLimit(identifier = 'default') {
    const now = Date.now();

    // Clean old requests outside the window
    this.requests = this.requests.filter(req => now - req.timestamp < this.windowMs);

    // Check if limit exceeded
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const resetTime = oldestRequest.timestamp + this.windowMs;
      const waitTime = resetTime - now;

      throw new Error(`Rate limit exceeded. Retry after ${Math.ceil(waitTime / 1000)}s`);
    }

    // Add current request
    this.requests.push({ identifier, timestamp: now });

    return {
      remaining: this.maxRequests - this.requests.length,
      reset: now + this.windowMs,
    };
  }

  getStats() {
    return {
      current: this.requests.length,
      max: this.maxRequests,
      window: `${this.windowMs / 1000}s`,
    };
  }
}

class FedExService {
  constructor() {
    this.mode = process.env.FEDEX_MODE || 'sandbox';
    this.baseURL = this.mode === 'production'
      ? 'https://apis.fedex.com'
      : 'https://apis-sandbox.fedex.com';

    this.apiKey = process.env.FEDEX_API_KEY;
    this.secretKey = process.env.FEDEX_SECRET_KEY;
    this.accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
    this.meterNumber = process.env.FEDEX_METER_NUMBER;

    this.accessToken = null;
    this.tokenExpiry = null;

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(5, 60000, 300000);

    // Initialize idempotency manager
    this.idempotencyManager = new IdempotencyManager(86400000); // 24 hours

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(50, 60000); // 50 requests per minute

    this.validateConfig();
    this.logEnvironment();
    this.setupCleanup();
  }

  validateConfig() {
    const requiredFields = [
      'FEDEX_API_KEY',
      'FEDEX_SECRET_KEY',
      'FEDEX_ACCOUNT_NUMBER',
    ];

    const missing = requiredFields.filter(field => !process.env[field]);

    if (missing.length > 0) {
      logger.warn(`Missing FedEx configuration: ${missing.join(', ')}`);
      if (this.mode === 'production') {
        throw new Error(`❌ PRODUCTION MODE requires all credentials: ${missing.join(', ')}`);
      }
    }

    if (this.mode === 'production') {
      this.validateProductionCredentials();
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      logger.warn('Cloudinary configuration missing - labels will not be uploaded to cloud');
    }
  }

  validateProductionCredentials() {
    if (this.apiKey && this.apiKey.toLowerCase().includes('sandbox')) {
      throw new Error('❌ Production mode cannot use sandbox API key!');
    }

    if (this.accountNumber && !/^\d{9}$/.test(this.accountNumber)) {
      logger.warn('⚠️  FedEx account number should be 9 digits');
    }

    logger.info('✅ Production credentials validated');
  }

  logEnvironment() {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🚀 FedEx Service Initialized`);
    logger.info(`📦 Mode: ${this.mode.toUpperCase()}`);
    logger.info(`🌐 Base URL: ${this.baseURL}`);
    logger.info(`🔒 Circuit Breaker: ENABLED`);
    logger.info(`🔑 Idempotency: ENABLED (24h TTL)`);
    logger.info(`⏱️  Rate Limiter: ENABLED (50/min)`);
    logger.info(`☁️  Cloud Storage: ${process.env.CLOUDINARY_CLOUD_NAME ? 'ENABLED' : 'DISABLED'}`);
    logger.info(`${this.mode === 'production' ? '⚠️  PRODUCTION MODE - Real charges will apply!' : '🧪 SANDBOX MODE - Test environment'}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  setupCleanup() {
    // Cleanup runs are handled by IdempotencyManager
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  gracefulShutdown() {
    logger.info('Shutting down FedEx service gracefully...');
    if (this.idempotencyManager) {
      this.idempotencyManager.destroy();
    }
    logger.info('FedEx service shutdown complete');
  }

  // OAuth 2.0 Authentication with circuit breaker
  async authenticate(retry = 0) {
    return this.circuitBreaker.execute(async () => {
      try {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
          return this.accessToken;
        }

        logger.info(`Authenticating with FedEx API (${this.mode} mode)...`);

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
            timeout: 30000,
          }
        );

        if (!response.data.access_token) {
          throw new Error('No access token received from FedEx');
        }

        this.accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);

        logger.info(`FedEx authentication successful. Token expires at ${this.tokenExpiry.toISOString()}`);
        return this.accessToken;
      } catch (error) {
        logger.error(`FedEx authentication failed (attempt ${retry + 1}): ${error.message}`);

        if (retry < 2) {
          const backoff = Math.pow(2, retry) * 1000;
          logger.info(`Retrying authentication in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          return this.authenticate(retry + 1);
        }

        const errorMsg = error.response?.data?.error_description ||
          error.response?.data?.errors?.[0]?.message ||
          error.message;
        throw new Error(`FedEx authentication failed after ${retry + 1} attempts: ${errorMsg}`);
      }
    });
  }

  // Make authenticated API request with circuit breaker and rate limiting
  async makeRequest(method, endpoint, data = null, retry = 0) {
    return this.circuitBreaker.execute(async () => {
      try {
        // Check rate limit
        await this.rateLimiter.checkLimit('fedex-api');

        const token = await this.authenticate();

        const config = {
          method,
          url: `${this.baseURL}${endpoint}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-locale': 'en_US',
          },
          timeout: 60000,
          validateStatus: (status) => status < 500,
        };

        if (data) {
          config.data = data;
        }

        const response = await axios(config);

        // Handle authentication errors
        if (response.status === 401 ||
          response.data?.errors?.[0]?.code === 'LOGIN.REAUTHENTICATE.ERROR') {
          if (retry < 2) {
            logger.warn('FedEx token expired, re-authenticating...');
            this.accessToken = null;
            this.tokenExpiry = null;
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.makeRequest(method, endpoint, data, retry + 1);
          }
        }

        // Handle client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          const error = response.data?.errors?.[0];
          throw new Error(error?.message || `FedEx API error: ${response.status}`);
        }

        return response.data;
      } catch (error) {
        // Network errors or timeouts
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          if (retry < 2) {
            const backoff = Math.pow(2, retry) * 1000;
            logger.warn(`Request timeout. Retrying in ${backoff}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return this.makeRequest(method, endpoint, data, retry + 1);
          }
        }

        logger.error(`FedEx API request failed: ${error.message}`);
        throw error;
      }
    });
  }

  // Upload label to Cloudinary
  async uploadLabelToCloud(buffer, trackingNumber) {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        logger.warn('Cloudinary not configured, skipping cloud upload');
        return null;
      }

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'fedex-labels',
            public_id: `label_${trackingNumber}_${Date.now()}`,

            resource_type: 'image',   // ✅ Required for PDF
            format: 'pdf',

            type: 'upload',         // ✅ Makes file public
            access_mode: 'public',  // ✅ FIXES 401 error

            use_filename: true,     // ✅ Better URL handling
            unique_filename: false,
            overwrite: true,

            tags: ['fedex', 'shipping-label', this.mode],
          },
          (error, result) => {
            if (error) {
              logger.error(`Cloudinary upload failed: ${error.message}`);
              return reject(error);
            }

            // ✅ IMPORTANT: Generate correct public URL manually
            const publicUrl = cloudinary.url(result.public_id + '.pdf', {
              resource_type: 'image',
              secure: true,
            });

            logger.info(`✅ Label uploaded: ${publicUrl}`);

            resolve({
              url: publicUrl,        // ✅ Use this in DB
              publicId: result.public_id,
              bytes: result.bytes,
              format: result.format,
            });
          }
        );

        // Convert buffer → stream
        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      });

    } catch (error) {
      logger.error(`Failed to upload label to cloud: ${error.message}`);
      return null;
    }
  }
  // Save label from base64 with cloud storage
  async saveLabelFromBase64(base64Data, trackingNumber) {
    try {
      if (!base64Data || typeof base64Data !== 'string') {
        throw new Error('Invalid base64 data');
      }

      const buffer = Buffer.from(base64Data, 'base64');

      // Validate PDF header
      if (!buffer.toString('utf8', 0, 4).includes('%PDF')) {
        throw new Error('Invalid PDF data received');
      }

      // Upload to Cloudinary
      const cloudResult = await this.uploadLabelToCloud(buffer, trackingNumber);

      if (cloudResult) {
        return {
          url: cloudResult.url,
          publicId: cloudResult.publicId,
          storage: 'cloudinary',
        };
      }

      // Fallback: return null if cloud upload fails
      logger.warn(`Cloud upload failed for ${trackingNumber}, label not saved`);
      return null;
    } catch (error) {
      logger.error(`Failed to save label from base64: ${error.message}`);
      return null;
    }
  }

  // Download label with cloud storage
  async downloadLabel(labelUrl, trackingNumber) {
    try {
      if (!labelUrl) {
        throw new Error('Label URL is required');
      }

      const response = await axios.get(labelUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const buffer = Buffer.from(response.data);

      // Upload to Cloudinary
      const cloudResult = await this.uploadLabelToCloud(buffer, trackingNumber);

      if (cloudResult) {
        return {
          url: cloudResult.url,
          publicId: cloudResult.publicId,
          storage: 'cloudinary',
        };
      }

      logger.warn(`Cloud upload failed for ${trackingNumber}, label not saved`);
      return null;
    } catch (error) {
      logger.error(`Failed to download label: ${error.message}`);
      return null;
    }
  }

  // Sanitize and validate address input
  sanitizeAddress(address) {
    if (!address) {
      throw new Error('Address is required');
    }

    const sanitized = {
      addressLine1: (address.addressLine1 || '').trim().substring(0, 35),
      addressLine2: address.addressLine2 ? address.addressLine2.trim().substring(0, 35) : '',
      city: (address.city || '').trim().substring(0, 35),
      state: (address.state || '').trim().toUpperCase().substring(0, 2),
      zipCode: (address.zipCode || '').trim().replace(/[^0-9-]/g, '').substring(0, 10),
      country: (address.country || 'US').trim().toUpperCase().substring(0, 2),
      fullName: (address.fullName || '').trim().substring(0, 70),
      phoneNumber: (address.phoneNumber || '').trim().replace(/[^0-9]/g, '').substring(0, 15),
      residential: address.residential !== false,
    };

    // Validate required fields
    if (!sanitized.addressLine1 || !sanitized.city || !sanitized.state || !sanitized.zipCode) {
      throw new Error('Missing required address fields: addressLine1, city, state, zipCode');
    }

    // Validate US zip code format
    if (sanitized.country === 'US' && !/^\d{5}(-\d{4})?$/.test(sanitized.zipCode)) {
      throw new Error('Invalid US zip code format. Expected format: 12345 or 12345-6789');
    }

    // Validate phone number
    if (sanitized.phoneNumber && sanitized.phoneNumber.length < 10) {
      throw new Error('Phone number must be at least 10 digits');
    }

    return sanitized;
  }

  // Validate package dimensions and weight
  validatePackage(pkg) {
    if (!pkg.weight || !pkg.weight.value || pkg.weight.value <= 0) {
      throw new Error('Package weight is required and must be greater than 0');
    }

    if (pkg.weight.value > 150) {
      throw new Error('Package weight exceeds FedEx maximum (150 lbs)');
    }

    if (!pkg.dimensions || !pkg.dimensions.length || !pkg.dimensions.width || !pkg.dimensions.height) {
      throw new Error('Package dimensions are required (length, width, height)');
    }

    const { length, width, height } = pkg.dimensions;
    const girth = 2 * (width + height);
    const lengthPlusGirth = length + girth;

    if (lengthPlusGirth > 165) {
      throw new Error('Package dimensions exceed FedEx maximum (length + girth must be ≤ 165 inches)');
    }

    if (length <= 0 || width <= 0 || height <= 0) {
      throw new Error('Package dimensions must be greater than 0');
    }

    return true;
  }

  // Address Validation
  async validateAddress(address) {
    try {
      const sanitized = this.sanitizeAddress(address);

      const payload = {
        addressesToValidate: [
          {
            address: {
              streetLines: [sanitized.addressLine1, sanitized.addressLine2].filter(Boolean),
              city: sanitized.city,
              stateOrProvinceCode: sanitized.state,
              postalCode: sanitized.zipCode,
              countryCode: sanitized.country,
            },
          },
        ],
      };

      const response = await this.makeRequest('POST', '/address/v1/addresses/resolve', payload);
      const result = response.output?.resolvedAddresses?.[0];

      if (!result) {
        return {
          isValid: false,
          error: 'No validation result received',
          classification: 'UNKNOWN',
        };
      }

      logger.info(`Address validated: ${sanitized.city}, ${sanitized.state} - ${result.classification}`);

      return {
        isValid: ['BUSINESS', 'RESIDENTIAL', 'UNKNOWN'].includes(result.classification),
        classification: result.classification || 'UNKNOWN',
        resolvedAddress: result.resolvedAddress || null,
        attributes: result.attributes || [],
        parsedAddress: result.parsedAddress || null,
      };
    } catch (error) {
      logger.error(`Address validation failed: ${error.message}`);

      return {
        isValid: false,
        error: error.message,
        classification: 'UNKNOWN',
      };
    }
  }

  // Calculate shipping rates
  async getShippingRates(shipmentDetails) {
    try {
      const { fromAddress, toAddress, packages, shipDate } = shipmentDetails;

      const sanitizedFrom = this.sanitizeAddress(fromAddress);
      const sanitizedTo = this.sanitizeAddress(toAddress);

      // Validate all packages
      packages.forEach((pkg, index) => {
        try {
          this.validatePackage(pkg);
        } catch (error) {
          throw new Error(`Package ${index + 1}: ${error.message}`);
        }
      });

      const requestedPackageLineItems = packages.map((pkg) => ({
        groupPackageCount: 1,
        weight: {
          units: pkg.weight.unit.toUpperCase() === 'KG' ? 'KG' : 'LB',
          value: Math.ceil(pkg.weight.value * 10) / 10,
        },
        dimensions: {
          length: Math.ceil(pkg.dimensions.length),
          width: Math.ceil(pkg.dimensions.width),
          height: Math.ceil(pkg.dimensions.height),
          units: pkg.dimensions.unit.toUpperCase() === 'CM' ? 'CM' : 'IN',
        },
        insuredValue: {
          currency: 'USD',
          amount: Math.max(pkg.insuredValue || 100, 1),
        },
      }));

      const payload = {
        accountNumber: {
          value: this.accountNumber,
        },
        requestedShipment: {
          shipper: {
            address: {
              streetLines: [sanitizedFrom.addressLine1],
              city: sanitizedFrom.city,
              stateOrProvinceCode: sanitizedFrom.state,
              postalCode: sanitizedFrom.zipCode,
              countryCode: sanitizedFrom.country,
            },
          },
          recipient: {
            address: {
              streetLines: [sanitizedTo.addressLine1],
              city: sanitizedTo.city,
              stateOrProvinceCode: sanitizedTo.state,
              postalCode: sanitizedTo.zipCode,
              countryCode: sanitizedTo.country,
              residential: sanitizedTo.residential,
            },
          },
          pickupType: 'USE_SCHEDULED_PICKUP',
          rateRequestType: ['LIST', 'ACCOUNT'],
          requestedPackageLineItems: requestedPackageLineItems,
          shipDateStamp: shipDate || new Date().toISOString().split('T')[0],
        },
      };

      const response = await this.makeRequest('POST', '/rate/v1/rates/quotes', payload);
      const rateReplyDetails = response.output?.rateReplyDetails || [];

      if (rateReplyDetails.length === 0) {
        logger.warn('No shipping rates available for this shipment');
        return {
          success: true,
          options: [],
          message: 'No rates available for selected addresses',
        };
      }

      const shippingOptions = rateReplyDetails
        .filter(rate => rate.ratedShipmentDetails && rate.ratedShipmentDetails.length > 0)
        .map(rate => {
          const shipmentDetail = rate.ratedShipmentDetails[0];
          const totalNetCharge = shipmentDetail.totalNetCharge || 0;

          return {
            serviceType: rate.serviceType,
            serviceName: this.getServiceName(rate.serviceType),
            totalCharge: parseFloat(totalNetCharge.toFixed(2)),
            currency: shipmentDetail.currency || 'USD',
            deliveryTimestamp: rate.commit?.dateDetail?.dayFormat || null,
            transitDays: rate.commit?.transitDays || 'N/A',
            rateDetail: {
              baseCharge: parseFloat((shipmentDetail.totalBaseCharge || 0).toFixed(2)),
              fuelSurcharge: parseFloat((shipmentDetail.shipmentRateDetail?.totalSurcharges || 0).toFixed(2)),
              totalTaxes: parseFloat((shipmentDetail.shipmentRateDetail?.totalTaxes || 0).toFixed(2)),
            },
          };
        })
        .sort((a, b) => a.totalCharge - b.totalCharge);

      logger.info(`Retrieved ${shippingOptions.length} shipping rates for ${sanitizedTo.city}, ${sanitizedTo.state}`);

      return {
        success: true,
        options: shippingOptions,
      };
    } catch (error) {
      logger.error(`Shipping rate calculation failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Failed to calculate shipping rates',
        options: [],
      };
    }
  }

  // Create shipment with idempotency protection
  async createShipment(shipmentData) {
    try {
      // Generate idempotency key
      const idempotencyKey = this.idempotencyManager.generateKey(shipmentData);

      // Check if this shipment was already created
      if (this.idempotencyManager.has(idempotencyKey)) {
        const cachedResult = this.idempotencyManager.get(idempotencyKey);
        logger.info(`Returning cached shipment result for idempotency key: ${idempotencyKey.substring(0, 8)}...`);
        return {
          ...cachedResult,
          cached: true,
        };
      }

      const { fromAddress, toAddress, packages, serviceType, shipDate, reference } = shipmentData;

      // Validate and sanitize addresses
      const sanitizedFrom = this.sanitizeAddress(fromAddress);
      const sanitizedTo = this.sanitizeAddress(toAddress);

      // Validate all packages
      packages.forEach((pkg, index) => {
        try {
          this.validatePackage(pkg);
        } catch (error) {
          throw new Error(`Package ${index + 1}: ${error.message}`);
        }
      });

      // Validate service type
      const validServiceTypes = [
        'FEDEX_GROUND',
        'GROUND_HOME_DELIVERY',
        'FEDEX_EXPRESS_SAVER',
        'FEDEX_2_DAY',
        'STANDARD_OVERNIGHT',
        'PRIORITY_OVERNIGHT',
        'FIRST_OVERNIGHT',
      ];

      const selectedService = serviceType || 'FEDEX_GROUND';
      if (!validServiceTypes.includes(selectedService)) {
        throw new Error(`Invalid service type: ${selectedService}. Valid options: ${validServiceTypes.join(', ')}`);
      }

      const requestedPackageLineItems = packages.map((pkg) => ({
        weight: {
          units: pkg.weight.unit.toUpperCase() === 'KG' ? 'KG' : 'LB',
          value: Math.ceil(pkg.weight.value * 10) / 10,
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
            value: (reference || 'ORDER').substring(0, 30),
          },
        ],
      }));

      const payload = {
        labelResponseOptions: 'LABEL',
        requestedShipment: {
          shipper: {
            contact: {
              personName: sanitizedFrom.fullName,
              phoneNumber: sanitizedFrom.phoneNumber || '+13051234567',
              companyName: process.env.COMPANY_NAME || 'Art By Bayshore',
            },
            address: {
              streetLines: [sanitizedFrom.addressLine1],
              city: sanitizedFrom.city,
              stateOrProvinceCode: sanitizedFrom.state,
              postalCode: sanitizedFrom.zipCode,
              countryCode: sanitizedFrom.country,
            },
          },
          recipients: [
            {
              contact: {
                personName: sanitizedTo.fullName,
                phoneNumber: sanitizedTo.phoneNumber || '+13051234567',
              },
              address: {
                streetLines: [sanitizedTo.addressLine1, sanitizedTo.addressLine2].filter(Boolean),
                city: sanitizedTo.city,
                stateOrProvinceCode: sanitizedTo.state,
                postalCode: sanitizedTo.zipCode,
                countryCode: sanitizedTo.country,
                residential: sanitizedTo.residential,
              },
            },
          ],
          shipDatestamp: shipDate || new Date().toISOString().split('T')[0],
          serviceType: selectedService,
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

      logger.info(`Creating ${this.mode} shipment with service: ${selectedService}`);
      if (this.mode === 'production') {
        logger.warn(`⚠️  PRODUCTION SHIPMENT - Charges will be applied to account ${this.accountNumber}`);
      }

      const response = await this.makeRequest('POST', '/ship/v1/shipments', payload);

      if (!response.output?.transactionShipments?.[0]) {
        throw new Error('Invalid response from FedEx - no shipment data received');
      }

      const shipmentOutput = response.output.transactionShipments[0];
      const packageDetails = shipmentOutput.pieceResponses?.[0];

      if (!packageDetails?.trackingNumber) {
        throw new Error('No tracking number received from FedEx');
      }

      logger.info(`Shipment created successfully. Tracking: ${packageDetails.trackingNumber}`);

      // Save label to cloud
      let labelData = null;
      if (packageDetails.packageDocuments?.[0]) {
        const labelDoc = packageDetails.packageDocuments[0];

        if (labelDoc.encodedLabel) {
          labelData = await this.saveLabelFromBase64(
            labelDoc.encodedLabel,
            packageDetails.trackingNumber
          );
        } else if (labelDoc.url) {
          labelData = await this.downloadLabel(labelDoc.url, packageDetails.trackingNumber);
        }
      }

      if (!labelData) {
        logger.warn(`Label not saved for tracking ${packageDetails.trackingNumber}`);
      }

      const result = {
        success: true,
        trackingNumber: packageDetails.trackingNumber,
        masterId: shipmentOutput.masterTrackingNumber || packageDetails.trackingNumber,
        label: labelData,
        serviceType: shipmentOutput.serviceType,
        shipDate: shipmentOutput.shipDatestamp,
      };

      // Cache the result for idempotency
      this.idempotencyManager.set(idempotencyKey, result);

      return result;
    } catch (error) {
      logger.error(`Shipment creation failed: ${error.message}`);

      const errorDetails = error.response?.data?.errors?.[0];
      return {
        success: false,
        error: errorDetails?.message || error.message,
        errorCode: errorDetails?.code,
      };
    }
  }

  // Track shipment
  async trackShipment(trackingNumber) {
    try {
      if (!trackingNumber || typeof trackingNumber !== 'string') {
        throw new Error('Valid tracking number is required');
      }

      const sanitizedTracking = trackingNumber.trim().replace(/[^a-zA-Z0-9]/g, '');

      if (sanitizedTracking.length < 10) {
        throw new Error('Invalid tracking number format');
      }

      const payload = {
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: sanitizedTracking,
            },
          },
        ],
      };

      const response = await this.makeRequest('POST', '/track/v1/trackingnumbers', payload);
      const trackingInfo = response.output?.completeTrackResults?.[0]?.trackResults?.[0];

      if (!trackingInfo) {
        return {
          success: false,
          error: 'Tracking information not available',
        };
      }

      const events = trackingInfo.scanEvents?.map(event => ({
        timestamp: event.date,
        status: event.eventDescription || 'Status Update',
        location: event.scanLocation ?
          `${event.scanLocation.city || ''}, ${event.scanLocation.stateOrProvinceCode || ''}`.trim() || 'N/A' :
          'N/A',
        description: event.derivedStatusCode || event.eventType || '',
      })) || [];

      logger.info(`Tracking retrieved for ${sanitizedTracking}: ${trackingInfo.latestStatusDetail?.description || 'Unknown'}`);

      return {
        success: true,
        trackingNumber: trackingInfo.trackingNumberInfo.trackingNumber,
        status: trackingInfo.latestStatusDetail?.statusByLocale ||
          trackingInfo.latestStatusDetail?.description ||
          'Unknown',
        estimatedDelivery: trackingInfo.estimatedDeliveryTimeWindow?.window?.ends ||
          trackingInfo.dateAndTimes?.find(d => d.type === 'ESTIMATED_DELIVERY')?.dateTime || null,
        actualDelivery: trackingInfo.dateAndTimes?.find(d => d.type === 'ACTUAL_DELIVERY')?.dateTime || null,
        events: events.reverse(),
      };
    } catch (error) {
      logger.error(`Tracking failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Failed to retrieve tracking information',
      };
    }
  }

  // Cancel shipment
  async cancelShipment(trackingNumber) {
    try {
      if (!trackingNumber || typeof trackingNumber !== 'string') {
        throw new Error('Valid tracking number is required');
      }

      const sanitizedTracking = trackingNumber.trim().replace(/[^a-zA-Z0-9]/g, '');

      const payload = {
        accountNumber: {
          value: this.accountNumber,
        },
        trackingNumber: sanitizedTracking,
        deletionControl: 'DELETE_ALL_PACKAGES',
      };

      await this.makeRequest('PUT', '/ship/v1/shipments/cancel', payload);

      logger.info(`Shipment cancelled: ${sanitizedTracking}`);

      return {
        success: true,
        message: 'Shipment cancelled successfully',
      };
    } catch (error) {
      logger.error(`Shipment cancellation failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Failed to cancel shipment',
      };
    }
  }

  // Get friendly service name
  getServiceName(serviceType) {
    const serviceNames = {
      'FEDEX_GROUND': 'FedEx Home Delivery',
      // 'FEDEX_HOME_DELIVERY': '',
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

  // Calculate package dimensions
  calculatePackageDimensions(cartItems) {
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

      const itemWeight = item.weight?.value || 5;
      totalWeight += itemWeight * quantity;

      const dims = item.dimensions || {};
      const length = dims.length || 12;
      const width = dims.width || 12;
      const height = dims.height || 2;

      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);
      totalHeight += height * quantity;

      totalValue += (item.price || 100) * quantity;
    });

    totalWeight += 2;
    totalHeight += 4;

    maxLength = Math.max(maxLength, 12);
    maxWidth = Math.max(maxWidth, 12);
    totalHeight = Math.max(totalHeight, 6);

    const maxDimPerPackage = 108;
    const maxWeightPerPackage = 150;

    const packages = [];

    if (maxLength + maxWidth + totalHeight <= maxDimPerPackage && totalWeight <= maxWeightPerPackage) {
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
      let currentPackage = {
        dimensions: { length: 12, width: 12, height: 6, unit: 'IN' },
        weight: { value: 2, unit: 'LB' },
        insuredValue: 0,
      };

      cartItems.forEach(item => {
        const quantity = item.quantity || 1;

        for (let i = 0; i < quantity; i++) {
          const itemWeight = item.weight?.value || 5;
          const dims = item.dimensions || {};

          currentPackage.weight.value += itemWeight;
          currentPackage.dimensions.length = Math.max(currentPackage.dimensions.length, dims.length || 12);
          currentPackage.dimensions.width = Math.max(currentPackage.dimensions.width, dims.width || 12);
          currentPackage.dimensions.height += (dims.height || 2);
          currentPackage.insuredValue += item.price || 100;

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

  // Health check
  async healthCheck() {
    try {
      await this.authenticate();
      return {
        status: 'healthy',
        mode: this.mode,
        authenticated: !!this.accessToken,
        tokenExpiry: this.tokenExpiry,
        circuitBreaker: this.circuitBreaker.getStatus(),
        rateLimiter: this.rateLimiter.getStats(),
        cloudStorage: process.env.CLOUDINARY_CLOUD_NAME ? 'enabled' : 'disabled',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        mode: this.mode,
        error: error.message,
        circuitBreaker: this.circuitBreaker.getStatus(),
      };
    }
  }
}

export default new FedExService();