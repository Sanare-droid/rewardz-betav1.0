/**
 * Shared types between client and server
 */

export interface User {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  color?: string;
  markings?: string;
  microchipId?: string;
  photoUrl?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Report {
  id: string;
  type: "lost" | "found";
  status: "open" | "closed" | "reunited";
  name: string;
  species: string;
  breed: string;
  color?: string;
  markings?: string;
  microchipId?: string;
  lastSeen?: string;
  dateFound?: string;
  location: string;
  lat?: number | null;
  lon?: number | null;
  pubLat?: number | null;
  pubLon?: number | null;
  rewardAmount?: number;
  photoUrl?: string;
  pawPhotoUrl?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  keywords: string[];
  visionLabels?: string[];
  rewardPaid?: boolean;
}

export interface Message {
  id: string;
  reportId: string;
  userId: string;
  content: string;
  createdAt: number;
  isRead: boolean;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  species?: string;
  breed?: string;
  location?: string;
  radius?: number;
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Payment Types
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  amount: number;
  currency: string;
}

// Search and Matching
export interface SearchFilters {
  species?: string;
  breed?: string;
  location?: string;
  radius?: number;
  dateRange?: {
    start: number;
    end: number;
  };
}

export interface MatchResult {
  report: Report;
  score: number;
  reasons: string[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Form Types
export interface ReportFormData {
  name: string;
  species: string;
  breed: string;
  color: string;
  markings: string;
  microchipId: string;
  lastSeen: string;
  location: string;
  offerReward: boolean;
  rewardAmount?: number;
  photo?: File;
  pawPhoto?: File;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: "match" | "message" | "reward" | "system";
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: number;
}
