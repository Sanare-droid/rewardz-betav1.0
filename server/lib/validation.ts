/**
 * Input validation schemas using Zod
 */
import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Pet validation schemas
export const petSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50, 'Pet name must be less than 50 characters'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  color: z.string().optional(),
  markings: z.string().optional(),
  microchipId: z.string().optional(),
});

// Report validation schemas
export const reportSchema = z.object({
  type: z.enum(['lost', 'found'], { required_error: 'Report type is required' }),
  name: z.string().min(1, 'Pet name is required').max(50, 'Pet name must be less than 50 characters'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  color: z.string().optional(),
  markings: z.string().optional(),
  microchipId: z.string().optional(),
  lastSeen: z.string().optional(),
  dateFound: z.string().optional(),
  location: z.string().min(1, 'Location is required').max(200, 'Location must be less than 200 characters'),
  rewardAmount: z.number().min(0, 'Reward amount must be positive').max(10000, 'Reward amount too high').optional(),
});

// Payment validation schemas
export const paymentIntentSchema = z.object({
  amountCents: z.number().int().min(50, 'Minimum amount is $0.50').max(1000000, 'Maximum amount is $10,000'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('usd'),
  reportId: z.string().optional(),
});

export const checkoutSessionSchema = z.object({
  amountCents: z.number().int().min(50, 'Minimum amount is $0.50').max(1000000, 'Maximum amount is $10,000'),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional(),
  reportId: z.string().optional(),
});

export const paypalOrderSchema = z.object({
  amount: z.string().regex(/^\d+\.\d{2}$/, 'Amount must be in format 0.00'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
});

export const paypalCaptureSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

// Email validation schemas
export const emailSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  html: z.string().optional(),
  text: z.string().optional(),
}).refine(data => data.html || data.text, {
  message: 'Either HTML or text content is required',
});

// Vision API validation schemas
export const visionLabelsSchema = z.object({
  imageBase64: z.string().optional(),
  url: z.string().url('Invalid image URL').optional(),
}).refine(data => data.imageBase64 || data.url, {
  message: 'Either imageBase64 or url is required',
});

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query must be less than 100 characters'),
  filters: z.object({
    species: z.string().optional(),
    breed: z.string().optional(),
    location: z.string().optional(),
    radius: z.number().min(0).max(1000).optional(),
    dateRange: z.object({
      start: z.number().optional(),
      end: z.number().optional(),
    }).optional(),
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Message validation schemas
export const messageSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  content: z.string().min(1, 'Message content is required').max(1000, 'Message must be less than 1000 characters'),
});

// Saved search validation schemas
export const savedSearchSchema = z.object({
  name: z.string().min(1, 'Search name is required').max(50, 'Name must be less than 50 characters'),
  species: z.string().optional(),
  breed: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().min(0).max(1000).optional(),
});

// Admin validation schemas
export const adminActionSchema = z.object({
  action: z.enum(['ban_user', 'unban_user', 'delete_report', 'feature_report']),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.string().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File, 'File is required'),
  type: z.enum(['image', 'document']),
  maxSize: z.number().optional().default(5 * 1024 * 1024), // 5MB default
});

// Coordinate validation
export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lon: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
