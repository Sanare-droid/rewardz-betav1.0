import MobileLayout from "@/components/rewardz/MobileLayout";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";

export default function Payment() {
  const [amount, setAmount] = useState(500);
  const [prButton, setPrButton] = useState<HTMLElement | null>(null);
  const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
    | string
    | undefined;
  const stripePromise = useMemo(
    () => (stripePk ? loadStripe(stripePk) : Promise.resolve(null as any)),
    [stripePk],
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const params = new URLSearchParams(window.location.search);
  const reportId = params.get("report") || undefined;
  const amtParam = params.get("amount");

  useEffect(() => {
    if (amtParam) {
      const v = parseInt(amtParam, 10);
      if (!isNaN(v)) setAmount(v);
    }
  }, [amtParam]);

  useEffect(() => {
    (async () => {
      const stripe = await stripePromise;
      if (!stripe) return;
      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: { label: "Rewardz Escrow", amount },
        requestPayerEmail: true,
      });
      const result = await pr.canMakePayment();
      if (result) {
        const el = pr.mount(containerRef.current!);
        if (el) setPrButton(el);
        pr.on("paymentmethod", async (ev) => {
          const res = await fetch("/api/payments/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amountCents: amount, reportId }),
          });
          const data = await res.json();
          if (!res.ok) {
            ev.complete("fail");
            return;
          }
          const { clientSecret } = data;
          const { paymentIntent, error: confirmError } =
            await stripe.confirmCardPayment(
              clientSecret,
              { payment_method: ev.paymentMethod.id },
              { handleActions: false },
            );
          if (confirmError) {
            ev.complete("fail");
            return;
          }
          ev.complete("success");
          if (paymentIntent?.status === "requires_action") {
            await stripe.confirmCardPayment(clientSecret);
          }
          window.location.href = "/payment-success";
        });
      }
    })();
  }, [amount, reportId, stripePromise]);

  return (
    <MobileLayout title="Payment" back>
      <div className="grid grid-cols-2 gap-3">
        {[500, 1000, 2000, 5000].map((v) => (
          <button
            key={v}
            className={`px-4 py-2 rounded-full border ${amount === v ? "bg-[hsl(var(--brand-mint))] text-primary" : ""}`}
            onClick={() => setAmount(v)}
          >
            ${v / 100}
          </button>
        ))}
      </div>
      <p className="text-sm mt-2">Express payment methods</p>
      <div className="mt-2 space-y-2">
        <div ref={containerRef} />
        {!prButton && (
          <div className="text-xs text-gray-500">
            Apple Pay / Google Pay unavailable
          </div>
        )}
      </div>
      <div className="mt-6 rounded-xl border p-3">
        <div className="font-medium mb-2">Pay with PayPal</div>
        <PayPalScriptProvider
          options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "" }}
        >
          <PayPalButtons
            style={{ layout: "horizontal" }}
            createOrder={async () => {
              const r = await fetch("/api/payments/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: (amount / 100).toFixed(2) }),
              });
              const data = await r.json();
              return data.id;
            }}
            onApprove={async (data) => {
              await fetch("/api/payments/paypal/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: (data as any).orderID }),
              });
              window.location.href = "/payment-success";
            }}
          />
        </PayPalScriptProvider>
      </div>
      <Button
        className="mt-6 w-full h-12 rounded-full"
        onClick={async () => {
          const res = await fetch("/api/payments/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amountCents: amount, reportId }),
          });
          const data = await res.json();
          if (res.ok && data.url) window.location.href = data.url;
        }}
      >
        Checkout
      </Button>
    </MobileLayout>
  );
}
