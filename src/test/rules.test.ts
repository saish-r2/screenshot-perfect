import { describe, expect, it } from "vitest";
import { lookupPincode } from "@/lib/pincodes";
import { isOrderLate, nextStatus } from "@/lib/order";
import { outletSwitchDecision } from "@/lib/store";
import type { Order } from "@/data/types";

describe("outlet switching", () => {
  it("keeps the cart when picking the current outlet", () => {
    expect(outletSwitchDecision("kondapur", 2, "kondapur")).toBe("same");
  });
  it("asks for confirmation when switching with items", () => {
    expect(outletSwitchDecision("kondapur", 2, "gachibowli")).toBe("confirm");
  });
  it("switches freely with an empty cart", () => {
    expect(outletSwitchDecision("kondapur", 0, "gachibowli")).toBe("switch");
  });
});

describe("kitchen status", () => {
  it("never skips a step", () => {
    expect(nextStatus("placed")).toBe("accepted");
    expect(nextStatus("accepted")).toBe("preparing");
    expect(nextStatus("preparing")).toBe("ready");
    expect(nextStatus("ready")).toBe("out_for_delivery");
    expect(nextStatus("out_for_delivery")).toBeNull();
  });
  it("flags late orders only while still in the kitchen", () => {
    const o = { status: "preparing", expectedReadyAt: 1000 } as Order;
    expect(isOrderLate(o, 2000)).toBe(true);
    expect(isOrderLate({ ...o, status: "ready" }, 2000)).toBe(false);
    expect(isOrderLate(o, 500)).toBe(false);
  });
});

describe("pincode lookup", () => {
  it("maps supported pincodes to outlets", () => {
    expect(lookupPincode("500032")).toEqual({ status: "ok", outletId: "gachibowli" });
  });
  it("rejects unsupported and invalid pincodes", () => {
    expect(lookupPincode("500001").status).toBe("unsupported");
    expect(lookupPincode("12").status).toBe("invalid");
  });
});
