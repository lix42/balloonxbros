---
title: Resend confirmation email
status: done
deps: []
related: [contact-inbox]
summary: verify domain in Resend, set RESEND_API_KEY, confirm delivery
done: 2026-11-09
---
# Resend confirmation email

## Goal

Buyers get a confirmation email after submitting a pre-order, sent from
`orders@balloonxbros.com`.

## Design

- In Resend, add the domain `balloonxbros.com` and add the DNS records it asks
  for (DKIM TXT `resend._domainkey`, plus a CNAME on its `send.` subdomain,
  which carries the MX/SPF) in Cloudflare DNS.
  They don't conflict with Email Routing's root MX.
- Create a sending-only API key and run `pnpm exec wrangler secret put RESEND_API_KEY`.
- The Worker already sends via `worker/email.ts` once the key is set, and
  returns false without throwing when sending fails, so a bad key fails
  silently for the buyer. Check the Worker logs.
- Optional: add a DMARC record (`_dmarc` TXT, `p=none` to start) to help
  deliverability.

## How to Verify

- Resend shows the domain as Verified.
- Submit a test order on production with a real email address: the
  confirmation arrives (inbox, not spam), shows the right items, total and
  pickup details, and its reply-to is the contact address.
- `pnpm exec wrangler tail` shows no `resend failed` errors during the order.
