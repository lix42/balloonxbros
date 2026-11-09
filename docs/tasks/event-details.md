---
title: Real event details
status: todo
deps: []
summary: migration with date, time, place, cutoff, purpose, donation URL
---
# Real event details

## Goal

Replace the placeholder event settings with the real ones so Home, the order
form, the confirmation page and the confirmation email show correct facts.

## Design

A new migration (`migrations/000N_event_details.sql`, next free number) with
`UPDATE settings SET value = … WHERE key = …` for: `event_date`, `event_time`,
`event_place`, `cutoff`, `purpose`, `donation_url`. Values come from Li, so ask
rather than guess. `school_name` and `contact_email` are already right. Don't
touch `orders_open`: admin owns that.

Keep the formats the UI expects: short human strings
(e.g. `Sat, Nov 21`, `10am–2pm`), since they're interpolated into sentences
("Pre-orders are open until {cutoff}", "Pick up: {date}, {time} at {place}").

Remove the filled rows from `docs/PLACEHOLDERS.md`.

## How to Verify

- `npm run db:migrate:local && npm run dev`: Home info tiles, announcement
  card, `/donate` step 1 link, and the order-received page show the new values
  and read naturally in their sentences.
- `npm run check` passes.
- After deploy: the same pages on https://balloonxbros.com.
