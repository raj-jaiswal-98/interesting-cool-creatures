# 🦎 Interesting Cool Creatures

> An interactive, browser-native exploration of Earth's most extraordinary extant, endangered, and extinct organisms across 250 million years of evolutionary history.

![Architecture](https://img.shields.io/badge/Architecture-React_18_%2B_Vite_%2B_TypeScript-blue?style=flat-square)
![On-Device AI](https://img.shields.io/badge/AI-Chrome_Prompt_API_%2B_Procedural_Fallback-10B981?style=flat-square)
![Biodiversity APIs](https://img.shields.io/badge/Data-GBIF_%7C_iNaturalist_%7C_PBDB_%7C_Wikidata-00F0FF?style=flat-square)
![Canvas Graphics](https://img.shields.io/badge/Graphics-HTML5_Canvas_2D_%2B_Particles-F59E0B?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-Vitest_31_Passing-success?style=flat-square)

---

## 🌟 Key Features

1. **Deterministic Daily Spotlight:**
   - Highlights a creature daily using a UTC `YYYY-MM-DD` polynomial rolling hash algorithm.
   - Synchronized worldwide with a real-time countdown timer to the next UTC midnight spotlight.

2. **Live Biodiversity Ingestion & Resolution (`CreatureResolver`):**
   - Automatically streams and normalizes research-grade biodiversity records up to 100+ species.
   - Multi-source fallback pipeline: **GBIF**, **iNaturalist**, **Paleobiology Database (PBDB)**, and **Wikidata** with persistent IndexedDB client caching.
   - Toggleable pure live telemetry stream vs. curated historical archive.

3. **On-Device AI & Progressive Intelligence (`ChromeAIService`):**
   - **Chrome Gemini Nano (Prompt API):** Built-in zero-latency local LLM (`window.ai.languageModel`) with automatic capability detection (`localLLM`, `vision`, `embeddings`, `webGPU`).
   - **Procedural AI Fallback:** Deterministic biological speculation engine ensures full functionality across all browsers and offline environments.
   - **Semantic Search Intent Parser:** Translates natural language queries (e.g. *"tiny alien deep sea predator"*) into structured facets (`size`, `biome`, `diet`, `unusual`, tags) with interactive UI badges.
   - **Model-Derived Creature Similarity Engine:** Multi-factor taxonomic, biome, trait, and epoch similarity scoring (0–100%) with comparative biological rationale.
   - **Client-Side Visual Intelligence Analyzer:** Fast Canvas 2D image histogram scanner computing luminance, RMS contrast, color temperature, and edge complexity.

4. **Neo-Brutalist Theme Engine & Particle Ecosystem:**
   - ColorThief image extraction with automatic contrast clamping and CSS variable injection (`:root`).
   - One-click brutalist colorway switcher: **Acid Lime**, **Solar Amber**, **Infrared Red**, and **Stark Mono**.
   - 60fps Canvas 2D particle simulation tailored to biomes: Marine (bioluminescent bubbles), Volcanic (thermal embers), Forest (spore drift), Tundra (ice crystals), and Aerial (wind shears).

5. **Deep-Dive Tabbed Modal & Time-Travel Map:**
   - **Overview Tab:** Morphometrics, diet, threat index, and conversational AI translation.
   - **Occurrence Map Tab:** Geographic projection plotting real-world specimen records and prehistoric fossil formations.
   - **Future Adaptation Lab:** Simulates speculative evolutionary descendants under warming (+4°C), hypoxia, radiation, or urban stressors.
   - **Creature Clash Duel Arena:** Algorithmic turn-based duel engine comparing physical mass, danger level, and biome advantages.

6. **Evolutionary Timeline & Catalog:**
   - Filter by era: **Mesozoic**, **Cenozoic**, **Pleistocene**, **Holocene**, and **Modern Extant**.
   - Instant search combining lexical matches and on-device semantic intent tags.
   - Sort by chronology, danger level, or alphabetical name.

---

## 🏗️ Project Architecture

```
interesting-cool-creatures/
├── src/
│   ├── components/
│   │   ├── hero/
│   │   │   ├── SpotlightHero.tsx            # Daily creature showcase container
│   │   │   ├── HabitatCanvas.tsx            # Canvas 2D wrapper
│   │   │   └── HabitatParticleEngine.ts     # 60fps biome particle simulation
│   │   ├── timeline/
│   │   │   ├── ExtinctionTimeline.tsx       # Timeline track, era filters & AI search
│   │   │   └── TimelineNodeCard.tsx         # Preview card with view transitions
│   │   └── modal/
│   │       ├── CreatureModal.tsx            # Two-column modal container
│   │       ├── OverviewTab.tsx              # Morphometrics, taxonomy & AI translation
│   │       ├── OccurrenceMapTab.tsx         # World map occurrence projection
│   │       ├── FutureAdaptationTab.tsx      # Speculative evolutionary mutations
│   │       └── CreatureClashTab.tsx         # Turn-based ecological duel arena
│   ├── hooks/
│   │   ├── useCreature.ts                   # TanStack Query normalized resolver hook
│   │   ├── useCreatureSearch.ts             # Semantic intent + lexical search hook
│   │   ├── useCreatureTheme.ts              # Dynamic theme & visual intelligence hook
│   │   └── useLiveObservations.ts          # Unified occurrence coordinates hook
│   ├── services/
│   │   ├── ai/
│   │   │   ├── chromeAIService.ts           # Gemini Nano API + capability detection
│   │   │   └── proceduralSpeculationEngine.ts # Deterministic offline AI fallback
│   │   ├── cache/
│   │   │   └── indexedDBCache.ts            # Client-side IndexedDB caching with TTL
│   │   ├── resolver/
│   │   │   ├── creatureResolver.ts          # Multi-source resolution & streaming
│   │   │   └── adapters/                    # GBIF, iNaturalist, PBDB, Wikidata adapters
│   │   └── theme/
│   │       └── themeEngine.ts               # Neo-brutalist theme & ColorThief engine
│   ├── data/
│   │   └── creatureCatalog.ts               # Curated species catalog across all epochs
│   ├── types/
│   │   ├── ai.ts                            # AI capabilities, intent, & similarity types
│   │   ├── creature.ts                      # Core Creature schema & theme palette
│   │   └── normalizedCreature.ts            # Canonical multi-provider creature model
│   ├── index.css                            # Neo-brutalist design system & CSS tokens
│   ├── App.tsx                              # Application shell & telemetry header
│   └── main.tsx                             # Entry point
├── tests/                                   # Vitest automated test suite (31 tests)
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- npm 9+

### Installation
```bash
# Clone the repository
git clone https://github.com/raj-jaiswal-98/interesting-cool-creatures.git
cd interesting-cool-creatures

# Install dependencies
npm install
```

### Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Tests
```bash
npm test
```

### Type Checking & Production Build
```bash
npm run build
```
Production assets are generated in `./dist`.

---

## 🧪 Testing & Validation

All 7 test suites pass in Vitest:
- **`seedGenerator.test.ts`**: Verifies deterministic UTC date-based spotlight hashing.
- **`themeEngine.test.ts`**: Validates luminance, contrast, and CSS property injection.
- **`chromeAI.test.ts`**: Tests capability detection, semantic search intent, similarity scoring, and image analysis fallback.
- **`creatureResolver.test.ts`**: Tests multi-tier resolution, IndexedDB caching, and offline curated fallbacks.
- **`hooks.test.ts`**: Tests semantic biodiversity search scoring and creature comparison.
- **`creatureCatalog.test.ts` & `creatureSimplifier.test.ts`**: Verifies schema integrity and taxonomic text simplification.