import type { AddOnOption, MenuItem, PortionOption, SpiceOption } from "./types";
import chickenImg from "@/assets/chicken-dum-biryani.jpg";
import familyImg from "@/assets/family-pack-biryani.jpg";
import vegImg from "@/assets/veg-dum-biryani.jpg";
import salanImg from "@/assets/mirchi-ka-salan.jpg";
import raitaImg from "@/assets/raita.jpg";
import meethaImg from "@/assets/double-ka-meetha.jpg";
import haleemImg from "@/assets/haleem.jpg";

// Demo menu — one short, scannable Hyderabad-focused menu.
// Backend note: replace with a fetch of the live menu; the shape stays the same.

const SALAN: AddOnOption = { id: "extra-salan", label: "Extra mirchi ka salan", price: 45 };
const RAITA: AddOnOption = { id: "extra-raita", label: "Extra boondi raita", price: 45 };
const EGG: AddOnOption = { id: "boiled-egg", label: "Boiled egg", price: 35 };

const BIRYANI_PORTIONS: PortionOption[] = [
  { id: "single", label: "Single", detail: "Serves 1", priceDelta: 0 },
  { id: "double", label: "Double", detail: "Serves 2", priceDelta: 290 },
];

const SPICE_LEVELS: SpiceOption[] = [
  { id: "mild", label: "Mild" },
  { id: "medium", label: "Medium" },
  { id: "hot", label: "Spicy — Hyderabadi hot" },
];

export const MENU: MenuItem[] = [
  {
    id: "chicken-dum-biryani",
    name: "Chicken Dum Biryani",
    description:
      "Long-grain basmati sealed in the handi with marinated chicken, saffron and fried onions. Served with salan and raita.",
    category: "Biryani",
    basePrice: 329,
    diet: "nonveg",
    allergens: ["Dairy", "Nuts"],
    image: chickenImg,
    availableAt: ["kondapur", "gachibowli", "kukatpally"],
    portions: BIRYANI_PORTIONS,
    spiceLevels: SPICE_LEVELS,
    addOns: [SALAN, RAITA, EGG],
  },
  {
    id: "mutton-dum-biryani",
    name: "Mutton Dum Biryani",
    description:
      "Slow-cooked mutton on the bone layered with kacchi-style rice, mint and saffron. Weekend-favourite, made in small batches.",
    category: "Biryani",
    basePrice: 429,
    diet: "nonveg",
    allergens: ["Dairy", "Nuts"],
    image: familyImg,
    availableAt: ["kondapur", "gachibowli"],
    portions: BIRYANI_PORTIONS,
    spiceLevels: SPICE_LEVELS,
    addOns: [SALAN, RAITA],
  },
  {
    id: "veg-dum-biryani",
    name: "Veg Dum Biryani",
    description:
      "Paneer, garden vegetables and toasted cashews dum-cooked with saffron rice. Every bit as layered as the meat versions.",
    category: "Biryani",
    basePrice: 269,
    diet: "veg",
    allergens: ["Dairy", "Nuts"],
    image: vegImg,
    availableAt: ["kondapur", "gachibowli", "kukatpally"],
    portions: BIRYANI_PORTIONS,
    spiceLevels: SPICE_LEVELS,
    addOns: [SALAN, RAITA],
  },
  {
    id: "family-pack-chicken-biryani",
    name: "Family Pack Chicken Biryani",
    description:
      "A full handi for the table — serves 4, packed with salan, raita and onion salad. Our most-ordered weekend box.",
    category: "Biryani",
    basePrice: 1199,
    diet: "nonveg",
    allergens: ["Dairy", "Nuts"],
    image: familyImg,
    availableAt: ["kondapur", "gachibowli", "kukatpally"],
    portions: [{ id: "family", label: "Family pack", detail: "Serves 4", priceDelta: 0 }],
    spiceLevels: SPICE_LEVELS,
    addOns: [SALAN, RAITA],
  },
  {
    id: "haleem",
    name: "Hyderabadi Haleem",
    description:
      "Slow-pounded wheat, lentils and mutton finished over coals for hours. Sold only from our Kukatpally kitchen.",
    category: "Biryani",
    basePrice: 349,
    diet: "nonveg",
    allergens: ["Gluten", "Dairy"],
    image: haleemImg,
    availableAt: ["kukatpally"],
    portions: [
      { id: "regular", label: "Regular", detail: "Serves 1", priceDelta: 0 },
      { id: "large", label: "Large", detail: "Serves 2", priceDelta: 250 },
    ],
    spiceLevels: SPICE_LEVELS,
    addOns: [RAITA],
  },
  {
    id: "mirchi-ka-salan",
    name: "Mirchi ka Salan",
    description:
      "The classic biryani side — green chillies in a peanut-sesame gravy, tangy and fiery. Pairs with everything.",
    category: "Sides",
    basePrice: 129,
    diet: "veg",
    allergens: ["Peanuts", "Sesame"],
    image: salanImg,
    availableAt: ["kondapur", "gachibowli", "kukatpally"],
    portions: [],
    spiceLevels: [],
    addOns: [],
  },
  {
    id: "boondi-raita",
    name: "Boondi Raita",
    description:
      "Whisked curd with crisp boondi, roasted cumin and a pinch of red chilli. The cool answer to a hot handi.",
    category: "Sides",
    basePrice: 79,
    diet: "veg",
    allergens: ["Dairy"],
    image: raitaImg,
    availableAt: ["kondapur", "gachibowli", "kukatpally"],
    portions: [],
    spiceLevels: [],
    addOns: [],
  },
  {
    id: "double-ka-meetha",
    name: "Double ka Meetha",
    description:
      "Old-city bread pudding fried in ghee, soaked in saffron milk and buried under fried nuts. Finish the meal properly.",
    category: "Desserts",
    basePrice: 119,
    diet: "veg",
    allergens: ["Gluten", "Dairy", "Nuts"],
    image: meethaImg,
    availableAt: ["kondapur", "gachibowli", "kukatpally"],
    portions: [],
    spiceLevels: [],
    addOns: [],
  },
];

export const MENU_CATEGORIES = ["Biryani", "Sides", "Desserts"] as const;

export function getMenu(): MenuItem[] {
  return MENU;
}

export function getItem(id: string): MenuItem | null {
  return MENU.find((i) => i.id === id) ?? null;
}

export function isItemAvailable(item: MenuItem, outletId: string | null): boolean {
  if (!outletId) return false;
  return item.availableAt.includes(outletId);
}

/** Unit price in ₹, inclusive of 5% GST. */
export function computeUnitPrice(
  item: MenuItem,
  portionId: string,
  addOnIds: string[],
): number {
  const portion = item.portions.find((p) => p.id === portionId);
  const addOnSum = item.addOns
    .filter((a) => addOnIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  return item.basePrice + (portion?.priceDelta ?? 0) + addOnSum;
}
