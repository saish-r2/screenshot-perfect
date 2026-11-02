import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, CreditCard, Landmark, LoaderCircle, ShieldCheck } from "lucide-react";
import type { PaymentMethod } from "@/data/types";
import { getItem } from "@/data/menu";
import { getOutlet } from "@/data/outlets";
import { cartTotals, formatINR, lineDescription } from "@/lib/format";
import { hydrateStore, placeOrder, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Tales of Hyderabad" },
      {
        name: "description",
        content: "Enter delivery details and pay with test-mode UPI or card. No real payment is processed.",
      },
      { property: "og:title", content: "Checkout — Tales of Hyderabad" },
      {
        property: "og:description",
        content: "Enter delivery details and pay with test-mode UPI or card.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Checkout — Tales of Hyderabad" },
      { name: "twitter:description", content: "Enter delivery details and pay with test-mode UPI or card." },
    ],
  }),
  component: CheckoutPage,
});

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-destructive">{message}</p>;
}

function CheckoutPage() {
  const store = useStore();
  const navigate = useNavigate();
  const placedRef = useRef(false);

  const [form, setForm] = useState({ name: "", phone: "", address: "", landmark: "", notes: "" });
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    hydrateStore();
  }, []);

  useEffect(() => {
    if (store.hydrated && store.cart.length === 0 && !placedRef.current) {
      void navigate({ to: "/cart" });
    }
  }, [store.hydrated, store.cart.length, navigate]);

  const outlet = getOutlet(store.outletId);
  if (!store.hydrated || !outlet) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">Loading…</div>
    );
  }

  const totals = cartTotals(store.cart);
  const unavailableCount = store.cart.filter((line) => {
    const item = getItem(line.itemId);
    return !item || !item.availableAt.includes(outlet.id);
  }).length;

  const setField = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name.";
    const phone = form.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone = "Enter a 10-digit Indian mobile number.";
    if (form.address.trim().length < 8) e.address = "Enter your flat or house number, street and area.";
    if (method === "upi" && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
      e.upiId = "Enter a valid UPI ID, e.g. asha@okhdfcbank.";
    }
    if (method === "card") {
      const num = card.number.replace(/\D/g, "");
      if (num.length !== 16) e.cardNumber = "Enter the 16-digit card number.";
      if (card.name.trim().length < 2) e.cardName = "Enter the name on the card.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.cardExpiry = "Use MM/YY format.";
      if (!/^\d{3}$/.test(card.cvv)) e.cardCvv = "The CVV is 3 digits.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (paying || unavailableCount > 0 || store.cart.length === 0) return;
    if (!validate()) return;
    setPaying(true);
    placedRef.current = true;
    // Simulated payment — no gateway, no real money moves.
    window.setTimeout(() => {
      const orderId = placeOrder(
        {
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, ""),
          address: form.address.trim(),
          landmark: form.landmark.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
        method,
      );
      void navigate({ to: "/orders/$id", params: { id: orderId } });
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">Delivery from {outlet.name}</p>

      <div className="mt-8 space-y-8">
        {/* Delivery details */}
        <section>
          <h2 className="font-display text-lg font-semibold">Delivery details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Full name
              </label>
              <input
                id="co-name"
                className={inputClass}
                value={form.name}
                onChange={(e) => setField("name")(e.target.value)}
                placeholder="Asha Rao"
                autoComplete="name"
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label htmlFor="co-phone" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Mobile number
              </label>
              <input
                id="co-phone"
                className={inputClass}
                value={form.phone}
                onChange={(e) => setField("phone")(e.target.value)}
                placeholder="98765 43210"
                inputMode="tel"
                autoComplete="tel"
              />
              <FieldError message={errors.phone} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-address" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Flat / house no., street and area
              </label>
              <input
                id="co-address"
                className={inputClass}
                value={form.address}
                onChange={(e) => setField("address")(e.target.value)}
                placeholder="Flat 402, Lakeview Residency, Kondapur"
                autoComplete="street-address"
              />
              <FieldError message={errors.address} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-landmark" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Landmark <span className="font-normal normal-case">(optional)</span>
              </label>
              <input
                id="co-landmark"
                className={inputClass}
                value={form.landmark}
                onChange={(e) => setField("landmark")(e.target.value)}
                placeholder="Opposite the botanical garden gate"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-notes" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Delivery notes <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                id="co-notes"
                rows={2}
                className={cn(inputClass, "resize-none")}
                value={form.notes}
                onChange={(e) => setField("notes")(e.target.value)}
                placeholder="Leave at the door, ring the bell twice"
              />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section>
          <h2 className="font-display text-lg font-semibold">Payment</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Test mode — no real payment is processed
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={method === "upi"}
              onClick={() => setMethod("upi")}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                method === "upi" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-accent",
              )}
            >
              <Landmark className="size-5 text-primary" aria-hidden />
              <span>
                <span className="block text-sm font-bold">UPI</span>
                <span className="block text-xs text-muted-foreground">Pay from any UPI app · test mode</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={method === "card"}
              onClick={() => setMethod("card")}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                method === "card" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-accent",
              )}
            >
              <CreditCard className="size-5 text-primary" aria-hidden />
              <span>
                <span className="block text-sm font-bold">Card</span>
                <span className="block text-xs text-muted-foreground">Credit or debit · test mode</span>
              </span>
            </button>
          </div>

          {method === "upi" ? (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <label htmlFor="co-upi" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                UPI ID
              </label>
              <input
                id="co-upi"
                className={inputClass}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="asha@okhdfcbank"
                inputMode="email"
              />
              <FieldError message={errors.upiId} />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" aria-hidden />
                Demo UPI — any valid-looking ID works. You will not be charged.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="co-cardno" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Card number
                </label>
                <input
                  id="co-cardno"
                  className={inputClass}
                  value={card.number}
                  onChange={(e) =>
                    setCard((c) => ({
                      ...c,
                      number: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 16)
                        .replace(/(\d{4})(?=\d)/g, "$1 "),
                    }))
                  }
                  placeholder="4111 1111 1111 1111"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
                <FieldError message={errors.cardNumber} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-cardname" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Name on card
                </label>
                <input
                  id="co-cardname"
                  className={inputClass}
                  value={card.name}
                  onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                  placeholder="ASHA RAO"
                  autoComplete="cc-name"
                />
                <FieldError message={errors.cardName} />
              </div>
              <div>
                <label htmlFor="co-expiry" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Expiry (MM/YY)
                </label>
                <input
                  id="co-expiry"
                  className={inputClass}
                  value={card.expiry}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCard((c) => ({
                      ...c,
                      expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                    }));
                  }}
                  placeholder="04/29"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                />
                <FieldError message={errors.cardExpiry} />
              </div>
              <div>
                <label htmlFor="co-cvv" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  CVV
                </label>
                <input
                  id="co-cvv"
                  type="password"
                  className={inputClass}
                  value={card.cvv}
                  onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                  placeholder="•••"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                />
                <FieldError message={errors.cardCvv} />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-2">
                <ShieldCheck className="size-3.5" aria-hidden />
                Demo card — details are not stored or sent anywhere. You will not be charged.
              </p>
            </div>
          )}
        </section>

        {/* Summary + pay */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {store.cart.map((line) => (
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
              <dt className="text-muted-foreground">Items total (incl. 5% GST)</dt>
              <dd className="font-semibold tabular-nums">{formatINR(totals.itemsTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery fee</dt>
              <dd className="font-semibold tabular-nums">{formatINR(totals.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt className="font-bold">To pay</dt>
              <dd className="font-bold tabular-nums">{formatINR(totals.total)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={submit}
            disabled={paying || unavailableCount > 0 || store.cart.length === 0}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paying ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Processing payment… (test mode)
              </>
            ) : (
              <>
                <BadgeCheck className="size-4" aria-hidden />
                Pay {formatINR(totals.total)} — test mode
              </>
            )}
          </button>
          {unavailableCount > 0 && (
            <p className="mt-2 text-center text-xs font-semibold text-destructive">
              Some items in your cart aren't available at {outlet.name}.{" "}
              <Link to="/cart" className="underline">
                Go to cart
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
