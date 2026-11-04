// Demo delivery-area mapping: a handful of Hyderabad pin codes per outlet.
// Deliberately local and small — no geolocation, no external lookup.

export const PINCODE_OUTLETS: Record<string, string> = {
  // Kondapur
  "500084": "kondapur",
  "500045": "kondapur",
  "500046": "kondapur",
  // Gachibowli
  "500032": "gachibowli",
  "500019": "gachibowli",
  "500081": "gachibowli",
  "500089": "gachibowli",
  // Kukatpally
  "500072": "kukatpally",
  "500049": "kukatpally",
  "500037": "kukatpally",
};

export interface PincodeLookup {
  status: "invalid" | "unsupported" | "ok";
  outletId?: string;
}

export function lookupPincode(input: string): PincodeLookup {
  const pin = input.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) return { status: "invalid" };
  if (!pin.startsWith("500")) return { status: "unsupported" };
  const outletId = PINCODE_OUTLETS[pin];
  return outletId ? { status: "ok", outletId } : { status: "unsupported" };
}
