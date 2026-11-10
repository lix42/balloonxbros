import type { Settings } from "./types";

/** Google Maps search link for a query (opens the app on phones). */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Maps link for the pickup place. Searches the street address when there is
 * one: it pins the spot more precisely than the venue name.
 */
export function eventMapUrl(s: Pick<Settings, "event_place" | "event_address">): string {
  return mapsSearchUrl(s.event_address || s.event_place);
}

/**
 * Map preview of the pickup place: a cropped Google Maps screenshot in
 * `public/`, shown on the order-received page and in the confirmation email
 * (as an absolute URL), always with `EVENT_MAP.credit` beside it. Replace the
 * file if the venue changes.
 */
export const EVENT_MAP = {
  path: "/event-map.jpg",
  width: 952,
  height: 476,
  credit: "Map data ©2026 Google",
} as const;
