import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PetView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [pet, setPet] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      const snap = await getDoc(doc(db, "users", user.uid, "pets", id));
      if (snap.exists()) setPet({ id: snap.id, ...(snap.data() as any) });
    })();
  }, [user, id]);

  return (
    <MobileLayout title="Pet Profile" back>
      {pet ? (
        <div className="mt-2">
          {pet.photoUrl && (
            <div className="h-40 w-full rounded-xl overflow-hidden bg-muted">
              <img
                src={pet.photoUrl}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="mt-3 rounded-xl border p-3">
            <div className="font-semibold text-lg">{pet.name || "Pet"}</div>
            <div className="text-sm text-gray-600">
              {pet.species || ""} {pet.breed || ""}
            </div>
            {pet.color && <div className="text-sm">Color: {pet.color}</div>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/pets/${id}/edit`)}
            >
              Edit
            </Button>
            <Button onClick={() => navigate(`/report-lost`)}>
              Report Lost
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">Loading...</div>
      )}
    </MobileLayout>
  );
}
