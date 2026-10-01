/**
 * CreatureResolver
 * Orchestrates multi-provider scientific data aggregation, normalizes schemas,
 * and maintains resilient fallbacks to cached and curated data.
 * Implements Section 14, 20 & 24 of the architecture specification.
 */

import type { NormalizedCreature, CreatureGeoCoordinate } from '../../types/normalizedCreature';
import type { Creature, HabitatType, Era, ThemePalette, CreatureCoordinate } from '../../types/creature';
import { CREATURE_CATALOG } from '../../data/creatureCatalog';
import { gbifAdapter } from './adapters/gbifAdapter';
import { inaturalistAdapter } from './adapters/inaturalistAdapter';
import { pbdbAdapter } from './adapters/pbdbAdapter';
import { wikidataAdapter } from './adapters/wikidataAdapter';
import { creatureCache, CACHE_TTLS } from '../cache/indexedDBCache';

export function normalizeCatalogCreature(creature: Creature): NormalizedCreature {
  const isExtinct = creature.extinctionYear !== null;
  const uniqueCountries = Array.from(new Set(creature.coordinates.map((c) => c.country).filter(Boolean)));

  return {
    id: `catalog:${creature.id}`,
    identity: {
      commonName: creature.commonName,
      scientificName: creature.scientificName,
      taxonKey: null,
      synonyms: []
    },
    taxonomy: {
      kingdom: creature.taxonomy.kingdom,
      phylum: creature.taxonomy.phylum,
      class: creature.taxonomy.class,
      order: creature.taxonomy.order,
      family: creature.taxonomy.family,
      genus: creature.taxonomy.genus
    },
    biology: {
      size: creature.stats.lengthMeters,
      mass: creature.stats.weightKg,
      diet: creature.diet,
      dangerLevel: creature.stats.dangerLevel,
      rarityScore: creature.stats.rarityScore
    },
    habitat: {
      biome: creature.habitat,
      environment: creature.habitat,
      habitatType: creature.habitatType
    },
    geography: {
      range: [],
      countries: uniqueCountries,
      coordinates: creature.coordinates.map((c) => ({
        lat: c.lat,
        lng: c.lng,
        country: c.country,
        year: c.year,
        basisOfRecord: c.basisOfRecord
      }))
    },
    conservation: {
      status: isExtinct ? 'Extinct' : 'Extant',
      categoryCode: isExtinct ? 'EX' : 'LC',
      source: 'Curated Catalog'
    },
    observations: {
      gbifCount: 0,
      iNaturalistCount: 0
    },
    media: {
      primaryImage: creature.photoUrl,
      gallery: [creature.photoUrl],
      attribution: [
        {
          creator: 'Curated Science Archives',
          license: 'Unsplash / Open Public Educational License',
          sourceUrl: creature.photoUrl
        }
      ]
    },
    evolution: {
      extinct: isExtinct,
      era: creature.era,
      lastAppearance: creature.extinctionYear
    },
    sources: [
      {
        provider: 'CuratedCatalog',
        recordUrl: creature.wikiUrl,
        license: 'CC-BY-SA-4.0',
        retrievedAt: new Date().toISOString(),
        details: 'Curated baseline biodiversity archive'
      }
    ]
  };
}

export class CreatureResolver {
  /**
   * Resolves a complete NormalizedCreature from either a catalog entry or an arbitrary query string.
   */
  async resolve(target: string | Creature): Promise<NormalizedCreature> {
    let base: NormalizedCreature;
    let queryName: string;
    let isExtinct = false;

    if (typeof target === 'string') {
      queryName = target.trim();
      const match = CREATURE_CATALOG.find(
        (c) =>
          c.id.toLowerCase() === queryName.toLowerCase() ||
          c.scientificName.toLowerCase() === queryName.toLowerCase() ||
          c.commonName.toLowerCase() === queryName.toLowerCase()
      );

      if (match) {
        base = normalizeCatalogCreature(match);
        isExtinct = match.extinctionYear !== null;
      } else {
        base = {
          id: `resolved:${queryName.toLowerCase().replace(/\s+/g, '-')}`,
          identity: { commonName: queryName, scientificName: queryName, synonyms: [] },
          taxonomy: {},
          biology: {},
          habitat: {},
          geography: { range: [], countries: [], coordinates: [] },
          conservation: {},
          observations: { gbifCount: 0, iNaturalistCount: 0 },
          media: { primaryImage: null, gallery: [], attribution: [] },
          evolution: { extinct: false },
          sources: []
        };
      }
    } else {
      base = normalizeCatalogCreature(target);
      queryName = target.scientificName;
      isExtinct = target.extinctionYear !== null;
    }

    const cacheKey = `resolver:normalized:${queryName.toLowerCase()}`;
    const cached = await creatureCache.get<NormalizedCreature>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Parallel queries tailored to creature era
      const tasks: Promise<any>[] = [
        wikidataAdapter.resolveTaxon(queryName).catch(() => null)
      ];

      if (isExtinct) {
        // Extinct creatures: prioritize Paleobiology Database (PBDB)
        tasks.push(pbdbAdapter.resolveTaxon(queryName).catch(() => null));
        tasks.push(gbifAdapter.resolveTaxon(queryName).catch(() => null));
      } else {
        // Living creatures: prioritize GBIF and iNaturalist
        tasks.push(gbifAdapter.resolveTaxon(queryName).catch(() => null));
        tasks.push(inaturalistAdapter.resolveTaxon(queryName).catch(() => null));
      }

      const results = await Promise.allSettled(tasks);

      // Merge results
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          const partial = res.value as Partial<NormalizedCreature>;

          if (partial.identity?.commonName && (!base.identity.commonName || base.identity.commonName === queryName)) {
            base.identity.commonName = partial.identity.commonName;
          }
          if (partial.identity?.taxonKey) {
            base.identity.taxonKey = partial.identity.taxonKey;
          }
          if (partial.identity?.synonyms?.length) {
            base.identity.synonyms = Array.from(new Set([...base.identity.synonyms, ...partial.identity.synonyms]));
          }

          if (partial.taxonomy) {
            base.taxonomy = {
              kingdom: partial.taxonomy.kingdom || base.taxonomy.kingdom,
              phylum: partial.taxonomy.phylum || base.taxonomy.phylum,
              class: partial.taxonomy.class || base.taxonomy.class,
              order: partial.taxonomy.order || base.taxonomy.order,
              family: partial.taxonomy.family || base.taxonomy.family,
              genus: partial.taxonomy.genus || base.taxonomy.genus
            };
          }

          if (partial.observations) {
            base.observations = {
              gbifCount: partial.observations.gbifCount || base.observations.gbifCount,
              iNaturalistCount: partial.observations.iNaturalistCount || base.observations.iNaturalistCount
            };
          }

          if (partial.media?.primaryImage && !base.media.primaryImage) {
            base.media.primaryImage = partial.media.primaryImage;
            base.media.gallery.push(partial.media.primaryImage);
          }
          if (partial.media?.attribution?.length) {
            base.media.attribution.push(...partial.media.attribution);
          }

          if (partial.evolution) {
            base.evolution = {
              ...base.evolution,
              ...partial.evolution
            };
          }

          if (partial.sources?.length) {
            base.sources.push(...partial.sources);
          }
        }
      }

      await creatureCache.set(cacheKey, base, CACHE_TTLS.SPECIES_METADATA);
      return base;
    } catch (err) {
      console.warn(`[CreatureResolver] Aggregation encountered issues for "${queryName}", using base:`, err);
      return base;
    }
  }

  /**
   * Fetches real-world or fossil occurrence coordinates for map rendering.
   */
  async resolveOccurrences(creature: NormalizedCreature | Creature, limit = 20): Promise<CreatureGeoCoordinate[]> {
    const isExtinct = 'extinctionYear' in creature ? creature.extinctionYear !== null : creature.evolution.extinct;
    const scientificName = 'scientificName' in creature ? creature.scientificName : creature.identity.scientificName;

    const cacheKey = `resolver:occs:${scientificName.toLowerCase()}:${limit}`;
    const cached = await creatureCache.get<CreatureGeoCoordinate[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    let coords: CreatureGeoCoordinate[] = [];

    if (isExtinct) {
      coords = await pbdbAdapter.fetchOccurrences(scientificName, limit);
      if (!coords.length) {
        coords = await gbifAdapter.fetchOccurrences(scientificName, limit);
      }
    } else {
      coords = await gbifAdapter.fetchOccurrences(scientificName, limit);
    }

    // If live APIs return empty, fallback to catalog baseline
    if (!coords.length) {
      if ('coordinates' in creature && creature.coordinates?.length) {
        coords = creature.coordinates.map((c) => ({
          lat: c.lat,
          lng: c.lng,
          country: c.country,
          year: c.year,
          basisOfRecord: c.basisOfRecord || (isExtinct ? 'FOSSIL_SPECIMEN' : 'HUMAN_OBSERVATION')
        }));
      } else if ('geography' in creature && creature.geography?.coordinates?.length) {
        coords = creature.geography.coordinates;
      }
    }

    if (coords.length > 0) {
      await creatureCache.set(cacheKey, coords, CACHE_TTLS.OCCURRENCE_COUNTS);
    }

    return coords;
  }

  /**
   * Continually streams unique research-grade creatures from public biodiversity APIs
   * in progressive batches until targetCount (default 225, within 200-250 range) is reached.
   * Emits onBatchProgress as each batch resolves so UI updates progressively in real-time.
   */
  async streamUntilTargetCount(
    targetCount = 225,
    onBatchProgress?: (batch: Creature[], totalSoFar: number) => void
  ): Promise<Creature[]> {
    const cacheKey = `resolver:catalog_target_${targetCount}`;
    const cached = await creatureCache.get<Creature[]>(cacheKey);
    if (cached && cached.length >= targetCount) {
      if (onBatchProgress) {
        onBatchProgress(cached, cached.length);
      }
      return cached;
    }

    const seenIds = new Set<string>();
    const seenScientificNames = new Set<string>();
    const allCreatures: Creature[] = [];

    // Seed with baseline curated catalog
    for (const c of CREATURE_CATALOG) {
      seenIds.add(c.id.toLowerCase());
      seenScientificNames.add(c.scientificName.toLowerCase());
      allCreatures.push(c);
    }

    if (onBatchProgress) {
      onBatchProgress(allCreatures, allCreatures.length);
    }

    let page = 1;
    const maxPages = 16;

    while (allCreatures.length < targetCount && page <= maxPages) {
      try {
        const url = `https://api.inaturalist.org/v1/observations?popular=true&has[]=photos&quality_grade=research&iconic_taxa=Aves,Mammalia,Reptilia,Amphibia,Actinopterygii,Mollusca,Insecta,Arachnida&per_page=35&page=${page}&order=desc&order_by=votes`;
        const res = await fetch(url);
        if (!res.ok) {
          page++;
          continue;
        }

        const data = await res.json();
        const batch: Creature[] = [];

        for (const item of data.results || []) {
          const creature = inaturalistObservationToCreature(item);
          if (!creature) continue;

          const sciLower = creature.scientificName.toLowerCase();
          const idLower = creature.id.toLowerCase();
          if (seenIds.has(idLower) || seenScientificNames.has(sciLower)) {
            continue;
          }

          seenIds.add(idLower);
          seenScientificNames.add(sciLower);
          batch.push(creature);
          allCreatures.push(creature);

          if (allCreatures.length >= targetCount) {
            break;
          }
        }

        if (batch.length > 0 && onBatchProgress) {
          onBatchProgress(batch, allCreatures.length);
        }

        page++;
      } catch (err) {
        console.warn(`[CreatureResolver] Error streaming page ${page}:`, err);
        break;
      }
    }

    if (allCreatures.length >= targetCount) {
      await creatureCache.set(cacheKey, allCreatures, CACHE_TTLS.RECENT_OBSERVATIONS);
    }

    return allCreatures;
  }

  /**
   * Fetches a specified count of unique creatures matching a specific category/habitat
   * (e.g. 'marine', 'forest', 'aerial', 'volcanic', 'tundra', 'ancient', or 'all').
   * Guaranteed to be distinct from existing catalog IDs and scientific names.
   */
  async fetchUniqueCreaturesForCategory(
    category: string,
    count = 7,
    existingCreatures: Creature[] = []
  ): Promise<Creature[]> {
    const seenIds = new Set(existingCreatures.map((c) => c.id.toLowerCase()));
    const seenNames = new Set(existingCreatures.map((c) => c.scientificName.toLowerCase()));
    const results: Creature[] = [];

    // Map category to iNaturalist / PBDB query parameters
    let iconicTaxa = 'Aves,Mammalia,Reptilia,Amphibia,Actinopterygii,Mollusca,Insecta,Arachnida';
    let queryTerm = '';
    const isAncient = category === 'ancient' || category === 'prehistoric' || category === 'fossil';

    if (category === 'marine' || category === 'ocean') {
      iconicTaxa = 'Actinopterygii,Mollusca';
    } else if (category === 'aerial' || category === 'bird' || category === 'birds') {
      iconicTaxa = 'Aves';
    } else if (category === 'forest' || category === 'mammal' || category === 'mammals') {
      iconicTaxa = 'Mammalia';
    } else if (category === 'volcanic' || category === 'extreme') {
      iconicTaxa = 'Reptilia,Arachnida';
      queryTerm = 'desert';
    } else if (category === 'tundra' || category === 'polar') {
      iconicTaxa = 'Aves,Mammalia';
      queryTerm = 'arctic';
    }

    // If ancient, fetch from Paleobiology Database (PBDB)
    if (isAncient) {
      try {
        const offset = Math.floor(Math.random() * 80) + 1;
        const pbdbUrl = `https://paleobiodb.org/data1.2/taxa/list.json?is_extinct=true&limit=${Math.max(count * 2, 10)}&offset=${offset}&show=attr,time`;
        const res = await fetch(pbdbUrl);
        if (res.ok) {
          const data = await res.json();
          for (const rec of data.records || []) {
            if (!rec.nam) continue;
            const sciLower = rec.nam.toLowerCase();
            const id = `pbdb:${rec.nam.toLowerCase().replace(/\s+/g, '-')}`;
            if (seenIds.has(id) || seenNames.has(sciLower)) continue;

            const normalized = await this.resolve(rec.nam);
            const creature = normalizedToCreature(normalized);
            if (creature) {
              seenIds.add(id);
              seenNames.add(sciLower);
              results.push(creature);
              if (results.length >= count) break;
            }
          }
        }
      } catch (err) {
        console.warn('[CreatureResolver] PBDB fetch for ancient category failed:', err);
      }
    }

    // If not ancient or need more results, query iNaturalist with randomized page offset
    let attempts = 0;
    const maxAttempts = 5;
    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      const randomPage = Math.floor(Math.random() * 30) + 1;
      try {
        let url = `https://api.inaturalist.org/v1/observations?popular=true&has[]=photos&quality_grade=research&iconic_taxa=${iconicTaxa}&per_page=30&page=${randomPage}&order=desc&order_by=votes`;
        if (queryTerm) {
          url += `&q=${encodeURIComponent(queryTerm)}`;
        }

        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        for (const item of data.results || []) {
          const creature = inaturalistObservationToCreature(item);
          if (!creature) continue;

          const sciLower = creature.scientificName.toLowerCase();
          const idLower = creature.id.toLowerCase();
          if (seenIds.has(idLower) || seenNames.has(sciLower)) continue;

          if (category === 'marine') creature.habitatType = 'marine';
          else if (category === 'aerial') creature.habitatType = 'aerial';
          else if (category === 'volcanic') creature.habitatType = 'volcanic';
          else if (category === 'tundra') creature.habitatType = 'tundra';
          else if (category === 'forest') creature.habitatType = 'forest';

          seenIds.add(idLower);
          seenNames.add(sciLower);
          results.push(creature);

          if (results.length >= count) break;
        }
      } catch (err) {
        console.warn(`[CreatureResolver] Error fetching unique creatures for category "${category}":`, err);
      }
    }

    return results;
  }

  /**
   * Fetches trending research-grade species observations live from iNaturalist.
   */
  async fetchTrendingLiveCreatures(limit = 8): Promise<Creature[]> {
    const cacheKey = `resolver:trending_live:${limit}`;
    const cached = await creatureCache.get<Creature[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    try {
      const res = await fetch(
        `https://api.inaturalist.org/v1/observations?popular=true&has[]=photos&quality_grade=research&iconic_taxa=Aves,Mammalia,Reptilia,Amphibia,Actinopterygii,Mollusca,Insecta,Arachnida&per_page=${limit}&order=desc&order_by=votes`
      );
      if (!res.ok) return [];

      const data = await res.json();
      const results: Creature[] = [];

      for (const item of data.results || []) {
        const creature = inaturalistObservationToCreature(item);
        if (creature) results.push(creature);
      }

      if (results.length > 0) {
        await creatureCache.set(cacheKey, results, CACHE_TTLS.RECENT_OBSERVATIONS);
      }

      return results;
    } catch (err) {
      console.warn('[CreatureResolver] Failed to fetch trending live creatures:', err);
      return [];
    }
  }

  /**
   * Searches live public biodiversity databases (iNaturalist + PBDB) for any species query.
   */
  async searchLiveCreatures(query: string, limit = 5): Promise<Creature[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const cacheKey = `resolver:search_live:${cleanQuery.toLowerCase()}:${limit}`;
    const cached = await creatureCache.get<Creature[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    try {
      // Query iNaturalist and PBDB in parallel
      const inatPromise = fetch(
        `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(cleanQuery)}&is_active=true&per_page=${limit}`
      ).then((r) => (r.ok ? r.json() : { results: [] })).catch(() => ({ results: [] }));

      const pbdbPromise = fetch(
        `https://paleobiodb.org/data1.2/taxa/list.json?name=${encodeURIComponent(cleanQuery)}&limit=${limit}&show=attr,time`
      ).then((r) => (r.ok ? r.json() : { records: [] })).catch(() => ({ records: [] }));

      const [inatData, pbdbData] = await Promise.all([inatPromise, pbdbPromise]);
      const matchedTaxaNames: string[] = [];
      const inatPhotoMap = new Map<string, string>();

      // Extract iNaturalist matches
      for (const t of inatData.results || []) {
        if (t.name && !matchedTaxaNames.includes(t.name)) {
          matchedTaxaNames.push(t.name);
          const p = t.default_photo?.medium_url || t.default_photo?.url;
          if (p) inatPhotoMap.set(t.name.toLowerCase(), p);
        }
      }

      // Extract PBDB matches
      for (const rec of pbdbData.records || []) {
        if (rec.nam && !matchedTaxaNames.includes(rec.nam)) {
          matchedTaxaNames.push(rec.nam);
        }
      }

      const results: Creature[] = [];
      const resolvePromises = matchedTaxaNames.slice(0, limit).map(async (name) => {
        try {
          const norm = await this.resolve(name);
          const candidatePhoto = inatPhotoMap.get(name.toLowerCase());
          if (candidatePhoto && !norm.media.primaryImage) {
            norm.media.primaryImage = candidatePhoto;
          }
          return normalizedToCreature(norm);
        } catch {
          return null;
        }
      });

      const resolvedBatch = await Promise.all(resolvePromises);
      for (const c of resolvedBatch) {
        if (c) results.push(c);
      }

      if (results.length > 0) {
        await creatureCache.set(cacheKey, results, CACHE_TTLS.SPECIES_METADATA);
      }

      return results;
    } catch (err) {
      console.warn(`[CreatureResolver] Live search failed for "${cleanQuery}":`, err);
      return [];
    }
  }
}

/**
 * Converts a raw research-grade iNaturalist observation item directly into a Creature interface.
 */
export function inaturalistObservationToCreature(item: any): Creature | null {
  if (!item || !item.taxon?.name) return null;
  const photo =
    item.photos?.[0]?.url?.replace('square', 'medium') ||
    item.taxon?.default_photo?.medium_url;
  if (!photo) return null;

  const commonName = item.taxon.preferred_common_name || item.taxon.name;
  const scientificName = item.taxon.name;
  const iconic = (item.taxon.iconic_taxon_name || '').toLowerCase();
  const placeGuess = item.place_guess || 'Global Ecosystem';

  // Infer habitat type
  let habitatType: HabitatType = 'forest';
  if (iconic === 'aves') {
    habitatType = 'aerial';
  } else if (iconic === 'actinopterygii' || iconic === 'mollusca') {
    habitatType = 'marine';
  } else if (
    placeGuess.toLowerCase().includes('arctic') ||
    placeGuess.toLowerCase().includes('alaska') ||
    placeGuess.toLowerCase().includes('antarctica') ||
    placeGuess.toLowerCase().includes('norway') ||
    (placeGuess.toLowerCase().includes('island') && placeGuess.toLowerCase().includes('ice'))
  ) {
    habitatType = 'tundra';
  } else if (
    placeGuess.toLowerCase().includes('ocean') ||
    placeGuess.toLowerCase().includes('sea') ||
    placeGuess.toLowerCase().includes('reef') ||
    placeGuess.toLowerCase().includes('beach') ||
    placeGuess.toLowerCase().includes('coast')
  ) {
    habitatType = 'marine';
  } else if (
    placeGuess.toLowerCase().includes('desert') ||
    placeGuess.toLowerCase().includes('sahara') ||
    placeGuess.toLowerCase().includes('canyon')
  ) {
    habitatType = 'volcanic';
  }

  // Infer diet based on taxon
  let diet = 'Omnivore';
  if (iconic === 'aves') diet = 'Granivore / Insectivore';
  else if (iconic === 'actinopterygii') diet = 'Carnivore (Piscivore)';
  else if (iconic === 'insecta') diet = 'Herbivore / Nectarivore';
  else if (iconic === 'arachnida') diet = 'Carnivore (Predator)';
  else if (iconic === 'reptilia') diet = 'Carnivore';
  else if (iconic === 'amphibia') diet = 'Insectivore';
  else if (iconic === 'mammalia') diet = 'Omnivore';

  // Stats heuristics
  let dangerLevel = 1;
  let lengthMeters = 0.3;
  let weightKg = 0.5;

  if (iconic === 'mammalia') {
    dangerLevel = 2;
    lengthMeters = 1.2;
    weightKg = 45;
  } else if (iconic === 'reptilia') {
    dangerLevel = 3;
    lengthMeters = 1.0;
    weightKg = 15;
  } else if (iconic === 'arachnida') {
    dangerLevel = 3;
    lengthMeters = 0.05;
    weightKg = 0.02;
  } else if (iconic === 'actinopterygii') {
    dangerLevel = 1;
    lengthMeters = 0.4;
    weightKg = 1.5;
  }

  const rarityScore = Math.min(98, Math.max(60, 95 - Math.floor((item.identifications_count || 1) / 3)));

  const coordinates: CreatureCoordinate[] = [];
  if (item.geojson?.coordinates && Array.isArray(item.geojson.coordinates) && item.geojson.coordinates.length >= 2) {
    coordinates.push({
      lat: item.geojson.coordinates[1],
      lng: item.geojson.coordinates[0],
      country: placeGuess,
      year: item.observed_on_details?.year || new Date().getFullYear(),
      basisOfRecord: 'HUMAN_OBSERVATION'
    });
  }

  const palettes: Record<HabitatType, ThemePalette> = {
    marine: { primary: '#00D2FF', darkMuted: '#071A2B', glow: 'rgba(0, 210, 255, 0.3)', textAccent: '#68E1FD', surface: '#0A2238' },
    volcanic: { primary: '#FF4D4D', darkMuted: '#2B0808', glow: 'rgba(255, 77, 77, 0.3)', textAccent: '#FF9494', surface: '#380D0D' },
    forest: { primary: '#00FF66', darkMuted: '#062619', glow: 'rgba(0, 255, 102, 0.3)', textAccent: '#6EE7B7', surface: '#0A3B27' },
    tundra: { primary: '#A78BFA', darkMuted: '#170E30', glow: 'rgba(167, 139, 250, 0.3)', textAccent: '#C4B5FD', surface: '#221545' },
    aerial: { primary: '#FBBF24', darkMuted: '#2E2005', glow: 'rgba(251, 191, 36, 0.3)', textAccent: '#FDE68A', surface: '#422F09' }
  };

  const genus = scientificName.split(' ')[0] || scientificName;

  return {
    id: `inat-${item.id}`,
    commonName,
    scientificName,
    extinctionYear: null,
    era: 'Modern',
    habitat: placeGuess,
    habitatType,
    photoUrl: photo,
    description: `Research-grade sighting of ${commonName} (${scientificName}) documented in ${placeGuess}. Verified through global biodiversity observer networks.`,
    diet,
    stats: {
      lengthMeters,
      weightKg,
      dangerLevel,
      rarityScore
    },
    taxonomy: {
      kingdom: 'Animalia',
      phylum: iconic === 'insecta' || iconic === 'arachnida' ? 'Arthropoda' : iconic === 'mollusca' ? 'Mollusca' : 'Chordata',
      class: item.taxon.iconic_taxon_name || 'Animalia',
      order: genus,
      family: item.taxon.iconic_taxon_name || 'Fauna',
      genus
    },
    coordinates,
    themePalette: palettes[habitatType],
    wikiUrl: item.taxon.wikipedia_url || `https://en.wikipedia.org/wiki/${encodeURIComponent(scientificName)}`
  };
}

/**
 * Converts a NormalizedCreature into the runtime Creature interface consumed by UI components.
 */
export function normalizedToCreature(nc: NormalizedCreature): Creature {
  const isExtinct = nc.evolution?.extinct ?? false;
  const rawId = nc.id.replace(/^(catalog|gbif|inat|pbdb|resolved):/, '');

  // Infer habitat type from taxonomic or environmental cues
  let habitatType: HabitatType = 'forest';
  const phylum = (nc.taxonomy?.phylum || '').toLowerCase();
  const cl = (nc.taxonomy?.class || '').toLowerCase();
  const env = `${nc.habitat?.environment || ''} ${nc.habitat?.biome || ''}`.toLowerCase();

  if (
    env.includes('marine') ||
    env.includes('ocean') ||
    env.includes('pelagic') ||
    env.includes('reef') ||
    env.includes('sea') ||
    phylum.includes('mollusc') ||
    cl.includes('actinopterygii') ||
    cl.includes('chondrichthyes')
  ) {
    habitatType = 'marine';
  } else if (env.includes('tundra') || env.includes('ice') || env.includes('arctic') || env.includes('polar')) {
    habitatType = 'tundra';
  } else if (env.includes('volcanic') || isExtinct) {
    habitatType = isExtinct ? 'volcanic' : 'forest';
  } else if (cl.includes('aves') || env.includes('aerial') || env.includes('sky')) {
    habitatType = 'aerial';
  }

  // Derive era from geological chronology
  let era: Era = 'Modern';
  if (isExtinct) {
    const lastApp = typeof nc.evolution?.lastAppearance === 'number' ? nc.evolution.lastAppearance : -66000000;
    if (lastApp < -66000000) era = 'Mesozoic';
    else if (lastApp < -2500000) era = 'Cenozoic';
    else if (lastApp < -11700) era = 'Pleistocene';
    else era = 'Holocene';
  }

  const palettes: Record<HabitatType, ThemePalette> = {
    marine: { primary: '#00D2FF', darkMuted: '#071A2B', glow: 'rgba(0, 210, 255, 0.3)', textAccent: '#68E1FD', surface: '#0A2238' },
    volcanic: { primary: '#FF4D4D', darkMuted: '#2B0808', glow: 'rgba(255, 77, 77, 0.3)', textAccent: '#FF9494', surface: '#380D0D' },
    forest: { primary: '#10B981', darkMuted: '#062619', glow: 'rgba(16, 185, 129, 0.3)', textAccent: '#6EE7B7', surface: '#0A3B27' },
    tundra: { primary: '#A78BFA', darkMuted: '#170E30', glow: 'rgba(167, 139, 250, 0.3)', textAccent: '#C4B5FD', surface: '#221545' },
    aerial: { primary: '#FBBF24', darkMuted: '#2E2005', glow: 'rgba(251, 191, 36, 0.3)', textAccent: '#FDE68A', surface: '#422F09' }
  };

  let chosenHabitatType: HabitatType = habitatType;
  if (nc.habitat?.habitatType) {
    if (nc.habitat.habitatType === 'desert') chosenHabitatType = 'volcanic';
    else if (nc.habitat.habitatType === 'freshwater') chosenHabitatType = 'marine';
    else chosenHabitatType = nc.habitat.habitatType as HabitatType;
  }

  return {
    id: rawId,
    commonName: nc.identity?.commonName || nc.identity?.scientificName,
    scientificName: nc.identity?.scientificName,
    extinctionYear: isExtinct
      ? typeof nc.evolution?.lastAppearance === 'number'
        ? nc.evolution.lastAppearance
        : -66000000
      : null,
    era: (nc.evolution?.era as Era) || era,
    habitat: nc.habitat?.biome || nc.habitat?.environment || (isExtinct ? 'Prehistoric Ecosystem' : 'Global Biosphere'),
    habitatType: chosenHabitatType,
    photoUrl:
      nc.media?.primaryImage ||
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    description:
      nc.sources.find((s) => s.details)?.details?.replace(/^Description:\s*/, '') ||
      `${nc.identity?.commonName || 'This organism'} (${nc.identity?.scientificName}) is an extraordinary species documented in open scientific biodiversity telemetry.`,
    diet: nc.biology?.diet || (isExtinct ? 'Carnivore' : 'Omnivore'),
    stats: {
      lengthMeters: nc.biology?.size ?? (isExtinct ? 3.5 : 1.2),
      weightKg: nc.biology?.mass ?? (isExtinct ? 450 : 35),
      dangerLevel: nc.biology?.dangerLevel ?? (isExtinct ? 8 : 4),
      rarityScore: nc.biology?.rarityScore ?? 85
    },
    taxonomy: {
      kingdom: nc.taxonomy?.kingdom || 'Animalia',
      phylum: nc.taxonomy?.phylum || 'Chordata',
      class: nc.taxonomy?.class || 'Unknown',
      order: nc.taxonomy?.order || 'Unknown',
      family: nc.taxonomy?.family || 'Unknown',
      genus: nc.taxonomy?.genus || nc.identity?.scientificName.split(' ')[0]
    },
    coordinates: (nc.geography?.coordinates || []).map((c) => ({
      lat: c.lat,
      lng: c.lng,
      country: c.country || 'Global Specimen Site',
      year: c.year,
      basisOfRecord: c.basisOfRecord
    })),
    themePalette: palettes[chosenHabitatType],
    wikiUrl:
      nc.sources.find((s) => s.recordUrl)?.recordUrl ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(nc.identity?.scientificName)}`
  };
}

export const creatureResolver = new CreatureResolver();

