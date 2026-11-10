---
title: Balloon photos
status: done
deps: [menu-content]
summary: square photos in public/balloons/, photo_key set by migration
done: 2026-11-09
---
# Balloon photos

## Change (2026-11-09)

Done inside `menu-content` (same PR): Li's 14 photos are in
`public/balloons/<id>.jpg` and `0004_menu.sql` sets their `photo_key`. The
photos are 3:2, so each is fitted whole into a 600×600 square with a blurred
copy filling the edges (18–45 KB each).

## Goal

Menu tiles show real photos of the kids' balloons instead of the drawn
placeholder illustrations.

## Design

- Commit square photos, about 600×600 JPG or WebP, small enough to load fast
  on phones (aim for under ~100 KB each), to `public/balloons/<item-id>.<ext>`
  using the final ids from `menu-content`.
- A new migration sets `photo_key = '/balloons/<item-id>.<ext>'` per item. A
  leading `/` means a static file; R2 keys are for admin uploads.
- Items without a photo keep their `glyph` illustration, so photos can land
  in batches.

## How to Verify

- Locally: each tile shows its photo, cropped square, on its tint, with
  nothing stretched. Check at 390px width.
- Network tab: the images are served from `/balloons/` and each is a sensible
  size.
- After deploy: the photos load on https://balloonxbros.com on a phone.
