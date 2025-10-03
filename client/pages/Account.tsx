import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { storage, db } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

export default function Account() {
  const { user, setUser } = useUser();
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<"menu" | "info" | "password" | "deactivate">(
    "menu",
  );
  const [saving, setSaving] = useState(false);

  const reauth = async () => {
    if (!user?.uid || !user?.email) throw new Error("Not signed in");
    const pwd = currentPasswordRef.current?.value || "";
    const cred = EmailAuthProvider.credential(user.email, pwd);
    await reauthenticateWithCredential((user as any).auth.currentUser, cred);
  };

  const doUpdateEmail = async () => {
    try {
      await reauth();
      const newEmail = emailRef.current?.value || "";
      await updateEmail((user as any).auth.currentUser, newEmail);
      setMessage("Email updated");
    } catch (e: any) {
      setMessage(e?.message || "Failed to update email");
    }
  };

  const doUpdatePassword = async () => {
    try {
      await reauth();
      const newPwd = passwordRef.current?.value || "";
      await updatePassword((user as any).auth.currentUser, newPwd);
      setMessage("Password updated");
    } catch (e: any) {
      setMessage(e?.message || "Failed to update password");
    }
  };

  const doUpdateProfile = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const displayName = nameRef.current?.value || "";
      let photoURL: string | undefined = undefined;
      const f = photoRef.current?.files?.[0];
      if (f) {
        const p = `avatars/${user.uid}-${Date.now()}-${f.name}`;
        const sref = ref(storage, p);
        await uploadBytes(sref, f);
        photoURL = await getDownloadURL(sref);
      }
      await updateProfile((user as any).auth.currentUser, {
        displayName: displayName || undefined,
        photoURL,
      });
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: displayName || null,
          photoURL: photoURL || null,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      setUser({
        ...(user as any),
        name: displayName || (user as any).name,
        photoURL: photoURL ?? (user as any).photoURL,
      });
      setMessage("Profile updated");
      if (nameRef.current) nameRef.current.value = displayName;
      if (photoRef.current) photoRef.current.value = "";
    } catch (e: any) {
      setMessage(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout title="Account Settings" back>
      {view === "menu" && (
        <div className="mt-2 space-y-3">
          <button
            className="w-full flex items-center justify-between p-4 rounded-2xl border"
            onClick={() => setView("info")}
          >
            <span>Profile & Account</span>
            <span>›</span>
          </button>
          <button
            className="w-full flex items-center justify-between p-4 rounded-2xl border"
            onClick={() => setView("password")}
          >
            <span>Change Password</span>
            <span>›</span>
          </button>
          <button
            className="w-full flex items-center justify-between p-4 rounded-2xl border"
            onClick={() => setView("deactivate")}
          >
            <span>Deactivate Account</span>
            <span>›</span>
          </button>
        </div>
      )}

      {view === "info" && (
        <div className="mt-2 space-y-6">
          <div className="rounded-2xl border p-4">
            <div className="font-medium mb-2">Profile</div>
            <div className="flex items-center gap-3">
              <img
                src={
                  (user as any)?.photoURL ||
                  "https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2Fff10cdd90c224f579a914ee9f717dc9c?format=webp&width=800"
                }
                className="h-16 w-16 rounded-full object-cover"
              />
              <div className="flex-1 grid gap-2">
                <input
                  ref={nameRef}
                  defaultValue={user?.name || ""}
                  placeholder="Full name"
                  className="h-11 rounded-xl border px-3"
                />
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                className="h-10 flex-1"
                onClick={doUpdateProfile}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="font-medium mb-2">Change Email</div>
            <input
              ref={emailRef}
              type="email"
              placeholder="New email"
              className="w-full h-11 rounded-xl border px-3"
            />
            <div className="mt-2 text-xs text-gray-500">
              Enter current password to confirm
            </div>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="font-medium mb-2">Current Password</div>
            <input
              ref={currentPasswordRef}
              type="password"
              placeholder="Current password"
              className="w-full h-11 rounded-xl border px-3"
            />
          </div>
          <Button className="h-11 w-full" onClick={doUpdateEmail}>
            Update Email
          </Button>
          {message && <div className="text-sm text-gray-600">{message}</div>}
        </div>
      )}

      {view === "password" && (
        <div className="mt-2 space-y-6">
          <div className="rounded-2xl border p-4">
            <div className="font-medium mb-2">Change Password</div>
            <input
              ref={passwordRef}
              type="password"
              placeholder="New password"
              className="w-full h-11 rounded-xl border px-3"
            />
          </div>
          <div className="rounded-2xl border p-4">
            <div className="font-medium mb-2">Current Password</div>
            <input
              ref={currentPasswordRef}
              type="password"
              placeholder="Current password"
              className="w-full h-11 rounded-xl border px-3"
            />
          </div>
          <Button
            className="h-11 w-full"
            variant="outline"
            onClick={doUpdatePassword}
          >
            Update Password
          </Button>
          {message && <div className="text-sm text-gray-600">{message}</div>}
        </div>
      )}

      {view === "deactivate" && (
        <div className="mt-2 space-y-4">
          <div className="rounded-2xl border p-4">
            <div className="font-medium mb-2">Deactivate Account</div>
            <p className="text-sm text-gray-600">
              Contact support to deactivate your account permanently.
            </p>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
