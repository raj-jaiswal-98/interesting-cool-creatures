/**
 * Normalized Creature Data Model
 * Aligned with Section 13 & 21 of ext/interesting-cool-creatures-dynamic-data-ai-architecture.md
 * 
 * Unifies scientific biodiversity telemetry from GBIF, iNaturalist, PBDB, Wikidata,
 * and curated fallback data into a single coherent schema.
 */

export interface CreatureIdentity {
  commonName: string;
  scientificName: string;
  taxonKey?: string | number | null;
  synonyms: string[];
}

export interface CreatureTaxonomyHierarchy {
  kingdom?: string | null;
  phylum?: string | null;
  class?: string | null;
  order?: string | null;
  family?: string | null;
  genus?: string | null;
}

export interface CreatureBiologyMetrics {
  size?: number | null; // length in meters
  sizeDescription?: string | null;
  mass?: number | null; // weight in kg
  massDescription?: string | null;
  lifespan?: string | null;
  diet?: string | null;
  locomotion?: string | null;
  dangerLevel?: number | null;
  rarityScore?: number | null;
}

export interface CreatureHabitatContext {
  biome?: string | null;
  environment?: string | null;
  depth?: string | null;
  temperature?: string | null;
  habitatType?: 'marine' | 'volcanic' | 'forest' | 'tundra' | 'aerial' | 'desert' | 'freshwater';
}

export interface CreatureGeoCoordinate {
  lat: number;
  lng: number;
  country?: string;
  year?: number | null;
  basisOfRecord?: string;
}

export interface CreatureGeography {
  range: string[];
  countries: string[];
  coordinates: CreatureGeoCoordinate[];
}

export interface CreatureConservation {
  status?: string | null; // e.g. 'Critically Endangered', 'Extinct', 'Least Concern'
  categoryCode?: string | null; // 'CR', 'EN', 'VU', 'LC', 'EX'
  source?: string | null;
  threats?: string[];
}

export interface CreatureObservations {
  gbifCount: number;
  iNaturalistCount: number;
  recentSightingsCount?: number;
}

export interface MediaAttribution {
  creator?: string;
  license?: string;
  sourceUrl?: string;
  title?: string;
}

export interface CreatureMedia {
  primaryImage: string | null;
  gallery: string[];
  attribution: MediaAttribution[];
}

export interface CreatureEvolution {
  extinct: boolean;
  geologicalAge?: string | null; // e.g. "Late Cretaceous"
  era?: string | null; // e.g. "Mesozoic"
  firstAppearance?: string | number | null;
  lastAppearance?: string | number | null;
  fossilFormations?: string[];
}

export interface CreatureSourceProvenance {
  provider: 'GBIF' | 'iNaturalist' | 'Wikidata' | 'PBDB' | 'CatalogueOfLife' | 'CuratedCatalog' | string;
  recordUrl?: string;
  license?: string;
  retrievedAt: string;
  details?: string;
}

export interface NormalizedCreature {
  id: string;
  identity: CreatureIdentity;
  taxonomy: CreatureTaxonomyHierarchy;
  biology: CreatureBiologyMetrics;
  habitat: CreatureHabitatContext;
  geography: CreatureGeography;
  conservation: CreatureConservation;
  observations: CreatureObservations;
  media: CreatureMedia;
  evolution: CreatureEvolution;
  sources: CreatureSourceProvenance[];
}
