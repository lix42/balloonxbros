# Balloon x Bros — design spec

Source of truth for the visual design: the Claude Design canvas
"Balloon x Bros — live site"
(https://claude.ai/artifact/2DQZZ5YrRu9yuVYR18NQsC), a copy of the built site
that Li restyled on 2026-11-09 (yellow header and cards, blue headings, pastel
logo, Montserrat body). The original canvas, "Balloon x Bros — Site Design"
(https://claude.ai/artifact/XxCQyYroyUzx8EyymEZv5b), is the earlier design. This file records what the build follows.

## What the site does

A student fundraiser selling twist balloons for the school, in about two weeks
(late Nov 2026).

- People **pre-order** balloons on the site; they're made ahead and handed out
  at the event. Balloons are also made **on demand** at the event (no site
  flow needed for that, just a callout).
- **Payment, two ways** (the site itself never takes money):
  - **A donation to the school** on the school's own donation page. The buyer
    uploads the donation receipt (screenshot / PDF / photo) as proof.
  - **Venmo** to the `venmo_handle` setting's account (@huhuwen, Li
    2026-11-10). No receipt: the buyer gives their Venmo username, and the
    admin matches it and the amount in that account's Venmo feed. Venmo has no
    API for personal accounts, so checking is manual either way. An empty
    `venmo_handle` hides the option and refuses Venmo orders.
- Every balloon is made in a fixed number: each tile shows "N left" and a
  sold-out state. (There used to be a separate "Limited edition" section; it
  went in `menu-content`, and the `items.category` column is unused since.)

## Screens (mobile first, 390px design width)

1. **Home** `/`
   - Header (yellow 200): pastel two-balloon logo + "Balloon × Bros" wordmark
     (blue 300, orange ×), "Pre-order" pill (blue 300 border).
   - Hero: centred H1 "Balloon Sale Benefiting Kirkland Middle School" (30px
     semibold), subcopy, three yellow info tiles: When / Time / Where
     (place links to Maps), then "Address: {event_address}" as a Maps link.
     Map links search `event_address` (more precise than the venue name),
     else the place name.
   - Announcement card (yellow 200, blue 700 label): the kids' own note (`announcement`
     setting, line breaks kept; editable in admin; the `event_place` name in it
     links to Maps in blue 700), link "See the donation steps" → `/donate`.
   - "How pre-ordering works": 3 numbered steps.
   - "The balloon menu": 3-col grid of tiles (tinted square, photo or
     illustration, + button bottom-left, − button bottom-right once the
     balloon is in the order (removes one), yellow "N left" badge top-right,
     count badge top-left when in cart), name, price. Sold-out tile greyed,
     struck-through price, disabled +. Photos are square `public/balloons/<id>.jpg`
     (600×600; the whole 3:2 photo fitted in, with a blurred copy filling the
     edges so no balloon is cut off; made by `scripts/square-photo.py`). Tapping a photo opens a popup
     (`src/components/ui/dialog.tsx`, Base UI Dialog): the photo large, name,
     price, "N left · N in your order", and a red "+ Add to order" button
     (disabled when sold out or all left are in the order). Esc, ✕ or a tap
     outside closes it. Tiles with only a drawing don't open one.
   - "Want something custom?" dashed card (on-the-spot balloons).
   - Footer with contact email.
   - Sticky bottom bar: "Your order · N balloons" + red "Order →".
2. **How to donate** `/donate`
   - `?total=<cents>` sets the amount (the order page's "Show me the donation
     steps" link passes it; `src/lib/donate-search.ts`). Without it the page
     says "your order total" and doesn't guess from the cart.
   - The Home header. Eyebrow "Paying for your order", H1, then (when
     `venmo_handle` is set) a "Rather pay with Venmo?" card above the school
     steps: send the amount to @handle (a Venmo link with the amount filled in
     from `total`; without it the buyer types the amount) and skip the steps,
     then choose Venmo on the order form. Then the explanation.
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
   - Back-arrow header "Your pre-order" (yellow 200).
   - Yellow 200 summary card: N balloons, $TOTAL, "pay $TOTAL one of two ways"
     (or, with Venmo off, "donate $TOTAL to the school, then drop your receipt
     below"), links "How to donate to the school" (→ `/donate?total=…`) and,
     with Venmo on, "Donate $TOTAL via Venmo" (the pre-filled Venmo link).
   - Your details: Name; Email + Phone side by side. Saved on the device
     (localStorage `bxb-contact-v1`, `src/lib/contact-storage.ts`) so a closed
     tab keeps them; cleared once the order goes through. The receipt file is
     not saved.
   - "How did you pay?": two radio cards, "Donated to the school" and "Venmo
     @handle" (only with Venmo on; otherwise the school path shows directly).
   - School: receipt dropzone (dashed). Once a file is chosen it turns solid
     accent green with a check, "Receipt attached", the filename and "Tap to
     choose a different file". Then the yellow check-your-receipt note.
   - Venmo: card "1. Send $TOTAL to @handle" with an ink "Donate $TOTAL via
     Venmo" button (Venmo's payment link, `venmo.com/<handle>?txn=pay&amount=…&note=…`,
     amount and note pre-filled); "2. Your Venmo username" input (the @ is
     optional); yellow "Pay first, then submit" note.
   - Pickup note, red "Submit pre-order".
4. **Order received** `/order/:code`
   - Three-balloon check illustration, "Order received!", summary card
     (order no., balloons, pickup date/time, place + address), map preview
     (`public/event-map.jpg`, a cropped Google Maps screenshot with its
     "Map data ©2026 Google" credit, also in the confirmation email; the place
     and the map link to Maps), yellow tip card, "Back to home".
5. **Admin** `/admin` (not in the canvas; added for operations)
   - Password login. Orders list with the receipt link (school) or "Venmo:
     look for @username paying $TOTAL", status
     (new → verified → picked up; new → payment issue → verified; cancelled). Edit menu items
     (name, price, stock — always a number, 0 = sold out — active, photo) and event settings.

## Visual tokens

Implemented as the Tailwind theme in `src/styles/app.css`. Each hue has only
the steps listed (Tailwind's own red/yellow/blue/green steps are switched off),
and page code uses these names, never hex. Only artwork keeps raw hex: the
logo, the balloon drawings and the per-item tile tints.

| Token      | Steps                                                                     | Use                                                                                                                                |
| ---------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| neutrals   | ground `#F4F7FF`, surface `#FFFFFF`                                       | page background; cards                                                                                                             |
|            | line `#E2E7F5`, line-strong `#C9D1EA`, line-dashed `#7F8BB3`              | card borders; input borders, sold-out tile; dashed drop/placeholder boxes                                                          |
|            | faint `#676D8C`, muted `#545A78`, ink-2 `#454B6B`, ink `#1B1F3B`          | placeholders; admin labels; all body text, labels and links on the public pages; dark buttons, badges and step numbers             |
| **accent** | 50 `#F0FAF5`, 100 `#E3F5EC`, 500 `#2E9E6B`, 700 `#1E7A50`, 800 `#155C3C`  | green: focus ring and icons (500), step 2 (700), chosen/done states (100 fill, 700 border and text), drag-over (50)                |
| red        | 100 `#FDE8E7`, 500 `#D93A31`, 600 `#C3322A`, 900 `#8F1F19`                | main call to action (500, hover 600), eyebrow text (600), errors (100 fill, 900 text)                                              |
| yellow     | 100 `#FFF3CC`, 200 `#FFF39F`, 300 `#FFD166`, 500 `#F2A900`, 900 `#3D3420` | notes (100 fill, 500 border); header, info tiles, announcement and order-total cards (200); "N left" badge (300); admin (900 text) |
| blue       | 100 `#E1EBFF`, 300 `#71B2FF`, 700 `#1C4FC2`, 800 `#163F99`                | headings, wordmark, Pre-order pill border (300); announcement label and venue link (700); admin "Verified" badge (100/800)         |
| orange     | 500 `#FF8A1F`                                                             | the wordmark's ×                                                                                                                   |
| tile tints | `#FFE3E1 #E1EBFF #FFF3CC #FFE1EE #EDE3FF #FFE9D6 #DDF4EF`                 | per item (artwork)                                                                                                                 |

Roles: `heading` is blue 300 (every h1–h3; at about 2.4:1 on the page it is
below the 3:1 large-text contrast minimum, Li's choice); `foreground` (body
text) and `link` are ink-2, `link-hover` ink; links and link-style buttons are
underlined. shadcn's `ring` is
accent 500, `accent` / `accent-foreground` accent 100 / 700, `primary` and
`destructive` red 500. Admin order badges: New yellow, Payment issue red,
Verified blue, Picked up accent, Cancelled neutral.

- Type: **Fredoka** 600/700 for headings and wordmark, **Montserrat** 400–800 for body.
- Logo (artwork, also `public/favicon.svg`): pink `#FF8FC7` and light blue
  `#8FD3FF` balloons on an orange `#FF8A1F` string.
- Radii: cards 18–22px, tiles 18px, pills 999px, inputs 12px.
- Touch targets ≥ 44px; primary buttons 52–56px tall.
- Icons: inline stroke SVG, no emoji.

## Decisions

- School: Kirkland Middle School (KIMS).
- Pickup: by name only (order code is for reference).
- Payments: the order form reminds buyers to check the school and amount (or,
  for Venmo, to pay before submitting); admins verify each receipt or Venmo
  payment by hand and can mark an order "Payment issue", then contact the
  buyer by email or phone.

## Still placeholder

See `docs/PLACEHOLDERS.md`: balloon names, prices and stock counts.
