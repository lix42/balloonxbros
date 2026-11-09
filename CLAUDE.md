# Balloon x Bros

Pre-order site for a kid-run twist-balloon school fundraiser. Spec and design
tokens: `docs/DESIGN.md`. Open product questions are listed at its end; ask the
owner (Li) rather than guessing real-world facts (prices, dates, school info).

## Stack

- React 19 + Vite + TypeScript SPA in `src/`, served as Workers static assets.
- Cloudflare Worker API in `worker/` (`/api/*`), via `@cloudflare/vite-plugin`.
- D1 (`DB`) for items, orders, settings — schema in `migrations/`.
- R2 (`FILES`) for receipt uploads (`receipts/`) and item photos (`photos/`).
- Seed data in `migrations/0001_init.sql` is placeholder (names in [BRACKETS],
  prices) — real values get set from /admin.
- Resend for customer confirmation email (skipped when `RESEND_API_KEY` unset).
- Domain: balloonxbros.com (registered on Cloudflare).

## Commands

- `npm run dev` — Vite + local Worker/D1/R2 (run `npm run db:migrate:local` first)
- `npm run check` — typecheck + tests
- `npm run build` / `npm run deploy`

## Conventions

- Money is integer cents everywhere; format only in the UI.
- Stock decrements happen in one D1 batch; `items.stock` has a
  `CHECK (stock IS NULL OR stock >= 0)` so an oversell aborts the batch.
- Admin auth: `ADMIN_PASSWORD` secret → HMAC-signed cookie (`SESSION_SECRET`).
- Mobile first; touch targets ≥ 44px; no emoji icons.
