import MobileLayout from "@/components/rewardz/MobileLayout";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";

function Row({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between py-4 border-b">
      <span>{label}</span>
      <span>›</span>
    </Link>
  );
}

export default function Profile() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  return (
    <MobileLayout title="Profile">
      <div className="mt-2">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
            <img
              src={
                user?.photoURL ||
                "https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2Fff10cdd90c224f579a914ee9f717dc9c?format=webp&width=800"
              }
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-lg font-semibold">
              {user?.name || "Member"}
            </div>
            <div className="text-sm text-gray-500">{user?.email || ""}</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border p-3">
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs text-gray-500">Reports</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-2xl font-bold">$700</div>
            <div className="text-xs text-gray-500">Rewards</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-gray-500">Matches</div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border">
          <Row to="/alerts" label="My Reports" />
          <Row to="/pets" label="My Pets" />
          <Row to="/pets/new" label="Add Pet" />
          <Row to="/account" label="Edit Profile" />
          <Row to="/saved" label="Saved" />
          <Row to="/messages" label="Messages" />
          <Row to="/notifications" label="Notifications" />
          <Row to="/settings/messages" label="Messages Settings" />
          <Row to="/settings/notifications" label="Notification Settings" />
          <Row to="/account" label="Account & Security" />
          <Row to="/help" label="Help & Support" />
          <Row to="/privacy" label="Privacy & Policy" />
          <Row to="/poster/1" label="Download Poster" />
          {user?.email === "mzangasanare@gmail.com" && (
            <Row to="/admin" label="Admin" />
          )}
          <div className="p-4">
            <Button
              className="w-full h-10 rounded-full"
              variant="outline"
              onClick={async () => {
                // Clear all onboarding state on logout
                localStorage.removeItem('skipPetOnboarding');
                localStorage.removeItem('onboardingComplete');
                // Clear user-specific onboarding keys
                if (user?.uid) {
                  localStorage.removeItem(`onboarding_${user.uid}`);
                }
                await logout();
                navigate("/splash");
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
