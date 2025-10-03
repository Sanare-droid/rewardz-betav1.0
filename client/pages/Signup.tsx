import MobileLayout from "@/components/rewardz/MobileLayout";
import FormInput from "@/components/rewardz/FormInput";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { friendlyAuthError, validatePassword } from "@/lib/auth";

export default function Signup() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const { signup } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  return (
    <MobileLayout>
      <div className="text-center mt-2">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl font-black text-primary">
          R
        </div>
        <h1 className="text-2xl font-semibold">Create Your Rewardz Account</h1>
      </div>
      <div className="mt-6">
        <label className="block mb-3">
          <span className="block text-sm mb-1">Full name</span>
          <input ref={nameRef} className="w-full h-11 rounded-xl border px-3" />
        </label>
        <label className="block mb-3">
          <span className="block text-sm mb-1">Email</span>
          <input
            ref={emailRef}
            type="email"
            placeholder="janedoe@gmail.com"
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        <label className="block mb-3">
          <span className="block text-sm mb-1">Password</span>
          <input
            ref={passwordRef}
            type="password"
            className="w-full h-11 rounded-xl border px-3"
            placeholder="At least 8 characters incl. a symbol"
          />
        </label>
        <label className="block mb-3">
          <span className="block text-sm mb-1">Confirm password</span>
          <input
            ref={confirmRef}
            type="password"
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <FormInput label="Current location (Optional)" placeholder="Location" />
        <Button
          className="mt-2 w-full h-12 rounded-full"
          disabled={loading}
          onClick={async () => {
            setError(null);
            setLoading(true);
            try {
              const name = nameRef.current?.value?.trim() || "Member";
              const email = emailRef.current?.value?.trim() || "";
              const password = passwordRef.current?.value || "";
              const confirm = confirmRef.current?.value || "";
              if (!email) throw new Error("Enter your email");
              const pwErr = validatePassword(password);
              if (pwErr) throw new Error(pwErr);
              if (password !== confirm) throw new Error("Passwords do not match");
              await signup(name, email, password);
              // New users should go to pet onboarding
              navigate("/pet-onboarding");
            } catch (e: any) {
              setError(friendlyAuthError(e));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Creating..." : "Create Account"}
        </Button>
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-primary">
            Log In
          </Link>
        </p>
      </div>
    </MobileLayout>
  );
}
