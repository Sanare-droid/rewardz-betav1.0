import MobileLayout from "@/components/rewardz/MobileLayout";
import FormInput from "@/components/rewardz/FormInput";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { friendlyAuthError } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login, resetPassword } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  return (
    <MobileLayout title="">
      <div className="text-center mt-2">
        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl font-black text-primary">
          R
        </div>
        <h1 className="text-2xl font-semibold">Welcome Back!</h1>
      </div>
      <div className="mt-6">
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
          />
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          className="text-right text-sm text-primary w-full text-left"
          onClick={async () => {
            setError(null);
            const email = emailRef.current?.value?.trim();
            if (!email) {
              setError("Enter your email to reset password");
              return;
            }
            try {
              await resetPassword(email);
              alert("Password reset email sent");
            } catch (e: any) {
              setError(e?.message || "Failed to send reset email");
            }
          }}
        >
          Forgot password?
        </button>
        <Button
          className="mt-4 w-full h-12 rounded-full"
          disabled={loading}
          onClick={async () => {
            setError(null);
            setLoading(true);
            try {
              const email = emailRef.current?.value?.trim() || "";
              const password = passwordRef.current?.value || "";
              await login(email, password);
              
              // Small delay to ensure auth state is updated
              setTimeout(async () => {
                // Check if user has pets after login
                const { auth } = await import("@/lib/firebase");
                if (auth.currentUser) {
                  const petsSnapshot = await getDocs(
                    collection(db, "users", auth.currentUser.uid, "pets")
                  );
                  
                  if (petsSnapshot.empty) {
                    // No pets, go to pet onboarding
                    navigate("/pet-onboarding");
                  } else {
                    // Has pets, go to home
                    navigate("/");
                  }
                } else {
                  navigate("/");
                }
              }, 500);
            } catch (e: any) {
              setError(friendlyAuthError(e));
              setLoading(false);
            }
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
        <p className="mt-6 text-center text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-primary">
            Create account
          </Link>
        </p>
      </div>
    </MobileLayout>
  );
}
