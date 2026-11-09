---
title: Tailwind + shadcn (Base UI)
status: todo
deps: [tanstack-start]
summary: Tailwind v4, shadcn on Base UI, DESIGN.md tokens as theme; restyle pages
---
# Tailwind + shadcn (Base UI)

## Goal

Styling moves from the hand-written `src/styles.css` to Tailwind v4 with
shadcn/ui components built on Base UI, while the site still matches the
Claude Design canvas.

## Design

- Tailwind v4 via its Vite plugin; CSS entry imported from `__root.tsx`.
- `shadcn init --base base-ui` (check current CLI flags in the docs), with
  `cssVariables: true`, since that can't be changed later.
- Map the DESIGN.md tokens onto the theme: `background` = ground `#F4F7FF`,
  `card` = surface, `border` = line, `foreground` = ink, `muted-foreground`
  = muted, `primary` = red, plus blue/yellow/tile tints as extra tokens; radii
  (cards 18–22px, inputs 12px, pills full); Fredoka/Nunito as the heading/body
  fonts.
- Use shadcn components where they fit: Button, Input, Textarea, Label, Card,
  Badge, Checkbox, Select (admin status), Dialog (admin receipt preview).
  Bespoke pieces (menu tiles, stepper, receipt dropzone, Glyph illustrations)
  stay custom components styled with Tailwind.
- Keep touch targets ≥ 44px and primary buttons 52–56px tall. Inline SVG icons,
  no emoji (shadcn's lucide icons are fine).
- Delete `src/styles.css` when nothing uses it.

## How to Verify

- Each screen at 390px side by side with its canvas artboard (Home, How to
  donate, Pre-order form, Order received): same layout, colors, type and
  spacing. Admin is usable on a phone.
- Keyboard and screen-reader pass on the order form and admin (focus rings
  visible, labels attached, Dialog traps focus).
- Lighthouse mobile accessibility ≥ 95 on Home and Order.
- Check and build pass; CSS bundle size sensible.
