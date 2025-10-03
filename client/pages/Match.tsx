import MobileLayout from "@/components/rewardz/MobileLayout";
import PetBadgeCard from "@/components/rewardz/PetBadgeCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Match() {
  const navigate = useNavigate();
  return (
    <MobileLayout title="Potential Match Found!" back>
      <PetBadgeCard />
      <div
        className="mt-4 rounded-xl bg-primary/15 p-4 text-white"
        style={{ backgroundColor: "hsl(var(--brand-teal))" }}
      >
        <p>
          <span className="font-semibold">Pet Name:</span> Simba
        </p>
        <p className="mt-1 text-sm">Last Seen: February 2, 2025 at 3:00 PM</p>
        <p className="text-sm">Location: near Argwings Kodhek Road.</p>
      </div>
      <div className="mt-6 space-y-3">
        <Button
          onClick={() => navigate("/report/1")}
          variant="secondary"
          className="w-full h-11"
        >
          View Report
        </Button>
        <Button
          onClick={() => navigate("/owner")}
          variant="outline"
          className="w-full h-11"
        >
          It’s a Match!
        </Button>
      </div>
    </MobileLayout>
  );
}
