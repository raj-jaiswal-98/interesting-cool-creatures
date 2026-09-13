/**
 * Deterministic, biologically plausible generative fallback used when
 * on-device Chrome AI (Gemini Nano) is unsupported or offline.
 */

import type {
  SpeculativeEvolutionResult,
  CreatureClashResult,
  StressorKey
} from '../../types/ai';
import type { Creature } from '../../types/creature';

export class ProceduralSpeculationEngine {
  stressors: Record<StressorKey, string>;

  constructor() {
    this.stressors = {
      warming: 'extreme thermal rise (+4°C global oceanic warming)',
      hypoxia: 'severe atmospheric and benthic oxygen depletion',
      radiation: 'elevated solar UV radiation due to atmospheric stripping',
      urban: 'encroachment of synthetic concrete and microplastic ecosystems'
    };
  }

  generateSpeculativeEvolution(
    creatureName: string,
    habitat: string,
    stressorKey: StressorKey = 'warming'
  ): SpeculativeEvolutionResult {
    const stressDesc = this.stressors[stressorKey] || this.stressors.warming;

    const adaptations = [
      {
        title: 'Thermal Dissipation & Silica Cuticle',
        description: `In response to ${stressDesc}, ${creatureName} develops microscopic hexagonal silica pores across its epidermis, radiating excess metabolic heat through passive infrared emissions.`
      },
      {
        title: 'Hyper-Affinity Metalloprotein Blood',
        description: `Its circulatory physiology evolves dual-core copper-iron respiratory pigments, achieving up to 340% higher oxygen binding capacity under harsh environmental stress.`
      },
      {
        title: 'Symbiotic Bioluminescent Chemosensors',
        description: `Forms a tight mutualism with deep-strata extremophile bacteria, allowing ${creatureName} to sense electromagnetic micro-fluctuations and navigate altered nutrient corridors.`
      }
    ];

    const survivalRating = 78 + Math.floor((creatureName.length * 7) % 19);

    const narrative = `Fast forward 10,000 years: Subjected to ${stressDesc} within the ${habitat}, ${creatureName} has diverged into an extraordinarily resilient specialized morph. The organism exhibits reinforced cellular repair proteins (chaperonins) capable of halting thermal denaturation, transforming this creature into the dominant survivor of its altered planetary niche.`;

    return {
      futureScientificName: `Neo-${creatureName.replace(/\s+/g, '')} speculatis`,
      narrative,
      stressorApplied: stressDesc,
      adaptations,
      survivalRating,
      isProcedural: true
    };
  }

  translateTaxonomy(academicText?: string | null, creatureName: string = 'This creature'): string {
    if (!academicText) return 'A fascinating organism with evolutionary adaptations unique across planetary history.';

    return `In simple terms: ${creatureName} is an evolutionary marvel! Instead of following standard biological rules, it has developed unique physiological superpowers to dominate its niche, turning extreme survival into pure art.`;
  }

  simulateCreatureClash(creatureA: Creature, creatureB: Creature): CreatureClashResult {
    const weightA = creatureA.stats?.weightKg || 1;
    const weightB = creatureB.stats?.weightKg || 1;
    const dangerA = creatureA.stats?.dangerLevel || 5;
    const dangerB = creatureB.stats?.dangerLevel || 5;

    // Power score computation factoring mass and danger
    const powerScoreA = Math.log10(Math.max(0.001, weightA) * 1000) * 12 + (dangerA * 9);
    const powerScoreB = Math.log10(Math.max(0.001, weightB) * 1000) * 12 + (dangerB * 9);

    const total = powerScoreA + powerScoreB;
    const probA = Math.min(95, Math.max(5, Math.round((powerScoreA / total) * 100)));
    const probB = 100 - probA;

    const winner = probA >= probB ? creatureA : creatureB;
    const loser = probA >= probB ? creatureB : creatureA;
    const winnerProb = Math.max(probA, probB);

    const rounds = [
      `Round 1 — Territorial Engagement: ${creatureA.commonName} establishes position within the arena while ${creatureB.commonName} leverages its unique ${creatureB.habitatType} adaptations to assess distance.`,
      `Round 2 — Tactical Escalation: ${winner.commonName} exploits its superior physiological attributes (rated Danger Level ${winner.stats?.dangerLevel || 7}/10), bypassing ${loser.commonName}'s defensive barriers.`,
      `Round 3 — Climax: ${winner.commonName} delivers a decisive maneuver, securing an uncontested biological victory with calculated ${winnerProb}% tactical probability.`
    ];

    const conclusion = `${winner.commonName} emerges victorious over ${loser.commonName}. The battle demonstrates how extreme evolutionary specialization in ${winner.habitat} grants overwhelming superiority.`;

    return {
      winner: winner.commonName,
      winnerId: winner.id,
      winProbability: winnerProb,
      combatLog: rounds,
      conclusion,
      isProcedural: true
    };
  }
}

export const proceduralAI = new ProceduralSpeculationEngine();
