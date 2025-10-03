type Report = {
  id: string;
  type: "lost" | "found";
  species?: string;
  breed?: string;
  color?: string;
  markings?: string;
  lat?: number | null;
  lon?: number | null;
  pubLat?: number | null;
  pubLon?: number | null;
  lastSeen?: string;
  dateFound?: string;
  createdAt?: any;
};

function toMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (ts?.toMillis) return ts.toMillis();
  if (ts?.seconds) return ts.seconds * 1000;
  return 0;
}

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

export function matchScore(a: Report, b: Report): number {
  // Only cross-type matches are meaningful
  if (a.type === b.type) return -Infinity;
  let score = 0;
  if (
    a.species &&
    b.species &&
    a.species.toLowerCase() === b.species.toLowerCase()
  )
    score += 50;
  if (a.breed && b.breed && a.breed.toLowerCase() === b.breed.toLowerCase())
    score += 30;
  if (a.color && b.color && overlap(a.color, b.color)) score += 20;
  if (a.markings && b.markings && overlap(a.markings, b.markings)) score += 10;

  const alat = (a.pubLat ?? a.lat) as number | undefined;
  const alon = (a.pubLon ?? a.lon) as number | undefined;
  const blat = (b.pubLat ?? b.lat) as number | undefined;
  const blon = (b.pubLon ?? b.lon) as number | undefined;
  if (
    typeof alat === "number" &&
    typeof alon === "number" &&
    typeof blat === "number" &&
    typeof blon === "number"
  ) {
    const d = haversine(alat, alon, blat, blon);
    // within 1km: +30; decay afterwards
    score += Math.max(0, 30 - d / 100);
  }

  const at = toMs(a.createdAt) || (a.lastSeen ? Date.parse(a.lastSeen) : 0);
  const bt = toMs(b.createdAt) || (b.dateFound ? Date.parse(b.dateFound) : 0);
  if (at && bt) {
    const diffDays = Math.abs(at - bt) / (1000 * 60 * 60 * 24);
    // within 1 day +20, decay 2 points per day up to 10 days
    score += Math.max(0, 20 - diffDays * 2);
  }

  return score;
}

function overlap(a: string, b: string): boolean {
  const aset = new Set(
    a
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter(Boolean),
  );
  for (const t of b
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean))
    if (aset.has(t)) return true;
  return false;
}
