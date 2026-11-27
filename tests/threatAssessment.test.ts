import { describe, it, expect } from 'vitest';
import { assessThreat, getThreatProfile } from '../src/utils/threatAssessment';
import { buildDossier, getSimplifiedDossier, isBoilerplateText } from '../src/utils/creatureSimplifier';
import { inaturalistObservationToCreature } from '../src/services/resolver/creatureResolver';
import { themeEngine } from '../src/services/theme/themeEngine';
import { CREATURE_CATALOG } from '../src/data/creatureCatalog';

const inatItem = (name: string, common: string, iconic: string) => ({
  id: 4242,
  place_guess: 'Yavatmal, IN-MH, IN',
  photos: [{ url: 'https://example.com/square.jpg' }],
  taxon: { name, preferred_common_name: common, iconic_taxon_name: iconic }
});

describe('Threat assessment', () => {
  it('rates a Bengal tiger as an apex predator, not harmless', () => {
    const t = assessThreat({ commonName: 'Bengal Tiger', scientificName: 'Panthera tigris tigris', taxonomy: { class: 'Mammalia' } });
    expect(t.level).toBeGreaterThanOrEqual(9);
    expect(t.kind).toBe('apex');
    expect(t.size?.[1]).toBeGreaterThan(150);
  });

  it('recognises venomous animals from family or common name', () => {
    expect(assessThreat({ commonName: 'Indian Cobra', scientificName: 'Naja naja', taxonomy: { class: 'Reptilia', family: 'Elapidae' } }).kind).toBe('venomous');
    expect(assessThreat({ commonName: 'Western Diamondback Rattlesnake', scientificName: 'Crotalus atrox', taxonomy: { class: 'Reptilia' } }).level).toBeGreaterThanOrEqual(7);
  });

  it('keeps genuinely harmless animals low', () => {
    const t = assessThreat({ commonName: 'European Robin', scientificName: 'Erithacus rubecula', taxonomy: { class: 'Aves' }, weightKg: 0.02, diet: 'Insectivore' });
    expect(t.level).toBeLessThanOrEqual(2);
  });

  it('does not treat "bearded dragon" as a bear', () => {
    const t = assessThreat({ commonName: 'Central Bearded Dragon', scientificName: 'Pogona vitticeps', taxonomy: { class: 'Reptilia' }, weightKg: 0.4 });
    expect(t.kind).not.toBe('predator');
  });

  it('applies the assessment to live iNaturalist observations', () => {
    const tiger = inaturalistObservationToCreature(inatItem('Panthera tigris tigris', 'Bengal Tiger', 'Mammalia'))!;
    expect(tiger.stats.dangerLevel).toBeGreaterThanOrEqual(9);
    expect(tiger.stats.lengthMeters).toBeGreaterThan(2);
    expect(getThreatProfile(tiger).label).toBe('Apex Predator');
  });

  it('keeps curated catalog danger levels', () => {
    for (const c of CREATURE_CATALOG) {
      expect(getThreatProfile(c).level).toBe(c.stats.dangerLevel);
    }
  });
});

describe('Dossier descriptions', () => {
  const tiger = inaturalistObservationToCreature(inatItem('Panthera tigris tigris', 'Bengal Tiger', 'Mammalia'))!;

  it('never shows observation boilerplate as a fact', () => {
    expect(isBoilerplateText(tiger.description)).toBe(true);
    const d = getSimplifiedDossier(tiger);
    expect(d.headline).toBe('Bengal Tiger: a living mammal and apex predator');
    expect(d.superpower).not.toMatch(/sighting|documented|verified/i);
    expect(d.funFact).not.toMatch(/verified through/i);
    expect(d.sizeComparison).toMatch(/small car|sofa/);
    expect(d.danger).toMatch(/^Apex Predator:/);
  });

  it('builds the dossier from a Wikipedia summary when available', () => {
    const d = buildDossier(tiger, {
      title: 'Bengal tiger',
      tagline: 'Population of tiger subspecies',
      extract:
        'The Bengal tiger is a population of the Panthera tigris tigris subspecies. It ranks among the biggest wild cats alive today. It is considered to belong to the world’s charismatic megafauna. The tiger uses its striped coat as camouflage to ambush prey such as deer and wild boar. It was designated the national animal of India in 1973.',
      url: 'https://en.wikipedia.org/wiki/Bengal_tiger'
    });
    expect(d.source).toBe('wikipedia');
    expect(d.headline).toBe('Bengal Tiger: population of tiger subspecies');
    expect(d.superpower).toMatch(/camouflage/);
    expect(d.funFact).toMatch(/national animal|biggest/);
  });
});

describe('Theme legibility', () => {
  it('lifts a dull photo color until it reads on ink, keeping its hue', () => {
    const muddy = [60, 70, 40];
    const out = themeEngine.makeLegible(muddy);
    expect(themeEngine.contrastOnInk(out)).toBeGreaterThanOrEqual(3);
    const [h1] = themeEngine.rgbToHsl(muddy);
    const [h2] = themeEngine.rgbToHsl(out);
    expect(Math.abs(h1 - h2)).toBeLessThan(0.03);
  });

  it('prefers a vivid swatch over grey or near-black ones', () => {
    const pick = themeEngine.pickAccentSwatch([[20, 20, 20], [128, 128, 128], [214, 120, 40]]);
    expect(pick).toEqual([214, 120, 40]);
  });
});
