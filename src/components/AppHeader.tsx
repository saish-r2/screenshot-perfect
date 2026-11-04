import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapPin, ShoppingBag } from "lucide-react";
import { getOutlet } from "@/data/outlets";
import { hydrateStore, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const MODE_LINKS = [
  { to: "/", label: "Customer" },
  { to: "/kitchen", label: "Kitchen" },
  { to: "/admin", label: "Admin" },
] as const;

function activeMode(pathname: string): "/kitchen" | "/admin" | "/" {
  if (pathname.startsWith("/kitchen")) return "/kitchen";
  if (pathname.startsWith("/admin")) return "/admin";
  return "/";
}

export function AppHeader() {
  const store = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    hydrateStore();
  }, []);

  const outlet = getOutlet(store.outletId);
  const count = store.cart.reduce((n, line) => n + line.qty, 0);
  const active = activeMode(pathname);

  return (
    <div className="sticky top-0 z-40">
      {/* Demo role switcher — a frontend demo selector, not a login system. */}
      <div className="border-b border-border/70 bg-secondary/70">
        <div className="mx-auto flex h-8 max-w-5xl items-center gap-2 px-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Demo mode
          </span>
          <nav aria-label="Demo role switcher" className="flex items-center gap-1">
            {MODE_LINKS.map((mode) => (
              <Link
                key={mode.to}
                to={mode.to}
                aria-current={active === mode.to ? "page" : undefined}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors",
                  active === mode.to
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto hidden text-[10px] text-muted-foreground sm:block">
            No logins — sample data only
          </span>
        </div>
      </div>
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
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
    </div>
  );
}
