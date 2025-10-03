import MobileLayout from "@/components/rewardz/MobileLayout";
import AlertListItem from "@/components/rewardz/AlertListItem";
import AlertsFilter, {
  AlertsAdvancedFilter,
} from "@/components/rewardz/AlertsFilter";
import { db } from "@/lib/firebase";
import {
  setDoc,
  doc,
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";

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

export default function Search() {
  const [search, setSearch] = useState("");
  const [near, setNear] = useState(false);
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [advanced, setAdvanced] = useState<AlertsAdvancedFilter | null>(null);
  const { user } = useUser();

  const [photo, setPhoto] = useState<File | null>(null);
  const [labels, setLabels] = useState<string[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!near) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setMe(null),
    );
  }, [near]);

  useEffect(() => {
    const on = () => setShowFilter(true);
    window.addEventListener("open-filter", on as any);
    return () => window.removeEventListener("open-filter", on as any);
  }, []);

  useEffect(() => {
    (async () => {
      if (!photo) {
        setLabels(null);
        return;
      }
      const b64 = await toBase64(photo);
      try {
        const r = await fetch("/api/vision/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: b64.replace(/^data:[^,]+,/, ""),
          }),
        });
        const data = await r.json();
        if (r.ok) setLabels(data.labels || []);
        else {
          setLabels(null);
          (await import("@/components/ui/use-toast")).toast({
            title: "Photo scan unavailable",
            description: data?.error || "Missing configuration",
            variant: "destructive" as any,
          });
        }
      } catch (e: any) {
        setLabels(null);
      }
    })();
  }, [photo]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = reports.filter((r) =>
      q ? (r.keywords || []).some((k: string) => k.includes(q)) : true,
    );

    if (advanced) {
      list = list.filter((r) => {
        if (
          advanced.species &&
          (r.species || "").toLowerCase() !== advanced.species.toLowerCase()
        )
          return false;
        if (
          advanced.breed &&
          (r.breed || "").toLowerCase() !== advanced.breed.toLowerCase()
        )
          return false;
        if (
          advanced.color &&
          !(r.color || "").toLowerCase().includes(advanced.color.toLowerCase())
        )
          return false;
        if (
          typeof advanced.minReward === "number" &&
          (!r.rewardAmount || r.rewardAmount < advanced.minReward)
        )
          return false;
        if (advanced.hasPhoto && !r.photoUrl) return false;
        if (advanced.coords && typeof advanced.radiusKm === "number") {
          const lat = r.pubLat ?? r.lat;
          const lon = r.pubLon ?? r.lon;
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
        if (advanced.dateFrom || advanced.dateTo) {
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
        if (
          advanced.microchip &&
          (r.microchipId || "").toLowerCase() !==
            advanced.microchip.toLowerCase()
        )
          return false;
        return true;
      });
    }

    if (near && me) {
      list = list
        .map((r) => ({
          ...r,
          distance:
            r.lat && r.lon ? haversine(me.lat, me.lon, r.lat, r.lon) : Infinity,
        }))
        .filter((r) => r.distance < 5000)
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return list;
  }, [reports, search, near, me, advanced]);

  const sortedByPhoto = useMemo(() => {
    if (!labels || labels.length === 0) return visible;
    const labelSet = new Set(labels.map((l) => l.toLowerCase()));
    return [...visible]
      .map((r) => ({
        r,
        score: Array.isArray(r.visionLabels)
          ? (r.visionLabels as string[]).reduce(
              (acc, l) => acc + (labelSet.has((l || "").toLowerCase()) ? 1 : 0),
              0,
            )
          : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);
  }, [visible, labels]);

  const VISION_AUTO_INDEX = import.meta.env.VITE_VISION_AUTO_INDEX === "1";
  useEffect(() => {
    if (!VISION_AUTO_INDEX) return;
    (async () => {
      if (!reports.length) return;
      for (const r of reports) {
        if (!r.photoUrl || Array.isArray(r.visionLabels)) continue;
        try {
          const resp = await fetch("/api/vision/labels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: r.photoUrl }),
          });
          const data = await resp.json();
          if (resp.ok && Array.isArray(data.labels)) {
            await updateDoc(doc(db, "reports", r.id), {
              visionLabels: data.labels,
            });
          }
        } catch {}
      }
    })();
  }, [reports, VISION_AUTO_INDEX]);

  async function toBase64(f: File) {
    return await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.readAsDataURL(f);
    });
  }

  return (
    <MobileLayout title="Search">
      <div className="mt-2">
        <div className="rounded-xl border p-3 space-y-3">
          <input
            className="w-full h-11 rounded-lg border px-3"
            placeholder="Search pets, breeds, locations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 text-sm items-center">
            <button
              className={`px-3 py-1 rounded-full border ${near ? "bg-[hsl(var(--brand-mint))] text-primary" : ""}`}
              onClick={() => setNear((v) => !v)}
            >
              Near me
            </button>
            <label className="ml-auto px-3 py-1 rounded-full border cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
              {photo ? "Photo selected" : "Photo scan"}
            </label>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            className="px-3 py-1 rounded-full border"
            onClick={async () => {
              if (!user) return;
              await setDoc(
                doc(db, "users", user.uid, "savedSearches", String(Date.now())),
                { query: advanced || {} },
              );
            }}
          >
            Save search
          </button>
          <a className="ml-auto underline text-sm" href="/saved-searches">
            Saved searches
          </a>
        </div>
        {!labels && photo && (
          <div className="mt-2 rounded-xl border p-3 text-sm text-red-700 bg-red-50">
            Photo scan couldn't run. Ensure Google Vision API key is configured
            on the server.
          </div>
        )}
        <div className="mt-4">
          {(labels ? sortedByPhoto : visible).map((r) => (
            <AlertListItem
              key={r.id}
              id={r.id}
              title={`${r.type === "lost" ? "Lost" : "Found"} ${r.name || r.species || "Pet"}`}
              subtitle={`${r.location || "Unknown"}${r.distance ? ` • ${(r.distance / 1000).toFixed(1)}km` : ""}`}
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
        onApply={(f) => setAdvanced(f)}
      />
    </MobileLayout>
  );
}
