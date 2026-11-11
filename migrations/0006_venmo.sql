-- Venmo as a second way to pay, next to the school donation (Li, 2026-11-10).
-- A Venmo order has no receipt file: the admin matches the buyer's Venmo
-- username and the amount against the venmo_handle account's feed. SQLite
-- can't drop NOT NULL in place, so orders is rebuilt with receipt_key and
-- receipt_type nullable, a payment_method, and venmo_username. The CHECK keeps
-- each method's proof present.
--
-- order_items references orders, and D1 can't turn foreign keys off, only
-- defer them to the end of the transaction. Dropping orders leaves its lines
-- orphaned; only inserting the parent rows into a table named orders clears
-- that, so the rows are set aside, orders is recreated under its own name and
-- refilled. (Building orders_new and renaming it would leave the violations
-- standing, and the migration would fail on commit.)
PRAGMA defer_foreign_keys = true;

CREATE TABLE orders_old AS SELECT * FROM orders;
DROP TABLE orders;

CREATE TABLE orders (
  id             TEXT PRIMARY KEY,           -- short human code, e.g. BXB-7K3Q
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT NOT NULL,
  total_cents    INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'school' CHECK (payment_method IN ('school', 'venmo')),
  receipt_key    TEXT,
  receipt_type   TEXT,
  venmo_username TEXT,
  status         TEXT NOT NULL DEFAULT 'submitted'
                 CHECK (status IN ('submitted', 'issue', 'verified', 'picked_up', 'cancelled')),
  admin_note     TEXT,
  email_sent     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (payment_method = 'school' AND receipt_key IS NOT NULL AND receipt_type IS NOT NULL
      AND venmo_username IS NULL)
    OR (payment_method = 'venmo' AND venmo_username IS NOT NULL AND receipt_key IS NULL
      AND receipt_type IS NULL)
  )
);

INSERT INTO orders (id, name, email, phone, total_cents, payment_method, receipt_key,
                    receipt_type, status, admin_note, email_sent, created_at)
  SELECT id, name, email, phone, total_cents, 'school', receipt_key, receipt_type, status,
         admin_note, email_sent, created_at
  FROM orders_old;

DROP TABLE orders_old;
CREATE INDEX orders_created ON orders (created_at DESC);

-- The Venmo account buyers pay, without the @. Empty hides the Venmo option.
INSERT INTO settings (key, value) VALUES ('venmo_handle', 'huhuwen')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;
