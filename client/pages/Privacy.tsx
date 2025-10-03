import MobileLayout from "@/components/rewardz/MobileLayout";

export default function Privacy() {
  return (
    <MobileLayout title="Privacy & Policy" back>
      <div className="mt-2 space-y-4 text-sm">
        <p>
          We collect information you provide (account details, reports,
          messages) and location data you submit to help reunite pets with
          owners.
        </p>
        <p>
          Data is stored securely in our database and used to power search,
          alerts, maps, and messaging. We do not sell your data.
        </p>
        <p>
          You can request deletion of your account and reports at any time.
          Contact support for data requests.
        </p>
      </div>
    </MobileLayout>
  );
}
