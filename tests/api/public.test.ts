import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import type { MenuResponse, PublicOrder, Settings } from "../../shared/types";
import {
  BASE,
  count,
  errorOf,
  eventually,
  fileKeys,
  receiptFile,
  reset,
  self,
  stockOf,
  submitOrder,
} from "./helpers";

beforeEach(reset);

describe("GET /api/menu", () => {
  it("lists active items in sort order with the settings", async () => {
    const res = await self.fetch(`${BASE}/api/menu`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json<MenuResponse>();
    expect(body.items.map((i) => i.id)).toEqual(["dog", "sword", "star", "gone"]);
    expect(body.settings.school_name).toBe("Kirkland Middle School (KIMS)");
    expect(body.settings.orders_open).toBe("1");
  });
});

describe("POST /api/orders", () => {
  it("creates the order, prices it from the database and takes limited stock", async () => {
    const res = await submitOrder({
      lines: [
        { itemId: "dog", qty: 2, note: "blue please" },
        { itemId: "star", qty: 1 },
        { itemId: "dog", qty: 1 },
      ],
    });
    expect(res.status).toBe(201);
    const { order } = await res.json<{ order: PublicOrder; settings: Settings }>();
    expect(order.id).toMatch(/^BXB-[2-9A-HJKMNP-Z]{5}$/);
    expect(order.status).toBe("submitted");
    expect(order.totalCents).toBe(3 * 500 + 1500);
    expect(order.lines).toEqual([
      { itemId: "dog", name: "Balloon Dog", unitPriceCents: 500, qty: 3, note: "blue please" },
      { itemId: "star", name: "Gold Star", unitPriceCents: 1500, qty: 1, note: null },
    ]);

    expect(await stockOf("star")).toBe(2);
    expect(await stockOf("dog")).toBeNull();
    const row = await env.DB.prepare("SELECT email, receipt_key, receipt_type FROM orders WHERE id = ?")
      .bind(order.id)
      .first<{ email: string; receipt_key: string; receipt_type: string }>();
    expect(row).toEqual({ email: "ada@example.com", receipt_key: `receipts/${order.id}.png`, receipt_type: "image/png" });
    expect(await fileKeys("receipts/")).toEqual([`receipts/${order.id}.png`]);
    expect(await count("order_items")).toBe(2);
  });

  it("refuses orders while pre-orders are closed", async () => {
    await env.DB.prepare("UPDATE settings SET value = '0' WHERE key = 'orders_open'").run();
    const res = await submitOrder({ lines: [{ itemId: "dog", qty: 1 }] });
    expect(res.status).toBe(409);
    expect(await errorOf(res)).toMatch(/closed/);
    expect(await count("orders")).toBe(0);
  });

  it("refuses inactive and unknown items", async () => {
    for (const itemId of ["retired", "nope"]) {
      const res = await submitOrder({ lines: [{ itemId, qty: 1 }] });
      expect(res.status).toBe(409);
      expect(await errorOf(res)).toMatch(/no longer available/);
    }
    expect(await count("orders")).toBe(0);
  });

  it("refuses more than the stock left, naming the item", async () => {
    let res = await submitOrder({ lines: [{ itemId: "star", qty: 4 }] });
    expect(res.status).toBe(409);
    expect(await errorOf(res)).toBe("Sorry, only 3 Gold Star left.");

    res = await submitOrder({ lines: [{ itemId: "gone", qty: 1 }] });
    expect(res.status).toBe(409);
    expect(await errorOf(res)).toBe("Sorry, Sold Out Star just sold out.");
    expect(await stockOf("star")).toBe(3);
    expect(await count("orders")).toBe(0);
  });

  it("rolls back the whole order when stock runs out mid-checkout", async () => {
    // Another buyer takes the last stars between our stock check and our write.
    await env.DB.prepare(
      "CREATE TRIGGER steal_stock BEFORE INSERT ON orders BEGIN UPDATE items SET stock = 0 WHERE id = 'star'; END",
    ).run();
    const res = await submitOrder({ lines: [{ itemId: "dog", qty: 1 }, { itemId: "star", qty: 1 }] });
    expect(res.status).toBe(409);
    expect(await errorOf(res)).toMatch(/just sold out/);
    expect(await count("orders")).toBe(0);
    expect(await count("order_items")).toBe(0);
    expect(await eventually(async () => (await fileKeys("receipts/")).length === 0)).toBe(true);
  });

  it("requires a receipt that is an image or PDF", async () => {
    let res = await submitOrder({ lines: [{ itemId: "dog", qty: 1 }] }, null);
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toMatch(/attach your donation receipt/);

    res = await submitOrder({ lines: [{ itemId: "dog", qty: 1 }] }, receiptFile("text/html"));
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toMatch(/image .* or a PDF/);
    expect(await count("orders")).toBe(0);
    expect(await fileKeys()).toEqual([]);
  });

  it("rejects malformed submissions", async () => {
    let res = await self.fetch(`${BASE}/api/orders`, { method: "POST", body: "not a form" });
    expect(res.status).toBe(400);

    const form = new FormData();
    form.set("order", "{not json");
    form.set("receipt", receiptFile());
    res = await self.fetch(`${BASE}/api/orders`, { method: "POST", body: form });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid order.");

    res = await submitOrder({ email: "nope", lines: [{ itemId: "dog", qty: 1 }] });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toMatch(/valid email/);
  });
});

describe("GET /api/files", () => {
  it("serves item photos but never receipts", async () => {
    await env.FILES.put("photos/dog-1.png", new Uint8Array([1, 2, 3]), { httpMetadata: { contentType: "image/png" } });
    await env.FILES.put("receipts/BXB-AAAAA.png", new Uint8Array([4]), { httpMetadata: { contentType: "image/png" } });

    const photo = await self.fetch(`${BASE}/api/files/photos/dog-1.png`);
    expect(photo.status).toBe(200);
    expect(photo.headers.get("Content-Type")).toBe("image/png");
    expect(new Uint8Array(await photo.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));

    expect((await self.fetch(`${BASE}/api/files/receipts/BXB-AAAAA.png`)).status).toBe(404);
    expect((await self.fetch(`${BASE}/api/files/photos/missing.png`)).status).toBe(404);
  });

  it("answers unknown API paths with a JSON 404", async () => {
    const res = await self.fetch(`${BASE}/api/nope`);
    expect(res.status).toBe(404);
    expect(await errorOf(res)).toBe("Not found.");
  });
});
