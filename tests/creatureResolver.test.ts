import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  creatureResolver,
  normalizeCatalogCreature,
  normalizedToCreature,
  inaturalistObservationToCreature
} from '../src/services/resolver/creatureResolver';
import { creatureCache, CACHE_TTLS } from '../src/services/cache/indexedDBCache';
import { CREATURE_CATALOG } from '../src/data/creatureCatalog';

describe('CreatureResolver & NormalizedCreature Model', () => {
  beforeEach(async () => {
    await creatureCache.clear();
    vi.restoreAllMocks();
  });

  it('correctly normalizes a curated catalog creature into NormalizedCreature schema', () => {
    const rawCreature = CREATURE_CATALOG[0]; // Glaucus atlanticus
    const normalized = normalizeCatalogCreature(rawCreature);

    expect(normalized.id).toBe(`catalog:${rawCreature.id}`);
    expect(normalized.identity.commonName).toBe(rawCreature.commonName);
    expect(normalized.identity.scientificName).toBe(rawCreature.scientificName);
    expect(normalized.taxonomy.phylum).toBe(rawCreature.taxonomy.phylum);
    expect(normalized.biology.diet).toBe(rawCreature.diet);
    expect(normalized.biology.size).toBe(rawCreature.stats.lengthMeters);
    expect(normalized.habitat.habitatType).toBe(rawCreature.habitatType);
    expect(normalized.geography.coordinates.length).toBeGreaterThan(0);
    expect(normalized.media.primaryImage).toBe(rawCreature.photoUrl);
    expect(normalized.sources.length).toBeGreaterThan(0);
    expect(normalized.sources[0].provider).toBe('CuratedCatalog');
  });

  it('marks extinct creatures accurately with geological provenance', () => {
    const spinosaurus = CREATURE_CATALOG.find((c) => c.id === 'spinosaurus-aegyptiacus')!;
    const normalized = normalizeCatalogCreature(spinosaurus);

    expect(normalized.evolution.extinct).toBe(true);
    expect(normalized.evolution.era).toBe('Mesozoic');
    expect(normalized.evolution.lastAppearance).toBe(-93500000);
    expect(normalized.conservation.status).toBe('Extinct');
  });

  it('retrieves and sets values in creatureCache with TTL', async () => {
    const testKey = 'test:species:quagga';
    const testVal = { name: 'Quagga', extinct: true };

    await creatureCache.set(testKey, testVal, 1000); // 1 second TTL
    const retrieved = await creatureCache.get<typeof testVal>(testKey);
    expect(retrieved).toEqual(testVal);

    // Verify cache eviction on expired TTL
    const expiredKey = 'test:expired:dodo';
    await creatureCache.set(expiredKey, { name: 'Dodo' }, -10); // already expired
    const expiredResult = await creatureCache.get(expiredKey);
    expect(expiredResult).toBeNull();
  });

  it('resolves creature and retains curated fallback if remote calls fail or are offline', async () => {
    // Mock global fetch to simulate offline / network error
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    const targetCreature = CREATURE_CATALOG[1];
    const resolved = await creatureResolver.resolve(targetCreature);

    expect(resolved).toBeDefined();
    expect(resolved.identity.scientificName).toBe(targetCreature.scientificName);
    expect(resolved.sources.some((s) => s.provider === 'CuratedCatalog')).toBe(true);
  });

  it('resolves occurrence coordinates with fallback to catalog when offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    const targetCreature = CREATURE_CATALOG[0];
    const coords = await creatureResolver.resolveOccurrences(targetCreature);

    expect(coords.length).toBeGreaterThan(0);
    expect(coords[0].lat).toBe(targetCreature.coordinates[0].lat);
    expect(coords[0].lng).toBe(targetCreature.coordinates[0].lng);
  });

  it('converts NormalizedCreature back into a UI-ready Creature object', () => {
    const raw = CREATURE_CATALOG[0];
    const normalized = normalizeCatalogCreature(raw);
    const converted = normalizedToCreature(normalized);

    expect(converted).toBeDefined();
    expect(converted.commonName).toBe(raw.commonName);
    expect(converted.scientificName).toBe(raw.scientificName);
    expect(converted.habitatType).toBe(raw.habitatType);
    expect(converted.era).toBe(raw.era);
    expect(converted.coordinates.length).toBe(raw.coordinates.length);
  });

  it('converts an iNaturalist observation item into a Creature interface', () => {
    const mockObs = {
      id: 99999,
      taxon: {
        id: 1234,
        name: 'Danaus plexippus',
        preferred_common_name: 'Monarch Butterfly',
        iconic_taxon_name: 'Insecta',
        rank: 'species',
        wikipedia_url: 'https://en.wikipedia.org/wiki/Monarch_butterfly'
      },
      photos: [{ url: 'https://example.com/photos/1/square.jpg' }],
      place_guess: 'Michoacán, Mexico',
      geojson: { coordinates: [-100.28, 19.62] },
      observed_on_details: { year: 2024 },
      identifications_count: 12
    };

    const creature = inaturalistObservationToCreature(mockObs);
    expect(creature).not.toBeNull();
    expect(creature!.id).toBe('inat-99999');
    expect(creature!.commonName).toBe('Monarch Butterfly');
    expect(creature!.scientificName).toBe('Danaus plexippus');
    expect(creature!.photoUrl).toBe('https://example.com/photos/1/medium.jpg');
    expect(creature!.habitatType).toBe('forest');
    expect(creature!.coordinates.length).toBe(1);
    expect(creature!.coordinates[0].lat).toBe(19.62);
    expect(creature!.coordinates[0].lng).toBe(-100.28);
  });

  it('streamUntilTargetCount stops when target count is reached', async () => {
    // Mock fetch to return batches of 25 unique items
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        const results = Array.from({ length: 30 }, (_, i) => ({
          id: callCount * 1000 + i,
          taxon: {
            name: `Testus specius ${callCount}_${i}`,
            preferred_common_name: `Species ${callCount}_${i}`,
            iconic_taxon_name: 'Aves'
          },
          photos: [{ url: `https://example.com/photo_${callCount}_${i}/square.jpg` }]
        }));
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results })
        });
      })
    );

    const progressBatches: number[] = [];
    const creatures = await creatureResolver.streamUntilTargetCount(50, (_batch, total) => {
      progressBatches.push(total);
    });

    expect(creatures.length).toBeGreaterThanOrEqual(50);
    expect(progressBatches.length).toBeGreaterThan(0);
  });
});
