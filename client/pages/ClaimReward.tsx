import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function ClaimReward() {
  const { id } = useParams<{ id: string }>();
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "reports", id));
      const data = snap.data() as any;
      setAmount(data?.rewardAmount ?? null);
    })();
  }, [id]);

  const handleClaim = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: id,
          amountCents: amount ? Math.round(amount * 100) : undefined,
          successUrl: window.location.origin + `/payment-success`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start checkout");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="mt-20 text-center max-w-sm mx-auto">
        <div className="mx-auto h-24 w-24 rounded-full bg-[hsl(var(--brand-berry))] text-white flex items-center justify-center">
          <Check className="h-12 w-12" />
        </div>
        <p className="mt-6 text-lg">
          You successfully reunited the pet with their owner. Thank you!
        </p>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
        <Button
          className="mt-6 w-full h-12 rounded-full"
          variant="outline"
          disabled={loading}
          onClick={handleClaim}
        >
          {loading
            ? "Starting..."
            : `Claim Reward${amount ? ` ($${amount})` : ""}`}
        </Button>
      </div>
    </MobileLayout>
  );
}
