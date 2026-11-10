---
title: Real event details
status: done
deps: []
summary: migration with date, time, place, announcement
done: 2026-11-09
---
# Real event details

## Goal

Replace the placeholder event settings with the real ones so Home, the order
form, the confirmation page and the confirmation email show correct facts.

## Design

New migrations (`migrations/000N_event_details*.sql`, next free number) with
`UPDATE settings SET value = … WHERE key = …`. `donation_url` moved to
the donation-steps task. Values come from Li, so ask
rather than guess. `school_name` and `contact_email` are already right. Don't
touch `orders_open`: admin owns that.

Keep the formats the UI expects: short human strings
(e.g. `Fri, Nov 13`, `10am–2pm`), since they're interpolated into sentences
("Pick up: {date}, {time} at {place}").

The Home announcement card is the kids' own note, one `announcement` setting
(line breaks kept, editable in admin). It replaced the old
"open until {cutoff} … goes to {purpose}" template, so `cutoff` and
`purpose` were removed. It repeats the dates, so a date change means editing
both `event_date` and the announcement.

Done in `0002_event_details.sql`: `event_date` (`Fri, Nov 13`),
`event_time` (`6pm–8pm`), `event_place` (`Kingsgate Skating Rink`),
`announcement`, and the new `event_address`
(`14326 124th Ave NE, Kirkland, WA 98034`). Every map link searches the
address, since Google lists the rink as Sno-King Ice Arena; `cutoff` and
`purpose` were deleted.

Remove the filled rows from `docs/PLACEHOLDERS.md`.

## How to Verify

- `pnpm run db:migrate:local && pnpm run dev`: Home info tiles, address line
  and announcement card, the order form's pickup note, and the order-received
  page (with its map preview) show the new values and read naturally in their
  sentences; every place and map link opens Google Maps at the rink.
- `pnpm run check` passes.
- After deploy: the same pages on https://balloonxbros.com.
