---
title: Resend confirmation email
status: todo
deps: []
related: [contact-inbox]
summary: verify domain in Resend, set RESEND_API_KEY, confirm delivery
---
# Resend confirmation email

## Goal

Buyers get a confirmation email after submitting a pre-order, sent from
`orders@balloonxbros.com`.

## Design

- In Resend, add the domain `balloonxbros.com` and add the DNS records it asks
  for (DKIM TXT, plus the MX/SPF on its `send.` subdomain) in Cloudflare DNS.
  They don't conflict with Email Routing's root MX.
- Create a sending-only API key and run `npx wrangler secret put RESEND_API_KEY`.
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
- `npx wrangler tail` shows no `resend failed` errors during the order.
