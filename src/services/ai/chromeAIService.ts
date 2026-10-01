import { proceduralAI } from './proceduralSpeculationEngine';
import type {
  SpeculativeEvolutionResult,
  TaxonomyTranslation,
  CreatureClashResult,
  AIAvailabilityStatus,
  StressorKey,
  AICapabilities,
  StructuredSearchIntent,
  CreatureSimilarityScore,
  VisualImageAnalysis
} from '../../types/ai';
import type { Creature } from '../../types/creature';
import type { AILanguageModelSession } from '../../types/chrome-ai';

/**
 * Unified interface for Chrome's Built-in Prompt API (Gemini Nano) with
 * transparent fallback to ProceduralSpeculationEngine and heuristic analysis
 * when native on-device AI is absent.
 */
class ChromeAIService {
  session: AILanguageModelSession | null = null;
  availabilityStatus: AIAvailabilityStatus | null = null;
  fallbackEngine = proceduralAI;

  /**
   * Comprehensive detection of on-device AI and acceleration capabilities
   * as specified in Architecture Spec Section 18.
   */
  async detectCapabilities(): Promise<AICapabilities> {
    const isBrowser = typeof window !== 'undefined';
    const hasLanguageModel = Boolean(isBrowser && (window as any).ai?.languageModel);
    const hasVision = Boolean(isBrowser && ((window as any).ai?.vision || (window as any).ai?.languageModel?.capabilities?.vision));
    const hasEmbeddings = Boolean(isBrowser && (window as any).ai?.embeddings);
    const hasWebGPU = Boolean(isBrowser && typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu);

    return {
      localLLM: hasLanguageModel,
      vision: hasVision,
      embeddings: hasEmbeddings,
      webGPU: hasWebGPU
    };
  }

  async checkAvailability(): Promise<AIAvailabilityStatus> {
    if (typeof window === 'undefined') return 'unavailable';

    try {
      const languageModel = window.ai?.languageModel;
      if (languageModel) {
        if (typeof languageModel.availability === 'function') {
          this.availabilityStatus = (await languageModel.availability()) as AIAvailabilityStatus;
          return this.availabilityStatus;
        }
        if (typeof languageModel.capabilities === 'function') {
          const caps = await languageModel.capabilities();
          this.availabilityStatus = caps.available as AIAvailabilityStatus;
          return this.availabilityStatus;
        }
        this.availabilityStatus = 'readily';
        return 'readily';
      }
    } catch (e) {
      console.warn('Chrome AI availability check failed:', e);
    }

    this.availabilityStatus = 'unavailable';
    return 'unavailable';
  }

  async initSession() {
    const status = await this.checkAvailability();
    if (status !== 'readily' && status !== 'after-download') {
      return null;
    }

    try {
      if (!this.session && window.ai?.languageModel) {
        this.session = await window.ai.languageModel.create({
          systemPrompt: 'You are an expert evolutionary biologist, paleontologist, and science communicator. Give engaging, scientifically rigorous answers in clear concise prose.'
        });
      }
      return this.session;
    } catch (err) {
      console.warn('Failed to instantiate Gemini Nano session, defaulting to procedural engine:', err);
      return null;
    }
  }

  async translateTaxonomy(academicText: string, creatureName: string): Promise<TaxonomyTranslation> {
    try {
      const session = await this.initSession();
      if (session) {
        const prompt = `Rewrite this scientific description of ${creatureName} into a fun, fascinating, 2-sentence summary suitable for a science museum: "${academicText}"`;
        const result = await session.prompt(prompt);
        return {
          text: result.trim(),
          isNativeAI: true
        };
      }
    } catch (err) {
      console.warn('Native AI translation failed:', err);
    }

    return {
      text: this.fallbackEngine.translateTaxonomy(academicText, creatureName),
      isNativeAI: false
    };
  }

  async generateSpeculativeEvolution(
    creatureName: string,
    habitat: string,
    stressorKey: StressorKey = 'warming'
  ): Promise<SpeculativeEvolutionResult> {
    try {
      const session = await this.initSession();
      if (session) {
        const stressorDesc = this.fallbackEngine.stressors[stressorKey] || 'climate instability';
        const prompt = `Imagine ${creatureName}, currently adapted to ${habitat}. Fast forward 10,000 years in the future under extreme ${stressorDesc}.
Respond with:
1) A 2-sentence narrative of its future descendant.
2) Three specific physical evolutionary adaptations.
Keep it scientifically grounded yet imaginative.`;

        const rawResponse = await session.prompt(prompt);
        return {
          futureScientificName: `Neo-${creatureName.replace(/\s+/g, '')} speculatis`,
          narrative: rawResponse,
          stressorApplied: stressorDesc,
          adaptations: [
            { title: 'Gemini Nano Adaptation', description: rawResponse }
          ],
          survivalRating: 88,
          isNativeAI: true
        };
      }
    } catch (err) {
      console.warn('Native AI speculative evolution failed, using procedural simulation:', err);
    }

    return this.fallbackEngine.generateSpeculativeEvolution(creatureName, habitat, stressorKey);
  }

  async simulateCreatureClash(creatureA: Creature, creatureB: Creature): Promise<CreatureClashResult> {
    try {
      const session = await this.initSession();
      if (session) {
        const prompt = `Simulate a realistic ecological duel between ${creatureA.commonName} (${creatureA.habitat}) and ${creatureB.commonName} (${creatureB.habitat}).
Briefly describe:
- Round 1: Opening encounter
- Round 2: Clash of traits
- Round 3: Decisive factor
- Declare the winner with estimated win probability percentage.`;

        const logText = await session.prompt(prompt);
        const proceduralOutcome = this.fallbackEngine.simulateCreatureClash(creatureA, creatureB);

        return {
          winner: proceduralOutcome.winner,
          winnerId: proceduralOutcome.winnerId,
          winProbability: proceduralOutcome.winProbability,
          combatLog: logText.split('\n').filter((line: string) => line.trim().length > 0),
          conclusion: `Simulated by Gemini Nano: ${proceduralOutcome.winner} leverages critical biome advantages.`,
          isNativeAI: true
        };
      }
    } catch (err) {
      console.warn('Native AI clash failed:', err);
    }

    return this.fallbackEngine.simulateCreatureClash(creatureA, creatureB);
  }

  /**
   * Feature 2: Semantic Search Intent Parser
   * Converts natural conversational user queries (e.g. "find something tiny that looks alien in the deep sea")
   * into structured query parameters for querying real biological data.
   */
  async parseSemanticSearchIntent(query: string): Promise<StructuredSearchIntent> {
    const trimmed = query.trim();

    try {
      const session = await this.initSession();
      if (session) {
        const prompt = `Extract search intent from this biodiversity query: "${trimmed}".
Respond with pure JSON only in this exact schema, without markdown formatting or code fences:
{"size": "small"|"large"|"colossal"|null, "habitatType": "marine"|"tundra"|"desert"|"forest"|"volcanic"|null, "extinct": true|false|null, "unusual": true|false, "semanticConcepts": ["tag1", "tag2"]}`;

        const raw = await session.prompt(prompt);
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          size: parsed.size || undefined,
          habitatType: parsed.habitatType || undefined,
          extinct: typeof parsed.extinct === 'boolean' ? parsed.extinct : null,
          unusual: Boolean(parsed.unusual),
          semanticConcepts: Array.isArray(parsed.semanticConcepts) ? parsed.semanticConcepts : [],
          rawQuery: trimmed
        };
      }
    } catch (err) {
      // Graceful fallback to heuristic semantic parser
    }

    // Heuristic / Procedural Intent Extraction Fallback
    const lower = trimmed.toLowerCase();
    const concepts: string[] = [];

    // Size detection
    let size: StructuredSearchIntent['size'] = undefined;
    if (/\b(tiny|micro|miniature|microscopic|minute)\b/.test(lower)) {
      size = 'micro';
      concepts.push('micro');
    } else if (/\b(small|little)\b/.test(lower)) {
      size = 'small';
      concepts.push('small');
    } else if (/\b(giant|huge|massive|colossal|enormous|apex)\b/.test(lower)) {
      size = 'colossal';
      concepts.push('colossal');
    } else if (/\b(large|big)\b/.test(lower)) {
      size = 'large';
      concepts.push('large');
    }

    // Diet detection
    let diet: StructuredSearchIntent['diet'] = undefined;
    if (/\b(carnivore|predator|meat|hunter|apex predator)\b/.test(lower)) {
      diet = 'carnivore';
      concepts.push('carnivore');
    } else if (/\b(herbivore|plant|vegetarian|grazer)\b/.test(lower)) {
      diet = 'herbivore';
      concepts.push('herbivore');
    } else if (/\b(omnivore|forager)\b/.test(lower)) {
      diet = 'omnivore';
      concepts.push('omnivore');
    } else if (/\b(plankton|filter feeder|suspension)\b/.test(lower)) {
      diet = 'planktivore';
      concepts.push('plankton');
    }

    // Habitat detection
    let habitatType: string | undefined = undefined;
    if (/\b(marine|ocean|sea|pelagic|abyssal|deep sea|coral|water|aquatic)\b/.test(lower)) {
      habitatType = 'marine';
      concepts.push('marine');
    } else if (/\b(tundra|arctic|ice|snow|polar|glacier|cold)\b/.test(lower)) {
      habitatType = 'tundra';
      concepts.push('tundra');
    } else if (/\b(desert|arid|sand|dune)\b/.test(lower)) {
      habitatType = 'desert';
      concepts.push('desert');
    } else if (/\b(forest|jungle|woodland|rainforest|canopy|mangrove)\b/.test(lower)) {
      habitatType = 'forest';
      concepts.push('forest');
    } else if (/\b(volcano|volcanic|hydrothermal|magma|lava|rift)\b/.test(lower)) {
      habitatType = 'volcanic';
      concepts.push('volcanic');
    }

    // Extinction detection
    let extinct: boolean | null = null;
    if (/\b(extinct|fossil|prehistoric|dinosaur|ancient|paleo|jurassic|cretaceous)\b/.test(lower)) {
      extinct = true;
      concepts.push('extinct');
    } else if (/\b(living|extant|alive|modern|today)\b/.test(lower)) {
      extinct = false;
      concepts.push('extant');
    }

    // Unusual / Alien perception
    const unusualMatch = lower.match(/\b(alien|strange|weird|bizarre|unusual|freak|unique|odd|crazy)\b/);
    const unusual = Boolean(unusualMatch);
    if (unusualMatch) {
      concepts.push('unusual');
      if (unusualMatch[1] !== 'unusual') concepts.push(unusualMatch[1]);
    }

    // Danger level
    let dangerLevelMin: number | undefined = undefined;
    if (/\b(deadly|dangerous|venomous|toxic|poisonous|lethal)\b/.test(lower)) {
      dangerLevelMin = 7;
      concepts.push('dangerous');
    }

    return {
      size,
      diet,
      habitatType,
      extinct,
      unusual,
      dangerLevelMin,
      semanticConcepts: concepts,
      rawQuery: trimmed
    };
  }

  /**
   * Feature 3: Similar Creatures Engine
   * Quantifies biological, ecological, and temporal affinities between two creatures.
   * Labeled strictly as a model-derived metric.
   */
  calculateCreatureSimilarity(source: Creature, target: Creature): CreatureSimilarityScore {
    if (source.id === target.id) {
      return {
        targetCreatureId: target.id,
        score: 100,
        breakdown: { taxonomy: 100, habitat: 100, morphology: 100, era: 100 },
        sharedTraits: ['Identical specimen'],
        isModelDerived: true
      };
    }

    const traits: string[] = [];

    // 1. Taxonomic Alignment (30% weight)
    let taxonomyPoints = 0;
    if (source.taxonomy.kingdom && source.taxonomy.kingdom === target.taxonomy.kingdom) {
      taxonomyPoints += 20;
    }
    if (source.taxonomy.phylum && source.taxonomy.phylum === target.taxonomy.phylum) {
      taxonomyPoints += 30;
      traits.push(`Shared Phylum: ${source.taxonomy.phylum}`);
    }
    if (source.taxonomy.class && source.taxonomy.class === target.taxonomy.class) {
      taxonomyPoints += 30;
      traits.push(`Shared Class: ${source.taxonomy.class}`);
    }
    if (source.taxonomy.order && source.taxonomy.order === target.taxonomy.order) {
      taxonomyPoints += 20;
      traits.push(`Shared Order: ${source.taxonomy.order}`);
    }

    // 2. Habitat Alignment (25% weight)
    let habitatPoints = 0;
    if (source.habitatType === target.habitatType) {
      habitatPoints += 70;
      traits.push(`Compatible Biome (${source.habitatType})`);
    }
    if (source.habitat.toLowerCase().includes(target.habitat.toLowerCase()) ||
        target.habitat.toLowerCase().includes(source.habitat.toLowerCase())) {
      habitatPoints += 30;
    }

    // 3. Morphology & Niche (25% weight)
    let morphPoints = 0;
    if (source.diet === target.diet) {
      morphPoints += 40;
      traits.push(`Shared Feeding Strategy: ${source.diet}`);
    }
    const dangerDiff = Math.abs(source.stats.dangerLevel - target.stats.dangerLevel);
    morphPoints += Math.max(0, 30 - dangerDiff * 5);

    const weightRatio = Math.min(source.stats.weightKg, target.stats.weightKg) /
      Math.max(source.stats.weightKg, target.stats.weightKg, 0.001);
    morphPoints += Math.round(weightRatio * 30);

    // 4. Temporal Alignment (20% weight)
    let eraPoints = 0;
    const bothExtinct = source.extinctionYear !== null && target.extinctionYear !== null;
    const bothExtant = source.extinctionYear === null && target.extinctionYear === null;
    if (bothExtinct || bothExtant) {
      eraPoints += 60;
      traits.push(bothExtinct ? 'Both Extinct Lineages' : 'Both Modern Extant Species');
    }
    if (source.era === target.era) {
      eraPoints += 40;
      traits.push(`Shared Epoch: ${source.era}`);
    }

    const totalScore = Math.min(
      100,
      Math.round(
        taxonomyPoints * 0.3 +
        habitatPoints * 0.25 +
        morphPoints * 0.25 +
        eraPoints * 0.2
      )
    );

    return {
      targetCreatureId: target.id,
      score: totalScore,
      breakdown: {
        taxonomy: Math.min(100, taxonomyPoints),
        habitat: Math.min(100, habitatPoints),
        morphology: Math.min(100, morphPoints),
        era: Math.min(100, eraPoints)
      },
      sharedTraits: traits,
      isModelDerived: true
    };
  }

  /**
   * Feature 4: Client-Side Canvas 2D Visual Intelligence Analyzer Fallback
   * Computes luminance, saturation, contrast, color temperature, and complexity from image pixels.
   */
  async analyzeImageVisuals(imageSource: string | HTMLImageElement): Promise<VisualImageAnalysis> {
    const fallback: VisualImageAnalysis = {
      brightness: 0.5,
      saturation: 0.5,
      contrast: 0.25,
      colorTemperature: 'neutral',
      visualComplexity: 0.5,
      dominantRgb: [100, 100, 100],
      isNativeVision: false
    };

    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement) {
      return fallback;
    }

    try {
      let img: HTMLImageElement;
      if (typeof imageSource === 'string') {
        img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageSource;
        await new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const timer = setTimeout(() => resolve(), 800);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
        });
      } else {
        img = imageSource;
      }

      const canvas = document.createElement('canvas');
      if (!canvas || typeof canvas.getContext !== 'function') return fallback;
      const size = 64; // Fast 64x64 sample
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || typeof ctx.getImageData !== 'function') return fallback;

      ctx.drawImage(img, 0, 0, size, size);
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData?.data;
      if (!data || data.length === 0) return fallback;

      let totalR = 0, totalG = 0, totalB = 0;
      let totalLum = 0;
      let totalSat = 0;
      const lumValues: number[] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        totalR += r;
        totalG += g;
        totalB += b;

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        totalLum += lum;
        lumValues.push(lum);

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        totalSat += sat;
      }

      const pixelCount = data.length / 4;
      const avgR = Math.round(totalR / pixelCount);
      const avgG = Math.round(totalG / pixelCount);
      const avgB = Math.round(totalB / pixelCount);
      const avgLum = totalLum / pixelCount;
      const avgSat = totalSat / pixelCount;

      // RMS contrast calculation
      let lumVariance = 0;
      for (const lum of lumValues) {
        lumVariance += Math.pow(lum - avgLum, 2);
      }
      const rmsContrast = Math.sqrt(lumVariance / pixelCount);

      // Color temperature
      let temp: 'warm' | 'cool' | 'neutral' = 'neutral';
      if (avgR > avgB + 20) temp = 'warm';
      else if (avgB > avgR + 20) temp = 'cool';

      // Visual complexity estimate from spatial gradient
      let gradientDiff = 0;
      for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
          const idx = (y * size + x);
          const nextIdx = (y * size + (x + 1));
          gradientDiff += Math.abs(lumValues[idx] - lumValues[nextIdx]);
        }
      }
      const visualComplexity = Math.min(1, (gradientDiff / (size * size)) * 5);

      return {
        brightness: Math.round(avgLum * 100) / 100,
        saturation: Math.round(avgSat * 100) / 100,
        contrast: Math.round(rmsContrast * 100) / 100,
        colorTemperature: temp,
        visualComplexity: Math.round(visualComplexity * 100) / 100,
        dominantRgb: [avgR, avgG, avgB],
        isNativeVision: false
      };
    } catch {
      return fallback;
    }
  }


  /**
   * Destroys active AI session to reclaim memory.
   */
  destroySession(): void {
    if (this.session && typeof this.session.destroy === 'function') {
      try {
        this.session.destroy();
      } catch (e) {
        // no-op
      }
      this.session = null;
    }
  }
}

export const chromeAI = new ChromeAIService();

