import { useEffect, useState } from "react";
import MobileLayout from "@/components/rewardz/MobileLayout";
import { Switch } from "@/components/ui/switch";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useUser } from "@/context/UserContext";

function Row({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function NotificationSettings() {
  const { user } = useUser();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = doc(db, "users", user.uid, "settings", "notifications");
      const snap = await getDoc(ref);
      const data = snap.data() as any;
      if (data) {
        setPush(!!data.push);
        setEmail(!!data.email);
        setSms(!!data.sms);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "settings", "notifications");
    setDoc(ref, { push, email, sms }, { merge: true });
  }, [push, email, sms, user]);

  return (
    <MobileLayout title="Notifications" back>
      <div className="mt-2 rounded-2xl border">
        <Row
          label="Push notifications"
          checked={push}
          onCheckedChange={setPush}
        />
        <Row
          label="Email notifications"
          checked={email}
          onCheckedChange={setEmail}
        />
        <Row label="SMS notifications" checked={sms} onCheckedChange={setSms} />
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Delivery providers (push/email/SMS) require configuration; when
        connected, your preferences will apply.
      </p>
    </MobileLayout>
  );
}
