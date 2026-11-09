---
title: API route tests in the Workers runtime
status: doing
deps: []
summary: route-level tests on local D1/R2 via @cloudflare/vitest-plugin; safety net for server-functions
---
# API route tests in the Workers runtime

## Goal

Lock down the API's behaviour with tests that run the real Worker against a
local D1 and R2, so the `server-functions` rewrite has a safety net. Today
only pure helpers (`auth`, `validate`) are tested.

## Design

- `@cloudflare/vitest-plugin` (`cloudflareTest()`; supports Vitest 5, unlike
  the older `@cloudflare/vitest-pool-workers`, which needs Vitest 4). Same
  pattern as Li's `nc` telemetry-ingest service: `readD1Migrations` into a
  `TEST_MIGRATIONS` binding, a setup file that runs `applyD1Migrations`, and
  requests through the Worker's own entry point (`exports.default` from
  `cloudflare:workers`).
- Test secrets (`ADMIN_PASSWORD`, `SESSION_SECRET`) come from miniflare
  bindings; `RESEND_API_KEY` stays unset so no mail is sent.
- Each test resets orders and installs its own fixture items and settings, so
  the tests don't depend on seed content that the content migrations will
  change.
- Scenarios, written against behaviour (status + body + DB state) so
  `server-functions` can port them:
  - menu: active items only, settings included;
  - order: happy path (201, totals, stock decremented, receipt in R2);
    closed pre-orders; inactive item; not enough stock; sold-out race
    aborts the whole batch (no order row, stock unchanged, receipt
    deleted); missing or wrong-type receipt;
  - admin: login right/wrong password, routes reject missing or forged
    cookie; cancel returns limited stock, un-cancel takes it again and
    fails cleanly when stock is gone; receipt download; item create/edit;
    settings save ignores unknown keys;
  - files: public photos served, receipts never served via `/api/files`.
- Existing pure tests run in the same pool.

## How to Verify

`npm test` runs all suites in the Workers runtime and passes; `npm run check`
passes; CI green. Breaking the stock `CHECK` path (e.g. removing the stock
`UPDATE` from the batch) makes a test fail.
