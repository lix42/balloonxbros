-- Li (2026-11-09): call the venue by the name Google Maps uses. The kids' note
-- names the venue too; replace it there so its Maps link (which matches
-- event_place) keeps working.
UPDATE settings SET value = 'Sno-King Ice Arena, Kirkland' WHERE key = 'event_place';
UPDATE settings SET value = REPLACE(value, 'Kingsgate Skating Rink', 'Sno-King Ice Arena, Kirkland')
  WHERE key = 'announcement';
