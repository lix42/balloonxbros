# Balloon x Bros — design spec

Source of truth for the visual design: the Claude Design canvas
"Balloon x Bros — Site Design" (https://claude.ai/artifact/XxCQyYroyUzx8EyymEZv5b).
This file records what the build follows.

## What the site does

A student fundraiser selling twist balloons for the school, in about two weeks
(late Nov 2026).

- People **pre-order** balloons on the site; they're made ahead and handed out
  at the event. Balloons are also made **on demand** at the event (no site
  flow needed for that, just a callout).
- **Payment = a donation to the school** on the school's own donation page.
  The site never takes money. The buyer uploads the donation receipt
  (screenshot / PDF / photo) as proof.
- A **limited edition** section shows items with a fixed stock count
  ("N left") and a sold-out state.

## Screens (mobile first, 390px design width)

1. **Home** `/`
   - Header: two-balloon logo + "Balloon × Bros" wordmark, "Pre-order" pill.
   - Hero: eyebrow "Fundraiser for {school}", H1 "Twisted balloons, made by
     kids, for our school.", subcopy, three info tiles: When / Time / Where.
   - Announcement card (dark navy): pre-order cutoff + what the money is for,
     link "See the donation steps" → `/donate`.
   - "How pre-ordering works": 3 numbered steps.
   - "The balloon menu": 3-col grid of tiles (tinted square, illustration or
     photo, + button bottom-left, count badge top-right when in cart), name,
     price.
   - "Limited edition": same tile on navy, star illustration, "N left" badge;
     sold-out tile greyed, struck-through price, disabled +.
   - "Want something custom?" dashed card (on-the-spot balloons).
   - Footer with contact email.
   - Sticky bottom bar: "Your order · N balloons" + red "Order →".
2. **How to donate** `/donate`
   - Back arrow header. Eyebrow "Paying for your order", H1, explanation.
   - Six step cards: open donation page (link), select school, enter total,
     submit, pay, save receipt (yellow highlighted; screenshot / print PDF /
     email to self).
   - CTA "I've donated: upload my receipt" → `/order`; secondary link back.
3. **Pre-order form** `/order`
   - Cart rows: thumbnail, name, "$X each", − count + stepper, "+ Add note"
     that reveals a text input.
   - "+ Add more balloons" link.
   - Navy summary card: N balloons, $TOTAL, "donate $TOTAL to the school, then
     drop your receipt below", link to donation steps.
   - Your details: Name; Email + Phone side by side.
   - Receipt dropzone (dashed; shows chosen filename).
   - Pickup note, red "Submit pre-order".
4. **Order received** `/order/:code`
   - Three-balloon check illustration, "Order received!", summary card
     (order no., balloons, pickup date/time, place), yellow tip card,
     "Back to home".
5. **Admin** `/admin` (not in the canvas; added for operations)
   - Password login. Orders list with receipt preview, status
     (new → verified → picked up; new → receipt issue → verified; cancelled). Edit menu items
     (price, stock, active, photo) and event settings.

## Visual tokens

| Token | Value | Use |
|---|---|---|
| ground | `#F4F7FF` | page background |
| surface | `#FFFFFF` | cards, header |
| line | `#E2E7F5` | card borders |
| ink | `#1B1F3B` | text, dark cards |
| ink-2 | `#454B6B` | body copy |
| muted | `#545A78` | labels |
| red | `#D93A31` | primary CTA (eyebrow text `#C2332B`) |
| blue | `#2E6BE6` | accent; links `#2257C9` / hover `#163F99` |
| yellow | `#F2A900`, tint `#FFF3CC`, on-navy `#FFD166` | highlights |
| tile tints | `#FFE3E1 #E1EBFF #FFF3CC #FFE1EE #EDE3FF #FFE9D6 #DDF4EF` | per item |

- Type: **Fredoka** 600/700 for headings and wordmark, **Nunito** 400–800 for body.
- Radii: cards 18–22px, tiles 18px, pills 999px, inputs 12px.
- Touch targets ≥ 44px; primary buttons 52–56px tall.
- Icons: inline stroke SVG, no emoji.

## Decisions

- School: Kirkland Middle School (KIMS).
- Pickup: by name only (order code is for reference).
- Receipts: the order form reminds buyers to check the school and amount;
  admins verify each receipt by hand and can mark an order "Receipt issue",
  then contact the buyer by email or phone.

## Still placeholder

See `docs/PLACEHOLDERS.md`: event date/time/place, cutoff, purpose, donation
URL, contact email, menu, prices, limited stock, photos.
