import { body, param } from 'express-validator';

export const updateUserRoleValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['customer', 'admin', 'superadmin'])
    .withMessage('Invalid role'),
];

export const getUserByIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
];