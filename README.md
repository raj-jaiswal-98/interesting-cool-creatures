# 🪼 Interesting Cool Creatures

> A tiny, curious museum of weird life: an interactive, browser-native exploration of Earth's most extraordinary living, endangered, and extinct organisms across 250 million years of evolutionary history.

**Live site:** <https://raj-jaiswal-98.github.io/interesting-cool-creatures/>

![Architecture](https://img.shields.io/badge/Architecture-React_18_%2B_Vite_%2B_TypeScript-201E1F?style=flat-square)
![On-Device AI](https://img.shields.io/badge/AI-Chrome_Prompt_API_%2B_Transformers.js-FC4109?style=flat-square)
![Biodiversity APIs](https://img.shields.io/badge/Data-GBIF_%7C_iNaturalist_%7C_PBDB_%7C_Wikidata-5D9DC5?style=flat-square)
![Canvas Graphics](https://img.shields.io/badge/Graphics-HTML5_Canvas_2D_%2B_Particles-69B488?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-Vitest_55_Passing-success?style=flat-square)

---

## 🌟 Key Features

1. **Deterministic Daily Spotlight:**
   - Highlights a creature daily using a UTC `YYYY-MM-DD` polynomial rolling hash algorithm.
   - Synchronized worldwide with a real-time countdown timer to the next UTC midnight spotlight.

2. **Live Biodiversity Ingestion & Resolution (`CreatureResolver`):**
   - Streams and normalizes research-grade biodiversity records toward a 200–250 species target, with an **Add More** card that fetches 5–10 random creatures at a time.
   - Multi-source fallback pipeline: **GBIF**, **iNaturalist**, **Paleobiology Database (PBDB)**, and **Wikidata** with persistent IndexedDB client caching.
   - Toggleable pure live telemetry stream vs. curated historical archive.

3. **Semantic Vector Search (Transformers.js):**
   - On-device sentence embeddings with **`Xenova/all-MiniLM-L6-v2`**, run in a Web Worker (WebGPU when available, otherwise quantized `q8` WASM).
   - Catalog embeddings are precomputed at build time (`npm run build:embeddings` → `src/data/creatureEmbeddings.json`), so only the query is embedded in the browser.
   - Results blend lexical and vector rankings with **Reciprocal Rank Fusion** (`vectorIndex.fuse`), shown in the UI as the *MiniLM RRF* badge.

4. **On-Device AI & Progressive Intelligence (`ChromeAIService`):**
   - **Chrome Gemini Nano (Prompt API):** Built-in local LLM (`window.ai.languageModel`) with automatic capability detection (`localLLM`, `vision`, `embeddings`, `webGPU`).
   - **Procedural AI Fallback:** Deterministic biological speculation engine keeps everything working across all browsers and offline.
   - **Semantic Search Intent Parser:** Translates natural language queries (e.g. *"tiny alien deep sea predator"*) into structured facets (`size`, `biome`, `diet`, `unusual`, tags) with interactive UI badges.
   - **Creature Similarity Engine:** Multi-factor taxonomic, biome, trait, and epoch similarity scoring (0–100%) with comparative rationale.
   - **Client-Side Visual Analyzer:** Canvas 2D image histogram scanner computing luminance, RMS contrast, color temperature, and edge complexity.

5. **Ink Design System & Particle Ecosystem:**
   - Warm charcoal *ink* surfaces, a topographic survey-map texture behind the catalog and modal, animated film grain, and an editorial type trio (see [Design System](#-design-system)).
   - ColorThief image extraction tints the accent per creature; a palette switcher offers **Ember**, **Mint**, **Lilac**, and **Mustard**.
   - Subtle "alive" motion: breathing creature photos, a fidgeting logo mark, a blinking typewriter caret, and a circle-wipe modal entrance. All of it is disabled under `prefers-reduced-motion`.
   - 60fps Canvas 2D particle simulation tailored to biomes: Marine (bioluminescent bubbles), Volcanic (thermal embers), Forest (spore drift), Tundra (ice crystals), and Aerial (wind shears).

6. **Deep-Dive Tabbed Modal & Time-Travel Map:**
   - **Overview Tab:** Morphometrics in human units (grams, cm/mm, tons, era dates), diet, threat index, and conversational AI translation.
   - **Occurrence Map Tab:** Geographic projection plotting real-world specimen records and prehistoric fossil formations.
   - **Future Adaptation Lab:** Simulates speculative evolutionary descendants under warming (+4°C), hypoxia, radiation, or urban stressors.
   - **Creature Clash Duel Arena:** Turn-based duel engine comparing physical mass, danger level, and biome advantages.

7. **Evolutionary Timeline & Catalog:**
   - Category pills (Ocean & Deep Sea, Terrestrial & Forests, Birds & Aerial, Extreme & Desert, Polar & Tundra, Ancient Fossils) plus era filters: **Mesozoic**, **Cenozoic**, **Pleistocene**, **Holocene**, and **Modern Extant**.
   - Instant search combining lexical matches, intent tags, and semantic vector re-ranking.
   - Sort by chronology, danger level, or alphabetical name.

---

## 🎨 Design System

All tokens live in [`src/index.css`](src/index.css); the per-creature accent is injected at runtime by [`themeEngine.ts`](src/services/theme/themeEngine.ts).

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#201E1F` | Page background, cards, modal |
| `--paper` | `#F4EFE8` | Warm off-white for primary text |
| `--accent-primary` | `#FC4109` (default) | Buttons, highlights, caret; replaced per creature |
| `--tint-1..3`, `--well` | translucent off-white / black | Subtle fills, borders and inset wells |
| `--danger`, `--warn`, `--success`, `--info` | tomato, mustard, mint, blue | Status colors (threat, results, map pins) |
| `--era-*` | ochre, orange, blue, mint, lilac | Era badges |

**Typography** (Google Fonts):

- **Bricolage Grotesque** (`--font-display`): headings and body.
- **Instrument Serif** italic (`--font-serif`): scientific names.
- **Cutive Mono** (`--font-mono`): labels, stats, and the tagline.

**Surfaces.** Components use only these tokens, never literal colors (canvas drawing is the exception, since canvas can't read CSS variables; the map reads the live accent with `getComputedStyle`). `.topo-section` / `.topo-surface` add the contour texture from [`src/assets/topography.svg`](src/assets/topography.svg), a generated tile that repeats seamlessly. `.ink-surface` marks raised dark panels such as the modal tab strip and specimen column.

**Motion utilities:** `.anim-breathe`, `.anim-fidget`, `.anim-drift`, `.caret`. They use the individual `scale` / `rotate` / `translate` properties so they compose with inline `transform` hover effects. Shared easing: `cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 🏗️ Project Architecture

```text
interesting-cool-creatures/
├── .github/workflows/deploy.yml             # Build & deploy to GitHub Pages on push to master
├── public/                                  # Copied as-is into dist/
│   ├── robots.txt, sitemap.xml              # Crawler directives
│   ├── og-image.png                         # 1200×630 social share card
│   └── apple-touch-icon.png, favicon-32.png # PNG icons
├── scripts/
│   ├── buildEmbeddings.ts                   # Precompute catalog MiniLM embeddings
│   └── verify-apis.ts                       # Smoke-test external biodiversity APIs
├── src/
│   ├── components/
│   │   ├── hero/
│   │   │   ├── SpotlightHero.tsx            # Daily creature showcase
│   │   │   ├── HabitatCanvas.tsx            # Canvas 2D wrapper
│   │   │   └── HabitatParticleEngine.ts     # 60fps biome particle simulation
│   │   ├── timeline/
│   │   │   ├── ExtinctionTimeline.tsx       # Topo section: filters, search, catalog grid
│   │   │   ├── TimelineNodeCard.tsx         # Specimen preview card
│   │   │   └── AddMoreCard.tsx              # Fetches 5–10 more live creatures
│   │   └── modal/
│   │       ├── CreatureModal.tsx            # Tabbed modal container
│   │       ├── OverviewTab.tsx              # Morphometrics, taxonomy & AI translation
│   │       ├── OccurrenceMapTab.tsx         # World map occurrence projection
│   │       ├── FutureAdaptationTab.tsx      # Speculative evolutionary mutations
│   │       └── CreatureClashTab.tsx         # Turn-based ecological duel arena
│   ├── hooks/
│   │   ├── useCreature.ts                   # TanStack Query normalized resolver hook
│   │   ├── useCreatureSearch.ts             # Intent + lexical search hook
│   │   ├── useSemanticRerank.ts             # Vector re-ranking (RRF) of search results
│   │   ├── useCreatureTheme.ts              # Per-creature accent & visual analysis
│   │   └── useLiveObservations.ts           # Unified occurrence coordinates hook
│   ├── services/
│   │   ├── ai/
│   │   │   ├── chromeAIService.ts           # Gemini Nano API + capability detection
│   │   │   ├── embeddingService.ts          # Worker lifecycle & query embedding
│   │   │   ├── embedding.worker.ts          # Transformers.js pipeline (WebGPU/WASM)
│   │   │   ├── embeddingText.ts             # Model id & creature → text serializer
│   │   │   ├── vectorIndex.ts               # Dot-product search + rank fusion
│   │   │   └── proceduralSpeculationEngine.ts # Deterministic offline AI fallback
│   │   ├── api/                             # EOL, FishWatch, GBIF, iNaturalist clients
│   │   ├── cache/indexedDBCache.ts          # Client-side IndexedDB caching with TTL
│   │   ├── resolver/
│   │   │   ├── creatureResolver.ts          # Multi-source resolution & streaming
│   │   │   └── adapters/                    # GBIF, iNaturalist, PBDB, Wikidata adapters
│   │   └── theme/themeEngine.ts             # Palettes & ColorThief accent extraction
│   ├── data/
│   │   ├── creatureCatalog.ts               # Curated species catalog across all epochs
│   │   └── creatureEmbeddings.json          # Precomputed catalog vectors
│   ├── types/                               # Creature, AI, and normalized provider models
│   ├── utils/                               # Formatters, personality tags, seed hashing
│   ├── index.css                            # Ink design system & CSS tokens
│   ├── App.tsx                              # Application shell & header
│   └── main.tsx                             # Entry point
├── tests/                                   # Vitest suite (10 files, 55 tests)
├── index.html                               # SEO meta, Open Graph, JSON-LD, noscript
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (CI builds on Node 24)
- npm 9+

### Installation

```bash
git clone https://github.com/raj-jaiswal-98/interesting-cool-creatures.git
cd interesting-cool-creatures
npm install
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at `http://localhost:5173` |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | Type-check without emitting |
| `npm run build` | Type-check and build production assets into `./dist` |
| `npm run preview` | Serve the production build locally |
| `npm run build:embeddings` | Regenerate `src/data/creatureEmbeddings.json` (run after editing the catalog or `embeddingText.ts`) |
| `npm run verify-apis` | Check that the external biodiversity APIs respond |

---

## 🌐 Deployment & SEO

Pushing to `master` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and publishes `dist/` to GitHub Pages. `vite.config.ts` uses `base: './'` so assets resolve under the `/interesting-cool-creatures/` subpath.

SEO is handled statically:

- **`index.html`:** title, description, canonical URL, `robots` and `theme-color` meta, Open Graph and Twitter Card tags, a JSON-LD `WebSite` block, and a `<noscript>` fallback listing featured creatures.
- **`public/`:** `robots.txt`, `sitemap.xml`, the share image and the PNG icons.

> If the site moves to a custom domain, update the absolute URLs in `index.html` (canonical, `og:*`, `twitter:image`, JSON-LD), `public/robots.txt`, and `public/sitemap.xml`.

---

## 🧪 Testing & Validation

All 10 test files (55 tests) pass in Vitest:

- **`seedGenerator.test.ts`**: deterministic UTC date-based spotlight hashing.
- **`themeEngine.test.ts`**: luminance, contrast, and CSS property injection.
- **`chromeAI.test.ts`**: capability detection, semantic search intent, similarity scoring, and image analysis fallback.
- **`vectorIndex.test.ts`**: dot-product similarity and reciprocal rank fusion.
- **`creatureResolver.test.ts`**: multi-tier resolution, IndexedDB caching, and offline curated fallbacks.
- **`hooks.test.ts`**: search scoring and creature comparison.
- **`formatters.test.ts` & `personality.test.ts`**: human-unit formatting and personality tags.
- **`creatureCatalog.test.ts` & `creatureSimplifier.test.ts`**: schema integrity and taxonomic text simplification.
