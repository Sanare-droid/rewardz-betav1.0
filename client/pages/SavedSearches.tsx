import { useEffect, useState } from "react";
import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

export default function SavedSearches() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const col = collection(db, "users", user.uid, "savedSearches");
    const unsub = onSnapshot(col, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, [user]);

  return (
    <MobileLayout title="Saved Searches" back>
      <div className="mt-2 space-y-3">
        {items.map((s) => (
          <div key={s.id} className="rounded-xl border p-3">
            <div className="text-sm text-gray-600">
              {JSON.stringify(s.query)}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="px-3 py-1 rounded-full border"
                onClick={() =>
                  navigate(
                    `/alerts?apply=${encodeURIComponent(JSON.stringify(s.query))}`,
                  )
                }
              >
                Apply
              </button>
              <button
                className="px-3 py-1 rounded-full border"
                onClick={async () =>
                  user &&
                  deleteDoc(doc(db, "users", user.uid, "savedSearches", s.id))
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-500">No saved searches yet.</div>
        )}
      </div>
    </MobileLayout>
  );
}
