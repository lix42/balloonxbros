// Types shared by the Worker API and the React app.

export type Category = "menu" | "limited";

export interface Item {
  id: string;
  name: string;
  category: Category;
  priceCents: number;
  /** null = unlimited; a number = units left (limited edition). */
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

export interface OrderInput {
  name: string;
  email: string;
  phone: string;
  lines: OrderLineInput[];
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
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: string;
}

export interface AdminOrder extends PublicOrder {
  email: string;
  phone: string;
  receiptUrl: string;
  receiptType: string;
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

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
