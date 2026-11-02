import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapPin, ShoppingBag } from "lucide-react";
import { getOutlet } from "@/data/outlets";
import { hydrateStore, useStore } from "@/lib/store";

export function AppHeader() {
  const store = useStore();

  useEffect(() => {
    hydrateStore();
  }, []);

  const outlet = getOutlet(store.outletId);
  const count = store.cart.reduce((n, line) => n + line.qty, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="group flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Tales of Hyderabad
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Dum biryani · Hyderabad
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
          >
            <MapPin className="size-4 text-primary" aria-hidden />
            <span className="max-w-32 truncate sm:max-w-none">
              {outlet ? outlet.name : "Choose outlet"}
            </span>
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
