import type { Creature } from '../types/creature';
import type { WikiSummary } from '../services/api/wikipediaService';
import { formatCreatureLength, formatCreatureWeight } from './formatters';
import { getThreatProfile } from './threatAssessment';

export interface SimplifiedDossier {
  headline: string;
  superpower: string;
  funFact: string;
  sizeComparison: string;
  /** Danger to people, e.g. "Apex Predator: ..." */
  danger?: string;
  source?: 'curated' | 'wikipedia' | 'record' | 'field';
  sourceUrl?: string;
  /** Full readable text for the Science view. */
  summary?: string | null;
}

const CURATED_SIMPLIFIED: Record<string, SimplifiedDossier> = {
  'glaucus-atlanticus': {
    headline: 'Venom-stealing floating miniature dragon',
    superpower: 'Eats deadly Portuguese Man o’ Wars and stores their venom to sting predators 10x harder.',
    funFact: 'Drifts completely upside down by swallowing a tiny air bubble inside its stomach.',
    sizeComparison: 'About the size of a coin (3 cm)'
  },
  'spinosaurus-aegyptiacus': {
    headline: 'The longest predatory dinosaur ever discovered',
    superpower: 'Paddle-shaped tail and crocodile snout built for hunting massive prehistoric fish underwater.',
    funFact: 'Longer than a T-Rex and Giganotosaurus, with a 6-foot tall sail on its spine.',
    sizeComparison: 'As long as a city bus (14 meters)'
  },
  'tardigrada': {
    headline: 'Virtually indestructible microscopic survivor',
    superpower: 'Turns into a dry glass ball (cryptobiosis) to survive boiling, freezing, and radiation.',
    funFact: 'Survives the raw vacuum of outer space and 1,000 times the lethal human radiation dose.',
    sizeComparison: 'Microscopic (smaller than a pencil dot, 0.5 mm)'
  },
  'quetzalcoatlus-northropi': {
    headline: 'The largest flying animal in Earth’s history',
    superpower: 'Vaults off the ground on all four limbs like a pole-vaulter to take flight.',
    funFact: 'Stood as tall as a giraffe on the ground with the wingspan of a fighter jet.',
    sizeComparison: 'Wingspan equal to a two-seater airplane (11 meters)'
  },
  'titanoboa-cerrejonensis': {
    headline: 'A monstrous constrictor longer than a school bus',
    superpower: 'Crushing constriction force that could snap giant prehistoric crocodiles in half.',
    funFact: 'Thrived in sweltering 90°F tropical heat that enabled reptiles to grow to terrifying giant sizes.',
    sizeComparison: '43 feet long and over 2,500 pounds'
  },
  'smilodon-populator': {
    headline: 'Heavyweight cat with 11-inch curved daggers',
    superpower: 'Wrestled bison and mammoths with bear-like muscular arms before slicing neck veins.',
    funFact: 'Could open its jaws up to 120 degrees—twice as wide as a modern African lion.',
    sizeComparison: 'Weighed as much as a grand piano (400 kg)'
  },
  'raphus-cucullatus': {
    headline: 'The flightless giant pigeon of Mauritius',
    superpower: 'Evolved without any land predators on an isolated tropical island for millions of years.',
    funFact: 'Lacked any instinct of fear toward humans, which led to rapid extinction within 60 years of discovery.',
    sizeComparison: 'Turkey-sized (3 feet tall, 40 pounds)'
  },
  'thylacinus-cynocephalus': {
    headline: 'The marsupial carnivore with tiger stripes',
    superpower: 'Convergent evolution made it look like a wolf despite carrying joeys in a pouch.',
    funFact: 'Could gape its jaw to an extraordinary 120-degree angle to intimidate rivals.',
    sizeComparison: 'Size of a medium dog or coyote (6 feet with tail)'
  },
  'ambystoma-mexicanum': {
    headline: 'The salamander that never grows up and regrows limbs',
    superpower: 'Can regenerate lost legs, tail, heart tissue, and even parts of its brain without scarring.',
    funFact: 'Stays in its juvenile aquatic larval stage with external feathery gills its entire life.',
    sizeComparison: 'Fits in your hand (10 inches, 25 cm)'
  },
  'vampyroteuthis-infernalis': {
    headline: 'Abyssal cephalopod glowing in the deep ocean',
    superpower: 'Thrives in suffocating deep ocean dead zones with almost zero oxygen.',
    funFact: 'Instead of ink, it shoots glowing bioluminescent slime to blind deep-sea attackers.',
    sizeComparison: 'Football-sized (12 inches, 30 cm)'
  },
  'psychrolutes-marcidus': {
    headline: 'Deep-sea jelly fish built for extreme pressure',
    superpower: 'Gelatinous flesh matches ocean density, allowing effortless floating without a swim bladder.',
    funFact: 'Only looks "melted" when pulled out of its high-pressure native depth 4,000 feet down.',
    sizeComparison: 'Bowling pin sized (12 inches, 30 cm)'
  },
  'megalodon': {
    headline: 'The supreme ocean titan with tooth size of a hand',
    superpower: 'Jaw bite force of 180,000 newtons—strong enough to bite an ancient whale in half.',
    funFact: 'Shed thousands of serrated 7-inch teeth throughout its lifetime.',
    sizeComparison: 'As long as a semi-truck trailer (18 meters)'
  },
  'odontodactylus-scyllarus': {
    headline: 'Rainbow reef assassin with bullet-speed punch',
    superpower: 'Punches prey at the speed of a .22 caliber bullet, boiling water with cavitation bubbles.',
    funFact: 'Possesses 16 color receptors (humans only have 3) and can see circular polarized light.',
    sizeComparison: 'Size of a large cigar (7 inches, 18 cm)'
  },
  'latimeria-chalumnae': {
    headline: 'The living fossil with limb-like walking fins',
    superpower: 'Articulated leg-like fins mirror the ancestors of the first creatures that walked on land.',
    funFact: 'Thought to have died with the dinosaurs 66 million years ago until pulled up in a fishing net in 1938.',
    sizeComparison: 'Human-sized fish (6.5 feet long, 175 lbs)'
  },
  'smutsia-temminckii': {
    headline: 'The world’s only mammal covered in reptile-like armor',
    superpower: 'Rolls into an impenetrable keratin ball that even lion teeth cannot puncture.',
    funFact: 'Its scales make up 20% of its body weight, and it sweeps razor-sharp tail edges in defense.',
    sizeComparison: 'Size of a medium dog (3.5 feet, 30 lbs)'
  }
};

/** Phrases that mark auto-generated placeholder text rather than real biology. */
const BOILERPLATE = /research-grade|documented in|verified through|observer network|photographed in the wild|open scientific biodiversity telemetry|extraordinary species documented/i;

export function isBoilerplateText(text: string | undefined | null): boolean {
  return !text || BOILERPLATE.test(text);
}

const ABILITY =
  /\b(can|able to|capable|adapt|uses?|ability|known for|hunts?|ambush|speed|fastest|strongest|venom|camouflag|regenerat|mimic|echolocat|migrat|nocturnal|bite|sting|glide|dives?|swims?|climb|dig|burrow|senses?|sight|smell|hearing|tongue|claws?|jaws?|teeth|horns?|spines?|armou?r|electric|biolumin)/gi;
const FACT =
  /(\d|\b\w+est\b|\bonly\b|\bunique\b|\brecord|\bnamed\b|\bunlike\b|\bmost\b|\bnational\b|\bsymbol\b|\bendangered\b|\bthreatened\b|\bdiscovered\b|\bancient\b|\bmillion\b)/gi;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Splits prose into clean, display-ready sentences. */
export function toSentences(text: string): string[] {
  return text
    .replace(/\s*\([^()]*\)/g, '') // drop parentheticals (pronunciations, synonyms)
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 280 && !BOILERPLATE.test(s));
}

const score = (s: string, re: RegExp) => (s.match(re) || []).length;

function pickBest(sentences: string[], re: RegExp, exclude: Set<string>): string | null {
  let best: string | null = null;
  let bestScore = 0;
  for (const s of sentences) {
    if (exclude.has(s)) continue;
    const sc = score(s, re);
    if (sc > bestScore) {
      best = s;
      bestScore = sc;
    }
  }
  return best;
}

/** Everyday-object comparison for a body length (and weight when known). */
export function describeRealScale(lengthM: number, weightKg?: number): string {
  let object: string;
  if (lengthM < 0.001) object = 'Smaller than a grain of sand';
  else if (lengthM < 0.01) object = 'About the size of a grain of rice';
  else if (lengthM < 0.03) object = 'About as long as a paperclip';
  else if (lengthM < 0.1) object = 'Would fit on a credit card';
  else if (lengthM < 0.3) object = 'About as long as a pencil';
  else if (lengthM < 0.7) object = 'About the size of a house cat';
  else if (lengthM < 1.5) object = 'About as big as a large dog';
  else if (lengthM < 2.5) object = 'About as long as a sofa';
  else if (lengthM < 4) object = 'About as long as a small car';
  else if (lengthM < 8) object = 'About as long as a pickup truck';
  else if (lengthM < 15) object = 'About as long as a city bus';
  else if (lengthM < 30) object = 'Longer than a tennis court is wide';
  else object = 'Longer than a basketball court';

  const measures = [formatCreatureLength(lengthM, true)];
  if (weightKg !== undefined && weightKg > 0) measures.push(formatCreatureWeight(weightKg, true));
  return `${object} (${measures.join(', ')})`;
}

const CLASS_TRAITS: Record<string, string> = {
  mammalia: 'Keen senses and a warm-blooded body keep it active in heat and cold alike.',
  aves: 'Feathers, hollow bones and sharp eyesight shape everything about how it lives.',
  reptilia: 'Scaly, watertight skin lets it thrive where other animals would dry out.',
  amphibia: 'It breathes partly through its moist skin and starts life in water.',
  actinopterygii: 'Gills pull oxygen from the water while a swim bladder keeps it effortlessly buoyant.',
  chondrichthyes: 'A skeleton of flexible cartilage and senses that detect the electric fields of prey.',
  insecta: 'Six legs and a tough exoskeleton packed into a tiny, efficient body.',
  arachnida: 'Eight legs and sensitive hairs that pick up the faintest vibration.',
  mollusca: 'A soft, muscular body, often guarded by a shell it builds itself.'
};

export const CLASS_NOUNS: Record<string, string> = {
  mammalia: 'mammal', aves: 'bird', reptilia: 'reptile', amphibia: 'amphibian',
  actinopterygii: 'ray-finned fish', chondrichthyes: 'cartilaginous fish', insecta: 'insect',
  arachnida: 'arachnid', mollusca: 'mollusk', scyphozoa: 'jellyfish', cephalopoda: 'cephalopod',
  gastropoda: 'sea slug or snail', dinosauria: 'dinosaur'
};

/** e.g. "Bengal Tiger: a living mammal and apex predator". */
function plainHeadline(creature: Creature, role: string | null): string {
  const noun = CLASS_NOUNS[(creature.taxonomy.class || '').toLowerCase()] || 'species';
  const status = creature.extinctionYear === null ? 'living' : 'extinct';
  return `${creature.commonName}: a ${status} ${noun}${role ? ` and ${role.toLowerCase()}` : ''}`;
}

/** Builds the plain-English dossier from curated data, Wikipedia, or field data. */
export function buildDossier(creature: Creature, wiki?: WikiSummary | null): SimplifiedDossier {
  const threat = getThreatProfile(creature);
  const danger = `${threat.label}: ${threat.reason}`;
  const curated = CURATED_SIMPLIFIED[creature.id];
  if (curated) {
    return { ...curated, danger, source: 'curated', sourceUrl: creature.wikiUrl, summary: creature.description };
  }

  const ownText = isBoilerplateText(creature.description) ? '' : creature.description;
  const text = wiki?.extract || ownText;
  const sentences = toSentences(text);
  const used = new Set<string>();

  // Headline: Wikipedia's tagline, else a trimmed opening sentence.
  let headline: string;
  if (wiki?.tagline) {
    headline = `${creature.commonName}: ${wiki.tagline.charAt(0).toLowerCase()}${wiki.tagline.slice(1)}`;
  } else if (sentences.length >= 3 && sentences[0].length <= 140) {
    headline = sentences[0];
    used.add(sentences[0]);
  } else {
    headline = plainHeadline(creature, threat.level >= 7 ? threat.label : null);
  }

  // The first sentence is usually a taxonomic definition; prefer later ones.
  const body = sentences.length > 2 ? sentences.slice(1) : sentences;
  const superpower =
    pickBest(body, ABILITY, used) ??
    (wiki ? body.find((s) => !used.has(s)) : undefined) ??
    CLASS_TRAITS[(creature.taxonomy.class || '').toLowerCase()] ??
    `Specially adapted to life in ${creature.habitat}.`;
  used.add(superpower);

  const family = creature.taxonomy.family;
  const familyKnown = !!family && family !== 'Unknown' && family !== creature.taxonomy.class && family !== 'Fauna';
  const order = creature.taxonomy.order;
  const orderPart = order && order !== 'Unknown' && order !== creature.taxonomy.genus ? `, part of the order ${order}` : '';
  const sites = creature.coordinates.length;
  const funFact =
    pickBest(sentences, FACT, used) ??
    sentences.find((s) => !used.has(s)) ??
    (familyKnown
      ? `It belongs to the ${family} family${orderPart}.`
      : sites > 0
      ? `Recorded at ${sites} site${sites === 1 ? '' : 's'} by citizen scientists, most recently near ${creature.coordinates[0].country}.`
      : `Its scientific name is ${creature.scientificName}.`);

  return {
    headline: cap(headline),
    superpower: cap(superpower),
    funFact: cap(funFact),
    sizeComparison: describeRealScale(creature.stats.lengthMeters, creature.stats.weightKg),
    danger,
    source: wiki ? 'wikipedia' : ownText ? 'record' : 'field',
    sourceUrl: wiki?.url || creature.wikiUrl,
    summary: wiki?.extract || ownText || null
  };
}

/** Synchronous dossier (no network); see buildDossier for the Wikipedia-enriched version. */
export function getSimplifiedDossier(creature: Creature): SimplifiedDossier {
  return buildDossier(creature, null);
}
