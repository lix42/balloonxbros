# Placeholders to fill in

Everything below is still placeholder: settings seeded in
`migrations/0001_init.sql`, and the menu's prices and stock from `0004_menu.sql`.
Confirmed so far: school = **Kirkland Middle School (KIMS)**, pickup is by name,
receipts are checked by hand in admin. Event: **Fri, Nov 13, 6pm–8pm** at
**Sno-King Ice Arena, Kirkland** (14326 124th Ave NE, Kirkland, WA 98034;
formerly called Kingsgate Skating Rink here, renamed in migration `0005`),
pre-orders end Thu, Nov 12 (in the `announcement` setting, migration `0002`).
Donations go through the Lake Washington School District site (migration
`0003`), as KIRKLAND MIDDLE SCHOOL → ASB DONATIONS with Student Name Sky Xu.
Venmo is the second way to pay, to **@huhuwen** (`venmo_handle`, migration
`0006`; editable in /admin, empty turns Venmo off).

## Event details (`settings` table)

| Key             | Placeholder              | Shown on                               |
| --------------- | ------------------------ | -------------------------------------- |
| `contact_email` | `hello@balloonxbros.com` | Footer; reply-to on confirmation email |

## Menu (`items` table)

The 14 balloons and their photos are real (migration `0004_menu.sql`). Their
names come from the photo files; **price ($10) and stock (3 each) are
placeholders**. Li sets the real names, prices and counts in `/admin` → Menu
after `0004` deploys. Don't add balloons in `/admin` before then: `0004` inserts
these ids, so one that already exists (e.g. a new "Pumpkin") makes the
migration fail and blocks the deploy.

| id                | Name            | Price | Stock |
| ----------------- | --------------- | ----- | ----- |
| `balloon-dog`     | Balloon Dog     | $10   | 3     |
| `bow-and-arrow`   | Bow and Arrow   | $10   | 3     |
| `cherries`        | Cherries        | $10   | 3     |
| `dragon`          | Dragon          | $10   | 3     |
| `flower-bracelet` | Flower Bracelet | $10   | 3     |
| `grapes`          | Grapes          | $10   | 3     |
| `idea-hat`        | Idea Hat        | $10   | 3     |
| `music-note`      | Music Note      | $10   | 3     |
| `octopus`         | Octopus         | $10   | 3     |
| `poke-ball`       | Poke Ball       | $10   | 3     |
| `pumpkin`         | Pumpkin         | $10   | 3     |
| `rainbow`         | Rainbow         | $10   | 3     |
| `seahorse`        | Seahorse        | $10   | 3     |
| `wearable-shield` | Wearable Shield | $10   | 3     |

## How to update in a PR

Production is live, so never edit an applied migration: add the next one,
e.g. `migrations/0006_content.sql` (CI runs
`wrangler d1 migrations apply --remote` before each deploy):

```sql
UPDATE settings SET value = 'Sat, Nov 21' WHERE key = 'event_date';

UPDATE items SET name = 'Puppy', price_cents = 600 WHERE id = 'balloon-dog';

INSERT INTO items (id, name, category, price_cents, stock, tint, photo_key, sort)
  VALUES ('unicorn', 'Unicorn', 'menu', 2000, 4, '#EDE3FF', '/balloons/unicorn.jpg', 150);

UPDATE items SET active = 0 WHERE id = 'dragon';   -- hide rather than delete
```

**Images:** make the square with
`uv run scripts/square-photo.py IN.jpg public/balloons/<id>.jpg` (600×600, the
whole photo over a blurred copy of itself), commit it, and set
`photo_key = '/balloons/<id>.jpg'`. A `photo_key` starting with `/` is served
as a static file; anything else is an R2 key from an admin upload. An upload
in `/admin` replaces the static path in D1 (a later commit to the file won't
show), and is stored as-is: run it through the script first, since the tile
crops non-square photos. To go back to the committed file, set `photo_key`
to the `/balloons/…` path again. Don't delete items that already have orders
(orders reference them); set `active = 0` instead.

A migration overwrites whatever it touches, including edits made in `/admin`,
so pick one place to manage each value once the site is live.
