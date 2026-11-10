import { describe, expect, it } from "vite-plus/test";
import { checkReceipt, newOrderCode, parseOrderInput } from "../worker/validate";

const base = { name: "Ana", email: "Ana@Example.com", phone: "(206) 555-0100" };

describe("parseOrderInput", () => {
  it("normalizes and merges duplicate lines", () => {
    const o = parseOrderInput({
      ...base,
      lines: [
        { itemId: "dog", qty: 1, note: "blue" },
        { itemId: "dog", qty: 2, note: "red" },
        { itemId: "sword", qty: 0 },
      ],
    });
    expect(o.email).toBe("ana@example.com");
    expect(o.lines).toEqual([{ itemId: "dog", qty: 3, note: "blue; red" }]);
  });

  it("rejects empty orders, bad emails and bad quantities", () => {
    expect(() => parseOrderInput({ ...base, lines: [] })).toThrow(/empty/);
    expect(() => parseOrderInput({ ...base, lines: [{ itemId: "dog", qty: 0 }] })).toThrow(/empty/);
    expect(() =>
      parseOrderInput({ ...base, email: "nope", lines: [{ itemId: "dog", qty: 1 }] }),
    ).toThrow(/email/);
    expect(() => parseOrderInput({ ...base, lines: [{ itemId: "dog", qty: 1.5 }] })).toThrow(
      /quantity/,
    );
    expect(() => parseOrderInput({ ...base, lines: [{ itemId: "DROP TABLE", qty: 1 }] })).toThrow(
      /item/,
    );
    for (const phone of ["12", "425-555-010", "425-555-01000", "+44 20 7946 0958"]) {
      expect(() => parseOrderInput({ ...base, phone, lines: [{ itemId: "dog", qty: 1 }] })).toThrow(
        /phone/,
      );
    }
  });

  it("stores the phone as (xxx) xxx-xxxx", () => {
    const o = parseOrderInput({
      ...base,
      phone: "+1 425.555.0100",
      lines: [{ itemId: "dog", qty: 1 }],
    });
    expect(o.phone).toBe("(425) 555-0100");
  });
});

describe("checkReceipt", () => {
  it("accepts images and PDFs, rejects others", () => {
    expect(checkReceipt(new File(["x"], "r.png", { type: "image/png" })).name).toBe("r.png");
    expect(() => checkReceipt(new File(["x"], "r.html", { type: "text/html" }))).toThrow(/image/);
    expect(() => checkReceipt(null)).toThrow(/attach/);
  });
});

describe("newOrderCode", () => {
  it("has the BXB-XXXXX shape without ambiguous characters", () => {
    for (let i = 0; i < 50; i++) expect(newOrderCode()).toMatch(/^BXB-[2-9A-HJKMNP-Z]{5}$/);
  });
});
