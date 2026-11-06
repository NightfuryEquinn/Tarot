# Midnight Arcana

A five-card tarot ritual built with **Next.js, TypeScript, Tailwind CSS, Anime.js, and Three.js**. Static, installable, and available offline after its first complete download.

## Experience

A celestial observatory for a personal reading: set an optional intention, start and stop the shuffle at your own pace, choose five cards from the complete deck, turn them one at a time, and explore their connections. A visible four-step journey and a persistent five-card tray make the ritual easy to follow.

- All 78 original Rider–Waite–Smith illustrations, upright/reversed interpretations, advice, and shared thematic tags.
- Five positions: present situation, challenge, underlying influence, advice, and possible outcome.
- Searchable, filterable deck library with both orientations and per-card provenance.
- Complete English and Simplified Chinese interfaces and interpretations; switching languages preserves the reading.
- Offline topic-aware explanations connect all five positions, upright/reversed meanings, practical guidance, and reflection prompts. Questions remain on your device.
- A custom keyboard-accessible language dropdown, 14px minimum interface text, and aligned five-card spreads.
- Focus mode fades surrounding navigation, artwork, and promotional content while you ask, shuffle, choose, and reveal. Clear the question or finish the ritual to restore them.
- Private browser-local progress, optional synthesized ambience, reduced motion, keyboard controls, and offline installation.

## Development

Use Node.js 22.13+ or 24 and npm.

```sh
npm ci
npm run dev
npm run check
npm run build
```

The production build exports static pages to `out/`, then generates a service worker and asset manifest from the complete output. Host that directory at the root of an HTTPS origin. There is no application server, database, API key, or server action. Development does not register a service worker.

`.openai/hosting.json` retains the existing Sites identity and output directory. The GitHub integration branch is `develop`.

## Visual system and animation

The redesign uses an ink, parchment, and antique gold palette, local Cormorant Garamond and Manrope type, orbital linework, and layered card artwork. The visual references are [Star Atlas](https://staratlas.com/) for celestial depth and [Penderecki’s Garden](https://pendereckisgarden.pl/en) for a quiet, exploratory atmosphere. These are references for direction; no assets or code are copied. See [the design notes](docs/celestial-redesign.md) for implementation and QA details.

**Tailwind CSS 4** owns layout, responsive styling, ornaments, focus states, and card backs. `globals.css` contains the Tailwind import, theme tokens, local font declarations, and minimal base rules. `src/components/ui.ts` shares utility recipes. There are no bespoke component stylesheets.

**Anime.js** animates looping shuffle motion and reversed-card rotations, the HTML card fan, slow orbital motion, deck arrival, selection flights into the tray, perspective card turns, focus fades, and completed-spread/report entrances. The same HTML elements are the actual touch and keyboard targets. Reading state does not depend on WebGL or successful animation completion. The former card mesh renderer and unused Theatre timelines have been removed.

**Three.js** is lazy-loaded for decorative nebula mist, stars, and restrained bloom only. It never receives cards, questions, selections, or reveal state. The compositor applies one output color conversion. Phones use 100 stars, up to 30 fps, capped device pixel ratio 1, and a reduced bloom buffer. Desktop uses 220 stars, up to 45 fps, and capped ratio 1.4. Sustained slow frames reduce resolution and star count while retaining the glow. WebGL and Anime.js pause while hidden. All GPU resources are disposed on unmount.

The same cards, controls, and artwork remain available on mobile. The complete deck fits in overlapping curved fans: two on wide tables, three on smaller screens. All 78 cards are presented together in a responsive fan area; short screens can scroll the page so labels and controls remain readable at 14px or larger. The chosen-card tray and completed spread use straight, equal-height rows. Cards remain directly selectable by tap or click. Arrow keys move through available cards; Home and End reach the first and last available cards; Enter/Space selects. Keyboard focus recovers after selection. The whole deck is always available without relying on hover.

System reduced motion and the persisted gentle-mode control disable ambient motion and use immediate card transitions. Start/Stop shuffle still works in gentle mode; it never auto-stops. A static celestial backdrop stays visible with WebGL disabled or lost. Sound starts muted each session and creates an AudioContext only after the sound control is pressed.

## Content, state, and offline access

`src/lib/reading.ts` owns typed state, the cryptographic shuffle, validation, and the authored interpretation engine. `src/lib/topics.ts` matches broad English/Chinese question topics locally: relationships, work/study, finances, and personal growth. Blank, unmatched, or ambiguous questions use a general lens. These are reflection prompts, not semantic AI analysis; no question is sent to a service. Each report explains all five positions and their actual orientations, preserves both shared themes and tensions, and favors connections covering more of the spread. Saved version-1 readings, including older out-of-order reveals, resume without changing cards or orientations.

Shuffling uses decorative card backs until Stop is pressed. Stop commits one 78-card permutation and its orientations, after which they remain fixed. Reshuffling is available before the first selection. Shuffle animation state is transient: reloading while shuffling restores the last stable saved state, either the question or the preceding unselected deck.

The question, shuffled deck, selections, reveals, and reversal preference use `midnight-arcana.reading.v1` in localStorage. Language uses `midnight-arcana.locale.v1`; gentle mode uses `midnight-arcana.gentle`. There is no history archive or cloud synchronization. Starting another reading asks before clearing the current one. Invalid saved data is ignored, and unavailable storage falls back to the current session.

The persistent OfflineProvider caches all exported pages, navigation payloads, JavaScript chunks (including the lazy scene), artwork, fonts, and icons. Artwork accounts for 8.39 MiB. “Ready offline” appears after a complete download; interrupted downloads can be retried. Downloaded updates wait for the user's choice before replacing the active version. Browsers can evict cached data; reopening online restores it.

Install with supported browser controls. On iOS, use Safari → Share → Add to Home Screen. HTTPS or localhost is required for service workers. Both languages are cached, and Chinese uses installed system fonts.

## Verification

`npm run check` runs authored-content/state/service-worker tests plus bilingual topic recognition, complete positional explanations, connection diversity, responsive fan bounds, and DOM interaction tests. Interaction coverage includes a complete five-card ritual, manual shuffle stop and rapid clicks, reshuffle locks, question clearing and focus mode, dropdown keyboard behavior, selection boundaries, resizing without changing the reading, restart confirmation, saved-reading restoration, library filters, and upright/reversed details. TypeScript and the production build check the static export.

DOM tests are not browser layout or GPU tests. This redesign still needs visual review on real desktop/mobile browsers, hardware frame-rate measurements, screen-reader checks, install prompts, and an actual offline reload. The managed environment used for this change did not expose its supported browser-control tool, so no browser screenshot or measured device-performance claim is made.

## Artwork and credits

The illustrations are faithful public-domain scans of the original 1909 Roses & Lilies Rider–Waite–Smith deck, illustrated by Pamela Colman Smith under the direction of Arthur Edward Waite. Fonts are local Cormorant Garamond and Manrope under the SIL Open Font License. See [ASSET_SOURCES.md](ASSET_SOURCES.md), included font licenses, and [per-card source records](public/cards/sources.json).
