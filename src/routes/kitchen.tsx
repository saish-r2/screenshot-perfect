import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlarmClock, ChefHat, ShoppingBag } from "lucide-react";
import type { Order, OrderStatus } from "@/data/types";
import { getOutlet, listOutlets } from "@/data/outlets";
import { formatINR, lineDescription } from "@/lib/format";
import {
  ORDER_STEPS,
  isOrderLate,
  nextStatus,
  statusActionLabel,
} from "@/lib/order";
import { hydrateStore, setKitchenOutlet, setOrderStatus, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen board — Tales of Hyderabad" },
      {
        name: "description",
        content:
          "Demo kitchen display for Tales of Hyderabad staff: accept orders, track preparation and flag late biryanis.",
      },
      { property: "og:title", content: "Kitchen board — Tales of Hyderabad" },
      {
        property: "og:description",
        content: "Demo kitchen display: accept orders and track preparation by outlet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Kitchen board — Tales of Hyderabad" },
      { name: "twitter:description", content: "Demo kitchen display: accept orders and track preparation." },
    ],
  }),
  component: KitchenPage,
});

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function elapsedLabel(placedAt: number, now: number): string {
  const mins = Math.max(0, Math.floor((now - placedAt) / 60000));
  return mins === 0 ? "just placed" : `${mins} min ago`;
}

function lateMinutes(order: Order, now: number): number {
  return Math.max(1, Math.round((now - order.expectedReadyAt) / 60000));
}

function KitchenPage() {
  const store = useStore();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    hydrateStore();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const outlet = getOutlet(store.kitchenOutletId);
  const boardOrders = store.orders
    .filter((o) => o.outletId === store.kitchenOutletId && o.status !== "delivered")
    .sort((a, b) => a.placedAt - b.placedAt);

  if (!outlet) {
    return (
      <div className="bg-foreground px-4 py-16 text-center text-background">
        <p>Loading the kitchen board…</p>
      </div>
    );
  }

  return (
    <div className="-my-px bg-foreground pb-10 text-background">
      <div className="mx-auto max-w-[100rem] px-4 pt-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-accent">
              <ChefHat className="size-4" aria-hidden />
              Kitchen display · demo
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              {outlet.name} kitchen
            </h1>
            <p className="mt-1 text-sm text-background/70">
              {outlet.hours} · orders must be walked forward one step at a time
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-background/25 px-4 py-2 text-sm font-bold text-background transition-colors hover:border-accent hover:text-accent"
          >
            <ShoppingBag className="size-4" aria-hidden />
            Customer view
          </Link>
        </div>

        {/* Outlet selector */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-background/60">
            Outlet
          </span>
          {listOutlets().map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={o.id === store.kitchenOutletId}
              onClick={() => setKitchenOutlet(o.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                o.id === store.kitchenOutletId
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-background/25 text-background hover:border-accent",
              )}
            >
              {o.name}
            </button>
          ))}
        </div>

        {boardOrders.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-background/25 px-6 py-16 text-center">
            <ChefHat className="mx-auto size-10 text-background/40" aria-hidden />
            <h2 className="mt-4 font-display text-xl font-semibold">
              No orders yet at {outlet.name}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-background/70">
              Place a test order from the customer menu for this outlet — it will appear here
              instantly.
            </p>
            <Link
              to="/menu"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Open the customer menu
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
            {ORDER_STEPS.map((step) => (
              <StatusColumn
                key={step.id}
                status={step.id}
                label={step.label}
                orders={boardOrders.filter((o) => o.status === step.id)}
                now={now}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusColumn({
  status,
  label,
  orders,
  now,
}: {
  status: OrderStatus;
  label: string;
  orders: Order[];
  now: number;
}) {
  return (
    <section
      aria-label={`${label} orders`}
      className="flex w-72 shrink-0 flex-col rounded-2xl border border-background/15 bg-background/5 xl:w-auto xl:flex-1"
    >
      <header className="flex items-center justify-between gap-2 border-b border-background/15 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em]">{label}</h2>
        <span className="min-w-6 rounded-full bg-accent px-2 py-0.5 text-center text-xs font-black text-accent-foreground">
          {orders.length}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-3 p-3">
        {orders.length === 0 && (
          <p className="rounded-xl border border-dashed border-background/20 px-3 py-8 text-center text-xs text-background/50">
            Nothing here
          </p>
        )}
        {orders.map((order) => (
          <KitchenCard key={order.id} order={order} now={now} />
        ))}
      </div>
    </section>
  );
}

function KitchenCard({ order, now }: { order: Order; now: number }) {
  const late = isOrderLate(order, now);
  const next = nextStatus(order.status);

  return (
    <article
      className={cn(
        "rounded-xl border bg-background/10 p-4",
        late ? "border-destructive bg-destructive/25" : "border-background/15",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold tracking-tight">{order.id}</p>
          <p className="text-xs text-background/70">
            Placed {formatTime(order.placedAt)} · {elapsedLabel(order.placedAt, now)}
          </p>
        </div>
        {late && (
          <span className="shrink-0 rounded-md bg-destructive px-2 py-1 text-[11px] font-black uppercase tracking-wide text-destructive-foreground">
            Late {lateMinutes(order, now)}m
          </span>
        )}
      </header>

      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-background/70">
        <AlarmClock className="size-3.5" aria-hidden />
        Expected ready by {formatTime(order.expectedReadyAt)}
      </p>

      <ul className="mt-3 space-y-2">
        {order.lines.map((line) => (
          <li key={line.id}>
            <p className="text-sm font-bold">
              {line.qty} × {line.name}
              <span className="ml-1.5 text-xs font-semibold text-background/70">
                {formatINR(line.unitPrice * line.qty)}
              </span>
            </p>
            <p className="text-xs leading-relaxed text-background/70">
              {lineDescription(line) || "Standard"}
            </p>
          </li>
        ))}
      </ul>

      {order.customer.notes && (
        <p className="mt-2 rounded-lg bg-accent/25 px-2.5 py-1.5 text-xs leading-relaxed text-background">
          Note: {order.customer.notes}
        </p>
      )}

      {next ? (
        <button
          type="button"
          onClick={() => setOrderStatus(order.id, next)}
          className="mt-3 w-full rounded-full bg-accent px-3 py-2.5 text-sm font-black text-accent-foreground transition-colors hover:bg-accent/90"
        >
          {statusActionLabel(next)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOrderStatus(order.id, "delivered")}
          className="mt-3 w-full rounded-full border border-background/30 px-3 py-2 text-xs font-bold text-background/80 transition-colors hover:border-accent hover:text-accent"
        >
          Mark delivered & clear
        </button>
      )}
    </article>
  );
}
