// utils/imageProcessor.js - FIXED VERSION
import cloudinary from '../config/cloudinary.js';
import logger from './logger.js';
import sharp from 'sharp';

class ImageProcessor {
  async uploadToCloudinary(fileBuffer, options = {}) {
    try {
      console.log('Uploading to Cloudinary with options:', options);
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder || 'art_haven/products',
            public_id: options.public_id,
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
              ...(options.transformation || []),
            ],
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', {
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format
              });
              resolve(result);
            }
          }
        );

        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      logger.error(`Cloudinary upload failed: ${error.message}`);
      throw error;
    }
  }

  async uploadMultiple(files, folder = 'art_haven/products') {
    try {
      console.log(`Uploading ${files.length} files to Cloudinary folder: ${folder}`);
      
      const uploadPromises = files.map(async (file, index) => {
        console.log(`Processing file ${index + 1}/${files.length}: ${file.originalname}`);
        
        // Check if file has buffer
        if (!file.buffer) {
          throw new Error(`File ${file.originalname} doesn't have buffer.`);
        }

        // Process image with sharp
        let processedBuffer;
        try {
          processedBuffer = await sharp(file.buffer)
            .resize({
              width: 1200,
              height: 1200,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .toFormat('webp', { quality: 85 })
            .toBuffer();
          
          console.log(`Processed image ${index + 1}: ${processedBuffer.length} bytes`);
        } catch (sharpError) {
          console.warn(`Sharp processing failed for ${file.originalname}, uploading original:`, sharpError.message);
          processedBuffer = file.buffer;
        }

        // Generate unique public_id
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const publicId = `product-${timestamp}-${randomStr}-${index}`;

        // Upload to Cloudinary - FIXED: removed undefined 'options' reference
        const result = await this.uploadToCloudinary(processedBuffer, {
          folder: folder,
          public_id: publicId,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
          ],
        });

        return {
          url: result.secure_url,
          public_id: result.public_id,
          alt: file.originalname,
          isPrimary: index === 0,
          width: result.width,
          height: result.height,
          format: result.format,
        };
      });

      const results = await Promise.all(uploadPromises);
      logger.info(`Uploaded ${results.length} images to Cloudinary`);
      console.log('Upload results:', results);
      return results;
    } catch (error) {
      logger.error(`Multiple upload failed: ${error.message}`);
      console.error('UploadMultiple error details:', error);
      throw error;
    }
  }

  async deleteFromCloudinary(publicId) {
    try {
      console.log('Deleting from Cloudinary:', publicId);
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted image from Cloudinary: ${publicId}`);
      return result;
    } catch (error) {
      logger.error(`Cloudinary deletion failed: ${publicId}: ${error.message}`);
      throw error;
    }
  }

  // Helper method for single file upload
  async uploadSingle(file, folder = 'art_haven/products') {
    const results = await this.uploadMultiple([file], folder);
    return results[0];
  }
}

export default new ImageProcessor();