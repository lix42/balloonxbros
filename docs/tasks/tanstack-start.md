---
title: Migrate to TanStack Start (SSR)
status: done
deps: []
related: [pnpm]
summary: file routes + SSR on Workers; /api/* still served by the existing handler
done: "2026-11-08 #8"
---
# Migrate to TanStack Start (SSR)

## Goal

The site runs on TanStack Start with server-side rendering on Cloudflare
Workers, looking and behaving exactly as before. The API is not rewritten
here; that's `server-functions`.

## Design

- Follow Start's Cloudflare hosting guide: `vite.config.ts` gets
  `cloudflare({ viteEnvironment: { name: 'ssr' } })`, `tanstackStart()` and
  the React plugin; `wrangler.jsonc` `main` becomes the custom entry
  `src/server.ts` (below), which wraps Start's server entry
  (`@tanstack/react-start/server-entry`), with `nodejs_compat`. Keep the D1/R2
  bindings, vars, routes and custom domains as they are.
- File routes under `src/routes/`: `__root.tsx` (document, fonts, CSS, error
  and not-found pages), `index` (Home), `donate`, `order`, `order/$code`
  (Done), `admin`. Replace the hand-rolled `src/router.tsx` with Start's
  `getRouter()`, delete `App.tsx`, `main.tsx` and `index.html`; use Start's
  `Link`/`useNavigate`.
- **API stays as-is for now:** a custom server entry `src/server.ts` (the
  wrangler `main`, as in Cloudflare's TanStack Start guide) sends `/api/*`
  straight to the existing `worker/index.ts` handler with the real `env` and
  `ctx`, and everything else to Start's `handler.fetch`. No catch-all server
  route, so the API keeps its exact behaviour and `tests/api/` (which run
  `worker/index.ts` directly) keep covering it. `src/api.ts` keeps calling
  `/api/*`.
- **SSR safety:** `store.tsx` reads `localStorage` and fetches the menu on
  mount; nothing may touch `window`/`localStorage` during render on the
  server. Load menu + settings in a route loader so the menu is in the
  server-rendered HTML; hydrate the cart from `localStorage` in an effect.
- Types: `tsconfig.app.json` also includes `worker/worker-configuration.d.ts`
  and `worker/env.d.ts`, because route files import server functions that use
  Workers types; they coexist with the DOM lib.

## How to Verify

- `curl -s localhost:5173/` (dev) and production return HTML that already
  contains the menu item names (SSR works).
- Full manual pass locally: add to cart (survives reload), `/donate`, submit
  an order with a receipt, order-received page, admin login, verify an
  order, edit an item. No hydration warnings in the console.
- Deep links (`/order/<code>`, `/admin`) load directly; unknown paths show a
  not-found page.
- `pnpm run check` and `build` pass; CI green.
