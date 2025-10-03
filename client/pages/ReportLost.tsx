import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useUser } from "@/context/UserContext";
import { autoMatch } from "@/lib/matching";
import { geocode, tokenize } from "@/lib/geo";
import {
  SPECIES_OPTIONS,
  breedsFor,
  obfuscateCoordinates,
} from "@/lib/options";

export default function ReportLost() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [species, setSpecies] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [color, setColor] = useState("");
  const [microchipId, setMicrochipId] = useState("");
  const [markings, setMarkings] = useState("");
  const [lastSeen, setLastSeen] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pawFile, setPawFile] = useState<File | null>(null);
  const [offerReward, setOfferReward] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const VISION_ENABLED = import.meta.env.VITE_VISION_ENABLED === "1";
  const handleSubmit = async () => {
    setError(null);
    if (!user) {
      setError("Please log in to submit a report");
      return;
    }
    const finalSpecies =
      species === "Other" ? customSpecies.trim() : species.trim();
    const finalBreed = breed === "Other" ? customBreed.trim() : breed.trim();
    if (!name.trim()) return setError("Pet name is required");
    if (!finalSpecies) return setError("Species is required");
    if (!location.trim()) return setError("Location is required");
    setLoading(true);
    try {
      let photoUrl: string | undefined = undefined;
      let pawPhotoUrl: string | undefined = undefined;
      if (file) {
        const path = `reports/${user?.uid || "anon"}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        photoUrl = await getDownloadURL(fileRef);
      }
      if (pawFile) {
        const path = `reports/${user?.uid || "anon"}/${Date.now()}_paw_${pawFile.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, pawFile);
        pawPhotoUrl = await getDownloadURL(fileRef);
      }
      const rewardAmount = offerReward ? 500 : undefined;
      const loc = location.trim();
      const coords = loc ? await geocode(loc) : null;
      const pub = coords ? obfuscateCoordinates(coords.lat, coords.lon) : null;
      const refDoc = await addDoc(collection(db, "reports"), {
        type: "lost",
        status: "open",
        name,
        breed: finalBreed,
        species: finalSpecies,
        color,
        microchipId: microchipId || null,
        markings,
        lastSeen,
        location: loc,
        rewardAmount,
        photoUrl,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        pawPhotoUrl: pawPhotoUrl || null,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
        pubLat: pub?.lat ?? null,
        pubLon: pub?.lon ?? null,
        keywords: tokenize(
          name,
          breed,
          species,
          color,
          microchipId,
          markings,
          loc,
        ),
      });
      try {
        if (VISION_ENABLED && photoUrl) {
          const r = await fetch("/api/vision/labels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: photoUrl }),
          });
          const data = await r.json();
          if (r.ok && Array.isArray(data.labels))
            await updateDoc(doc(db, "reports", refDoc.id), {
              visionLabels: data.labels,
            });
        }
      } catch {}
      // Run auto-matching in the background
      autoMatch(refDoc.id).catch(error => {
        console.error('Auto-matching failed:', error);
      });
      
      navigate(
        offerReward
          ? `/payment?report=${refDoc.id}&amount=${rewardAmount}`
          : `/report-submitted?id=${refDoc.id}`,
      );
    } catch (e: any) {
      setError(e?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="Report Lost Pet" back>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm mb-1">Pet’s name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Species</span>
          <select
            value={species}
            onChange={(e) => {
              setSpecies(e.target.value);
              setBreed("");
            }}
            className="w-full h-11 rounded-xl border px-3"
          >
            <option value="">Select species</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {species === "Other" && (
            <input
              placeholder="Enter species"
              className="w-full h-11 rounded-xl border px-3 mt-2"
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
            />
          )}
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Breed</span>
          <select
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
            disabled={!species}
          >
            <option value="">Select breed</option>
            {breedsFor(species || "").map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {breed === "Other" && (
            <input
              placeholder="Enter breed"
              className="w-full h-11 rounded-xl border px-3 mt-2"
              value={customBreed}
              onChange={(e) => setCustomBreed(e.target.value)}
            />
          )}
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Color</span>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Microchip ID</span>
          <input
            value={microchipId}
            onChange={(e) => setMicrochipId(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        <label className="block col-span-2">
          <span className="block text-sm mb-1">Markings</span>
          <input
            value={markings}
            onChange={(e) => setMarkings(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Date & Time Last Seen</span>
          <input
            type="datetime-local"
            value={lastSeen}
            onChange={(e) => setLastSeen(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Location Last Seen</span>
          <input
            list="us-locations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          />
          <datalist id="us-locations">
            {US_STATES.map((s) => (
              <option key={s} value={s} />
            ))}
            {US_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="w-full inline-flex items-center justify-center h-11 rounded-xl border cursor-pointer bg-muted">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f) {
                const r = new FileReader();
                r.onload = () => setPreview(String(r.result));
                r.readAsDataURL(f);
              } else {
                setPreview(null);
              }
            }}
          />
          {file ? "Change Photo" : "Add Photo"}
        </label>
        {preview && (
          <img
            src={preview}
            className="col-span-2 mt-2 h-40 w-full object-cover rounded-xl"
          />
        )}
        <label className="w-full inline-flex items-center justify-center h-11 rounded-xl border cursor-pointer bg-muted">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPawFile(e.target.files?.[0] || null)}
          />
          {pawFile ? "Paw print selected" : "Add Paw Print Photo"}
        </label>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-medium">Offer Reward?</span>
        <div className="flex gap-2">
          <button
            onClick={() => setOfferReward(true)}
            className={`px-4 py-2 rounded-full border ${offerReward ? "bg-[hsl(var(--brand-berry))] text-white" : ""}`}
          >
            YES
          </button>
          <button
            onClick={() => setOfferReward(false)}
            className={`px-4 py-2 rounded-full border ${!offerReward ? "bg-black text-white" : ""}`}
          >
            NO
          </button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 w-full h-12 rounded-full bg-[hsl(var(--brand-berry))] hover:opacity-90"
      >
        {loading ? "Submitting..." : "Submit Report"}
      </Button>
    </MobileLayout>
  );
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];
const US_CITIES = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
];
