-- Menu items. stock NULL = unlimited (regular menu); a number = limited edition.
CREATE TABLE items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('menu', 'limited')),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock       INTEGER CHECK (stock IS NULL OR stock >= 0),
  glyph       TEXT,          -- built-in illustration key, used when no photo
  tint        TEXT,          -- tile background color
  photo_key   TEXT,          -- R2 key of an uploaded photo, or a /static path in public/
  active      INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id           TEXT PRIMARY KEY,           -- short human code, e.g. BXB-7K3Q
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT NOT NULL,
  total_cents  INTEGER NOT NULL,
  receipt_key  TEXT NOT NULL,
  receipt_type TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'submitted'
               CHECK (status IN ('submitted', 'issue', 'verified', 'picked_up', 'cancelled')),
  admin_note   TEXT,
  email_sent   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX orders_created ON orders (created_at DESC);

CREATE TABLE order_items (
  order_id         TEXT NOT NULL REFERENCES orders (id),
  item_id          TEXT NOT NULL REFERENCES items (id),
  name             TEXT NOT NULL,          -- snapshot at order time
  unit_price_cents INTEGER NOT NULL,
  qty              INTEGER NOT NULL CHECK (qty > 0),
  note             TEXT
);
CREATE INDEX order_items_order ON order_items (order_id);

-- Event details shown on the site, editable from /admin.
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Placeholder content until the real details are known (see docs/DESIGN.md).
INSERT INTO settings (key, value) VALUES
  ('school_name', 'Kirkland Middle School (KIMS)'),
  ('event_date', '[DATE]'),
  ('event_time', '[TIME]'),
  ('event_place', '[PLACE]'),
  ('cutoff', '[CUTOFF DATE]'),
  ('purpose', '[WHAT THE MONEY IS FOR]'),
  ('donation_url', 'https://example.org/donate'),
  ('contact_email', 'hello@balloonxbros.com'),
  ('orders_open', '1');

INSERT INTO items (id, name, category, price_cents, stock, glyph, tint, sort) VALUES
  ('dog',       'Balloon Dog', 'menu',    500, NULL, 'dog',       '#FFE3E1', 10),
  ('sword',     'Sword',       'menu',    500, NULL, 'sword',     '#E1EBFF', 20),
  ('flower',    'Flower',      'menu',    500, NULL, 'flower',    '#FFF3CC', 30),
  ('heart',     'Heart Wand',  'menu',    500, NULL, 'heart',     '#FFE1EE', 40),
  ('crown',     'Crown',       'menu',    500, NULL, 'crown',     '#EDE3FF', 50),
  ('butterfly', 'Butterfly',   'menu',    500, NULL, 'butterfly', '#FFE9D6', 60),
  ('bouquet',   'Bouquet',     'menu',    800, NULL, 'bouquet',   '#DDF4EF', 70),
  ('star-gold', '[LIMITED ITEM 1]', 'limited', 1500, 5, 'star-gold', '#1B1F3B', 110),
  ('star-pink', '[LIMITED ITEM 2]', 'limited', 1500, 5, 'star-pink', '#1B1F3B', 120),
  ('star-blue', '[LIMITED ITEM 3]', 'limited', 1500, 0, 'star-blue', '#1B1F3B', 130);
