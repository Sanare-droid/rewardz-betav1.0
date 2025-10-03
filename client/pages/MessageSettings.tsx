import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function MessageSettings() {
  const { user } = useUser();
  const [allow, setAllow] = useState<"none" | "verified" | "everyone">(
    "verified",
  );

  useEffect(() => {
    (async () => {
      if (!user) return;
      const s = await getDoc(
        doc(db, "users", user.uid, "settings", "messages"),
      );
      const v = (s.data() as any)?.allow as typeof allow | undefined;
      if (v) setAllow(v);
    })();
  }, [user]);

  const save = async (v: typeof allow) => {
    setAllow(v);
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "settings", "messages"),
      { allow: v },
      { merge: true },
    );
  };

  return (
    <MobileLayout title="Messages" back>
      <div className="mt-2">
        <div className="text-sm text-gray-600">Allow message request from</div>
        <div className="mt-2 space-y-2">
          {(
            [
              { k: "none", label: "No one" },
              { k: "verified", label: "Verified Users" },
              { k: "everyone", label: "Everyone" },
            ] as const
          ).map((o) => (
            <label
              key={o.k}
              className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
            >
              <input
                type="radio"
                name="allow"
                checked={allow === o.k}
                onChange={() => save(o.k)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        <a
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border"
          href="/settings/notifications"
        >
          Push notifications
        </a>
      </div>
    </MobileLayout>
  );
}
