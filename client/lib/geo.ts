function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function geocode(
  address: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await withTimeout(
      fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "RewardzApp/1.0 (contact: support@rewardz.app)",
          Referer: window.location.origin,
        },
      }),
    );
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await withTimeout(
      fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "RewardzApp/1.0 (contact: support@rewardz.app)",
          Referer: window.location.origin,
        },
      }),
    );
    const data = await res.json();
    if (data?.display_name) {
      // Return a simplified address
      const parts = data.display_name.split(',');
      // Take first 3-4 parts for a concise address
      return parts.slice(0, 4).join(',').trim();
    }
  } catch (e) {
    console.error('Reverse geocode error:', e);
  }
  return null;
}

export { withTimeout };

export function tokenize(...parts: (string | undefined)[]): string[] {
  const tokens = parts.filter(Boolean).flatMap((p) =>
    (p as string)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
  return Array.from(new Set(tokens));
}
