# Balloon x Bros launch — Progress Log

How each task is actually being carried out. One `##` section per task; append entries, don't rewrite them.

## event-details

**Status:** done
**Updated:** 2026-11-09

- 2026-11-08: filed. Goal: migration with date, time, place, cutoff, purpose, donation URL
- 2026-11-09: Migration 0002_event_details.sql: event_date 'Fri, Nov 13', event_place 'Kingsgate Skating Rink' (Li, 2026-11-09). Home announcement is now the kids' note (Sky and Ocean) as a new `announcement` setting with an admin textarea; their 9/12, 9/13 corrected to 11/12, 11/13 per Li. Removed the cutoff/purpose settings (only the old template used them). Still open: event_time, donation_url.
- 2026-11-09: event_time '6pm–8pm' (Li). donation_url split out to the new donation-steps task (link, screenshots, real steps), so this task is complete with PR.
- 2026-11-09: Map links: new event_address setting (14326 124th Ave NE, Kirkland, WA 98034, from Li); every Maps link searches the address because Google lists the rink as Sno-King Ice Arena. Home Where tile + address line + the place name in the announcement link to Maps. Order-received page and confirmation email show the address and a map preview (public/event-map.jpg, Li's screenshot cropped to 952x476, 64 KB) with the Google credit as a caption. Checked Home and order-received in headless Chrome.
- 2026-11-09: Done. Landed: migration 0002_event_details.sql (event_date 'Fri, Nov 13', event_time '6pm–8pm', event_place 'Kingsgate Skating Rink', new event_address '14326 124th Ave NE, Kirkland, WA 98034', new announcement = Sky and Ocean's note; cutoff/purpose deleted). Map links (shared/place.ts eventMapUrl) search the address; Home Where tile, address line and announcement link to Maps; order-received page and confirmation email show the address and public/event-map.jpg with the Google credit. Verified: pnpm run check (36 tests), build, headless screenshots of Home and order-received at phone width; review loop (bugs, security, types, tests, conventions, docs) converged. For dependents: donation_url is the donation-steps task; launch-check should confirm the map image loads in a real email after deploy, and decide whether to call the venue Sno-King Ice Arena.

## menu-content

**Status:** not started
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: migration with real items, prices, limited stock; hide unused seed items

## contact-inbox

**Status:** done
**Updated:** 2026-11-09

- 2026-11-08: filed. Goal: Cloudflare Email Routing forwards hello@balloonxbros.com to Li
- 2026-11-09: Routing set up with wrangler 4.158 (email routing, open beta): enabled on the zone (root MX route1-3.mx.cloudflare.net + SPF include:_spf.mx.cloudflare.net, DKIM cf2024-1._domainkey), destination Li's Fastmail inbox verified, rule hello@ -> it; catch-all stays off (drop). Resend's records (send. CNAME to forge.rmta.net, resend._domainkey TXT) sit apart from the root MX, no clash; no _dmarc record yet (for resend-email). Gotchas: the worktree guard rejects 'wrangler email routing enable' (reads enable as the shell builtin), so Li ran it; the rule can't be created until the destination is verified (code 2054); my network blocks port 25, so no SMTP probe. BLOCKED on delivery: Cloudflare accepts mail (SPF/DKIM/DMARC pass) but Fastmail answers 451 4.7.1 'balloonxbros.com is blacklisted - RLR633' because Cloudflare's forward uses balloonxbros.com as the envelope domain and the domain is under a day old (created 2026-11-08 20:54 UTC). Cloudflare doesn't retry, so those test mails are lost. Note for resend-email: mail from orders@balloonxbros.com to Fastmail users likely hits the same block while the domain is new.
- 2026-11-09: Done. Workaround for the Fastmail block: added Li's Gmail as a second verified destination and pointed the hello@ rule (e1fe1f41…) at it alone; Li's Fastmail stays registered, so switching back is one 'wrangler email routing rules update'. Verified: a test from an outside account to hello@balloonxbros.com arrived in Gmail; dig MX on the public resolvers shows route1-3.mx.cloudflare.net. Follow-up options: ask Fastmail support to whitelist balloonxbros.com, or retest the Fastmail destination once the domain has some age. For launch-check: replying to a confirmation email lands in Li's Gmail.

## resend-email

**Status:** done
**Updated:** 2026-11-09

- 2026-11-08: filed. Goal: verify domain in Resend, set RESEND_API_KEY, confirm delivery
- 2026-11-09: Started. Resend shows balloonxbros.com Verified (Li); records already in DNS: send. CNAME to send.forge.rmta.net, resend._domainkey TXT (CNAME-style setup, not the MX/SPF TXT the spec describes). RESEND_API_KEY set by Li (secret list confirms). No _dmarc record yet.
- 2026-11-09: Verified on prod 2026-11-09: Li opened orders_open briefly, placed a test order to a Gmail address, closed it again and cancelled the order. The confirmation arrived in the Inbox (not spam), items and total correct, reply-to hello@balloonxbros.com. wrangler tail (allowed via a user-settings rule for 'pnpm exec wrangler tail') showed every request Ok, no 'resend failed'. DMARC skipped by decision (no _dmarc record). Not tested: Fastmail recipients, who may hit the same new-domain block as hello@ forwarding. Note for launch-check: the pickup line still shows [BRACKET] placeholders until event-details lands.

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

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: move worker/ routes to Start server functions and server routes
- 2026-11-08: Implemented. worker/index.ts (HTTP router) → worker/service.ts (plain functions: env + input → data, or HttpError). src/server-fns.ts wraps each as a createServerFn returning Result {ok,data}|{ok:false,status,error} so statuses (409 stock reload) survive; src/api.ts keeps its interface and unwraps to ApiError, so pages are unchanged. In Start 1.169 the method is .validator(), not .inputValidator(). File routes keep their URLs: /api/files/$ (photos only) and /api/admin/orders/$id/receipt. Admin functions take an AdminAuth brand only requireAdmin creates. Cookie Path=/ (server fns live at /_serverFn). Email via waitUntil from cloudflare:workers. src/server.ts and src/menu.ts deleted; wrangler main = Start default entry; test pool main = tests/worker.ts stub. Tests ported to call the service (25: per-route 401 tests → one requireAdmin test). Verified: check (0 warnings now), build, no server code in client bundle, dev browser pass (order + stock, admin wrong/right password, receipt, verify, settings, photo upload served, price edit, logout → 401), preview replay of an admin server fn without/forged cookie → {ok:false,401}; Start's CSRF returns 403 for cross-site-looking calls. Gotcha: a stale vite preview on :5198 from an earlier task made a new preview fail --strictPort and serve 500s; kill by port, not by pattern.
- 2026-11-08: Done (#10). Review fixes: logout and login also expire the pre-deploy Path=/api/admin cookie (otherwise it outlived logout and still opened receipts); input shape checks run inside respond() as HttpError(400); respond() sets Cache-Control: no-store (also on SSR HTML, fine: live stock); call() logs and keeps the cause, and says 'check your connection' only for fetch's TypeError; run/call moved to dependency-free src/result.ts and file headers to src/file-response.ts, both unit-tested (31 tests). Known: a tab open across the deploy calls the removed /api URLs until reloaded. Admins log in again once. Note for tailwind-shadcn: pages are unchanged by this task; src/api.ts kept its interface.

## tailwind-shadcn

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: Tailwind v4, shadcn on Base UI, DESIGN.md tokens as theme; restyle pages
- 2026-11-08: Implemented. Tailwind 4.3.5 + shadcn 4.23.0 (base-nova, Base UI 1.9.0). Theme tokens in src/styles/app.css; shared Button/Input/Checkbox restyled; pages converted in parallel (Home/Donate/Done, Order, Admin) from a class→utility map. Gotchas found by pixel-diffing against baseline screenshots of the old site at 390px: Tailwind text-* sizes set their own line-height (old inherited 1.5) → theme line-heights 1.5; preflight removes link underlines and list bullets → base a underline, list-disc; a ul nested in an ol defaults to circle bullets; preflight recolours placeholders → #757575; buttonVariants base had justify-center/whitespace-nowrap the old .link-btn/.btn lacked; Base UI Button defaults type=button (submit buttons need type=submit). Result: every screen pixel-identical except the admin checkboxes (shadcn Checkbox, intended). Lighthouse a11y 100 on Home and Order. Flows re-tested: order submit, admin login via Enter, checkbox save both ways.
- 2026-11-08: Done (#11). Review: bugs and security clean; docs fixes (spec Dialog/cn wording, dark: tokens dropped from Checkbox, Admin class constants camelCase). Pixel diff vs old site identical except the admin checkboxes; Lighthouse a11y 100 (Home, Order).

## vite-plus

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: vp migrate; scripts and CI on vp check/test/build
- 2026-11-08: Implemented with vite-plus 1.5.0 (newest older than a day): vp migrate --no-interactive --no-agent --no-editor --no-hooks. It pinned vite (to @voidzero-dev/vite-plus-core) and vitest via a pnpm catalog/overrides, rewrote vite/vitest imports to vite-plus, wrapped plugins in lazyPlugins, and moved scripts to vp. Adopted Oxfmt + Oxlint (type-aware with typeCheck); generated files and the tasks-CLI docs are excluded from fmt (formatting them would fight the CLI and break tasks check). Verified vp check really type-checks: injected type errors in src/, worker/, tests/ and vite.config.ts all fail it, and so does document used in worker/ (it honours each tsconfig), so tsc -b was dropped (Li asked to confirm). check = vp check && vp test run; typecheck = vp check --no-fmt --no-lint; fix = vp check --fix. Format pass is its own commit. 5 lint warnings remain in worker/index.ts (no-base-to-string on String(x ?? ""), no-misused-spread on headers): not errors, left as is. Verified: check, build, vp dev SSR + /api, CI=true frozen install passes the release-age policy.
- 2026-11-08: Review correction: dropping tsc -b was wrong. vp check (tsgolint) checks each file under one tsconfig only; shared/ is in the app, worker and tests tsconfigs and is checked only under the app one (DOM lib). document in shared/ passes vp check but fails tsc -b, and the Worker bundles shared/. Restored: check = vp check && tsc -b && vp test run; typecheck = tsc -b. Docs fixed (CLAUDE.md, spec).
- 2026-11-08: Done (#9). Final gate: check = vp check && tsc -b && vp test run. Format pass verified behaviour-neutral (client assets byte-identical; only punctuation tokens changed). Note for tailwind-shadcn: add Tailwind's Vite plugin inside lazyPlugins in vite.config.ts; run pnpm run fix after adding files (Oxfmt is in the gate).

## api-tests

**Status:** done
**Updated:** 2026-11-08

- 2026-11-08: filed. Goal: route-level tests on local D1/R2 via @cloudflare/vitest-plugin; safety net for server-functions
- 2026-11-08: Added @cloudflare/vitest-plugin 1.6.0 (the older vitest-pool-workers peers on Vitest 4 only); config copied from the nc telemetry-ingest pattern. All tests, including the old pure ones, now run in workerd. tests/api/ has 31 route tests (public + admin) going through exports.default with fixture items installed per test, so they don't depend on seed content. The mid-checkout sold-out race is simulated with a BEFORE INSERT trigger on orders that zeroes stock inside the batch. Checked that the tests can fail: removing the stock decrement, the admin session check, or the CHECK-constraint handling each fails tests. Added tsconfig.tests.json (cloudflare:test types) so tsc -b covers tests. Note for server-functions: the scenarios assert status + body + DB state; port them to call the server functions instead of /api/*.
- 2026-11-08: Merged in #5. CI on Node 24.22.2 green; deploy succeeded. server-functions can port tests/api/ scenarios (status + body + DB state) onto the server functions.

## cf-email-service

**Status:** not started
**Updated:** 2026-11-09

- 2026-11-09: filed. Goal: post-launch: send confirmations via the send_email binding instead of Resend

## donation-steps

**Status:** not started
**Updated:** 2026-11-09

- 2026-11-09: filed. Goal: real donation_url, screenshots and accurate steps on /donate
