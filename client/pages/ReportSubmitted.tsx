import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import ShareSheet from "@/components/rewardz/ShareSheet";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ReportSubmitted() {
  const [share, setShare] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = useMemo(() => params.get("id"), [params]);
  return (
    <MobileLayout>
      <div className="mt-14 text-center max-w-sm mx-auto">
        <div className="mx-auto h-24 w-24 rounded-full bg-[hsl(var(--brand-berry))] text-white flex items-center justify-center">
          <Check className="h-12 w-12" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">Report Submitted!</h2>
        <p className="mt-3 text-gray-700">
          Thank you for helping reunite this pet with its owner.
        </p>
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => id && navigate(`/report/${id}`)}
            variant="secondary"
            className="w-full h-11"
            disabled={!id}
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
        </div>
      </div>
      <ShareSheet open={share} onClose={() => setShare(false)} />
    </MobileLayout>
  );
}
