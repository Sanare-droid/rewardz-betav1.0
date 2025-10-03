import { useEffect, useState } from "react";
import MobileLayout from "@/components/rewardz/MobileLayout";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";

export default function EditReport() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, "reports", id));
      if (!snap.exists()) return;
      setData({ id: snap.id, ...(snap.data() as any) });
    })();
  }, [id]);

  if (!data)
    return (
      <MobileLayout title="Edit Details" back>
        <div className="mt-6">Loading...</div>
      </MobileLayout>
    );

  const isOwner = user?.uid && data?.userId === user.uid;

  const save = async () => {
    if (!id) return;
    if (!isOwner) {
      setError("Only the report owner can edit this report.");
      return;
    }
    try {
      setSaving(true);
      let photoUrl = data.photoUrl as string | undefined;
      if (file) {
        const path = `reports/${user?.uid || "anon"}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        photoUrl = await getDownloadURL(fileRef);
      }
      const patch: any = {
        name: data.name || "",
        species: data.species || "",
        breed: data.breed || "",
        color: data.color || "",
        markings: data.markings || "",
        location: data.location || "",
        rewardAmount:
          typeof data.rewardAmount === "number" ? data.rewardAmount : undefined,
        photoUrl,
      };
      await updateDoc(doc(db, "reports", id), patch);
      navigate(`/report/${id}`);
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout title="Edit Details" back>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <label className="block">
          <span className="block text-sm mb-1">Pet Name</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.name || ""}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Species</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.species || ""}
            onChange={(e) => setData({ ...data, species: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Breed</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.breed || ""}
            onChange={(e) => setData({ ...data, breed: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Color</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.color || ""}
            onChange={(e) => setData({ ...data, color: e.target.value })}
          />
        </label>
        <label className="block col-span-2">
          <span className="block text-sm mb-1">Markings</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.markings || ""}
            onChange={(e) => setData({ ...data, markings: e.target.value })}
          />
        </label>
        <label className="block col-span-2">
          <span className="block text-sm mb-1">Location</span>
          <input
            className="w-full h-11 rounded-xl border px-3"
            value={data.location || ""}
            onChange={(e) => setData({ ...data, location: e.target.value })}
          />
        </label>
      </div>
      <div className="mt-3">
        <label className="w-full inline-flex items-center justify-center h-11 rounded-xl border cursor-pointer bg-muted">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? "Photo selected" : "Change Photo"}
        </label>
      </div>
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      <Button
        onClick={save}
        disabled={saving}
        className="mt-6 w-full h-12 rounded-full"
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </MobileLayout>
  );
}
