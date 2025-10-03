import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

const ADMINS = ["mzangasanare@gmail.com"];

export default function Admin() {
  const { user } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc")),
      (snap) =>
        setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    const unsub2 = onSnapshot(
      query(collection(db, "reports"), orderBy("createdAt", "desc")),
      (snap) =>
        setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  if (!user || !ADMINS.includes(user.email || "")) {
    return (
      <MobileLayout title="Admin" back>
        <div className="mt-6 text-sm text-gray-500">Access denied.</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Admin" back>
      <div className="mt-2">
        <h3 className="font-semibold">Posts</h3>
        <div className="rounded-2xl border divide-y">
          {posts.map((p) => (
            <div key={p.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{p.author}</div>
                <div className="text-sm text-gray-600 line-clamp-1">
                  {p.text}
                </div>
              </div>
              <button
                className="px-3 py-1 rounded-full border"
                onClick={() =>
                  updateDoc(doc(db, "posts", p.id), { hidden: !p.hidden })
                }
              >
                {p.hidden ? "Unhide" : "Hide"}
              </button>
              <button
                className="px-3 py-1 rounded-full border"
                onClick={() => deleteDoc(doc(db, "posts", p.id))}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mt-6">Reports</h3>
        <div className="rounded-2xl border divide-y">
          {reports.map((r) => (
            <div key={r.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">
                  {r.name || "Pet"} ({r.type})
                </div>
                <div className="text-sm text-gray-600 line-clamp-1">
                  {r.location}
                </div>
              </div>
              <button
                className="px-3 py-1 rounded-full border"
                onClick={() =>
                  updateDoc(doc(db, "reports", r.id), {
                    status: r.status === "hidden" ? "open" : "hidden",
                  })
                }
              >
                {r.status === "hidden" ? "Unhide" : "Hide"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
