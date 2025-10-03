import { Toaster as Sonner } from "sonner";
import { useEffect, useState } from "react";

// Use a lightweight, safe theme detector instead of next-themes which may not
// be initialized in this environment. This avoids runtime errors and keeps
// the Sonner toaster stable across the app.

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<ToasterProps["theme"]>("system");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const el = document.documentElement;
    const prefersDark = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;

    // Prefer an explicit 'dark' class on <html> if present, otherwise use OS preference
    const isDark = el.classList.contains("dark") || prefersDark;
    setTheme(isDark ? ("dark" as ToasterProps["theme"]) : ("light" as ToasterProps["theme"]));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? ("dark" as ToasterProps["theme"]) : ("light" as ToasterProps["theme"]));

    // Add listener with backwards compatibility
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler as any);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler as any);
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
