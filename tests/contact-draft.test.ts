import { describe, expect, it } from "vite-plus/test";
import { CONTACT_LIMITS, EMPTY_CONTACT, parseContact } from "../src/lib/contact-draft";

describe("parseContact", () => {
  it("reads a saved draft", () => {
    const draft = { name: "Ada", email: "ada@example.com", phone: "425-555-0100" };
    expect(parseContact(JSON.stringify(draft))).toEqual(draft);
  });

  it("returns empty fields for nothing saved, junk, or a non-object", () => {
    for (const raw of [null, "", "{not json", "null", "42", '"text"', "[]"]) {
      expect(parseContact(raw)).toEqual(EMPTY_CONTACT);
    }
  });

  it("drops fields that aren't strings and keeps the rest", () => {
    expect(parseContact(JSON.stringify({ name: "Ada", email: 5, phone: null }))).toEqual({
      name: "Ada",
      email: "",
      phone: "",
    });
  });

  it("cuts values to the form's limits", () => {
    const long = parseContact(
      JSON.stringify({ name: "n".repeat(500), email: "e".repeat(500), phone: "1".repeat(500) }),
    );
    expect(long.name).toHaveLength(CONTACT_LIMITS.name);
    expect(long.email).toHaveLength(CONTACT_LIMITS.email);
    expect(long.phone).toHaveLength(CONTACT_LIMITS.phone);
  });
});
