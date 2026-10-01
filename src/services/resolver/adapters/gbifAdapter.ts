/**
 * GBIF (Global Biodiversity Information Facility) Adapter
 * Resolves taxonomic backbone, occurrence counts, and specimen coordinates.
 */

import type { ProviderAdapter } from '../types';
import type { NormalizedCreature, CreatureGeoCoordinate } from '../../../types/normalizedCreature';
import { creatureCache, CACHE_TTLS } from '../../cache/indexedDBCache';

export class GBIFAdapter implements ProviderAdapter {
  readonly providerName = 'GBIF';

  async resolveTaxon(scientificOrCommonName: string): Promise<Partial<NormalizedCreature> | null> {
    const cacheKey = `gbif:taxon:${scientificOrCommonName.toLowerCase().trim()}`;
    const cached = await creatureCache.get<Partial<NormalizedCreature>>(cacheKey);
    if (cached) return cached;

    try {
      const cleanQuery = scientificOrCommonName.split('(')[0].trim();
      const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(cleanQuery)}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (!data || data.matchType === 'NONE') return null;

      const result: Partial<NormalizedCreature> = {
        identity: {
          commonName: data.vernacularName || scientificOrCommonName,
          scientificName: data.scientificName || data.canonicalName || cleanQuery,
          taxonKey: data.usageKey ? String(data.usageKey) : null,
          synonyms: []
        },
        taxonomy: {
          kingdom: data.kingdom || null,
          phylum: data.phylum || null,
          class: data.class || null,
          order: data.order || null,
          family: data.family || null,
          genus: data.genus || null
        },
        sources: [
          {
            provider: 'GBIF',
            recordUrl: data.usageKey ? `https://www.gbif.org/species/${data.usageKey}` : 'https://www.gbif.org/',
            license: 'CC-BY-4.0',
            retrievedAt: new Date().toISOString(),
            details: `Confidence: ${data.confidence}% (${data.matchType})`
          }
        ]
      };

      await creatureCache.set(cacheKey, result, CACHE_TTLS.TAXONOMY);
      return result;
    } catch (err) {
      console.warn(`[GBIFAdapter] Taxon lookup failed for "${scientificOrCommonName}":`, (err as Error).message);
      return null;
    }
  }

  async fetchOccurrences(scientificName: string, limit = 20): Promise<CreatureGeoCoordinate[]> {
    const cacheKey = `gbif:occs:${scientificName.toLowerCase().trim()}:${limit}`;
    const cached = await creatureCache.get<CreatureGeoCoordinate[]>(cacheKey);
    if (cached) return cached;

    try {
      const cleanQuery = scientificName.split('(')[0].trim();
      const res = await fetch(
        `https://api.gbif.org/v1/occurrence/search?q=${encodeURIComponent(cleanQuery)}&hasCoordinate=true&limit=${limit}`
      );
      if (!res.ok) return [];

      const data = await res.json();
      const coordinates: CreatureGeoCoordinate[] = (data.results || [])
        .filter((item: any) => item.decimalLatitude != null && item.decimalLongitude != null)
        .map((item: any) => ({
          lat: Number(item.decimalLatitude.toFixed(3)),
          lng: Number(item.decimalLongitude.toFixed(3)),
          country: item.country || item.continent || 'International Waters',
          year: item.year || null,
          basisOfRecord: item.basisOfRecord || 'PRESERVED_SPECIMEN'
        }));

      await creatureCache.set(cacheKey, coordinates, CACHE_TTLS.OCCURRENCE_COUNTS);
      return coordinates;
    } catch (err) {
      console.warn(`[GBIFAdapter] Occurrence fetch failed for "${scientificName}":`, (err as Error).message);
      return [];
    }
  }
}

export const gbifAdapter = new GBIFAdapter();
