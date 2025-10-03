import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { validatePassword } from "@/lib/auth";

export default function ResetPassword() {
  const [status, setStatus] = useState<string | null>(null);
  const [valid, setValid] = useState(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const code = params.get("oobCode") || "";
  const pwRef = useRef<HTMLInputElement>(null);
  const cpwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!code) return;
        await verifyPasswordResetCode(auth, code);
        setValid(true);
      } catch (e: any) {
        setStatus("Invalid or expired reset link");
      }
    })();
  }, [code]);

  const submit = async () => {
    setStatus(null);
    const pw = pwRef.current?.value || "";
    const cpw = cpwRef.current?.value || "";
    const err = validatePassword(pw);
    if (err) return setStatus(err);
    if (pw !== cpw) return setStatus("Passwords do not match");
    try {
      await confirmPasswordReset(auth, code, pw);
      setStatus("Password updated. You can now log in.");
    } catch (e: any) {
      setStatus(e?.message || "Failed to reset password");
    }
  };

  return (
    <MobileLayout>
      <div className="text-center mt-2">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl font-black text-primary">
          R
        </div>
        <h1 className="text-2xl font-semibold">Reset Password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your new password
        </p>
      </div>
      <div className="mt-6">
        <label className="block mb-3">
          <span className="block text-sm mb-1">New Password</span>
          <input
            ref={pwRef}
            type="password"
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        <label className="block mb-3">
          <span className="block text-sm mb-1">Confirm password</span>
          <input
            ref={cpwRef}
            type="password"
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        {status && (
          <div
            className={`text-sm mt-1 ${status.includes("updated") ? "text-green-700" : "text-red-600"}`}
          >
            {status}
          </div>
        )}
        <Button
          disabled={!valid}
          onClick={submit}
          className="mt-2 w-full h-12 rounded-full"
        >
          Reset
        </Button>
      </div>
    </MobileLayout>
  );
}
