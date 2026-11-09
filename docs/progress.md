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

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: pnpm lockfile, packageManager, CI, docs
- 2026-11-08: pnpm 12.18.0 via packageManager, following the nc repo: CI uses 'corepack enable pnpm' (no pnpm/action-setup, no setup-node cache, since setup-node's pnpm cache needs pnpm on PATH first). pnpm import kept the npm-resolved versions. Settings live in pnpm-workspace.yaml (pnpm 12 ignores non-auth .npmrc): engineStrict replaces .npmrc engine-strict (verified: --config.node-version=22.18.0 is refused), allowBuilds allows only esbuild + workerd. Gotcha: under 'corepack pnpm', nested 'pnpm run' resolves to whatever pnpm is on PATH and fails ERR_PNPM_BAD_PM_VERSION if it differs; a plain pnpm self-switches to the pinned version. Docs, README and task specs now say pnpm.
- 2026-11-08: Done (#7). Landed as the updated spec describes. Verified: pnpm run check (tsc -b + 36 workerd tests) and build pass locally; review simulated CI in a clean Corepack env on Node 24.22.2 (frozen install, check, build, pnpm exec wrangler all OK); security review found the lockfile sources unchanged (all registry.npmjs.org, sha512) and install scripts narrower than under npm. Finished task specs (api-tests.md) and this log keep their npm wording as history. Note for vite-plus and later: Node 24 is the last line that ships Corepack, so moving past Node 24 means replacing 'corepack enable pnpm' in CI.
- 2026-11-08: CI fix on #7: the first run failed ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION. pnpm 12's minimumReleaseAge policy rejected @cloudflare/workers-types@5.20261109.1, published that day; the local install hadn't flagged it. Kept the policy and moved to ^5.20261107.1, the newest release older than a day. Note for later tasks that add dependencies: choose versions at least a day old, or CI fails the frozen install.

## tanstack-start

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: file routes + SSR on Workers; /api/* still served by the existing handler
- 2026-11-08: Implemented. Custom server entry src/server.ts (wrangler main) routes /api/* to worker/index.ts with real env/ctx and everything else to Start's handler.fetch, per Cloudflare's Start guide. No catch-all server route, so API behaviour and tests/api are unchanged; vitest.config.ts overrides main to worker/index.ts because src/server.ts needs the Start plugin to build. SSR data: src/menu.ts getMenu server fn reads D1 via cloudflare:workers env; root loader runs it once (shouldReload: false) and seeds StoreProvider, which keeps its own reload via /api/menu. Cart starts empty and loads from localStorage after mount; saving waits for that load. Done page reads sessionStorage in an effect. /order/$code 404s unless BXB-… (beforeLoad notFound). tsconfig.app includes the worker's generated types (they coexist with DOM). wrangler: nodejs_compat added; assets block removed (the Vite plugin adds dist/client). Pinned @tanstack/react-start 1.169.4, react-router 1.170.46 (older than a day). Verified: check + build; dev SSR HTML contains the menu; browser pass (no hydration warnings, cart survives reload, order with receipt, admin login/verify/receipt, deep links, 404s); vite preview of the build; wrangler deploy --dry-run keeps all bindings.
- 2026-11-08: Done (#8). Review fixes: root errorComponent (SiteHeader + LoadError, reload) for any uncaught route error; getMenu logs the real cause and throws a generic error, since Start serializes loader errors into the HTML; Store items/settings non-null (dead loading guards removed) plus cartReady, so /order waits for the saved cart instead of flashing empty; order submit reports failure only for the API call, then navigates and clears the cart once it settles; loadCart ignores non-object JSON. Notes for server-functions: Start serializes loader/server-fn errors into the page, so throw generic messages from server code and log the cause; Store.reload still uses /api/menu. Notes for tailwind-shadcn: CSS comes in through __root.tsx head links (styles.css?url).

## server-functions

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: move worker/ routes to Start server functions and server routes

## tailwind-shadcn

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: Tailwind v4, shadcn on Base UI, DESIGN.md tokens as theme; restyle pages

## vite-plus

**Status:** in progress
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: vp migrate; scripts and CI on vp check/test/build

## api-tests

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: route-level tests on local D1/R2 via @cloudflare/vitest-plugin; safety net for server-functions
- 2026-11-08: Added @cloudflare/vitest-plugin 1.6.0 (the older vitest-pool-workers peers on Vitest 4 only); config copied from the nc telemetry-ingest pattern. All tests, including the old pure ones, now run in workerd. tests/api/ has 31 route tests (public + admin) going through exports.default with fixture items installed per test, so they don't depend on seed content. The mid-checkout sold-out race is simulated with a BEFORE INSERT trigger on orders that zeroes stock inside the batch. Checked that the tests can fail: removing the stock decrement, the admin session check, or the CHECK-constraint handling each fails tests. Added tsconfig.tests.json (cloudflare:test types) so tsc -b covers tests. Note for server-functions: the scenarios assert status + body + DB state; port them to call the server functions instead of /api/*.
- 2026-11-08: Merged in #5. CI on Node 24.22.2 green; deploy succeeded. server-functions can port tests/api/ scenarios (status + body + DB state) onto the server functions.
