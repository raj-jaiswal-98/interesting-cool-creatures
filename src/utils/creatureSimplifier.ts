import type { Creature } from '../types/creature';

export interface SimplifiedDossier {
  headline: string;
  superpower: string;
  funFact: string;
  sizeComparison: string;
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

/**
 * Returns a simplified, digestible ELI5 dossier for any creature.
 */
export function getSimplifiedDossier(creature: Creature): SimplifiedDossier {
  // If curated match exists
  if (CURATED_SIMPLIFIED[creature.id]) {
    return CURATED_SIMPLIFIED[creature.id];
  }

  // Algorithmic synthesis for dynamic creatures
  const sentences = creature.description
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  const headline = `${creature.commonName} (${creature.era} Era)`;
  const superpower = sentences[0] || `An extraordinary species adapted to ${creature.habitat}.`;
  const funFact = sentences[1] || `Classified as ${creature.taxonomy.class || 'Fauna'} in the family ${creature.taxonomy.family || creature.taxonomy.order}.`;
  
  let sizeComparison = `${creature.stats.lengthMeters} m`;
  if (creature.stats.lengthMeters < 0.01) {
    sizeComparison = 'Microscopic organism';
  } else if (creature.stats.lengthMeters < 0.3) {
    sizeComparison = 'Pocket / Hand-sized';
  } else if (creature.stats.lengthMeters < 1.5) {
    sizeComparison = 'Small to medium animal';
  } else if (creature.stats.lengthMeters < 4.0) {
    sizeComparison = 'Large vehicle-sized';
  } else {
    sizeComparison = 'Colossal megafauna';
  }

  return {
    headline,
    superpower,
    funFact,
    sizeComparison
  };
}
