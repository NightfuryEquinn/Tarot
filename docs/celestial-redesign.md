# Celestial reading redesign

## Direction

A midnight observatory: ink blue, warm antique gold, airy serif headlines, restrained orbital geometry, and a tangible HTML card deck. The existing name, original card artwork, authored interpretations, five positions, and bilingual content remain intact.

References:
- [Star Atlas](https://staratlas.com/): depth and luminous space, with its [Awwwards Users’ Choice recognition](https://medium.com/star-atlas/star-atlas-wins-prestigious-site-of-the-year-award-29a732730af5).
- [Penderecki’s Garden](https://pendereckisgarden.pl/en): contemplative atmosphere and discovery; [award archive](https://www.uicoach.io/inspirations/award-winning/pendereckis-garden).

The experience keeps normal scrolling and clear, always-visible controls. It has no entry loader, cursor replacement, hover-only interaction, or mandatory sound.

## Interaction

1. An optional question and reversal preference accompany the opening artwork.
2. All 78 face-down cards are visible together in responsive overlapping fans, fitted to the available selection-screen height. The chosen-card tray identifies all five positions. Tapping selects directly.
3. Reveal each card in place using Anime.js on HTML faces. Continue after the turn, or skip the animation.
4. See the five-card constellation, then open the original connected interpretation report.

Saved readings and library navigation remain available; restarting is explicit and confirmed. The library and report use the same typography, palette, spacing, focus treatment, and modal patterns.

## Technical boundaries

- Tailwind utilities own visual styles; dynamic inline values provide measured fan geometry and animated transforms.
- Cards never enter a WebGL scene. `CelestialScene` owns only decorative mist, stars, and bloom.
- The backdrop is readable before JavaScript loads and when GPU effects are unavailable.
- Rendering pauses while hidden. Reduced motion and gentle mode avoid mounting Three.js.
- Responsive quality settings preserve the composition and bloom on mobile while lowering resolution and star count. These are performance safeguards, not a guarantee of identical FPS on every device.
- No content/data files or interpretation algorithms change.

## Verification and remaining device checks

Automated checks: all 78 rotated cards stay within the measured fan area; resizing updates keyboard rows without changing the reading; full ritual in a reduced-motion DOM environment; keyboard traversal; reset/cancel; partial-reading recovery; English/Chinese switching without mutation; library filtering, empty search, and orientation controls; existing shuffle/state/content/service-worker tests; TypeScript; production static export.

The managed environment lacks `cua_repl.js`, required by its supported browser-preview workflow. Browser visual QA was therefore not run. Before merging, review at 320, 390, 768, and 1440px widths, in portrait and landscape. Check real-device scroll/animation performance, forced WebGL context loss, dynamic reduced-motion changes, keyboard/screen-reader flow, install/update dialogs, and a complete offline reload after the ready indicator.

The repository retains its existing hosting identity. No change to the live Site's access policy is included.
