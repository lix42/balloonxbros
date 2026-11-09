---
title: Real menu, prices and stock
status: todo
deps: []
summary: migration with real items, prices, limited stock; hide unused seed items
---
# Real menu, prices and stock

## Goal

The menu and limited-edition sections list the balloons the kids will
actually make, at real prices, with real limited stock counts.

## Design

A new migration (`migrations/000N_menu.sql`, next free number):
- `UPDATE items` for seed items that stay (name, `price_cents`, `stock`,
  `tint`, `sort`), keeping their ids where they fit. Ids are permanent once
  orders reference them.
- `INSERT` for new items (id kebab-case, `category` `menu` or `limited`,
  `stock` NULL for unlimited, a tile tint from the DESIGN.md palette).
- `UPDATE items SET active = 0` for seed items not on the real menu. Hide,
  don't delete.

Prices are integer cents. Limited items need a stock number; `0` shows as sold
out. Names, prices and counts come from Li. The final item ids are what
`balloon-photos` names its files after, so settle them here.

Remove the filled rows from `docs/PLACEHOLDERS.md`.

## How to Verify

- Locally: the menu grid and limited section show exactly the real items in
  the intended order; a limited item shows "N left"; a stock-0 item is greyed
  out and can't be added.
- Add items to the cart and submit an order locally: line prices and the total
  match; limited stock drops by the ordered quantity.
- `npm run check` passes.
