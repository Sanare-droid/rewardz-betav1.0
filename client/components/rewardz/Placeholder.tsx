import MobileLayout from "./MobileLayout";

export default function Placeholder({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <MobileLayout title={title}>
      <div className="mt-6 text-center text-muted-foreground">
        <p className="mb-4">This page is ready to be built next.</p>
        <div className="rounded-2xl border p-6">
          {children ?? (
            <p>Continue with instructions to fill in this screen.</p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
