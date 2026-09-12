import { describe, it, expect } from 'vitest';
import { chromeAI } from '../src/services/ai/chromeAIService';
import { proceduralAI } from '../src/services/ai/proceduralSpeculationEngine';

describe('ChromeAIService & Procedural Fallback Engine', () => {
  const dummyCreatureA = {
    id: 'spinosaurus',
    commonName: 'Spinosaurus',
    scientificName: 'Spinosaurus aegyptiacus',
    habitat: 'Cretaceous Mangroves',
    habitatType: 'volcanic',
    stats: { weightKg: 7400, dangerLevel: 10 }
  };

  const dummyCreatureB = {
    id: 'smilodon',
    commonName: 'Smilodon',
    scientificName: 'Smilodon populator',
    habitat: 'Pleistocene Pampas',
    habitatType: 'tundra',
    stats: { weightKg: 400, dangerLevel: 9 }
  };

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
});
