import { describe, expect, it } from "vitest";
import { isAdmin, makeSessionCookie } from "../worker/auth";

const reqWith = (cookie: string) => new Request("https://x/api/admin/me", { headers: { Cookie: cookie } });
const value = (setCookie: string) => setCookie.split(";")[0];

describe("admin session", () => {
  it("accepts its own cookie and rejects tampering, wrong secret and expiry", async () => {
    const c = value(await makeSessionCookie("s3cret"));
    expect(await isAdmin(reqWith(c), "s3cret")).toBe(true);
    expect(await isAdmin(reqWith(c + "x"), "s3cret")).toBe(false);
    expect(await isAdmin(reqWith(c), "other")).toBe(false);
    expect(await isAdmin(reqWith(c), "s3cret", Date.now() + 8 * 864e5)).toBe(false);
    expect(await isAdmin(reqWith(""), "s3cret")).toBe(false);
  });
});
