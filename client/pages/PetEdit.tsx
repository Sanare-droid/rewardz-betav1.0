import { useEffect, useState } from "react";
import MobileLayout from "@/components/rewardz/MobileLayout";
import { useUser } from "@/context/UserContext";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SPECIES_OPTIONS, breedsFor } from "@/lib/options";

export default function PetEdit() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({
    name: "",
    species: "",
    breed: "",
    color: "",
    microchipId: "",
    dob: "",
    markings: "",
    sex: "",
    height: "",
    size: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      if (id && id !== "new" && user) {
        const snap = await getDoc(doc(db, "users", user.uid, "pets", id));
        if (snap.exists()) setData({ id: snap.id, ...(snap.data() as any) });
      }
    })();
  }, [id, user]);

  const save = async () => {
    if (!user) return;
    let photoUrl = data.photoUrl as string | undefined;
    if (file) {
      const path = `pets/${user.uid}/${Date.now()}_${file.name}`;
      const sref = ref(storage, path);
      await uploadBytes(sref, file);
      photoUrl = await getDownloadURL(sref);
    }
    const record = { ...data, photoUrl };
    if (!id || id === "new") {
      const docRef = await addDoc(
        collection(db, "users", user.uid, "pets"),
        record,
      );
      navigate(`/pets/${docRef.id}`);
    } else {
      await setDoc(doc(db, "users", user.uid, "pets", id), record, {
        merge: true,
      });
      navigate(`/pets/${id}`);
    }
  };

  return (
    <MobileLayout title={id === "new" ? "Add Pet" : "Edit Pet"} back>
      <div className="text-right text-xs text-gray-500">
        {id === "new" ? "Step 1/2" : "Step 1/2"}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <label className="block">
          <span className="block text-sm mb-1">Pet’s name</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.name || ""}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Species</span>
          <select
            className="w-full h-11 rounded-xl border px-3"
            value={data.species || ""}
            onChange={(e) =>
              setData({ ...data, species: e.target.value, breed: "" })
            }
          >
            <option value="">Select species</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Breed</span>
          <select
            className="w-full h-11 rounded-xl border px-3"
            value={data.breed || ""}
            onChange={(e) => setData({ ...data, breed: e.target.value })}
            disabled={!data.species}
          >
            <option value="">Select breed</option>
            {breedsFor(data.species || "").map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Color</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.color || ""}
            onChange={(e) => setData({ ...data, color: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Microchip ID</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.microchipId || ""}
            onChange={(e) => setData({ ...data, microchipId: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Date of Birth</span>
          <input
            type="date"
            className="w-full h-11 rounded-xl border px-3"
            value={data.dob || ""}
            onChange={(e) => setData({ ...data, dob: e.target.value })}
          />
        </label>
        <label className="block col-span-2">
          <span className="block text-sm mb-1">Markings</span>
          <textarea
            className="w-full min-h-[88px] rounded-xl border px-3 py-2"
            value={data.markings || ""}
            onChange={(e) => setData({ ...data, markings: e.target.value })}
          />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <span className="block text-sm mb-1">Sex</span>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-full border ${data.sex === "female" ? "bg-[hsl(var(--brand-mint))] text-primary" : ""}`}
              onClick={() => setData({ ...data, sex: "female" })}
            >
              Female
            </button>
            <button
              className={`px-4 py-2 rounded-full border ${data.sex === "male" ? "bg-[hsl(var(--brand-mint))] text-primary" : ""}`}
              onClick={() => setData({ ...data, sex: "male" })}
            >
              Male
            </button>
          </div>
        </div>
        <label className="block">
          <span className="block text-sm mb-1">Pet height</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            placeholder="e.g., 40cm"
            value={data.height || ""}
            onChange={(e) => setData({ ...data, height: e.target.value })}
          />
        </label>
      </div>
      <div className="mt-3">
        <span className="block text-sm mb-1">Pet size</span>
        <div className="flex gap-2">
          {(
            [
              { k: "small", label: "Small" },
              { k: "medium", label: "Medium" },
              { k: "large", label: "Large" },
            ] as const
          ).map((o) => (
            <button
              key={o.k}
              className={`px-4 py-2 rounded-full border ${data.size === o.k ? "bg-[hsl(var(--brand-mint))] text-primary" : ""}`}
              onClick={() => setData({ ...data, size: o.k })}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <label className="w-full inline-flex items-center justify-center h-11 rounded-xl border cursor-pointer bg-muted">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? "Photo selected" : "Upload Photo"}
        </label>
      </div>
      <Button onClick={save} className="mt-6 w-full h-12 rounded-full">
        Save
      </Button>
    </MobileLayout>
  );
}
