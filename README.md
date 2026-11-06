# Midnight Arcana

A five-card tarot ritual built with **Next.js, TypeScript, Anime.js, Three.js, and Theatre.js**. Static, installable, and available offline after its first complete download.

## Experience

- A midnight-blue and gold reading space, responsive from small phones to desktop.
- Choose five cards for **present situation, challenge, underlying influence, advice, and possible outcome**.
- Animated 3D shuffle, fan, selection, and reveals; a complete HTML interface supports touch, keyboard navigation, reduced motion, and WebGL failures.
- All 78 Rider–Waite–Smith cards with original upright/reversed interpretations, advice, and shared thematic tags.
- Connected readings explain shared themes, tensions, suits, ranks, and Major-to-Minor relationships using local authored rules.
- Searchable card library with orientation controls and per-card provenance.

## Development

Use Node.js 22.13+ or 24 and npm.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

The production build exports static pages to `out/`, then generates a service worker and an asset manifest from the complete output. Host that directory at the root of an HTTPS origin. There is no application server, database, API key, or server action. The development server does not register a service worker.

`.openai/hosting.json` records the Sites deployment identity and static output directory. Source is developed against the repository's `develop` branch. The hosted Site is owner-private by default.

## How it works

`src/lib/reading.ts` owns the typed reading state, cryptographic shuffle, validation, and interpretation engine. State changes are independent of animation completion. The selected cards, orientations, and revealed status remain stable across reloads. Questions stay local and provide personal context; no AI service interprets them.

Three.js renders card meshes and textures. Theatre Core plays the committed `src/animation/ritual.theatre.json` sequences for shuffle/fan motion, selection, and reveal. Anime.js controls DOM transitions through component-scoped instances. Each library owns different properties. Theatre Studio is a development dependency and is not imported into production; animation state can be loaded into Studio during future authoring.

Only selected cards acquire WebGL face textures. Rendering is capped at a device-pixel ratio of 1.5, scheduled when something changes, and paused while hidden. Context loss switches to the HTML interface without changing the reading.

## Offline and local data

The service worker caches every exported page, navigation payload, JavaScript chunk, artwork file, font, and icon. Artwork accounts for 8.39 MiB. “Ready offline” appears after successful installation. Interrupted downloads can be retried. Downloaded updates wait for the user to choose the update before replacing the active version.

The question, shuffled deck, selections, reveal progress, and reversal preference are stored under `midnight-arcana.reading.v1` in localStorage. There is no history archive or cloud synchronization. Starting a new reading clears the question and cards. Invalid saved state is ignored; unavailable storage falls back to the current session. Browsers can evict cached data; reopening online restores the download.

Install using supported browser install controls. On iOS, use Safari → Share → Add to Home Screen. HTTPS or localhost is required for service workers.

## Artwork and credits

The illustrations are faithful public-domain scans of the original 1909 Roses & Lilies Rider–Waite–Smith deck, illustrated by Pamela Colman Smith under the direction of Arthur Edward Waite. Fonts are local Cormorant Garamond and Manrope under the SIL Open Font License. See [ASSET_SOURCES.md](ASSET_SOURCES.md), included font licenses, and [per-card source records](public/cards/sources.json).

## Verification

Automated tests cover dataset completeness, local images, unique draws, reversals, selection limits, saved-state recovery, mixed and single-arcana relationships, Theatre timeline endpoints, and service-worker installation/update/navigation behavior. Production compilation checks the static export and TypeScript.

Browser checks still required for a release: desktop/mobile rendering, actual WebGL interactions and context loss, keyboard/screen-reader behavior, reduced motion, install prompts, and a complete offline reload. The implementation environment did not expose the supported browser QA runtime; automated tests do not replace those browser checks.
