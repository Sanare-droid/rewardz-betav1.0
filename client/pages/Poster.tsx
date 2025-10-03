import MobileLayout from "@/components/rewardz/MobileLayout";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Poster() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any | null>(null);
  const refEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "reports", id));
      if (snap.exists()) setReport({ id: snap.id, ...(snap.data() as any) });
    })();
  }, [id]);

  const download = async () => {
    if (!refEl.current) return;
    const dataUrl = await toPng(refEl.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `poster-${report?.name || "pet"}.png`;
    a.click();
  };

  const lost = report?.type !== "found";

  return (
    <MobileLayout title="Downloadable Poster" back>
      <div className="mt-2 rounded-2xl border p-4">
        <div ref={refEl} className="rounded-xl border p-5 text-center bg-white">
          <div
            className="text-[28px] font-extrabold tracking-wide"
            style={{
              color: lost
                ? "hsl(var(--brand-berry))"
                : "hsl(var(--brand-teal))",
            }}
          >
            {lost ? "LOST" : "FOUND"} {report?.species || "PET"}
          </div>
          <img
            src={
              report?.photoUrl ||
              "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop"
            }
            className="mt-3 h-60 w-full object-cover rounded-lg"
          />
          {typeof report?.rewardAmount === "number" && (
            <div className="mt-3">
              <div className="text-4xl font-bold">${report.rewardAmount}</div>
              <div className="text-sm tracking-widest">REWARD</div>
            </div>
          )}
          <div className="mt-4 space-y-1.5 text-left text-[15px]">
            {report?.name && (
              <p>
                <strong>Pet Name:</strong> {report.name}
              </p>
            )}
            {report?.lastSeen && (
              <p>
                <strong>Last Seen:</strong> {report.lastSeen}
              </p>
            )}
            {report?.location && (
              <p>
                <strong>Location:</strong> {report.location}
              </p>
            )}
            <p>
              <strong>Contact:</strong> Use the app to contact the owner
            </p>
          </div>
        </div>
        <button
          onClick={download}
          className="mt-4 w-full h-11 rounded-full bg-[hsl(var(--brand-mint))] text-primary"
        >
          Download
        </button>
      </div>
    </MobileLayout>
  );
}
