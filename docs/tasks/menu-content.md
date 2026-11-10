---
title: Real menu, prices and stock
status: done
deps: []
summary: migration with the 14 real balloons (photos, counts); one menu, every item counted
done: 2026-11-09
---
# Real menu, prices and stock

## Change (2026-11-09, Li)

No separate limited-edition section: every balloon has a stock count, shown
as "N left". Li supplied 14 photos, so this task also does `balloon-photos`.
Names come from the photo files; price ($10) and stock (3) are placeholders Li
sets in `/admin` after deploy. Landed as `migrations/0004_menu.sql`: inserts
the 14 items with `photo_key`, deletes the old seed items no order references
and hides the rest. Home shows one grid; admin drops the Section field and
"unlimited" stock (a new item starts at 0 = sold out). `items.category` stays
in the schema (dropping it needs a table rebuild) but nothing reads it.

## Goal

The menu lists the balloons the kids will actually make, each with a photo
and a stock count, at real prices.

## Design

A new migration (`migrations/0004_menu.sql`):
- `INSERT` the real items (id kebab-case from the photo file name, `category`
  `'menu'` since the column is NOT NULL but unused, a stock number, a tile
  tint from the DESIGN.md palette, `photo_key = '/balloons/<id>.jpg'`).
- Delete the placeholder seed items no order references; hide (`active = 0`)
  the ones an order does. Ids are permanent once orders reference them.

Prices are integer cents. Every item has a stock number; `0` shows as sold
out. Names come from the photos; prices and counts are placeholders Li sets
in `/admin` after deploy.

Update the menu rows in `docs/PLACEHOLDERS.md`.

## How to Verify

- Locally: the menu grid shows exactly the 14 real items in the intended
  order, each with its photo and "N left"; a stock-0 item is greyed out and
  can't be added; tapping a photo opens the bigger view.
- Add items to the cart and submit an order locally: line prices and the total
  match; stock drops by the ordered quantity.
- `pnpm run check` passes.
