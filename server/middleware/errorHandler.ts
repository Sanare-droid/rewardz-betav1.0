/**
 * Express error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message, isOperational } = error;

  // Log error
  logger.logError(error, req, 'Error Handler');

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    success: false,
    error: {
      message: isOperational ? message : 'Internal Server Error',
      ...(isDevelopment && { stack: error.stack }),
    },
    ...(isDevelopment && { originalError: error.message }),
  };

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, '404 Handler');
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
export const validationErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    const message = `Validation Error: ${errors.join(', ')}`;
    const appError = new AppError(message, 400);
    return errorHandler(appError, req, res, next);
  }
  next(error);
};
