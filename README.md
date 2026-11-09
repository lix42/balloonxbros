# Balloon x Bros

Pre-order site for a kid-run twist-balloon fundraiser. Buyers pick balloons,
donate the total directly to the school, upload the donation receipt, and pick
the balloons up at the event.

- **Site:** Home (menu + limited edition), How to donate, Pre-order form, Order received
- **Admin** (`/admin`): verify receipts, mark pick-ups, cancel (returns stock),
  edit balloons/prices/stock/photos, edit event details, open/close pre-orders
- **Stack:** React + Vite + TypeScript, Cloudflare Workers + D1 + R2, Resend email

Design spec: [`docs/DESIGN.md`](docs/DESIGN.md).

## Local development

```sh
npm install
cp .dev.vars.example .dev.vars        # local admin password = localdev
npm run db:migrate:local
npm run dev                           # http://localhost:5173, admin at /admin
npm run check                         # typecheck + tests
```

## First deploy (one time)

```sh
npx wrangler login
npx wrangler d1 create balloonxbros            # copy the id into wrangler.jsonc
npx wrangler r2 bucket create balloonxbros-files
npm run db:migrate:remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET         # any long random string: openssl rand -hex 32
npx wrangler secret put RESEND_API_KEY         # optional, see below
npm run deploy
```

`wrangler.jsonc` routes the Worker to `balloonxbros.com` and
`www.balloonxbros.com` as custom domains (the zone must be in the same
Cloudflare account).

After that, pushes to `main` deploy through GitHub Actions — add repo secrets
`CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers" plus D1 edit) and
`CLOUDFLARE_ACCOUNT_ID`.

## Confirmation email (Resend)

1. Create a Resend account, add domain `balloonxbros.com`, and add the DNS
   records it shows in the Cloudflare dashboard.
2. Create an API key and `wrangler secret put RESEND_API_KEY`.

Emails are sent from `EMAIL_FROM` in `wrangler.jsonc` with replies going to the
contact email set in admin. Without a key, orders still work; the admin list
shows "email not sent".

## Before launch

Fill in from `/admin`: school name, date/time/place, cutoff, what the money is
for, the school's donation page URL, contact email, real balloon names, prices,
limited-edition stock, and photos. The seeded values are placeholders.
