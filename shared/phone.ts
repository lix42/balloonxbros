/**
 * The digits of a US phone number. A leading 1 is the country code (no US
 * area code starts with 1), so "+1 (425) 555-0100" from autofill gives
 * "4255550100".
 */
export function usPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^1/, "");
}

/** Formats up to ten digits: "(425", "(425) 555", "(425) 555-0100". */
function formatDigits(d: string): string {
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * Formats as much of a US number as has been typed: "(425", "(425) 555",
 * "(425) 555-0100". A separator only appears once a digit follows it, so
 * backspace never gets stuck on one. More than ten digits (a typo or a
 * non-US number) come back bare rather than cut down to a wrong number, so
 * the form's pattern rejects them.
 */
export function formatUsPhone(raw: string): string {
  const d = usPhoneDigits(raw);
  return d.length > 10 ? d : formatDigits(d);
}

/** "(425) 555-0100" for a complete 10-digit US number, else null. */
export function parseUsPhone(raw: string): string | null {
  const d = usPhoneDigits(raw);
  return d.length === 10 ? formatDigits(d) : null;
}
