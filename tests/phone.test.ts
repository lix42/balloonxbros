import { describe, expect, it } from "vite-plus/test";
import { formatUsPhone, parseUsPhone } from "../shared/phone";

describe("formatUsPhone", () => {
  it("formats as the digits are typed", () => {
    const typed = "4255550100";
    const steps = Array.from({ length: typed.length }, (_, i) =>
      formatUsPhone(typed.slice(0, i + 1)),
    );
    expect(steps).toEqual([
      "(4",
      "(42",
      "(425",
      "(425) 5",
      "(425) 55",
      "(425) 555",
      "(425) 555-0",
      "(425) 555-01",
      "(425) 555-010",
      "(425) 555-0100",
    ]);
  });

  it("lets backspace remove a separator", () => {
    // Deleting the "-" leaves "(425) 555", which must not grow it back.
    expect(formatUsPhone("(425) 555")).toBe("(425) 555");
    expect(formatUsPhone("(425)")).toBe("(425");
    expect(formatUsPhone("(")).toBe("");
  });

  it("drops the country code", () => {
    expect(formatUsPhone("+1 (425) 555-0100")).toBe("(425) 555-0100");
    expect(formatUsPhone("1")).toBe("");
  });

  it("leaves more than ten digits bare instead of cutting them to a wrong number", () => {
    expect(formatUsPhone("425-555-01000")).toBe("42555501000");
    expect(formatUsPhone("+44 20 7946 0958")).toBe("442079460958");
    // Backspacing the extra digit off the bare value formats it again.
    expect(formatUsPhone("42555501000".slice(0, -1))).toBe("(425) 555-0100");
  });
});

describe("parseUsPhone", () => {
  it("accepts exactly ten digits, with or without a leading 1", () => {
    expect(parseUsPhone("425-555-0100")).toBe("(425) 555-0100");
    expect(parseUsPhone("1 425 555 0100")).toBe("(425) 555-0100");
    expect(parseUsPhone("425-555-010")).toBeNull();
    expect(parseUsPhone("425-555-01000")).toBeNull();
    expect(parseUsPhone("")).toBeNull();
  });

  it("strips the country code only once", () => {
    // "1" + a 10-digit number that itself starts with 1 must not lose a digit.
    expect(parseUsPhone("1 123 456 7890")).toBe("(123) 456-7890");
  });
});
