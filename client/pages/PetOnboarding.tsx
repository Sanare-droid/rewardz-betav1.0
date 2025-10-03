import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";

export default function PetOnboarding() {
  const { user } = useUser();
  const navigate = useNavigate();
  const name = user?.name || "there";
  return (
    <MobileLayout back>
      <div className="mt-2 text-center">
        <h1 className="text-2xl font-semibold">
          <span className="text-primary">Welcome</span> to Rewardz, {name}!
        </h1>
        <div className="mt-4 flex items-center justify-center">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2F2d29d6a004d74addbe844214539d3825?format=webp&width=800"
            alt="Dog and cat"
            className="w-64 h-64 object-contain"
          />
        </div>
        <p className="mx-auto max-w-[28ch] mt-2 text-gray-700">
          Now let's add your furry friend to our community. Register your pet
          now for a safer and more connected experience.
        </p>
        <div className="mt-6 space-y-3">
          <Button
            className="w-full h-12 rounded-full text-base"
            onClick={() => navigate("/pets/new")}
          >
            Register Your Pet
          </Button>
          <button
            className="block mx-auto text-primary underline"
            onClick={() => {
              localStorage.setItem("skipPetOnboarding", "1");
              navigate("/");
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
