import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPin, Repeat, Timer } from "lucide-react";
import type { MenuItem } from "@/data/types";
import { getMenu, isItemAvailable, MENU_CATEGORIES } from "@/data/menu";
import { getOutlet } from "@/data/outlets";
import { addToCart, hydrateStore, useStore } from "@/lib/store";
import { defaultPortionId, defaultSpiceId, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FoodImage } from "@/components/FoodImage";
import { VegMark } from "@/components/VegMark";
import { ItemSheet } from "@/components/ItemSheet";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Tales of Hyderabad" },
      {
        name: "description",
        content:
          "Browse the Tales of Hyderabad menu: chicken, mutton and veg dum biryani, family packs, mirchi ka salan, raita and double ka meetha. Prices include 5% GST.",
      },
      { property: "og:title", content: "Menu — Tales of Hyderabad" },
      {
        property: "og:description",
        content:
          "Dum biryanis, mirchi ka salan, raita and double ka meetha. Choose your portion, spice level and add-ons.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Menu — Tales of Hyderabad" },
      {
        name: "twitter:description",
        content: "Dum biryanis, sides and desserts — customize portion, spice and add-ons.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const navigate = useNavigate();
  const store = useStore();
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    hydrateStore();
  }, []);

  useEffect(() => {
    if (store.hydrated && !store.outletId) {
      void navigate({ to: "/" });
    }
  }, [store.hydrated, store.outletId, navigate]);

  const outlet = getOutlet(store.outletId);

  if (!store.hydrated || !outlet) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
        Loading the menu…
      </div>
    );
  }

  const items = getMenu();

  const quickAdd = (item: MenuItem) => {
    addToCart({
      item,
      portionId: defaultPortionId(item),
      spiceId: defaultSpiceId(item),
      addOnIds: [],
      qty: 1,
    });
  };

  return (
    <div className="pb-16">
      {/* Outlet strip */}
      <section className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Ordering from
            </p>
            <h1 className="mt-0.5 flex items-center gap-1.5 font-display text-xl font-semibold">
              <MapPin className="size-4 text-primary" aria-hidden />
              {outlet.name}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {outlet.address} · Avg. delivery {outlet.etaMins} min
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-semibold transition-colors hover:border-accent"
          >
            <Repeat className="size-4" aria-hidden />
            Change outlet
          </Link>
        </div>
      </section>

      {/* Category chips */}
      <nav
        aria-label="Menu categories"
        className="sticky top-16 z-30 border-b border-border/70 bg-background/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {MENU_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                document
                  .getElementById(`cat-${cat.toLowerCase()}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold transition-colors hover:border-accent"
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4">
        {MENU_CATEGORIES.map((cat) => (
          <section key={cat} id={`cat-${cat.toLowerCase()}`} className="scroll-mt-32 pt-8">
            <h2 className="font-display text-2xl font-semibold">{cat}</h2>
            <div className="mt-4 space-y-4">
              {items
                .filter((item) => item.category === cat)
                .map((item) => {
                  const available = isItemAvailable(item, outlet.id);
                  return (
                    <article
                      key={item.id}
                      className={cn(
                        "flex gap-4 rounded-2xl border bg-card p-3 sm:p-4",
                        available ? "border-border" : "border-border/60 opacity-90",
                      )}
                    >
                      <div className="relative shrink-0">
                        <FoodImage
                          src={item.image}
                          alt={item.name}
                          className={cn(
                            "size-24 rounded-xl sm:size-28",
                            !available && "grayscale",
                          )}
                        />
                        {!available && (
                          <span className="absolute inset-x-1 bottom-1 rounded-md bg-foreground/85 px-1.5 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-background">
                            Sold out here
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <VegMark diet={item.diet} />
                          <h3 className="truncate font-display text-base font-semibold sm:text-lg">
                            {item.name}
                          </h3>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                          <div>
                            <p>
                              <span className="font-display text-lg font-bold">{formatINR(item.basePrice)}</span>
                              <span className="ml-1 text-[11px] text-muted-foreground">incl. 5% GST</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Allergens: {item.allergens.join(", ")}
                            </p>
                          </div>
                          {available ? (
                            <div className="flex items-center gap-2">
                              {item.portions.length > 0 || item.addOns.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSheetItem(item)}
                                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-accent"
                                >
                                  Customise
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => quickAdd(item)}
                                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                              >
                                Add
                              </button>
                            </div>
                          ) : (
                            <span className="rounded-full bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                              Not available at this outlet
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      <ItemSheet item={sheetItem} onClose={() => setSheetItem(null)} />
    </div>
  );
}
