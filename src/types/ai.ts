export interface EvolutionAdaptation {
  title: string;
  description: string;
}

export interface SpeculativeEvolutionResult {
  futureScientificName: string;
  narrative: string;
  stressorApplied: string;
  adaptations: EvolutionAdaptation[];
  survivalRating: number;
  isNativeAI?: boolean;
  isProcedural?: boolean;
}

export interface TaxonomyTranslation {
  text: string;
  isNativeAI: boolean;
}

export interface CreatureClashResult {
  winner: string;
  winnerId: string;
  winProbability: number;
  combatLog: string[];
  conclusion: string;
  isNativeAI?: boolean;
  isProcedural?: boolean;
}

export type AIAvailabilityStatus = 'readily' | 'after-download' | 'unavailable' | 'downloadable' | 'downloading';

export type StressorKey = 'warming' | 'hypoxia' | 'radiation' | 'urban';

export interface AICapabilities {
  localLLM: boolean;
  vision: boolean;
  embeddings: boolean;
  webGPU: boolean;
}

export interface StructuredSearchIntent {
  size?: 'micro' | 'small' | 'medium' | 'large' | 'colossal';
  diet?: 'carnivore' | 'herbivore' | 'omnivore' | 'planktivore' | 'scavenger';
  habitatType?: string;
  extinct?: boolean | null;
  semanticConcepts: string[];
  dangerLevelMin?: number;
  unusual?: boolean;
  rawQuery: string;
}

export interface CreatureSimilarityScore {
  targetCreatureId: string;
  score: number; // 0 to 100
  breakdown: {
    taxonomy: number;
    habitat: number;
    morphology: number;
    era: number;
  };
  sharedTraits: string[];
  isModelDerived: boolean;
}

export interface VisualImageAnalysis {
  brightness: number; // 0 to 1
  saturation: number; // 0 to 1
  contrast: number; // RMS contrast
  colorTemperature: 'warm' | 'cool' | 'neutral';
  visualComplexity: number; // 0 to 1
  dominantRgb: [number, number, number];
  isNativeVision: boolean;
}

export type EmbeddingStatus = 'idle' | 'loading' | 'ready' | 'unsupported';

export interface EmbeddingIndexFile {
  header: { model: string; dim: number; textVersion: number };
  ids: string[];
  vectors: number[][];
}


