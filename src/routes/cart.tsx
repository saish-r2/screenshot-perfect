import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag, TriangleAlert } from "lucide-react";
import { getItem } from "@/data/menu";
import { getOutlet } from "@/data/outlets";
import { cartTotals, formatINR, lineDescription } from "@/lib/format";
import { hydrateStore, removeLine, setLineQty, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FoodImage } from "@/components/FoodImage";
import { VegMark } from "@/components/VegMark";
import { QtyStepper } from "@/components/QtyStepper";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Tales of Hyderabad" },
      {
        name: "description",
        content: "Review your Tales of Hyderabad order, update quantities and check out.",
      },
      { property: "og:title", content: "Your cart — Tales of Hyderabad" },
      {
        property: "og:description",
        content: "Review your biryani order, update quantities and check out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Your cart — Tales of Hyderabad" },
      { name: "twitter:description", content: "Review your biryani order and check out." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    hydrateStore();
  }, []);

  if (!store.hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
        Loading your cart…
      </div>
    );
  }

  if (store.cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <ShoppingBag className="size-7" aria-hidden />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The handi is waiting. Pick an outlet and add some biryani to get started.
        </p>
        <Link
          to="/menu"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse the menu
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const outlet = getOutlet(store.outletId);
  if (!outlet) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Choose an outlet first</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your cart items are tied to a kitchen. Pick one to continue.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Choose outlet
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const unavailableLines = store.cart.filter((line) => {
    const item = getItem(line.itemId);
    return !item || !item.availableAt.includes(outlet.id);
  });
  const totals = cartTotals(store.cart);
  const canCheckout = unavailableLines.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">Delivery from {outlet.name}</p>

      {unavailableLines.length > 0 && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <p className="leading-relaxed">
            Some items aren't available at {outlet.name}. Remove them to continue to checkout.
          </p>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {store.cart.map((line) => {
          const item = getItem(line.itemId);
          const unavailable = !item || !item.availableAt.includes(outlet.id);
          return (
            <li
              key={line.id}
              className={cn(
                "flex gap-4 rounded-2xl border bg-card p-3 sm:p-4",
                unavailable ? "border-destructive/40" : "border-border",
              )}
            >
              <FoodImage src={line.image} alt={line.name} className="size-16 shrink-0 rounded-xl sm:size-20" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <VegMark diet={line.diet} />
                      <h3 className="truncate font-semibold">{line.name}</h3>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {lineDescription(line) || "Standard"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums">
                    {formatINR(line.unitPrice * line.qty)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <QtyStepper qty={line.qty} onChange={(qty) => setLineQty(line.id, qty)} />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatINR(line.unitPrice)} each
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="text-xs font-semibold text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {unavailable && (
                  <p className="mt-2 text-xs font-semibold text-destructive">
                    Not available at {outlet.name} — please remove this item.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Items total (incl. 5% GST)</dt>
            <dd className="font-semibold tabular-nums">{formatINR(totals.itemsTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery fee</dt>
            <dd className="font-semibold tabular-nums">{formatINR(totals.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-border pt-2 text-base">
            <dt className="font-bold">To pay</dt>
            <dd className="font-bold tabular-nums">{formatINR(totals.total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Includes 5% GST of {formatINR(totals.gstIncluded)}. Delivery to most Hyderabad pin codes.
        </p>
        <button
          type="button"
          disabled={!canCheckout}
          onClick={() => void navigate({ to: "/checkout" })}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Proceed to checkout
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
