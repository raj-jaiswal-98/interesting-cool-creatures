import { describe, it, expect } from 'vitest';
import { getSimplifiedDossier } from '../src/utils/creatureSimplifier';
import { CREATURE_CATALOG } from '../src/data/creatureCatalog';

describe('CreatureSimplifier Utility', () => {
  it('returns curated simplified dossiers for catalog creatures', () => {
    const blueDragon = CREATURE_CATALOG.find((c) => c.id === 'glaucus-atlanticus')!;
    const dossier = getSimplifiedDossier(blueDragon);

    expect(dossier.headline).toContain('miniature dragon');
    expect(dossier.superpower).toContain('Portuguese Man o’ Wars');
    expect(dossier.funFact).toContain('upside down');
    expect(dossier.sizeComparison).toContain('3 cm');
  });

  it('generates algorithmic fallback dossier for unknown or dynamic creatures', () => {
    const mockDynamicCreature = {
      id: 'dynamic-jelly-xyz',
      commonName: 'Deep Sea Crown Jelly',
      scientificName: 'Atolla wyvillei',
      extinctionYear: null,
      era: 'Modern' as const,
      habitat: 'Bathyal Oceanic Trench',
      habitatType: 'marine' as const,
      photoUrl: 'https://example.com/photo.jpg',
      description: 'A bioluminescent crown jellyfish that emits circular flashes of blue light when attacked to attract larger predators to eat its attacker.',
      diet: 'Carnivore',
      stats: {
        lengthMeters: 0.15,
        weightKg: 0.2,
        dangerLevel: 4,
        rarityScore: 90
      },
      taxonomy: {
        kingdom: 'Animalia',
        phylum: 'Cnidaria',
        class: 'Scyphozoa',
        order: 'Coronatae',
        family: 'Atollidae',
        genus: 'Atolla'
      },
      coordinates: [],
      wikiUrl: 'https://en.wikipedia.org/wiki/Atolla_jellyfish',
      themePalette: {
        primary: '#FF0055',
        darkMuted: '#100008',
        glow: 'rgba(255, 0, 85, 0.3)',
        textAccent: '#FF77AA',
        surface: '#200010'
      }
    };

    const dossier = getSimplifiedDossier(mockDynamicCreature);
    expect(dossier.headline).toBe('Deep Sea Crown Jelly (Modern Era)');
    expect(dossier.superpower).toContain('bioluminescent');
    expect(dossier.sizeComparison).toBe('Pocket / Hand-sized');
  });
});
