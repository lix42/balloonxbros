/**
 * The order form's contact fields, saved on this device so closing the tab
 * (say, while paying on the school's site) doesn't lose them. Cleared once an
 * order goes through, so a shared phone doesn't keep someone else's details.
 * The receipt file is not saved: browsers can't keep a chosen file. Pure, so
 * tests can import it; the localStorage side is in contact-storage.ts.
 */

export interface ContactDraft {
  name: string;
  email: string;
  phone: string;
}

/** The order form's input limits; saved values are cut to them too. */
export const CONTACT_LIMITS: Record<keyof ContactDraft, number> = {
  name: 80,
  email: 254,
  phone: 30,
};

export const EMPTY_CONTACT: ContactDraft = { name: "", email: "", phone: "" };

/** Reads a saved draft, keeping only string fields within their limits. */
export function parseContact(raw: string | null): ContactDraft {
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    return EMPTY_CONTACT;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return EMPTY_CONTACT;
  const field = (k: keyof ContactDraft) => {
    const v = (data as Record<string, unknown>)[k];
    return typeof v === "string" ? v.slice(0, CONTACT_LIMITS[k]) : "";
  };
  return { name: field("name"), email: field("email"), phone: field("phone") };
}
