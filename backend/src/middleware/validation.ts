import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
export const validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  // Custom validation to ensure either (firstName + lastName) or name is provided
  body().custom((value, { req }) => {
    const hasFirstLast = req.body.firstName && req.body.lastName;
    const hasName = req.body.name;
    if (!hasFirstLast && !hasName) {
      throw new Error('Either first name and last name, or full name is required');
    }
    return true;
  }),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Product validation rules
export const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name is required and must be under 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category_id')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('image_url')
    .isURL()
    .withMessage('Valid image URL is required'),
  body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  handleValidationErrors
];

// Order validation rules
export const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Valid size is required'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Recipient name is required'),
  body('shippingAddress.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('shippingAddress.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2 })
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Valid zip code is required'),
  body('paymentMethod')
    .isIn(['razorpay', 'stripe', 'cod'])
    .withMessage('Valid payment method is required'),
  handleValidationErrors
];

// Cart validation rules
export const validateCartItem = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Valid size is required'),
  body('color')
    .optional()
    .isString()
    .withMessage('Valid color is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Valid size is required'),
  handleValidationErrors
];

// MongoDB ObjectId validation
export const validateObjectId = (field: string = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Valid ${field} is required`),
  handleValidationErrors
];

// Query parameter validation
export const validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['price', '-price', 'name', '-name', 'createdAt', '-createdAt'])
    .withMessage('Invalid sort parameter'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be non-negative'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be non-negative'),
  handleValidationErrors
];
