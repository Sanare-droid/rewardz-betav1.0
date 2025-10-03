export default function PetBadgeCard({
  status = "LOST",
  amount,
  photoUrl,
  accent = "berry",
}: {
  status?: string;
  amount?: number;
  photoUrl?: string;
  accent?: "berry" | "teal" | "mint";
}) {
  const accentColor =
    accent === "berry"
      ? "hsl(var(--brand-berry))"
      : accent === "mint"
        ? "hsl(var(--brand-mint))"
        : "hsl(var(--brand-teal))";
  return (
    <div className="rounded-xl border p-3 text-center">
      <div
        className="text-lg font-extrabold tracking-wide"
        style={{ color: accentColor }}
      >
        {status}
      </div>
      <img
        src={
          photoUrl ||
          "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop"
        }
        alt="Pet"
        className="mt-2 h-40 w-full object-cover rounded-lg"
      />
      {typeof amount === "number" && (
        <>
          <div className="mt-2 font-bold">${amount}</div>
          <div className="text-xs text-muted-foreground">REWARD</div>
        </>
      )}
    </div>
  );
}
