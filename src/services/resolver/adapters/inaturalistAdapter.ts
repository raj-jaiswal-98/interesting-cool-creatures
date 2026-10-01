/**
 * iNaturalist API Adapter
 * Resolves community photography, observation counts, and vernacular taxonomy.
 */

import type { ProviderAdapter } from '../types';
import type { NormalizedCreature, CreatureMedia } from '../../../types/normalizedCreature';
import { creatureCache, CACHE_TTLS } from '../../cache/indexedDBCache';

export class INaturalistAdapter implements ProviderAdapter {
  readonly providerName = 'iNaturalist';

  async resolveTaxon(query: string): Promise<Partial<NormalizedCreature> | null> {
    const cacheKey = `inat:taxon:${query.toLowerCase().trim()}`;
    const cached = await creatureCache.get<Partial<NormalizedCreature>>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(
        `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=1&is_active=true`
      );
      if (!res.ok) return null;

      const data = await res.json();
      const match = data.results && data.results[0];
      if (!match) return null;

      const photoUrl = match.default_photo?.medium_url || match.default_photo?.url || null;
      const attribution = match.default_photo?.attribution;
      const licenseCode = match.default_photo?.license_code;

      const result: Partial<NormalizedCreature> = {
        identity: {
          commonName: match.preferred_common_name || match.name,
          scientificName: match.name,
          taxonKey: match.id ? String(match.id) : null,
          synonyms: []
        },
        observations: {
          gbifCount: 0,
          iNaturalistCount: match.observations_count || 0
        },
        media: {
          primaryImage: photoUrl,
          gallery: photoUrl ? [photoUrl] : [],
          attribution: attribution
            ? [
                {
                  creator: attribution,
                  license: licenseCode || 'All Rights Reserved',
                  sourceUrl: `https://www.inaturalist.org/taxa/${match.id}`
                }
              ]
            : []
        },
        sources: [
          {
            provider: 'iNaturalist',
            recordUrl: `https://www.inaturalist.org/taxa/${match.id}`,
            license: licenseCode || 'CC-BY-NC',
            retrievedAt: new Date().toISOString(),
            details: `Rank: ${match.rank}, Observations: ${match.observations_count}`
          }
        ]
      };

      await creatureCache.set(cacheKey, result, CACHE_TTLS.SPECIES_METADATA);
      return result;
    } catch (err) {
      console.warn(`[INaturalistAdapter] Fetch failed for "${query}":`, (err as Error).message);
      return null;
    }
  }

  async fetchMedia(query: string): Promise<Partial<CreatureMedia> | null> {
    const taxon = await this.resolveTaxon(query);
    return taxon?.media || null;
  }
}

export const inaturalistAdapter = new INaturalistAdapter();
