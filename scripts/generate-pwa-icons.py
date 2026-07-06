#!/usr/bin/env python3
"""Generate Marqai PWA icons (192, 512, maskable-512) as PNGs.

Uses Pillow to render a teal rounded-square with a white "M" wordmark.
No external assets needed.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/public/icons")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Marqai brand palette
TEAL = (13, 148, 136, 255)        # #0d9488
TEAL_DARK = (15, 118, 110, 255)   # #0f766e
AMBER = (245, 158, 11, 255)       # #f59e0b
WHITE = (255, 255, 255, 255)

def find_font(size: int) -> ImageFont.FreeTypeFont:
    """Find a usable bold sans-serif font."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_icon(size: int, maskable: bool = False) -> Image.Image:
    """Draw a Marqai icon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Maskable icons need a full-bleed background (no transparency in the
    # safe zone). Standard icons can have rounded corners.
    if maskable:
        # Full-bleed background
        draw.rectangle([0, 0, size, size], fill=TEAL)
        # Safe zone is the central 80% — draw the "M" there
        margin = int(size * 0.18)
    else:
        # Rounded-square background with teal gradient feel (just solid teal)
        radius = int(size * 0.18)
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=TEAL)
        margin = int(size * 0.15)

    # Draw a thin amber underline accent (Marqai brand mark)
    accent_y = int(size * 0.78)
    accent_x1 = margin + int(size * 0.05)
    accent_x2 = size - margin - int(size * 0.05)
    accent_thickness = max(2, int(size * 0.025))
    draw.rectangle(
        [accent_x1, accent_y, accent_x2, accent_y + accent_thickness],
        fill=AMBER,
    )

    # Draw the "M" wordmark centered
    font_size = int(size * 0.55)
    font = find_font(font_size)
    text = "M"
    # Measure text
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2 - bbox[0]
        ty = (size - th) // 2 - bbox[1] - int(size * 0.05)
    except AttributeError:
        # Older Pillow fallback
        tw, th = draw.textsize(text, font=font)
        tx = (size - tw) // 2
        ty = (size - th) // 2 - int(size * 0.05)
    draw.text((tx, ty), text, font=font, fill=WHITE)

    return img

def main() -> None:
    # 192x192 standard
    icon192 = draw_icon(192, maskable=False)
    icon192.save(OUT_DIR / "icon-192.png", "PNG")
    print(f"Wrote icon-192.png ({icon192.size})")

    # 512x512 standard
    icon512 = draw_icon(512, maskable=False)
    icon512.save(OUT_DIR / "icon-512.png", "PNG")
    print(f"Wrote icon-512.png ({icon512.size})")

    # 512x512 maskable (full-bleed)
    icon_maskable = draw_icon(512, maskable=True)
    icon_maskable.save(OUT_DIR / "icon-maskable-512.png", "PNG")
    print(f"Wrote icon-maskable-512.png ({icon_maskable.size})")

    # Also a favicon-sized 32x32 for browser tabs
    icon32 = draw_icon(32, maskable=False)
    icon32.save(OUT_DIR / "icon-32.png", "PNG")
    print(f"Wrote icon-32.png ({icon32.size})")

    # Apple touch icon (180x180, no transparency, solid bg)
    apple = Image.new("RGBA", (180, 180), TEAL)
    adraw = ImageDraw.Draw(apple)
    font = find_font(int(180 * 0.55))
    try:
        bbox = adraw.textbbox((0, 0), "M", font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (180 - tw) // 2 - bbox[0]
        ty = (180 - th) // 2 - bbox[1] - 9
    except AttributeError:
        tw, th = adraw.textsize("M", font=font)
        tx = (180 - tw) // 2
        ty = (180 - th) // 2 - 9
    adraw.text((tx, ty), "M", font=font, fill=WHITE)
    adraw.rectangle([36, 140, 144, 146], fill=AMBER)
    apple.save(OUT_DIR / "apple-touch-icon.png", "PNG")
    print(f"Wrote apple-touch-icon.png ({apple.size})")

if __name__ == "__main__":
    main()
