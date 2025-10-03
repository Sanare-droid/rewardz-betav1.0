import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_...';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_...';
process.env.PAYPAL_CLIENT_ID = 'test_client_id';
process.env.PAYPAL_SECRET = 'test_secret';
process.env.RESEND_API_KEY = 're_test_...';
process.env.GOOGLE_VISION_API_KEY = 'test_vision_key';

describe('API Routes', () => {
  let app: any;

  beforeEach(() => {
    app = createServer();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });
  });

  describe('GET /api/ping', () => {
    it('should return ping message', async () => {
      const response = await request(app)
        .get('/api/ping')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/demo', () => {
    it('should return demo response', async () => {
      const response = await request(app)
        .get('/api/demo')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Hello from Express server',
      });
    });
  });

  describe('POST /api/notify/email', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const response = await request(app)
        .post('/api/notify/email')
        .send(emailData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/notify/email')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/vision/labels', () => {
    it('should return labels for image', async () => {
      const imageData = {
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
      };

      // Mock fetch for Google Vision API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          responses: [{
            labelAnnotations: [
              { description: 'Dog' },
              { description: 'Pet' },
            ],
          }],
        }),
      });

      const response = await request(app)
        .post('/api/vision/labels')
        .send(imageData)
        .expect(200);

      expect(response.body).toHaveProperty('labels');
      expect(Array.isArray(response.body.labels)).toBe(true);
    });

    it('should return error for missing image', async () => {
      const response = await request(app)
        .post('/api/vision/labels')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/payments/create-checkout-session', () => {
    it('should create checkout session', async () => {
      const paymentData = {
        amountCents: 5000,
        reportId: 'test-report-id',
      };

      // Mock Stripe
      const mockStripe = {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              id: 'cs_test_...',
              url: 'https://checkout.stripe.com/...',
            }),
          },
        },
      };

      vi.doMock('stripe', () => ({
        default: vi.fn(() => mockStripe),
      }));

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
    });

    it('should return error for invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .send({ amountCents: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
