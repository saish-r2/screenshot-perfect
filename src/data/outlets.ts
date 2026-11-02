import type { Outlet } from "./types";

// Demo outlets — clearly labeled demo data shown in the UI.
// Backend note: replace with a fetch of real outlets later.

export const OUTLETS: Outlet[] = [
  {
    id: "kondapur",
    name: "Kondapur",
    address: "Plot 12, Botanical Garden Road, Kondapur, Hyderabad 500084",
    phone: "+91 90000 12345",
    hours: "11:00 am – 11:00 pm, all days",
    etaMins: 35,
    fssai: {
      licence: "12345678901234",
      validTill: "31 Mar 2027",
    },
  },
  {
    id: "gachibowli",
    name: "Gachibowli",
    address: "Survey 45, Cyber Towers Road, Gachibowli, Hyderabad 500032",
    phone: "+91 90000 23456",
    hours: "11:00 am – 11:30 pm, all days",
    etaMins: 40,
    fssai: {
      licence: "12345678901245",
      validTill: "31 Mar 2027",
    },
  },
  {
    id: "kukatpally",
    name: "Kukatpally",
    address: "Shop 8, KPHB Phase 1 Main Road, Kukatpally, Hyderabad 500072",
    phone: "+91 90000 34567",
    hours: "12:00 pm – 11:00 pm, all days",
    etaMins: 45,
    fssai: {
      licence: "12345678901256",
      validTill: "31 Mar 2027",
    },
  },
];

export function listOutlets(): Outlet[] {
  return OUTLETS;
}

export function getOutlet(id: string | null): Outlet | null {
  if (!id) return null;
  return OUTLETS.find((o) => o.id === id) ?? null;
}
