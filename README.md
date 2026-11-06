# Midnight Arcana

A five-card tarot ritual built with **Next.js, TypeScript, Anime.js, Three.js, and Theatre.js**. Static, installable, and available offline after its first complete download.

## Experience

- A full-screen celestial opening: one optional question, a single overview of all 78 cards, five choices, individual reveals, and a final constellation. The interpretations and deck library follow the ritual.
- Choose five cards for **present situation, challenge, underlying influence, advice, and possible outcome**.
- A continuous magical dealer shuffle, layered fans, enlarged face-down previews, confirmed selections, and 3D reveals; a complete HTML interface supports touch, keyboard navigation, reduced motion, and WebGL failures.
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

Three.js renders cards, drifting particles, nebula light, and a constellation. EffectComposer applies restrained UnrealBloomPass bloom (strength 0.35, radius 0.4, threshold 1.05), a soft vignette, subtle grain, and one output color conversion. Card textures stay below the bloom threshold. Theatre Core plays the committed `src/animation/ritual.theatre.json` sequences for arrival, shuffle/fan motion, selection, reveal, and completion. A persistent scene aligns its card meshes to the bounding boxes of semantic HTML controls, so touch and keyboard targets match the visuals. Anime.js controls DOM transitions through component-scoped instances. Each library owns different properties. Theatre Studio is a development dependency and is not imported into production; animation state can be loaded into Studio during future authoring.

Only selected cards acquire WebGL face textures. The ambient scene renders at up to 60 fps on desktop or 30 fps on mobile, capped at a device-pixel ratio of 1.5 or 1.25 respectively. Bloom uses a reduced-resolution buffer. Sustained slow frames disable bloom and reduce particle count. Rendering and audio pause while hidden. Reduce effects and the system reduced-motion setting provide the same journey with static HTML artwork. Context loss switches to the HTML interface without changing the reading.

Optional ambience and reveal tones are synthesized locally with Web Audio. Sound starts muted each session and AudioContext is only created after pressing the sound control. The card state remains independent of animation, and every transition can be skipped safely. Saved version-1 readings, including out-of-order reveals from the original interface, resume correctly.

## Offline and local data

A persistent OfflineProvider registers the service worker independently of page navigation. The service worker caches every exported page, navigation payload, JavaScript chunk, artwork file, font, and icon. Artwork accounts for 8.39 MiB. “Ready offline” appears after successful installation. Interrupted downloads can be retried. Downloaded updates wait for the user to choose the update before replacing the active version.

The question, shuffled deck, selections, reveal progress, and reversal preference are stored under `midnight-arcana.reading.v1` in localStorage. There is no history archive or cloud synchronization. Starting a new reading clears the question and cards. Invalid saved state is ignored; unavailable storage falls back to the current session. Browsers can evict cached data; reopening online restores the download.

Install using supported browser install controls. On iOS, use Safari → Share → Add to Home Screen. HTTPS or localhost is required for service workers.

## Artwork and credits

The illustrations are faithful public-domain scans of the original 1909 Roses & Lilies Rider–Waite–Smith deck, illustrated by Pamela Colman Smith under the direction of Arthur Edward Waite. Fonts are local Cormorant Garamond and Manrope under the SIL Open Font License. See [ASSET_SOURCES.md](ASSET_SOURCES.md), included font licenses, and [per-card source records](public/cards/sources.json).

## Verification

Automated tests cover dataset completeness, local images, unique draws, reversals, selection limits, saved-state recovery, mixed and single-arcana relationships, Theatre timeline endpoints, sequential reveals, compatibility with saved readings, and service-worker installation/update/navigation behavior. Production compilation checks the static export and TypeScript.

Browser checks still required for a release: desktop/mobile rendering, actual WebGL interactions and context loss, keyboard/screen-reader behavior, reduced motion, install prompts, and a complete offline reload. The implementation environment did not expose the supported browser QA runtime; automated tests do not replace those browser checks.

The dealer table shows all 78 cards in three curved rows on desktop, six on phones, or seven on very narrow screens. Hover, focus, or tap previews a face-down card; “Choose this card” confirms it into a five-slot tray. Arrow keys move between cards; Tab reaches the confirmation button, and Escape clears the preview. The 3.2-second Theatre dealer sequence gathers, cuts, interleaves, squares, and spreads the same meshes. Completion callbacks unlock selection and advance after the fifth card settles. Reduced motion and WebGL fallback use the same HTML controls without waiting for scene animation.

## Languages

English and Simplified Chinese are bundled locally, including all 78 names, 156 interpretations with advice, reading connections, library search, and offline/install UI. The English / 简体中文 selector persists in `midnight-arcana.locale.v1`; first use follows the browser language, falling back to English. Switching language preserves the existing `midnight-arcana.reading.v1` reading and never changes shuffle order, orientations, or relationship scoring. Original artwork lettering is preserved. Chinese uses installed system fonts, so it needs no external font request. Both languages are included in the static PWA cache.
