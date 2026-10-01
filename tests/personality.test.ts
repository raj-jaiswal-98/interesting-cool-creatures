import { describe, it, expect } from 'vitest';
import {
  getCreaturePersonalityTags,
  getCreatureTinyFact,
  getCreatureFamilySummary,
  getCreatureHumanScale
} from '../src/utils/personality';
import { CREATURE_CATALOG } from '../src/data/creatureCatalog';

describe('Personality & Museum Presentation Utilities', () => {
  it('generates playful personality tags with emoji for catalog creatures', () => {
    const tardigrade = CREATURE_CATALOG.find((c) => c.id === 'tardigrada')!;
    const tags = getCreaturePersonalityTags(tardigrade);

    expect(tags.length).toBeGreaterThanOrEqual(2);
    expect(tags.some((t) => t.includes('indestructible') || t.includes('tiny') || t.includes('bizarre'))).toBe(true);
  });

  it('generates cute personality tags for fierce extinct apex creatures', () => {
    const spino = CREATURE_CATALOG.find((c) => c.id === 'spinosaurus-aegyptiacus')!;
    const tags = getCreaturePersonalityTags(spino);

    expect(tags.length).toBeGreaterThanOrEqual(2);
    expect(tags.some((t) => t.includes('apex') || t.includes('giant') || t.includes('ancient'))).toBe(true);
  });

  it('produces a concise tiny fact hook for cards', () => {
    const blueDragon = CREATURE_CATALOG.find((c) => c.id === 'glaucus-atlanticus')!;
    const fact = getCreatureTinyFact(blueDragon);

    expect(typeof fact).toBe('string');
    expect(fact.length).toBeGreaterThan(10);
  });

  it('produces human-readable family summaries', () => {
    const spino = CREATURE_CATALOG.find((c) => c.id === 'spinosaurus-aegyptiacus')!;
    const summary = getCreatureFamilySummary(spino);

    expect(summary).toContain('extinct');
    expect(summary).toContain('Spinosauridae family');
  });

  it('computes intuitive human scale comparisons for micro, pocket, and colossal organisms', () => {
    const tardigrade = CREATURE_CATALOG.find((c) => c.id === 'tardigrada')!;
    const microScale = getCreatureHumanScale(tardigrade);
    expect(microScale.icon).toBe('🔬');
    expect(microScale.label).toContain('Microscopic');

    const blueDragon = CREATURE_CATALOG.find((c) => c.id === 'glaucus-atlanticus')!;
    const pocketScale = getCreatureHumanScale(blueDragon);
    expect(pocketScale.icon).toBe('🪙');
    expect(pocketScale.label).toContain('Pocket-sized');

    const spino = CREATURE_CATALOG.find((c) => c.id === 'spinosaurus-aegyptiacus')!;
    const colossalScale = getCreatureHumanScale(spino);
    expect(colossalScale.icon).toBe('🦕');
    expect(colossalScale.label).toContain('Colossal');
    expect(colossalScale.visualRatio).toBe(1.0);
  });
});
