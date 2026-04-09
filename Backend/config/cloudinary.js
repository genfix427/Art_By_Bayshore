// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Validate configuration
const validateConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.warn(`Cloudinary configuration incomplete. Missing: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

if (validateConfig()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info('✅ Cloudinary configured successfully');
  logger.info(`📦 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  logger.warn('⚠️  Cloudinary not configured - cloud storage disabled');
}

export default cloudinary;