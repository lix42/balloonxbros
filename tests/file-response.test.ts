import { env } from "cloudflare:workers";
import { describe, expect, it } from "vite-plus/test";
import { errorResponse, photoResponse, receiptResponse } from "../src/file-response";
import { HttpError } from "../worker/validate";

async function stored(key: string, type: string): Promise<R2ObjectBody> {
  await env.FILES.put(key, new Uint8Array([1, 2]), { httpMetadata: { contentType: type } });
  return (await env.FILES.get(key))!;
}

describe("file responses", () => {
  it("never caches or sniffs a receipt", async () => {
    const res = receiptResponse(await stored("receipts/BXB-TEST1.png", "image/png"));
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Disposition")).toBe("inline");
  });

  it("caches a photo for good", async () => {
    const res = photoResponse(await stored("photos/dog-1.jpg", "image/jpeg"));
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
  });

  it("answers errors as uncached JSON, hiding unexpected ones", async () => {
    const notFound = errorResponse(new HttpError(404, "Receipt not found."));
    expect(notFound.status).toBe(404);
    expect(notFound.headers.get("Cache-Control")).toBe("no-store");
    expect(await notFound.json()).toEqual({ error: "Receipt not found." });

    const crash = errorResponse(new Error("D1_ERROR: secret detail"));
    expect(crash.status).toBe(500);
    expect(JSON.stringify(await crash.json())).not.toContain("secret");
  });
});
