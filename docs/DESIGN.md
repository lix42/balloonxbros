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
     kids, for our school.", subcopy, three info tiles: When / Time / Where
     (place links to Maps), then "Address: {event_address}" as a Maps link.
     Map links search `event_address` (Google lists the rink as Sno-King Ice
     Arena, so the name alone may miss), else the place name.
   - Announcement card (dark navy): the kids' own note (`announcement`
     setting, line breaks kept; editable in admin; the `event_place` name in it
     links to Maps), link "See the donation steps" → `/donate`.
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
   - Yellow "Heads up" note: the school's site shows the receipt only once.
   - Six step cards following the real school site (Lake Washington School
     District on InTouch Receipting), each with a cropped phone screenshot from
     `public/donate/`: open the donation page (link); fill the form (KIRKLAND
     MIDDLE SCHOOL, ASB DONATIONS, the order total, Student Name Sky Xu; Buy, then the green Cart bar shows the amount: tap
     it); check the cart and Pay (Remove to start over); enter your details and Pay; pay by card (Visa or
     Mastercard); save the receipt before Done (yellow highlighted; screenshot
     / Print to PDF / Send to email from noreply@intouchpay.com). The receipt
     screenshot has the payer's details blocked out. The menu values live in
     `src/lib/school-site.ts`; the order form's reminder checks the receipt
     for its fund and student name.
   - CTA "I've donated: upload my receipt" → `/order`; secondary link back.
3. **Pre-order form** `/order`
   - Cart rows: thumbnail, name, "$X each", − count + stepper, "+ Add note"
     that reveals a text input.
   - "+ Add more balloons" link.
   - Navy summary card: N balloons, $TOTAL, "donate $TOTAL to the school, then
     drop your receipt below", link to donation steps.
   - Your details: Name; Email + Phone side by side. Saved on the device
     (localStorage `bxb-contact-v1`, `src/lib/contact-storage.ts`) so a closed
     tab keeps them; cleared once the order goes through. The receipt file is
     not saved.
   - Receipt dropzone (dashed). Once a file is chosen it turns solid accent
     green with a check, "Receipt attached", the filename and "Tap to choose a
     different file".
   - Pickup note, red "Submit pre-order".
4. **Order received** `/order/:code`
   - Three-balloon check illustration, "Order received!", summary card
     (order no., balloons, pickup date/time, place + address), map preview
     (`public/event-map.jpg`, a cropped Google Maps screenshot with its
     "Map data ©2026 Google" credit, also in the confirmation email; the place
     and the map link to Maps), yellow tip card, "Back to home".
5. **Admin** `/admin` (not in the canvas; added for operations)
   - Password login. Orders list with receipt preview, status
     (new → verified → picked up; new → receipt issue → verified; cancelled). Edit menu items
     (price, stock, active, photo) and event settings.

## Visual tokens

Implemented as the Tailwind theme in `src/styles/app.css`. Each hue has only
the steps listed (Tailwind's own red/yellow/blue/green steps are switched off),
and page code uses these names, never hex. Only artwork keeps raw hex: the
logo, the balloon drawings and the per-item tile tints.

| Token      | Steps                                                                    | Use                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| neutrals   | ground `#F4F7FF`, surface `#FFFFFF`                                      | page background; cards, header                                                                                                                        |
|            | line `#E2E7F5`, line-strong `#C9D1EA`, line-dashed `#7F8BB3`             | card borders; input borders, sold-out tile; dashed drop/placeholder boxes                                                                             |
|            | faint `#676D8C`, muted `#545A78`, ink-2 `#454B6B`, ink `#1B1F3B`         | placeholders; labels; body copy; text and dark cards                                                                                                  |
| **accent** | 50 `#F0FAF5`, 100 `#E3F5EC`, 500 `#2E9E6B`, 700 `#1E7A50`, 800 `#155C3C` | green, the interactive colour: links (700, hover 800), focus ring and icons (500), chosen/done states (100 fill, 700 border and text), drag-over (50) |
| red        | 100 `#FDE8E7`, 500 `#D93A31`, 600 `#C3322A`, 900 `#8F1F19`               | main call to action (500, hover 600), eyebrow text (600), errors (100 fill, 900 text)                                                                 |
| yellow     | 100 `#FFF3CC`, 300 `#FFD166`, 500 `#F2A900`, 900 `#3D3420`               | notes (100 fill, 500 border, 900 text); highlights on navy (300)                                                                                      |
| blue       | 100 `#E1EBFF`, 800 `#163F99`                                             | admin "Verified" badge only                                                                                                                           |
| tile tints | `#FFE3E1 #E1EBFF #FFF3CC #FFE1EE #EDE3FF #FFE9D6 #DDF4EF`                | per item (artwork)                                                                                                                                    |

Roles: `link` / `link-hover` are accent 700 / 800, and shadcn's `ring` is
accent 500, `accent` / `accent-foreground` accent 100 / 700, `primary` and
`destructive` red 500. Admin order badges: New yellow, Receipt issue red,
Verified blue, Picked up accent, Cancelled neutral.

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

See `docs/PLACEHOLDERS.md`: menu, prices, limited stock, photos.
