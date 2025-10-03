import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export default function Messages() {
  const { user } = useUser();
  const [reportIds, setReportIds] = useState<string[]>([]);
  const [threads, setThreads] = useState<
    Record<string, { report: any; last?: any; unread: number }>
  >({});

  useEffect(() => {
    if (!user) return;
    const myReportsQ = query(
      collection(db, "reports"),
      where("userId", "==", user.uid),
    );
    const unsub1 = onSnapshot(myReportsQ, (snap) => {
      const ids = new Set<string>(reportIds);
      snap.docs.forEach((d) => ids.add(d.id));
      setReportIds(Array.from(ids));
    });

    // Try collectionGroup to find messages referencing this user across reports.
    const msgsQ = query(
      collectionGroup(db, "messages"),
      where("userId", "==", user.uid),
    );
    let unsub2: (() => void) | null = null;

    // Pre-check whether the collectionGroup query is allowed (avoids noisy runtime error)
    (async () => {
      try {
        await getDocs(
          query(
            collectionGroup(db, "messages"),
            where("userId", "==", user.uid),
            limit(1),
          ),
        );
        // If successful, install realtime listener
        unsub2 = onSnapshot(
          msgsQ,
          (snap) => {
            const ids = new Set<string>();
            snap.docs.forEach((d) => {
              const parent = d.ref.parent.parent;
              if (parent) ids.add(parent.id);
            });
            setReportIds((prev) => Array.from(new Set([...prev, ...ids])));
          },
          (err: any) => {
            console.error("collectionGroup messages error", err);
            // Don't show error toast for index issues, handle gracefully
            if (!err?.message?.includes('index')) {
              toast({
                title: "Messages loading error",
                description: "Some messages may not be visible",
              });
            }
          },
        );
      } catch (err: any) {
        // Likely a missing index — inform user once and provide link
        console.log("CollectionGroup query needs index:", err);
        const msg = err?.message || "Firestore collectionGroup error";
        const link =
          err?.message?.match(
            /https:\/\/console\.firebase\.google\.com\S+/,
          )?.[0] ||
          `https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/firestore/indexes`;
        // Only show the toast once per session
        const indexToastShown = sessionStorage.getItem('indexToastShown');
        if (!indexToastShown) {
          sessionStorage.setItem('indexToastShown', 'true');
          toast({
            title: "Setting up messages",
            description: `First-time setup: ${link}`,
          });
        }

        // Fallback: scan recent reports and check their messages subcollection for messages by this user.
        (async () => {
          try {
            const ids = new Set<string>();
            const reportsSnap = await getDocs(
              query(
                collection(db, "reports"),
                orderBy("createdAt", "desc"),
                limit(200),
              ),
            );
            for (const r of reportsSnap.docs) {
              const rid = r.id;
              try {
                const msgs = await getDocs(
                  query(
                    collection(db, "reports", rid, "messages"),
                    where("userId", "==", user.uid),
                    limit(1),
                  ),
                );
                if (!msgs.empty) ids.add(rid);
              } catch (inner) {
                // ignore per-report errors
              }
            }
            if (ids.size > 0) {
              setReportIds((prev) =>
                Array.from(new Set([...prev, ...Array.from(ids)])),
              );
              toast({
                title: "Partial messages loaded",
                description:
                  "Loaded conversations via fallback. Consider creating the Firestore index for better performance.",
              });
            } else {
              // nothing found via fallback — still notify user
              toast({
                title: "No conversations found",
                description:
                  "We couldn't locate messages via fallback. Creating the Firestore index will enable realtime inbox.",
              });
            }
          } catch (scanErr) {
            console.error("fallback scan error", scanErr);
            toast({
              title: "Error scanning reports",
              description: (scanErr as any)?.message || String(scanErr),
            });
          }
        })();
      }
    })();

    return () => {
      unsub1();
      if (unsub2) unsub2();
    };
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const out: Record<string, { report: any; last?: any; unread: number }> =
        {};
      for (const id of reportIds) {
        const r = await getDoc(doc(db, "reports", id));
        if (!r.exists()) continue;
        const report = { id: r.id, ...(r.data() as any) };
        const lastSnap = await getDocs(
          query(
            collection(db, "reports", id, "messages"),
            orderBy("createdAt", "desc"),
            limit(20),
          ),
        );
        const last = lastSnap.docs[0]?.data();
        const lastReadDoc = await getDoc(
          doc(db, "users", user.uid, "threads", id),
        );
        const lastRead = (lastReadDoc.data() as any)?.lastRead || 0;
        const unread = lastSnap.docs.filter((d) => {
          const m = d.data() as any;
          const ts = m.createdAt?.toMillis
            ? m.createdAt.toMillis()
            : m.createdAt?.seconds
              ? m.createdAt.seconds * 1000
              : 0;
          return ts > lastRead && m.userId !== user.uid;
        }).length;
        out[id] = { report, last, unread };
      }
      setThreads(out);
    })();
  }, [reportIds, user]);

  const items = Object.values(threads).sort((a, b) => {
    const at = a.last?.createdAt?.toMillis
      ? a.last.createdAt.toMillis()
      : a.last?.createdAt?.seconds
        ? a.last.createdAt.seconds * 1000
        : 0;
    const bt = b.last?.createdAt?.toMillis
      ? b.last.createdAt.toMillis()
      : b.last?.createdAt?.seconds
        ? b.last.createdAt.seconds * 1000
        : 0;
    return bt - at;
  });

  return (
    <MobileLayout title="Messages" back>
      <div className="mt-2">
        {items.map(({ report, last, unread }) => (
          <Link
            key={report.id}
            to={`/owner/${report.id}`}
            className="flex items-center gap-3 py-3 border-b"
          >
            <img
              src={
                report.photoUrl ||
                "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop"
              }
              className="h-14 w-14 rounded-lg object-cover border"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{`${report.type === "lost" ? "Lost" : "Found"} ${report.species || "Pet"}`}</span>
                {unread > 0 && (
                  <span className="ml-auto text-xs rounded-full px-2 py-0.5 bg-[hsl(var(--brand-berry))] text-white">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {last?.photoUrl
                  ? "Photo"
                  : last?.text || "Start a conversation"}
              </div>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <div className="text-center text-sm text-gray-500 mt-10">
            No conversations yet.
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
