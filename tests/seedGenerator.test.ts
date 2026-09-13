import { describe, it, expect } from 'vitest';
import {
  getDailyCreatureIndex,
  getDailySpotlightCreature,
  getTimeUntilNextSpotlight
} from '../src/utils/seedGenerator';

describe('SeedGenerator Utilities', () => {
  const dummyCatalog = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
    { id: 'c', name: 'Gamma' },
    { id: 'd', name: 'Delta' }
  ];

  it('generates a consistent deterministic index for the same date string', () => {
    const date = '2026-09-12';
    const index1 = getDailyCreatureIndex(dummyCatalog.length, date);
    const index2 = getDailyCreatureIndex(dummyCatalog.length, date);

    expect(index1).toBe(index2);
    expect(index1).toBeGreaterThanOrEqual(0);
    expect(index1).toBeLessThan(dummyCatalog.length);
  });

  it('produces indices strictly within array bounds', () => {
    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
      const idx = getDailyCreatureIndex(12, dateStr);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(12);
    }
  });

  it('selects the same spotlight creature object for identical date strings', () => {
    const creatureA = getDailySpotlightCreature(dummyCatalog, '2026-09-12');
    const creatureB = getDailySpotlightCreature(dummyCatalog, '2026-09-12');
    expect(creatureA).toBeDefined();
    expect(creatureA!.id).toBe(creatureB!.id);
  });

  it('returns valid countdown hours, minutes, and seconds', () => {
    const countdown = getTimeUntilNextSpotlight();
    expect(countdown.hours).toBeGreaterThanOrEqual(0);
    expect(countdown.hours).toBeLessThanOrEqual(24);
    expect(countdown.minutes).toBeGreaterThanOrEqual(0);
    expect(countdown.minutes).toBeLessThanOrEqual(59);
    expect(countdown.seconds).toBeGreaterThanOrEqual(0);
    expect(countdown.seconds).toBeLessThanOrEqual(59);
    expect(countdown.diffMs).toBeGreaterThan(0);
  });
});
