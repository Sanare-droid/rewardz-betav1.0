import { cn } from "@/lib/utils";
import {
  Bell,
  Home,
  MessageCircle,
  Search,
  Users,
  User,
  Filter,
  Mail,
  ChevronLeft,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

export default function MobileLayout({
  children,
  title,
  back,
}: PropsWithChildren<{ title?: string; back?: boolean }>) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifCount(0);
      setMsgCount(0);
      return;
    }
    const unsubs: Array<() => void> = [];

    // Notifications unread count
    try {
      const qn = query(
        collection(db, "users", user.uid, "notifications"),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const u1 = onSnapshot(qn, (snap) => {
        const n = snap.docs.filter((d) => !(d.data() as any).read).length;
        setNotifCount(n);
      });
      unsubs.push(u1);
    } catch {}

    // Messages unread count by scanning threads and last message
    const lastByReport = new Map<string, number>();
    try {
      const qt = query(collection(db, "users", user.uid, "threads"));
      const u2 = onSnapshot(qt, (snap) => {
        const listeners: Array<() => void> = [];
        snap.docs.forEach((td) => {
          const rid = td.id;
          const lastRead = ((td.data() as any)?.lastRead as number) || 0;
          const qm = query(
            collection(db, "reports", rid, "messages"),
            orderBy("createdAt", "desc"),
            limit(1),
          );
          const u = onSnapshot(qm, (ms) => {
            const docx = ms.docs[0];
            if (!docx) {
              lastByReport.set(rid, 0);
            } else {
              const m: any = docx.data();
              const ts = m.createdAt?.toMillis
                ? m.createdAt.toMillis()
                : m.createdAt?.seconds
                  ? m.createdAt.seconds * 1000
                  : 0;
              const isMine = m.userId === user.uid;
              lastByReport.set(rid, ts > lastRead && !isMine ? 1 : 0);
            }
            let total = 0;
            lastByReport.forEach((v) => (total += v));
            setMsgCount(total);
          });
          listeners.push(u);
        });
        unsubs.push(() => listeners.forEach((x) => x()));
      });
      unsubs.push(u2);
    } catch {}

    return () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  }, [user]);
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative">
        <header className="px-5 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {back ? (
              <button
                aria-label="Back"
                onClick={() => navigate(-1)}
                className="p-2 rounded-full border border-border"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="h-9 w-9 rounded-xl bg-brand-mint/60 flex items-center justify-center text-primary font-bold">
                R
              </div>
            )}
            {title ? (
              <h1 className="text-xl font-semibold text-primary">{title}</h1>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-primary">
            <button
              aria-label="Search"
              className="p-2 rounded-full hover:bg-[hsl(var(--brand-mint))] transition-colors"
              onClick={() => navigate("/search")}
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label="Filter"
              className="p-2 rounded-full hover:bg-[hsl(var(--brand-mint))] transition-colors"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-filter"))
              }
            >
              <Filter className="h-5 w-5" />
            </button>
            <button
              aria-label="Notifications"
              className="relative p-2 rounded-full hover:bg-[hsl(var(--brand-mint))] transition-colors"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="h-5 w-5" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(var(--brand-berry))] text-white text-[10px] leading-none font-semibold flex items-center justify-center">
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              )}
            </button>
            <button
              aria-label="Messages"
              className="relative p-2 rounded-full hover:bg-[hsl(var(--brand-mint))] transition-colors"
              onClick={() => navigate("/messages")}
            >
              <Mail className="h-5 w-5" />
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(var(--brand-berry))] text-white text-[10px] leading-none font-semibold flex items-center justify-center">
                  {msgCount > 99 ? "99+" : msgCount}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 px-5 pb-28">{children}</main>
        <nav
          aria-label="Bottom Navigation"
          className="fixed left-1/2 bottom-6 -translate-x-1/2 w-[92%] max-w-[430px]"
        >
          <div className="mx-auto rounded-full bg-brand-mint px-6 py-3 shadow-lg flex items-center justify-between text-primary">
            <NavItem to="/" icon={Home} label="Home" />
            {/* Removed badge on Alerts per request */}
            <NavItem to="/alerts" icon={Bell} label="Alerts" />
            <NavItem to="/search" icon={Search} label="Search" />
            <NavItem to="/community" icon={Users} label="Community" />
            <NavItem to="/profile" icon={User} label="Profile" />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
}: {
  to: string;
  icon: any;
  label: string;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group relative flex flex-col items-center gap-1 text-xs rounded-xl px-3 py-2 transition-colors hover:bg-[hsl(var(--brand-mint))] hover:text-primary",
          isActive ? "text-primary" : "text-primary/80",
        )
      }
      end
    >
      <div className="relative">
        <Icon className="h-5 w-5 transition-transform group-hover:scale-105" />
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(var(--brand-berry))] text-white text-[10px] leading-none font-semibold flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span>{label}</span>
    </NavLink>
  );
}
