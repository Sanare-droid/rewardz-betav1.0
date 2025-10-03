import MobileLayout from "@/components/rewardz/MobileLayout";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function TabButton({ active, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm ${active ? "bg-primary text-white" : "bg-[hsl(var(--brand-mint))] text-primary"}`}
    >
      {children}
    </button>
  );
}

function Item({
  title,
  time,
  unread,
  onClick,
}: {
  title: string;
  time: string;
  unread?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left py-4 border-b">
      <div className="flex items-center gap-3">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2F7ae47ea61c4c415383da525a619f06e9?format=webp&width=800"
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium">{title}</p>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
          <p className="text-sm text-gray-600">
            {unread ? "New update on your report." : "Opened"}
          </p>
        </div>
        {unread && (
          <span className="ml-2 h-2 w-2 rounded-full bg-[hsl(var(--brand-berry))]" />
        )}
      </div>
    </button>
  );
}

export default function Notifications() {
  const [tab, setTab] = useState<"mine" | "general">("mine");
  const { user } = useUser();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, [user]);

  const unread = useMemo(() => items.filter((n) => !n.read), [items]);
  const seen = useMemo(() => items.filter((n) => !!n.read), [items]);

  const openNotification = async (n: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", n.id), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch {}
    if (n.type === "sighting" && n.reportId) navigate(`/owner/${n.reportId}`);
    else if (n.reportId) navigate(`/report/${n.reportId}`);
  };

  return (
    <MobileLayout title="Notifications" back>
      <div className="mt-2 flex gap-2">
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
          My Reports
        </TabButton>
        <TabButton active={tab === "general"} onClick={() => setTab("general")}>
          General
        </TabButton>
        {unread.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            onClick={async () => {
              if (!user) return;
              await Promise.all(
                unread.map((n) =>
                  updateDoc(doc(db, "users", user.uid, "notifications", n.id), {
                    read: true,
                    readAt: serverTimestamp(),
                  }).catch(() => {}),
                ),
              );
            }}
          >
            Mark all read
          </Button>
        )}
      </div>

      <h3 className="mt-6 text-sm text-gray-500">New</h3>
      <div>
        {unread.map((n) => (
          <Item
            key={n.id}
            title={
              n.title ||
              (n.type === "sighting" ? "New sighting reported" : "Update")
            }
            time={
              n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ""
            }
            unread
            onClick={() => openNotification(n)}
          />
        ))}
        {unread.length === 0 && (
          <div className="text-sm text-gray-500 py-6">
            No new notifications.
          </div>
        )}
      </div>

      <h3 className="mt-6 text-sm text-gray-500">Seen</h3>
      <div>
        {seen.map((n) => (
          <Item
            key={n.id}
            title={
              n.title ||
              (n.type === "sighting" ? "Sighting reported" : "Update")
            }
            time={
              n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ""
            }
            onClick={() => openNotification(n)}
          />
        ))}
        {seen.length === 0 && (
          <div className="text-sm text-gray-500 py-6">
            No seen notifications yet.
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
