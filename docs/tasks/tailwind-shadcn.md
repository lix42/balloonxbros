---
title: Tailwind + shadcn (Base UI)
status: done
deps: [tanstack-start]
summary: Tailwind v4, shadcn on Base UI, DESIGN.md tokens as theme; restyle pages
done: "2026-11-08 #11"
---
# Tailwind + shadcn (Base UI)

## Goal

Styling moves from the hand-written `src/styles.css` to Tailwind v4 with
shadcn/ui components built on Base UI, while the site still matches the
Claude Design canvas.

## Design

- Tailwind v4 via `@tailwindcss/vite` (inside `lazyPlugins` in
  `vite.config.ts`); CSS entry `src/styles/app.css`, linked from
  `__root.tsx`.
- `shadcn init --base base --template start -p nova` (components.json,
  `cssVariables: true`). The `@/` alias (tsconfig paths +
  `resolve.tsconfigPaths`) and `src/lib/utils.ts` exist for the shadcn CLI;
  the code imports relatively and takes `cn` straight from the `cn` npm
  package (the class merger shadcn's components use). The Geist font the
  init adds is dropped.
- Theme: the DESIGN.md tokens as Tailwind colours, Fredoka/Montserrat, radii
  12–22px, and shadcn's semantic variables (`primary` = red, `border` = line,
  `input` = line-strong, `ring` = blue, …) mapped onto them. Text sizes keep
  the old inherited line-height 1.5. No dark mode.
- shadcn parts restyled to the site: Button (`red`, `ink`, `pill`, `link`,
  `icon`, `tab` variants; 56px/52px sizes), Input (48px/44px), Checkbox
  (admin's two checkboxes). Dialog, Select and Label were tried and removed:
  the receipt opens in a new tab, and the native `<select>`s keep their
  label wiring and mobile pickers.
- Custom pieces (menu tiles, stepper, dropzone, illustrations) stay custom,
  in Tailwind utilities. `src/styles.css` is deleted.
- Verification is a pixel diff against screenshots of the old site at 390px
  (which already matched the canvas): identical everywhere except the admin
  checkboxes.

## How to Verify

- Each screen at 390px side by side with its canvas artboard (Home, How to
  donate, Pre-order form, Order received): same layout, colors, type and
  spacing. Admin is usable on a phone.
- Keyboard and screen-reader pass on the order form and admin (focus rings
  visible, labels attached).
- Lighthouse mobile accessibility ≥ 95 on Home and Order.
- Check and build pass; CSS bundle size sensible.
