import { useSyncExternalStore } from "react";
import type { CartAddOn, CartLine, MenuItem, Order, OrderCustomer, PaymentMethod } from "@/data/types";
import { computeUnitPrice } from "@/data/menu";
import { cartTotals, orderCode, randomId } from "@/lib/format";

// Local demo state (outlet + cart + orders) persisted to localStorage so a
// demo order survives refresh. Backend note: when the backend lands, swap the
// actions below for API calls — components only talk to this module.

export interface AppState {
  outletId: string | null;
  cart: CartLine[];
  orders: Order[];
  /** False until the client has read localStorage (keeps SSR hydration stable). */
  hydrated: boolean;
}

const STORAGE_KEY = "toh-demo-state-v1";

const serverSnapshot: AppState = {
  outletId: null,
  cart: [],
  orders: [],
  hydrated: false,
};

let state: AppState = serverSnapshot;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Read persisted demo state once, on the client. */
export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  let restored: Partial<AppState> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) restored = JSON.parse(raw) as Partial<AppState>;
  } catch {
    // Corrupted demo state — start fresh.
  }
  state = {
    outletId: restored.outletId ?? null,
    cart: Array.isArray(restored.cart) ? restored.cart : [],
    orders: Array.isArray(restored.orders) ? restored.orders : [],
    hydrated: true,
  };
  emit();
}

function setState(next: AppState) {
  state = next;
  if (hydrated && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked — demo keeps working in memory.
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => serverSnapshot);
}

export function selectOutlet(outletId: string) {
  setState({ ...state, outletId });
}

export interface AddToCartInput {
  item: MenuItem;
  portionId: string;
  spiceId: string;
  addOnIds: string[];
  qty: number;
}

function sameComposition(a: CartLine, input: AddToCartInput): boolean {
  const addOnKey = (list: CartAddOn[]) => list.map((x) => x.id).sort().join(",");
  return (
    a.itemId === input.item.id &&
    a.portionId === input.portionId &&
    a.spiceLabel === spiceLabelOf(input.item, input.spiceId) &&
    addOnKey(a.addOns) === addOnKey(composeAddOns(input.item, input.addOnIds))
  );
}

function spiceLabelOf(item: MenuItem, spiceId: string): string | null {
  return item.spiceLevels.find((s) => s.id === spiceId)?.label ?? null;
}

function composeAddOns(item: MenuItem, addOnIds: string[]): CartAddOn[] {
  return item.addOns
    .filter((a) => addOnIds.includes(a.id))
    .map((a) => ({ id: a.id, label: a.label, price: a.price }));
}

export function addToCart(input: AddToCartInput) {
  const { item, portionId, qty } = input;
  const outletId = state.outletId;
  if (!outletId) return;
  const portion = item.portions.find((p) => p.id === portionId);
  const existing = state.cart.find((line) => sameComposition(line, input));
  if (existing) {
    setState({
      ...state,
      cart: state.cart.map((line) =>
        line.id === existing.id ? { ...line, qty: line.qty + qty } : line,
      ),
    });
    return;
  }
  const line: CartLine = {
    id: randomId(),
    itemId: item.id,
    name: item.name,
    image: item.image,
    diet: item.diet,
    outletId,
    portionId,
    portionLabel: portion?.label ?? "",
    spiceLabel: spiceLabelOf(item, input.spiceId),
    addOns: composeAddOns(item, input.addOnIds),
    unitPrice: computeUnitPrice(item, portionId, input.addOnIds),
    qty,
  };
  setState({ ...state, cart: [...state.cart, line] });
}

export function setLineQty(lineId: string, qty: number) {
  if (qty <= 0) {
    removeLine(lineId);
    return;
  }
  setState({
    ...state,
    cart: state.cart.map((line) => (line.id === lineId ? { ...line, qty } : line)),
  });
}

export function removeLine(lineId: string) {
  setState({ ...state, cart: state.cart.filter((line) => line.id !== lineId) });
}

export function clearCart() {
  setState({ ...state, cart: [] });
}

export function placeOrder(customer: OrderCustomer, paymentMethod: PaymentMethod): string {
  const outletId = state.outletId;
  if (state.cart.length === 0 || !outletId) {
    throw new Error("Cannot place an order with an empty cart");
  }
  const order: Order = {
    id: orderCode(),
    outletId,
    outletName: outletId.charAt(0).toUpperCase() + outletId.slice(1),
    lines: state.cart,
    totals: cartTotals(state.cart),
    customer,
    paymentMethod,
    placedAt: Date.now(),
  };
  setState({ ...state, cart: [], orders: [order, ...state.orders].slice(0, 10) });
  return order.id;
}

export function getOrder(orderId: string): Order | null {
  return state.orders.find((o) => o.id === orderId) ?? null;
}
