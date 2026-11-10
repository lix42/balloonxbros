export type TextPart = { text: string; match: boolean };

/**
 * Splits `text` around every occurrence of `phrase`, so the caller can render
 * the matches differently (e.g. as links). An empty phrase matches nothing.
 */
export function splitOnPhrase(text: string, phrase: string): TextPart[] {
  if (!phrase) return [{ text, match: false }];
  const parts: TextPart[] = [];
  text.split(phrase).forEach((chunk, i) => {
    if (i > 0) parts.push({ text: phrase, match: true });
    if (chunk) parts.push({ text: chunk, match: false });
  });
  return parts;
}
