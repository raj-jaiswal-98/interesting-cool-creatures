/**
 * Threat assessment: estimates how dangerous a creature is *to people* from
 * taxonomy (genus / family / order / class), common-name cues, body size and
 * description keywords. Live observation feeds carry no danger data, so this
 * replaces the old "every mammal is 2/10" heuristic.
 */

export type ThreatKind =
  | 'harmless'
  | 'mild'
  | 'defensive'
  | 'venomous'
  | 'toxic'
  | 'disease-vector'
  | 'large-herbivore'
  | 'predator'
  | 'apex';

export interface ThreatInput {
  commonName: string;
  scientificName: string;
  taxonomy?: { class?: string | null; order?: string | null; family?: string | null; genus?: string | null };
  lengthMeters?: number;
  weightKg?: number;
  diet?: string;
  description?: string;
  extinct?: boolean;
}

export interface ThreatRule {
  level: number;
  kind: ThreatKind;
  reason: string;
  /** Typical adult size [length m, weight kg], used to replace placeholder stats. */
  size?: [number, number];
}

export interface ThreatProfile extends ThreatRule {
  label: string;
  color: string;
  /** True when a specific taxonomic / name rule matched (vs. a size/diet fallback). */
  matched: boolean;
}

type Matcher = {
  species?: string[];
  genus?: string[];
  family?: string[];
  order?: string[];
  /** Regex tested against the common name; `cls` optionally restricts the class. */
  name?: RegExp;
  cls?: string[];
} & ThreatRule;

const R = (m: Matcher) => m;

// Ordered most-specific first; the highest-level matching rule wins.
const RULES: Matcher[] = [
  // ── Big cats & other large carnivores ─────────────────────────────
  R({ species: ['panthera tigris'], level: 9, kind: 'apex', reason: 'The largest cat alive; a single swipe or bite can kill a person.', size: [2.9, 220] }),
  R({ species: ['panthera leo'], level: 9, kind: 'apex', reason: 'Hunts in prides and can bring down buffalo; deadly to people.', size: [2.5, 190] }),
  R({ species: ['panthera onca'], level: 8, kind: 'apex', reason: 'Strongest bite of any big cat, able to pierce skulls and turtle shells.', size: [1.9, 95] }),
  R({ species: ['panthera pardus'], level: 8, kind: 'apex', reason: 'Powerful stalker that hauls prey up trees; attacks on people do occur.', size: [1.6, 60] }),
  R({ species: ['panthera uncia'], level: 5, kind: 'predator', reason: 'Powerful mountain hunter, but almost never attacks people.', size: [1.2, 45] }),
  R({ genus: ['panthera'], level: 8, kind: 'apex', reason: 'A big cat built to kill large prey.', size: [2.0, 120] }),
  R({ species: ['puma concolor'], level: 7, kind: 'predator', reason: 'Ambush hunter capable of killing deer; rare attacks on people.', size: [2.0, 65] }),
  R({ genus: ['acinonyx'], level: 5, kind: 'predator', reason: 'Fast hunter of antelope, but shy and rarely a danger to people.', size: [1.9, 50] }),
  R({ genus: ['lynx', 'caracal', 'leptailurus'], level: 3, kind: 'mild', reason: 'Medium wild cat; avoids people but scratches and bites if cornered.', size: [1.0, 15] }),
  R({ family: ['felidae'], level: 2, kind: 'mild', reason: 'Small wild cat; harmless unless handled.', size: [0.6, 4] }),

  R({ species: ['ursus maritimus'], level: 9, kind: 'apex', reason: 'The largest land carnivore; it may actively hunt people.', size: [2.4, 450] }),
  R({ species: ['ursus arctos'], level: 8, kind: 'predator', reason: 'Massive and fast; defends cubs and food with deadly force.', size: [2.2, 300] }),
  R({ genus: ['ursus', 'melursus', 'tremarctos', 'helarctos'], level: 7, kind: 'predator', reason: 'Bears can maul people when surprised or defending cubs.', size: [1.7, 150] }),
  R({ family: ['ursidae'], level: 6, kind: 'predator', reason: 'A bear: strong, with powerful claws.', size: [1.6, 120] }),
  R({ genus: ['ailuropoda'], level: 4, kind: 'defensive', reason: 'Looks cuddly but has a bite strong enough to crush bamboo.', size: [1.6, 110] }),
  R({ name: /\bbear\b/i, cls: ['mammalia'], level: 7, kind: 'predator', reason: 'Bears can maul people when surprised or defending cubs.', size: [1.7, 150] }),

  R({ family: ['hyaenidae'], level: 7, kind: 'predator', reason: 'Bone-crushing jaws; hunts in clans and can attack people.', size: [1.4, 55] }),
  R({ species: ['canis lupus'], level: 6, kind: 'predator', reason: 'Pack hunter of large prey; attacks on people are rare but real.', size: [1.4, 40] }),
  R({ genus: ['lycaon', 'cuon'], level: 5, kind: 'predator', reason: 'Cooperative pack hunter with a very high kill rate.', size: [1.0, 25] }),
  R({ family: ['canidae'], level: 3, kind: 'mild', reason: 'Wild dog or fox; avoids people, may bite if cornered.', size: [0.8, 8] }),
  R({ genus: ['gulo'], level: 5, kind: 'defensive', reason: 'Small but ferocious; drives bears and wolves off kills.', size: [0.9, 15] }),
  R({ species: ['orcinus orca'], level: 6, kind: 'apex', reason: 'Apex ocean predator that hunts sharks and whales; wild attacks on people are almost unknown.', size: [7, 4000] }),

  // ── Large herbivores (dangerous by size & temper) ──────────────────
  R({ family: ['hippopotamidae'], level: 9, kind: 'large-herbivore', reason: 'Extremely territorial; one of Africa’s deadliest animals to people.', size: [4, 1500] }),
  R({ family: ['elephantidae'], level: 8, kind: 'large-herbivore', reason: 'Gentle giant usually, but a charging elephant is lethal.', size: [6, 5000] }),
  R({ genus: ['syncerus'], level: 8, kind: 'large-herbivore', reason: 'Cape buffalo are notorious for charging and goring.', size: [3, 700] }),
  R({ family: ['rhinocerotidae'], level: 7, kind: 'large-herbivore', reason: 'Poor eyesight and a short temper; charges with a horn.', size: [3.5, 2000] }),
  R({ genus: ['bison', 'bos', 'bubalus'], level: 6, kind: 'large-herbivore', reason: 'Huge and fast; gores people who get too close.', size: [3, 800] }),
  R({ genus: ['alces'], level: 6, kind: 'large-herbivore', reason: 'Moose injure more people than bears in some regions.', size: [3, 500] }),
  R({ genus: ['giraffa'], level: 5, kind: 'large-herbivore', reason: 'Kicks hard enough to kill a lion.', size: [5, 1200] }),
  R({ genus: ['sus', 'phacochoerus', 'potamochoerus'], level: 4, kind: 'defensive', reason: 'Sharp tusks and a willingness to charge.', size: [1.5, 90] }),
  R({ genus: ['equus'], level: 3, kind: 'defensive', reason: 'Can bite and kick when threatened.', size: [2.3, 350] }),
  R({ family: ['cervidae'], level: 2, kind: 'mild', reason: 'Shy browser; males can be aggressive in the rut.', size: [1.7, 90] }),
  R({ family: ['macropodidae'], level: 3, kind: 'defensive', reason: 'Powerful kicks with clawed feet.', size: [1.5, 50] }),

  // ── Primates ────────────────────────────────────────────────────────
  R({ species: ['pan troglodytes'], level: 6, kind: 'defensive', reason: 'Several times stronger than a human; can be violent.', size: [1.2, 50] }),
  R({ genus: ['gorilla'], level: 5, kind: 'defensive', reason: 'Peaceful unless threatened, then immensely strong.', size: [1.7, 160] }),
  R({ genus: ['papio', 'mandrillus'], level: 4, kind: 'defensive', reason: 'Long canine teeth; can be aggressive around food.', size: [0.8, 25] }),
  R({ genus: ['macaca'], level: 3, kind: 'mild', reason: 'Bold around people and may bite.', size: [0.6, 8] }),

  // ── Reptiles ────────────────────────────────────────────────────────
  R({ species: ['crocodylus porosus', 'crocodylus niloticus'], level: 10, kind: 'apex', reason: 'Ambush predator responsible for hundreds of human deaths a year.', size: [5, 500] }),
  R({ family: ['crocodylidae'], level: 9, kind: 'apex', reason: 'A crocodile: an ambush predator with a crushing bite.', size: [3.5, 300] }),
  R({ family: ['gavialidae'], level: 5, kind: 'predator', reason: 'Fish specialist with a thin snout; rarely harms people.', size: [4.5, 160] }),
  R({ family: ['alligatoridae'], level: 7, kind: 'predator', reason: 'A powerful ambush predator; attacks on people are uncommon.', size: [3.5, 250] }),
  R({ name: /\b(crocodile|alligator|caiman)\b/i, level: 8, kind: 'apex', reason: 'A crocodilian: an ambush predator with a crushing bite.', size: [3.5, 300] }),
  R({ species: ['varanus komodoensis'], level: 8, kind: 'venomous', reason: 'Largest lizard alive, with a venomous bite that stops prey bleeding-clotting.', size: [2.6, 80] }),
  R({ genus: ['varanus'], level: 3, kind: 'defensive', reason: 'Monitor lizard with sharp teeth and a whipping tail.', size: [1.3, 8] }),
  R({ genus: ['heloderma'], level: 5, kind: 'venomous', reason: 'One of few venomous lizards; painful bite.', size: [0.5, 2] }),
  R({ family: ['elapidae'], level: 8, kind: 'venomous', reason: 'Cobra family: neurotoxic venom that can kill a person.', size: [1.5, 3] }),
  R({ family: ['viperidae'], level: 8, kind: 'venomous', reason: 'Viper: long fangs inject tissue-destroying venom.', size: [1.0, 2] }),
  R({ name: /\b(cobra|mamba|krait|taipan|viper|rattlesnake|adder|copperhead|cottonmouth|bushmaster|fer-de-lance|sea snake|coral snake|boomslang)\b/i, level: 8, kind: 'venomous', reason: 'A venomous snake whose bite can kill a person.', size: [1.2, 2] }),
  R({ species: ['malayopython reticulatus', 'python reticulatus', 'eunectes murinus', 'python bivittatus', 'python sebae'], level: 6, kind: 'predator', reason: 'Giant constrictor large enough to overpower a person.', size: [5.5, 90] }),
  R({ family: ['pythonidae', 'boidae'], level: 3, kind: 'mild', reason: 'Non-venomous constrictor; bites if handled roughly.', size: [2, 10] }),
  R({ family: ['colubridae'], level: 2, kind: 'mild', reason: 'Most colubrid snakes are harmless to people.', size: [1, 0.5] }),
  R({ order: ['testudines'], level: 2, kind: 'mild', reason: 'Shelled and slow; snapping species can nip fingers.', size: [0.4, 5] }),

  // ── Fish & sharks ───────────────────────────────────────────────────
  R({ genus: ['carcharodon'], level: 9, kind: 'apex', reason: 'Responsible for more recorded unprovoked attacks than any other shark.', size: [5, 1100] }),
  R({ species: ['galeocerdo cuvier', 'carcharhinus leucas'], level: 9, kind: 'apex', reason: 'Large shark known to bite people.', size: [3.5, 400] }),
  R({ order: ['carcharhiniformes', 'lamniformes'], level: 6, kind: 'predator', reason: 'A predatory shark; most avoid people.', size: [2.5, 150] }),
  R({ name: /\bshark\b/i, level: 5, kind: 'predator', reason: 'A shark; most species pose little risk to people.', size: [2, 100] }),
  R({ genus: ['synanceia'], level: 8, kind: 'venomous', reason: 'The world’s most venomous fish; stepping on one can be fatal.', size: [0.35, 2] }),
  R({ genus: ['pterois'], level: 5, kind: 'venomous', reason: 'Venomous spines cause intense pain.', size: [0.35, 1] }),
  R({ order: ['myliobatiformes'], level: 5, kind: 'venomous', reason: 'Stingray: a barbed, venomous tail spine.', size: [1.5, 40] }),
  R({ family: ['tetraodontidae', 'diodontidae'], level: 4, kind: 'toxic', reason: 'Contains tetrodotoxin; deadly if eaten.', size: [0.3, 1] }),
  R({ genus: ['pygocentrus', 'serrasalmus'], level: 4, kind: 'predator', reason: 'Razor teeth, though attacks on people are rare.', size: [0.3, 1.5] }),

  // ── Amphibians ──────────────────────────────────────────────────────
  R({ species: ['phyllobates terribilis'], level: 8, kind: 'toxic', reason: 'Its skin carries enough poison to kill several people.', size: [0.05, 0.03] }),
  R({ family: ['dendrobatidae'], level: 5, kind: 'toxic', reason: 'Bright colors warn of toxic skin secretions.', size: [0.04, 0.02] }),
  R({ species: ['rhinella marina'], level: 4, kind: 'toxic', reason: 'Toxic glands can poison pets and people who handle it.', size: [0.15, 1] }),
  R({ family: ['bufonidae'], level: 2, kind: 'toxic', reason: 'Mildly toxic skin; wash hands after handling.', size: [0.1, 0.1] }),

  // ── Invertebrates ──────────────────────────────────────────────────
  R({ genus: ['chironex', 'carukia', 'malo'], level: 9, kind: 'venomous', reason: 'Box jellyfish venom can stop a heart within minutes.', size: [0.3, 2] }),
  R({ genus: ['physalia'], level: 6, kind: 'venomous', reason: 'Painful, sometimes dangerous stings even when washed ashore.', size: [0.3, 0.5] }),
  R({ genus: ['hapalochlaena'], level: 9, kind: 'venomous', reason: 'Tiny, but its bite carries a fatal neurotoxin with no antidote.', size: [0.15, 0.1] }),
  R({ genus: ['conus'], level: 8, kind: 'venomous', reason: 'Cone snails fire venomous harpoons; some stings are fatal.', size: [0.12, 0.2] }),
  R({ genus: ['atrax', 'hadronyche'], level: 8, kind: 'venomous', reason: 'Funnel-web spider venom can kill a person without antivenom.', size: [0.04, 0.01] }),
  R({ genus: ['phoneutria'], level: 7, kind: 'venomous', reason: 'Wandering spider with potent neurotoxic venom.', size: [0.05, 0.01] }),
  R({ genus: ['latrodectus', 'loxosceles'], level: 6, kind: 'venomous', reason: 'Bite can cause serious illness; seek medical care.', size: [0.015, 0.001] }),
  R({ name: /\bwidow\b/i, cls: ['arachnida'], level: 6, kind: 'venomous', reason: 'Widow spider bite can cause serious illness.', size: [0.015, 0.001] }),
  R({ family: ['buthidae'], level: 7, kind: 'venomous', reason: 'Bark-scorpion family; some stings are dangerous to children.', size: [0.07, 0.003] }),
  R({ name: /\bscorpion\b/i, cls: ['arachnida'], level: 4, kind: 'venomous', reason: 'A painful sting; most species are not deadly.', size: [0.08, 0.005] }),
  R({ name: /\b(spider|tarantula)\b/i, cls: ['arachnida'], level: 2, kind: 'mild', reason: 'Like most spiders, its venom is harmless to people.', size: [0.02, 0.002] }),
  R({ family: ['culicidae'], level: 7, kind: 'disease-vector', reason: 'Mosquitoes spread malaria and dengue, making them the deadliest animals on Earth.', size: [0.006, 0.000002] }),
  R({ name: /\bmosquito\b/i, level: 7, kind: 'disease-vector', reason: 'Mosquitoes spread malaria and dengue, making them the deadliest animals on Earth.', size: [0.006, 0.000002] }),
  R({ species: ['vespa mandarinia'], level: 6, kind: 'venomous', reason: 'The giant hornet’s sting is extremely painful and can be dangerous.', size: [0.045, 0.004] }),
  R({ name: /\b(hornet|wasp|yellowjacket|bee|bumblebee)\b/i, cls: ['insecta'], level: 3, kind: 'venomous', reason: 'Can sting; dangerous only to people with allergies.', size: [0.015, 0.0002] }),
  R({ genus: ['solenopsis'], level: 3, kind: 'venomous', reason: 'Fire ants swarm and sting painfully.', size: [0.005, 0.000003] }),

  // ── Birds & monotremes ─────────────────────────────────────────────
  R({ genus: ['casuarius'], level: 7, kind: 'defensive', reason: 'Dagger-like claws; the cassowary has killed people.', size: [1.7, 55] }),
  R({ genus: ['struthio'], level: 5, kind: 'defensive', reason: 'A kick from an ostrich can disembowel a predator.', size: [2.5, 120] }),
  R({ genus: ['harpia', 'aquila', 'haliaeetus'], level: 3, kind: 'predator', reason: 'Powerful raptor; harmless to adults but formidable to prey.', size: [0.9, 6] }),
  R({ genus: ['ornithorhynchus'], level: 3, kind: 'venomous', reason: 'Males carry a venomous ankle spur.', size: [0.5, 1.7] })
];

const has = (list: string[] | undefined, value: string) => !!list && !!value && list.includes(value);

/** Finds the highest-level rule matching the creature's taxonomy or name. */
export function matchThreatRule(input: ThreatInput): ThreatRule | null {
  const sci = input.scientificName.toLowerCase().trim();
  const species = sci.split(/\s+/).slice(0, 2).join(' ');
  const genus = (input.taxonomy?.genus || sci.split(/\s+/)[0] || '').toLowerCase();
  const family = (input.taxonomy?.family || '').toLowerCase();
  const order = (input.taxonomy?.order || '').toLowerCase();
  const cls = (input.taxonomy?.class || '').toLowerCase();

  let best: ThreatRule | null = null;
  for (const rule of RULES) {
    const hit =
      has(rule.species, species) ||
      has(rule.genus, genus) ||
      has(rule.family, family) ||
      has(rule.order, order) ||
      (!!rule.name && rule.name.test(input.commonName) && (!rule.cls || rule.cls.includes(cls)));
    if (hit && (!best || rule.level > best.level)) {
      best = { level: rule.level, kind: rule.kind, reason: rule.reason, size: rule.size };
    }
  }
  return best;
}

/** Fallback when no taxon rule matches: size, diet and description cues. */
function heuristicThreat(input: ThreatInput): ThreatRule {
  const w = input.weightKg ?? 1;
  const diet = (input.diet || '').toLowerCase();
  const text = `${input.description || ''}`.toLowerCase();
  const carnivore = /carniv|predat|pisciv/.test(diet);

  if (/\b(man-eater|fatal attacks?|kills? (people|humans)|attacks? on humans)\b/.test(text)) {
    return { level: 8, kind: 'predator', reason: 'Known to attack people.' };
  }
  if (/\bvenom(ous)?\b/.test(text)) {
    return { level: 5, kind: 'venomous', reason: 'Venomous; handle with care.' };
  }
  if (/\b(poison(ous)?|toxic)\b/.test(text)) {
    return { level: 4, kind: 'toxic', reason: 'Toxic to touch or eat.' };
  }
  if (carnivore && w >= 100) return { level: 7, kind: 'predator', reason: 'A large carnivore capable of overpowering big prey.' };
  if (carnivore && w >= 25) return { level: 5, kind: 'predator', reason: 'A sizeable hunter; keep your distance.' };
  if (w >= 500) return { level: 5, kind: 'large-herbivore', reason: 'Dangerous purely through size and strength.' };
  if (w >= 80) return { level: 3, kind: 'defensive', reason: 'Big enough to injure people if provoked.' };
  if (carnivore) return { level: 2, kind: 'mild', reason: 'Hunts small prey; no danger to people.' };
  return { level: 1, kind: 'harmless', reason: 'Poses no real danger to people.' };
}

const KIND_LABELS: Record<ThreatKind, string> = {
  harmless: 'Harmless',
  mild: 'Low Risk',
  defensive: 'Defensive',
  venomous: 'Venomous',
  toxic: 'Toxic',
  'disease-vector': 'Disease Carrier',
  'large-herbivore': 'Powerful Giant',
  predator: 'Predator',
  apex: 'Apex Predator'
};

export function threatColor(level: number): string {
  if (level >= 8) return 'var(--danger)';
  if (level >= 6) return 'var(--era-cenozoic)';
  if (level >= 4) return 'var(--warn)';
  if (level >= 2) return 'var(--info)';
  return 'var(--success)';
}

function kindFromLevel(level: number): ThreatKind {
  if (level >= 9) return 'apex';
  if (level >= 7) return 'predator';
  if (level >= 5) return 'defensive';
  if (level >= 3) return 'mild';
  return 'harmless';
}

/** Raw assessment from taxonomy + heuristics (ignores any stored dangerLevel). */
export function assessThreat(input: ThreatInput): ThreatProfile {
  const rule = matchThreatRule(input);
  const base = rule ?? heuristicThreat(input);
  return { ...base, label: KIND_LABELS[base.kind], color: threatColor(base.level), matched: !!rule };
}

const profileCache = new Map<string, ThreatProfile>();

/**
 * Display profile for a creature. The stored dangerLevel wins (curated catalog
 * values are hand-tuned); the matched rule supplies the kind and the reason.
 */
export function getThreatProfile(creature: {
  id: string;
  commonName: string;
  scientificName: string;
  extinctionYear: number | null;
  diet: string;
  description: string;
  stats: { dangerLevel: number; lengthMeters: number; weightKg: number };
  taxonomy: ThreatInput['taxonomy'];
}): ThreatProfile {
  const key = `${creature.id}:${creature.stats.dangerLevel}`;
  const cached = profileCache.get(key);
  if (cached) return cached;

  const extinct = creature.extinctionYear !== null;
  const assessed = assessThreat({
    commonName: creature.commonName,
    scientificName: creature.scientificName,
    taxonomy: creature.taxonomy,
    lengthMeters: creature.stats.lengthMeters,
    weightKg: creature.stats.weightKg,
    diet: creature.diet,
    description: creature.description,
    extinct
  });

  // Live observation records only ever carried placeholder levels, so a matched
  // taxon rule overrides them; curated values are kept.
  const isLiveRecord = creature.id.startsWith('inat-');
  const level = (isLiveRecord && assessed.matched ? assessed.level : creature.stats.dangerLevel) || assessed.level;
  // Trust the rule's kind only if it agrees roughly with the stored level.
  const kind = assessed.matched && Math.abs(assessed.level - level) <= 3 ? assessed.kind : kindFromLevel(level);
  const reason =
    assessed.matched && kind === assessed.kind
      ? assessed.reason
      : extinct && level >= 7
      ? 'A formidable prehistoric hunter.'
      : heuristicThreat({ ...creature, weightKg: creature.stats.weightKg }).reason;

  const profile: ThreatProfile = {
    level,
    kind,
    reason,
    size: assessed.size,
    label: KIND_LABELS[kind],
    color: threatColor(level),
    matched: assessed.matched
  };
  profileCache.set(key, profile);
  return profile;
}
