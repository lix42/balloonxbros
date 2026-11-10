-- Real event details from Li (2026-11-09), and the Home announcement as one
-- editable setting. The announcement replaces the cutoff/purpose template, so
-- those two settings go. event_address is new: Google Maps lists the rink
-- as Sno-King Ice Arena, so map links search the address. donation_url is the donation-steps task.
UPDATE settings SET value = 'Fri, Nov 13' WHERE key = 'event_date';
UPDATE settings SET value = '6pm–8pm' WHERE key = 'event_time';
UPDATE settings SET value = 'Kingsgate Skating Rink' WHERE key = 'event_place';
INSERT INTO settings (key, value)
  VALUES ('event_address', '14326 124th Ave NE, Kirkland, WA 98034')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value;
DELETE FROM settings WHERE key IN ('cutoff', 'purpose');
INSERT INTO settings (key, value) VALUES (
  'announcement',
  'Hi! We’ll be selling fun and unique balloon animals for a Kirkland Middle School fundraiser. We have always loved making and playing with these designs so we hope to extend that love to you! Pre order ends 11/12 with pickup at Kingsgate Skating Rink on 11/13. We’ll also have a table at the rink on 11/13 for in person orders! All proceeds will be donated.
-Sky and Ocean'
) ON CONFLICT(key) DO UPDATE SET value = excluded.value;
