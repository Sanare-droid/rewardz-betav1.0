import { useEffect, useState } from "react";
import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link, useNavigate } from "react-router-dom";

export default function Pets() {
  const { user } = useUser();
  const [pets, setPets] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const col = collection(db, "users", user.uid, "pets");
    const unsub = onSnapshot(col, (snap) =>
      setPets(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, [user]);

  return (
    <MobileLayout title="My Pets" back>
      <div className="mt-2">
        <button
          className="px-4 py-2 rounded-full bg-[hsl(var(--brand-mint))] text-primary"
          onClick={() => navigate("/pets/new")}
        >
          Add Pet
        </button>
        <div className="mt-3 space-y-3">
          {pets.map((p) => (
            <Link
              key={p.id}
              to={`/pets/${p.id}`}
              className="block rounded-xl border p-3"
            >
              <div className="font-medium">{p.name || "Pet"}</div>
              <div className="text-sm text-gray-600">
                {p.species || ""} {p.breed || ""}
              </div>
            </Link>
          ))}
          {pets.length === 0 && (
            <div className="text-sm text-gray-500">No pets yet.</div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
