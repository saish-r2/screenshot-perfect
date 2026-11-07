import { useSyncExternalStore } from "react";
import type {
  CartAddOn,
  CartLine,
  MenuItem,
  Order,
  OrderCustomer,
  OrderStatus,
  PaymentMethod,
} from "@/data/types";
import { MENU, computeUnitPrice } from "@/data/menu";
import { getOutlet } from "@/data/outlets";
import { cartTotals, orderCode, randomId } from "@/lib/format";
import { ORDER_STEPS } from "@/lib/order";

// Local demo state (outlet + cart + orders + admin-edited menu) persisted to
// localStorage so a demo order survives refresh. Backend note: when the backend
// lands, swap the actions below for API calls — components only talk to this module.

export interface AppState {
  outletId: string | null;
  /** Outlet shown on the kitchen board (independent of the customer outlet). */
  kitchenOutletId: string;
  cart: CartLine[];
  orders: Order[];
  /** Live menu — the demo MENU until an admin edit persists an override. */
  menuItems: MenuItem[];
  /** False until the client has read localStorage (keeps SSR hydration stable). */
  hydrated: boolean;
}

const STORAGE_KEY = "toh-demo-state-v1";

const serverSnapshot: AppState = {
  outletId: null,
  kitchenOutletId: "kondapur",
  cart: [],
  orders: [],
  menuItems: MENU,
  hydrated: false,
};

let state: AppState = serverSnapshot;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function cloneMenu(): MenuItem[] {
  return JSON.parse(JSON.stringify(MENU)) as MenuItem[];
}

/** Old timer offsets, kept only to migrate demo orders from before statuses became manual. */
const LEGACY_STEP_OFFSETS_MS = [0, 30_000, 90_000, 180_000];

function migrateOrder(order: Order): Order {
  if (order.status && Array.isArray(order.statusHistory) && order.statusHistory.length > 0) {
    return order;
  }
  // Legacy orders derived status from elapsed time — snapshot that progress once.
  const placedAt = typeof order.placedAt === "number" ? order.placedAt : Date.now();
  const elapsed = Date.now() - placedAt;
  let idx = 0;
  LEGACY_STEP_OFFSETS_MS.forEach((offset, i) => {
    if (elapsed >= offset) idx = i;
  });
  idx = Math.min(idx, 3); // the legacy timeline ended at "ready"
  return {
    ...order,
    status: ORDER_STEPS[idx]?.id ?? "placed",
    statusHistory: LEGACY_STEP_OFFSETS_MS.slice(0, idx + 1).map((offset, i) => ({
      status: ORDER_STEPS[i]?.id ?? "placed",
      at: placedAt + offset,
    })),
    expectedReadyAt: placedAt + 40 * 60_000,
  };
}

function normalize(raw: Partial<AppState>): AppState {
  return {
    outletId: raw.outletId ?? null,
    kitchenOutletId: raw.kitchenOutletId ?? "kondapur",
    cart: Array.isArray(raw.cart) ? raw.cart : [],
    orders: (Array.isArray(raw.orders) ? raw.orders : []).map(migrateOrder),
    menuItems:
      Array.isArray(raw.menuItems) && raw.menuItems.length > 0 ? raw.menuItems : cloneMenu(),
    hydrated: true,
  };
}

/** Read persisted demo state once, on the client, and keep tabs in sync. */
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
  state = normalize(restored);
  // Other tabs (kitchen/admin open beside the customer) stay in sync via storage events.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || event.newValue === null) return;
    try {
      state = normalize(JSON.parse(event.newValue) as Partial<AppState>);
      emit();
    } catch {
      // Ignore malformed cross-tab payloads.
    }
  });
  emit();
}

function persist(next: AppState) {
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

/** Current in-memory state — mainly for tests. */
export function getState(): AppState {
  return state;
}

/** Test helper: seed the demo state directly (persists like a real update would). */
export function __setDemoStateForTests(next: AppState) {
  hydrated = typeof window !== "undefined";
  persist(next);
}

// --- Outlets ---

export function selectOutlet(outletId: string) {
  persist({ ...state, outletId });
}

export function setKitchenOutlet(outletId: string) {
  persist({ ...state, kitchenOutletId: outletId });
}

export type OutletSwitchDecision = "same" | "switch" | "confirm";

/** Switching outlets must never silently move the cart to a different kitchen. */
export function outletSwitchDecision(
  currentId: string | null,
  cartCount: number,
  nextId: string,
): OutletSwitchDecision {
  if (nextId === currentId) return "same";
  return cartCount > 0 ? "confirm" : "switch";
}

/** Apply an already-decided outlet switch; a cart that needs confirmation is never moved. */
export function applyOutletSwitch(nextId: string) {
  const decision = outletSwitchDecision(state.outletId, state.cart.length, nextId);
  if (decision === "confirm") return; // caller must confirm first
  persist({
    ...state,
    outletId: nextId,
    cart: decision === "switch" ? [] : state.cart,
  });
}

/** The confirmed variant of a cart-carrying switch: clears the cart and switches. */
export function confirmOutletSwitch(nextId: string) {
  persist({ ...state, outletId: nextId, cart: [] });
}

// --- Cart ---

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
    persist({
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
  persist({ ...state, cart: [...state.cart, line] });
}

export function setLineQty(lineId: string, qty: number) {
  if (qty <= 0) {
    removeLine(lineId);
    return;
  }
  persist({
    ...state,
    cart: state.cart.map((line) => (line.id === lineId ? { ...line, qty } : line)),
  });
}

export function removeLine(lineId: string) {
  persist({ ...state, cart: state.cart.filter((line) => line.id !== lineId) });
}

export function clearCart() {
  persist({ ...state, cart: [] });
}

// --- Orders ---

export function placeOrder(customer: OrderCustomer, paymentMethod: PaymentMethod): string {
  const outletId = state.outletId;
  if (state.cart.length === 0 || !outletId) {
    throw new Error("Cannot place an order with an empty cart");
  }
  const placedAt = Date.now();
  const outlet = getOutlet(outletId);
  const order: Order = {
    id: orderCode(),
    outletId,
    outletName: outlet?.name ?? outletId.charAt(0).toUpperCase() + outletId.slice(1),
    lines: state.cart,
    totals: cartTotals(state.cart),
    customer,
    paymentMethod,
    placedAt,
    status: "placed",
    statusHistory: [{ status: "placed", at: placedAt }],
    expectedReadyAt: placedAt + (outlet?.etaMins ?? 40) * 60_000,
  };
  persist({ ...state, cart: [], orders: [order, ...state.orders].slice(0, 10) });
  return order.id;
}

/** Kitchen action: move an order to its next status (one step, never skipping). */
export function setOrderStatus(orderId: string, status: OrderStatus) {
  persist({
    ...state,
    orders: state.orders.map((o) =>
      o.id === orderId
        ? { ...o, status, statusHistory: [...o.statusHistory, { status, at: Date.now() }] }
        : o,
    ),
  });
}

export function getOrder(orderId: string): Order | null {
  return state.orders.find((o) => o.id === orderId) ?? null;
}

// --- Menu admin (shared with the customer menu through state.menuItems) ---

export function upsertMenuItem(item: MenuItem) {
  const exists = state.menuItems.some((m) => m.id === item.id);
  persist({
    ...state,
    menuItems: exists
      ? state.menuItems.map((m) => (m.id === item.id ? item : m))
      : [...state.menuItems, item],
  });
}

export function deleteMenuItem(itemId: string) {
  persist({ ...state, menuItems: state.menuItems.filter((m) => m.id !== itemId) });
}

export function setItemAvailability(itemId: string, outletId: string, available: boolean) {
  persist({
    ...state,
    menuItems: state.menuItems.map((m) =>
      m.id === itemId
        ? {
            ...m,
            availableAt: available
              ? Array.from(new Set([...m.availableAt, outletId]))
              : m.availableAt.filter((id) => id !== outletId),
          }
        : m,
    ),
  });
}

/** Restore the original demo menu, discarding every admin edit. */
export function resetMenuToDemo() {
  persist({ ...state, menuItems: cloneMenu() });
}

export function newMenuItemId(name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item";
  return `${slug}-${randomId()}`;
}
