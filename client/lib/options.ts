export const SPECIES_OPTIONS = ["Dog", "Cat", "Other"] as const;

export const DOG_BREEDS = [
  "Mixed",
  "German Shepherd",
  "Labrador Retriever",
  "Golden Retriever",
  "Bulldog",
  "Beagle",
  "Poodle",
  "Rottweiler",
  "Dachshund",
  "Other",
];

export const CAT_BREEDS = [
  "Mixed",
  "Siamese",
  "Persian",
  "Maine Coon",
  "Bengal",
  "Ragdoll",
  "Sphynx",
  "British Shorthair",
  "Abyssinian",
  "Other",
];

export function breedsFor(species: string): string[] {
  if (species.toLowerCase() === "dog") return DOG_BREEDS;
  if (species.toLowerCase() === "cat") return CAT_BREEDS;
  return ["Mixed", "Other"];
}

export function obfuscateCoordinates(lat: number, lon: number) {
  // random offset within ~300m
  const radiusMeters = 300;
  const r = radiusMeters / 111111; // in degrees (~111km per degree)
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const dLat = w * Math.cos(t);
  const dLon = w * Math.sin(t) / Math.cos((lat * Math.PI) / 180);
  return { lat: +(lat + dLat).toFixed(6), lon: +(lon + dLon).toFixed(6) };
}
