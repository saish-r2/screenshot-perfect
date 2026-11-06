import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, PartyPopper, Phone } from "lucide-react";
import { getOutlet } from "@/data/outlets";
import { formatINR, lineDescription } from "@/lib/format";
import { getOrder, hydrateStore, useStore } from "@/lib/store";
import { OrderTracker } from "@/components/OrderTracker";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order confirmed — Tales of Hyderabad" },
      {
        name: "description",
        content: "Your Tales of Hyderabad demo order is confirmed. Track it from placed to ready.",
      },
      { property: "og:title", content: "Order confirmed — Tales of Hyderabad" },
      {
        property: "og:description",
        content: "Your biryani order is confirmed. Track it from placed to ready.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Order confirmed — Tales of Hyderabad" },
      { name: "twitter:description", content: "Your biryani order is confirmed. Track it live." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const store = useStore();

  useEffect(() => {
    hydrateStore();
  }, []);

  if (!store.hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
        Loading your order…
      </div>
    );
  }

  const order = getOrder(id);
  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">We couldn't find that order</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Demo orders live only in this browser. If you cleared your data, the order is gone —
          but the biryani isn't.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Start a new order
        </Link>
      </div>
    );
  }

  const outlet = getOutlet(order.outletId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="rounded-3xl border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-veg text-veg-foreground">
          <BadgeCheck className="size-7" aria-hidden />
        </div>
        <h1 className="mt-4 flex flex-wrap items-center justify-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
          Order confirmed
          <PartyPopper className="size-5 text-accent-foreground" aria-hidden />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order <span className="font-bold text-foreground">{order.id}</span> · from {order.outletName}
        </p>
        <p className="mx-auto mt-3 max-w-sm rounded-full bg-secondary/70 px-4 py-2 text-xs font-semibold text-secondary-foreground">
          Demo order — test payment, nothing was charged
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Order progress</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Live status — updates as the kitchen moves your order along (try the Kitchen demo mode)
          </p>
          <OrderTracker order={order} />
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Delivery</h2>
            <div className="mt-3 space-y-3 text-sm">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block font-semibold">{outlet?.name ?? order.outletName}</span>
                  <span className="block text-muted-foreground">{outlet?.address}</span>
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block font-semibold">{order.customer.name}</span>
                  <span className="block text-muted-foreground">
                    {order.customer.phone} · {order.customer.address}
                    {order.customer.landmark ? ` (${order.customer.landmark})` : ""}
                  </span>
                </span>
              </p>
              {order.customer.notes && (
                <p className="rounded-xl bg-secondary/60 p-3 text-xs leading-relaxed text-secondary-foreground">
                  “{order.customer.notes}”
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Paid with {order.paymentMethod === "upi" ? "UPI" : "card"} · test mode
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Your items</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {line.qty} × {line.name}
                    <span className="block truncate text-xs">{lineDescription(line)}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatINR(line.unitPrice * line.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-dashed border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Items (incl. 5% GST)</dt>
                <dd className="font-semibold tabular-nums">{formatINR(order.totals.itemsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery fee</dt>
                <dd className="font-semibold tabular-nums">{formatINR(order.totals.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-bold">Paid (test)</dt>
                <dd className="font-bold tabular-nums">{formatINR(order.totals.total)}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Order something else
        </Link>
      </div>
    </div>
  );
}
