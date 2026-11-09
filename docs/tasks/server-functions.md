---
title: API as server functions
status: done
deps: [tanstack-start, api-tests]
summary: move worker/ routes to Start server functions and server routes
done: "2026-11-08 #10"
---
# API as server functions

## Goal

The API in `worker/` becomes TanStack Start server functions and server
routes, so pages call typed functions instead of `fetch('/api/…')`, and the
`/api/*` forwarding in `src/server.ts` from `tanstack-start` is gone.

## Design

- **Service layer:** the logic of every route in the old `worker/index.ts` is
  now a plain function in `worker/service.ts` that takes `env` plus its input
  and returns data or throws `HttpError`. `worker/index.ts` is gone, along with
  `src/server.ts` (wrangler `main` is Start's default entry again) and
  `src/menu.ts`.
- **Server functions** (`src/server-fns.ts`): one `createServerFn` wrapper per
  operation (menu; order submit as `FormData` with the order JSON and receipt;
  admin login, logout, me, orders, order update, items, item
  create/update/photo upload, settings and their save). Each returns a
  `Result`, `{ ok: true, data }` or `{ ok: false, status, error }`, so the
  status survives: the order page reloads stock on a 409. `src/api.ts` keeps
  its interface and unwraps a failure into an `ApiError`, so pages are
  unchanged. Unexpected errors are logged and become a generic 500 message.
- **File routes stay at their URLs** as Start server routes:
  `/api/files/photos/…` (public item photos) and
  `/api/admin/orders/$id/receipt` (admin only).
- **Admin auth:** admin service functions take an `AdminAuth`, which only
  `requireAdmin(env, request)` creates after checking the HMAC cookie, so an
  admin operation can't be called without the check (enforced by types, not by
  remembering a middleware). The cookie's path is now `/` because server
  functions are served from `/_serverFn/…`. That logs out existing sessions
  once.
- **Email** stays non-blocking via `waitUntil` from `cloudflare:workers`,
  passed into `createOrder` as a `Background` callback.
- **Tests:** `tests/api/` call the service functions directly. Ten per-route
  "401 without a cookie" tests became one `requireAdmin` test, since the types
  now do that job. The test pool's `main` is a stub (`tests/worker.ts`),
  because Start's entry needs its Vite plugin to build.

## How to Verify

- No `fetch('/api` left in `src/`; wrangler `main` is Start's default entry.
- Tests pass, plus new ones for order submission validation and
  `requireAdmin` (rejects missing/forged cookie).
- Manual pass: order with receipt; oversell of a limited item shows the
  friendly error and leaves stock untouched; confirmation email sent; admin
  login, receipt preview, status changes (cancel restores stock), item and
  settings edits.
- Unauthenticated calls to admin server functions are rejected (try one with
  `curl` without the cookie).
