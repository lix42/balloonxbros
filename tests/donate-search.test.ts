import { describe, expect, it } from "vite-plus/test";
import { parseDonateSearch } from "../src/lib/donate-search";

describe("parseDonateSearch", () => {
  it("keeps a whole, positive total in cents", () => {
    expect(parseDonateSearch({ total: 3000 })).toEqual({ total: 3000 });
    expect(parseDonateSearch({ total: "2450" })).toEqual({ total: 2450 });
  });

  it("drops a missing, odd or out-of-range total", () => {
    for (const total of [undefined, "", "abc", 0, -100, 12.5, 1_000_001, null, [3000]]) {
      expect(parseDonateSearch({ total })).toEqual({});
    }
  });
});
