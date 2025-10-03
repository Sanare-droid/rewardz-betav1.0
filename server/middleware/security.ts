/**
 * Security middleware
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

// Mock rate limiting and helmet for now - these will be installed as dependencies
const rateLimit = (options: any) => (req: Request, res: Response, next: NextFunction) => next();
const helmet = (options?: any) => (req: Request, res: Response, next: NextFunction) => next();

// Rate limiting
export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
    },
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, 'Rate Limiter');
      res.status(429).json({
        success: false,
        error: message,
      });
    },
  });
};

// API rate limiting
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests, please try again later.',
});

// Auth rate limiting (stricter)
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 auth attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

// Payment rate limiting
export const paymentRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: 'Too many payment attempts, please try again later.',
});

// Security headers - development mode
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
});

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      logger.warn(`Input validation failed: ${error.message}`, 'Validation');
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      });
    }
  };
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`, 'CORS');
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Request sanitization - simplified version
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };
  
  // Only sanitize body if it exists and is an object
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Skip potentially dangerous keys
          if (key.startsWith('__') || key.startsWith('$')) {
            continue;
          }
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };
    
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// API key validation
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    return next(); // Skip if no API key is configured
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    logger.warn(`Invalid API key from IP: ${req.ip}`, 'API Key Validation');
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
  }
  
  next();
};

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxBytes = parseInt(maxSize.replace('mb', '')) * 1024 * 1024;
    
    if (contentLength > maxBytes) {
      logger.warn(`Request too large: ${contentLength} bytes`, 'Request Size');
      res.status(413).json({
        success: false,
        error: 'Request too large',
      });
      return;
    }
    
    next();
  };
};
