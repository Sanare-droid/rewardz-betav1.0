import { useEffect, useState } from "react";
import MobileLayout from "@/components/rewardz/MobileLayout";
import AlertListItem from "@/components/rewardz/AlertListItem";
import { useUser } from "@/context/UserContext";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Report = {
  id: string;
  type: "lost" | "found";
  species?: string;
  location?: string;
  rewardAmount?: number;
  photoUrl?: string;
};

export default function Saved() {
  const { user } = useUser();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!user) return;
    const col = collection(db, "users", user.uid, "saved");
    const unsub = onSnapshot(col, async (snap) => {
      const ids = snap.docs.map((d) => d.id);
      const items: Report[] = [];
      for (const id of ids) {
        const r = await getDoc(doc(db, "reports", id));
        if (r.exists()) items.push({ id: r.id, ...(r.data() as any) });
      }
      setReports(items);
    });
    return () => unsub();
  }, [user]);

  return (
    <MobileLayout title="Saved" back>
      <div className="mt-2">
        {reports.map((r) => (
          <AlertListItem
            key={r.id}
            id={r.id}
            title={`${r.type === "lost" ? "Lost" : "Found"} ${r.species || "Pet"}`}
            subtitle={r.location || "Unknown"}
            badge={r.rewardAmount ? `$${r.rewardAmount}` : undefined}
            accent={r.type === "lost" ? "berry" : "teal"}
            image={
              r.photoUrl ||
              "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop"
            }
          />
        ))}
        {reports.length === 0 && (
          <div className="text-center text-sm text-gray-500 mt-10">
            No saved reports yet.
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
