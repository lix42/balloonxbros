/** /donate's search params. `total` is the order total in cents, set by the
 *  order page's link; without it the page doesn't know the amount. */
export type DonateSearch = { total?: number };

const MAX_TOTAL_CENTS = 1_000_000;

/** Keeps `total` only when it is a whole, positive number of cents. A
 *  hand-edited or stale link falls back to the page without an amount. */
export function parseDonateSearch(search: Record<string, unknown>): DonateSearch {
  const raw = search.total;
  const total = typeof raw === "number" || typeof raw === "string" ? Number(raw) : NaN;
  return Number.isInteger(total) && total > 0 && total <= MAX_TOTAL_CENTS ? { total } : {};
}
