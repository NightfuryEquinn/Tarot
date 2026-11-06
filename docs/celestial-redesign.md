# Celestial reading redesign

## Direction

A midnight observatory: ink blue, warm antique gold, airy serif headlines, restrained orbital geometry, and a tangible HTML card deck. The existing name, original card artwork, authored interpretations, five positions, and bilingual content remain intact.

References:
- [Star Atlas](https://staratlas.com/): depth and luminous space, with its [Awwwards Users’ Choice recognition](https://medium.com/star-atlas/star-atlas-wins-prestigious-site-of-the-year-award-29a732730af5).
- [Penderecki’s Garden](https://pendereckisgarden.pl/en): contemplative atmosphere and discovery; [award archive](https://www.uicoach.io/inspirations/award-winning/pendereckis-garden).

The experience keeps normal scrolling and clear, always-visible controls. It has no entry loader, cursor replacement, hover-only interaction, or mandatory sound.

## Interaction

1. An optional question and reversal preference accompany the opening artwork. Typing a question fades unrelated content; clearing it restores that content without changing the reversal preference.
2. Start a continuous shuffle, repeat your question, and explicitly Stop when ready. The deck and orientations are committed only on Stop, independently of animation timing. Shuffle again is available until the first selection.
3. All 78 face-down cards are visible together in responsive overlapping fans. The page may scroll on short screens to preserve readable labels and controls. The chosen-card tray identifies all five positions. Tapping selects directly.
4. Reveal each card in place using Anime.js on HTML faces. Reversed cards rotate through 180 degrees while labels stay upright. Continue after the turn, or skip the animation.
5. See five aligned cards, then open the topic-aware connected interpretation report. Surrounding content returns on completion.

Interface text is at least 14px, with 16px question input. Shared content gutters align the header, main content, and footer. Two-column progress labels on narrow screens, wrapping tray labels, and flexible controls prevent text from colliding. The curved selection fans remain intentional; selected-card rows are straight.

The custom language dropdown supports arrows, Home/End, typeahead, Enter/Space, Escape, outside-click dismissal, and normal Tab navigation. Changing languages preserves questions, deck order, orientations, selections, and reveals.

Saved readings and library navigation remain available; restarting is explicit and confirmed. The library and report use the same typography, palette, spacing, focus treatment, and modal patterns.

## Technical boundaries

- Tailwind utilities own visual styles; dynamic inline values provide measured fan geometry and animated transforms.
- Cards never enter a WebGL scene. `CelestialScene` owns only decorative mist, stars, and bloom.
- The backdrop is readable before JavaScript loads and when GPU effects are unavailable.
- Rendering pauses while hidden. Reduced motion and gentle mode avoid mounting Three.js.
- Responsive quality settings preserve the composition and bloom on mobile while lowering resolution and star count. These are performance safeguards, not a guarantee of identical FPS on every device.
- The authored card meanings remain the source of truth. A local, bilingual topic matcher adds a question lens; ambiguous questions receive a general interpretation. All five positions contribute to the summary, with position-specific explanations and practical reflection prompts. Connection selection retains overlapping relationship types and favors coverage of the spread.
- Saved reading version 1 is unchanged. Shuffle is transient, hidden secondary content is inert, and neither motion nor topic recognition changes card identities or orientations.

## Verification and remaining device checks

Automated checks: all 78 rotated cards stay within the measured fan area; resizing updates keyboard rows without changing the reading; full ritual in a reduced-motion DOM environment; manual shuffle stop, rapid clicks, reshuffle locking, and transient-shuffle recovery; focus fades and clear-question restoration; custom dropdown keyboard behavior; reversed rotation final states and animation cleanup; bilingual topic fallback and complete deterministic explanations; connection diversity; keyboard traversal; reset/cancel; partial-reading recovery; language switching without mutation; library controls; existing state/content/service-worker tests; TypeScript; production static export.

The managed environment lacks `cua_repl.js`, required by its supported browser-preview workflow. Browser visual QA was therefore not run. Before merging, review at 320, 390, 768, and 1440px widths, in portrait and landscape. Check real-device scroll/animation performance, forced WebGL context loss, dynamic reduced-motion changes, keyboard/screen-reader flow, install/update dialogs, and a complete offline reload after the ready indicator.

The repository retains its existing hosting identity. No change to the live Site's access policy is included.
