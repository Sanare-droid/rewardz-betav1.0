import { useEffect } from "react";

export default function GlobalErrors() {
  useEffect(() => {
    const onUnhandled = (e: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", (e && (e as any).reason) || e);
    };

    const onError = (ev: ErrorEvent) => {
      try {
        console.error("Global error:", ev.error || ev.message, ev);
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("unhandledrejection", onUnhandled);
    window.addEventListener("error", onError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandled);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
