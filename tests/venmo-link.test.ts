import { describe, expect, it } from "vite-plus/test";
import { venmoPayUrl } from "../shared/types";

describe("venmoPayUrl", () => {
  it("opens a payment to the handle with the amount and note filled in", () => {
    expect(venmoPayUrl("huhuwen", 2450, "Balloon x Bros pre-order")).toBe(
      "https://venmo.com/huhuwen?txn=pay&amount=24.50&note=Balloon+x+Bros+pre-order",
    );
    expect(venmoPayUrl("huhuwen", 1000, "a&b")).toBe(
      "https://venmo.com/huhuwen?txn=pay&amount=10.00&note=a%26b",
    );
  });

  it("leaves the amount for the buyer to type when it isn't known", () => {
    expect(venmoPayUrl("huhuwen", null, "Balloon x Bros pre-order")).toBe(
      "https://venmo.com/huhuwen?txn=pay&note=Balloon+x+Bros+pre-order",
    );
  });
});
