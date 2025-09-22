import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

// Create a custom error
export const createError = (message: string, statusCode: number = 500): CustomError => {
  const error: CustomError = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
  return error;
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler
export const globalErrorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development vs Production error handling
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

const sendErrorDev = (err: CustomError, res: Response) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    error: err.message,
    stack: err.stack,
    details: err
  });
};

const sendErrorProd = (err: CustomError, res: Response) => {
  // Operational errors: send message to client
  if (err.statusCode && err.statusCode < 500) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.message
    });
  } else {
    // Programming or unknown errors: don't leak details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: 'Something went wrong!'
    });
  }
};

// Handle specific MongoDB errors
export const handleMongoError = (err: any): CustomError => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return createError(message, 400);
  }
  
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return createError(message, 400);
  }
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => val.message);
    const message = `Validation error: ${errors.join('. ')}`;
    return createError(message, 400);
  }
  
  return err;
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
