// Shared domain types for the Tales of Hyderabad demo.
// Backend note: when the real backend lands, these types stay the contract —
// the data files under src/data/ are the only place that changes.

export type Diet = "veg" | "nonveg";

export interface PortionOption {
  id: string;
  label: string;
  detail?: string;
  priceDelta: number;
}

export interface SpiceOption {
  id: string;
  label: string;
}

export interface AddOnOption {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Price in ₹, inclusive of 5% GST. */
  basePrice: number;
  diet: Diet;
  allergens: string[];
  /** Bundled asset URL. Replace the import in src/data/menu.ts to swap images. */
  image: string;
  /** Outlet ids where this item can be ordered. */
  availableAt: string[];
  portions: PortionOption[];
  spiceLevels: SpiceOption[];
  addOns: AddOnOption[];
}

export interface OutletFssai {
  licence: string;
  validTill: string;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  etaMins: number;
  fssai: OutletFssai;
}

export interface CartAddOn {
  id: string;
  label: string;
  price: number;
}

export interface CartLine {
  id: string;
  itemId: string;
  name: string;
  image: string;
  diet: Diet;
  outletId: string;
  portionId: string;
  portionLabel: string;
  spiceLabel: string | null;
  addOns: CartAddOn[];
  /** ₹ incl. 5% GST, per unit. */
  unitPrice: number;
  qty: number;
}

export type PaymentMethod = "upi" | "card";

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  notes?: string;
}

export interface OrderTotals {
  itemsTotal: number;
  deliveryFee: number;
  total: number;
  gstIncluded: number;
}

export interface Order {
  id: string;
  outletId: string;
  outletName: string;
  lines: CartLine[];
  totals: OrderTotals;
  customer: OrderCustomer;
  paymentMethod: PaymentMethod;
  /** Epoch ms when the demo order was placed. */
  placedAt: number;
}
