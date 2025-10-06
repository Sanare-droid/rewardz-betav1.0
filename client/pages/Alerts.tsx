import MobileLayout from "@/components/rewardz/MobileLayout";
import AlertListItem from "@/components/rewardz/AlertListItem";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { setDoc, doc } from "firebase/firestore";
import { useLocation, useNavigate, Link } from "react-router-dom";
import AlertsFilter, {
  AlertsAdvancedFilter,
} from "@/components/rewardz/AlertsFilter";

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border ${active ? "bg-[hsl(var(--brand-mint))] text-primary" : ""}`}
    >
      {children}
    </button>
  );
}

type Report = {
  id: string;
  type: "lost" | "found";
  name?: string;
  species?: string;
  location?: string;
  rewardAmount?: number;
  photoUrl?: string;
  createdAt?: any;
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Alerts() {
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [minReward, setMinReward] = useState<string>("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [advanced, setAdvanced] = useState<AlertsAdvancedFilter | null>(null);
  useEffect(() => {
    const on = () => setShowFilter(true);
    window.addEventListener("open-filter", on as any);
    return () => window.removeEventListener("open-filter", on as any);
  }, []);
  const { user } = useUser();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const base = collection(db, "reports");
    const q =
      filter === "all"
        ? query(base, orderBy("createdAt", "desc"))
        : query(
            base,
            where("type", "==", filter),
            orderBy("createdAt", "desc"),
          );
    const unsub = onSnapshot(q, (snap) => {
      const items: Report[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setReports(items);
    });
    return () => unsub();
  }, [filter]);

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const apply = params.get("apply");
    if (apply) {
      try {
        const q = JSON.parse(apply);
        setSpecies(q.species || "");
        setMinReward(q.minReward ? String(q.minReward) : "");
        setHasPhoto(!!q.hasPhoto);
        setAdvanced(q);
      } catch {}
      const n = new URL(window.location.href);
      n.searchParams.delete("apply");
      navigate(n.pathname + n.search, { replace: true });
    }
  }, [loc.search, navigate]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (
        q &&
        ![r.name, r.species, r.location].some((v) =>
          (v || "").toLowerCase().includes(q),
        )
      )
        return false;
      if (species && (r.species || "").toLowerCase() !== species.toLowerCase())
        return false;
      if (minReward && (!r.rewardAmount || r.rewardAmount < Number(minReward)))
        return false;
      if (hasPhoto && !r.photoUrl) return false;

      // Advanced
      if (
        advanced?.name &&
        !(r.name || "").toLowerCase().includes(advanced.name.toLowerCase())
      )
        return false;
      if (
        advanced?.breed &&
        (r as any).breed &&
        (r as any).breed.toLowerCase() !== advanced.breed.toLowerCase()
      )
        return false;
      if (
        advanced?.color &&
        !(r as any).color?.toLowerCase().includes(advanced.color.toLowerCase())
      )
        return false;
      if (
        advanced?.microchip &&
        (r as any).microchipId &&
        (r as any).microchipId.toLowerCase() !==
          advanced.microchip.toLowerCase()
      )
        return false;
      if (
        typeof advanced?.minReward === "number" &&
        (!r.rewardAmount || r.rewardAmount < advanced.minReward)
      )
        return false;
      if (advanced?.hasPhoto && !r.photoUrl) return false;

      if (advanced?.coords && typeof advanced.radiusKm === "number") {
        const lat = (r as any).pubLat ?? (r as any).lat;
        const lon = (r as any).pubLon ?? (r as any).lon;
        if (typeof lat === "number" && typeof lon === "number") {
          const d = haversine(
            advanced.coords.lat,
            advanced.coords.lon,
            lat,
            lon,
          );
          if (d > (advanced.radiusKm || 0) * 1000) return false;
        }
      }
      if (advanced?.dateFrom || advanced?.dateTo) {
        const ts = (r as any).createdAt;
        const ms = ts?.toMillis
          ? ts.toMillis()
          : ts?.seconds
            ? ts.seconds * 1000
            : 0;
        if (advanced.dateFrom && ms < new Date(advanced.dateFrom).getTime())
          return false;
        if (
          advanced.dateTo &&
          ms > new Date(advanced.dateTo + "T23:59:59").getTime()
        )
          return false;
      }

      return true;
    });
  }, [reports, search, species, minReward, hasPhoto, advanced]);

  return (
    <MobileLayout title="Alerts">
      <div className="mt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <div className="inline-flex rounded-full bg-muted p-1">
            <button
              className={`px-4 py-1.5 rounded-full text-sm ${filter === "all" ? "bg-[hsl(var(--brand-mint))] text-primary" : "text-primary/80"}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm ${filter === "lost" ? "bg-[hsl(var(--brand-mint))] text-primary" : "text-primary/80"}`}
              onClick={() => setFilter("lost")}
            >
              Lost
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm ${filter === "found" ? "bg-[hsl(var(--brand-mint))] text-primary" : "text-primary/80"}`}
              onClick={() => setFilter("found")}
            >
              Found
            </button>
          </div>
          <Link
            to="/alerts/map"
            className="ml-auto px-3 py-1 rounded-full text-sm border bg-[hsl(var(--brand-mint))] text-primary"
          >
            Map View
          </Link>
          <button
            onClick={() => setShowFilter(true)}
            className="px-3 py-1 rounded-full text-sm border"
          >
            Filter
          </button>
        </div>
        <div className="mt-1 text-sm text-gray-600">Find a Match</div>
        <div className="mt-3 rounded-2xl border p-3 space-y-2">
          <input
            className="w-full h-10 rounded-lg border px-3"
            placeholder="Search alerts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="h-10 rounded-lg border px-3"
              placeholder="Species (e.g., Dog)"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            />
            <input
              className="h-10 rounded-lg border px-3"
              placeholder="Min reward ($)"
              value={minReward}
              onChange={(e) => setMinReward(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasPhoto}
              onChange={(e) => setHasPhoto(e.target.checked)}
            />{" "}
            Has photo
          </label>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-full border"
              onClick={() => {
                setSpecies("");
                setMinReward("");
                setHasPhoto(false);
              }}
            >
              Clear
            </button>
            {user && (
              <button
                className="px-3 py-1 rounded-full border bg-[hsl(var(--brand-mint))] text-primary"
                onClick={async () => {
                  await setDoc(
                    doc(
                      db,
                      "users",
                      user.uid,
                      "savedSearches",
                      String(Date.now()),
                    ),
                    {
                      query: {
                        species,
                        minReward: minReward ? Number(minReward) : undefined,
                        hasPhoto,
                      },
                    },
                  );
                }}
              >
                Save search
              </button>
            )}
            <Link to="/saved-searches" className="ml-auto text-sm underline">
              Saved searches
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm text-gray-500">New</h3>
          {visible.map((r) => (
            <AlertListItem
              key={r.id}
              id={r.id}
              title={r.name || `${r.type === "lost" ? "Lost" : "Found"} ${r.species || "Pet"}`}
              subtitle={`${r.location || "Unknown"}`}
              badge={r.rewardAmount ? `$${r.rewardAmount}` : undefined}
              accent={r.type === "lost" ? "berry" : "teal"}
              image={
                r.photoUrl ||
                "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop"
              }
            />
          ))}
        </div>
      </div>
      <AlertsFilter
        open={showFilter}
        onOpenChange={setShowFilter}
        initial={advanced}
        onApply={(f) => {
          setSpecies(f.species || "");
          setMinReward(
            typeof f.minReward === "number" ? String(f.minReward) : "",
          );
          setHasPhoto(!!f.hasPhoto);
          setAdvanced(f);
        }}
      />
    </MobileLayout>
  );
}
