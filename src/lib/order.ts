import type { Order } from "@/data/types";

// Demo order progression: derived from the time the order was placed, so the
// tracker keeps its position across page refreshes without any backend.
// Backend note: replace with real status events later.

export interface OrderStep {
  id: string;
  label: string;
  hint: string;
  offsetMs: number;
}

export const ORDER_STEPS: OrderStep[] = [
  { id: "placed", label: "Placed", hint: "We have your order", offsetMs: 0 },
  { id: "accepted", label: "Accepted", hint: "Kitchen confirmed the order", offsetMs: 30_000 },
  { id: "preparing", label: "Preparing", hint: "Dum in progress", offsetMs: 90_000 },
  { id: "ready", label: "Ready", hint: "Packed and out for delivery", offsetMs: 180_000 },
];

/** Index of the furthest step reached, or -1 only if the clock is off. */
export function getOrderStepIndex(placedAt: number, now: number): number {
  const elapsed = now - placedAt;
  let index = 0;
  for (let i = 0; i < ORDER_STEPS.length; i += 1) {
    if (elapsed >= ORDER_STEPS[i].offsetMs) index = i;
  }
  return index;
}

export function orderStepTimes(order: Order): number[] {
  return ORDER_STEPS.map((s) => order.placedAt + s.offsetMs);
}
