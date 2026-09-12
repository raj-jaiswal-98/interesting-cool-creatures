import { describe, it, expect } from 'vitest';
import { CREATURE_CATALOG } from '../src/data/creatureCatalog';

describe('Creature Catalog Integrity', () => {
  it('contains at least 10 rich species profiles', () => {
    expect(CREATURE_CATALOG.length).toBeGreaterThanOrEqual(10);
  });

  it('guarantees unique IDs across all catalog entries', () => {
    const ids = CREATURE_CATALOG.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('ensures every creature has required fields', () => {
    CREATURE_CATALOG.forEach(creature => {
      expect(creature.id).toBeTruthy();
      expect(creature.commonName).toBeTruthy();
      expect(creature.scientificName).toBeTruthy();
      expect(['Mesozoic', 'Cenozoic', 'Pleistocene', 'Holocene', 'Modern']).toContain(creature.era);
      expect(creature.photoUrl).toBeTruthy();
      expect(creature.habitat).toBeTruthy();
      expect(creature.description).toBeTruthy();
      expect(creature.stats).toBeDefined();
      expect(creature.stats.dangerLevel).toBeGreaterThanOrEqual(1);
      expect(creature.stats.dangerLevel).toBeLessThanOrEqual(10);
      expect(creature.coordinates).toBeInstanceOf(Array);
      expect(creature.coordinates.length).toBeGreaterThan(0);
      expect(creature.themePalette).toBeDefined();
      expect(creature.themePalette.primary).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
