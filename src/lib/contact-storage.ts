import { EMPTY_CONTACT, parseContact, type ContactDraft } from "./contact-draft";

// The order form's saved contact fields (see contact-draft.ts). Browser only.
const KEY = "bxb-contact-v1";

// localStorage can throw (private mode, storage full or blocked): the form
// then just works without saving.

export function loadContact(): ContactDraft {
  try {
    return parseContact(localStorage.getItem(KEY));
  } catch {
    return EMPTY_CONTACT;
  }
}

export function saveContact(c: ContactDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* not saved */
  }
}

export function clearContact(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing saved */
  }
}
