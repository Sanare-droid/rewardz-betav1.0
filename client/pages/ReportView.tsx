import MobileLayout from "@/components/rewardz/MobileLayout";
import PetBadgeCard from "@/components/rewardz/PetBadgeCard";
import { Button } from "@/components/ui/button";
import ShareSheet from "@/components/rewardz/ShareSheet";
import AlertListItem from "@/components/rewardz/AlertListItem";
import { db, storage } from "@/lib/firebase";
import { geocode } from "@/lib/geo";
import { obfuscateCoordinates } from "@/lib/options";
import { matchScore } from "@/lib/matching";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [report, setReport] = useState<any | null>(null);
  const [saved, setSaved] = useState(false);
  const [share, setShare] = useState(false);
  const [sightings, setSightings] = useState<any[]>([]);
  const [showSighting, setShowSighting] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  const noteRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const whenRef = useRef<HTMLInputElement>(null);
  const whereRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "reports", id), (snap) =>
      setReport({ id: snap.id, ...(snap.data() as any) }),
    );
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const col = collection(db, "reports", id, "sightings");
    const unsub = onSnapshot(
      query(col, orderBy("createdAt", "desc"), limit(10)),
      (snap) =>
        setSightings(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
        ),
    );
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id || !user || !report) return;
    const sref = doc(db, "users", user.uid, "saved", id);
    const unsub = onSnapshot(sref, (snap) => setSaved(snap.exists()));
    return () => unsub();
  }, [id, user, report]);

  useEffect(() => {
    (async () => {
      if (!report) return;
      const opp = report.type === "lost" ? "found" : "lost";
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((r) => r.type === opp);
      const scored = items
        .map((r) => ({ r, s: matchScore(report, r) }))
        .filter((x) => x.s > 20)
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
        .map((x) => x.r);
      setMatches(scored);
    })();
  }, [report]);

  const status = report?.type === "found" ? "FOUND" : "LOST";
  const accent = report?.type === "found" ? "teal" : "berry";

  async function submitSighting() {
    if (!id) return;
    const note = noteRef.current?.value || "";
    const where = whereRef.current?.value || "";
    const when = whenRef.current?.value || "";
    let photoUrl: string | null = null;
    const f = photoRef.current?.files?.[0];
    if (f) {
      const path = `sightings/${id}/${Date.now()}_${f.name}`;
      const sref = ref(storage, path);
      await uploadBytes(sref, f);
      photoUrl = await getDownloadURL(sref);
    }
    const coords = where ? await geocode(where) : null;
    const pub = coords ? obfuscateCoordinates(coords.lat, coords.lon) : null;
    await addDoc(collection(db, "reports", id, "sightings"), {
      note,
      where,
      when,
      photoUrl,
      createdAt: serverTimestamp(),
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
      pubLat: pub?.lat ?? null,
      pubLon: pub?.lon ?? null,
    });

    // Notify the report owner
    try {
      const r = await getDoc(doc(db, "reports", id));
      const ownerId = (r.data() as any)?.userId as string | undefined;
      if (ownerId) {
        const u = await getDoc(doc(db, "users", ownerId));
        const email = (u.data() as any)?.email as string | undefined;
        await addDoc(collection(db, "users", ownerId, "notifications"), {
          type: "sighting",
          reportId: id,
          createdAt: serverTimestamp(),
          note: note || null,
          where: where || null,
        });
        if (email) {
          await fetch("/api/notify/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              subject: "New sighting reported",
              text: "Someone reported a sighting for your lost pet on Rewardz. Open the app to review.",
            }),
          });
        }
        // Ensure threads exist for both users
        if (user) {
          await setDoc(
            doc(db, "users", user.uid, "threads", id),
            { createdAt: serverTimestamp() },
            { merge: true },
          );
        }
        await setDoc(
          doc(db, "users", ownerId, "threads", id),
          { createdAt: serverTimestamp() },
          { merge: true },
        );
      }
      toast({
        title: "Sighting submitted",
        description: "The owner has been notified.",
      });
    } catch (e) {
      // non-fatal
    }

    setShowSighting(false);
    if (noteRef.current) noteRef.current.value = "";
    if (whereRef.current) whereRef.current.value = "";
    if (whenRef.current) whenRef.current.value = "";
    if (photoRef.current) photoRef.current.value = "";
    // Help the user reach the owner quickly after reporting
    navigate(`/owner/${id}`);
  }

  async function contactOwner() {
    if (!id) return;
    try {
      // create a starter message so a thread exists
      if (user) {
        await addDoc(collection(db, "reports", id, "messages"), {
          text: "Conversation started",
          system: true,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await setDoc(
          doc(db, "users", user.uid, "threads", id),
          { createdAt: serverTimestamp() },
          { merge: true },
        );
      }
      const r = await getDoc(doc(db, "reports", id));
      const ownerId = (r.data() as any)?.userId as string | undefined;
      if (ownerId) {
        await setDoc(
          doc(db, "users", ownerId, "threads", id),
          { createdAt: serverTimestamp() },
          { merge: true },
        );
      }
    } catch {}
    navigate(`/owner/${id}`);
  }

  return (
    <MobileLayout back>
      <PetBadgeCard
        status={`${status} ${report?.species || "PET"}`}
        amount={report?.rewardAmount}
        photoUrl={report?.photoUrl}
        accent={accent as any}
      />
      <div
        className="mt-4 rounded-xl p-4"
        style={{
          backgroundColor:
            accent === "teal" ? "hsl(var(--brand-mint))" : "hsl(var(--accent))",
        }}
      >
        <div className="rounded-xl bg-white/70 p-3 space-y-1">
          <p>
            <span className="font-semibold">Pet Name:</span>{" "}
            {report?.name || "Unknown"}
          </p>
          <p className="text-sm">Species: {report?.species || ""}</p>
          <p className="text-sm">Breed: {report?.breed || ""}</p>
          {report?.color && <p className="text-sm">Color: {report.color}</p>}
          {report?.markings && (
            <p className="text-sm">Markings: {report.markings}</p>
          )}
          {report?.location && (
            <p className="text-sm">Location: {report.location}</p>
          )}
          <p className="text-sm">Status: {report?.status || "open"}</p>
        </div>
        <div className="mt-3 flex gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-full flex-1"
            onClick={contactOwner}
          >
            Contact Owner
          </Button>
          <Button
            className="h-11 rounded-full flex-1"
            variant="secondary"
            onClick={() => setShowSighting(true)}
          >
            Report Sighting
          </Button>
        </div>
        {user?.uid === report?.userId && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-full"
              onClick={() => navigate(`/report/${id}/edit`)}
            >
              Edit Report
            </Button>
            <Button
              className="h-10 rounded-full"
              variant="secondary"
              onClick={() => navigate(`/poster/${id}`)}
            >
              Create Poster
            </Button>
          </div>
        )}
      </div>

      {matches.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-primary mb-2">
            Potential Matches
          </h3>
          {matches.map((m) => (
            <AlertListItem
              key={m.id}
              id={m.id}
              title={`${m.type === "lost" ? "Lost" : "Found"} ${m.species || "Pet"}`}
              subtitle={m.location || "Unknown"}
              badge={m.rewardAmount ? `$${m.rewardAmount}` : undefined}
              accent={m.type === "lost" ? "berry" : "teal"}
              image={m.photoUrl}
            />
          ))}
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">Sightings</h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSighting(true)}
          >
            Report Sighting
          </Button>
        </div>
        <div className="space-y-2">
          {sightings.map((s) => (
            <div key={s.id} className="rounded-xl border p-3 bg-white/70">
              <div className="text-sm">
                {s.when || ""} • {s.where || ""}
              </div>
              {s.note && <div className="text-sm mt-1">{s.note}</div>}
              {s.photoUrl && (
                <div className="mt-2 h-32 w-full rounded-lg overflow-hidden bg-muted">
                  <img
                    src={s.photoUrl}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Approximate location shown for privacy
              </div>
              {user?.uid === report?.userId && report?.type === "lost" && (
                <div className="mt-2 flex gap-2">
                  <Button
                    className="h-9 rounded-full"
                    onClick={() => navigate(`/report/${id}/confirm-reunion`)}
                  >
                    This is my pet
                  </Button>
                </div>
              )}
            </div>
          ))}
          {sightings.length === 0 && (
            <div className="rounded-xl border p-4 text-center bg-white/70">
              <div className="text-sm text-gray-600">No sightings yet.</div>
              <Button
                className="mt-3 h-10 rounded-full"
                variant="secondary"
                onClick={() => setShowSighting(true)}
              >
                Report a Sighting
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {user && (
          <Button
            variant="secondary"
            className="h-11 rounded-full"
            onClick={async () => {
              if (!id || !user) return;
              const refx = doc(db, "users", user.uid, "saved", id);
              const unsub = onSnapshot(refx, () => {});
              try {
                await setDoc(refx, { createdAt: Date.now() });
              } finally {
                unsub();
              }
            }}
          >
            {saved ? "Unsave" : "Save"}
          </Button>
        )}
        {report?.type === "lost" && report?.userId === user?.uid && (
          <Button
            className="h-11 rounded-full flex-1"
            onClick={() => navigate(`/report/${id}/confirm-reunion`)}
          >
            Confirm Reunion
          </Button>
        )}
      </div>

      {showSighting && (
        <div className="fixed inset-0 bg-black/50 flex items-end">
          <div className="w-full max-w-[430px] mx-auto bg-white rounded-t-2xl p-4">
            <div className="h-1 w-10 bg-gray-300 rounded-full mx-auto mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm mb-1">When</span>
                <input
                  ref={whenRef}
                  type="datetime-local"
                  className="w-full h-11 rounded-xl border px-3"
                />
              </label>
              <label className="block">
                <span className="block text-sm mb-1">Where</span>
                <input
                  ref={whereRef}
                  className="w-full h-11 rounded-xl border px-3"
                  placeholder="Address or area"
                />
              </label>
              <label className="block col-span-2">
                <span className="block text-sm mb-1">Note</span>
                <input
                  ref={noteRef}
                  className="w-full h-11 rounded-xl border px-3"
                  placeholder="Description"
                />
              </label>
              <label className="block col-span-2">
                <span className="block text-sm mb-1">Photo</span>
                <input ref={photoRef} type="file" accept="image/*" />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSighting(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitSighting}>
                Submit Sighting
              </Button>
            </div>
          </div>
        </div>
      )}

      <ShareSheet open={share} onClose={() => setShare(false)} />
    </MobileLayout>
  );
}
