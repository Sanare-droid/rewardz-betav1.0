import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function AlertListItem({
  id = 1,
  title = "Lost Cat",
  subtitle = "Kilimani • 2h ago",
  badge = "$500",
  accent = "berry" as "berry" | "mint" | "teal",
  image,
  to,
}: {
  id?: string | number;
  title?: string;
  subtitle?: string;
  badge?: string;
  accent?: "berry" | "mint" | "teal";
  image?: string;
  to?: string;
}) {
  const accentColor =
    accent === "berry"
      ? "var(--brand-berry)"
      : accent === "mint"
        ? "var(--brand-mint)"
        : "var(--brand-teal)";
  const status = (title || "").toLowerCase().startsWith("lost")
    ? "LOST"
    : (title || "").toLowerCase().startsWith("found")
      ? "FOUND"
      : "";
  return (
    <Link
      to={to || `/report/${id}`}
      className="flex items-center gap-3 py-3 border-b"
    >
      <div className="relative h-14 w-14 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
        <img
          src={
            image ??
            "https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2Fbecfd88f2cca487b8d7408049a6a4f34?format=webp&width=800"
          }
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        {status && (
          <span
            className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: `hsl(${accentColor})` }}
          >
            {status}
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: `hsl(${accentColor})` }}
          >
            {title}
          </span>
          {badge && (
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-xs border"
              style={{
                borderColor: `hsl(${accentColor})`,
                color: `hsl(${accentColor})`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600">{subtitle}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}
