// middleware/upload.js
import multer from 'multer';
import ErrorResponse from '../utils/errorResponse.js';
import path from 'path';
import logger from '../utils/logger.js';

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter with detailed validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    logger.info(`File upload accepted: ${file.originalname} (${file.mimetype})`);
    return cb(null, true);
  } else {
    logger.warn(`File upload rejected: ${file.originalname} (${file.mimetype})`);
    cb(new ErrorResponse('Only image files are allowed (jpeg, jpg, png, gif, webp)', 400));
  }
};

// Configure multer with memory storage and limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: parseInt(process.env.MAX_FILE_COUNT) || 10, // Max 10 files
  },
  fileFilter: fileFilter,
});

// Error handling middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024) / (1024 * 1024)}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: `Too many files. Maximum is ${parseInt(process.env.MAX_FILE_COUNT) || 10} files`,
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next(err);
};

export default upload;