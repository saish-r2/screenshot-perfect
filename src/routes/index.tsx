import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, ReceiptText, Timer } from "lucide-react";
import heroImg from "@/assets/hero-spread.jpg";
import { listOutlets } from "@/data/outlets";
import { hydrateStore, selectOutlet, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tales of Hyderabad — Choose your outlet" },
      {
        name: "description",
        content:
          "Pick the Tales of Hyderabad outlet you want your biryani from — Kondapur, Gachibowli or Kukatpally — then browse the menu and order.",
      },
      { property: "og:title", content: "Tales of Hyderabad — Choose your outlet" },
      {
        property: "og:description",
        content:
          "Pick the Tales of Hyderabad outlet you want your biryani from, then browse the menu and order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tales of Hyderabad — Choose your outlet" },
      {
        name: "twitter:description",
        content:
          "Pick the Tales of Hyderabad outlet you want your biryani from, then browse the menu and order.",
      },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    hydrateStore();
  }, []);

  const chooseOutlet = (outletId: string) => {
    setPending(outletId);
    selectOutlet(outletId);
    void navigate({ to: "/menu" });
  };

  const lastOrder = store.orders[0];

  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="A spread of Hyderabadi biryani with salan and raita"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/10" />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
            Hyderabad · Dum-cooked since 1998
          </p>
          <h1 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight text-background sm:text-5xl">
            Biryani, straight from the handi.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-background/85 sm:text-base">
            Choose the kitchen you want your order from. Every biryani is sealed and cooked
            slow, then delivered hot.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Choose your outlet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Menu availability and delivery times vary by kitchen.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listOutlets().map((outlet) => {
            const active = store.outletId === outlet.id;
            return (
              <button
                key={outlet.id}
                type="button"
                onClick={() => chooseOutlet(outlet.id)}
                disabled={pending !== null}
                className={cn(
                  "group flex flex-col rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md disabled:opacity-60",
                  active ? "border-accent ring-1 ring-accent" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 font-display text-lg font-semibold">
                    <MapPin className="size-4 text-primary" aria-hidden />
                    {outlet.name}
                  </h3>
                  {active && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{outlet.address}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden />
                  {outlet.hours}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <Timer className="size-4" aria-hidden />
                  Avg. delivery {outlet.etaMins} min
                </p>
                <div className="mt-4 rounded-xl bg-secondary/70 p-3 text-xs leading-relaxed text-secondary-foreground">
                  <span className="font-bold">FSSAI Lic. {outlet.fssai.licence}</span>
                  <span className="block">Valid till {outlet.fssai.validTill}</span>
                  <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                    Demo data
                  </span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:underline">
                  {active ? "Order from here" : "Order from this outlet"}
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <ReceiptText className="size-3.5" aria-hidden />
          All menu prices are inclusive of 5% GST.
        </p>

        {store.hydrated && lastOrder && (
          <Link
            to="/orders/$id"
            params={{ id: lastOrder.id }}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent"
          >
            Track your latest order · {lastOrder.id}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </section>
    </div>
  );
}
