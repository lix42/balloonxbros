---
title: Migrate to TanStack Start (SSR)
status: todo
deps: []
related: [pnpm]
summary: file routes + SSR on Workers; /api/* still served by the existing handler
---
# Migrate to TanStack Start (SSR)

## Goal

The site runs on TanStack Start with server-side rendering on Cloudflare
Workers, looking and behaving exactly as before. The API is not rewritten
here; that's `server-functions`.

## Design

- Follow Start's Cloudflare hosting guide: `vite.config.ts` gets
  `cloudflare({ viteEnvironment: { name: 'ssr' } })`, `tanstackStart()` and
  the React plugin; `wrangler.jsonc` `main` becomes Start's server entry
  (`@tanstack/react-start/server-entry`), with `nodejs_compat`. Keep the D1/R2
  bindings, vars, routes and custom domains as they are.
- File routes under `src/routes/`: `__root.tsx` (document, fonts, CSS),
  `index` (Home), `donate`, `order`, `order/$code` (Done), `admin`. Delete the
  hand-rolled `src/router.tsx` and `App.tsx`; use Start's `Link`/`navigate`.
- **API stays as-is for now:** a catch-all server route `src/routes/api/$.ts`
  hands every method to the existing `worker/index.ts` handler (refactor its
  `fetch` into an exported function taking `(request, env, ctx)`; get `env`
  from `cloudflare:workers`). `src/api.ts` keeps calling `/api/*`.
- **SSR safety:** `store.tsx` reads `localStorage` and fetches the menu on
  mount; nothing may touch `window`/`localStorage` during render on the
  server. Load menu + settings in a route loader so the menu is in the
  server-rendered HTML; hydrate the cart from `localStorage` in an effect.
- Open: whether TypeScript 7 (`tsc -b`) is happy with Start's generated
  route tree; check early.

## How to Verify

- `curl -s localhost:5173/` (dev) and production return HTML that already
  contains the menu item names (SSR works).
- Full manual pass locally: add to cart (survives reload), `/donate`, submit
  an order with a receipt, order-received page, admin login, verify an
  order, edit an item. No hydration warnings in the console.
- Deep links (`/order/<code>`, `/admin`) load directly; unknown paths show a
  not-found page.
- `pnpm run check` and `build` pass; CI green.
