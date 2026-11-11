// The API's logic as plain functions: each takes the Worker env plus its
// input, and returns data or throws HttpError (status + a message safe to
// show). The server functions in src/server-fns.ts and the file routes call
// these; tests call them directly.
import {
  SETTING_KEYS,
  type AdminOrder,
  type Item,
  type MenuResponse,
  type OrderStatus,
  type PublicOrder,
  type Settings,
} from "../shared/types";
import { clearSessionCookies, isAdmin, makeSessionCookie, safeEqual } from "./auth";
import { getItemsByIds, getOrder, getSettings, listItems, listOrders } from "./db";
import { confirmationEmail, sendEmail } from "./email";
import {
  checkReceipt,
  extForType,
  HttpError,
  newOrderCode,
  parseOrderInput,
  parseVenmoHandle,
} from "./validate";

/** Runs work after the response is sent (`waitUntil` from cloudflare:workers). */
export type Background = (work: Promise<unknown>) => void;

// ---------- public ----------

export async function getMenu(env: Env): Promise<MenuResponse> {
  const [items, settings] = await Promise.all([listItems(env.DB, false), getSettings(env.DB)]);
  return { items, settings };
}

/** A public item photo from R2 (`photos/…` keys only; receipts are never public). */
export async function getPhoto(env: Env, key: string): Promise<R2ObjectBody> {
  if (!/^photos\/[A-Za-z0-9._-]+$/.test(key)) throw new HttpError(404, "Not found.");
  const obj = await env.FILES.get(key);
  if (!obj) throw new HttpError(404, "Not found.");
  return obj;
}

/** Validates and stores a pre-order: the order form's FormData (order JSON + receipt). */
export async function createOrder(
  env: Env,
  form: FormData,
  background: Background,
): Promise<{ order: PublicOrder; settings: Settings }> {
  const settings = await getSettings(env.DB);
  if (settings.orders_open !== "1") {
    throw new HttpError(409, "Pre-orders are closed. Come see us at the event!");
  }

  let raw: unknown;
  try {
    const order = form.get("order");
    raw = JSON.parse(typeof order === "string" ? order : "");
  } catch {
    throw new HttpError(400, "Invalid order.");
  }
  const input = parseOrderInput(raw);
  const { payment } = input;
  if (payment.method === "venmo" && !settings.venmo_handle) {
    throw new HttpError(409, "Venmo isn't available. Please donate to the school instead.");
  }
  // Only a school donation has a receipt; a Venmo order ignores any file sent.
  const receipt = payment.method === "school" ? checkReceipt(form.get("receipt")) : null;

  const items = await getItemsByIds(
    env.DB,
    input.lines.map((l) => l.itemId),
  );
  const lines = input.lines.map((l) => {
    const item = items.get(l.itemId);
    if (!item || item.active !== 1) {
      throw new HttpError(
        409,
        "One of your balloons is no longer available. Please review your order.",
      );
    }
    if (item.stock !== null && item.stock < l.qty) {
      throw new HttpError(
        409,
        item.stock === 0
          ? `Sorry, ${item.name} just sold out.`
          : `Sorry, only ${item.stock} ${item.name} left.`,
      );
    }
    return {
      ...l,
      name: item.name,
      unitPriceCents: item.price_cents,
      limited: item.stock !== null,
    };
  });
  const totalCents = lines.reduce((sum, l) => sum + l.qty * l.unitPriceCents, 0);

  const id = newOrderCode();
  const receiptKey = receipt && `receipts/${id}${extForType(receipt.type)}`;
  if (receipt && receiptKey) {
    await env.FILES.put(receiptKey, receipt.stream(), {
      httpMetadata: { contentType: receipt.type },
      customMetadata: { originalName: receipt.name.slice(0, 200) },
    });
  }

  // One transaction: order + lines + stock. The stock CHECK constraint makes an
  // oversell (two buyers racing for the last one) fail and roll back everything.
  const stmts = [
    env.DB.prepare(
      "INSERT INTO orders (id, name, email, phone, total_cents, payment_method, receipt_key, receipt_type, venmo_username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      id,
      input.name,
      input.email,
      input.phone,
      totalCents,
      payment.method,
      receiptKey,
      receipt?.type ?? null,
      payment.method === "venmo" ? payment.venmoUsername : null,
    ),
    ...lines.map((l) =>
      env.DB.prepare(
        "INSERT INTO order_items (order_id, item_id, name, unit_price_cents, qty, note) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(id, l.itemId, l.name, l.unitPriceCents, l.qty, l.note ?? null),
    ),
    ...lines
      .filter((l) => l.limited)
      .map((l) =>
        env.DB.prepare(
          "UPDATE items SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL",
        ).bind(l.qty, l.itemId),
      ),
  ];
  try {
    await env.DB.batch(stmts);
  } catch (err) {
    if (receiptKey) background(env.FILES.delete(receiptKey));
    if (String(err).includes("CHECK constraint")) {
      throw new HttpError(409, "Sorry, a limited-edition balloon in your order just sold out.");
    }
    throw err;
  }

  const order: PublicOrder = {
    id,
    name: input.name,
    totalCents,
    paymentMethod: payment.method,
    status: "submitted",
    lines: lines.map((l) => ({
      itemId: l.itemId,
      name: l.name,
      unitPriceCents: l.unitPriceCents,
      qty: l.qty,
      note: l.note ?? null,
    })),
    createdAt: new Date().toISOString(),
  };

  background(
    (async () => {
      const sent = await sendEmail(
        env,
        input.email,
        settings.contact_email,
        confirmationEmail(order, settings, env.SITE_URL),
      );
      if (sent) {
        await env.DB.prepare("UPDATE orders SET email_sent = 1 WHERE id = ?").bind(id).run();
      }
    })().catch((e) => console.error("email", e)),
  );

  return { order, settings };
}

// ---------- admin ----------

declare const adminBrand: unique symbol;
/** Proof of a valid admin session. Only requireAdmin creates one, so every
 *  admin function below can only be called after the session check. */
export type AdminAuth = { readonly [adminBrand]: true };

export async function requireAdmin(env: Env, request: Request): Promise<AdminAuth> {
  if (!(await isAdmin(request, env.SESSION_SECRET))) throw new HttpError(401, "Please log in.");
  return {} as AdminAuth;
}

/** Checks the password; returns the Set-Cookie values for a new session (and
 *  to expire a pre-Path=/ cookie, so it can't outlive a later logout). */
export async function adminLogin(env: Env, password: unknown): Promise<string[]> {
  const secret = env.SESSION_SECRET;
  if (!env.ADMIN_PASSWORD || !secret) throw new HttpError(503, "Admin is not configured.");
  const ok = await safeEqual(
    secret,
    typeof password === "string" ? password : "",
    env.ADMIN_PASSWORD,
  );
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    throw new HttpError(401, "Wrong password.");
  }
  return [await makeSessionCookie(secret), clearSessionCookies()[1]!];
}

/** The Set-Cookie values that end the session. */
export function adminLogout(): string[] {
  return clearSessionCookies();
}

export function adminOrders(env: Env, _auth: AdminAuth): Promise<AdminOrder[]> {
  return listOrders(env.DB);
}

export async function adminReceipt(
  env: Env,
  _auth: AdminAuth,
  orderId: string,
): Promise<R2ObjectBody> {
  const order = await env.DB.prepare("SELECT receipt_key FROM orders WHERE id = ?")
    .bind(orderId)
    .first<{ receipt_key: string | null }>();
  // A Venmo order has no receipt.
  const obj = order?.receipt_key ? await env.FILES.get(order.receipt_key) : null;
  if (!obj) throw new HttpError(404, "Receipt not found.");
  return obj;
}

const STATUSES: OrderStatus[] = ["submitted", "issue", "verified", "picked_up", "cancelled"];

export async function adminUpdateOrder(
  env: Env,
  _auth: AdminAuth,
  id: string,
  body: Record<string, unknown>,
): Promise<AdminOrder> {
  const order = await getOrder(env.DB, id);
  if (!order) throw new HttpError(404, "Order not found.");
  const stmts: D1PreparedStatement[] = [];

  if (body.status !== undefined) {
    const status = body.status as OrderStatus;
    if (!STATUSES.includes(status)) throw new HttpError(400, "Invalid status.");
    if (status !== order.status) {
      // Cancelling returns limited-edition stock; un-cancelling takes it again.
      const delta = status === "cancelled" ? 1 : order.status === "cancelled" ? -1 : 0;
      if (delta) {
        for (const l of order.lines) {
          stmts.push(
            env.DB.prepare(
              "UPDATE items SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL",
            ).bind(delta * l.qty, l.itemId),
          );
        }
      }
      stmts.push(env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id));
    }
  }
  if (typeof body.adminNote === "string") {
    stmts.push(
      env.DB.prepare("UPDATE orders SET admin_note = ? WHERE id = ?").bind(
        body.adminNote.slice(0, 500) || null,
        id,
      ),
    );
  }
  if (stmts.length) {
    try {
      await env.DB.batch(stmts);
    } catch (err) {
      if (String(err).includes("CHECK constraint")) {
        throw new HttpError(409, "Not enough limited-edition stock left to restore this order.");
      }
      throw err;
    }
  }
  const updated = await getOrder(env.DB, id);
  if (!updated) throw new HttpError(404, "Order not found.");
  return updated;
}

export function adminItems(env: Env, _auth: AdminAuth): Promise<Item[]> {
  return listItems(env.DB, true);
}

export async function adminCreateItem(
  env: Env,
  auth: AdminAuth,
  body: Record<string, unknown>,
): Promise<Item[]> {
  const id = (typeof body.id === "string" ? body.id : "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  if (!id) throw new HttpError(400, "Item id is required.");
  const fields = itemFields(body);
  await env.DB.prepare(
    // category is a legacy column (menu/limited); there is one menu now.
    "INSERT INTO items (id, name, category, price_cents, stock, glyph, tint, active, sort) VALUES (?, ?, 'menu', ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      id,
      fields.name ?? "New balloon",
      fields.price_cents ?? 0,
      fields.stock ?? 0, // every balloon has a count; 0 shows sold out until set
      fields.glyph ?? null,
      fields.tint ?? "#E1EBFF",
      fields.active ?? 1,
      fields.sort ?? 999,
    )
    .run();
  return adminItems(env, auth);
}

export async function adminUpdateItem(
  env: Env,
  auth: AdminAuth,
  id: string,
  body: Record<string, unknown>,
): Promise<Item[]> {
  if (!/^[a-z0-9-]+$/.test(id)) throw new HttpError(404, "Not found.");
  const fields = itemFields(body);
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length) {
    await env.DB.prepare(`UPDATE items SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`)
      .bind(...keys.map((k) => fields[k] ?? null), id)
      .run();
  }
  return adminItems(env, auth);
}

export async function adminUploadPhoto(
  env: Env,
  auth: AdminAuth,
  id: string,
  file: unknown,
): Promise<Item[]> {
  if (!/^[a-z0-9-]+$/.test(id)) throw new HttpError(404, "Not found.");
  if (!(file instanceof File) || !/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new HttpError(400, "Upload a PNG, JPG or WebP photo.");
  }
  if (file.size > 5 * 1024 * 1024) throw new HttpError(400, "Photo must be under 5 MB.");
  const key = `photos/${id}-${Date.now()}${extForType(file.type)}`;
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await env.DB.prepare("UPDATE items SET photo_key = ? WHERE id = ?").bind(key, id).run();
  return adminItems(env, auth);
}

export function adminSettings(env: Env, _auth: AdminAuth): Promise<Settings> {
  return getSettings(env.DB);
}

export async function adminSaveSettings(
  env: Env,
  _auth: AdminAuth,
  body: Record<string, unknown>,
): Promise<Settings> {
  const stmts = SETTING_KEYS.filter((k) => typeof body[k] === "string").map((k) => {
    const raw = (body[k] as string).slice(0, 500);
    return env.DB.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).bind(k, k === "venmo_handle" ? parseVenmoHandle(raw) : raw);
  });
  if (stmts.length) await env.DB.batch(stmts);
  return getSettings(env.DB);
}

function itemFields(body: Record<string, unknown>) {
  const f: Partial<{
    name: string;
    price_cents: number;
    stock: number;
    glyph: string | null;
    tint: string;
    active: number;
    sort: number;
  }> = {};
  if (typeof body.name === "string" && body.name.trim()) f.name = body.name.trim().slice(0, 60);
  if (Number.isInteger(body.priceCents) && (body.priceCents as number) >= 0) {
    f.price_cents = body.priceCents as number;
  }
  if (Number.isInteger(body.stock) && (body.stock as number) >= 0) {
    f.stock = body.stock as number;
  }
  if (typeof body.glyph === "string") f.glyph = body.glyph.slice(0, 30) || null;
  if (typeof body.tint === "string" && /^#[0-9a-fA-F]{6}$/.test(body.tint)) f.tint = body.tint;
  if (typeof body.active === "boolean") f.active = body.active ? 1 : 0;
  if (Number.isInteger(body.sort)) f.sort = body.sort as number;
  return f;
}
