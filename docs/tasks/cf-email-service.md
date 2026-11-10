---
title: Move outbound email to Cloudflare Email Service
status: todo
deps: [launch-check]
related: [resend-email]
priority: low
summary: "post-launch: send confirmations via the send_email binding instead of Resend"
---
# Move outbound email to Cloudflare Email Service

## Goal

After the event, send confirmation mail through Cloudflare Email Service
instead of Resend, so all email (inbound routing and outbound) lives in one
vendor and the Worker no longer needs the `RESEND_API_KEY` secret. Optional,
low priority: Resend works. Don't start before launch.

## Design

Based on the Cloudflare docs as read on 2026-11-09
(https://developers.cloudflare.com/email-service/). Re-read them first, since
the service may have changed.

- Needs **Workers Paid**. Workers Free can only send to verified destination
  addresses. Paid includes 3,000 emails/month, then $0.35 per 1,000. New
  accounts start on an unpublished daily quota that grows over time.
- Onboard `balloonxbros.com` for sending. Cloudflare adds MX/SPF on
  `cf-bounce.`, a DKIM TXT on `cf-bounce._domainkey`, and a root `_dmarc`.
  None of these clash with Email Routing's root records or Resend's `send.` /
  `resend._domainkey`. If a `_dmarc` record exists by then, merge by hand
  (only one is allowed).
- `wrangler.jsonc`: `"send_email": [{ "name": "EMAIL", "allowed_sender_addresses": ["orders@balloonxbros.com"] }]`
  (check whether `remote: true` is needed for `wrangler dev`).
- `worker/email.ts`: replace the Resend `fetch` with
  `env.EMAIL.send({ to, from, replyTo, subject, html, text })`. It throws
  errors with a `code` (`E_RECIPIENT_SUPPRESSED`, `E_DAILY_LIMIT_EXCEEDED`, …),
  so keep the current contract: catch, log `email failed` with the code, and
  return false. Keep `EMAIL_FROM` as the sender. Update the tests' env stub.
- Suppression list is off by default, and then a suppressed recipient fails
  the whole send. One recipient per mail here, so that only fails that send.
- Gmail send-as for `hello@` can stay on Resend SMTP, or move to
  `smtp.mx.cloudflare.net:465` (SSL; 587 isn't supported), username
  `api_token`, password a token with "Email Sending: Edit". That token can
  send as any onboarded domain on the account, so it's broader than a Resend
  key scoped to one domain. Gmail isn't covered by Cloudflare's docs.
- Once delivery is verified: delete `RESEND_API_KEY`, remove Resend's DNS
  records and the domain in Resend (unless Gmail send-as still uses it), and
  update CLAUDE.md, README.md and the email part of `_header.md`.

## How to Verify

- `pnpm run check` passes with the new sender.
- On production, a test order to a Gmail address gets the confirmation in the
  inbox, with reply-to `hello@`. `orders.email_sent` is 1, and `wrangler tail`
  shows no `email failed`.
- Email Sending metrics in the dashboard show the send as delivered. Email
  Routing's summary marks Worker sends as "dropped" even when delivered, so
  don't rely on it.
