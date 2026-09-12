# 🦎 Interesting Cool Creatures

> An interactive, browser-native exploration of Earth's most extraordinary extant, endangered, and extinct organisms across 250 million years of evolutionary history.

![Application Badge](https://img.shields.io/badge/Architecture-Client--Side_Vite-00F0FF?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square)
![On-Device AI](https://img.shields.io/badge/AI-Chrome_Prompt_API_%2B_Procedural_Fallback-10B981?style=flat-square)
![Canvas](https://img.shields.io/badge/Graphics-HTML5_Canvas_2D-F59E0B?style=flat-square)

---

## 🌟 Key Features

1. **Deterministic Daily Spotlight:**
   - Highlights a single creature daily based on a UTC `YYYY-MM-DD` polynomial rolling hash algorithm.
   - Synchronized worldwide with a real-time countdown timer to the next UTC midnight spotlight.

2. **Deep-Dive Tabbed Modal Dialog:**
   - **Overview Tab:** Morphological dimensions, dietary niches, taxonomy breakdown, and one-click "Simplify with AI".
   - **Occurrence Map Tab:** Equirectangular world map projection plotting authentic GBIF geocoordinates and fossil sites.
   - **Future Adaptation Lab:** Simulates speculative evolutionary mutations 10,000+ years into the future based on chosen ecological stressors (+4°C warming, hypoxia, solar UV, urban encroachment).
   - **Creature Clash Duel Arena:** Algorithmic turn-based battle engine comparing biological mass, threat index, and physiological weapons with victory confetti.

3. **Dynamic Color Extraction & Theming (`ThemeEngine`):**
   - Automatically decodes and extracts dominant palettes from creature imagery using ColorThief and HTML5 Canvas.
   - Injects custom CSS properties (`--accent-primary`, `--bg-glow`, `--accent-dark`) on `:root` dynamically.

4. **Atmospheric Canvas 2D Particle Ecosystem (`HabitatParticleEngine`):**
   - High-performance 60fps particle physics simulating specific creature biomes:
     - **Marine:** Bioluminescent rising bubbles and abyssal plankton drift.
     - **Volcanic:** Upward draft ember flakes and thermal ash.
     - **Forest:** Primeval Brownian spores and pollen.
     - **Tundra:** Descending crystalline ice dust with wind shear.
     - **Aerial:** Swift horizontal atmospheric wind streaks.

5. **Resilient Local AI Architecture (`ChromeAIService`):**
   - Native integration with Google Chrome's experimental **Gemini Nano** Prompt API (`window.ai.languageModel`).
   - Automated detection with transparent fallback to a deterministic **`ProceduralSpeculationEngine`** when running on non-Chrome or offline browsers.

6. **Evolutionary Timeline & Catalog:**
   - Filter by era: **Mesozoic**, **Cenozoic**, **Pleistocene**, **Holocene**, and **Modern Extant**.
   - Instant search across common names, binomial nomenclature, habitats, and diets.
   - Sort by chronology (oldest or newest first), threat level, or alphabetical name.

---

## 🏗️ Project Architecture

```
interesting-cool-creatures/
├── .github/workflows/
│   └── deploy.yml                   # Automated GitHub Pages CI/CD workflow
├── src/
│   ├── components/
│   │   ├── hero/
│   │   │   ├── SpotlightHero.jsx    # Daily creature showcase container
│   │   │   ├── HabitatCanvas.jsx    # Canvas wrapper component
│   │   │   └── HabitatParticleEngine.js # 60fps Canvas 2D particle simulation
│   │   ├── timeline/
│   │   │   ├── ExtinctionTimeline.jsx # Timeline track, era filters, and search
│   │   │   └── TimelineNodeCard.jsx # Preview card with hover lift & view transitions
│   │   └── modal/
│   │       ├── CreatureModal.jsx    # Tabbed modal dialog container
│   │       ├── OverviewTab.jsx      # Morphometrics, taxonomy & AI simplifier
│   │       ├── OccurrenceMapTab.jsx # 2D world map coordinate projection
│   │       ├── FutureAdaptationTab.jsx # Speculative mutation lab
│   │       └── CreatureClashTab.jsx # Creature duel combat arena
│   ├── data/
│   │   └── creatureCatalog.js       # Curated species catalog across all eras
│   ├── services/
│   │   ├── ai/
│   │   │   ├── chromeAIService.js   # Gemini Nano Prompt API wrapper
│   │   │   └── proceduralSpeculationEngine.js # Deterministic offline AI fallback
│   │   ├── api/
│   │   │   ├── gbifService.js       # GBIF occurrence coordinate client
│   │   │   ├── inaturalistService.js# iNaturalist taxa & photo resolver
│   │   │   ├── eolService.js        # Encyclopedia of Life descriptions
│   │   │   └── fishwatchService.js  # NOAA FishWatch marine facts
│   │   └── theme/
│   │       └── themeEngine.js       # ColorThief extraction & CSS variable injection
│   ├── utils/
│   │   └── seedGenerator.js         # Deterministic UTC YYYY-MM-DD hash utility
│   ├── index.css                    # Vanilla CSS design system & glassmorphism
│   ├── App.jsx                      # Root container with QueryClientProvider
│   └── main.jsx                     # Entry point
├── tests/                           # Vitest automated test suite
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm 9+

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/interesting-cool-creatures.git
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

### Production Build
```bash
npm run build
```
Build output is generated in `./dist`.

---

## 🧪 Testing & Validation

The test suite covers:
- **`seedGenerator.test.js`**: Validates deterministic hash stability and array bounds across varying UTC dates.
- **`themeEngine.test.js`**: Tests RGB-to-hex conversion, luminance calculations, and CSS variable injection.
- **`chromeAI.test.js`**: Confirms native AI capability detection and procedural fallback output.
- **`creatureCatalog.test.js`**: Validates schema compliance, danger ratings, and unique IDs across all entries.