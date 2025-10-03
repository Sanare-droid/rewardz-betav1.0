import type { RequestHandler } from "express";
import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
if (!stripeSecret)
  console.warn("[payments] STRIPE_SECRET_KEY not set; Stripe disabled");
if (!webhookSecret)
  console.warn(
    "[payments] STRIPE_WEBHOOK_SECRET not set; webhook verification disabled",
  );
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

function paypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_SECRET || "";
  if (!clientId || !secret) {
    console.warn("[payments] PAYPAL_CLIENT_ID/SECRET not set; PayPal disabled");
  }
  const env =
    process.env.PAYPAL_ENV === "live"
      ? new paypal.core.LiveEnvironment(clientId, secret)
      : new paypal.core.SandboxEnvironment(clientId, secret);
  return new paypal.core.PayPalHttpClient(env);
}

export const createCheckoutSession = async (req: any, res: any) => {
  try {
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });
    const { amountCents, successUrl, cancelUrl, reportId } = req.body || {};
    if (!amountCents || amountCents <= 0)
      return res.status(400).json({ error: "Invalid amount" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Rewardz Claim" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || req.headers.origin + "/payment-success",
      cancel_url:
        cancelUrl ||
        req.headers.referer ||
        req.headers.origin ||
        "https://example.com",
      metadata: { reportId: reportId || "" },
    });
    return res.json({ id: session.id, url: session.url });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to create session" });
  }
};

export const createPaymentIntent = async (req: any, res: any) => {
  try {
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });
    const { amountCents, currency, reportId } = req.body || {};
    if (!amountCents || amountCents <= 0)
      return res.status(400).json({ error: "Invalid amount" });
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency || "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { reportId: reportId || "" },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to create intent" });
  }
};

export const createPaypalOrder = async (req: any, res: any) => {
  try {
    const { amount, currency } = req.body || {};
    if (!amount) return res.status(400).json({ error: "Missing amount" });
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        { amount: { currency_code: currency || "USD", value: String(amount) } },
      ],
    });
    const client = paypalClient();
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "PayPal create failed" });
  }
};

export const capturePaypalOrder = async (req: any, res: any) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const client = paypalClient();
    const capture = await client.execute(request);
    res.json({ status: capture.result.status });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "PayPal capture failed" });
  }
};

export const handleStripeWebhook = async (req: any, res: any) => {
  try {
    if (!stripe || !webhookSecret) return res.status(200).send("ok");
    const sig = req.headers["stripe-signature"] as string;
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const reportId = (session.metadata?.reportId as string) || "";
      // Optional: update Firestore via Admin SDK if configured
      const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (svcJson && reportId) {
        const admin = await import("firebase-admin");
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(svcJson)),
          });
        }
        const db = admin.firestore();
        await db
          .collection("reports")
          .doc(reportId)
          .set({ rewardPaid: true }, { merge: true });
      }
    }

    return res.status(200).send("ok");
  } catch (e: any) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
};
