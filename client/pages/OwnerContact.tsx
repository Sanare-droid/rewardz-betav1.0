import MobileLayout from "@/components/rewardz/MobileLayout";
import PetBadgeCard from "@/components/rewardz/PetBadgeCard";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";

export default function OwnerContact() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    const col = collection(db, "reports", id, "messages");
    const unsub = onSnapshot(
      query(col, orderBy("createdAt", "asc"), limit(100)),
      (snap) =>
        setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    (async () => {
      const r = await getDoc(doc(db, "reports", id));
      const ownerId = (r.data() as any)?.userId as string | undefined;
      if (ownerId) {
        const u = await getDoc(doc(db, "users", ownerId));
        setOwnerEmail((u.data() as any)?.email || null);
      }
    })();
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    const lastRef = doc(db, "users", user.uid, "threads", id);
    import("firebase/firestore").then(({ setDoc }) =>
      setDoc(lastRef, { lastRead: Date.now() }, { merge: true }).catch(
        () => {},
      ),
    );
  }, [id, user]);

  const send = async () => {
    const text = inputRef.current?.value?.trim();
    if (!id) return;
    if (!user) {
      alert("Please log in to send a message");
      return;
    }
    let photoUrl: string | undefined;
    const f = fileRef.current?.files?.[0] || null;
    if (f) {
      const path = `messages/${id}/${Date.now()}_${f.name}`;
      const { getDownloadURL, ref, uploadBytes } = await import(
        "firebase/storage"
      );
      const { storage } = await import("@/lib/firebase");
      const sref = ref(storage, path);
      await uploadBytes(sref, f);
      photoUrl = await getDownloadURL(sref);
    }
    await addDoc(collection(db, "reports", id, "messages"), {
      text: text || null,
      photoUrl: photoUrl || null,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    if (inputRef.current) inputRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <MobileLayout title="Contact Owner" back>
      <PetBadgeCard />
      <div
        className="mt-4 rounded-xl p-4"
        style={{ backgroundColor: "hsl(var(--brand-teal))" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/dialer")}
            className="h-11"
            variant="secondary"
          >
            <Phone className="mr-2 h-4 w-4" /> Phone
          </Button>
          <Button
            className="h-11"
            variant="secondary"
            onClick={async () => {
              const to = ownerEmail;
              if (!to) return;
              await fetch("/api/notify/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to,
                  subject: "New message about your report",
                  text: "You have a new message in Rewardz.",
                }),
              });
            }}
          >
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
        </div>
      </div>

      <div className="mt-4 h-64 overflow-y-auto border rounded-xl p-3 bg-white/60">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-2 ${m.userId === user?.uid ? "text-right" : "text-left"}`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-2xl ${m.userId === user?.uid ? "bg-[hsl(var(--brand-mint))]" : "bg-gray-100"}`}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 items-center">
        <input
          ref={inputRef}
          placeholder="Type a message"
          className="flex-1 h-11 rounded-xl border px-3"
        />
        <input ref={fileRef} type="file" accept="image/*" />
        <Button onClick={send} className="h-11 rounded-xl">
          Send
        </Button>
      </div>
    </MobileLayout>
  );
}
