/**
 * Wikidata API Adapter
 * Resolves knowledge graph identifiers, multilingual synonyms, and Wikipedia links.
 * Implements Section 3 (Wikidata) of the architecture specification.
 */

import type { ProviderAdapter } from '../types';
import type { NormalizedCreature } from '../../../types/normalizedCreature';
import { creatureCache, CACHE_TTLS } from '../../cache/indexedDBCache';

export class WikidataAdapter implements ProviderAdapter {
  readonly providerName = 'Wikidata';

  async resolveTaxon(query: string): Promise<Partial<NormalizedCreature> | null> {
    const cleanQuery = query.split('(')[0].trim();
    const cacheKey = `wikidata:entity:${cleanQuery.toLowerCase()}`;
    const cached = await creatureCache.get<Partial<NormalizedCreature>>(cacheKey);
    if (cached) return cached;

    try {
      const searchRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleanQuery)}&language=en&format=json&origin=*`
      );
      if (!searchRes.ok) return null;

      const searchData = await searchRes.json();
      const entity = searchData.search && searchData.search[0];
      if (!entity) return null;

      const entityId = entity.id; // e.g., "Q12345"
      const entityRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=sitelinks/urls|descriptions|aliases&languages=en&sitefilter=enwiki&format=json&origin=*`
      );
      if (!entityRes.ok) return null;

      const entityData = await entityRes.json();
      const entityDetails = entityData.entities?.[entityId];
      const enWikiUrl = entityDetails?.sitelinks?.enwiki?.url;
      const aliases = (entityDetails?.aliases?.en || []).map((a: any) => a.value);

      const result: Partial<NormalizedCreature> = {
        identity: {
          commonName: entity.label || cleanQuery,
          scientificName: cleanQuery,
          taxonKey: entityId,
          synonyms: aliases
        },
        sources: [
          {
            provider: 'Wikidata',
            recordUrl: `https://www.wikidata.org/wiki/${entityId}`,
            license: 'CC0-1.0',
            retrievedAt: new Date().toISOString(),
            details: entity.description ? `Description: ${entity.description}` : enWikiUrl
          }
        ]
      };

      await creatureCache.set(cacheKey, result, CACHE_TTLS.WIKIDATA);
      return result;
    } catch (err) {
      console.warn(`[WikidataAdapter] Entity lookup failed for "${cleanQuery}":`, (err as Error).message);
      return null;
    }
  }
}

export const wikidataAdapter = new WikidataAdapter();
