/**
 * Paleobiology Database (PBDB) Adapter
 * Resolves extinct taxa, geological time intervals, and authentic fossil occurrence coordinates.
 * Implements Section 4 of the architecture specification.
 */

import type { ProviderAdapter } from '../types';
import type { NormalizedCreature, CreatureGeoCoordinate } from '../../../types/normalizedCreature';
import { creatureCache, CACHE_TTLS } from '../../cache/indexedDBCache';

export class PBDBAdapter implements ProviderAdapter {
  readonly providerName = 'PBDB';

  async resolveTaxon(scientificOrCommonName: string): Promise<Partial<NormalizedCreature> | null> {
    const genusOrName = scientificOrCommonName.split(' ')[0].trim();
    const cacheKey = `pbdb:taxon:${genusOrName.toLowerCase()}`;
    const cached = await creatureCache.get<Partial<NormalizedCreature>>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`https://paleobiodb.org/data1.2/taxa/single.json?name=${encodeURIComponent(genusOrName)}&show=attr,time`);
      if (!res.ok) return null;

      const data = await res.json();
      const record = data.records && data.records[0];
      if (!record) return null;

      const firstMa = record.eea ?? record.fea; // earliest/first appearance in Ma
      const lastMa = record.lia ?? record.lla;   // latest/last appearance in Ma

      const result: Partial<NormalizedCreature> = {
        identity: {
          commonName: record.nam || scientificOrCommonName,
          scientificName: record.nam || scientificOrCommonName,
          taxonKey: record.oid ? String(record.oid) : null,
          synonyms: []
        },
        evolution: {
          extinct: true,
          geologicalAge: [record.ei, record.li].filter(Boolean).join(' to ') || 'Prehistoric',
          firstAppearance: firstMa ? -Math.round(firstMa * 1_000_000) : null,
          lastAppearance: lastMa ? -Math.round(lastMa * 1_000_000) : null,
          fossilFormations: []
        },
        sources: [
          {
            provider: 'PBDB',
            recordUrl: `https://paleobiodb.org/classic/basicTaxonInfo?taxon_no=${record.oid?.replace('txn:', '')}`,
            license: 'CC0-1.0',
            retrievedAt: new Date().toISOString(),
            details: `Geological range: ${firstMa || '?'} Ma - ${lastMa || '?'} Ma (${record.ei || 'Unknown interval'})`
          }
        ]
      };

      await creatureCache.set(cacheKey, result, CACHE_TTLS.PBDB_FOSSILS);
      return result;
    } catch (err) {
      console.warn(`[PBDBAdapter] Taxon lookup failed for "${genusOrName}":`, (err as Error).message);
      return null;
    }
  }

  async fetchOccurrences(scientificName: string, limit = 20): Promise<CreatureGeoCoordinate[]> {
    const genusOrName = scientificName.split(' ')[0].trim();
    const cacheKey = `pbdb:occs:${genusOrName.toLowerCase()}:${limit}`;
    const cached = await creatureCache.get<CreatureGeoCoordinate[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(
        `https://paleobiodb.org/data1.2/occs/list.json?base_name=${encodeURIComponent(genusOrName)}&show=coords,time&limit=${limit}`
      );
      if (!res.ok) return [];

      const data = await res.json();
      const coordinates: CreatureGeoCoordinate[] = (data.records || [])
        .filter((rec: any) => rec.lat != null && rec.lng != null && !isNaN(Number(rec.lat)) && !isNaN(Number(rec.lng)))
        .map((rec: any) => ({
          lat: Number(Number(rec.lat).toFixed(3)),
          lng: Number(Number(rec.lng).toFixed(3)),
          country: rec.cc ? `Country Code: ${rec.cc}` : (rec.gpl || 'Prehistoric Formation Site'),
          year: rec.eag && !isNaN(Number(rec.eag)) ? -Math.round(Number(rec.eag) * 1_000_000) : null,
          basisOfRecord: 'FOSSIL_SPECIMEN'
        }));

      await creatureCache.set(cacheKey, coordinates, CACHE_TTLS.PBDB_FOSSILS);
      return coordinates;
    } catch (err) {
      console.warn(`[PBDBAdapter] Fossil occurrence fetch failed for "${genusOrName}":`, (err as Error).message);
      return [];
    }
  }
}

export const pbdbAdapter = new PBDBAdapter();
