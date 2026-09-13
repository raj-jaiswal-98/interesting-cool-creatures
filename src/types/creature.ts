export type HabitatType = 'marine' | 'volcanic' | 'forest' | 'tundra' | 'aerial';

export type Era = 'Mesozoic' | 'Cenozoic' | 'Pleistocene' | 'Holocene' | 'Modern';

export interface CreatureStats {
  lengthMeters: number;
  weightKg: number;
  dangerLevel: number;
  rarityScore: number;
}

export interface CreatureTaxonomy {
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
}

export interface CreatureCoordinate {
  lat: number;
  lng: number;
  country: string;
  year?: number | null;
  basisOfRecord?: string;
}

export interface ThemePalette {
  primary: string;
  darkMuted: string;
  glow: string;
  textAccent: string;
  surface: string;
}

export interface Creature {
  id: string;
  commonName: string;
  scientificName: string;
  extinctionYear: number | null;
  era: Era;
  habitat: string;
  habitatType: HabitatType;
  photoUrl: string;
  description: string;
  diet: string;
  stats: CreatureStats;
  taxonomy: CreatureTaxonomy;
  coordinates: CreatureCoordinate[];
  themePalette: ThemePalette;
  wikiUrl: string;
}
