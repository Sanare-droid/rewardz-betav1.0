# Rewardz API Documentation

## Base URL
- Development: `http://localhost:8080`
- Production: `https://your-domain.com`

## Authentication
Most endpoints require authentication via Firebase Auth token in the Authorization header:
```
Authorization: Bearer <firebase-token>
```

## Endpoints

### Health Check
```http
GET /health
```
Returns server health status.

**Response:**
```json
{
  "ok": true
}
```

### Ping
```http
GET /api/ping
```
Simple ping endpoint for testing.

**Response:**
```json
{
  "message": "Rewardz API is running"
}
```

### Demo
```http
GET /api/demo
```
Demo endpoint with shared types.

**Response:**
```json
{
  "message": "Hello from Express server"
}
```

## Payment Endpoints

### Create Checkout Session
```http
POST /api/payments/create-checkout-session
```
Create a Stripe checkout session for payment.

**Request Body:**
```json
{
  "amountCents": 5000,
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "reportId": "report-id"
}
```

**Response:**
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### Create Payment Intent
```http
POST /api/payments/create-payment-intent
```
Create a Stripe payment intent for direct payments.

**Request Body:**
```json
{
  "amountCents": 5000,
  "currency": "usd",
  "reportId": "report-id"
}
```

**Response:**
```json
{
  "clientSecret": "pi_..._secret_..."
}
```

### PayPal Create Order
```http
POST /api/payments/paypal/create-order
```
Create a PayPal order.

**Request Body:**
```json
{
  "amount": "50.00",
  "currency": "USD"
}
```

**Response:**
```json
{
  "id": "order-id"
}
```

### PayPal Capture Order
```http
POST /api/payments/paypal/capture
```
Capture a PayPal order.

**Request Body:**
```json
{
  "orderId": "order-id"
}
```

**Response:**
```json
{
  "status": "COMPLETED"
}
```

### Stripe Webhook
```http
POST /api/webhooks/stripe
```
Stripe webhook endpoint for payment confirmations.

**Headers:**
```
stripe-signature: <signature>
```

## Notification Endpoints

### Send Email
```http
POST /api/notify/email
```
Send email notification.

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Pet Found!",
  "html": "<h1>Your pet has been found!</h1>",
  "text": "Your pet has been found!"
}
```

**Response:**
```json
{
  "id": "email-id"
}
```

## Vision API Endpoints

### Get Image Labels
```http
POST /api/vision/labels
```
Analyze image and return labels using Google Vision API.

**Request Body:**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "url": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "labels": ["Dog", "Pet", "Animal"]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "validation error"
  }
}
```

## Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- API endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Payment endpoints: 10 requests per hour

## Request/Response Examples

### Successful Payment
```bash
curl -X POST http://localhost:8080/api/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "amountCents": 5000,
    "reportId": "report-123"
  }'
```

### Send Email Notification
```bash
curl -X POST http://localhost:8080/api/notify/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "owner@example.com",
    "subject": "Pet Found!",
    "text": "Your lost dog has been found!"
  }'
```

## Webhooks

### Stripe Webhook Events
The Stripe webhook endpoint handles the following events:
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed

### Webhook Security
All webhooks are verified using signature validation to ensure authenticity.
