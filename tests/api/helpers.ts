// Shared fixtures for the API tests: they call worker/service.ts directly
// (the same functions the server functions and file routes call) against
// local D1 and R2.
import { env } from "cloudflare:workers";
import { adminLogin, requireAdmin, type AdminAuth, type Background } from "../../worker/service";
import { HttpError } from "../../worker/validate";

// dog/sword/retired have NULL stock (unlimited), as rows from before migration
// 0004 could; the order and cancel paths still have to handle them.
export const ITEMS = {
  dog: {
    id: "dog",
    name: "Balloon Dog",
    price_cents: 500,
    stock: null,
    sort: 10,
  },
  sword: { id: "sword", name: "Sword", price_cents: 700, stock: null, sort: 20 },
  star: {
    id: "star",
    name: "Gold Star",
    price_cents: 1500,
    stock: 3,
    sort: 30,
  },
  gone: {
    id: "gone",
    name: "Sold Out Star",
    price_cents: 1500,
    stock: 0,
    sort: 40,
  },
  retired: {
    id: "retired",
    name: "Retired",
    price_cents: 500,
    stock: null,
    sort: 50,
    active: 0,
  },
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
      "UPDATE settings SET value = 'huhuwen' WHERE key = 'venmo_handle'",
    ].map((s) => env.DB.prepare(s)),
  );
  await env.DB.batch(
    Object.values(ITEMS).map((i) =>
      env.DB.prepare(
        "INSERT INTO items (id, name, category, price_cents, stock, tint, active, sort) VALUES (?, ?, 'menu', ?, ?, '#E1EBFF', ?, ?)",
      ).bind(i.id, i.name, i.price_cents, i.stock, "active" in i ? i.active : 1, i.sort),
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
  /** Left out, as a form loaded before Venmo existed sends it: a school donation. */
  payment?: unknown;
}

export const buyer = { name: "Ada Lovelace", email: "Ada@Example.com", phone: "425-555-0100" };

export function receiptFile(type = "image/png", bytes = 64): File {
  return new File([new Uint8Array(bytes).fill(7)], "receipt.png", { type });
}

/** The order form's FormData: JSON order + receipt file. */
export function orderForm(order: OrderPayload, receipt: File | null = receiptFile()): FormData {
  const form = new FormData();
  form.set("order", JSON.stringify({ ...buyer, ...order }));
  if (receipt) form.set("receipt", receipt);
  return form;
}

/** Collects the work a service hands to waitUntil, so a test can await it. */
export function background(): Background & { settled: () => Promise<unknown> } {
  const pending: Promise<unknown>[] = [];
  return Object.assign((work: Promise<unknown>) => void pending.push(work), {
    settled: () => Promise.allSettled(pending),
  });
}

/** Runs a service call and returns its HttpError (status + message), failing if it succeeds. */
export async function rejection(
  work: Promise<unknown>,
): Promise<{ status: number; message: string }> {
  try {
    await work;
  } catch (err) {
    if (err instanceof HttpError) return { status: err.status, message: err.message };
    throw err;
  }
  throw new Error("expected an HttpError");
}

export async function stockOf(id: string): Promise<number | null> {
  const row = await env.DB.prepare("SELECT stock FROM items WHERE id = ?")
    .bind(id)
    .first<{ stock: number | null }>();
  return row ? row.stock : null;
}

export async function count(table: "orders" | "order_items"): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
  return row?.n ?? 0;
}

export async function fileKeys(prefix?: string): Promise<string[]> {
  return (await env.FILES.list({ prefix })).objects.map((o) => o.key);
}

export function adminRequest(cookie: string): Request {
  return new Request("https://balloonxbros.test/api/admin/orders", { headers: { Cookie: cookie } });
}

/** Logs in with the test password and returns the Cookie header value. */
export async function adminCookie(): Promise<string> {
  return (await adminLogin(env, "test-password"))[0]!.split(";")[0]!;
}

/** A valid admin session, as the server functions get it from the request. */
export async function adminAuth(): Promise<AdminAuth> {
  return requireAdmin(env, adminRequest(await adminCookie()));
}
