import { parseUsPhone } from "../shared/phone";
import {
  MAX_RECEIPT_BYTES,
  RECEIPT_TYPES,
  type OrderInput,
  type OrderLineInput,
  type PaymentInput,
} from "../shared/types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LINES = 30;
const MAX_QTY = 50;

function str(v: unknown, field: string, max: number, required = true): string {
  if (v === undefined || v === null || v === "") {
    if (required) throw new HttpError(400, `Please fill in your ${field}.`);
    return "";
  }
  if (typeof v !== "string") throw new HttpError(400, `Invalid ${field}.`);
  const s = v.trim();
  if (required && !s) throw new HttpError(400, `Please fill in your ${field}.`);
  if (s.length > max) throw new HttpError(400, `Your ${field} is too long.`);
  return s;
}

/** Validates the JSON part of an order submission. Merges duplicate item lines. */
export function parseOrderInput(raw: unknown): OrderInput {
  if (!raw || typeof raw !== "object") throw new HttpError(400, "Invalid order.");
  const o = raw as Record<string, unknown>;
  const name = str(o.name, "name", 80);
  const email = str(o.email, "email", 254).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please enter a valid email.");
  const phone = parseUsPhone(str(o.phone, "phone number", 30));
  if (!phone) throw new HttpError(400, "Please enter a 10-digit phone number.");

  if (!Array.isArray(o.lines) || o.lines.length === 0) {
    throw new HttpError(400, "Your order is empty.");
  }
  if (o.lines.length > MAX_LINES) throw new HttpError(400, "Too many items.");

  const merged = new Map<string, OrderLineInput>();
  for (const l of o.lines as unknown[]) {
    if (!l || typeof l !== "object") throw new HttpError(400, "Invalid order line.");
    const line = l as Record<string, unknown>;
    if (typeof line.itemId !== "string" || !/^[a-z0-9-]{1,40}$/.test(line.itemId)) {
      throw new HttpError(400, "Invalid item.");
    }
    const qty = line.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 0 || qty > MAX_QTY) {
      throw new HttpError(400, "Invalid quantity.");
    }
    if (qty === 0) continue;
    const note = str(line.note, "note", 200, false);
    const prev = merged.get(line.itemId);
    if (prev) {
      prev.qty += qty;
      if (note) prev.note = prev.note ? `${prev.note}; ${note}` : note;
    } else {
      merged.set(line.itemId, { itemId: line.itemId, qty, note: note || undefined });
    }
  }
  const lines = [...merged.values()];
  if (lines.length === 0) throw new HttpError(400, "Your order is empty.");
  if (lines.some((l) => l.qty > MAX_QTY)) throw new HttpError(400, "Invalid quantity.");
  return { name, email, phone, lines, payment: parsePayment(o.payment) };
}

// Venmo usernames are letters, digits, - and _ (up to 30); people often type the @.
const VENMO_USERNAME_RE = /^[A-Za-z0-9_-]{1,30}$/;

/** The venmo_handle setting as /admin sends it: trimmed, without a leading @.
 *  Empty turns Venmo off. Anything else that isn't a Venmo username is refused,
 *  since every Venmo link on the site is built from it. */
export function parseVenmoHandle(raw: string): string {
  const handle = raw.trim().replace(/^@/, "");
  if (handle && !VENMO_USERNAME_RE.test(handle)) {
    throw new HttpError(400, "The Venmo username can only have letters, numbers, - and _.");
  }
  return handle;
}

/** How the buyer paid. A form loaded before Venmo existed sends no payment:
 *  that is a school donation. */
function parsePayment(raw: unknown): PaymentInput {
  if (raw === undefined) return { method: "school" };
  if (!raw || typeof raw !== "object") throw new HttpError(400, "Invalid payment.");
  const p = raw as Record<string, unknown>;
  if (p.method === "school") return { method: "school" };
  if (p.method !== "venmo") throw new HttpError(400, "Invalid payment.");
  const username = str(p.venmoUsername, "Venmo username", 40).replace(/^@/, "");
  if (!VENMO_USERNAME_RE.test(username)) {
    throw new HttpError(400, "Please enter your Venmo username, like @jane-doe.");
  }
  return { method: "venmo", venmoUsername: username };
}

export function checkReceipt(file: unknown): File {
  if (!(file instanceof File) || file.size === 0) {
    throw new HttpError(400, "Please attach your donation receipt.");
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new HttpError(400, "That receipt file is over 10 MB. Try a screenshot instead.");
  }
  if (!RECEIPT_TYPES.includes(file.type)) {
    throw new HttpError(400, "The receipt must be an image (PNG, JPG, HEIC) or a PDF.");
  }
  return file;
}

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L

export function newOrderCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  let s = "";
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `BXB-${s}`;
}

export function extForType(type: string): string {
  switch (type) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/heic":
      return ".heic";
    case "image/heif":
      return ".heif";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}
