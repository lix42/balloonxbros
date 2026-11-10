-- The real balloons, from Li's photos (2026-11-09). There is no separate
-- limited-edition section any more: every balloon has a stock count. Names
-- come from the photo files; $10 and 3 each are placeholders Li sets in /admin.
-- Photos are committed under public/balloons/ (a leading "/" = static file).
INSERT INTO items (id, name, category, price_cents, stock, glyph, tint, photo_key, sort) VALUES
  ('balloon-dog',     'Balloon Dog',     'menu', 1000, 3, NULL, '#FFF3CC', '/balloons/balloon-dog.jpg',     10),
  ('bow-and-arrow',   'Bow and Arrow',   'menu', 1000, 3, NULL, '#E1EBFF', '/balloons/bow-and-arrow.jpg',   20),
  ('cherries',        'Cherries',        'menu', 1000, 3, NULL, '#FFE3E1', '/balloons/cherries.jpg',        30),
  ('dragon',          'Dragon',          'menu', 1000, 3, NULL, '#DDF4EF', '/balloons/dragon.jpg',          40),
  ('flower-bracelet', 'Flower Bracelet', 'menu', 1000, 3, NULL, '#FFE1EE', '/balloons/flower-bracelet.jpg', 50),
  ('grapes',          'Grapes',          'menu', 1000, 3, NULL, '#EDE3FF', '/balloons/grapes.jpg',          60),
  ('idea-hat',        'Idea Hat',        'menu', 1000, 3, NULL, '#FFE9D6', '/balloons/idea-hat.jpg',        70),
  ('music-note',      'Music Note',      'menu', 1000, 3, NULL, '#FFF3CC', '/balloons/music-note.jpg',      80),
  ('octopus',         'Octopus',         'menu', 1000, 3, NULL, '#FFE9D6', '/balloons/octopus.jpg',         90),
  ('poke-ball',       'Poke Ball',       'menu', 1000, 3, NULL, '#FFE3E1', '/balloons/poke-ball.jpg',       100),
  ('pumpkin',         'Pumpkin',         'menu', 1000, 3, NULL, '#FFE9D6', '/balloons/pumpkin.jpg',         110),
  ('rainbow',         'Rainbow',         'menu', 1000, 3, NULL, '#E1EBFF', '/balloons/rainbow.jpg',         120),
  ('seahorse',        'Seahorse',        'menu', 1000, 3, NULL, '#FFE1EE', '/balloons/seahorse.jpg',        130),
  ('wearable-shield', 'Wearable Shield', 'menu', 1000, 3, NULL, '#EDE3FF', '/balloons/wearable-shield.jpg', 140);

-- Retire the placeholder seed items: delete the ones no order references,
-- hide the rest (order_items keeps a foreign key to items).
DELETE FROM items
  WHERE id IN ('dog', 'sword', 'flower', 'heart', 'crown', 'butterfly', 'bouquet',
               'star-gold', 'star-pink', 'star-blue')
    AND id NOT IN (SELECT item_id FROM order_items);
UPDATE items SET active = 0
  WHERE id IN ('dog', 'sword', 'flower', 'heart', 'crown', 'butterfly', 'bouquet',
               'star-gold', 'star-pink', 'star-blue');
