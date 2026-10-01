import { describe, it, expect } from 'vitest';
import { chromeAI } from '../src/services/ai/chromeAIService';
import { CREATURE_CATALOG } from '../src/data/creatureCatalog';

describe('Search & Semantic Intelligence Integration', () => {
  it('parses complex natural language biodiversity queries into structured facets', async () => {
    const intent = await chromeAI.parseSemanticSearchIntent('find tiny bizarre deep sea organism');
    expect(intent).toBeDefined();
    expect(intent.size).toBe('micro');
    expect(intent.habitatType).toBe('marine');
    expect(intent.unusual).toBe(true);
    expect(intent.semanticConcepts.length).toBeGreaterThan(0);
  });

  it('matches creatures based on parsed semantic intent and facets', async () => {
    const intent = await chromeAI.parseSemanticSearchIntent('colossal apex carnivore predator');
    expect(intent.size).toBe('colossal');
    expect(intent.diet).toBe('carnivore');

    const matching = CREATURE_CATALOG.filter(
      (c) => c.diet.toLowerCase().includes('carnivore') && c.stats.weightKg > 500
    );

    expect(matching.length).toBeGreaterThan(0);
    expect(matching.some((c) => c.id === 'spinosaurus-aegyptiacus' || c.id === 'megalodon')).toBe(true);
  });

  it('calculates biological similarity index between related Mesozoic reptiles', () => {
    const spinosaurus = CREATURE_CATALOG.find((c) => c.id === 'spinosaurus-aegyptiacus')!;
    const quetzalcoatlus = CREATURE_CATALOG.find((c) => c.id === 'quetzalcoatlus-northropi')!;

    const similarity = chromeAI.calculateCreatureSimilarity(spinosaurus, quetzalcoatlus);
    expect(similarity).toBeDefined();
    expect(similarity.score).toBeGreaterThan(0);
    expect(similarity.breakdown.taxonomy).toBeGreaterThanOrEqual(40);
    expect(similarity.sharedTraits).toContain('Shared Phylum: Chordata');
    expect(similarity.sharedTraits).toContain('Shared Class: Reptilia');
    expect(similarity.sharedTraits).toContain('Both Extinct Lineages');
  });
});

