import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useUser } from "@/context/UserContext";

export default function ConfirmReunion() {
  const [confirmed, setConfirmed] = useState(false);
  const [allowed, setAllowed] = useState<boolean>(true);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();

  useEffect(() => {
    (async () => {
      if (!id) return;
      const r = await getDoc(doc(db, "reports", id));
      const data = r.data() as any;
      if (!data || !user || data.userId !== user.uid) setAllowed(false);
    })();
  }, [id, user]);

  return (
    <MobileLayout back>
      <div className="max-w-sm mx-auto mt-6">
        {!allowed ? (
          <div className="text-center text-sm text-gray-600">
            Only the report owner can confirm a reunion.
          </div>
        ) : (
          <>
            <div className="rounded-xl border p-4">
              <div className="text-center text-primary font-extrabold">
                FOUND
              </div>
              <img
                src="https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop"
                className="mt-3 h-40 w-full object-cover rounded-lg"
              />
            </div>
            <p className="mt-6 text-center text-lg">
              We're so happy to hear your pet is home! Please confirm so we can
              close the report.
            </p>
            <label className="mt-6 flex items-center gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="h-5 w-5"
              />
              <span>I confirm the pet has been reunited</span>
            </label>
            <Button
              disabled={!confirmed}
              onClick={async () => {
                if (!id) return;
                await updateDoc(doc(db, "reports", id), { status: "reunited" });
                navigate(`/report/${id}/claim-reward`);
              }}
              className="mt-6 w-full h-12 rounded-full bg-[hsl(var(--brand-mint))] text-primary hover:opacity-90"
            >
              Confirm Reunion
            </Button>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
