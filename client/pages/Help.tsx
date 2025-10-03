import MobileLayout from "@/components/rewardz/MobileLayout";

export default function Help() {
  return (
    <MobileLayout title="Help & Support" back>
      <div className="mt-2 space-y-4 text-sm">
        <p>
          If you need assistance with reports, rewards, or your account, reach
          us at support@example.com. For urgent pet sightings, use the Contact
          Owner button on each report.
        </p>
        <p>
          Tips: Keep notifications enabled, add clear pet photos, and include
          precise last-seen locations and times.
        </p>
      </div>
    </MobileLayout>
  );
}
