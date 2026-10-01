import { describe, it, expect } from 'vitest';
import { dot, fuse, loadCatalogVectors } from '../src/services/ai/vectorIndex';
import { creatureToEmbeddingText } from '../src/services/ai/embeddingText';
import type { Creature } from '../src/types/creature';

const makeMockCreature = (id: string, era = 'Modern', commonName = 'Test Creature'): Creature => ({
  id,
  commonName,
  scientificName: `${commonName}us testus`,
  extinctionYear: null,
  era: era as any,
  habitat: 'Ocean Depth',
  habitatType: 'marine',
  photoUrl: 'https://example.com/photo.jpg',
  description: 'A fascinating deep-sea predator with bioluminescent adaptations.',
  diet: 'Carnivore',
  stats: {
    lengthMeters: 1.5,
    weightKg: 20,
    dangerLevel: 6,
    rarityScore: 80,
  },
  taxonomy: {
    kingdom: 'Animalia',
    phylum: 'Chordata',
    class: 'Actinopterygii',
    order: 'Testiformes',
    family: 'Testidae',
    genus: 'Testus',
  },
  coordinates: [{ lat: 0, lng: 0, country: 'Pacific' }],
  themePalette: {
    primary: '#00ff66',
    darkMuted: '#051a0e',
    glow: 'rgba(0,255,102,0.4)',
    textAccent: '#00ff66',
    surface: '#0d1510',
  },
  wikiUrl: 'https://en.wikipedia.org/wiki/Test',
});

describe('Vector Index and Embeddings', () => {
  describe('dot product calculation', () => {
    it('dot of identical normalized vectors is ~1', () => {
      expect(dot([1, 0], [1, 0])).toBeCloseTo(1);
      expect(dot([0.6, 0.8], [0.6, 0.8])).toBeCloseTo(1);
    });

    it('dot of orthogonal vectors is 0', () => {
      expect(dot([1, 0], [0, 1])).toBeCloseTo(0);
    });
  });

  describe('creatureToEmbeddingText', () => {
    it('formats creature attributes into clean text', () => {
      const c = makeMockCreature('test-1', 'Mesozoic', 'Spinosaurus');
      const text = creatureToEmbeddingText(c);
      expect(text).toContain('Spinosaurus');
      expect(text).toContain('era: Mesozoic');
      expect(text).toContain('habitat: Ocean Depth');
      expect(text).toContain('diet: Carnivore');
      expect(text).toContain('bioluminescent adaptations');
    });
  });

  describe('loadCatalogVectors', () => {
    it('loads and parses precomputed creature catalog embeddings', async () => {
      const vectors = await loadCatalogVectors();
      expect(vectors).not.toBeNull();
      expect(vectors instanceof Map).toBe(true);
      expect(vectors!.size).toBeGreaterThanOrEqual(15);
      
      const firstVec = vectors!.get('glaucus-atlanticus');
      expect(firstVec).toBeDefined();
      expect(firstVec!.length).toBe(384);
    });
  });

  describe('fuse (Reciprocal Rank Fusion)', () => {
    it('surfaces high-similarity semantic hit even if not in lexical results', () => {
      const a = makeMockCreature('a', 'Modern', 'Creature A');
      const b = makeMockCreature('b', 'Modern', 'Creature B');
      const vecs = new Map([
        ['a', Float32Array.from([1, 0])],
        ['b', Float32Array.from([0, 1])],
      ]);

      const queryVector = Float32Array.from([1, 0]);
      const out = fuse([a, b], [], queryVector, vecs, 'all', { minSim: 0.3 });
      
      expect(out.map((c) => c.id)).toEqual(['a']); // 'b' is below minSim (0.0 < 0.3)
    });

    it('respects active era filter', () => {
      const a = makeMockCreature('a', 'Mesozoic');
      const vecs = new Map([['a', Float32Array.from([1, 0])]]);

      const queryVector = Float32Array.from([1, 0]);
      const outModern = fuse([a], [], queryVector, vecs, 'Modern');
      expect(outModern).toEqual([]);

      const outMesozoic = fuse([a], [], queryVector, vecs, 'Mesozoic');
      expect(outMesozoic.map((c) => c.id)).toEqual(['a']);
    });

    it('keeps lexical results when semantic results are empty or below threshold', () => {
      const a = makeMockCreature('a');
      const out = fuse([a], [a], Float32Array.from([1, 0]), new Map(), 'all');
      expect(out).toEqual([a]);
    });

    it('fuses lexical and semantic ranks properly', () => {
      const c1 = makeMockCreature('c1');
      const c2 = makeMockCreature('c2');
      const c3 = makeMockCreature('c3');

      // Lexical: [c1, c2]
      // Semantic: [c2, c3] (c2 has strong similarity 0.95, c3 has 0.8)
      const vecs = new Map([
        ['c1', Float32Array.from([0.4, 0.6])],
        ['c2', Float32Array.from([0.95, 0.05])],
        ['c3', Float32Array.from([0.8, 0.2])],
      ]);

      const queryVec = Float32Array.from([1, 0]);
      const fused = fuse([c1, c2, c3], [c1, c2], queryVec, vecs, 'all');

      expect(fused.length).toBe(3);
      // c2 is ranked #1 because it has both high lexical score + high semantic similarity
      expect(fused[0].id).toBe('c2');
    });
  });
});
