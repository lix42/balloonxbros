# Balloon x Bros launch — Tasks

The remaining work to take the live site (https://balloonxbros.com) from
placeholder content to a real launch for the KIMS fundraiser in late Nov 2026.
The site itself is built; see [DESIGN.md](DESIGN.md) for the spec and
[PLACEHOLDERS.md](PLACEHOLDERS.md) for every value still to fill in.

> **Progress log:** [progress.md](progress.md) records *how* each task is carried out. Read it before
> starting a task; log as you work with `tasks log <id> "…"`.

## Design

### Content: migrations first, then admin
- Launch content (event settings, menu, photo paths) lands as reviewed
  migrations, never by editing `0001_init.sql`. CI applies them before deploy.
- Each PR takes the **next free number** (`000N_<name>.sql`) at the time it
  opens, so parallel PRs don't collide.
- After launch, live changes (stock, toggling items, `orders_open`) happen only
  in `/admin`, and no later migration touches those rows. A migration
  overwrites admin edits.
- Each content PR removes the rows it filled from `PLACEHOLDERS.md`, so that
  file always lists exactly what's left.

### Email: two separate pieces
- **Inbound** — Cloudflare Email Routing forwards `hello@balloonxbros.com`
  (footer, and the reply-to of confirmation mail) to Li. Root-domain MX records.
- **Outbound** — Resend sends confirmation mail from
  `orders@balloonxbros.com` (`EMAIL_FROM`). DKIM plus SPF/MX on Resend's
  `send.` subdomain, so it doesn't clash with routing. Until
  `RESEND_API_KEY` is set the Worker skips sending.

### Pre-orders stay closed until launch
`orders_open` is turned off in `/admin` while content is placeholder. The
[launch check](tasks/launch-check.md) turns it back on as its last step.

### Stack migration (before launch, by decision)
- **pnpm** replaces npm; **Vite+** (`vp`) then wraps dev/build/test/lint.
- **TanStack Start** with SSR on Workers replaces the hand-rolled SPA router,
  in two steps: pages and routing first, with `/api/*` still served by the
  old handler, then the API moves to server functions and server routes.
- **Tailwind v4 + shadcn on Base UI** replaces `src/styles.css`. The
  DESIGN.md tokens become the theme, and the canvas stays the visual source of
  truth.
- One migration at a time where they share `package.json`, `vite.config.ts`
  or page files. The launch check runs on the final stack.
