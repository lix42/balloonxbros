-- The school's real donation page (Lake Washington School District on
-- InTouch Receipting), from Li 2026-11-09. /donate walks through it step by step.
UPDATE settings
  SET value = 'https://wa-lakewashington-lite.intouchreceipting.com/default'
  WHERE key = 'donation_url';
