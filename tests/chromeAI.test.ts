import { describe, it, expect } from 'vitest';
import { chromeAI } from '../src/services/ai/chromeAIService';
import { proceduralAI } from '../src/services/ai/proceduralSpeculationEngine';
import type { Creature } from '../src/types/creature';

describe('ChromeAIService & Procedural Fallback Engine', () => {
  // Only the fields simulateCreatureClash actually reads are provided
  const dummyCreatureA = {
    id: 'spinosaurus',
    commonName: 'Spinosaurus',
    scientificName: 'Spinosaurus aegyptiacus',
    habitat: 'Cretaceous Mangroves',
    habitatType: 'volcanic',
    stats: { weightKg: 7400, dangerLevel: 10 }
  } as Creature;

  const dummyCreatureB = {
    id: 'smilodon',
    commonName: 'Smilodon',
    scientificName: 'Smilodon populator',
    habitat: 'Pleistocene Pampas',
    habitatType: 'tundra',
    stats: { weightKg: 400, dangerLevel: 9 }
  } as Creature;

  it('detects AI availability or falls back to unavailable cleanly in test env', async () => {
    const status = await chromeAI.checkAvailability();
    expect(['readily', 'after-download', 'unavailable']).toContain(status);
  });

  it('generates rich speculative evolution through procedural engine when offline', async () => {
    const result = await chromeAI.generateSpeculativeEvolution('Spinosaurus', 'Mangroves', 'warming');
    expect(result).toBeDefined();
    expect(result.futureScientificName).toContain('Neo-Spinosaurus');
    expect(result.narrative).toBeDefined();
    expect(result.adaptations.length).toBeGreaterThan(0);
    expect(result.survivalRating).toBeGreaterThanOrEqual(50);
  });

  it('simplifies academic taxonomy into concise conversational text', async () => {
    const text = 'Paedomorphic amphibian exhibiting extreme limb regrowth and branchial gill plumes.';
    const translation = await chromeAI.translateTaxonomy(text, 'Axolotl');
    expect(translation).toBeDefined();
    expect(translation.text.length).toBeGreaterThan(15);
  });

  it('simulates creature duel with combat log and reasonable probability', async () => {
    const clash = await chromeAI.simulateCreatureClash(dummyCreatureA, dummyCreatureB);
    expect(clash).toBeDefined();
    expect(clash.winner).toBeDefined();
    expect(clash.winProbability).toBeGreaterThanOrEqual(50);
    expect(clash.combatLog.length).toBeGreaterThanOrEqual(1);
  });

  it('detects on-device AI capabilities object cleanly', async () => {
    const caps = await chromeAI.detectCapabilities();
    expect(caps).toHaveProperty('localLLM');
    expect(caps).toHaveProperty('vision');
    expect(caps).toHaveProperty('embeddings');
    expect(caps).toHaveProperty('webGPU');
    expect(typeof caps.localLLM).toBe('boolean');
  });

  it('parses semantic search intent from natural language queries', async () => {
    const intent = await chromeAI.parseSemanticSearchIntent('tiny alien deep sea predator');
    expect(intent).toBeDefined();
    expect(intent.size).toBe('micro');
    expect(intent.habitatType).toBe('marine');
    expect(intent.diet).toBe('carnivore');
    expect(intent.unusual).toBe(true);
    expect(intent.semanticConcepts).toContain('alien');
  });

  it('calculates model-derived creature similarity score and shared traits', () => {
    const sim = chromeAI.calculateCreatureSimilarity(
      {
        ...dummyCreatureA,
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Reptilia', order: 'Saurischia', family: 'Spinosauridae', genus: 'Spinosaurus' },
        era: 'Mesozoic',
        extinctionYear: -95000000,
        diet: 'Carnivore (Piscivore)'
      } as Creature,
      {
        ...dummyCreatureB,
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Carnivora', family: 'Felidae', genus: 'Smilodon' },
        era: 'Pleistocene',
        extinctionYear: -10000,
        diet: 'Carnivore'
      } as Creature
    );

    expect(sim).toBeDefined();
    expect(sim.score).toBeGreaterThan(0);
    expect(sim.score).toBeLessThanOrEqual(100);
    expect(sim.sharedTraits).toContain('Shared Phylum: Chordata');
    expect(sim.sharedTraits).toContain('Both Extinct Lineages');
    expect(sim.isModelDerived).toBe(true);
  });

  it('provides safe visual image analysis fallback when canvas or image is mocked', async () => {
    const analysis = await chromeAI.analyzeImageVisuals('https://images.unsplash.com/photo-1544551763-46a013bb70d5');
    expect(analysis).toBeDefined();
    expect(analysis.brightness).toBeGreaterThanOrEqual(0);
    expect(analysis.contrast).toBeGreaterThanOrEqual(0);
    expect(['warm', 'cool', 'neutral']).toContain(analysis.colorTemperature);
  });
});

