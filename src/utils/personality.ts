import type { Creature } from '../types/creature';

/**
 * Derives 2-3 warm, playful editorial personality tags for a creature.
 * As defined in Section 9 of ui-design-update.md.
 */
export function getCreaturePersonalityTags(creature: Creature): string[] {
  const tags: string[] = [];
  const text = `${creature.commonName} ${creature.description} ${creature.habitat}`.toLowerCase();

  // 1. Adorable / Tiny
  if (
    creature.stats.weightKg < 0.1 ||
    /axolotl|dumbo|quokka|slug|tardigrade|otter|fennec|pika|glaucus/i.test(creature.commonName) ||
    (creature.stats.rarityScore > 85 && creature.stats.dangerLevel <= 3)
  ) {
    tags.push('🥹 adorable');
  }

  // 2. Habitat
  if (creature.habitatType === 'marine') {
    tags.push('🌊 ocean');
  } else if (creature.habitatType === 'forest') {
    tags.push('🌿 woodland');
  } else if (creature.habitatType === 'tundra') {
    tags.push('❄️ polar');
  } else if (creature.habitatType === 'volcanic') {
    tags.push('🌋 primeval');
  } else if (creature.habitatType === 'aerial') {
    tags.push('🪶 airborne');
  }

  // 3. Clever / Brainy
  if (
    /octopus|crow|chimp|dolphin|whale|parrot|raven|squid/i.test(creature.commonName) ||
    /intelligent|tool|brain|problem|cunning/i.test(text)
  ) {
    tags.push('🧠 clever');
  }

  // 4. Bizarre / Alien
  if (
    creature.stats.rarityScore >= 90 ||
    /bioluminescent|extremophile|regenerat|transparent|alien|weird|glass/i.test(text)
  ) {
    tags.push('✨ bizarre');
  }

  // 5. Intimidating / Apex
  if (creature.stats.dangerLevel >= 9) {
    tags.push('🦷 apex');
  }

  // 6. Ancient / Prehistoric
  if (creature.extinctionYear !== null) {
    tags.push('🔮 ancient');
  }

  // 7. Diet
  if (creature.diet.toLowerCase().includes('carnivore')) {
    tags.push('🥩 hunter');
  } else if (creature.diet.toLowerCase().includes('herbivore')) {
    tags.push('🍃 gentle');
  }

  // Deduplicate and return top 3
  const unique = Array.from(new Set(tags));
  return unique.slice(0, 3);
}

/**
 * Extracts a concise 1-sentence "tiny fact" from creature description.
 * As defined in Section 10 of ui-design-update.md.
 */
export function getCreatureTinyFact(creature: Creature): string {
  if (!creature.description) return `${creature.commonName} is one of Earth's most remarkable organisms.`;

  // Grab the first or most interesting sentence
  const sentences = creature.description.split(/(?<=[.!?])\s+/);
  if (sentences.length > 0) {
    // If first sentence is punchy (< 160 chars), use it
    if (sentences[0].length <= 160) {
      return sentences[0];
    }
    // Otherwise trim it neatly
    return sentences[0].slice(0, 150).replace(/,?\s+[^, ]*$/, '...');
  }

  return creature.description;
}

/**
 * Produces an approachable human-readable family summary.
 * e.g. "A marine mollusk in the nudibranch family" instead of cold hierarchical tables.
 * As defined in Section 14 of ui-design-update.md.
 */
export function getCreatureFamilySummary(creature: Creature): string {
  const parts: string[] = [];

  if (creature.extinctionYear !== null) {
    parts.push('An extinct');
  } else {
    parts.push('A living');
  }

  if (creature.habitatType === 'marine') {
    parts.push('marine');
  } else if (creature.habitatType === 'forest') {
    parts.push('forest-dwelling');
  } else if (creature.habitatType === 'tundra') {
    parts.push('arctic');
  }

  const taxClass = creature.taxonomy.class || '';
  const taxFamily = creature.taxonomy.family || '';

  if (taxClass) {
    parts.push(taxClass.toLowerCase());
  }

  if (taxFamily) {
    return `${parts.join(' ')} in the ${taxFamily} family.`;
  }

  return `${parts.join(' ')}.`;
}
