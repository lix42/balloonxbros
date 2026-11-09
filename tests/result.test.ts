import { describe, expect, it } from "vite-plus/test";
import { ApiError, call, run } from "../src/result";
import { HttpError } from "../worker/validate";

describe("run (server side)", () => {
  it("wraps data, keeps an HttpError's status and message, hides anything else", async () => {
    expect(await run(async () => 42)).toEqual({ ok: true, data: 42 });
    expect(
      await run(async () => {
        throw new HttpError(409, "Sorry, only 2 Gold Star left.");
      }),
    ).toEqual({ ok: false, status: 409, error: "Sorry, only 2 Gold Star left." });

    const hidden = await run(async () => {
      throw new Error("D1_ERROR: no such table: secrets");
    });
    expect(hidden).toEqual({
      ok: false,
      status: 500,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("call (browser side)", () => {
  it("returns data and turns a failed Result into an ApiError with its status", async () => {
    expect(await call(Promise.resolve({ ok: true as const, data: "menu" }))).toBe("menu");

    const err = await call(
      Promise.resolve({ ok: false as const, status: 409, error: "Pre-orders are closed." }),
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, message: "Pre-orders are closed." });
  });

  it("reports a request that never returned as status 0, by cause", async () => {
    const offline = await call(Promise.reject(new TypeError("Failed to fetch"))).catch(
      (e: unknown) => e,
    );
    expect(offline).toMatchObject({ status: 0, message: expect.stringMatching(/connection/) });

    const cause = new Error("bad response");
    const broken = await call(Promise.reject(cause)).catch((e: unknown) => e);
    expect(broken).toMatchObject({
      status: 0,
      message: "Something went wrong. Please try again.",
      cause,
    });
  });
});
