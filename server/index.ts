import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  createCheckoutSession,
  handleStripeWebhook,
  createPaymentIntent,
  createPaypalOrder,
  capturePaypalOrder,
} from "./routes/payments";
import { sendEmail } from "./routes/notify";
import { labelsFromImage } from "./routes/vision";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler, asyncHandler } from "./middleware/errorHandler";
import { 
  corsOptions, 
  apiRateLimit, 
  authRateLimit, 
  paymentRateLimit,
  sanitizeInput,
  requestSizeLimit 
} from "./middleware/security";

export function createServer() {
  const app = express();

  // Security middleware (CSP disabled for development)
  // app.use(securityHeaders); // Disabled to prevent CSP blocking
  app.use(cors(corsOptions));
  app.use(sanitizeInput);
  app.use(requestSizeLimit("15mb"));
  
  // Request logging (re-enabled with error handling)
  app.use((req, res, next) => {
    try {
      logger.logRequest(req, res, next);
    } catch (error) {
      console.log('Logger error, continuing without logging:', error);
      next();
    }
  });

  // Stripe webhook must consume raw body before JSON parser
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    handleStripeWebhook,
  );
  
  // Body parsing
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Payments (with rate limiting)
  app.post("/api/payments/create-checkout-session", paymentRateLimit, asyncHandler(createCheckoutSession));
  app.post("/api/payments/create-payment-intent", paymentRateLimit, asyncHandler(createPaymentIntent));
  app.post("/api/payments/paypal/create-order", paymentRateLimit, asyncHandler(createPaypalOrder));
  app.post("/api/payments/paypal/capture", paymentRateLimit, asyncHandler(capturePaypalOrder));
  
  // Notifications
  app.post("/api/notify/email", apiRateLimit, asyncHandler(sendEmail));

  // Vision
  app.post("/api/vision/labels", apiRateLimit, asyncHandler(labelsFromImage));

  // Serve static files for SPA
  app.use(express.static('dist/spa'));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'dist/spa' });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
