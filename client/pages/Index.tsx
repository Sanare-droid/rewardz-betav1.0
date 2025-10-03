import MobileLayout from "@/components/rewardz/MobileLayout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { AspectRatio } from "@/components/ui/aspect-ratio";

import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export default function Index() {
  const { user } = useUser();
  const name = user?.name || "there";
  const navigate = useNavigate();
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(2),
    );
    const unsub = onSnapshot(q, (snap) =>
      setRecent(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const skipped = localStorage.getItem("skipPetOnboarding") === "1";
    if (skipped) return;
    const col = collection(db, "users", user.uid, "pets");
    const unsubPets = onSnapshot(col, (snap) => {
      if (snap.size === 0) {
        navigate("/pet-onboarding", { replace: true });
      }
      unsubPets();
    });
  }, [user, navigate]);

  const cards = useMemo(() => {
    if (recent.length === 0) {
      return [
        {
          id: undefined,
          status: "LOST" as const,
          title: "Lost Cat",
          location: "Kilimani",
          amount: "$500",
          color: "berry" as const,
          image:
            "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop",
        },
        {
          id: undefined,
          status: "FOUND" as const,
          title: "Found Dog",
          location: "Lavington",
          amount: "$200",
          color: "mint" as const,
          image:
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop",
        },
      ];
    }
    return recent.map((r) => ({
      id: r.id as string,
      status: (r.type === "lost" ? "LOST" : "FOUND") as const,
      title: `${r.type === "lost" ? "Lost" : "Found"} ${r.species || "Pet"}`,
      location: r.location || "",
      amount: r.rewardAmount ? `$${r.rewardAmount}` : "",
      color: r.type === "lost" ? ("berry" as const) : ("mint" as const),
      image:
        r.photoUrl ||
        "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop",
    }));
  }, [recent]);

  return (
    <MobileLayout>
      <section className="mt-2">
        <h2 className="text-2xl font-semibold">
          Welcome back, <span className="text-primary">{name}</span>!
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bringing Lost Pets Home
        </p>

        <div className="mt-4 space-y-3">
          <Button
            asChild
            className="w-full h-12 rounded-full text-base bg-brand-berry text-white hover:bg-brand-berry/90"
          >
            <Link to="/report-lost">Report Pet</Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-2"
            >
              <Link to="/report-lost">Report Lost Pet</Link>
            </Button>
            <Button asChild variant="secondary" className="h-10 rounded-full">
              <Link to="/report-found">Found a Pet?</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative rounded-[2rem] overflow-hidden bg-muted">
            {/* Preserve aspect ratio to avoid distortion */}
            <div className="w-full">
              <div className="relative" style={{ paddingTop: "56.25%" }}>
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F0f7bde685416479ab2cfdd2fa6980d09%2F6d2e3cc66b8e4929b3a236354b8ea6e1?format=webp&width=1200"
                  alt="Rewardz community hero"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="absolute inset-0 rounded-[2rem] ring-1 ring-black/5 pointer-events-none" />
          </div>
          <p className="mt-3 text-gray-700 leading-relaxed">
            Rewardz is your community for lost pet recovery. Together, we can
            make a difference.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Alerts</h3>
          <Link to="/alerts" className="text-sm text-primary underline">
            See all
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <AlertCard
              key={i}
              id={(c as any).id}
              status={(c as any).status}
              title={c.title}
              location={c.location}
              amount={c.amount}
              color={c.color}
              image={c.image}
            />
          ))}
        </div>
      </section>
    </MobileLayout>
  );
}

function AlertCard({
  id,
  status,
  title,
  location,
  amount,
  color,
  image,
}: {
  id?: string;
  status: "LOST" | "FOUND";
  title: string;
  location: string;
  amount: string;
  color: "berry" | "mint";
  image: string;
}) {
  const CardWrapper: any = id ? Link : "div";
  const wrapperProps: any = id ? { to: `/report/${id}` } : {};
  return (
    <CardWrapper
      {...wrapperProps}
      className="rounded-2xl border overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="p-3">
        <div className="rounded-xl border p-2">
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                color: "white",
                backgroundColor:
                  status === "LOST"
                    ? "hsl(var(--brand-berry))"
                    : "hsl(var(--brand-teal))",
              }}
            >
              {status}
            </span>
            {amount && (
              <span className="text-[11px] font-semibold text-primary">
                Reward {amount}
              </span>
            )}
          </div>
          <div className="mt-2 rounded-lg overflow-hidden bg-muted">
            <AspectRatio ratio={4 / 3}>
              <img
                src={image}
                alt="Pet"
                className="h-full w-full object-cover"
              />
            </AspectRatio>
          </div>
        </div>
        <div
          className="mt-3 rounded-xl p-3"
          style={{
            backgroundColor:
              color === "mint"
                ? "hsl(var(--brand-mint))"
                : "hsl(var(--accent))",
          }}
        >
          <p className="text-xs">
            <span className="font-semibold">Have you seen</span>{" "}
            <span className="font-extrabold">{title.split(" ").pop()}</span>?
          </p>
          <p className="text-[11px] text-primary mt-1">
            Last seen near {location}.
          </p>
        </div>
      </div>
    </CardWrapper>
  );
}
