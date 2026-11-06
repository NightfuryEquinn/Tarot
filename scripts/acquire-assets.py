#!/usr/bin/env python3
"""Acquire original 1909 RWS scans and OFL fonts. Requires Pillow.

Run from any directory: python scripts/acquire-assets.py
Downloads are a development-time operation; the application only uses local files.
"""
from concurrent.futures import ThreadPoolExecutor
from hashlib import md5
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json
import sys
import time

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
USE_MIRROR = "--mirror" in sys.argv
SOURCE_RECORDS = ROOT / "public" / "cards" / "sources.json"
PREVIOUS = {record["id"]: record for record in json.loads(SOURCE_RECORDS.read_text())} if SOURCE_RECORDS.exists() else {}
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MidnightArcanaAssetBuilder/1.0)"}
MAJORS = [
    "Fool", "Magician", "High_Priestess", "Empress", "Emperor", "Hierophant",
    "Lovers", "Chariot", "Strength", "Hermit", "Wheel_of_Fortune", "Justice",
    "Hanged_Man", "Death", "Temperance", "Devil", "Tower", "Star", "Moon",
    "Sun", "Judgement", "World",
]


def get(url: str) -> bytes:
    for attempt in range(5):
        try:
            with urlopen(Request(url, headers=HEADERS), timeout=45) as response:
                return response.read()
        except HTTPError as error:
            if attempt == 4:
                raise
            delay = int(error.headers.get("Retry-After", 3 + attempt * 4))
            print(f"HTTP {error.code}; respecting server retry delay of {delay}s", flush=True)
            time.sleep(delay)
        except Exception:
            if attempt == 4:
                raise
            time.sleep(1 + attempt * 2)
    raise RuntimeError("unreachable")


def card_tasks():
    for number, name in enumerate(MAJORS):
        yield f"major-{number:02}", f"RWS1909_-_{number:02}_{name}.jpeg", number
    for suit_index, suit in enumerate(("Wands", "Cups", "Swords", "Pentacles")):
        for number in range(1, 15):
            yield f"{suit.lower()}-{number:02}", f"RWS1909_-_{suit}_{number:02}.jpeg", 22 + suit_index * 14 + number - 1


def acquire_card(task):
    identifier, filename, index = task
    # Wikimedia's public file paths use the MD5 of its normalized filename.
    digest = md5(filename.encode()).hexdigest()
    original = f"https://upload.wikimedia.org/wikipedia/commons/{digest[0]}/{digest[:2]}/{quote(filename)}"
    destination = ROOT / "public" / "cards" / f"{identifier}.webp"
    retrieved_from = PREVIOUS.get(identifier, {}).get("retrieved_from", original)
    if not destination.exists():
        retrieved_from = f"https://sparkmxy.github.io/tarot/assets/rws-1909/{index:02}.webp" if USE_MIRROR else original
        source = ImageOps.exif_transpose(Image.open(BytesIO(get(retrieved_from)))).convert("RGB")
        width = 480
        source = source.resize((width, round(source.height * width / source.width)), Image.Resampling.LANCZOS)
        source.save(destination, "WEBP", quality=83, method=6)
        print(f"Acquired {identifier}", flush=True)
        time.sleep(0.5 if USE_MIRROR else 3)
    with Image.open(destination) as image:
        assert image.width == 480 and image.height > image.width, identifier
    return {
        "id": identifier,
        "file": f"/cards/{identifier}.webp",
        "source": f"https://commons.wikimedia.org/wiki/File:{quote(filename)}",
        "original": original,
        "retrieved_from": retrieved_from,
        "license": "Public domain — original 1909 artwork; faithful scan",
    }


def main():
    (ROOT / "public" / "cards").mkdir(parents=True, exist_ok=True)
    (ROOT / "public" / "fonts").mkdir(parents=True, exist_ok=True)
    fonts = {
        "cormorant-garamond-latin.woff2": "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2",
        "cormorant-garamond-italic-latin.woff2": "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSo.woff2",
        "manrope-latin.woff2": "https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSg.woff2",
        "CormorantGaramond-OFL.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt",
        "Manrope-OFL.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt",
    }
    for filename, url in fonts.items():
        destination = ROOT / "public" / "fonts" / filename
        if not destination.exists():
            destination.write_bytes(get(url))
    print("Local fonts ready", flush=True)
    with ThreadPoolExecutor(max_workers=2 if USE_MIRROR else 1) as executor:
        records = list(executor.map(acquire_card, card_tasks()))
    assert len(records) == 78
    (ROOT / "public" / "cards" / "sources.json").write_text(json.dumps(records, indent=2) + "\n")
    size = sum((ROOT / "public" / "cards" / f"{record['id']}.webp").stat().st_size for record in records)
    print(f"Acquired {len(records)} cards at 480px wide ({size / 1024 / 1024:.2f} MiB) and 3 local variable font files.")


if __name__ == "__main__":
    main()
