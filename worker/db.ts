import {
  SETTING_KEYS,
  type AdminOrder,
  type Item,
  type OrderLine,
  type OrderStatus,
  type PaymentMethod,
  type PaymentProof,
  type Settings,
} from "../shared/types";

interface ItemRow {
  id: string;
  name: string;
  price_cents: number;
  stock: number | null;
  glyph: string | null;
  tint: string | null;
  photo_key: string | null;
  active: number;
  sort: number;
}

interface OrderRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_cents: number;
  payment_method: PaymentMethod;
  receipt_key: string | null;
  receipt_type: string | null;
  venmo_username: string | null;
  status: OrderStatus;
  admin_note: string | null;
  email_sent: number;
  created_at: string;
}

interface LineRow {
  order_id: string;
  item_id: string;
  name: string;
  unit_price_cents: number;
  qty: number;
  note: string | null;
}

export function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    name: r.name,
    priceCents: r.price_cents,
    stock: r.stock,
    glyph: r.glyph,
    tint: r.tint,
    // A key starting with "/" is a static image committed under public/.
    photoUrl: r.photo_key
      ? r.photo_key.startsWith("/")
        ? r.photo_key
        : `/api/files/${r.photo_key}`
      : null,
    active: r.active === 1,
    sort: r.sort,
  };
}

export async function listItems(db: D1Database, includeInactive: boolean): Promise<Item[]> {
  const sql = includeInactive
    ? "SELECT * FROM items ORDER BY sort, name"
    : "SELECT * FROM items WHERE active = 1 ORDER BY sort, name";
  const { results } = await db.prepare(sql).all<ItemRow>();
  return results.map(toItem);
}

export async function getItemsByIds(db: D1Database, ids: string[]): Promise<Map<string, ItemRow>> {
  const placeholders = ids.map(() => "?").join(",");
  const { results } = await db
    .prepare(`SELECT * FROM items WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<ItemRow>();
  return new Map(results.map((r) => [r.id, r]));
}

export async function getSettings(db: D1Database): Promise<Settings> {
  const { results } = await db.prepare("SELECT key, value FROM settings").all<{
    key: string;
    value: string;
  }>();
  const s = Object.fromEntries(SETTING_KEYS.map((k) => [k, ""])) as unknown as Settings;
  for (const r of results) {
    if ((SETTING_KEYS as string[]).includes(r.key)) s[r.key as keyof Settings] = r.value;
  }
  return s;
}

function toLine(r: LineRow): OrderLine {
  return {
    itemId: r.item_id,
    name: r.name,
    unitPriceCents: r.unit_price_cents,
    qty: r.qty,
    note: r.note,
  };
}

/** The orders CHECK constraint guarantees each method's columns are set. */
function toPayment(r: OrderRow): PaymentProof {
  return r.payment_method === "venmo"
    ? { method: "venmo", venmoUsername: r.venmo_username ?? "" }
    : {
        method: "school",
        receiptUrl: `/api/admin/orders/${r.id}/receipt`,
        receiptType: r.receipt_type ?? "",
      };
}

function toAdminOrder(r: OrderRow, lines: OrderLine[]): AdminOrder {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    totalCents: r.total_cents,
    paymentMethod: r.payment_method,
    status: r.status,
    lines,
    createdAt: r.created_at,
    payment: toPayment(r),
    adminNote: r.admin_note,
    emailSent: r.email_sent === 1,
  };
}

export async function listOrders(db: D1Database): Promise<AdminOrder[]> {
  const [orders, lines] = await db.batch([
    db.prepare("SELECT * FROM orders ORDER BY created_at DESC"),
    db.prepare("SELECT * FROM order_items"),
  ]);
  const byOrder = new Map<string, OrderLine[]>();
  for (const l of lines.results as LineRow[]) {
    const arr = byOrder.get(l.order_id) ?? [];
    arr.push(toLine(l));
    byOrder.set(l.order_id, arr);
  }
  return (orders.results as OrderRow[]).map((o) => toAdminOrder(o, byOrder.get(o.id) ?? []));
}

export async function getOrder(db: D1Database, id: string): Promise<AdminOrder | null> {
  const [orders, lines] = await db.batch([
    db.prepare("SELECT * FROM orders WHERE id = ?").bind(id),
    db.prepare("SELECT * FROM order_items WHERE order_id = ?").bind(id),
  ]);
  const row = (orders.results as OrderRow[])[0];
  if (!row) return null;
  return toAdminOrder(row, (lines.results as LineRow[]).map(toLine));
}
