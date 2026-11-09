---
title: API as server functions
status: todo
deps: [tanstack-start]
summary: move worker/ routes to Start server functions and server routes
---
# API as server functions

## Goal

The API in `worker/` becomes TanStack Start server functions and server
routes, so pages call typed functions instead of `fetch('/api/…')`, and the
temporary `/api/$` catch-all from `tanstack-start` is gone.

## Design

- Server functions (`createServerFn`) for JSON operations: menu + settings,
  get order, admin login/logout, list orders, set order status, edit item,
  create item, save settings. Validate input with the existing
  `worker/validate.ts` logic (keep it as pure functions).
- Order submission sends `FormData` (cart lines + receipt file) to a server
  function or a server route; keep the receipt checks (`checkReceipt`) and the
  single D1 batch for order + lines + stock, so the stock `CHECK` still aborts
  an oversell.
- Binary responses (admin receipt preview, R2 item photos) stay as **server
  routes**, since they stream files rather than return JSON.
- Admin auth: the HMAC session cookie (`worker/auth.ts`) moves into a
  middleware on admin functions; secrets come from `cloudflare:workers` `env`,
  read per request, never at module scope.
- Email via `ctx.waitUntil` stays non-blocking; find Start's way to reach the
  execution context, or await the send if there isn't one.
- `HttpError` messages must still reach the UI (e.g. "Sorry, only 2 Crown
  left.").
- Move `tests/` with the code; keep the pure-function tests unchanged.

## How to Verify

- No `fetch('/api` left in `src/`; `src/routes/api/$.ts` deleted.
- Tests pass, plus new ones for order submission validation and the admin
  auth middleware (rejects missing/forged cookie).
- Manual pass: order with receipt; oversell of a limited item shows the
  friendly error and leaves stock untouched; confirmation email sent; admin
  login, receipt preview, status changes (cancel restores stock), item and
  settings edits.
- Unauthenticated calls to admin server functions are rejected (try one with
  `curl` without the cookie).
