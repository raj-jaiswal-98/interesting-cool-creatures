import type { Creature } from '../../types/creature';

export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
export const TEXT_VERSION = 1;

export function creatureToEmbeddingText(c: Creature): string {
  const desc = c.description;
  return [
    c.commonName,
    c.scientificName,
    c.era && `era: ${c.era}`,
    c.habitat && `habitat: ${c.habitat}`,
    c.diet && `diet: ${c.diet}`,
    desc,
  ]
    .filter(Boolean)
    .join('. ');
}
