# Balloon x Bros

Pre-order site for a kid-run twist-balloon school fundraiser for Kirkland
Middle School (KIMS). Spec and design tokens: `docs/DESIGN.md`. Placeholders
still to fill: `docs/PLACEHOLDERS.md`. Ask the owner (Li) rather than guessing
real-world facts (prices, dates, menu, school info).

## Design source

Visual design lives in a Claude Design canvas (screens: Home, How to donate,
Pre-order form, Order received; 390px mobile artboards):
https://claude.ai/artifact/XxCQyYroyUzx8EyymEZv5b
(artifact slug `faa719d3-85b6-45f1-b9fa-abe40f2600ce`; artboards are
`project/*.dc.html`). The built UI in `src/` follows it; `docs/DESIGN.md`
records tokens and decisions. If the canvas and code disagree, ask Li which wins.

## Status (as of 2026-11-08)

- Live at https://balloonxbros.com (Worker `balloonxbros`, custom domains
  balloonxbros.com + www). Admin at `/admin`.
- Cloudflare: D1 `balloonxbros` (id in `wrangler.jsonc`), R2 `balloonxbros-files`.
  Secrets set: `ADMIN_PASSWORD`, `SESSION_SECRET`. Not yet: `RESEND_API_KEY`.
- Migration `0001_init.sql` is applied in production — never edit it; add
  `0002_*.sql` and up. CI (`.github/workflows/deploy.yml`) applies migrations
  and deploys on push to `main` using repo secrets `CLOUDFLARE_API_TOKEN` /
  `CLOUDFLARE_ACCOUNT_ID`.
- Next: content PRs (event details, real menu/prices/stock, photos in
  `public/balloons/`), then Resend domain verification.

## Stack

- React 19 + Vite + TypeScript SPA in `src/`, served as Workers static assets.
- Node 24 for all tooling (dev, build, tests' host, wrangler, CI), pinned in
  `.nvmrc`; `engines` + `engineStrict` (pnpm-workspace.yaml) make pnpm refuse
  other versions. The Worker itself runs on workerd, not Node.
- Cloudflare Worker API in `worker/` (`/api/*`), via `@cloudflare/vite-plugin`.
- D1 (`DB`) for items, orders, settings — schema in `migrations/`.
- R2 (`FILES`) for receipt uploads (`receipts/`) and item photos (`photos/`).
- Seed data in `migrations/0001_init.sql` is placeholder (names in [BRACKETS],
  prices) — replace via a new migration (see `docs/PLACEHOLDERS.md`) or /admin.
- Resend for customer confirmation email (skipped when `RESEND_API_KEY` unset).
- Domain: balloonxbros.com (registered on Cloudflare).
- pnpm, version pinned in `packageManager` (Corepack or a plain `pnpm` picks it
  up). Dependency install scripts are off except those in `allowBuilds`.

## Commands

- `pnpm run dev` — Vite + local Worker/D1/R2 (run `pnpm run db:migrate:local` first)
- `pnpm run check` — typecheck + tests. Tests run inside workerd via
  `@cloudflare/vitest-plugin` with local D1 (migrations applied) and R2;
  `tests/api/` drives the Worker through its real entry point.
- `pnpm run build` / `pnpm run deploy`

## Conventions

- Money is integer cents everywhere; format only in the UI.
- Stock decrements happen in one D1 batch; `items.stock` has a
  `CHECK (stock IS NULL OR stock >= 0)` so an oversell aborts the batch.
- Admin auth: `ADMIN_PASSWORD` secret → HMAC-signed cookie (`SESSION_SECRET`).
- Mobile first; touch targets ≥ 44px; no emoji icons.
