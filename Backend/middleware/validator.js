import { validationResult } from 'express-validator';
import ErrorResponse from '../utils/errorResponse.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value // Optional: include the invalid value for debugging
    }));
    
    // Log for debugging
    console.log('Validation Errors:', extractedErrors);
    
    return next(new ErrorResponse(
      'Validation failed',
      400,
      extractedErrors
    ));
  }
  
  next();
};