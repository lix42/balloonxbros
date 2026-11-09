---
title: Contact inbox for hello@
status: done
deps: []
summary: Cloudflare Email Routing forwards hello@balloonxbros.com to Li
done: 2026-11-09
---
# Contact inbox for hello@

## Goal

Mail to `hello@balloonxbros.com` reaches Li, both from the footer link and
from buyers replying to their confirmation email (it's the `reply_to`).

## Design

Cloudflare dashboard → balloonxbros.com → Email → Email Routing:
enable it (Cloudflare adds the root MX and SPF TXT records), add and verify
Li's inbox as a destination, and create a rule `hello@` → that inbox.
Optionally a catch-all to the same place.

No code change. If Li prefers a different address, change `contact_email`
in a migration instead.

## How to Verify

- Send a mail from an outside account (not the destination inbox itself) to
  `hello@balloonxbros.com`: it arrives.
- `dig MX balloonxbros.com` shows Cloudflare's routing MX records.
