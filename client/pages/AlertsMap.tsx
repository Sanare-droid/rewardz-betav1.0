// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MobileLayout from "@/components/rewardz/MobileLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";

const pinIcon = new L.Icon({
  iconUrl:
    "https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2Fa66f9adeaba648f28fae900c976ceae0?format=webp&width=64",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -24],
});

type Report = {
  id: string;
  type: "lost" | "found";
  name?: string;
  species?: string;
  location?: string;
  rewardAmount?: number;
  photoUrl?: string;
  lat?: number | null;
  lon?: number | null;
};

export default function AlertsMap() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loc, setLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    const base = collection(db, "reports");
    const q = query(base, where("status", "!=", "closed"));
    const unsub = onSnapshot(q, (snap) => {
      const items: Report[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter(
          (r) =>
            typeof (r.pubLat ?? r.lat) === "number" &&
            typeof (r.pubLon ?? r.lon) === "number",
        );
      setReports(items);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc([pos.coords.latitude, pos.coords.longitude]),
      () => setLoc(null),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 },
    );
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (loc) return loc;
    if (reports.length)
      return [
        (reports[0] as any).pubLat ?? (reports[0].lat as number),
        (reports[0] as any).pubLon ?? (reports[0].lon as number),
      ];
    return [0.0236, 37.9062];
  }, [loc, reports]);

  return (
    <MobileLayout title="Alerts Map" back>
      <div className="mb-2 text-xs text-gray-600">
        Approximate locations are shown to protect privacy.
      </div>
      <div
        className="relative rounded-xl overflow-hidden border"
        style={{ height: 460 }}
      >
        <div className="absolute top-2 left-2 z-[1000] rounded-md bg-white/90 px-2 py-1 text-[11px] shadow">
          Legend: Lost (berry) • Found (teal)
        </div>
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((r) => (
            <Marker
              key={r.id}
              position={[
                (r as any).pubLat ?? (r.lat as number),
                (r as any).pubLon ?? (r.lon as number),
              ]}
              icon={pinIcon}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <div className="font-semibold mb-1">
                    {r.type === "lost" ? "Lost" : "Found"} {r.species || "Pet"}
                  </div>
                  {r.photoUrl ? (
                    <img
                      src={r.photoUrl}
                      className="h-24 w-full object-cover rounded-md"
                    />
                  ) : null}
                  <div className="text-sm mt-2">
                    {r.name ? (
                      <div>
                        Pet Name: <strong>{r.name}</strong>
                      </div>
                    ) : null}
                    {typeof r.rewardAmount === "number" ? (
                      <div>Reward: ${r.rewardAmount}</div>
                    ) : null}
                    <div className="text-xs text-gray-600 mt-1">
                      Approximate location shown for privacy
                    </div>
                  </div>
                  <Link
                    to={`/report/${r.id}`}
                    className="inline-block mt-2 text-primary underline"
                  >
                    View report
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </MobileLayout>
  );
}
