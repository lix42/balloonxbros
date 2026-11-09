# Balloon x Bros launch — Progress Log

How each task is actually being carried out. One `##` section per task; append entries, don't rewrite them.

## event-details

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: migration with date, time, place, cutoff, purpose, donation URL

## menu-content

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: migration with real items, prices, limited stock; hide unused seed items

## contact-inbox

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: Cloudflare Email Routing forwards hello@balloonxbros.com to Li

## resend-email

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: verify domain in Resend, set RESEND_API_KEY, confirm delivery

## balloon-photos

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: square photos in public/balloons/, photo_key set by migration

## launch-check

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: end-to-end test order on prod, clean up, reopen pre-orders

## pnpm

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: pnpm lockfile, packageManager, CI, docs

## tanstack-start

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: file routes + SSR on Workers; /api/* still served by the existing handler

## server-functions

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: move worker/ routes to Start server functions and server routes

## tailwind-shadcn

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: Tailwind v4, shadcn on Base UI, DESIGN.md tokens as theme; restyle pages

## vite-plus

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: vp migrate; scripts and CI on vp check/test/build

## api-tests

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: route-level tests on local D1/R2 via @cloudflare/vitest-plugin; safety net for server-functions
- 2026-11-08: Added @cloudflare/vitest-plugin 1.6.0 (the older vitest-pool-workers peers on Vitest 4 only); config copied from the nc telemetry-ingest pattern. All tests, including the old pure ones, now run in workerd. tests/api/ has 31 route tests (public + admin) going through exports.default with fixture items installed per test, so they don't depend on seed content. The mid-checkout sold-out race is simulated with a BEFORE INSERT trigger on orders that zeroes stock inside the batch. Checked that the tests can fail: removing the stock decrement, the admin session check, or the CHECK-constraint handling each fails tests. Added tsconfig.tests.json (cloudflare:test types) so tsc -b covers tests. Note for server-functions: the scenarios assert status + body + DB state; port them to call the server functions instead of /api/*.
- 2026-11-08: Merged in #5. CI on Node 24.22.2 green; deploy succeeded. server-functions can port tests/api/ scenarios (status + body + DB state) onto the server functions.
