// Types shared by the Worker API and the React app.

export interface Item {
  id: string;
  name: string;
  priceCents: number;
  /** Units left; 0 = sold out. Every balloon has a count (admin always sets one);
   *  null (unlimited) is only possible on rows predating migration 0004. */
  stock: number | null;
  glyph: string | null;
  tint: string | null;
  /** URL of an uploaded photo, served by the Worker. */
  photoUrl: string | null;
  active: boolean;
  sort: number;
}

export interface Settings {
  school_name: string;
  event_date: string;
  event_time: string;
  event_place: string;
  event_address: string;
  announcement: string;
  donation_url: string;
  /** The Venmo account buyers can pay instead, without the @. Empty hides Venmo. */
  venmo_handle: string;
  contact_email: string;
  orders_open: string;
}

export const SETTING_KEYS: (keyof Settings)[] = [
  "school_name",
  "event_date",
  "event_time",
  "event_place",
  "event_address",
  "announcement",
  "donation_url",
  "venmo_handle",
  "contact_email",
  "orders_open",
];

export interface MenuResponse {
  items: Item[];
  settings: Settings;
}

export interface OrderLineInput {
  itemId: string;
  qty: number;
  note?: string;
}

/** school: a donation on the school's site, proven by an uploaded receipt.
 *  venmo: paid to the venmo_handle account, matched by the buyer's username. */
export type PaymentMethod = "school" | "venmo";

/** How the buyer paid, as the order form sends it. The receipt file travels
 *  next to the JSON in the FormData. */
export type PaymentInput = { method: "school" } | { method: "venmo"; venmoUsername: string };

export interface OrderInput {
  name: string;
  email: string;
  phone: string;
  lines: OrderLineInput[];
  payment: PaymentInput;
}

export type OrderStatus = "submitted" | "issue" | "verified" | "picked_up" | "cancelled";

export interface OrderLine {
  itemId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
  note: string | null;
}

export interface PublicOrder {
  id: string;
  name: string;
  totalCents: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: string;
}

/** What an admin checks to verify an order's payment. */
export type PaymentProof =
  | { method: "school"; receiptUrl: string; receiptType: string }
  | { method: "venmo"; venmoUsername: string };

export interface AdminOrder extends PublicOrder {
  email: string;
  phone: string;
  payment: PaymentProof;
  adminNote: string | null;
  emailSent: boolean;
}

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const RECEIPT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

/** Venmo's payment link: opens a payment to `handle` with the note, and the
 *  amount when known, filled in (https://venmo.com/paymentlinks). With no
 *  amount the buyer types it; either way they can still edit both. */
export function venmoPayUrl(handle: string, cents: number | null, note: string): string {
  const params = new URLSearchParams({ txn: "pay" });
  if (cents !== null) params.set("amount", (cents / 100).toFixed(2));
  params.set("note", note);
  return `https://venmo.com/${encodeURIComponent(handle)}?${params}`;
}

export const VENMO_NOTE = "Balloon x Bros pre-order";

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
