// Built-in balloon illustrations, used until a real photo is uploaded.
import type { ReactElement } from "react";
import type { Item } from "../../shared/types";

const star = (fill: string) => (
  <>
    <path d="M40 8 L48 28 L70 30 L53 44 L58 66 L40 54 L22 66 L27 44 L10 30 L32 28 Z" fill={fill} />
    <path d="M40 54 Q42 64 40 76" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
  </>
);

const GLYPHS: Record<string, ReactElement> = {
  dog: (
    <>
      <rect x="22" y="34" width="34" height="13" rx="6.5" fill="#D93A31" />
      <rect x="20" y="44" width="8" height="18" rx="4" fill="#D93A31" />
      <rect x="48" y="44" width="8" height="18" rx="4" fill="#D93A31" />
      <rect x="52" y="22" width="9" height="20" rx="4.5" fill="#D93A31" />
      <ellipse cx="62" cy="20" rx="9" ry="6" fill="#D93A31" />
      <ellipse cx="55" cy="13" rx="4" ry="8" fill="#B52E26" />
      <rect
        x="12"
        y="28"
        width="12"
        height="7"
        rx="3.5"
        fill="#D93A31"
        transform="rotate(-30 18 31)"
      />
    </>
  ),
  sword: (
    <>
      <rect x="36" y="6" width="9" height="46" rx="4.5" fill="#2E6BE6" />
      <rect x="22" y="50" width="37" height="9" rx="4.5" fill="#2E6BE6" />
      <rect x="36" y="57" width="9" height="16" rx="4.5" fill="#1F4FB8" />
    </>
  ),
  flower: (
    <>
      <rect x="37" y="34" width="6" height="40" rx="3" fill="#2E9E6B" />
      <ellipse cx="50" cy="56" rx="9" ry="4" fill="#2E9E6B" transform="rotate(-25 50 56)" />
      <ellipse cx="40" cy="12" rx="7" ry="9" fill="#F2A900" />
      <ellipse cx="40" cy="36" rx="7" ry="9" fill="#F2A900" />
      <ellipse cx="28" cy="24" rx="9" ry="7" fill="#F2A900" />
      <ellipse cx="52" cy="24" rx="9" ry="7" fill="#F2A900" />
      <circle cx="40" cy="24" r="6" fill="#D93A31" />
    </>
  ),
  heart: (
    <>
      <path
        d="M40 52 C22 40 18 28 26 20 C32 14 38 17 40 23 C42 17 48 14 54 20 C62 28 58 40 40 52 Z"
        fill="#E0457B"
      />
      <rect x="37" y="50" width="6" height="26" rx="3" fill="#B8325F" />
    </>
  ),
  crown: (
    <>
      <rect x="14" y="50" width="52" height="10" rx="5" fill="#7A4FD6" />
      <rect
        x="12"
        y="26"
        width="9"
        height="28"
        rx="4.5"
        fill="#7A4FD6"
        transform="rotate(-12 16 40)"
      />
      <rect x="35.5" y="18" width="9" height="34" rx="4.5" fill="#7A4FD6" />
      <rect
        x="59"
        y="26"
        width="9"
        height="28"
        rx="4.5"
        fill="#7A4FD6"
        transform="rotate(12 64 40)"
      />
      <circle cx="40" cy="15" r="5" fill="#F2A900" />
      <circle cx="15" cy="24" r="4.5" fill="#F2A900" />
      <circle cx="65" cy="24" r="4.5" fill="#F2A900" />
    </>
  ),
  butterfly: (
    <>
      <ellipse cx="25" cy="28" rx="15" ry="12" fill="#F07C1B" transform="rotate(-20 25 28)" />
      <ellipse cx="55" cy="28" rx="15" ry="12" fill="#F07C1B" transform="rotate(20 55 28)" />
      <ellipse cx="28" cy="52" rx="11" ry="9" fill="#C8600F" transform="rotate(20 28 52)" />
      <ellipse cx="52" cy="52" rx="11" ry="9" fill="#C8600F" transform="rotate(-20 52 52)" />
      <rect x="36" y="18" width="8" height="46" rx="4" fill="#1B1F3B" />
    </>
  ),
  bouquet: (
    <>
      <path
        d="M26 34 Q34 54 40 74 M54 32 Q46 54 40 74 M40 30 L40 74"
        stroke="#1B1F3B"
        strokeWidth="1.6"
        fill="none"
      />
      <ellipse cx="26" cy="22" rx="11" ry="13" fill="#D93A31" />
      <ellipse cx="54" cy="20" rx="11" ry="13" fill="#2E6BE6" />
      <ellipse cx="40" cy="16" rx="11" ry="13" fill="#F2A900" />
    </>
  ),
  "star-gold": star("#FFD166"),
  "star-pink": star("#FF8FB1"),
  "star-blue": star("#8FD3FF"),
};

export const GLYPH_KEYS = Object.keys(GLYPHS);

/** Photo if uploaded, else the built-in illustration, else a plain balloon. */
export function ItemArt({ item }: { item: Item }) {
  if (item.photoUrl) return <img src={item.photoUrl} alt={item.name} loading="lazy" />;
  const g = (item.glyph && GLYPHS[item.glyph]) ?? (
    <>
      <ellipse cx="40" cy="30" rx="18" ry="22" fill="#2E6BE6" />
      <path d="M40 52 Q44 64 40 76" stroke="#1B1F3B" strokeWidth="1.6" fill="none" />
    </>
  );
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {g}
    </svg>
  );
}
