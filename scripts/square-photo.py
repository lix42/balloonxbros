# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=11"]
# ///
"""Make a square menu photo: the whole photo fitted into a square over a
blurred, dimmed copy of itself (how the photos in public/balloons/ are made).

    uv run scripts/square-photo.py IN.jpg public/balloons/<item-id>.jpg

Commit the result, or upload it in /admin (uploads are stored as-is and the
tile crops anything that isn't square).
"""

import argparse

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def square_photo(photo: Image.Image, size: int, blur: float, dim: float) -> Image.Image:
    photo = ImageOps.exif_transpose(photo).convert("RGB")
    # Background: the photo scaled to cover the square, blurred and dimmed.
    background = ImageOps.fit(photo, (size, size), Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(blur))
    background = ImageEnhance.Brightness(background).enhance(dim)
    # Foreground: the whole photo scaled to fit, centred.
    foreground = ImageOps.contain(photo, (size, size), Image.Resampling.LANCZOS)
    background.paste(
        foreground, ((size - foreground.width) // 2, (size - foreground.height) // 2)
    )
    return background


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--size", type=int, default=600, help="edge in px (600)")
    parser.add_argument("--blur", type=float, default=24, help="blur radius in px (24)")
    parser.add_argument("--dim", type=float, default=0.8, help="background brightness (0.8)")
    parser.add_argument("--quality", type=int, default=80, help="JPEG quality (80)")
    args = parser.parse_args()

    with Image.open(args.input) as photo:
        out = square_photo(photo, args.size, args.blur, args.dim)
    out.save(args.output, "JPEG", quality=args.quality, optimize=True, progressive=True)
    print(f"{args.output}: {args.size}x{args.size}")


if __name__ == "__main__":
    main()
