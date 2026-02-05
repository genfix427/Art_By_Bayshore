import { validationResult } from 'express-validator';
import ErrorResponse from '../utils/errorResponse.js';

export const validate = (validators) => {
  return async (req, res, next) => {

    // Run all validators manually
    await Promise.all(validators.map(v => v.run(req)));

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      console.log('Validation Errors:', extractedErrors);

      return next(
        new ErrorResponse('Validation failed', 400, extractedErrors)
      );
    }

    next();
  };
};
