import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import type { AdminOrder, Item, PublicOrder, Settings } from "../../shared/types";
import { admin, adminCookie, BASE, errorOf, reset, self, stockOf, submitOrder } from "./helpers";

beforeEach(reset);

async function placeOrder(lines: { itemId: string; qty: number }[]): Promise<PublicOrder> {
  const res = await submitOrder({ lines });
  expect(res.status).toBe(201);
  return (await res.json<{ order: PublicOrder }>()).order;
}

describe("admin login", () => {
  it("sets a session cookie for the right password only", async () => {
    const ok = await self.fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "test-password" }),
    });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("Set-Cookie")).toMatch(
      /^bxb_admin=.+; Path=\/api\/admin; HttpOnly; Secure; SameSite=Strict/,
    );

    const bad = await self.fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "guess" }),
    });
    expect(bad.status).toBe(401);
    expect(bad.headers.get("Set-Cookie")).toBeNull();
  });

  it("clears the cookie on logout", async () => {
    const res = await self.fetch(`${BASE}/api/admin/logout`, { method: "POST" });
    expect(res.headers.get("Set-Cookie")).toMatch(/^bxb_admin=; .*Max-Age=0/);
  });
});

describe("admin routes without a valid session", () => {
  const routes: [string, string][] = [
    ["GET", "/api/admin/me"],
    ["GET", "/api/admin/orders"],
    ["GET", "/api/admin/orders/BXB-AAAAA/receipt"],
    ["PATCH", "/api/admin/orders/BXB-AAAAA"],
    ["GET", "/api/admin/items"],
    ["POST", "/api/admin/items"],
    ["PATCH", "/api/admin/items/dog"],
    ["POST", "/api/admin/items/dog/photo"],
    ["GET", "/api/admin/settings"],
    ["PUT", "/api/admin/settings"],
  ];

  it.each(routes)("%s %s answers 401 with no cookie or a forged one", async (method, path) => {
    const good = await adminCookie();
    for (const cookie of ["", "bxb_admin=forged.value", `${good}x`]) {
      const res = await admin(cookie, path, { method, json: method === "GET" ? undefined : {} });
      expect(res.status).toBe(401);
    }
  });

  it("leaves data alone when an unauthenticated write is refused", async () => {
    await admin("", "/api/admin/items/dog", { method: "PATCH", json: { priceCents: 1 } });
    await admin("", "/api/admin/settings", { method: "PUT", json: { orders_open: "0" } });
    expect(
      (await env.DB.prepare("SELECT price_cents FROM items WHERE id = 'dog'").first())?.price_cents,
    ).toBe(500);
    expect(
      (await env.DB.prepare("SELECT value FROM settings WHERE key = 'orders_open'").first())?.value,
    ).toBe("1");
  });
});

describe("admin orders", () => {
  it("lists orders with their lines and serves the receipt privately", async () => {
    const order = await placeOrder([{ itemId: "sword", qty: 2 }]);
    const cookie = await adminCookie();

    const list = await (await admin(cookie, "/api/admin/orders")).json<{ orders: AdminOrder[] }>();
    expect(list.orders).toHaveLength(1);
    expect(list.orders[0]).toMatchObject({
      id: order.id,
      email: "ada@example.com",
      totalCents: 1400,
      status: "submitted",
      receiptUrl: `/api/admin/orders/${order.id}/receipt`,
      emailSent: false,
    });

    const receipt = await admin(cookie, `/api/admin/orders/${order.id}/receipt`);
    expect(receipt.status).toBe(200);
    expect(receipt.headers.get("Content-Type")).toBe("image/png");
    expect(receipt.headers.get("Cache-Control")).toBe("private, no-store");
    expect(receipt.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect((await receipt.arrayBuffer()).byteLength).toBe(64);

    expect((await admin(cookie, "/api/admin/orders/BXB-ZZZZZ/receipt")).status).toBe(404);
  });

  it("returns limited stock on cancel and takes it again on un-cancel", async () => {
    const order = await placeOrder([
      { itemId: "star", qty: 2 },
      { itemId: "dog", qty: 1 },
    ]);
    const cookie = await adminCookie();
    expect(await stockOf("star")).toBe(1);

    let res = await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "cancelled" },
    });
    expect(res.status).toBe(200);
    expect((await res.json<{ order: AdminOrder }>()).order.status).toBe("cancelled");
    expect(await stockOf("star")).toBe(3);
    expect(await stockOf("dog")).toBeNull();

    // Cancelling twice must not return the stock twice.
    await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "cancelled" },
    });
    expect(await stockOf("star")).toBe(3);

    res = await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "verified" },
    });
    expect(res.status).toBe(200);
    expect(await stockOf("star")).toBe(1);

    // Moving between non-cancelled statuses leaves stock alone.
    await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "picked_up" },
    });
    expect(await stockOf("star")).toBe(1);
  });

  it("refuses to un-cancel when the stock has gone to someone else", async () => {
    const order = await placeOrder([{ itemId: "star", qty: 3 }]);
    const cookie = await adminCookie();
    await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "cancelled" },
    });
    await placeOrder([{ itemId: "star", qty: 2 }]);

    const res = await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "submitted" },
    });
    expect(res.status).toBe(409);
    expect(await errorOf(res)).toMatch(/Not enough limited-edition stock/);
    expect(await stockOf("star")).toBe(1);
    const row = await env.DB.prepare("SELECT status FROM orders WHERE id = ?")
      .bind(order.id)
      .first<{ status: string }>();
    expect(row?.status).toBe("cancelled");
  });

  it("saves admin notes and rejects unknown statuses and orders", async () => {
    const order = await placeOrder([{ itemId: "dog", qty: 1 }]);
    const cookie = await adminCookie();

    let res = await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "issue", adminNote: "Receipt shows $4" },
    });
    expect((await res.json<{ order: AdminOrder }>()).order).toMatchObject({
      status: "issue",
      adminNote: "Receipt shows $4",
    });

    res = await admin(cookie, `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      json: { status: "lost" },
    });
    expect(res.status).toBe(400);
    res = await admin(cookie, "/api/admin/orders/BXB-ZZZZZ", {
      method: "PATCH",
      json: { status: "verified" },
    });
    expect(res.status).toBe(404);
  });
});

describe("admin items", () => {
  it("creates an item with a cleaned-up id and defaults", async () => {
    const cookie = await adminCookie();
    const res = await admin(cookie, "/api/admin/items", {
      method: "POST",
      json: {
        id: "  Rainbow Unicorn! ",
        name: "Unicorn",
        category: "limited",
        priceCents: 2000,
        stock: 4,
      },
    });
    expect(res.status).toBe(201);
    const { items } = await res.json<{ items: Item[] }>();
    expect(items.find((i) => i.id === "rainbow-unicorn")).toMatchObject({
      name: "Unicorn",
      category: "limited",
      priceCents: 2000,
      stock: 4,
      active: true,
    });
  });

  it("edits only valid fields and can hide an item from the menu", async () => {
    const cookie = await adminCookie();
    const res = await admin(cookie, "/api/admin/items/dog", {
      method: "PATCH",
      json: { name: "Puppy", priceCents: -5, tint: "red", stock: 2, active: false },
    });
    const dog = (await res.json<{ items: Item[] }>()).items.find((i) => i.id === "dog");
    expect(dog).toMatchObject({ name: "Puppy", priceCents: 500, stock: 2, active: false });

    const menu = await (await self.fetch(`${BASE}/api/menu`)).json<{ items: Item[] }>();
    expect(menu.items.map((i) => i.id)).not.toContain("dog");
  });

  it("stores an uploaded photo in R2 and serves it publicly", async () => {
    const cookie = await adminCookie();
    const form = new FormData();
    form.set("photo", new File([new Uint8Array([9, 9])], "dog.jpg", { type: "image/jpeg" }));
    const res = await admin(cookie, "/api/admin/items/dog/photo", { method: "POST", body: form });
    expect(res.status).toBe(200);
    const dog = (await res.json<{ items: Item[] }>()).items.find((i) => i.id === "dog")!;
    expect(dog.photoUrl).toMatch(/^\/api\/files\/photos\/dog-\d+\.jpg$/);
    expect((await self.fetch(`${BASE}${dog.photoUrl}`)).status).toBe(200);

    const bad = new FormData();
    bad.set("photo", new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }));
    expect(
      (await admin(cookie, "/api/admin/items/dog/photo", { method: "POST", body: bad })).status,
    ).toBe(400);
  });
});

describe("admin settings", () => {
  it("saves known keys, ignores unknown ones and trims long values", async () => {
    const cookie = await adminCookie();
    const res = await admin(cookie, "/api/admin/settings", {
      method: "PUT",
      json: {
        event_date: "Sat, Nov 21",
        orders_open: "0",
        purpose: "x".repeat(600),
        evil: "1",
        event_time: 5,
      },
    });
    const { settings } = await res.json<{ settings: Settings }>();
    expect(settings).toMatchObject({
      event_date: "Sat, Nov 21",
      orders_open: "0",
      event_time: "[TIME]",
    });
    expect(settings.purpose).toHaveLength(500);
    expect(await env.DB.prepare("SELECT 1 FROM settings WHERE key = 'evil'").first()).toBeNull();

    const closed = await submitOrder({ lines: [{ itemId: "dog", qty: 1 }] });
    expect(closed.status).toBe(409);
  });
});
