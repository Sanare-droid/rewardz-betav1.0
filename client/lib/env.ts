/**
 * Environment configuration with validation
 */
import { z } from "zod";

const envSchema = z.object({
  // Firebase
  VITE_FIREBASE_API_KEY: z.string().min(1, "Firebase API key is required"),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase auth domain is required"),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, "Firebase project ID is required"),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, "Firebase storage bucket is required"),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, "Firebase messaging sender ID is required"),
  VITE_FIREBASE_APP_ID: z.string().min(1, "Firebase app ID is required"),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),

  // Payment
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1, "Stripe publishable key is required"),
  VITE_PAYPAL_CLIENT_ID: z.string().min(1, "PayPal client ID is required"),

  // Features
  VITE_VISION_ENABLED: z.string().optional().transform(val => val === "1"),
});

export const env = envSchema.parse({
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  VITE_PAYPAL_CLIENT_ID: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  VITE_VISION_ENABLED: import.meta.env.VITE_VISION_ENABLED,
});

export type Env = z.infer<typeof envSchema>;
