import { describe, it, expect } from 'vitest';
import {
  formatCreatureWeight,
  formatCreatureLength,
  formatExtinctionYear,
  formatDangerLevel
} from '../src/utils/formatters';

describe('Formatters Utility', () => {
  describe('formatCreatureWeight', () => {
    it('formats microscopic weights intuitively', () => {
      expect(formatCreatureWeight(0.00000001, true)).toBe('< 1µg');
      expect(formatCreatureWeight(0.00000001, false)).toContain('< 1 µg');
    });

    it('formats gram-range weights in grams instead of awkward decimals', () => {
      // 0.004 kg should be 4g, not 0.004kg
      expect(formatCreatureWeight(0.004, true)).toBe('4g');
      expect(formatCreatureWeight(0.004, false)).toBe('4 g');

      // 0.25 kg should be 250g
      expect(formatCreatureWeight(0.25, true)).toBe('250g');
      expect(formatCreatureWeight(0.25, false)).toBe('250 g');
    });

    it('formats standard kilograms', () => {
      expect(formatCreatureWeight(17.5, false)).toBe('17.5 kg');
      expect(formatCreatureWeight(250, true)).toBe('250kg');
    });

    it('formats megafauna in tons', () => {
      expect(formatCreatureWeight(7400, false)).toBe('7.4 tons');
      expect(formatCreatureWeight(7400, true)).toBe('7.4t');
      expect(formatCreatureWeight(50000, true)).toBe('50t');
    });
  });

  describe('formatCreatureLength', () => {
    it('formats sub-centimeter organisms in millimeters', () => {
      expect(formatCreatureLength(0.0005, true)).toBe('0.5mm');
      expect(formatCreatureLength(0.0005, false)).toBe('0.5 mm');
    });

    it('formats pocket-sized creatures in centimeters', () => {
      // 0.03 m should be 3cm, not 0.03m
      expect(formatCreatureLength(0.03, true)).toBe('3cm');
      expect(formatCreatureLength(0.03, false)).toBe('3 cm');

      // 0.25 m should be 25cm
      expect(formatCreatureLength(0.25, true)).toBe('25cm');
      expect(formatCreatureLength(0.25, false)).toBe('25 cm');
    });

    it('formats meter-scale organisms', () => {
      expect(formatCreatureLength(1.8, true)).toBe('1.8m');
      expect(formatCreatureLength(14.0, false)).toBe('14 m');
    });
  });

  describe('formatExtinctionYear', () => {
    it('formats deep time in millions of years', () => {
      expect(formatExtinctionYear(-93500000, false)).toBe('93.5M years ago');
      expect(formatExtinctionYear(-66000000, true)).toBe('66M ya');
    });

    it('formats historical extinctions with CE', () => {
      expect(formatExtinctionYear(1662, false)).toBe('1662 CE');
      expect(formatExtinctionYear(1936, true)).toBe('1936');
    });

    it('formats extant organisms', () => {
      expect(formatExtinctionYear(null, false)).toBe('Living Species');
      expect(formatExtinctionYear(null, true)).toBe('Living');
    });
  });

  describe('formatDangerLevel', () => {
    it('provides descriptive labels for threat levels', () => {
      expect(formatDangerLevel(10).label).toBe('Apex Predator');
      expect(formatDangerLevel(8).label).toBe('High Threat');
      expect(formatDangerLevel(5).label).toBe('Defensive');
      expect(formatDangerLevel(1).label).toBe('Harmless');
    });
  });
});
