#!/usr/bin/env python3
"""Stitch capture frames into a looping GIF."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

FRAMES = Path(__file__).resolve().parent / "frames"
OUT = Path(__file__).resolve().parent / "demo.gif"
# Longer holds on key beats
DURATIONS_MS = {
    "01-ready": 1400,
    "02-drafting": 900,
    "03-draft": 2200,
    "04-written": 2200,
}
MAX_WIDTH = 960


def main() -> None:
    files = sorted(FRAMES.glob("*.png"))
    if not files:
        raise SystemExit(f"No frames in {FRAMES}")

    images = []
    durations = []
    for f in files:
        im = Image.open(f).convert("P", palette=Image.ADAPTIVE, colors=128)
        if im.width > MAX_WIDTH:
            ratio = MAX_WIDTH / im.width
            im = im.resize((MAX_WIDTH, int(im.height * ratio)), Image.LANCZOS)
            im = im.convert("P", palette=Image.ADAPTIVE, colors=128)
        images.append(im)
        durations.append(DURATIONS_MS.get(f.stem, 1200))

    images[0].save(
        OUT,
        save_all=True,
        append_images=images[1:],
        duration=durations,
        loop=0,
        optimize=True,
    )
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
