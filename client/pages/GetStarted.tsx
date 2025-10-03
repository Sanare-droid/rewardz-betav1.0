import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function GetStarted() {
  return (
    <MobileLayout>
      <div className="text-center mt-10">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl font-black text-primary">
          R
        </div>
        <h2 className="text-2xl font-semibold text-primary">
          Ready to get started?
        </h2>
        <p className="mt-2">
          Create an account or log in to begin using Rewardz.
        </p>
        <div className="mt-8 space-y-3">
          <Button asChild className="w-full h-12 rounded-full text-base">
            <Link to="/signup">Create Account</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full h-12 rounded-full text-base"
          >
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
