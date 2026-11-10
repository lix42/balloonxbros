---
title: Production launch check
status: todo
deps: [event-details, menu-content, balloon-photos, contact-inbox, resend-email, pnpm, tanstack-start, server-functions, tailwind-shadcn, vite-plus, donation-steps]
summary: end-to-end test order on prod, clean up, reopen pre-orders
---
# Production launch check

## Goal

Prove the whole pre-order flow works on https://balloonxbros.com with real
content, leave no test data behind, then open pre-orders.

## Design

A manual checklist on production, on a phone:

1. Home: event tiles, announcement, menu and limited items,
   photos and footer email are all real, with no `[BRACKETS]` anywhere, and
   `docs/PLACEHOLDERS.md` lists nothing left.
2. `/donate`: step 1 opens the real school donation page.
3. With `orders_open` temporarily on, place a test order that includes one
   limited item. Upload an image as the receipt.
4. Order-received page shows correct details; confirmation email arrives;
   replying to it reaches Li via hello@.
5. `/admin`: the order is listed, receipt preview opens, status moves through
   verified.
6. Clean up: set the test order to **cancelled** (this returns the limited
   stock; confirm the "N left" count is back), and delete its receipt from R2
   (`receipts/`) if it's a real personal file.
7. Leave `orders_open` **on**: pre-orders are open.

## How to Verify

Every checklist step passes and is noted in the progress log with the date.
Limited stock counts equal their launch values. Pre-orders are open.
