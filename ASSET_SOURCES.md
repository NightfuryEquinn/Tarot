# Artwork and fonts

## Tarot artwork

The 78 card faces are faithful scans of an original **1909 “Roses & Lilies” Rider–Waite–Smith deck**, illustrated by **Pamela Colman Smith** under the direction of **Arthur Edward Waite**. The original deck was scanned by **Saskia Jansen** from her personal collection and is hosted on Wikimedia Commons.

- Collection: https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)
- Example provenance and public-domain notice: https://commons.wikimedia.org/wiki/File:RWS1909_-_00_Fool.jpeg
- Original scan source credited by Commons: https://blog.goo.ne.jp/valet_de_coupe/e/10b39ab41d023e6b44bb7d7b7209c772
- License: public domain. These are original 1909 artworks and faithful reproductions, not a modern recolored edition. Commons documents the original work as public domain in its source country and in the United States.
- Per-card source pages and original image URLs: [`public/cards/sources.json`](public/cards/sources.json).
- Some images were retrieved from a public-domain image mirror at https://sparkmxy.github.io/tarot/assets/rws-1909/ while Wikimedia requested a download cooldown. That site's image module identifies these as local copies of the same complete 1909 scans: https://sparkmxy.github.io/tarot/art.mjs. Only the public-domain images were used. `retrieved_from` records the actual download URL for every card.

The local WebP derivatives are resized to 480 pixels wide without cropping, recoloring, or alteration of the illustrations. A few original scans retain small differences in aspect ratio and paper tone.

## Fonts

All fonts are bundled locally and served without requests to Google Fonts at runtime. These are Latin-subset variable WOFF2 files distributed by Google Fonts under the **SIL Open Font License 1.1**. The license permits redistribution and web embedding. The full copyright and license texts accompany the fonts.

| Font | Local file | Weights / style | License |
| --- | --- | --- | --- |
| Cormorant Garamond | `public/fonts/cormorant-garamond-latin.woff2` | 300–700, normal | `public/fonts/CormorantGaramond-OFL.txt` |
| Cormorant Garamond | `public/fonts/cormorant-garamond-italic-latin.woff2` | 300–700, italic | Same license |
| Manrope | `public/fonts/manrope-latin.woff2` | 200–800, normal | `public/fonts/Manrope-OFL.txt` |

- Cormorant repository: https://github.com/google/fonts/tree/main/ofl/cormorantgaramond
- Manrope repository: https://github.com/google/fonts/tree/main/ofl/manrope
- Exact binary URLs and reproducible acquisition: [`scripts/acquire-assets.py`](scripts/acquire-assets.py).

Run the acquisition script with Python and Pillow installed to reproduce the bundled files. It respects Wikimedia's `Retry-After` responses. Add `--mirror` to acquire the same public-domain scans from the documented mirror instead. Network access is needed only for asset acquisition, not for using the finished application.
