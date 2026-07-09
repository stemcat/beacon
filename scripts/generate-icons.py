#!/usr/bin/env python3
"""Generate favicon.ico and apple-touch-icon.png (an amber beacon/sun matching
the 🔆 brand mark) with no image-library dependency — pure struct + zlib."""

import math
import struct
import zlib
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "public"

AMBER = (245, 158, 11)      # sun core/rays (#f59e0b)
AMBER_DEEP = (217, 119, 6)  # ray tips (#d97706)
CREAM = (250, 249, 246)     # apple-touch background (--bg light)


def draw_sun(size: int, background=None):
    """Return RGBA rows for a sun: solid core + 8 rays, ~antialiased."""
    c = (size - 1) / 2
    core_r = size * 0.22
    ray_in = size * 0.30
    ray_out = size * 0.46
    ray_w = max(size * 0.055, 1.1)

    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            dx, dy = x - c, y - c
            dist = math.hypot(dx, dy)
            cov = 0.0
            color = AMBER
            # core disc with 1px soft edge
            if dist <= core_r + 0.7:
                cov = max(cov, min(1.0, core_r + 0.7 - dist))
            # 8 rays
            ang = math.atan2(dy, dx)
            for k in range(8):
                ra = k * math.pi / 4
                # distance from the ray's center line
                perp = abs(dist * math.sin(ang - ra))
                along_ok = ray_in <= dist * math.cos(ang - ra) <= ray_out
                if along_ok and perp <= ray_w + 0.7:
                    cov = max(cov, min(1.0, ray_w + 0.7 - perp))
                    color = AMBER_DEEP if dist > ray_out - size * 0.06 else AMBER
            if background is not None:
                r = round(background[0] * (1 - cov) + color[0] * cov)
                g = round(background[1] * (1 - cov) + color[1] * cov)
                b = round(background[2] * (1 - cov) + color[2] * cov)
                row.append((r, g, b, 255))
            else:
                row.append((*color, round(cov * 255)))
        rows.append(row)
    return rows


def png_bytes(rows) -> bytes:
    size = len(rows)
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def ico_bytes(png: bytes, size: int) -> bytes:
    # Modern ICO: a single PNG-encoded 32x32 entry.
    header = struct.pack("<HHH", 0, 1, 1)
    s = 0 if size >= 256 else size
    entry = struct.pack("<BBBBHHII", s, s, 0, 0, 1, 32, len(png), 22)
    return header + entry + png


PUBLIC.mkdir(exist_ok=True)
(PUBLIC / "favicon.ico").write_bytes(ico_bytes(png_bytes(draw_sun(32)), 32))
(PUBLIC / "apple-touch-icon.png").write_bytes(png_bytes(draw_sun(180, background=CREAM)))
print("wrote public/favicon.ico and public/apple-touch-icon.png")
