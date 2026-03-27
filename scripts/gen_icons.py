#!/usr/bin/env python3
"""Generate simple extension icons (stdlib only)."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    chunk = chunk_type + data
    crc = zlib.crc32(chunk) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + chunk + struct.pack(">I", crc)


def write_png_rgba(path: Path, width: int, height: int, rgba: bytes) -> None:
    if len(rgba) != width * height * 4:
        raise ValueError("rgba length mismatch")
    raw_rows = b"".join(b"\x00" + rgba[y * width * 4 : (y + 1) * width * 4] for y in range(height))
    compressed = zlib.compress(raw_rows, 9)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    signature = b"\x89PNG\r\n\x1a\n"
    data = signature + _png_chunk(b"IHDR", ihdr) + _png_chunk(b"IDAT", compressed) + _png_chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def solid_rgba(w: int, h: int, r: int, g: int, b: int, a: int = 255) -> bytes:
    pixel = bytes([r, g, b, a])
    return pixel * (w * h)


def scale_nearest(src_w: int, src_h: int, src: bytes, dst_w: int, dst_h: int) -> bytes:
    out = bytearray(dst_w * dst_h * 4)
    for y in range(dst_h):
        sy = min(src_h - 1, int(y * src_h / dst_h))
        for x in range(dst_w):
            sx = min(src_w - 1, int(x * src_w / dst_w))
            i = (sy * src_w + sx) * 4
            j = (y * dst_w + x) * 4
            out[j : j + 4] = src[i : i + 4]
    return bytes(out)


def main() -> None:
    root = Path(__file__).resolve().parent.parent / "icons"
    # Brand-ish dark tile + light "MD" hint via two-tone blocks (readable at 128px)
    w, h = 128, 128
    px = bytearray(w * h * 4)
    # Background #0f172a, accent #38bdf8
    bg = bytes([15, 23, 42, 255])
    fg = bytes([56, 189, 248, 255])
    for y in range(h):
        for x in range(w):
            i = (y * w + x) * 4
            # Rounded rect feel: center "card"
            cx, cy = x - w // 2, y - h // 2
            in_card = abs(cx) < 52 and abs(cy) < 58
            # Simple "M" block left, "D" block right (very schematic)
            left_bar = 28 <= x <= 44 and 34 <= y <= 94
            mid_slants = 44 < x < 84 and 34 <= y <= 94 and abs(x - 64) + (y - 64) // 3 < 22
            right_bar = 84 <= x <= 100 and 34 <= y <= 94
            d_ring = 58 <= (x - 92) ** 2 + (y - 64) ** 2 <= 900
            if in_card and (left_bar or mid_slants or right_bar or d_ring):
                px[i : i + 4] = fg
            else:
                px[i : i + 4] = bg

    base = bytes(px)
    sizes = [16, 32, 48, 128]
    for size in sizes:
        if size == 128:
            data = base
        else:
            data = scale_nearest(128, 128, base, size, size)
        write_png_rgba(root / f"icon{size}.png", size, size, data)
    print("Wrote", ", ".join(f"icon{s}.png" for s in sizes), "to", root)


if __name__ == "__main__":
    main()
