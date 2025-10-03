import MobileLayout from "@/components/rewardz/MobileLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const next = () => (step < 2 ? setStep(step + 1) : navigate("/get-started"));
  const back = () => (step > 0 ? setStep(step - 1) : navigate("/"));
  return (
    <MobileLayout>
      <div className="relative">
        <button onClick={back} className="absolute -top-2 -left-2 p-2">
          <ChevronLeft />
        </button>
      </div>
      <div className="mt-2">
        {step === 0 && (
          <div>
            <div className="relative">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2F3ca9917ebefd47a4a4d27aadaa32eaa2?format=webp&width=800"
                className="h-64 w-full object-cover rounded-3xl"
                alt="Welcome hero"
              />
              <h2 className="absolute left-5 top-5 text-white text-2xl font-bold drop-shadow-md">
                Welcome to Rewardz!
              </h2>
            </div>
            <p className="mt-6 text-lg">
              We're here to help you find your lost pet and reunite other lost
              pets with their families.
            </p>
          </div>
        )}
        {step === 1 && (
          <div>
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2Fa12a7ec6defe4ebf9491effb04b405b9?format=webp&width=800"
              className="h-64 w-full object-cover rounded-3xl"
              alt="How it works"
            />
            <h3 className="mt-6 text-xl font-semibold text-primary">
              How Rewardz Works
            </h3>
            <ul className="mt-3 space-y-2 text-base">
              <li>• Report your lost pet with photos and details.</li>
              <li>• Connect with a supportive community.</li>
              <li>• Browse found pets and alerts in your area.</li>
              <li>• Offer rewards to incentivize search efforts.</li>
            </ul>
          </div>
        )}
        {step === 2 && (
          <div>
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2Fc1f8d7368ad146c5b033e2a142fd133b?format=webp&width=800"
              className="h-64 w-full object-cover rounded-3xl"
              alt="Join community"
            />
            <h3 className="mt-6 text-xl font-semibold text-primary">
              Join the Rewardz Community
            </h3>
            <p className="mt-3">
              Help reunite lost pets with their owners. Share information and
              support each other.
            </p>
          </div>
        )}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/get-started")}
            className="text-primary"
          >
            Skip
          </button>
          <div className="flex gap-1">
            <span
              className={`h-2 w-2 rounded-full ${step === 0 ? "bg-primary" : "bg-gray-300"}`}
            />
            <span
              className={`h-2 w-2 rounded-full ${step === 1 ? "bg-primary" : "bg-gray-300"}`}
            />
            <span
              className={`h-2 w-2 rounded-full ${step === 2 ? "bg-primary" : "bg-gray-300"}`}
            />
          </div>
          <Button onClick={next} className="rounded-full px-6">
            {step < 2 ? "Next" : "Get Started"}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
