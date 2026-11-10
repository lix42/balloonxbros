# Placeholders to fill in

Everything below is placeholder content in `migrations/0001_init.sql`.
Confirmed so far: school = **Kirkland Middle School (KIMS)**, pickup is by name,
receipts are checked by hand in admin. Event: **Fri, Nov 13, 6pm–8pm** at
**Kingsgate Skating Rink** (14326 124th Ave NE, Kirkland, WA 98034; Google
Maps lists it as Sno-King Ice Arena), pre-orders end Thu, Nov 12 (in the `announcement` setting,
migration `0002`). Donations go through the Lake Washington School District
site (migration `0003`), as KIRKLAND MIDDLE SCHOOL → ASB DONATIONS with
Student Name Sky Xu.

## Event details (`settings` table)

| Key             | Placeholder              | Shown on                               |
| --------------- | ------------------------ | -------------------------------------- |
| `contact_email` | `hello@balloonxbros.com` | Footer; reply-to on confirmation email |

## Menu (`items` table)

| id          | Name             | Price | Stock        | Image      |
| ----------- | ---------------- | ----- | ------------ | ---------- |
| `dog`       | Balloon Dog      | $5    | unlimited    | drawn icon |
| `sword`     | Sword            | $5    | unlimited    | drawn icon |
| `flower`    | Flower           | $5    | unlimited    | drawn icon |
| `heart`     | Heart Wand       | $5    | unlimited    | drawn icon |
| `crown`     | Crown            | $5    | unlimited    | drawn icon |
| `butterfly` | Butterfly        | $5    | unlimited    | drawn icon |
| `bouquet`   | Bouquet          | $8    | unlimited    | drawn icon |
| `star-gold` | [LIMITED ITEM 1] | $15   | 5            | drawn star |
| `star-pink` | [LIMITED ITEM 2] | $15   | 5            | drawn star |
| `star-blue` | [LIMITED ITEM 3] | $15   | 0 (sold out) | drawn star |

## How to update in a PR

**Before the first production deploy:** edit the `INSERT` rows in
`migrations/0001_init.sql` directly.

**After it has been deployed:** add a new migration, e.g.
`migrations/0002_content.sql` (CI runs `wrangler d1 migrations apply --remote`
before each deploy):

```sql
UPDATE settings SET value = 'Sat, Nov 21' WHERE key = 'event_date';

UPDATE items SET name = 'Puppy', price_cents = 600, photo_key = '/balloons/dog.jpg'
  WHERE id = 'dog';

INSERT INTO items (id, name, category, price_cents, stock, tint, photo_key, sort)
  VALUES ('unicorn', 'Unicorn', 'limited', 2000, 4, '#EDE3FF', '/balloons/unicorn.jpg', 140);

UPDATE items SET active = 0 WHERE id = 'star-blue';   -- hide rather than delete
```

**Images:** commit square photos (about 600×600 JPG/WebP) to
`public/balloons/<id>.jpg` and set `photo_key = '/balloons/<id>.jpg'`. A
`photo_key` starting with `/` is served as a static file; anything else is an
R2 key from an admin upload. Don't delete items that already have orders
(orders reference them); set `active = 0` instead.

A migration overwrites whatever it touches, including edits made in `/admin`,
so pick one place to manage each value once the site is live.
