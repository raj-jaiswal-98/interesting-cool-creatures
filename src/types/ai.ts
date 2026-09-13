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
