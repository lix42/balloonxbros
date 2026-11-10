---
title: Real donation link and steps
status: done
deps: []
summary: real donation_url, screenshots and accurate steps on /donate
done: 2026-11-09
---
# Real donation link and steps

## Goal

`/donate` walks a parent through the school's real donation page: the real
link, steps that match what they'll actually see, and screenshots of each
step so they can follow along on a phone.

## Design

Walked the real site with Li (2026-11-09; see the progress log). It is the
Lake Washington School District page on InTouch Receipting: a form (School,
I want to donate to, Donation amount, Student Name) → Buy → Cart → Pay →
Customer Information (all required) → card (Visa/Mastercard) → a receipt
page shown only once, with Send (email from noreply@intouchpay.com), Print
and Done. There is no free-text note field.

- Migration `0003_donation_url.sql` sets `donation_url`.
- `/donate` follows that flow in six steps: KIRKLAND MIDDLE SCHOOL, ASB
  DONATIONS, the order total and Student Name "Sky Xu" (Li's choice), then
  cart, details, card, and saving the receipt before Done. A heads-up note at
  the top says the receipt is shown once. The menu values live in
  `src/lib/school-site.ts`.
- Screenshots are cropped to the relevant part, stored in `public/donate/`
  with `alt` text; the receipt has the payer's email, name, receipt number
  and transaction code covered with solid blocks.
- The order form checks the receipt for ASB DONATIONS, Sky Xu and the amount
  (the receipt doesn't name the school), and keeps name, email and phone
  across a closed tab.
- `donation_url` is gone from `docs/PLACEHOLDERS.md`.

## How to Verify

- `pnpm run dev`: `/donate` step 1 opens the real page in a new tab; every
  step and screenshot matches the live page, readable at 390px width.
- `pnpm run check` passes.
- After deploy: the same on https://balloonxbros.com.
