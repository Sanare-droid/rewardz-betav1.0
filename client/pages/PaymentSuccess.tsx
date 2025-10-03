import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import ShareSheet from "@/components/rewardz/ShareSheet";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const [share, setShare] = useState(false);
  const navigate = useNavigate();
  return (
    <MobileLayout>
      <div className="mt-14 text-center max-w-sm mx-auto">
        <div className="mx-auto h-24 w-24 rounded-full bg-[hsl(var(--brand-berry))] text-white flex items-center justify-center">
          <Check className="h-12 w-12" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">
          Reward successfully offered!
        </h2>
        <p className="mt-3 text-gray-700">
          You've offered a reward of $500 for Simba's safe return. Let's get
          them home!
        </p>
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => navigate("/report/1")}
            variant="secondary"
            className="w-full h-11"
          >
            View Report
          </Button>
          <Button
            onClick={() => setShare(true)}
            variant="outline"
            className="w-full h-11"
          >
            Share
          </Button>
          <Button variant="outline" className="w-full h-11">
            Download Report
          </Button>
        </div>
      </div>
      <ShareSheet open={share} onClose={() => setShare(false)} />
    </MobileLayout>
  );
}
