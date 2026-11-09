// Shared fixtures for the API tests: every request goes through the Worker's
// own entry point, as deployed, against local D1 and R2.
import { env, exports } from "cloudflare:workers";

/** The Worker's default export, as deployed. */
export const self = (exports as unknown as { default: Fetcher }).default;

export const BASE = "https://balloonxbros.test";

export const ITEMS = {
  dog: { id: "dog", name: "Balloon Dog", category: "menu", price_cents: 500, stock: null, sort: 10 },
  sword: { id: "sword", name: "Sword", category: "menu", price_cents: 700, stock: null, sort: 20 },
  star: { id: "star", name: "Gold Star", category: "limited", price_cents: 1500, stock: 3, sort: 30 },
  gone: { id: "gone", name: "Sold Out Star", category: "limited", price_cents: 1500, stock: 0, sort: 40 },
  retired: { id: "retired", name: "Retired", category: "menu", price_cents: 500, stock: null, sort: 50, active: 0 },
} as const;

/** Clears orders and files, and installs known items and settings. */
export async function reset(): Promise<void> {
  await env.DB.batch(
    [
      "DROP TRIGGER IF EXISTS steal_stock",
      "DELETE FROM order_items",
      "DELETE FROM orders",
      "DELETE FROM items",
      "UPDATE settings SET value = '1' WHERE key = 'orders_open'",
      "UPDATE settings SET value = 'hello@balloonxbros.com' WHERE key = 'contact_email'",
    ].map((s) => env.DB.prepare(s)),
  );
  await env.DB.batch(
    Object.values(ITEMS).map((i) =>
      env.DB.prepare(
        "INSERT INTO items (id, name, category, price_cents, stock, tint, active, sort) VALUES (?, ?, ?, ?, ?, '#E1EBFF', ?, ?)",
      ).bind(i.id, i.name, i.category, i.price_cents, i.stock, "active" in i ? i.active : 1, i.sort),
    ),
  );
  const listed = await env.FILES.list();
  if (listed.objects.length) await env.FILES.delete(listed.objects.map((o) => o.key));
}

export interface OrderPayload {
  name?: string;
  email?: string;
  phone?: string;
  lines: { itemId: string; qty: number; note?: string }[];
}

export const buyer = { name: "Ada Lovelace", email: "Ada@Example.com", phone: "425-555-0100" };

export function receiptFile(type = "image/png", bytes = 64): File {
  return new File([new Uint8Array(bytes).fill(7)], "receipt.png", { type });
}

/** POST /api/orders the way the order form does: JSON order + receipt file. */
export function submitOrder(order: OrderPayload, receipt: File | null = receiptFile()) {
  const form = new FormData();
  form.set("order", JSON.stringify({ ...buyer, ...order }));
  if (receipt) form.set("receipt", receipt);
  return self.fetch(`${BASE}/api/orders`, { method: "POST", body: form });
}

export async function stockOf(id: string): Promise<number | null> {
  const row = await env.DB.prepare("SELECT stock FROM items WHERE id = ?").bind(id).first<{ stock: number | null }>();
  return row ? row.stock : null;
}

export async function count(table: "orders" | "order_items"): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
  return row?.n ?? 0;
}

export async function fileKeys(prefix?: string): Promise<string[]> {
  return (await env.FILES.list({ prefix })).objects.map((o) => o.key);
}

/** Polls until `check` passes, for work the Worker hands to ctx.waitUntil. */
export async function eventually(check: () => Promise<boolean>, ms = 1000): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return check();
}

/** Logs in and returns a Cookie header value for admin requests. */
export async function adminCookie(): Promise<string> {
  const res = await self.fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "test-password" }),
  });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return (res.headers.get("Set-Cookie") ?? "").split(";")[0]!;
}

export function admin(cookie: string, path: string, init: RequestInit & { json?: unknown } = {}) {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Cookie", cookie);
  if (json !== undefined) headers.set("Content-Type", "application/json");
  return self.fetch(`${BASE}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
}

export const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;
