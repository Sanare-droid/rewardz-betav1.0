import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate("/onboarding"), 1200);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "hsl(var(--brand-mint))" }}
    >
      <div className="text-center">
        <div className="mx-auto mb-6 h-24 w-24 rounded-2xl bg-primary/20 flex items-center justify-center text-5xl font-black text-primary">
          R
        </div>
        <h1 className="text-2xl font-semibold text-primary">Rewardz</h1>
        <p className="mt-2 text-lg">Your Community for Lost Pet Recovery.</p>
      </div>
    </div>
  );
}
