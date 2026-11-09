import {
  SETTING_KEYS,
  type MenuResponse,
  type OrderStatus,
  type PublicOrder,
} from "../shared/types";
import { clearSessionCookie, isAdmin, makeSessionCookie, safeEqual } from "./auth";
import { getItemsByIds, getOrder, getSettings, listItems, listOrders } from "./db";
import { confirmationEmail, sendEmail } from "./email";
import { checkReceipt, extForType, HttpError, newOrderCode, parseOrderInput } from "./validate";

const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init.headers ?? {}) },
  });

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  throw new HttpError(400, "Invalid JSON body.");
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (!url.pathname.startsWith("/api/")) {
        return new Response("Not found", { status: 404 });
      }
      if (url.pathname.startsWith("/api/admin/")) {
        return await handleAdmin(req, env, url);
      }
      return await handlePublic(req, env, ctx, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, { status: err.status });
      console.error(err);
      return json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

// ---------- public ----------

async function handlePublic(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
): Promise<Response> {
  const { pathname } = url;

  if (pathname === "/api/menu" && req.method === "GET") {
    const [items, settings] = await Promise.all([listItems(env.DB, false), getSettings(env.DB)]);
    return json({ items, settings } satisfies MenuResponse);
  }

  if (pathname === "/api/orders" && req.method === "POST") {
    return createOrder(req, env, ctx);
  }

  // Item photos are public; receipts are not (they live under receipts/).
  const photo = pathname.match(/^\/api\/files\/(photos\/[A-Za-z0-9._-]+)$/);
  if (photo && req.method === "GET") {
    const obj = await env.FILES.get(photo[1]);
    if (!obj) throw new HttpError(404, "Not found.");
    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  throw new HttpError(404, "Not found.");
}

async function createOrder(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const settings = await getSettings(env.DB);
  if (settings.orders_open !== "1") {
    throw new HttpError(409, "Pre-orders are closed. Come see us at the event!");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Invalid form submission.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("order") ?? ""));
  } catch {
    throw new HttpError(400, "Invalid order.");
  }
  const input = parseOrderInput(raw);
  const receipt = checkReceipt(form.get("receipt"));

  const items = await getItemsByIds(
    env.DB,
    input.lines.map((l) => l.itemId),
  );
  const lines = input.lines.map((l) => {
    const item = items.get(l.itemId);
    if (!item || item.active !== 1) {
      throw new HttpError(409, "One of your balloons is no longer available. Please review your order.");
    }
    if (item.stock !== null && item.stock < l.qty) {
      throw new HttpError(
        409,
        item.stock === 0
          ? `Sorry, ${item.name} just sold out.`
          : `Sorry, only ${item.stock} ${item.name} left.`,
      );
    }
    return { ...l, name: item.name, unitPriceCents: item.price_cents, limited: item.stock !== null };
  });
  const totalCents = lines.reduce((sum, l) => sum + l.qty * l.unitPriceCents, 0);

  const id = newOrderCode();
  const receiptKey = `receipts/${id}${extForType(receipt.type)}`;
  await env.FILES.put(receiptKey, receipt.stream(), {
    httpMetadata: { contentType: receipt.type },
    customMetadata: { originalName: receipt.name.slice(0, 200) },
  });

  // One transaction: order + lines + stock. The stock CHECK constraint makes an
  // oversell (two buyers racing for the last one) fail and roll back everything.
  const stmts = [
    env.DB.prepare(
      "INSERT INTO orders (id, name, email, phone, total_cents, receipt_key, receipt_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, input.name, input.email, input.phone, totalCents, receiptKey, receipt.type),
    ...lines.map((l) =>
      env.DB.prepare(
        "INSERT INTO order_items (order_id, item_id, name, unit_price_cents, qty, note) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(id, l.itemId, l.name, l.unitPriceCents, l.qty, l.note ?? null),
    ),
    ...lines
      .filter((l) => l.limited)
      .map((l) =>
        env.DB.prepare("UPDATE items SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL").bind(
          l.qty,
          l.itemId,
        ),
      ),
  ];
  try {
    await env.DB.batch(stmts);
  } catch (err) {
    ctx.waitUntil(env.FILES.delete(receiptKey));
    if (String(err).includes("CHECK constraint")) {
      throw new HttpError(409, "Sorry, a limited-edition balloon in your order just sold out.");
    }
    throw err;
  }

  const order: PublicOrder = {
    id,
    name: input.name,
    totalCents,
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

  ctx.waitUntil(
    (async () => {
      const sent = await sendEmail(
        env,
        input.email,
        settings.contact_email,
        confirmationEmail(order, settings, env.SITE_URL),
      );
      if (sent) await env.DB.prepare("UPDATE orders SET email_sent = 1 WHERE id = ?").bind(id).run();
    })().catch((e) => console.error("email", e)),
  );

  return json({ order, settings }, { status: 201 });
}

// ---------- admin ----------

const STATUSES: OrderStatus[] = ["submitted", "verified", "picked_up", "cancelled"];

async function handleAdmin(req: Request, env: Env, url: URL): Promise<Response> {
  const { pathname } = url;
  const secret = env.SESSION_SECRET;

  if (pathname === "/api/admin/login" && req.method === "POST") {
    if (!env.ADMIN_PASSWORD || !secret) throw new HttpError(503, "Admin is not configured.");
    const body = await readJson(req);
    const ok = await safeEqual(secret, String(body.password ?? ""), env.ADMIN_PASSWORD);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      throw new HttpError(401, "Wrong password.");
    }
    return json({ ok: true }, { headers: { "Set-Cookie": await makeSessionCookie(secret) } });
  }
  if (pathname === "/api/admin/logout" && req.method === "POST") {
    return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
  }

  if (!(await isAdmin(req, secret))) throw new HttpError(401, "Please log in.");

  if (pathname === "/api/admin/me") return json({ ok: true });

  if (pathname === "/api/admin/orders" && req.method === "GET") {
    return json({ orders: await listOrders(env.DB) });
  }

  const receipt = pathname.match(/^\/api\/admin\/orders\/([A-Z0-9-]+)\/receipt$/);
  if (receipt && req.method === "GET") {
    const order = await env.DB.prepare("SELECT receipt_key FROM orders WHERE id = ?")
      .bind(receipt[1])
      .first<{ receipt_key: string }>();
    const obj = order && (await env.FILES.get(order.receipt_key));
    if (!obj) throw new HttpError(404, "Receipt not found.");
    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const orderMatch = pathname.match(/^\/api\/admin\/orders\/([A-Z0-9-]+)$/);
  if (orderMatch && req.method === "PATCH") {
    return updateOrder(env, orderMatch[1], await readJson(req));
  }

  if (pathname === "/api/admin/items" && req.method === "GET") {
    return json({ items: await listItems(env.DB, true) });
  }
  if (pathname === "/api/admin/items" && req.method === "POST") {
    const body = await readJson(req);
    const id = String(body.id ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    if (!id) throw new HttpError(400, "Item id is required.");
    const fields = itemFields(body);
    await env.DB.prepare(
      "INSERT INTO items (id, name, category, price_cents, stock, glyph, tint, active, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        fields.name ?? "New balloon",
        fields.category ?? "menu",
        fields.price_cents ?? 0,
        fields.stock ?? null,
        fields.glyph ?? null,
        fields.tint ?? "#E1EBFF",
        fields.active ?? 1,
        fields.sort ?? 999,
      )
      .run();
    return json({ items: await listItems(env.DB, true) }, { status: 201 });
  }

  const itemMatch = pathname.match(/^\/api\/admin\/items\/([a-z0-9-]+)$/);
  if (itemMatch && req.method === "PATCH") {
    const fields = itemFields(await readJson(req));
    const keys = Object.keys(fields) as (keyof typeof fields)[];
    if (keys.length) {
      await env.DB.prepare(`UPDATE items SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`)
        .bind(...keys.map((k) => fields[k] ?? null), itemMatch[1])
        .run();
    }
    return json({ items: await listItems(env.DB, true) });
  }

  const photoMatch = pathname.match(/^\/api\/admin\/items\/([a-z0-9-]+)\/photo$/);
  if (photoMatch && req.method === "POST") {
    const form = await req.formData();
    const file = form.get("photo");
    if (!(file instanceof File) || !/^image\/(png|jpeg|webp)$/.test(file.type)) {
      throw new HttpError(400, "Upload a PNG, JPG or WebP photo.");
    }
    if (file.size > 5 * 1024 * 1024) throw new HttpError(400, "Photo must be under 5 MB.");
    const key = `photos/${photoMatch[1]}-${Date.now()}${extForType(file.type)}`;
    await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    await env.DB.prepare("UPDATE items SET photo_key = ? WHERE id = ?").bind(key, photoMatch[1]).run();
    return json({ items: await listItems(env.DB, true) });
  }

  if (pathname === "/api/admin/settings" && req.method === "GET") {
    return json({ settings: await getSettings(env.DB) });
  }
  if (pathname === "/api/admin/settings" && req.method === "PUT") {
    const body = await readJson(req);
    const stmts = SETTING_KEYS.filter((k) => typeof body[k] === "string").map((k) =>
      env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      ).bind(k, (body[k] as string).slice(0, 500)),
    );
    if (stmts.length) await env.DB.batch(stmts);
    return json({ settings: await getSettings(env.DB) });
  }

  throw new HttpError(404, "Not found.");
}

function itemFields(body: Record<string, unknown>) {
  const f: Partial<{
    name: string;
    category: "menu" | "limited";
    price_cents: number;
    stock: number | null;
    glyph: string | null;
    tint: string;
    active: number;
    sort: number;
  }> = {};
  if (typeof body.name === "string" && body.name.trim()) f.name = body.name.trim().slice(0, 60);
  if (body.category === "menu" || body.category === "limited") f.category = body.category;
  if (Number.isInteger(body.priceCents) && (body.priceCents as number) >= 0) {
    f.price_cents = body.priceCents as number;
  }
  if (body.stock === null) f.stock = null;
  else if (Number.isInteger(body.stock) && (body.stock as number) >= 0) f.stock = body.stock as number;
  if (typeof body.glyph === "string") f.glyph = body.glyph.slice(0, 30) || null;
  if (typeof body.tint === "string" && /^#[0-9a-fA-F]{6}$/.test(body.tint)) f.tint = body.tint;
  if (typeof body.active === "boolean") f.active = body.active ? 1 : 0;
  if (Number.isInteger(body.sort)) f.sort = body.sort as number;
  return f;
}

async function updateOrder(env: Env, id: string, body: Record<string, unknown>): Promise<Response> {
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
            env.DB.prepare("UPDATE items SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL").bind(
              delta * l.qty,
              l.itemId,
            ),
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
  return json({ order: await getOrder(env.DB, id) });
}

