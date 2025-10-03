import * as React from "react";
import { cn } from "@/lib/utils";

const DrawerContext = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

export const Drawer = ({
  open,
  onOpenChange,
  children,
  shouldScaleBackground = true,
  ...props
}: any) => {
  const [internalOpen, setInternalOpen] = React.useState(!!open);
  React.useEffect(() => {
    if (typeof open === "boolean") setInternalOpen(open);
  }, [open]);
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    try {
      onOpenChange?.(v);
    } catch {}
  };
  return (
    <DrawerContext.Provider value={{ open: internalOpen, setOpen }}>
      <div {...props}>{children}</div>
    </DrawerContext.Provider>
  );
};
Drawer.displayName = "Drawer";

export const DrawerTrigger = ({ children }: { children: React.ReactNode }) => {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) return <>{children}</>;
  return React.cloneElement(children as any, {
    onClick: (e: any) => {
      ctx.setOpen(true);
      if ((children as any).props.onClick) (children as any).props.onClick(e);
    },
  });
};

export const DrawerPortal = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const DrawerClose = ({ children, asChild, onClick }: any) => {
  const ctx = React.useContext(DrawerContext);
  const handle = (e: any) => {
    try {
      ctx?.setOpen(false);
    } catch {}
    if (onClick) onClick(e);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, { onClick: handle });
  }
  return (
    <button onClick={handle} className="p-2">
      {children}
    </button>
  );
};

export const DrawerOverlay = React.forwardRef<any, any>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("fixed inset-0 z-50 bg-black/80", className)}
      {...props}
    />
  ),
);
DrawerOverlay.displayName = "DrawerOverlay";

export const DrawerContent = React.forwardRef<any, any>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(DrawerContext);
    if (!ctx || !ctx.open) return null;
    return (
      <div className="fixed inset-0 z-50" aria-modal="true">
        <div className="fixed inset-0" onClick={() => ctx.setOpen(false)} />
        <div
          ref={ref}
          className={cn(
            "absolute left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[430px] rounded-t-[10px] border bg-background p-4",
            className,
          )}
          {...props}
        >
          <div className="mx-auto mt-2 h-1 w-[100px] rounded-full bg-muted" />
          {children}
        </div>
      </div>
    );
  },
);
DrawerContent.displayName = "DrawerContent";

export const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

export const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

export const DrawerTitle = React.forwardRef<any, any>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  ),
);
DrawerTitle.displayName = "DrawerTitle";

export const DrawerDescription = React.forwardRef<any, any>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  ),
);
DrawerDescription.displayName = "DrawerDescription";

export default Drawer;
