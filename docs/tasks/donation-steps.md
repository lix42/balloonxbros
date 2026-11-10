---
title: Real donation link and steps
status: todo
deps: []
summary: real donation_url, screenshots and accurate steps on /donate
---
# Real donation link and steps

## Goal

`/donate` walks a parent through the school's real donation page: the real
link, steps that match what they'll actually see, and screenshots of each
step so they can follow along on a phone.

## Design

Known: `/donate` (`src/pages/Donate.tsx`) has five steps written as guesses
(open the page, select the school from a list, enter the order total, submit,
pay) and links `settings.donation_url`, still `https://example.org/donate`.
The order total is filled in from the cart.

Unknown, from Li: the real donation URL, what the school's page actually asks
for (whether there's a school list, fund/designation, a note field for the
order or pickup name, fees), and screenshots of each screen.

- New migration (next free `000N_donation_url.sql`) setting `donation_url`.
- Rewrite the steps to match the real page. If a note field exists, tell
  parents to put their pickup name there so receipts match orders.
- Screenshots: crop to the relevant part, compress, store under
  `public/donate/` and show one per step (`alt` text describing the step).
  Check them for personal data (names, emails, card details) before
  committing.
- Remove the `donation_url` row from `docs/PLACEHOLDERS.md`.

## How to Verify

- `pnpm run dev`: `/donate` step 1 opens the real page in a new tab; every
  step and screenshot matches the live page, readable at 390px width.
- `pnpm run check` passes.
- After deploy: the same on https://balloonxbros.com.
